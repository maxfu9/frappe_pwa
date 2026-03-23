console.log("PWA: Loader initializing...");

// Dynamically add manifest link
if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/api/method/frappe_pwa.api.get_manifest';
    document.head.appendChild(link);
    console.log("PWA: Manifest link injected");

    // iOS Specific Meta Tags
    const metaTags = [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: document.title },
        { rel: 'apple-touch-icon', href: '/assets/frappe_pwa/images/logo.png' } // Fallback, will be updated by settings
    ];

    metaTags.forEach(tag => {
        const el = document.createElement(tag.rel ? 'link' : 'meta');
        if (tag.rel) el.rel = tag.rel;
        if (tag.name) el.name = tag.name;
        el.content = tag.content || '';
        if (tag.href) el.href = tag.href;
        document.head.appendChild(el);
    });
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

// Global Haptic Triggers for Frappe Alerts & Messages
window.addEventListener('load', () => {
    if (!window.frappe) return;

    // Fetch and cache haptic settings
    const haptic_enabled = () => {
        return localStorage.getItem('pwa-haptic-enabled') !== '0';
    };

    // 1. Hook into show_alert
    const original_show_alert = frappe.show_alert;
    frappe.show_alert = function(message, seconds) {
        if (window.pwa_native && haptic_enabled()) {
            const indicator = typeof message === 'object' ? message.indicator : 'blue';
            if (['green', 'blue'].includes(indicator)) window.pwa_native.haptic('success');
            else if (indicator === 'orange') window.pwa_native.haptic('warning');
            else if (indicator === 'red') window.pwa_native.haptic('error');
        }
        return original_show_alert.apply(this, arguments);
    };

    // 2. Hook into msgprint
    const original_msgprint = frappe.msgprint;
    frappe.msgprint = function(args) {
        if (window.pwa_native && haptic_enabled()) {
            const indicator = typeof args === 'object' ? args.indicator : 'blue';
            if (indicator === 'red') window.pwa_native.haptic('error');
            else window.pwa_native.haptic('light');
        }
        return original_msgprint.apply(this, arguments);
    };

    // Sync Settings on Load
    frappe.db.get_value('PWA Settings', 'PWA Settings', ['enable_haptic_feedback', 'enable_biometric_lock'])
        .then(r => {
            if (r.message) {
                localStorage.setItem('pwa-haptic-enabled', r.message.enable_haptic_feedback);
                localStorage.setItem('pwa-biometric-lock-enabled', r.message.enable_biometric_lock);
            }
        }).catch(err => console.debug("PWA: Could not fetch settings", err));
});




