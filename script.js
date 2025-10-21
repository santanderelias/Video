let player; // Declare player globally or in a scope accessible to playFile
let currentObjectUrl = null; // Keep track of the current object URL

// --- Helper function to play a file ---
const playFile = (file) => {
    // Revoke the old object URL to free up memory
    if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
    }

    const fileURL = URL.createObjectURL(file);
    currentObjectUrl = fileURL; // Store the new URL
    const fileType = file.type;

    // Ensure player is initialized before use
    if (player) {
        player.src({ src: fileURL, type: fileType });
        player.play();
    } else {
        console.error('Video.js player not initialized yet.');
    }
};

// 3. Handle Shared Files (Web Share Target API)
if ('launchQueue' in window) {
    console.log('App launched, launchQueue is available.');
    launchQueue.setConsumer(async (launchParams) => {
        console.log('launchQueue consumer triggered.');
        console.log('launchParams:', JSON.stringify(launchParams, null, 2));

        if (launchParams && launchParams.files && launchParams.files.length > 0) {
            console.log('File handles found in launchParams.');
            try {
                const fileHandle = launchParams.files[0];
                const file = await fileHandle.getFile();
                console.log('File obtained from handle:', file.name, file.type);
                playFile(file);
            } catch (error) {
                console.error('Error getting file from handle:', error);
            }
        } else {
            console.log('No file handles found in launchParams.');
        }
    });
} else {
    console.log('launchQueue API not supported.');
}

// Listen for messages from the Service Worker
navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'shared-file' && event.data.file) {
        console.log('Received shared file from Service Worker:', event.data.file.name);
        playFile(event.data.file);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    player = videojs('my-video'); // Initialize player here

    // 1. PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
                if (navigator.serviceWorker.controller) {
                    console.log('Page is controlled by Service Worker:', navigator.serviceWorker.controller.scriptURL);
                } else {
                    console.log('Page is NOT controlled by a Service Worker yet.');
                }
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // 2. Local File Playback Logic (from file input)
    const fileInput = document.getElementById('local-video-input');
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            playFile(file);
        }
    });
});