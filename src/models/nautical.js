const { Schema, model } = require('mongoose');
const mongoosePagination = require('mongoose-paginate-v2');

const SchemaNautico = new Schema({
    title : { type: String },
    department : { type: String, default: 'nautical' },
    category : { type: String},
    sub_category : { type: String },
    construcDate: { type: Number },
    length: { type: Number }, // longitud de eslora
    tecnicalDescription : { type: String},
    generalMessage: { type: String },
    video : { type : Object, default: [] }, //aqui se guardaria un archivo de video con la informacion del lugar donde esta para ser leido o eliminado.
    images : { type : Object },
    price: { type: Number , default: 0},
    paused : { type: Boolean, default: false }, //por default nace false quiere decir que se mostrará. Sí este estado cambia no se mostrará en la busqueda.
    visibleStore : { type: Boolean, default: true }, //este campo guarda el estado de vision en la tienda, por defecto es true que se vea en tienda el articulo.
    offer : { type: Boolean, default: false },
    onlyOneAvailable : { type: Boolean, default: false },
    bestProduct : { type: Boolean, default: false },
    state_province : { type: String },
    view : { type : Number, default : 0 }, //aqui tenemos la cantidad de vistas que tiene este producto.
    spread : { type : Object, default : { spreading : false, time : null } }, //este campo es para identificar si se ha hecho la accion de "Difundir entre sus seguidores". 
    stock : { type: Boolean, default: true},
    favorite : { type : Number, default : 0 }, //para conocer cuantas personas han agregado este articulo y tener metricas de este dato.
    user_id : { type: String },
    username : { type : String } //este es el username igual al de la coleccion user y profile.

}, {
    timestamps : true
});

SchemaNautico.plugin(mongoosePagination);

module.exports = model('nauticoModel', SchemaNautico, 'nauticos');

