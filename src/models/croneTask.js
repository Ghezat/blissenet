const { Schema, model } = require('mongoose');

const croneSchema = new Schema({
  
    cronoDate : { type : String }, //este es la fecha guia de todos
    croneUpdateRate : { type : String }, //aqui fecha de actualizacion de tasa del dolar vs VES
    croneDeleteUsers : { type : String }, //aqui fecha de actualizacion de la eliminacion de usuarios sin validar
    croneDeleteAdmin : { type : String }, //aqui fecha de actualizacion de la eliinacion de admin sin validar
    croneDeleteADS : { type : String }, //aqui fecha de actualizacion de eliminacion de anuncios (contacto) que tienen mas de un año
    croneDeleteUpload : { type : String }, //aqui fecha de actualizacion de eliminacion de archivos que se alojan en la carpeta upload. Importante que se eliminen automaticamente todos los dias y nunca de forma manual. ya que esto puede ocacionar un accidente, eliminar una carpeta del sistema. aeroplanos, automotriz, nautico, realstate, service.  todas las fechas seran dd-mm-yyyy
    croneUnlockedUsers : { type : String }, //aqui la fecha de actualizacion y desbloqueo de usuarios baneados.
    croneDeleteBuySell : { type : String } //aqui la fecha de actualizacion de eliminacion de todos los buySell que se han cancelado.
},{    
    timestamps : true
});

module.exports = model('croneModel', croneSchema, 'croneTask');