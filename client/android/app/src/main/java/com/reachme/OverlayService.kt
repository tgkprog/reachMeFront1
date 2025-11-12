package com.reachme

import android.content.Context
import android.graphics.PixelFormat
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.provider.Settings

object OverlayService {
    private var overlayView: View? = null
    private var windowManager: WindowManager? = null

    fun show(context: Context, title: String, message: String, tone: String, fileId: String?) {
        if (!Settings.canDrawOverlays(context)) {
            // Fallback to Activity-based overlay
            showActivityOverlay(context, title, message)
            return
        }

        hide(context)

        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val inflater = LayoutInflater.from(context)

        // Create simple overlay view
        overlayView = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(0xCC000000.toInt())
            setPadding(20, 20, 20, 20)

            // Title
            addView(TextView(context).apply {
                text = title
                textSize = 18f
                setTextColor(0xFFFFFFFF.toInt())
            })

            // Message
            addView(TextView(context).apply {
                text = message
                textSize = 14f
                setTextColor(0xFFFFFFFF.toInt())
            })

            // Buttons
            val buttonLayout = LinearLayout(context).apply {
                orientation = LinearLayout.HORIZONTAL
            }

            // OK button
            buttonLayout.addView(Button(context).apply {
                text = "OK"
                setBackgroundColor(0xFF00FF00.toInt())
                setOnClickListener {
                    AlarmHandler.stop(context)
                    hide(context)
                }
            })

            // Stop button
            buttonLayout.addView(Button(context).apply {
                text = "X"
                setOnClickListener {
                    AlarmHandler.stop(context)
                    // Keep sticky notification
                }
            })

            // Snooze button
            buttonLayout.addView(Button(context).apply {
                text = "Snooze"
                setOnClickListener {
                    hide(context)
                    // TODO: Schedule snooze reminder
                }
            })

            addView(buttonLayout)
        }

        val dm = context.resources.displayMetrics
        val params = WindowManager.LayoutParams(
            (dm.widthPixels * 0.35).toInt(),
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        )
        params.gravity = Gravity.TOP or Gravity.END

        windowManager?.addView(overlayView, params)
    }

    fun hide(context: Context) {
        overlayView?.let {
            windowManager?.removeView(it)
            overlayView = null
        }
    }

    private fun showActivityOverlay(context: Context, title: String, message: String) {
        // Fallback: show as Activity
        // TODO: Implement OverlayActivity
    }
}
