const { Schema, model } = require('mongoose');

const banSchema = new Schema({
    indexed: { type : String }, //este campo es el id del user.
    username: { type : String }, //este campo es el username.
    ban: { type : String }, // dias o indefinido. "7","14","30", "undefined";
    adminLocked:  { type : String }, //username del admin quien baneo al usuario.
    adminUnlocked:  { type : String, default : "no_admin" }, //username del admin quien desbloqueo al usuario.
    resume: { type: String }, //Resumen de la causa del porque se banea el usuario.
    status: { type: String, default : "locked" } //esto indica que este documento nace cerrado luego pasa a unlocked 

},{
    timestamps : true
});

module.exports = model('banModel', banSchema, 'bans');

