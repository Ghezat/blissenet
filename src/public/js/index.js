                                     

// Instalación del SW
self.addEventListener('install', event => {
  console.log('Service Worker instalado');
  self.skipWaiting(); // Para activar SW inmediatamente
});

// Activación del SW
self.addEventListener('activate', event => {
  console.log('Service Worker activado');
  return self.clients.claim(); // Para tomar control rápido de las páginas
});

// Fetch simple: solo responde con la red (sin caché por ahora)
self.addEventListener('fetch', event => {
  // Puedes dejar vacío o simplemente pasar la petición
});

