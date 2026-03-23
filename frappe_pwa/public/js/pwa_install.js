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

        document.getElementById('pwa-install-confirm').addEventListener('click', async () => {
            if (!deferredPrompt) return;
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
