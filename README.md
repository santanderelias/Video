# Video Player

A simple video player web application built with vanilla JavaScript, HTML, and CSS. It uses the Video.js library for the video player functionality.

## Features:
*   Plays local video files selected by the user.
*   Installable as a Progressive Web App (PWA).
*   Works offline (app shell is cached).
*   **Receives and plays shared video files from Android's "Share" menu.**
*   Designed to integrate with Android's "Open with" menu for video files (currently under development/debugging).

---

# Project History: Video PWA

This document summarizes the development history and current state of the Video PWA project.

## 1. Project Summary

The project is a Progressive Web App (PWA) video player built with vanilla JavaScript, HTML, and CSS. It uses the Video.js library for the player UI.

### Final Features:
- Plays local video files selected by the user.
- Installable on supported devices (PWA).
- Works offline (app shell is cached).
- Appears as a target in Android's "Share" menu for video files and successfully plays shared videos.
- Designed to appear in Android's "Open with" menu for video files.

- Displays the app version (v1.9.1) in the bottom-right corner.

---

## 2. Feature Evolution

The project underwent several iterations:

1.  **Initial Scaffolding:** Started as a simple web page with Video.js, a sample playlist, and a dark theme.
2.  **Responsive Design:** The CSS was refactored to be mobile-first and adapt to different screen sizes.
3.  **URL Input:** A feature to play videos from a URL was added, including logic to handle Google Drive links.
4.  **Major Pivot:** The URL and playlist features were removed. The project was refocused on being an installable PWA for playing local files.
5.  **Git & PWA Setup:** A local git repository was initialized. The core PWA features were added:
    *   `manifest.json` for app properties and icons.
    *   `sw.js` (Service Worker) for offline caching.
    *   The app was updated to link the manifest and register the service worker.
6.  **Local File Playback:** An input for selecting local video files was added, with the JavaScript logic to play them.
7.  **System Integration:**
    *   **Share Target:** The manifest was updated with `share_target` to allow the app to receive videos from Android's "Share" menu.
    *   **File Handling:** The manifest was updated with `file_handlers` to register the app for the "Open with" menu.
8.  **Developer Tools:**
    *   **Version Display:** A version number was added to the UI.
9.  **Bug Fixing & Refinements:**
    *   Corrected paths in the service worker and manifest to support hosting in a subdirectory (`/video/`).
    *   Fixed a memory leak in the local file playback logic by ensuring temporary object URLs were revoked.
    *   **Implemented robust "Share" target handling**: Modified `sw.js` to use IndexedDB for temporary storage of shared files, and `script.js` to retrieve and play them, resolving the issue where shared videos were not playing.
    *   **Resolved TWA Display Issue**: Ensured `assetlinks.json` is correctly served via GitHub Pages (using `.nojekyll` workaround) and updated `twa-manifest.json` to `display: "fullscreen"` for a truly immersive experience.
    *   **Fixed Service Worker Installation & CDN Reliance**: Removed problematic entries from `sw.js`'s `urlsToCache` (e.g., `'.'`), localized CDN resources (Video.js CSS/JS) to the `lib/` directory, and added robust error logging to `cache.addAll()`. This resolves the "site can't be reached" error during service worker installation.
    *   **Improved App Icon Display**: Updated `manifest.json` and `twa-manifest.json` to use existing black SVG icons (`black_192.svg`, `black_512.svg`) for better contrast against Android's adaptive icon backgrounds.
    *   **Ongoing Core Functionality Debugging**: Investigating general core functionality within the TWA. Extensive logging has been added to `sw.js` and `script.js` to diagnose issues.

---

## 3. Debugging Plan for Core Functionality in TWA

The app is now installable via APK and appears in Android's "Open with" options. The primary issue is that the core functionality (playing videos, especially shared or opened files) is not working correctly within the TWA.

To diagnose this, we have added extensive logging to `sw.js` and `script.js`. Follow these steps to help us pinpoint the problem:

### Step 1: Rebuild and Install the APK
*   **Action:** Rebuild your Android application to include the latest changes (updated web app files, `twa-manifest.json` display mode).
*   **Action:** **Crucially, uninstall the existing "Video Player" app from your Android device before installing the new APK.** This ensures that the updated service worker and web app files are loaded correctly.
*   **Action:** Install the newly built APK on your Android device.

### Step 2: Test Functionality and Collect Logs
*   **Test Display**: Verify that the TWA launches in a full-screen, immersive mode without the top bar (URL/name and close button).
*   **Test Share**: From another app (e.g., Gallery, Files), share a video file to your "Video Player" app.
*   **Test Open with**: From a file manager, open a video file with your "Video Player" app.
*   **Test Local File Input**: Within the app, try selecting a video file using the "Choose a local video file" button.
*   **Collect Logs**:
    *   **Recommended (Chrome DevTools for Remote Debugging)**:
        1.  Connect your Android device to your computer via USB.
        2.  Enable USB debugging on your Android device (usually in Developer Options).
        3.  On your computer, open Chrome and go to `chrome://inspect/#devices`.
        4.  You should see your Android device listed. Under your device, you should see your TWA listed as a "WebViews" or "Service Workers" target. Click "inspect" next to it.
        5.  The Chrome DevTools window will open. All the `console.log` messages from `sw.js` and `script.js` (prefixed with "Main:" or "SW:") will appear in the "Console" tab.
    *   **Alternative (`adb logcat`)**:
        1.  Ensure you have ADB (Android Debug Bridge) installed and configured.
        2.  Connect your Android device to your computer via USB.
        3.  Open a terminal or command prompt and run:
            ```bash
            adb logcat | grep "Main:\|SW:"
            ```
            This will filter the logs to show messages from your web app's `console.log` statements.

### Step 3: Provide Logs
*   **Action**: Please share the collected logs with me. The more detailed the logs, the easier it will be to pinpoint the exact point of failure.

---

Once you've provided the logs, we can analyze them to understand why the core functionality is failing within the TWA.
