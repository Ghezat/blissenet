const { Schema, model } = require('mongoose');
const mongoosePagination = require('mongoose-paginate-v2');

const SchemaAuctions = new Schema({
    title : { type: String },
    titleURL : { type : String },// aqui guardamos el titulo que se usara en el url (SEO) Search Engine Optimization (Optimización para Motores de Búsqueda)
    department : { type: String, default: 'auctions' },
    category : { type: String },
    sub_category : { type: String },
    segment : { type: String }, // normalmente esto seria "All"
    state_use : { type: String },
    tecnicalDescription : { type: String },
    generalMessage: { type: String },
    video : { type : Object, default: [] }, //aqui se guardaria un archivo de video con la informacion del lugar donde esta para ser leido o eliminado.
    images : { type : Object }, 
    sound : { type : Object, default: [] }, //aqui se guardaria un archico de audio con la informacion del lugar donde esta para ser leido o eliminado.
    price: { type: Number , default: 0 },
    paused : { type: Boolean, default: true }, //por default nace false quiere decir que NO se mostrará. Sí este estado cambia se mostrará en la busqueda.
    visibleStore : { type: Boolean, default: true }, //este campo guarda el estado de vision en la tienda, por defecto es true que se vea en tienda el articulo.
    active : { type : Boolean, default: false }, //este atributo es el que indica si esta activa o no la subasta (en ejecucion)
    auctionDate : { type : String }, //esta es la fecha en la que se comenzara la subasta. 
    biddingTime : { type : Number, default: 2 }, //el tiempo por defecto será de 2 horas, pero peude ser configurado por 4 tambien como su tiempo maximo para la ejecucion de las ofertas.
    auctionDateClose : { type : String }, //aqui esta la fecha y hora de cierre de subasta. Se armara independientemente de cualquier situacion de horas, fechas y años. este es uno de los script mas geniales que he construido podras verlo en el department auction antes de crear el objeto subasta.
    participants : { type : Object, default: [] }, //este es el array que albergará todos los participantes { user, amount, date }
    offer : { type: Boolean, default: false },
    onlyOneAvailable : { type: Boolean, default: false },
    bestProduct : { type: Boolean, default: false },
    state_province : { type: String }, //estado o provincia se guardara en este campo del modelo.
    view : { type : Number, default : 0 }, //aqui tenemos la cantidad de vistas que tiene este producto.
    spread : { type : Object, default : { spreading : false, time : null } }, //este campo es para identificar si se ha hecho la accion de "Difundir entre sus seguidores". 
    stock : { type: Boolean, default: true },
    favorite : { type : Number, default : 0 }, //para conocer cuantas personas han agregado este articulo y tener metricas de este dato.
    user_id : { type: String }, //aqui guardamos el id del user del usuario que publica el anuncio(indexed).
    username : { type : String }, //este es el username igual al de la coleccion user y profile.
    notes : { type : Object, default: [] } //aqui es donde se guardan las notas creadas por el anfitrion de la publicación.
}, {
    timestamps : true
});

SchemaAuctions.plugin(mongoosePagination);

module.exports = model('auctionsModel', SchemaAuctions, 'auctions');