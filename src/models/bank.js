const { Schema, model } = require('mongoose');

const banckSchema = new Schema({
    bankname : { type : String }, //este es la entidad bancaria.
    codbank : { type : String }, //aqui el codigo del banco.
    accountowner : { type : String }, //aqui va el nombre de la empresa propietaria de la cuenta bancaria.
    accountnumber : { type : String }, //aqui el numero de cuenta para transferencia. "Lo he cambiado a String para dar posibilidad a poder escribir algo como - 'recibo de cortesia' cuando sea el caso de que no se use ningun banco"
    phonenumber : { type : String }, //aqui el numero de telefono para pago movil.
    rif : { type : String }, //aqui el rif de la empresa
    lock : { type : Boolean,  default : false }, // con esto puedo bloquear o desbloquera una cuenta bancaria. importante para cunado no quiera que lo susuarios no depositen en una cuenta por algun motivo. 
    adminName : { type : String } //aqui el admin que agrego la cuenta bancaria.
},{
    timestamps : true
});

module.exports = model('bankModel', banckSchema, 'banks');