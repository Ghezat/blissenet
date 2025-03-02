const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    username : { type : String}, //este campo esta tambien en la coleccion profile.
    email : { type : String}, //campo almacena el correo del usuario
    password : { type : String}, //este campo almacenara un hashPassword.
    mailhash : { type : String }, //este campo almacena un hash producido con su email importante para logar su default avatar 
    token : { type : Number }, //todos los token debe ser numeros de 6 caracteres.
    emailVerify : { type : Boolean, default : false}, //este campo es para guardar que ya el usuario ha verificado su correo.
    stopped : { type: Boolean, default: false }, //por default nace false. este campo se utilizará para impedir que un usuario.
    //que haya infringido las normativas no pueda acceder acceder a la plataforma. 
},{
    timestamps : true
});

module.exports = model('userModel', userSchema, 'users');