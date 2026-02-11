package com.momentumcircle.health

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.lifecycleScope
import androidx.health.connect.client.PermissionController
import kotlinx.coroutines.launch
import android.widget.Toast

class MainActivity : ComponentActivity() {

    private lateinit var healthConnectManager: HealthConnectManager
    private lateinit var stepRepository: StepRepository
    private var webViewRef: WebView? = null

    // Permission launcher
    private val requestPermissionActivityContract = PermissionController.createRequestPermissionResultContract()
    
    // REPLACE THIS WITH YOUR NETLIFY URL
    private val webAppUrl = "https://letsget-it-done.netlify.app/" 

    private val requestPermissions = registerForActivityResult(requestPermissionActivityContract) { granted ->
        if (granted.containsAll(healthConnectManager.permissions)) {
            fetchSteps()
        } else {
            Toast.makeText(this, "Permissions not granted", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        healthConnectManager = HealthConnectManager(this)
        stepRepository = StepRepository(healthConnectManager.getClient())

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    WebViewContainer(
                        url = webAppUrl, 
                        jsInterface = WebAppInterface(),
                        onWebViewCreated = { webViewRef = it }
                    )
                }
            }
        }
    }

    private fun handleConnect() {
        val availability = healthConnectManager.checkAvailability()

        if (availability == HealthConnectAvailability.NOT_INSTALLED) {
            healthConnectManager.installHealthConnect()
            return
        }

        if (availability == HealthConnectAvailability.INSTALLED) {
            lifecycleScope.launch {
                val hasPermissions = healthConnectManager.hasPermissions()
                if (hasPermissions) {
                    fetchSteps()
                } else {
                    requestPermissions.launch(healthConnectManager.permissions)
                }
            }
        }
    }

    private fun fetchSteps() {
        lifecycleScope.launch {
            val steps = stepRepository.getTodaySteps()
            
            runOnUiThread {
                Toast.makeText(this@MainActivity, "Synced: $steps steps", Toast.LENGTH_SHORT).show()
                // Call Web App Function
                webViewRef?.evaluateJavascript("javascript:if(window.syncDailySteps) window.syncDailySteps($steps);", null)
            }
        }
    }

    // JavaScript Interface
    inner class WebAppInterface {
        @JavascriptInterface
        fun connect() {
            runOnUiThread {
                handleConnect()
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewContainer(url: String, jsInterface: Any, onWebViewCreated: (WebView) -> Unit) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                webViewClient = WebViewClient()
                addJavascriptInterface(jsInterface, "Android") // window.Android
                loadUrl(url)
                onWebViewCreated(this)
            }
        },
        update = { webView ->
            // webView.loadUrl(url) 
        },
        modifier = Modifier.fillMaxSize()
    )
}
