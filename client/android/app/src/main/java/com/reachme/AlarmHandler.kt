package com.reachme

import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import java.io.File

object AlarmHandler {
    private var mediaPlayer: MediaPlayer? = null

    fun play(context: Context, tone: String, fileId: String?) {
        stop(context)

        try {
            // Post alarm notification to bypass DND
            CoreService.postAlarmNotification(context, "ReachMe Alarm", "Critical alert received")

            // Set alarm volume to max
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVol, 0)

            // Create media player with ALARM audio usage (bypasses DND)
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()

            mediaPlayer = if (tone == "file" && fileId != null) {
                // Play custom file
                val filePath = DownloadHandler.getLocalPath(context, fileId)
                if (filePath != null && File(filePath).exists()) {
                    MediaPlayer().apply {
                        setDataSource(filePath)
                        setAudioAttributes(audioAttributes)
                        isLooping = true
                        prepare()
                    }
                } else {
                    createDefaultPlayer(context, audioAttributes)
                }
            } else {
                createDefaultPlayer(context, audioAttributes)
            }

            mediaPlayer?.start()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun createDefaultPlayer(context: Context, audioAttributes: AudioAttributes): MediaPlayer {
        // Use system default alarm sound
        return MediaPlayer.create(context, android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI).apply {
            setAudioAttributes(audioAttributes)
            isLooping = true
        }
    }

    fun stop(context: Context) {
        mediaPlayer?.apply {
            if (isPlaying) {
                stop()
            }
            release()
        }
        mediaPlayer = null

        // Cancel alarm notification
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(CoreService.ALARM_NOTIFICATION_ID)
    }
}
