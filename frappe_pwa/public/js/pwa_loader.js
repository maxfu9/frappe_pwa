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
            })
            .catch((err) => {
                console.error("PWA: Service Worker registration failed", err);
            });
    });
}

