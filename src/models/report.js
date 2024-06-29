const { Schema, model } = require('mongoose');
const mongoosePagination = require('mongoose-paginate-v2');

const SchemaReport = new Schema({

    codeReport : { type: String }, //codigo del reporte de denuncia.
    visitante : { type: String }, //username del visitante que hace la denuncia
    anunciante : { type: String }, //username del anunciante.
    id_anunciante : { type : String }, //aqui el id del anunciante. importante tenerlo para luego poder enviar el mensaje a su inbox. 
    id_title : { type: String }, //id del anuncio denunciado
    title : { type: String }, //titulo del anuncio denunciado
    depart : { type: String }, //departamento en cuestion
    denuncia : { type: String }, //resumen de la denuncia hech apor un usuario
    dateOpen: { type: String }, //fecha de creacion de denuncia aqui vamos a meter la fecha con el formato necesario. eje. 10-11-2023 esta fecha es el dia que el usuario se dispuso hacer su pago. es la fecha que paga a la plataforma.
    process: { type: Boolean, default: false }, //procesado o no por un admin
    action : { type : String }, //deleteAll,deleteMedia,rejectDenunt
    admin : { type : String, default : "no_admin" }, //username del admin
    resume: { type: String }, //Resumen del conflicto y como resolvio la situacion el admin
    dateClose: { type: String } //fecha en la que el admin cierra la denuncia (despues de haber resuelto el problema).


}, {
    timestamps : true
});

SchemaReport.plugin(mongoosePagination);

module.exports = model('reportModel', SchemaReport, 'report');

