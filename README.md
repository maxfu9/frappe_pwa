# Frappe PWA Utility

A Frappe app to enhance your site with Progressive Web App (PWA) capabilities, including service worker registration, web manifest support, and navigation improvements for mobile devices.

## Features

- **PWA Support**: Adds a `manifest.json` for "Add to Home Screen" functionality.
- **Service Worker**: Provides a background service worker for offline support and asset caching.
- **Navigation Fixes**: Enhances the user experience on mobile by handling navigation events and providing an offline fallback.
- **Push Notifications**: Foundations for stacking and managing push notifications on desktop and mobile.
- **Easy Integration**: Hooks directly into the Frappe Desk and Website view.

## Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app https://github.com/maxfu9/frappe_pwa
bench install-app frappe_pwa
```

## How It Works

- **`manifest.json`**: Configures the app name, icons, and theme colors for standalone display.
- **`sw.js`**: A service worker that caches the offline page and intercepts navigation requests to provide a fallback when the network is unavailable.
- **`pwa_loader.js`**: Automatically registered via `hooks.py` to initialize the service worker in the browser.

## Contributing

This app uses `pre-commit` for code formatting and linting.

```bash
cd apps/frappe_pwa
pre-commit install
```

Tools used: `ruff`, `eslint`, `prettier`, `pyupgrade`.

## License

MIT

