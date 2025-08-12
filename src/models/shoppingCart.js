const { Schema, model } = require('mongoose');

const shoppingCart = new Schema({
    active : { type : Boolean }, //true or false, si esta en true porque esta activo y se vera y si esta en false es porque ya no aparecera porque ya caduco su tiempo de visibilidad. y ya no puede volver a verse. esto es para tener un registro de todo lo que se ha hecho en este departamento.
    customerId : { type : String },  //id customer o id del cliente " el comprador"
    sellerId : { type : String },  ////id seller o id del seller " el vendedor"
    boxShoppingCart : { type : Array},  
    paid : { type : Boolean, default : false } //campo que determina si se ha elimando el public en Spaces.

},{
    timestamps : true
});

module.exports = model('shoppingCartModel', shoppingCart, 'shoppingCart');
