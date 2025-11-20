package com.reachme

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class CoreService : Service() {

    companion object {
        private const val CHANNEL_ID = "reachme_foreground"
        private const val ALARM_CHANNEL_ID = "reachme_alarm"
        private const val NOTIFICATION_ID = 1
        private const val ALARM_NOTIFICATION_ID = 2

        fun postAlarmNotification(context: Context, title: String, message: String) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Ensure channel exists
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val alarmChannel = NotificationChannel(
                    ALARM_CHANNEL_ID,
                    "ReachMe Alarms",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Critical alarms that bypass Do Not Disturb"
                    setBypassDnd(true)
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 1000, 500, 1000)
                }
                notificationManager.createNotificationChannel(alarmChannel)
            }

            val notificationIntent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context, 0, notificationIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

            val notification = NotificationCompat.Builder(context, ALARM_CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(message)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .build()

            notificationManager.notify(ALARM_NOTIFICATION_ID, notification)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification)
        
        // Keep service alive for poll/WebSocket connection
        // This would connect to FCM or WebSocket here
        
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Foreground service channel
            val channel = NotificationChannel(
                CHANNEL_ID,
                "ReachMe Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps ReachMe running in background"
                setShowBadge(false)
            }

            // Alarm channel for bypassing DND
            val alarmChannel = NotificationChannel(
                ALARM_CHANNEL_ID,
                "ReachMe Alarms",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Critical alarms that bypass Do Not Disturb"
                setBypassDnd(true)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 1000, 500, 1000)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
            notificationManager.createNotificationChannel(alarmChannel)
        }
    }

    private fun buildNotification(): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ReachMe")
            .setContentText("Service is running")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    companion object {
        fun postAlarmNotification(context: Context, title: String, message: String) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Ensure channel exists
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val alarmChannel = NotificationChannel(
                    ALARM_CHANNEL_ID,
                    "ReachMe Alarms",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Critical alarms that bypass Do Not Disturb"
                    setBypassDnd(true)
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 1000, 500, 1000)
                }
                notificationManager.createNotificationChannel(alarmChannel)
            }

            val notificationIntent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context, 0, notificationIntent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

            val notification = NotificationCompat.Builder(context, ALARM_CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(message)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .build()

            notificationManager.notify(ALARM_NOTIFICATION_ID, notification)
        }
    }
}
