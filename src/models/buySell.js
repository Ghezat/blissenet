const { Schema, model } = require('mongoose');

const buySellSchema = new Schema({
    usernameBuy : { type : String }, //este campo esta tambien en la coleccion profile.
    usernameSell : { type : String }, //este campo esta tambien en la coleccion profile.
    indexedSell : { type : String }, //aqui se guardara el id del user (usernameSell); importante para luego detectar rapidamente si tiene facturas impagas y cuantas.
    indexedBuy : { type : String }, //aqui se guardara el id del user (usernameBuy); importante para luego detectar rapidamente si tiene facturas impagas y cuantas.
    department : { type : String },
    title : { type : String },
    title_id : { type : String }, //este es el id del articulo o del arte o del auto o de lo que sea que se este vendiendo o alquilando
    fechaNegotiation : { type : String },
    deliveryType : { type : String }, //aqui guardamos el tipo de entrega que puede ser una de estas tres (Envio Local, Envio Interurbano, Envio Internacional );
    deliveryDetails : { type : String, default : "" }, //aqui guardamos el detalle de como se debe enviare el paquete. ejemplo. "Retirar Personalmente en la tienda", o "Reciba su pedido en la puerta de su casa. (Solicitar Delivery)" Nace como string vacio pero luego tendra un valor. lo importante es que ya exista para luego solo actualizar su valor.
    deliveryOptions : { type : Object }, // este objeto lo posee el perfil de vendedor. verlo en profile 
    count : { type : Number }, //cantidad de existencia que hay del articulo.
    tecnicalDescription : { type : String },
    image : { type : Array }, //aqui solo existira dos atributos con sus valores public_id y url. 
    voucherImage: { type: Array, default: [ ] },// [ { url: 'https://bucket-blissve.nyc3.digitaloceanspaces.com/voucher/1749994166924.jpg', public_id: 'voucher/1749994166924.jpg', bytes: 63282, format: 'jpg' }]
    price : { type : Number }, //este es el precio unitario
    countRequest : { type : Number }, //cantidad de unidades que ha comprado el usuario
    step :  { type : Number, default : 0 }, //esto es importante para otorgar status de la operacion, importante si el usuairo quiere salir y luego volver a entrar. la ides es asignar pasos o estatus que incian desde 0 hasta 3
    pay : { type : Boolean, default : false },
    total : { type : Number }, //aqui almacenamos el total a pagar
    confirmPay : { type : String, default : "" }, // este campo puede tener tres valores, 1(sin valor) por default, 2(yes) el vendedor confirma el pago , 3(no) el vendedor confirma que no pago.
    methodSelected : { type : String, default : "" }, //aqui el metodo que uso para el pago
    referPay : { type : String, default : ""}, //aqui se guarda la referencia de pago que hizo con comprador cuando ejecuto el pago al vendedor
    written : { type : Array }, //dentro habitara una coleccion de objetos con el campo user y written
    ratingSeller :  { type : Number, default : 0 }, //aqui almacena la puntuacion en estrella el valor por defecto es 1
    ratingBuy :  { type : Number, default : 0 }, //aqui almacena la puntuacion en estrella el valor por defecto es 1
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
    date : { type : String },// aqui vamos a meter la fecha con el formato necesario. eje. 10-11-2023 esta fecha es el dia que el usuario se dispuso hacer su pago. es la fecha que paga a la plataforma.
    closeOperationSeller : { type : Boolean, default : false }, // con este campo manejamos el estado de la operacion de compra. por defecto nace false pero en el proceso puede pasar a ser true que significa que se ha cerrado la operacion. esto no debe confundirse con "cancel". esto es para cerrar la operacion cuando ya no se requiera tener mas comunicacion con la contraparte. se ha cerrado la sala de negociacion.
    closeOperationBuy : { type : Boolean, default : false }, // por defecto nacen con el valor false. cada sala es independiente y cada quien decide cuando cerrarlo
    fullScreen : { type : Boolean, default : false } //por defecto es false el chat estara contraido.
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