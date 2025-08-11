const { Schema, model } = require('mongoose');
const mongoosePagination = require('mongoose-paginate-v2');

const SchemaProfile = new Schema({
    username : { type : String }, //este username es el mismo que se puede ver en la coleccion user.
    names : { type : String },
    identification : { type : String }, //numero de cedula o de identificacion
    dateborn : { type : Date }, //fecha de nacimiento de la persona
    gender : { type : String }, //sexo masculino o femenino
    company : { type : String }, //nombre de la compañia/empresa
    companyRif : { type : String }, //identificacion de la empresa
    geolocation : { type : Object}, //geolocation: { lon: '', lat: '' } objeto donde guardamos las coordenadas geograficas del este susuario.
    locations: {
           type: {
               type: String, // 'Point'
               enum: ['Point'],
               required: true
           },
           coordinates: {
               type: [Number], // [lon, lat] array locations.coordinates
               required: true
           }
    }, //este campo esta creado para optimizar las busquedas de aproximacion geografico
    country : { type : String },  //pais
    countryCode : { type : String },  //codigo del pais
    state : { type : String },  //estado o provincia
    quarter : { type : String },
    cityBlock : { type : String },
    postCode : { type : String },
    city : { type : String },
    suburb : { type : String },

    address : { type : String }, //direccion del usuario (dato importante para sus futuras facturas). Ultimo atributo creado. 
    phone : { type : String },
    phoneAlt : { type : String },
    profileMessage : { type : String }, //mensaje de la tienda
    bannerPerfil : { type : Object , default : {} }, //guarada el objeto donde esta la url del banner de la tienda. 
    avatarPerfil : { type : Object , default : {} }, //guarda el objeto dodne esta la url del avatar de la tienda.
    mailhash : { type : String }, //este dato tambien existe en la coleccion user. aqui se guarda por default el hash que produce el avatar por default.
    bGColorText : { type : String , default : '#1a1a1a' }, //podemos dar el color que tendra el texto;
    bGColorTopbar : { type : String , default : '#f8f9fa' }, //podemos dar el color que tendra la barra superior donde esta el avatar y el mensaje del sistio;
    bGColorGallery : { type : String , default : '#131313' }, //podemos dar el color que queramos para la seccion de galeria;
    bGColorWorkspace : { type : String , default : '#ffffff' }, //podemos dar el color que queramos para el sitio de trabajo donde estaran los articulos del sitio;
    searchFilter : { type : String, default : "off" }, //esto es para colocar el buscador en la tienda. !IMPORTANTE
    facebook : { type : String }, 
    instagram : { type : String },
    youtube : { type : String },
    tiktok : { type : String },
    favoritestores : { type : Array }, //"Siguiendo" un array de todas las tiendas que sigo o mis tiendas favoritas.
    followMe : { type : Array }, // "Me siguen" un array de todas las cuentas que me estan siguiendo.
    segment : {  type : Array, default : [ "All" ] }, //por defecto el profile nace con el objeto segment ya definido. Esto es el campo requerido para segmentar
    gallery : { type : Object, default : 
        { carouselOffert : { show : false }, sectionMedia : { show : false, data : [] }, carouselImages : { show : false, data : [] }, carouselBanner : { show : false, data : [] } }}, // Este objeto tiene internamente 4 objetos para poder manejar todos los recursos que estaran en galeria.
    infobliss : { type : Object, default : 
        { policy : { show : false, data : [] }, faq : { show : false, data : [] }, survey : { show : false, scheme : [] }, map : { show : false }}}, // Este objeto tiene internamente 4 objetos para poder manejar todos los recursos que estaran en infobliss.
    //dentro de survey.scheme : [ { surveyId: "123478981153", surveyTitle: "Encuesta de satisfaccion 2025", surveyTime: '10-3-2025',  surveyData: [ { question : "pregunta1", boxResponses : ["Si, "No", "Quizas"] }, { question : "pregunta2", boxResponses : ["Likert"] }, {...} ]   } ]
    paused : { type: Boolean, default: false }, //por default nace false. este campo se utilizará para impedir que un usuario moroso con sus impagos pueda crear, editar y eliminar publicaciones. será la unica forma existente para presionar a los usuarios morosos. 
    view : { type : Number, default: 0  }, //este campo permite tener la cantidad de veces que entran en la tienda. 
    hashtags : { type : Object , default : [] }, //este campo crea por defecto un objeto vacio, en el se agregara un array con las diferentes palabras claves de la tienda. 
    sellPolicy : { type : Object, default : { "Envio Local" : true, "Envio Interurbano" : false, "Envio Internacional" : false }}, 
    buyCar : { type : Boolean , default : false}, //por defecto todos tienen este valor false a menos que desee activarlo y para ello debe tener al menos 11 articulos. SOlo funciona para articulos y artes
    transportAgent : { type : Object, default : { deliveryTransport : false, active: false } }, //este objeto guarda el estado del perfil esto indica que es un agente de transporte para hacer deliveries para "envios locales"
    sellerType : { type : Object, default: { local: "true", nacional: "false", internacional: "false" } }, //aqui guardamos los valores de estas tres variables  (Interurbano, Nacional, Internacional ), Esto es para otorgar al vendedor la capacidad de decidir si quiere vender en su misma ciudad, en ciudades de otros estados o provincias e incluso poder hacer comercio en otros paises. Este sera un valor que se usara como criterio para el vendedor no para el comprador.
    indexed :  { type : String }  //este es el id del user     
},{
    timestamps : true
});

SchemaProfile.plugin(mongoosePagination);

// Asegúrate de crear un índice 2dsphere para el campo location
SchemaProfile.index({ locations: '2dsphere' });
module.exports = model('profileModel', SchemaProfile, "profiles");


//politica cambiada por una menos ruda.
//paused : { type: Boolean, default: false }, //por default nace false quiere decir que se mostrará. Sí este estado cambia no se mostrará en la busqueda. esto es para que admisnitracion pueda pasuar o activar una tienda.

//Si en algún momento necesitas realizar consultas geoespaciales, puedes usar algo como:
/* 
javascript
const nearbyProfiles = await profileModel.find({
    location: {
        $near: {
            $geometry: {
                type: 'Point',
                coordinates: [-61.898752, 8.0150528] // ejemplo de coordenadas
            },
            $maxDistance: 5000 // distancia máxima en metros
        }
    }
});

 */