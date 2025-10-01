                                     

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



//---------- icono que cierra el contenedor de No estas Loegado ---------------------------
  //que hace este script? este es el icono (x) que cierra el mensaje de No estas logeado que aparece en 
  //el home y en el view-general-product *
  
    const containerFixedSinUser = document.querySelector('.containerFixedSinUser');
    const btnXSinUser = document.querySelector('#btnXSinUser');

    if (btnXSinUser){
        btnXSinUser.addEventListener('click', ()=>{
            containerFixedSinUser.classList.add("close"); //quitamos el contenedor para que no le moleste, no quiere logearse
        })
    }

    console.log("Hola mundo cruel aqui estamos desde public/js/index.js");
//-----------------------------------------------------------------------------------------    