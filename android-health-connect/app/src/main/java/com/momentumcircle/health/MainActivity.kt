package com.momentumcircle.health

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.lifecycleScope
import androidx.health.connect.client.PermissionController
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var healthConnectManager: HealthConnectManager
    private lateinit var stepRepository: StepRepository

    // Permission launcher
    private val requestPermissionActivityContract = PermissionController.createRequestPermissionResultContract()
    
    private val requestPermissions = registerForActivityResult(requestPermissionActivityContract) { granted ->
        if (granted.containsAll(healthConnectManager.permissions)) {
            fetchSteps()
        }
    }

    // State
    private var stepsState by mutableStateOf<Long>(0)
    private var isConnected by mutableStateOf(false)
    private var availability by mutableStateOf(HealthConnectAvailability.NOT_SUPPORTED)
    
    // REPLACE THIS WITH YOUR NETLIFY URL WHEN READY
    // For Emulator localhost: http://10.0.2.2:5173
    // For Physical Device: Use your computer's IP (e.g., http://192.168.1.X:5173) OR your Netlify URL
    private val webAppUrl = "http://10.0.2.2:5173" 

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        healthConnectManager = HealthConnectManager(this)
        stepRepository = StepRepository(healthConnectManager.getClient())
        
        availability = healthConnectManager.checkAvailability()

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
                    Box(modifier = Modifier.fillMaxSize()) {
                        // 1. Web View (Background)
                        WebViewContainer(url = webAppUrl)

                        // 2. Health Connect Overlay (Floating Button)
                        HealthConnectOverlay(
                            modifier = Modifier
                                .align(Alignment.BottomEnd)
                                .padding(16.dp),
                            isConnected = isConnected,
                            steps = stepsState,
                            onConnectClick = { handleConnect() }
                        )
                    }
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
            // TODO: In a real app, you would send 'steps' to your Supabase DB here via an API call
            // or inject it into the WebView via JavascriptInterface.
            // For now, we just show it in the overlay.
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewContainer(url: String) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                webViewClient = WebViewClient()
                loadUrl(url)
            }
        },
        update = { webView ->
            // webView.loadUrl(url) 
        },
        modifier = Modifier.fillMaxSize()
    )
}

@Composable
fun HealthConnectOverlay(
    modifier: Modifier = Modifier,
    isConnected: Boolean,
    steps: Long,
    onConnectClick: () -> Unit
) {
    FloatingActionButton(
        onClick = onConnectClick,
        modifier = modifier,
        containerColor = if (isConnected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Favorite, contentDescription = "Health")
            Spacer(modifier = Modifier.width(8.dp))
            if (isConnected) {
                Text(text = "$steps steps")
            } else {
                Text(text = "Sync Health")
            }
        }
    }
}
