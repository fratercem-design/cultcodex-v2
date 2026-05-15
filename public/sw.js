self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "The stream is live!",
    icon: data.icon || "/logo.jpg",
    badge: data.badge || "/favicon.jpg",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/live" },
    actions: [{ action: "watch", title: "Watch Now" }],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "Cult of Psyche is LIVE!",
      options
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/live";
  event.waitUntil(clients.openWindow(url));
});
