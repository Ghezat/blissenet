const { Schema, model } = require('mongoose');

const bankUserSchema = new Schema({
    indexed : { type : String }, // id del profile esto es para uso interno y poder identificar.
    username : { type : String}, //este campo esta tambien en la coleccion profile.
    pagoMovil : { type : Object }, //los datos aqui son {bankPagoMovil, codPagoMovil, docPagoMovil, telePagoMovil} 
    transfBank : { type : Object } //los datos aqui son {bankPagoTransf, codPagoTransf, accountNumberTransf, toNameTransf, docPagoTransf}
},{
    timestamps : true
});

module.exports = model('bankUserModel', bankUserSchema, 'bankUser');

