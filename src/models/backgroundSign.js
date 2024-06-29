const { Schema, model } = require('mongoose');

const backgroundSignSchema = new Schema({

    active : { type : Boolean }, //true or false, si esta en true porque esta activo y se vera y si esta en false es porque ya no aparecera porque ya caduco su tiempo de visibilidad. y ya no puede volver a verse. esto es para tener un registro de todo lo que se ha hecho en este departamento.
    typeBackground : { type : String }, //puede ser signIn or signUp.
    codeBackground : { type : String }, //esto es un codigo para pdoer tener una referencia ya que no posee un titulo.
    url : { type : String }, //aqui el url de la imagen para acceder a ella.
    public_id : { type : String }, //el public_id para acceder a ella en la nube y poder editar/eliminar.
    adminName : { type : String } //aqui el admin que agrego los banner.

},{
    timestamps : true
});

module.exports = model('backgroundSignModel', backgroundSignSchema, 'backgroundSign');
