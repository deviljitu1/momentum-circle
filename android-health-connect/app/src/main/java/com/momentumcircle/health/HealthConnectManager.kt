package com.momentumcircle.health

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.activity.result.contract.ActivityResultContract
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord

class HealthConnectManager(private val context: Context) {

    private val healthConnectClient by lazy { HealthConnectClient.getOrCreate(context) }

    // Check if Health Connect is available
    fun checkAvailability(): HealthConnectAvailability {
        return when {
            HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE -> HealthConnectAvailability.INSTALLED
            HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> HealthConnectAvailability.NOT_INSTALLED
            else -> HealthConnectAvailability.NOT_SUPPORTED
        }
    }

    // Permissions to request
    val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class)
    )

    // Check if permissions are granted
    suspend fun hasPermissions(): Boolean {
        return try {
            val granted = healthConnectClient.permissionController.getGrantedPermissions()
            granted.containsAll(permissions)
        } catch (e: Exception) {
            false
        }
    }

    // Open Play Store to install Health Connect
    fun installHealthConnect() {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("market://details?id=com.google.android.apps.healthdata")
            setPackage("com.android.vending")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    // Expose client for repository
    fun getClient(): HealthConnectClient = healthConnectClient
}

enum class HealthConnectAvailability {
    INSTALLED, NOT_INSTALLED, NOT_SUPPORTED
}
