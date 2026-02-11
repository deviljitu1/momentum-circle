# Android Health Connect Integration

This folder contains the native Android code required to integrate Samsung Health step tracking via Google Health Connect.

## Disclaimer
Since `momentum-circle` is a web application, this code cannot be run directly in the browser. You must build a native Android application (e.g., using Android Studio) that either:
1. Wraps your existing web app (using WebView/TWA).
2. Runs as a standalone companion app.

To use this code:
1. Create a new Android project in Android Studio.
2. Copy the contents of `app/src/main/java/com/momentumcircle/health` into your project's source folder.
3. Update your `AndroidManifest.xml` and `build.gradle.kts` with the provided configurations.
4. Ensure you have the Google Play Services and Health Connect installed on your test device.

## Requirements
- Min SDK: 26 (Android 8.0)
- Target SDK: 34 (Android 14)
- Google Health Connect app installed (for Android < 14)

## Architecture
- **HealthConnectManager**: Singleton handling permissions and client connection.
- **StepRepository**: Handles reading step data.
- **StepsViewModel**: Manages UI state.
- **MainActivity**: UI implementation using Jetpack Compose.
