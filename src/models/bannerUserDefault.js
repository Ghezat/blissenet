const { Schema, model } = require('mongoose');

const bannerUserDefaultSchema = new Schema({
    
    typeBanner : { type : String, default : 'bannerDefault' },  //Es el banner que debe ofrecerle a todos los nuevos miembros al crear un perfil de usuario
    bannerName : { type : String },  //un nombre que podemos darle al banner, para poder identificarlo de forma facil, por ejemplo: banner2024, o banner2025 es posible de esta forma tener 
    url : { type : String }, //aqui el url de la imagen para acceder a ella.
    public_id : { type : String }, //el public_id para acceder a ella en la nube y poder editar/eliminar.
 
},{
    timestamps : true
}); 

module.exports = model('bannerUserDefaultModel', bannerUserDefaultSchema, 'bannerUserDefault');
