self.addEventListener('push', function (event) {
  const data = event.data?.json() || { 
    title: 'MorningKaki', 
    body: 'Your morning is ready.',
    url: '/'
  };
  
  console.log("Push received:", data);
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: data.url
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
