const { Schema, model } = require('mongoose');
const mongoosePagination = require('mongoose-paginate-v2');

const SchemaRaffle = new Schema({
    title : { type: String },
    titleURL : { type : String },// aqui guardamos el titulo que se usara en el url (SEO) Search Engine Optimization (Optimización para Motores de Búsqueda)
    department : { type: String, default: 'raffle' },
    category : { type: String }, //Gratis or Pago
    segment : { type: String }, // normalmente esto seria "All"
    tecnicalDescription : { type: String },
    video : { type : Object, default: [] }, //aqui se guardaria un archivo de video con la informacion del lugar donde esta para ser leido o eliminado.
    images : { type : Object },
    price: { type: Number , default: 0 },
    numTickets : { type: Number }, //cantidad de tikets
    boxTickets : { type: Array },//arreglo de tickets con los datos necesarios.. Datos de este array { "No" : i, "Contestan" : "", "No_Serial" : "", "Date" : "", "Take" : false, "Ref" : "", "Verified" : false, "Winner" : false }
    fundRaising : { type: Number}, //fundraising "recaudación de fondos" esto es (numTikets * price).
    raffleClosingPolicy : { type: String }, //en que forma se cierra el sorteo (By-Date or All-Tikets) por fecha o por venta de todos los tikets.
    CloseDate : { type: Date },//si se configura como By-Date este campo se activa de resto esta en blanco
    numberOfPrizes : { type : Number }, //numero de premios
    PrizesObject : { type : Object, default: [] }, //Array donde se guardaran los lugares y premios [ {Prize : "Monopatin", winTicket : null}, {Prize : "Hoverboard", winTicket : 56} ] || El Valor de winTicket inicia siendo null y luego se inserta al confirmarse que todos los ticket han sido tomados o verificados.  
    dateStart : { type : String }, //fecha formateada para indicar de forma rapida cuando creo el sorteo. no se guarda como Date ya que no se hara operaciones con esta fecha, solo e spara mostrarlo en el front
    dateEnd : { type : Date }, //solo para mostrar fecha de cierre en el front
    paused : { type: Boolean, default: true }, //por default nace false quiere decir que NO se mostrará. Sí este estado cambia se mostrará en la busqueda.
    visibleStore : { type: Boolean, default: true }, //este campo guarda el estado de vision en la tienda, por defecto es true que se vea en tienda el articulo.
    country : { type: String }, //aqui el pais de donde es este anuncio, ejemplo Venezuela, Colombia. 
    countryCode : { type: String }, //aqui el codigo del pais, si es venezuela seria (ve) y es lo que mostrara cuando el sservidor detecte que estamos en venezuela.
    state_province : { type: String },
    view : { type : Number, default : 0 }, //Datos para el vistometro: aqui tenemos la cantidad de vistas que tiene este producto.
    spread : { type : Object, default : { spreading : false, time : null } }, //este campo es para identificar si se ha hecho la accion de "Difundir entre sus seguidores". 
    stock : { type: Boolean, default: true },
    favorite : { type : Number, default : 0 }, //Datos para el Fascinometro: conocer cuantas personas han agregado este articulo y tener metricas de este dato.
    allTicketsTake : { type : Boolean, default : false }, //esto es lo que determina si un sorteo sea celebrado. Importante ya que de esto depende un cambio en el Front para que los ganadores puedan calificar en la Tabla de Tickets.
    user_id : { type: String }, //aqui guardamos el id del user del usuario que publica el anuncio(indexed).
    username : { type : String }, //este es el username del creador igual al de la coleccion user y profile.
    blissName : { type : String }, //este es el nombre del anfitrion 
    notes : { type : Object, default: [] } //aqui es donde se guardan las notas creadas por el anfitrion de la publicación.
    
}, {
    timestamps : true
});

SchemaRaffle.plugin(mongoosePagination);

module.exports = model('raffleModel', SchemaRaffle, 'raffle');
