const { Schema, model } = require('mongoose');

const customerSurveySchema = new Schema({
    //esto es la coleccion de usuarios que califican a una tienda, la tienda aqui la tenemos como store que es un id y la persona que esta logeada esta como logeado y es tambien un id;
    surveyId : { type : String },  //identificador de encuesta
    surveyResponse : { type : Object }, //esto sera un array con la preguntas y respuesta hecha por el cliente
    indexed :  { type : String },  //este es el id del user dueño de la tienda
    indexedCustomer : { type : String }  //este es el id del user cliente
},{
    timestamps : true
});

module.exports = model('customerSurveyModel', customerSurveySchema, 'customerSurvey');

//Note: las personas podrán hacer una sola vez la encuesta.
