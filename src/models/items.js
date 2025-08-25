const { Schema, model } = require('mongoose');
const mongoosePagination = require('mongoose-paginate-v2');

const SchemaItems = new Schema({
    title : { type: String },
    titleURL : { type : String },// aqui guardamos el titulo que se usara en el url (SEO) Search Engine Optimization (Optimización para Motores de Búsqueda)
    department : { type: String, default: 'items' },
    category : { type: String },
    sub_category : { type: String },
    segment : { type: String }, // normalmente esto seria "All"
    state_use : { type: String },
    tecnicalDescription : { type: String },
    generalMessage: { type: String },
    video : { type : Object, default: [] }, //aqui se guardaria un archivo de video con la informacion del lugar donde esta para ser leido o eliminado.
    images : { type : Object },
    count : { type : Number }, // aqui la cantidad de unidades disponibles de este articulo.
    presentation : { type : String }, // "integer" o "fraction" aqui se configura entero o fracciones Esto es mas que todo para poder consolidar con exactitud las cosas que requieran fracciones como el peso del queso o la carne o entero como una mayonesa o un par de zapatos. 
    price: { type: Number , default: 0 },
    paused : { type: Boolean, default: false }, //por default nace false quiere decir que se mostrará. Sí este estado cambia no se mostrará en la busqueda.
    visibleStore : { type: Boolean, default: true }, //este campo guarda el estado de vision en la tienda, por defecto es true que se vea en tienda el articulo.
    offer : { type: Boolean, default: false },
    onlyOneAvailable : { type: Boolean, default: false },
    bestProduct : { type: Boolean, default: false },
    delivery : { type: Boolean, default: false },
    soldOut : { type : Boolean, default: false }, //agotado solo para articulos y artes.
    purchaseTime : { type : Object, default : [] }, //este campo solo existe en items y en artes. aqui solo se guardan indexed con la finalidad de que cuando este articulo deje de estar agotado le envie mensajes a todos los que le dieron a "Avisarme cuando este disponible" solo enviará notificaciones al inbox.   
    country : { type: String }, //aqui el pais de donde es este anuncio, ejemplo Venezuela, Colombia. 
    countryCode : { type: String }, //aqui el codigo del pais, si es venezuela seria (ve) y es lo que mostrara cuando el sservidor detecte que estamos en venezuela.
    state_province : { type: String }, //estado o provincia se guardara en este campo del modelo.
    view : { type : Number, default : 0 }, //aqui tenemos la cantidad de vistas que tiene este producto.
    spread : { type : Object, default : { spreading : false, time : null } }, //este campo es para identificar si se ha hecho la accion de "Difundir entre sus seguidores". 
    stock : { type: Boolean, default: true },
    favorite : { type : Number, default : 0 }, //para conocer cuantas personas han agregado este articulo y tener metricas de este dato.
    user_id : { type: String }, //aqui guardamos el id del user del usuario que publica el anuncio(indexed).
    username : { type : String }, //este es el username igual al de la coleccion user y profile.
    sales : { type : Number, default : 0 } //cantidad de veces que se ha vendido este articulo, solo existe en items y artes.
}, {
    timestamps : true
});

SchemaItems.plugin(mongoosePagination);

module.exports = model('itemsModel', SchemaItems, 'items');