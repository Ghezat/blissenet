const { Schema, model } = require('mongoose');

const raffleHistorySchema = new Schema({
    anfitrion : { type : String }, //este campo guardara todos los ganaores que compraron el ticket
    anfitrion_id : { type : String },
    department : { type : String, default : 'raffle' },
    category : { type: String }, //Gratis or Pago
    title_id : { type : String }, //id del titulo del sorteo.
    title : { type : String }, //titulo del sorteo.
    image : { type : Array }, //aqui solo existira dos atributos con sus valores public_id y url. 
    price : { type : Number },
    numTickets : { type: Number }, //cantidad de tikets 
    PrizesObject : { type : Object, default: [] }, //Array donde se guardaran los lugares y premios [ {Prize : "Monopatin", winTicket : null}, {Prize : "Hoverboard", winTicket : 56} ] || El Valor de winTicket inicia siendo null y luego se inserta al confirmarse que todos los ticket han sido tomados o verificados.  
    dateStart : { type : String }, //fecha formateada para indicar de forma rapida cuando creo el sorto. no se guarda como Date ya que no se hara operaciones con esta fecha, solo e spara mostrarlo en el front
    payCommission : { type : Boolean, default : false  }, //aqui guardamos si el usuario pago o no su comision de venta.
    celebration : { type : Boolean, default : false } //esto es lo que determina si un sorteo sea celebrado. Importante ya que de esto depende un cambio en el Front para que los ganadores puedan calificar en la Tabla de Tickets.  
},{
    timestamps : true
});

module.exports = model('raffleHistoryModel', raffleHistorySchema, 'raffleHistory');

//(anfitrion, anfitrion_id, department, category, title_id, image, price,
//numTickets, PrizesObject, dateStart)