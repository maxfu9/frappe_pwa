console.log("PWA: Loader initializing...");

// Dynamically add manifest link
if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/api/method/frappe_pwa.api.get_manifest';
    document.head.appendChild(link);
    console.log("PWA: Manifest link injected");
}

// Clear App Badge on load
if (navigator.clearAppBadge) {
    navigator.clearAppBadge().catch((err) => {
        console.error("PWA: Failed to clear badge", err);
    });
}


if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/assets/frappe_pwa/sw.js")
            .then((reg) => {
                console.log("PWA: Service Worker registered", reg);

                // Periodic Sync Registration
                if ('periodicSync' in reg) {
                    reg.periodicSync.register('pwa-periodic-refresh', {
                        minInterval: 24 * 60 * 60 * 1000 // 24 hours
                    }).then(() => console.log('PWA: Periodic Sync registered'))
                    .catch(err => console.debug('PWA: Periodic Sync failed (probably not permitted)', err));
                }
            })
            .catch((err) => {
                console.error("PWA: Service Worker registration failed", err);
            });
    });
}

// Biometric Lock on Startup
window.addEventListener('load', async () => {
    if (localStorage.getItem('pwa-biometric-lock-enabled') === 'true') {
        const success = await window.pwa_native.verifyBiometric();
        if (!success) {
            document.body.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
                    <h2>App Locked</h2>
                    <button onclick="location.reload()" style="padding:10px 20px; background:#0089FF; color:white; border:none; border-radius:8px;">Unlock with Biometrics</button>
                </div>
            `;
        }
    }
});


