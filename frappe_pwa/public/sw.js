const CACHE_NAME = 'frappe-pwa-v2';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/desk',
    '/assets/frappe_pwa/css/modern_desk.css',
    '/assets/frappe_pwa/css/pwa_install.css',
    '/assets/frappe_pwa/js/pwa_loader.js',
    '/assets/frappe_pwa/js/pwa_install.js',
    '/assets/frappe_pwa/js/pwa_sync.js',
    '/assets/frappe_pwa/js/pwa_native.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('PWA: Pre-caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('PWA: Clearing old cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Stale-While-Revalidate for Static Assets
    if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/assets/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // Network-First for API and Desk
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/app')) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
        return;
    }

    // Fallback for navigation requests (e.g., offline page)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(OFFLINE_URL);
            })
        );
        return;
    }

    // Default to network-only for other requests
    event.respondWith(fetch(event.request));
});

/* PUSH NOTIFICATIONS & BADGE API */

self.addEventListener('push', (event) => {
    let data = {};
    if (event.data) {
        data = event.data.json();
    }

    const title = data.title || 'New Notification';
    const options = {
        body: data.body || 'You have a new update.',
        icon: data.icon || '/assets/frappe/images/frappe-framework-logo.svg',
        badge: data.badge_icon || '/assets/frappe/images/frappe-framework-logo.svg',
        tag: data.tag || 'general-notification',
        renotify: true,
        data: {
            url: data.url || '/app'
        }
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(title, options),
            // Update Badge API
            navigator.setAppBadge ? navigator.setAppBadge() : Promise.resolve()
        ])
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            const url = event.notification.data.url;
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

/* BACKGROUND SYNC */

self.addEventListener('sync', (event) => {
    if (event.tag === 'pwa-sync-actions') {
        event.waitUntil(syncPendingActions());
    }
});

async function syncPendingActions() {
    const db = await openSyncDB();
    const tx = db.transaction('offline-actions', 'readwrite');
    const store = tx.objectStore('offline-actions');
    const actions = await store.getAll();

    for (const action of actions) {
        try {
            // Logic to push action to server via frappe api
            const response = await fetch('/api/method/frappe_pwa.api.sync_offline_action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(action)
            });
            
            if (response.ok) {
                await store.delete(action.id);
                console.log('PWA: Action synced and removed from DB:', action);
            }
        } catch (err) {
            console.error('PWA: Sync failed for action:', action, err);
        }
    }
}

/* PERIODIC SYNC */

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'pwa-periodic-refresh') {
        event.waitUntil(refreshPWAData());
    }
});

async function refreshPWAData() {
    console.log('PWA: Periodic sync running...');
    // Logic to refresh data will go here (e.g., re-sync search index)
}

