const { Schema, model } = require('mongoose');

const messageSchema = new Schema({
    typeNote : { type : String, default : 'messages' }, //puede ser messages, notes, spread.
    times : { type : String}, //fecha y hora en el momento exacto en que se crea la pregunta.
    titleArticle : { type : String}, //el titulo del articulo en cuestion.
    urlImageArticle : { type : String}, //la primera imagen del articulo.
    objeAvatar : { type : Object }, //este campo solo es para cuando sea de tipo "spread"
    userId : { type : String}, //el Id del que hace la pregunta. (indexed)
    username : { type : String}, //el username del que hace la pregunta.
    question : { type : String}, //la pregunta.
    toCreatedArticleId : { type : String}, //el id del creador del articulo dato extraido de cada coleccion de departamentos. "Quien recibe la pregunte"
    ownerStore  : { type : String}, // este es el username del creador del anuncio. "Quien recibe la pregunte"
    productId : { type : Schema.ObjectId }, //el id del producto en cuestion
    depart : { type : String }, //departamento 
    answer : { type : String,  default: 'waiting' }, //esta respuesta la otorga el dueño del articulo 
    view : { type : Boolean, default: false } //con este campo puedo firmar cuando el usuario haya visto el mensaje enviado por el anunciante y desaparezca de su buson de salida (outbox)
},{
    timestamps : true
});

module.exports = model('messageModel', messageSchema, 'messages');

/*
  typeNote: 'spread',
  times: '20-05-2024 15:26',
  titleArticle: 'Toyota Corolla 2019',
  username: 'dianac4',
  question: 'dianac4 te invita a que veas su nuevo anuncio publicado.',
  toCreatedArticleId: '646351222014b4ac4ff46982',
  ownerStore: 'indira18',
  productId: new ObjectId("66437eeebc71fcf9686f4476"),
  depart: 'automotive',
  answer: 'waiting',
  view: false,*/