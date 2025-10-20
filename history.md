# Project History: Video PWA

This document summarizes the development history and current state of the Video PWA project.

## 1. Project Summary

The project is a Progressive Web App (PWA) video player built with vanilla JavaScript, HTML, and CSS. It uses the Video.js library for the player UI.

### Final Features:
- Plays local video files selected by the user.
- Installable on supported devices (PWA).
- Works offline (app shell is cached).
- Appears as a target in Android's "Share" menu for video files.
- Designed to appear in Android's "Open with" menu for video files.
- Includes the Eruda mobile developer console for debugging.
- Displays the app version (v0.01) in the bottom-right corner.

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
    *   **Eruda Console:** The Eruda mobile console was integrated.
    *   **Version Display:** A version number was added to the UI.
9.  **Bug Fixing & Refinements:**
    *   Corrected paths in the service worker and manifest to support hosting in a subdirectory (`/video/`).
    *   Fixed a critical bug where the Eruda script crashed on load by moving it to the `<head>` and correcting its initialization logic.
    *   Fixed a bug in the service worker that prevented it from handling "Share" actions correctly.
    *   Fixed a memory leak in the local file playback logic by ensuring temporary object URLs were revoked.

---

## 3. Debugging Plan for "Open with" Feature

If the app is still not appearing in the "Open with" menu, follow these steps to diagnose the issue:

### Step 1: Confirm the PWA Installation (The "Golden Rule")
The operating system only registers file handling capabilities when the app is installed.

*   **Action:** Ensure you have completely **uninstalled** the PWA from your device and then **re-installed** it after the latest changes to `manifest.json`.
*   **Why:** Android will not re-read the manifest of an already-installed PWA. A fresh installation is required.

### Step 2: Use Browser Developer Tools to Inspect the Manifest
The browser's tools are the best way to check if it understands your manifest file.

*   **Action:**
    1.  Open the app's URL in Chrome on your desktop.
    2.  Press `F12` to open DevTools.
    3.  Go to the **"Application"** panel.
    4.  Select **"Manifest"** from the left menu.
*   **What to Look For:**
    *   Scroll down to the **"File Handlers"** section. Check if it's present and if there are any error or warning icons next to it. The browser will often give a specific reason if it rejects the entry.

### Step 3: Check for Browser and OS Compatibility
The File Handling API is a relatively new feature.

*   **Action:** Verify that your specific browser and Android version fully support the API. Search online for "caniuse File Handling API" or for your specific browser's documentation.

### Step 4: Experiment with the `action` Path
If the above steps don't reveal the problem, the `action` path in the manifest is the next most likely culprit.

*   **Action:** Try changing the `action` path in `manifest.json` from `/video/index.html` back to a relative path like `index.html` or `.`. Remember to re-install the PWA after any change.
