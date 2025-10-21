document.addEventListener('DOMContentLoaded', () => {
    const player = videojs('my-video');
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

        player.src({ src: fileURL, type: fileType });
        player.play();
    };

    // 1. PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
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
});