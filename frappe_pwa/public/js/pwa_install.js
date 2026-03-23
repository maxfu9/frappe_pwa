/* PWA Custom Install Logic */

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    showInstallBanner();
});

// iOS Support: Show manual instructions since beforeinstallprompt isn't supported
window.addEventListener('load', () => {
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isiOS && !isStandalone) {
        showiOSInstallBanner();
    }
});

function showiOSInstallBanner() {
    if (localStorage.getItem('pwa-ios-banner-dismissed')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.classList.add('ios-banner');
    banner.innerHTML = `
        <div class="pwa-banner-content">
            <div class="pwa-banner-icon">
                <i class="fa fa-apple"></i>
            </div>
            <div class="pwa-banner-text">
                <h4>Install on iOS</h4>
                <p>Tap <img src="/assets/frappe_pwa/images/ios_share.png" style="height:20px; vertical-align:middle;"> then <strong>Add to Home Screen</strong>.</p>
            </div>
        </div>
        <div class="pwa-banner-actions">
            <button class="pwa-close-btn" id="pwa-ios-install-close">&times;</button>
        </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('pwa-ios-install-close').addEventListener('click', () => {
        hideInstallBanner();
        localStorage.setItem('pwa-ios-banner-dismissed', Date.now());
    });

    setTimeout(() => banner.classList.add('show'), 1000);
}


function showInstallBanner() {
    if (localStorage.getItem('pwa-banner-dismissed')) return;

    // Create banner if it doesn't exist
    if (!document.getElementById('pwa-install-banner')) {
        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">
                    <i class="fa fa-th"></i>
                </div>
                <div class="pwa-banner-text">
                    <h4>Install ERP App</h4>
                    <p>Access your workspace faster from your home screen.</p>
                </div>
            </div>
            <div class="pwa-banner-actions">
                <button class="pwa-install-btn" id="pwa-install-confirm">Install</button>
                <button class="pwa-close-btn" id="pwa-install-close">&times;</button>
            </div>
        `;
        document.body.appendChild(banner);

        // Haptic on show
        if (window.pwa_native) window.pwa_native.haptic('light');

        document.getElementById('pwa-install-confirm').addEventListener('click', async () => {
            if (!deferredPrompt) return;

            // Haptic on click
            if (window.pwa_native) window.pwa_native.haptic('success');

            // Show the install prompt

            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`PWA: User response to the install prompt: ${outcome}`);
            // We've used the prompt, and can't use it again, throw it away
            deferredPrompt = null;
            // Hide the banner
            hideInstallBanner();
        });

        document.getElementById('pwa-install-close').addEventListener('click', () => {
            hideInstallBanner();
            // Optional: Don't show again for 7 days
            localStorage.setItem('pwa-banner-dismissed', Date.now());
        });

        // Trigger animation
        setTimeout(() => banner.classList.add('show'), 100);
    }
}

function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 600);
    }
}

window.addEventListener('appinstalled', (event) => {
    console.log('PWA: installed');
    deferredPrompt = null;
    hideInstallBanner();
});
