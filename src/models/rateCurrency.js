const { Schema, model } = require('mongoose');

const rateCurrencySchema = new Schema({
    currency : { type : String }, //aqui el codigo de la moneda (USD, EUR, VES).
    currentDay : { type : String }, //aqui va la fecha actual en formato (dd-mm-yyyy).
    currentPrice : { type : Number }, //aqui el precio actual de la moneda con respeto al dolar.
},{
    timestamps : true
});

module.exports = model('rateCurrencyModel', rateCurrencySchema, 'rateCurrency');