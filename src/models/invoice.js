const { Schema, model } = require('mongoose');

const invoiceSchema = new Schema({
    usernameSell : { type : String }, //este es el usuario quien crea el anuncio y es quien paga el importe a la plataforma (Marketplace).
    indexed : { type : String }, //aqui se guardara el id del user (usernameSell); importante para luego detectar rapidamente si tiene facturas impagas y cuantas.
    department : { type : String }, //aqui guardo los diferentes departamentos.
    title : { type : String },
    title_id : { type : String }, //aqui se guarda el id del title, importante para el caso de raffle donde se debe conocer y cuantificar su Trust y Score.
    tecnicalDescription : { type : String },
    price : { type : Number }, 
    refer : { type : Number, default : 0 }, //este es el numero de confirmacion o referencia que introduce el vendedor para pagar a la plataforma el porcentaje por la venta.
    admin : { type : String, default : "no_admin" }, //aqui va el username del admin que va a procesar este pago
    process : { type : Boolean, default : false }, //este dato sera true cuando sea procesado la factura. este dato lo actualiza el admin que procesa este pago.
    commission : { type : Number }, //esto es monto a pagar por el usuario a la empresa o plataforma de compra y venta.
    montoPay : { type : Number, default : 0}, //esto es el monto que debera pagar el usuario, se actualiza en el preciso momento que este va a pagar, tomando como dato el precio actual del dolar y multiplicandolo por la comission a pagar.
    bank : { type : String, default : "no_bank" }, //aqui guarda el vendedor el banco donde hizo el pago de la comision.
    payCommission : { type : Boolean, default : false  }, //aqui guardamos si el usuario pago o no su comision de venta. 
    userDeclare : { type : Boolean, default : false }, //este dato es para registrar que el usuario a declarado su pago cuando sea true es que el cliente ha declarado su pago.
    dates : { type : String, default : "no_dates" }// aqui vamos a meter la fecha con el formato necesario. eje. 10-11-2023 esta fecha es el dia que el usuario se dispuso hacer su pago. es la fecha que paga a la plataforma.
},{
    timestamps : true
});



module.exports = model('invoiceModel', invoiceSchema, 'invoices');

// este Scheme es para producir la factura cada vez que se crea los anuncios de los siguientes departamentos.
// 1. automotriz, 2. aeronautica, 3. nautica, 4. realstate., 5. raffle(cuando se ejecute la celebracion, osea cuando se tengan todos los ticket gabadores).
// en el campo "amount" será un monto unico tasado en dolar americano.
// el Tiempo del anuncio es definido por el usuario "solo el podra pausar/activar o eliminar dicho anuncio".
// al crear el anuncio se crea in situ la factura agregandose a la vista invoice del usuario.
// el maximo permitido es 3 facturas sin pagar. cuando esto ocurre la falta se reflejara en una amonestacion que es efectuada de fdorma automatica por el sistema.
// la amonestacion consiste en limitar al usuario a entrar en los departamentos de creacion y edicion de sus anuncios.
// al tener menos de 3 facturas montadas volvera a poder hacer uso de los diferentes departamentos.   

// Nota: en el caso de arte, items y auctions la factura se produce en el Scheme buySell.
// para que cumpla con los requerimentos minimos de una factura legal debe tener el nombre de la figura juridica y el rif de quien recibe el pago. esto lo anexare luego cuando tenga el nombre y el rif de la empresa que genera esta factura (EL marketplace).