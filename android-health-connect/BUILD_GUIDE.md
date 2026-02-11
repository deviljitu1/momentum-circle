# Building Your Momentum Circle APK

Follow these steps to generate an APK to share with your friends.

## 1. Prerequisites
- **Android Studio**: You must have Android Studio installed on your computer.
- **Google Play Services**: Your emulator or device must have Google Play Services.

## 2. Configuration
Before building, you **MUST** update the URL to your live website.

1. Open `app/src/main/java/com/momentumcircle/health/MainActivity.kt`
2. Find this line (approx line 40):
   ```kotlin
   private val webAppUrl = "http://10.0.2.2:5173"
   ```
3. Change it to your Netlify URL:
   ```kotlin
   private val webAppUrl = "https://letsget-it-done.netlify.app/"
   ```

## 3. Building the APK (Method A: Online / Cloud)

**This is the easiest method. No installation required.**

1.  **Commit & Push** your changes to GitHub.
2.  Go to your repository page on GitHub.
3.  Click the **Actions** tab at the top.
4.  You should see a workflow named **"Android CI (Build APK)"** running.
5.  Wait for it to finish (green checkmark).
6.  Click on the workflow run title.
7.  Scroll down to the **Artifacts** section at the bottom.
8.  Click **app-debug** to download the ZIP file.
9.  Extract the ZIP and send `app-debug.apk` to your phone.

## 4. Building the APK (Method B: Android Studio)
1. Open **Android Studio**.
2. Select **Open** and choose the `android-health-connect` folder.
3. Wait for Gradle sync to finish.
4. Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. Once finished, a notification will appear "APK(s) generated successfully".
6. Click **locate** to find the `app-debug.apk` file.

## 5. Sharing
- Send the `.apk` file to your friends (via WhatsApp, Telegram, Drive, etc.).
- They may need to "Allow installing unknown apps" in their settings.
- Ensure they have **Samsung Health** and **Health Connect** installed.

## 6. Troubleshooting
- **White Screen?** Check if the URL is correct and includes `https://`.
- **Not Syncing?** Make sure you clicked the "Sync Steps" button in the bottom corner (if overlay) or on the website (if bridge) and granted permissions.
