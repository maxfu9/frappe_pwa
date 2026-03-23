console.log("PWA: Loader initializing...");

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
