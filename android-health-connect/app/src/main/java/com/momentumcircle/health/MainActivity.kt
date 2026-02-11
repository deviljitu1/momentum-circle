package com.momentumcircle.health

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var healthConnectManager: HealthConnectManager
    private lateinit var stepRepository: StepRepository

    // Permission launcher
    private val requestPermissionActivityContract = PermissionController.createRequestPermissionResultContract()
    
    private val requestPermissions = registerForActivityResult(requestPermissionActivityContract) { granted ->
        if (granted.containsAll(healthConnectManager.permissions)) {
            // Permissions granted, fetch steps
            fetchSteps()
        }
    }

    // State
    private var stepsState by mutableStateOf<Long>(0)
    private var isConnected by mutableStateOf(false)
    private var availability by mutableStateOf(HealthConnectAvailability.NOT_SUPPORTED)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        healthConnectManager = HealthConnectManager(this)
        stepRepository = StepRepository(healthConnectManager.getClient())
        
        // Check availability
        availability = healthConnectManager.checkAvailability()

        // Check initial permission state
        if (availability == HealthConnectAvailability.INSTALLED) {
            lifecycleScope.launch {
                isConnected = healthConnectManager.hasPermissions()
                if (isConnected) {
                    fetchSteps()
                }
            }
        }

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    HealthConnectScreen(
                        steps = stepsState,
                        isConnected = isConnected,
                        availability = availability,
                        onConnectClick = { handleConnect() }
                    )
                }
            }
        }
    }

    private fun handleConnect() {
        if (availability == HealthConnectAvailability.NOT_INSTALLED) {
            healthConnectManager.installHealthConnect()
            return
        }

        if (availability == HealthConnectAvailability.INSTALLED) {
            // Request permissions
            lifecycleScope.launch {
                requestPermissions.launch(healthConnectManager.permissions)
            }
        }
    }

    private fun fetchSteps() {
        lifecycleScope.launch {
            val steps = stepRepository.getTodaySteps()
            stepsState = steps
            isConnected = true
        }
    }
}

@Composable
fun HealthConnectScreen(
    steps: Long,
    isConnected: Boolean,
    availability: HealthConnectAvailability,
    onConnectClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Momentum Health",
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(48.dp))

        // Status Card
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            ),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(text = "Today's Steps", style = MaterialTheme.typography.labelLarge)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (isConnected) "$steps" else "--",
                    style = MaterialTheme.typography.displayMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Connection Status
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = if (isConnected) "Connected" else "Not Connected",
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(text = if (isConnected) "✅" else "❌")
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Action Button
        Button(
            onClick = onConnectClick,
            enabled = !isConnected || availability == HealthConnectAvailability.NOT_INSTALLED,
            modifier = Modifier.fillMaxWidth().height(56.dp)
        ) {
            Text(
                text = when {
                    isConnected -> "Synced with Samsung Health"
                    availability == HealthConnectAvailability.NOT_INSTALLED -> "Install Health Connect"
                    else -> "Connect Samsung Health"
                },
                fontSize = 16.sp
            )
        }
        
        if (availability == HealthConnectAvailability.NOT_SUPPORTED) {
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Device not supported",
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}
