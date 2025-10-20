document.addEventListener('DOMContentLoaded', () => {
    const player = videojs('my-video');

    // --- Helper function to play a file ---
    const playFile = (file) => {
        const fileURL = URL.createObjectURL(file);
        const fileType = file.type;

        player.src({ src: fileURL, type: fileType });
        player.play();

        // When the player is disposed (e.g., a new video is loaded),
        // revoke the object URL to free up memory.
        player.one('dispose', () => {
            URL.revokeObjectURL(fileURL);
        });
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
        launchQueue.setConsumer(async (launchParams) => {
            if (!launchParams.files || launchParams.files.length === 0) {
                return;
            }
            const fileHandle = launchParams.files[0];
            const file = await fileHandle.getFile();
            playFile(file);
        });
    }
});
