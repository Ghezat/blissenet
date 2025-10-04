                                     

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

    function mostrarToast(mensaje, posicion, color, titulo = '', conBotonCerrar = false) {
        // Configuración predeterminada
        toastr.options = {
            "closeButton": conBotonCerrar, // Agregar botón de cerrar si se solicita
            "debug": false,
            "newestOnTop": false,
            "progressBar": !conBotonCerrar, // Si tiene botón de cerrar, no mostrar barra de progreso
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "600",
            "hideDuration": "1000",
            "timeOut": conBotonCerrar ? false : "8000", // No se oculta automáticamente si tiene botón de cerrar
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
  
        // Configurar la posición
        switch (posicion) {
            case 'center':
                toastr.options.positionClass = 'toast-top-center';
                break;
            case 'left':
                toastr.options.positionClass = 'toast-top-left';
                break;
            case 'right':
                toastr.options.positionClass = 'toast-top-right';
                break;
            default:
                toastr.options.positionClass = 'toast-top-right'; // Posición predeterminada
        }
  
        // Mostrar el mensaje según el color especificado
        switch (color) {
            case 'success':
                titulo ? toastr.success(mensaje, titulo) : toastr.success(mensaje);
                break;
            case 'info':
                titulo ? toastr.info(mensaje, titulo) : toastr.info(mensaje);
                break;
            case 'warning':
                titulo ? toastr.warning(mensaje, titulo) : toastr.warning(mensaje);
                break;
            case 'danger':
                titulo ? toastr.error(mensaje, titulo) : toastr.error(mensaje);
                break;
            case 'primary':
                titulo ? toastr.info(mensaje, titulo, { toastClass: 'toast-primary' }) : toastr.info(mensaje, '', { toastClass: 'toast-primary' });
                break;
            case 'dark':
                titulo ? toastr.info(mensaje, titulo, { toastClass: 'toast-dark' }) : toastr.info(mensaje, '', { toastClass: 'toast-dark' });
                break;
            default:
                console.warn('Color no válido. Usando el color por defecto (success).');
                titulo ? toastr.success(mensaje, titulo) : toastr.success(mensaje);
        }
    }
  
    //mostrarToast( response , 'right', 'danger', '', true ); // Agrega título aquí
  
    //esta funcion ahaora la tienen todas las paginas