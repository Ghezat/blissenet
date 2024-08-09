const { Schema, model } = require('mongoose');

const newsDaySchema = new Schema({
    active : { type : Boolean }, //true or false, si esta en true porque esta activo y se vera y si esta en false es porque ya no aparecera porque ya caduco su tiempo de visibilidad. y ya no puede volver a verse. esto es para tener un registro de todo lo que se ha hecho en este departamento.
    typeNewsDay : { type : String },  //admin or customer
    customerName : { type : String },  //aqui el nombre del la cuenta del username eje. loren13 esto es para redireccionar desde el banner a su Store.
    timeDays : { type : Number },  //7
    newDayTitle : { type : String }, //aqui el titulo de la noticia.
    newDayDetails : { type : String }, //aqui el contenido de la noticia.
    url : { type : String }, //aqui el url de la imagen para acceder a ella.
    public_id : { type : String }, //el public_id para acceder a ella en l anube y poder editar/eliminar.
    sorting : { type : Number }, //aqui el numero de orden a futuro puede ser de utilidad para su ordenamiento.
    adminName : { type : String }, //aqui el admin que agrega le newsDay.
    simplifiedDate : { type : String }, //fecha simplicada. que se requiere en el Front.
    endPublic : { type : String }, //este campo almacena la fecha en que va a terminar la publicacion y podria ser eliminada.
    delete : { type : Boolean, default : false } //campo que determina si se ha elimando el public en Spaces.

},{
    timestamps : true
});

module.exports = model('newsDayModel', newsDaySchema, 'newsDay');
