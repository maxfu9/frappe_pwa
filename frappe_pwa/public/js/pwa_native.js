/* PWA Native Features: Biometric Auth & Offline Search */

const NATIVE_DB_NAME = 'frappe-pwa-native-db';
const SEARCH_STORE = 'search-index';

window.pwa_native = {
    // 1. Biometric Authentication (FaceID/TouchID)
    async registerBiometric() {
        if (!window.PublicKeyCredential) {
            console.error("PWA: WebAuthn not supported");
            return;
        }

        const options = {
            publicKey: {
                challenge: Uint8Array.from("challenge-string", c => c.charCodeAt(0)),
                rp: { name: "Frappe PWA" },
                user: {
                    id: Uint8Array.from("user-id", c => c.charCodeAt(0)),
                    name: "user@example.com",
                    displayName: "User"
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: { authenticatorAttachment: "platform" },
                timeout: 60000
            }
        };

        try {
            const credential = await navigator.credentials.create(options);
            localStorage.setItem('pwa-biometric-enabled', 'true');
            console.log("PWA: Biometric registered successfully");
            return true;
        } catch (err) {
            console.error("PWA: Biometric registration failed", err);
            return false;
        }
    },

    async verifyBiometric() {
        if (!localStorage.getItem('pwa-biometric-enabled')) return true;

        const options = {
            publicKey: {
                challenge: Uint8Array.from("challenge-string", c => c.charCodeAt(0)),
                allowCredentials: [],
                timeout: 60000
            }
        };

        try {
            await navigator.credentials.get(options);
            console.log("PWA: Biometric verification successful");
            return true;
        } catch (err) {
            console.error("PWA: Biometric verification failed", err);
            return false;
        }
    },

    // 2. Offline Search (IndexedDB Keyword Index)
    async syncSearchIndex() {
        try {
            console.log("PWA: Syncing search index...");
            const data = await frappe.call("frappe_pwa.api.get_search_data");
            if (!data.message) return;

            const db = await this.openDB();
            const tx = db.transaction(SEARCH_STORE, 'readwrite');
            const store = tx.objectStore(SEARCH_STORE);
            await store.clear();

            for (const [doctype, records] of Object.entries(data.message)) {
                // Limit to 500 records per doctype for production stability
                const limited_records = records.slice(0, 500);
                
                for (const record of limited_records) {
                    const textToIndex = Object.values(record).join(" ").toLowerCase();
                    await store.add({
                        doctype,
                        name: record.name,
                        content: textToIndex,
                        record: record
                    });
                }
            }
            console.log("PWA: Search index updated successfully");
        } catch (err) {
            console.error("PWA: Search index sync failed", err);
        }
    },


    async search(query) {
        const db = await this.openDB();
        const tx = db.transaction(SEARCH_STORE, 'readonly');
        const store = tx.objectStore(SEARCH_STORE);
        const records = await store.getAll();
        
        const terms = query.toLowerCase().split(/\s+/);
        return records.filter(r => terms.every(t => r.content.includes(t)));
    },

    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(NATIVE_DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(SEARCH_STORE)) {
                    db.createObjectStore(SEARCH_STORE, { keyPath: 'id', autoIncrement: true });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // 3. Haptic Feedback (Vibration API)
    haptic(type = 'success') {
        if (!("vibrate" in navigator)) return;

        switch (type) {
            case 'success':
                navigator.vibrate(50);
                break;
            case 'error':
                navigator.vibrate([50, 50, 50]);
                break;
            case 'warning':
                navigator.vibrate(200);
                break;
            case 'heavy':
                navigator.vibrate([100, 50, 100]);
                break;
            case 'light':
                navigator.vibrate(20);
                break;
        }
    }
};

