const { Schema, model } = require('mongoose');

const negotiationSchema = new Schema({
    usernameBuy : { type : String }, //este campo esta tambien en la coleccion profile.
    usernameSell : { type : String }, //este campo esta tambien en la coleccion profile.
    department : { type : String },
    title : { type : String },
    tecnicalDescription : { type : String },
    image : { type : Array }, //aqui solo existira dos atributos con sus valores public_id y url. 
    price : { type : Number }, 
    written : { type : Array }, //dentro habitara una coleccion de objetos con el campo user y written
    closedContact : { type : Boolean, default : false },
    visibleBuy : { type : Boolean, default : true }, //control sobre la visibilidad de este documento solo podrá ser activado por el comprador -- cambia de estado al darle un click al boton rojo (x).
    visibleSell : { type : Boolean, default : true }, //control sobre la visibilidad de este documento solo podrá ser activado por el vendedor -- cambia de estado al darle un click al boton rojo (x).
    refer : { type : Number, default : 0 }, //este es el numero de confirmacion o referencia que introduce el vendedor para pagar a la plataforma el porcentaje por la venta.
    process : { type : Boolean, default : false }, //este dato sera true cuando sea procesado la factura. este dato lo actualiza el admin que procesa este pago.
    commission : { type : Number }, //esto es el profit de la empresa y plataforma de compra y venta.
    bank : { type : String, default : "no_bank" }, //aqui guarda el vendedor el banco donde hizo el pago de la comision.
    payCommission : { type : Boolean, default : false  }, //aqui guardamos si el usuario pago o no su comision de venta. 
    userDeclare : { type : Boolean, default : false } //este dato es para delcarar que el usuario a declarado su pago cuando sea true es que el cliente ha declarado su pago
    
},{
    timestamps : true
});

module.exports = model('negotiationModel', negotiationSchema, 'negotiations');

//este esquema es muy parecido al de buySell.js a excepcion de algunos campos que aqui no son necesarios.
//como el rating, comentarios, cancel y pay.
//en este esquema solo se guarda la informacion basico de ambos contactos para que ellos puedan escribirse y cerrar la sala cuando uno de ambos asi lo decida.

