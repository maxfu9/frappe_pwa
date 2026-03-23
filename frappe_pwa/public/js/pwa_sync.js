/* PWA Background Sync & IndexedDB Manager */

const DB_NAME = 'frappe-pwa-db';
const STORE_NAME = 'offline-actions';

async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

window.pwa_sync = {
    async registerAction(doctype, docname, action, data) {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        const record = {
            doctype,
            docname,
            action,
            data,
            timestamp: Date.now(),
            status: 'pending'
        };
        
        await store.add(record);
        console.log('PWA: Action queued offline:', record);

        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('pwa-sync-actions');
            console.log('PWA: Sync registered');
        } else {
            console.warn('PWA: Background Sync not supported, fallback to immediate sync needed.');
        }
    }
};
