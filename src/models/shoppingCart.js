const { Schema, model } = require('mongoose');

const shoppingCart = new Schema({
    cartId : { type : String }, // aqui ira un id o indentificador de este carrito.
    department : { type : String, default : "shoppingCart"}, //este campo es importante para diferenciarlo en la lista de compras icono maletin.
    customerId : { type : String },  //id customer o id del cliente " el comprador"
    customerName : { type : String }, // aqui tenemos el nombre del cliente "comprador"
    purchaseReceiver : { type : Object }, // es un objeto que posee los datos de quien recibe la compra. No necesariamente es el mismo comprador.
    sellerId : { type : String },  //id seller o id del seller " el vendedor"
    sellerName : { type : String }, //el username del vendedor (Store Username).
    boxShoppingCart : { type : Array}, //este array contendra los siguientes objetos : [ { depart, title, titleId, countrequest, price } ]; 
    orderDetail : { type : String }, //aqui existira datos sobre la compra. por eje. Quiero que el pedido de los perros calientes no tenga vegetales. O quiero el modelo azul electrico en los zapataos nike.
    consolidate : { type : String, default : "false" }, //consolidado significa una validacion por parte de la tienda donde verifica el pedido que sera despachado. Es donde la Tienda podria manipular para arreglar el pedido y donde el cliente puede agregar mas articulos. No podra actualizar su compra si ya se ha consolidado. 
    amount : { type : Number }, //aqui el monto del valor del carrito, esto puede cambiar
    active : { type : String, default : "true" }, //true or false, si esta en true porque esta activo y se vera y si esta en false es porque ya no aparecera porque ya caduco su tiempo de visibilidad. y ya no puede volver a verse. esto es para tener un registro de todo lo que se ha hecho en este departamento.
    regPay : { type : String, default : "false"}, //aqui se registra el pago por parte del cliente.
    dataRegPay : { type : Array, default : [] }, //aqui se registra el metodo, el detalle y es response del pago: dataRegPay = [ {methodPay : "", detailPay : "", response : "" } ]
    paid : { type : String, default : "false" }, //campo que determina si el pago ha sido aceptado
    deliveryOptions : { type : String }, //guardamos el modo de entrega que ha elejido el cliente. Estas opciones pueden ser : (D01, D02, D03)
    sent : { type : Object, default : { sentStatus : "false", sentDetails : ""} }, //enviado tiene dos valores "true" or "false".
    received : { type : String, default : "false" }, //recibido tiene dos valores "true" or "false".
    ratingSeller :  { type : Number, default : 0 }, //aqui almacena la puntuacion en estrella el valor por defecto es 1
    ratingBuy :  { type : Number, default : 0 }, //aqui almacena la puntuacion en estrella el valor por defecto es 1
    CommentSeller :  { type : String, default : "no_comment" },   
    CommentBuy :  { type : String, default : "no_comment" },
    
    date : { type : String } //aqui guardamos la fecha en que el cliente envio para ser consolidado.
},{
    timestamps : true
});

module.exports = model('shoppingCartModel', shoppingCart, 'shoppingCart');
                                                   