const { Schema, model } = require('mongoose')

const SchemaFavorites = new Schema({
    id_product : { type : String },
    department : { type : String },
    indexed : { type : String } //aqui se guarda el Id del usuario que ha tomado el producto en su coleccion de favoritos. 
}, {
    timestamps : true
});


module.exports = model('favoritesModel', SchemaFavorites, 'favorites');