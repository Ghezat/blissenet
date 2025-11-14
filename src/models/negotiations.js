const { Schema, model } = require('mongoose');

const negotiationSchema = new Schema({
    usernameBuy : { type : String }, //este campo esta tambien en la coleccion profile.
    usernameSell : { type : String }, //este campo esta tambien en la coleccion profile.
    indexedSell : { type : String }, //aqui se guardara el id del user (usernameSell); importante para luego detectar rapidamente si tiene facturas impagas y cuantas.
    indexedBuy : { type : String }, //aqui se guardara el id del user (usernameBuy); importante para luego detectar rapidamente si tiene facturas impagas y cuantas.
    department : { type : String },
    title : { type : String },
    title_id : { type : String }, //este es el id del articulo o del arte o del auto o de lo que sea que se este vendiendo o alquilando
    fechaNegotiation : { type : String },
    tecnicalDescription : { type : String },
    image : { type : Array }, //aqui solo existira dos atributos con sus valores public_id y url. 
    voucherImage: { type: Array, default: [ ] },// [ { url: 'https://bucket-blissve.nyc3.digitaloceanspaces.com/voucher/1749994166924.jpg', public_id: 'voucher/1749994166924.jpg', bytes: 63282, format: 'jpg' }]
    price : { type : Number }, 
    scheduleAppointment: { type : Object }, //aqui guardamos el mismo objeto que posee dos arrays days & rangeTime. Este campo existe en los modelos: airplane, automotive, nautical, realstate y services. 
    optionTime : { type : Object }, //aqui guardamos el rango de horas en un array [ "14:00", "15:00", "16:00", "17:00" ];
    appointment : { type : String, default: "" }, //aqui dejamos este valor en blanco peor ya existe el campo al ser creado el objeto. aqui estara el valor de la cita en este formato. dd-mm-yyy hh:mm
    written : { type : Array }, //dentro habitara una coleccion de objetos con el campo user y written
    ratingSeller :  { type : Number, default : 0 }, //existes 4 valores para el rating el inicial es vacio, este puede terminar siendo positivo, negativo o neutro
    ratingBuy :  { type : Number, default : 0 }, //existes 4 valores para el rating el inicial es vacio, este puede terminar siendo positivo, negativo o neutro
    CommentSeller :  { type : String, default : "no_comment" },   
    CommentBuy :  { type : String, default : "no_comment" },
    visibleBuy : { type : Boolean, default : true }, //control sobre la visibilidad de este documento solo podrá ser activado por el comprador -- cambia de estado al darle un click al boton rojo (x).
    visibleSell : { type : Boolean, default : true }, //control sobre la visibilidad de este documento solo podrá ser activado por el vendedor -- cambia de estado al darle un click al boton rojo (x).
    refer : { type : Number, default : 0 }, //este es el numero de confirmacion o referencia que introduce el vendedor para pagar a la plataforma el porcentaje por la venta.
    process : { type : Boolean, default : false }, //este dato sera true cuando sea procesado la factura. este dato lo actualiza el admin que procesa este pago.
    commission : { type : Number }, //esto es el profit de la empresa y plataforma de compra y venta.
    bank : { type : String, default : "no_bank" }, //aqui guarda el vendedor el banco donde hizo el pago de la comision.
    payCommission : { type : Boolean, default : false  }, //aqui guardamos si el usuario pago o no su comision de venta. 
    userDeclare : { type : Boolean, default : false }, //este dato es para delcarar que el usuario a declarado su pago cuando sea true es que el cliente ha declarado su pago
    closeOperationSeller : { type : Boolean, default : false }, // con este campo manejamos el estado de la operacion de compra. por defecto nace false pero en el proceso puede pasar a ser true que significa que se ha cerrado la operacion. esto no debe confundirse con "cancel". esto es para cerrar la operacion cuando ya no se requiera tener mas comunicacion con la contraparte. se ha cerrado la sala de negociacion.
    closeOperationBuy : { type : Boolean, default : false }, // por defecto nacen con el valor false. cada sala es independiente y cada quien decide cuando cerrarlo
    fullScreen : { type : Boolean, default : false }, //por defecto es false el chat estara contraido.
    date : { type : String} //fecha in formato dd-mm-yyy hh:mm
},{
    timestamps : true
});

module.exports = model('negotiationModel', negotiationSchema, 'negotiations');

//este esquema es muy parecido al de buySell.js a excepcion de algunos campos que aqui no son necesarios.
//como el rating, comentarios, cancel y pay.
//en este esquema solo se guarda la informacion basico de ambos contactos para que ellos puedan escribirse y cerrar la sala cuando uno de ambos asi lo decida.
