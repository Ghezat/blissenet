const { Schema, model } = require('mongoose');

const customerSurveySchema = new Schema({
    //esto es la coleccion de usuarios que califican a una tienda, la tienda aqui la tenemos como store que es un id y la persona que esta logeada esta como logeado y es tambien un id;
    surveyTitle : { type : String },  //titulo de la encuesta que se esta realizando
    surveyId : { type : String },  //identificador de encuesta
    surveyQuestion : { type : Object}, //guardamos las preguntas
    surveyResponse : { type : Object }, //esto sera un array con la preguntas y respuesta hecha por el cliente
    surveyTime : { type : String }, //es un dato que se requiere para que pueda aportar la fecha en que se creo esta encuesta formato dd-mm-yyyy. 
    indexed :  { type : String },  //este es el id del user dueño de la tienda
    indexedCustomer : { type : String }  //este es el id del user cliente
    
},{
    timestamps : true
});

module.exports = model('customerSurveyModel', customerSurveySchema, 'customerSurvey');

//Note: las personas podrán hacer una sola vez la encuesta.
