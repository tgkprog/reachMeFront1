package com.reachme

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class ReachMeNativeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ReachMeNative"
    }

    @ReactMethod
    fun showOverlay(args: ReadableMap, promise: Promise) {
        try {
            val title = args.getString("title") ?: ""
            val message = args.getString("message") ?: ""
            val tone = args.getString("tone") ?: "preset"
            val fileId = if (args.hasKey("fileId")) args.getString("fileId") else null

            OverlayService.show(reactContext, title, message, tone, fileId)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("OVERLAY_ERROR", e.message)
        }
    }

    @ReactMethod
    fun hideOverlay(promise: Promise) {
        try {
            OverlayService.hide(reactContext)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("OVERLAY_ERROR", e.message)
        }
    }

    @ReactMethod
    fun playAlarm(args: ReadableMap, promise: Promise) {
        try {
            val tone = args.getString("tone") ?: "preset"
            val fileId = if (args.hasKey("fileId")) args.getString("fileId") else null

            AlarmHandler.play(reactContext, tone, fileId)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ALARM_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopAlarm(promise: Promise) {
        try {
            AlarmHandler.stop(reactContext)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ALARM_ERROR", e.message)
        }
    }

    @ReactMethod
    fun downloadFile(url: String, id: String, promise: Promise) {
        try {
            DownloadHandler.download(reactContext, url, id) { localPath ->
                promise.resolve(localPath)
            }
        } catch (e: Exception) {
            promise.reject("DOWNLOAD_ERROR", e.message)
        }
    }

    @ReactMethod
    fun startForegroundService(promise: Promise) {
        try {
            val intent = Intent(reactContext, CoreService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopForegroundService(promise: Promise) {
        try {
            val intent = Intent(reactContext, CoreService::class.java)
            reactContext.stopService(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SERVICE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        try {
            val permissions = WritableNativeMap()
            permissions.putBoolean("overlay", Settings.canDrawOverlays(reactContext))
            permissions.putBoolean("dnd", PermissionHelper.hasDNDAccess(reactContext))
            permissions.putBoolean("exactAlarm", PermissionHelper.canScheduleExactAlarms(reactContext))
            permissions.putBoolean("batteryOptimization", PermissionHelper.isIgnoringBatteryOptimizations(reactContext))
            permissions.putBoolean("notifications", PermissionHelper.hasNotificationPermission(reactContext))
            promise.resolve(permissions)
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${reactContext.packageName}"))
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestDNDPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestExactAlarmPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                reactContext.startActivity(intent)
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestBatteryOptimization(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            intent.data = Uri.parse("package:${reactContext.packageName}")
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getLocalFilePath(fileId: String, promise: Promise) {
        try {
            val path = DownloadHandler.getLocalPath(reactContext, fileId)
            promise.resolve(path)
        } catch (e: Exception) {
            promise.reject("FILE_ERROR", e.message)
        }
    }
}
