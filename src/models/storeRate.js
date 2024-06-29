const { Schema, model } = require('mongoose');

const storeRateSchema = new Schema({
    //esto es la coleccion de usuarios que califican a una tienda, la tienda aqui la tenemos como store que es un id y la persona que esta logeada esta como logeado y es tambien un id;
    store : { type : String },  //_id de tienda que es el mismo id del users
    logeado : { type : String },  //_id del logeado que es el mismo id del users.
    markStar : { type : String },  // puede ser 0 o 5 
    storeName : { type : String } //aqui guardamos el nombre de la tienda es para poder trabajar bien ya que toda la informacion son id

},{
    timestamps : true
});

module.exports = model('storeRateModel', storeRateSchema, 'storeRate');

//Note: las personas podrán calificar una tienda cuantas veces quieran si ya lo han hecho y lo vuelven hacer esta calificacion se sobreescribe.