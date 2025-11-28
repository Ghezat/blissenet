const { Schema, model } = require('mongoose');

const rateArtAndArticleSchema = new Schema({
    //esto es la coleccion de usuarios que califican a una tienda, la tienda aqui la tenemos como store que es un id y la persona que esta logeada esta como logeado y es tambien un id;
    department : { type : String }, //debemos conocer si es artes o articles
    productId : { type : String }, // tambien debemos conocer el id del producto
    //storeId : { type : String },  //_id de tienda que es el mismo id del users
    //storeName : { type : String }, //aqui guardamos el nombre de la tienda es para poder trabajar bien ya que toda la informacion son id
    commentatorId : { type : String },  //_id del logeado que es el mismo id del users.
    commentatorData : { type : Object }, //aqui va a estar un objeto asi {username, avatarPerfil, mailhash, country, flag}
    markStar : { type : Number },  // puede ser 1 o 5
    comment : { type : String },  // comentarios sobre la calificacion de la tienda. Es opcional. 

},{
    timestamps : true
}); 

module.exports = model('rateArtAndArticleModel', rateArtAndArticleSchema, 'rateArtAndArticle');

// este modelo es el esquema de los datos que se guardan en la DB sobre la calificacion de cada articulo y arte. 
//veremos esta informacion en la parte baja de view-gerenal-product

/* department : "items"
productId : "68ae39c4d3723b26fdd47d76"
markStar : 5
comment : "Super genial este RC Crawler"

createdAt :  "2025-11-19T14:29:10.146Z"
updatedAt : "2025-11-19T14:29:10.146Z"
__v : 0
_id : "691dd436bd5971b19a79dedf" */