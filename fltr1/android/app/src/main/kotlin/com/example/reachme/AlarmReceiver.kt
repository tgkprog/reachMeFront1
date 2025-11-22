package com.sel2in.reachme

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast
import android.os.Build

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val message = intent.getStringExtra("ALARM_MESSAGE") ?: "ReachMe Alarm"
        Log.d("AlarmReceiver", message)
        Toast.makeText(context, message, Toast.LENGTH_LONG).show()

        // Start the foreground service to play the alarm reliably
        try {
            val svcIntent = Intent(context, AlarmForegroundService::class.java)
            svcIntent.action = AlarmForegroundService.ACTION_START
            svcIntent.putExtra(AlarmForegroundService.EXTRA_MESSAGE, message)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(svcIntent)
            } else {
                context.startService(svcIntent)
            }
        } catch (e: Exception) {
            Log.e("AlarmReceiver", "Failed to start foreground service: ${e.message}")
        }
    }
}
