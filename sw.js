/* Root-scoped service worker for Tan Ara browser push notifications. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data = { title: 'تن‌آرا', body: 'نوبت جدیدی ثبت شده است.' };
  try {
    data = event.data ? event.data.json() : data;
  } catch (_) {
    try { data = { ...data, body: event.data?.text() || data.body }; } catch (__) { /* use fallback */ }
  }
  event.waitUntil(self.registration.showNotification(data.title || 'تن‌آرا', {
    body: data.body || '',
    icon: '/tanara-logo.jpg',
    badge: '/tanara-logo.jpg',
    dir: 'rtl',
    lang: 'fa',
    tag: data.tag || 'tanara-booking',
    data: { url: data.url || '/' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const client of list) {
      if ('focus' in client) {
        if ('navigate' in client) client.navigate(url).catch(() => {});
        return client.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
