importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

// Caching-Strategien
workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.NetworkFirst()
);

// Push-Benachrichtigungen
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};

    // Überprüfen, ob die Nachricht nicht vom Bot stammt und keine Benachrichtigung für diese Nachricht bereits gesendet wurde
    if (data.username !== 'ChatCord Bot' && !self.notificationSent) {
        const options = {
            body: data.body || 'Push message no payload',
            icon: 'public/img/icons/icon-256.png', // Pfad zu Ihrem Logo
            badge: 'public/img/icons/icon-256.png', // Pfad zu Ihrem Badge
            data: data
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'New Message', options).then(() => {
                self.notificationSent = true; // Markieren Sie die Benachrichtigung als gesendet
            })
        );
    }
});
