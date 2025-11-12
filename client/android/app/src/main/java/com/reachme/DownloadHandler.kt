package com.reachme

import android.content.Context
import okhttp3.*
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

object DownloadHandler {
    private val client = OkHttpClient()
    private val downloadedFiles = mutableMapOf<String, String>()

    fun download(context: Context, url: String, id: String, callback: (String?) -> Unit) {
        val request = Request.Builder()
            .url(url)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                e.printStackTrace()
                callback(null)
            }

            override fun onResponse(call: Call, response: Response) {
                if (!response.isSuccessful) {
                    callback(null)
                    return
                }

                try {
                    val file = File(context.filesDir, "sounds/$id.mp3")
                    file.parentFile?.mkdirs()

                    response.body?.byteStream()?.use { input ->
                        FileOutputStream(file).use { output ->
                            input.copyTo(output)
                        }
                    }

                    val localPath = file.absolutePath
                    downloadedFiles[id] = localPath
                    callback(localPath)
                } catch (e: Exception) {
                    e.printStackTrace()
                    callback(null)
                }
            }
        })
    }

    fun getLocalPath(context: Context, fileId: String): String? {
        return downloadedFiles[fileId] ?: run {
            // Check if file exists
            val file = File(context.filesDir, "sounds/$fileId.mp3")
            if (file.exists()) {
                val path = file.absolutePath
                downloadedFiles[fileId] = path
                path
            } else {
                null
            }
        }
    }
}
