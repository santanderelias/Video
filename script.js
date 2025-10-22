const DB_NAME = 'shared-files-db';
const STORE_NAME = 'shared-files';

function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            console.log('Main: IndexedDB upgrade needed.');
            const db = event.target.result;
            db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        };

        request.onsuccess = (event) => {
            console.log('Main: IndexedDB opened successfully.');
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('Main: Error opening IndexedDB:', event.target.error);
            reject('Error opening IndexedDB:', event.target.error);
        };
    });
}

async function getSharedFiles() {
    console.log('Main: Attempting to get shared files from IndexedDB.');
    const db = await openDb();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
            console.log('Main: Successfully retrieved shared files from IndexedDB.', request.result.length);
            resolve(request.result);
        };
        request.onerror = (event) => {
            console.error('Main: Error getting files from IndexedDB:', event.target.error);
            reject('Error getting files:', event.target.error);
        };
    });
}

async function clearSharedFiles() {
    console.log('Main: Attempting to clear shared files from IndexedDB.');
    const db = await openDb();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => {
            console.log('Main: Successfully cleared shared files from IndexedDB.');
            resolve();
        };
        request.onerror = (event) => {
            console.error('Main: Error clearing files from IndexedDB:', event.target.error);
            reject('Error clearing files:', event.target.error);
        };
    });
}

let player; // Declare player globally or in a scope accessible to playFile
let currentObjectUrl = null; // Keep track of the current object URL

// --- Helper function to play a file ---
const playFile = (file) => {
    console.log('Main: playFile called with file:', file.name, file.type, file.size);
    // Revoke the old object URL to free up memory
    if (currentObjectUrl) {
        console.log('Main: Revoking old object URL:', currentObjectUrl);
        URL.revokeObjectURL(currentObjectUrl);
    }

    try {
        const fileURL = URL.createObjectURL(file);
        currentObjectUrl = fileURL; // Store the new URL
        const fileType = file.type;

        // Ensure player is initialized before use
        if (player) {
            console.log('Main: Setting video source to:', fileURL, 'type:', fileType);
            player.src({ src: fileURL, type: fileType });
            player.play();
        } else {
            console.error('Main: Video.js player not initialized yet.');
        }
    } catch (error) {
        console.error('Main: Error creating object URL or setting video source:', error);
    }
};

// 3. Handle Shared Files (Web Share Target API)
if ('launchQueue' in window) {
    console.log('Main: App launched, launchQueue is available.');
    launchQueue.setConsumer(async (launchParams) => {
        console.log('Main: launchQueue consumer triggered.');
        console.log('Main: launchParams:', JSON.stringify(launchParams, null, 2));

        if (launchParams && launchParams.files && launchParams.files.length > 0) {
            console.log('Main: File handles found in launchParams.');
            try {
                const fileHandle = launchParams.files[0];
                console.log('Main: Processing file handle:', fileHandle.name);
                const file = await fileHandle.getFile();
                console.log('Main: File obtained from handle:', file.name, file.type, file.size);
                playFile(file);
            } catch (error) {
                console.error('Main: Error getting file from handle:', error);
            }
        } else {
            console.log('Main: No file handles found in launchParams.');
        }
    });
} else {
    console.log('Main: launchQueue API not supported.');
}

// Listen for messages from the Service Worker
navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('Main: Received message from Service Worker:', event.data);
    if (event.data && event.data.type === 'shared-file' && event.data.file) {
        console.log('Main: Received shared file from Service Worker:', event.data.file.name);
        playFile(event.data.file);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Main: DOMContentLoaded event fired.');
    player = videojs('my-video'); // Initialize player here
    console.log('Main: Video.js player initialized.', player);

    // 1. PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        console.log('Main: Service Worker API supported.');
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('Main: Service Worker registered with scope:', registration.scope);
                if (navigator.serviceWorker.controller) {
                    console.log('Main: Page is controlled by Service Worker:', navigator.serviceWorker.controller.scriptURL);
                } else {
                    console.log('Main: Page is NOT controlled by a Service Worker yet.');
                }
            })
            .catch((error) => {
                console.error('Main: Service Worker registration failed:', error);
            });
    } else {
        console.log('Main: Service Worker API not supported.');
    }

    // 2. Local File Playback Logic (from file input)
    const fileInput = document.getElementById('local-video-input');
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            console.log('Main: Local file input change event.');
            const file = event.target.files[0];
            if (file) {
                console.log('Main: Selected local file:', file.name, file.type, file.size);
                playFile(file);
            } else {
                console.log('Main: No local file selected.');
            }
        });
    } else {
        console.error('Main: Local video input element not found.');
    }

    // Check for shared files from IndexedDB on load
    (async () => {
        console.log('Main: Checking for shared files from IndexedDB on load.');
        try {
            const sharedFiles = await getSharedFiles();
            if (sharedFiles && sharedFiles.length > 0) {
                console.log('Main: Found shared files in IndexedDB:', sharedFiles.length);
                // Assuming only one file is shared at a time for video playback
                const fileToPlay = sharedFiles[0].blob;
                // Re-attach name and type for playFile function, as Blob doesn't inherently carry them
                Object.defineProperty(fileToPlay, 'name', { value: sharedFiles[0].name });
                Object.defineProperty(fileToPlay, 'type', { value: sharedFiles[0].type });
                console.log('Main: Playing file from IndexedDB:', sharedFiles[0].name);
                playFile(fileToPlay);
                await clearSharedFiles(); // Clear after playing
                console.log('Main: Shared files cleared from IndexedDB.');
            } else {
                console.log('Main: No shared files found in IndexedDB on load.');
            }
        } catch (error) {
            console.error('Main: Error handling shared files from IndexedDB on load:', error);
        }
    })();
});