const { Schema, model } = require('mongoose');

const shoppingCart = new Schema({
    cartId : { type : String }, // aqui ira un id o indentificador de este carrito.
    customerId : { type : String },  //id customer o id del cliente " el comprador"
    customerName : { type : String }, // aqui tenemos el nombre del cliente "comprador"
    purchaseReceiver : { type : Object }, // es un objeto que posee los datos de quien recibe la compra. No necesariamente es el mismo comprador.
    sellerId : { type : String },  //id seller o id del seller " el vendedor"
    boxShoppingCart : { type : Array}, //este array contendra los siguientes objetos : [ { depart, title, titleId, countrequest, price } ]; 
    consolidate : { type : String, default : "false" }, //consolidado significa una validacion por parte de la tienda dodne verifica el pedido que sera despachado. Es donde la Tienda podria manipular para arreglar el pedido.
    amount : { type : Number }, //aqui el monto del valor del carrito, esto puede cambiar
    active : { type : String, default : "true" }, //true or false, si esta en true porque esta activo y se vera y si esta en false es porque ya no aparecera porque ya caduco su tiempo de visibilidad. y ya no puede volver a verse. esto es para tener un registro de todo lo que se ha hecho en este departamento.
    paid : { type : String, default : "false" }, //campo que determina si se ha elimando el public en Spaces.
    date : { type : String } //aqui guardamos la fecha en que el cliente envio para ser consolidado.
},{
    timestamps : true
});

module.exports = model('shoppingCartModel', shoppingCart, 'shoppingCart');
                                                   