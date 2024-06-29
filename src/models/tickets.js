const { Schema, model } = require('mongoose');
const mongoosePagination = require('mongoose-paginate-v2');

const SchemaTickets = new Schema({
    id_raffle : { type : String },
    title : { type: String },
    department : { type: String, default: 'raffle' },
    category : { type: String }, //free/pay
    raffleClosingPolicy : { type: String }, //politica de celebracion
    dateStart : { type : String }, //fecha de creacion de sorteo ya formateada type String
    serial : { type : String }, //serial del ticket
    No : { type: Number },
    price: { type: Number },
    numTickets : { type: Number }, //cantidad de tikets
    username : { type : String }, //aqui se guarda el usuario que ha tomado el Ticket.
    anfitrion : { type : String } //aqui el anfitrion del sorteo.
}, {
    timestamps : true
});

SchemaTickets.plugin(mongoosePagination);

module.exports = model('ticketsModel', SchemaTickets, 'tickets');