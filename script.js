const DB_NAME = 'shared-files-db';
const STORE_NAME = 'shared-files';

function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject('Error opening IndexedDB:', event.target.error);
        };
    });
}

async function getSharedFiles() {
    const db = await openDb();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject('Error getting files:', event.target.error);
    });
}

async function clearSharedFiles() {
    const db = await openDb();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('Error clearing files:', event.target.error);
    });
}

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

    // Check for shared files from IndexedDB on load
    (async () => {
        try {
            const sharedFiles = await getSharedFiles();
            if (sharedFiles && sharedFiles.length > 0) {
                console.log('Main: Found shared files in IndexedDB:', sharedFiles.length);
                // Assuming only one file is shared at a time for video playback
                const fileToPlay = sharedFiles[0].blob;
                // Re-attach name and type for playFile function, as Blob doesn't inherently carry them
                Object.defineProperty(fileToPlay, 'name', { value: sharedFiles[0].name });
                Object.defineProperty(fileToPlay, 'type', { value: sharedFiles[0].type });
                playFile(fileToPlay);
                await clearSharedFiles(); // Clear after playing
                console.log('Main: Shared files cleared from IndexedDB.');
            }
        } catch (error) {
            console.error('Main: Error handling shared files from IndexedDB:', error);
        }
    })();
});