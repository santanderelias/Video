document.addEventListener('DOMContentLoaded', () => {
    // 1. PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js') // Use relative path
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // 2. Local File Playback Logic
    const player = videojs('my-video');
    const fileInput = document.getElementById('local-video-input');

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const fileURL = URL.createObjectURL(file);
            const fileType = file.type;

            player.src({ src: fileURL, type: fileType });
            player.play();

            // When the player is disposed (e.g., a new video is loaded),
            // revoke the object URL to free up memory.
            player.one('dispose', () => {
                URL.revokeObjectURL(fileURL);
            });
        }
    });
});