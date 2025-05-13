const { Schema, model } = require('mongoose');
const mongoosePagination = require('mongoose-paginate-v2');

const SchematransportAgent = new Schema({

    checkAcept : { type: Boolean }, //esto es la aceptacion de los terminos y condiciones de los agentes de transporte. acepta sera true
    docImages : { type: Object, default: { images : [ ] } },
    active : { type: Boolean, default: false }, //por default nace false. este campo se utilizará para determinar si esta o no desponible para hacer deliveries. 
    view : { type : Number, default: 0  }, //este campo permite tener la cantidad de veces que entran a ver el mural de este agente de transporte el lugar donde tambien lo califican
    blissbotConect : { type : Boolean, default: false }, // con este dato la gente sabra si tiene o no coneccion con blissbot
    transportation : { type : Object }, // dentro de boxTranspor existira medios y idMedio donde medio es el vehiculo y el idMedio es la placa del vehiculo. Tambien debe tener imgTransport = { datos de la img } el agente puede tener varios vehiculos para su trabajo de entregas si los posee.
    deliveries : { type : Number, default : 0 }, // cantidad de despachos realizados 
    rates : { type: Object, default : { boxRates : [] } }, // al transportista lo califica el vendedor 
    indexed :  { type : String },  //este es el id del user.   
    
},{
    timestamps : true
});

SchematransportAgent.plugin(mongoosePagination);
module.exports = model('transportAgentModel', SchematransportAgent, "transportAgent");
    
