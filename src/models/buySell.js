const { Schema, model } = require('mongoose');

const buySellSchema = new Schema({
    usernameBuy : { type : String }, //este campo esta tambien en la coleccion profile.
    usernameSell : { type : String }, //este campo esta tambien en la coleccion profile.
    indexed : { type : String }, //aqui se guardara el id del user (usernameSell); importante para luego detectar rapidamente si tiene facturas impagas y cuantas.
    department : { type : String },
    title : { type : String },
    title_id : { type : String },
    tecnicalDescription : { type : String },
    image : { type : Array }, //aqui solo existira dos atributos con sus valores public_id y url. 
    price : { type : Number }, 
    pay : { type : Boolean, default : false },
    confirmPay : { type : String, default : "" }, // este campo puede tener tres valores, 1(sin valor) por default, 2(yes) el vendedor confirma el pago , 3(no) el vendedor confirma que no pago.
    written : { type : Array }, //dentro habitara una coleccion de objetos con el campo user y written
    ratingSeller :  { type : String, default : "" }, //existes 4 valores para el rating el inicial es vacio, este puede terminar siendo positivo, negativo o neutro
    ratingBuy :  { type : String, default : "" }, //existes 4 valores para el rating el inicial es vacio, este puede terminar siendo positivo, negativo o neutro
    CommentSeller :  { type : String, default : "no_comment" },   
    CommentBuy :  { type : String, default : "no_comment" },
    cancel : { type : Boolean, default : false }, //este dato sera true cuando la venta sea cancelada y sera false cuando la venta esta en pie o efectiva.
    refer : { type : Number, default : 0 }, //este es el numero de confirmacion o referencia que introduce el vendedor para pagar a la plataforma el porcentaje por la venta.
    admin : { type : String, default : "no_admin" }, //aqui va el username del admin que va a procesar este pago
    process : { type : Boolean, default : false }, //este dato sera true cuando sea procesado la factura. este dato lo actualiza el admin que procesa este pago.
    commission : { type : Number }, //esto es el profit de la empresa y plataforma de compra y venta.
    montoPay : { type : Number, default : 0}, //esto es el monto que debera pagar el usuario, se actualiza en el preciso momento que este va a pagar, tomando como dato el precio actual del dolar y multiplicandolo por la comission a pagar.
    bank : { type : String, default : "no_bank" }, //aqui guarda el vendedor el banco donde hizo el pago de la comision.
    payCommission : { type : Boolean, default : false  }, //aqui guardamos si el usuario pago o no su comision de venta. 
    userDeclare : { type : Boolean, default : false }, //este dato es para registrar que el usuario a declarado su pago, cuando sea true es que el cliente ha declarado su pago.
    dates : { type : String, default : "no_dates" }// aqui vamos a meter la fecha con el formato necesario. eje. 10-11-2023 esta fecha es el dia que el usuario se dispuso hacer su pago. es la fecha que paga a la plataforma.
},{
    timestamps : true
});

module.exports = model('buySellModel', buySellSchema, 'bullSells');


//Nota: este modelo es usado para registrar todo lo referente a la compra/venta 
//perteneciente a los departamentos (Artes, Items y Auctions).
//en los otros departamentos se usa la coleccion invoice.

//          :::::::: Importante :::::::::
// Se debe comprender que el sistema esta dividido en dos bloques 
// Arte, Items y Auctions pertenecen a un mismo grupo donde en el  mismo documento tienen toda la informacion en buySell esto es porque aqui los participantes interactuan a traves de calificaciones 
// Automitriz, Nautico, Aeroplanos, Realstate y Servicio no cuentan con esto asi que en este caso el se arma una previa factura al momento de crar el anuncio esta coleccion se llama invoice.

// Por lo tanto cuando tratamos de entender como funciona la factura previa (Datos de pago) se gestionan dependindo su departamento.