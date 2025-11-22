package com.sel2in.reachme

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import android.util.Log

class AlarmForegroundService : Service() {
    private var mediaPlayer: MediaPlayer? = null
    private val TAG = "AlarmForegroundService"
    private var savedVolume = -1

    companion object {
        const val ACTION_START = "com.sel2in.reachme.action.START_ALARM"
        const val ACTION_STOP = "com.sel2in.reachme.action.STOP_ALARM"
        const val EXTRA_MESSAGE = "ALARM_MESSAGE"
        const val NOTIF_CHANNEL = "reachme_alarms"
        const val NOTIF_ID = 0xfeed
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        if (action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }

        val message = intent?.getStringExtra(EXTRA_MESSAGE) ?: "ReachMe Alarm"

        val notification = buildNotification(message)
        startForeground(NOTIF_ID, notification)

        // Start playback sequence: play first raw 4 times then louder raw looping
        startPlaybackSequence()

        return START_STICKY
    }

    private fun buildNotification(message: String): Notification {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, NOTIF_CHANNEL)
        } else {
            Notification.Builder(this)
        }
        builder.setContentTitle("ReachMe Alarm")
            .setContentText(message)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
        // Add a Stop action that sends ACTION_STOP to this service
        try {
            val stopIntent = Intent(this, AlarmForegroundService::class.java).apply { action = ACTION_STOP }
            val pendingFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val stopPi = PendingIntent.getService(this, 0, stopIntent, pendingFlags)
            builder.addAction(android.R.drawable.ic_media_pause, "Stop", stopPi)
        } catch (e: Exception) {
            Log.w(TAG, "Could not add Stop action: ${e.message}")
        }

        return builder.build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val chan = NotificationChannel(NOTIF_CHANNEL, "ReachMe Alarms", NotificationManager.IMPORTANCE_HIGH)
            nm.createNotificationChannel(chan)
        }
    }

    private fun startPlaybackSequence() {
        Thread {
            try {
                val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
                val stream = AudioManager.STREAM_ALARM
                // save current volume
                try {
                    savedVolume = am.getStreamVolume(stream)
                } catch (_: Exception) {
                }

                // Set to max volume for alarm if possible
                try {
                    val max = am.getStreamMaxVolume(stream)
                    am.setStreamVolume(stream, max, 0)
                } catch (_: Exception) {
                }

                // First play reachme_alarm 4 times
                val firstRes = resources.getIdentifier("reachme_alarm", "raw", packageName)
                val louderRes = resources.getIdentifier("reachme_alarm_louder", "raw", packageName)

                fun playRes(resId: Int, loop: Boolean, durationMs: Long = 0L) {
                    try {
                        mediaPlayer?.stop(); mediaPlayer?.release(); mediaPlayer = null
                        mediaPlayer = MediaPlayer.create(this, resId)
                        mediaPlayer?.isLooping = loop
                        mediaPlayer?.start()
                        if (!loop && durationMs > 0) {
                            SystemClock.sleep(durationMs)
                        } else if (!loop) {
                            // wait until completion
                            while (mediaPlayer != null && mediaPlayer!!.isPlaying) {
                                SystemClock.sleep(100)
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Playback error: ${e.message}")
                    }
                }

                if (firstRes != 0) {
                    repeat(4) {
                        if (Thread.interrupted()) return@Thread
                        playRes(firstRes, false)
                    }
                }

                if (louderRes != 0) {
                    // loop louder until 2 minutes total
                    mediaPlayer?.stop(); mediaPlayer?.release(); mediaPlayer = null
                    mediaPlayer = MediaPlayer.create(this, louderRes)
                    mediaPlayer?.isLooping = true
                    mediaPlayer?.start()
                    // safety: stop after 2 minutes
                    SystemClock.sleep(120_000)
                }

            } catch (e: Exception) {
                Log.e(TAG, "Playback thread error: ${e.message}")
            } finally {
                try { mediaPlayer?.stop(); mediaPlayer?.release(); mediaPlayer = null } catch (_: Exception) {}
                // restore volume
                try {
                    if (savedVolume >= 0) {
                        val am2 = getSystemService(Context.AUDIO_SERVICE) as AudioManager
                        am2.setStreamVolume(AudioManager.STREAM_ALARM, savedVolume, 0)
                    }
                } catch (_: Exception) {}
                stopSelf()
            }
        }.start()
    }

    override fun onDestroy() {
        try { mediaPlayer?.stop(); mediaPlayer?.release(); mediaPlayer = null } catch (_: Exception) {}
        super.onDestroy()
    }
}
