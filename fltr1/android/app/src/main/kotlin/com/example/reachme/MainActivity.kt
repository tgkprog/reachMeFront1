package com.sel2in.reachme

import android.content.ContentResolver
import android.content.Context
import android.media.AudioManager
import android.os.Build
import android.provider.Settings
import androidx.annotation.NonNull
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
	private val CHANNEL = "reachme/audio"
	private val savedVolumes: MutableMap<String, Int> = mutableMapOf()

	override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
		super.configureFlutterEngine(flutterEngine)

		MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
			when (call.method) {
				"canWriteSettings" -> {
					val can = canWriteSettings()
					result.success(can)
				}
				"saveVolume" -> {
					val stream = call.argument<String>("stream") ?: "alarm"
					saveVolume(stream)
					result.success(true)
				}
				"setVolume" -> {
					val stream = call.argument<String>("stream") ?: "alarm"
					val vol = call.argument<Int>("volume") ?: 0
					val ok = setVolume(stream, vol)
					result.success(ok)
				}
				"restoreVolume" -> {
					val stream = call.argument<String>("stream") ?: "alarm"
					restoreVolume(stream)
					result.success(true)
				}
				else -> result.notImplemented()
			}
		}
	}

	private fun canWriteSettings(): Boolean {
		return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
			Settings.System.canWrite(this)
		} else true
	}

	private fun streamTypeFromName(name: String): Int {
		return when (name.lowercase()) {
			"alarm" -> AudioManager.STREAM_ALARM
			"music", "media" -> AudioManager.STREAM_MUSIC
			else -> AudioManager.STREAM_MUSIC
		}
	}

	private fun saveVolume(streamName: String) {
		val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
		val t = streamTypeFromName(streamName)
		val cur = am.getStreamVolume(t)
		savedVolumes[streamName] = cur
	}

	private fun setVolume(streamName: String, vol: Int): Boolean {
		val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
		val t = streamTypeFromName(streamName)
		val max = am.getStreamMaxVolume(t)
		val v = vol.coerceIn(0, max)
		return try {
			am.setStreamVolume(t, v, 0)
			true
		} catch (e: Exception) {
			false
		}
	}

	private fun restoreVolume(streamName: String) {
		val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
		val t = streamTypeFromName(streamName)
		val saved = savedVolumes[streamName]
		if (saved != null) {
			try {
				am.setStreamVolume(t, saved, 0)
			} catch (_: Exception) {
			}
		}
	}
}
