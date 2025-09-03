const { Schema, model } = require('mongoose');

const messageSchema = new Schema({
    typeNote : { type : String, default : 'messages' }, //puede ser messages, notes, spread.
    times : { type : String}, //fecha y hora en el momento exacto en que se crea la pregunta.
    titleArticle : { type : String}, //el titulo del articulo en cuestion.
    titleURL : { type : String },// aqui guardamos el titulo que se usara en el url (SEO) Search Engine Optimization (Optimización para Motores de Búsqueda)
    urlImageArticle : { type : String}, //la primera imagen del articulo.
    objeAvatar : { type : Object }, //este campo solo es para cuando sea de tipo "spread" y "followMe"
    userId : { type : String}, //el Id del que hace la pregunta. (indexed) --->esto es el _id de la colleccion users.
    username : { type : String}, //el username del que hace la pregunta o el que esta siguiendo a otra cuenta
    question : { type : String}, //la pregunta.
    toCreatedArticleId : { type : String}, //el id del creador del articulo dato extraido de cada coleccion de departamentos. "Quien recibe la pregunte"
    ownerStore  : { type : String}, // este es el username del creador del anuncio. "Quien recibe la pregunte"
    productId : { type : Schema.ObjectId }, //el id del producto en cuestion
    cartId : { type : String }, //esto solo funiona para lo smensajes de notificacion de carritos de compra.
    depart : { type : String }, //departamento 
    answer : { type : String,  default: 'waiting' }, //esta respuesta la otorga el dueño del articulo 
    view : { type : Boolean, default: false } //con este campo puedo firmar cuando el usuario haya visto el mensaje enviado por el anunciante y desaparezca de su buson de salida (outbox)
},{
    timestamps : true
});

module.exports = model('messageModel', messageSchema, 'messages');

/*
{
        "_id" : ObjectId("6762be50442add8421dd2b58"),
        "typeNote" : "spread",
        "times" : "18-012-2024 8:21",
        "titleArticle" : "Reloj Casio F-91w",
        "objeAvatar" : {
                "avatar" : "https://bucket-blissve.nyc3.digitaloceanspaces.com/avatar/1728753862992.png",
                "avatarDefault" : "dd7ee795a010fe7953f74ba1547055ad"
        },
        "username" : "develop-test1",
        "question" : "develop-test1 te invita a que veas su nuevo anuncio publicado.",
        "toCreatedArticleId" : "66ec3ad3ceacc8a916d29e59",
        "ownerStore" : "birmaR",
        "productId" : ObjectId("66abd80fb6d7f5e26757ee3a"),
        "depart" : "items",
        "answer" : "waiting",
        "view" : false,
        "createdAt" : ISODate("2024-12-18T12:21:36.788Z"),
        "updatedAt" : ISODate("2024-12-18T12:21:36.788Z"),
        "__v" : 0
}

  /*
  {
    _id: new ObjectId("6762c34e11d3b469dcc5ef72"),
    typeNote: 'followMe',
    times: '18-12-2024 8:42',
    objeAvatar: {
      avatar: 'https://bucket-blissve.nyc3.digitaloceanspaces.com/avatar/1726757947514.png',
      avatarDefault: '6e7bff71ade70c69f47b754cdea22cd5'
    },
    username: 'birmaR',
    question: '¡Hola! birmaR te está siguiendo. Visítala y descubre si te interesa seguirla también',
    toCreatedArticleId: '66ba334e0e5f1becbefdb4d5',
    ownerStore: 'rogelio',
    answer: 'waiting',
    view: false,
    createdAt: 2024-12-18T12:42:54.304Z,
    updatedAt: 2024-12-18T12:42:54.304Z,
    __v: 0
  }
,
  {
    _id: new ObjectId("676454224b77d89722e94ffc"),
    typeNote: 'messages',
    times: '19-12-2024 13:13',
    titleArticle: 'Mitsubishi Eclipse 1994',
    urlImageArticle: 'https://bucket-blissve.nyc3.digitaloceanspaces.com/automotive/1733162031952.jpg',
    userId: '66ec3ad3ceacc8a916d29e59',
    username: 'birmaR',
    question: 'Esta disponible este auto?',
    toCreatedArticleId: '66ac0281a3afb22ac770d5f2',
    ownerStore: 'develop-test2',
    productId: new ObjectId("674df4377241dec217597315"),
    depart: 'automotive',
    answer: 'waiting',
    view: false,
    createdAt: 2024-12-19T17:13:06.132Z,
    updatedAt: 2024-12-19T17:13:06.132Z,
    __v: 0
  },
  
  {
    "_id" : ObjectId("679015665fd4b3725d1c82db"),
    "typeNote" : "availability-noti",
    "times" : "21-01-2025 17:45",
    "titleArticle" : "Nike Mag",
    "urlImageArticle" : "https://bucket-blissve.nyc3.digitaloceanspaces.com/items/1735431661897.jpg",
    "userId" : "66ec3ad3ceacc8a916d29e59",
    "question" : "¡Este artículo ya esta disponible!",
    "toCreatedArticleId" : "66ab9dc1b8c25e5528f4ea9d",
    "ownerStore" : "develop-test1",
    "productId" : ObjectId("677095f1244106c28d6a27b0"),
    "depart" : "items",
    "answer" : "waiting",
    "view" : false,
    "createdAt" : ISODate("2025-01-21T21:45:10.965Z"),
    "updatedAt" : ISODate("2025-01-21T21:45:10.965Z"),
    "__v" : 0
},

{
  _id: ObjectId('68b842dcf69ce3516065ebc9'),
  typeNote: 'shoppingCart-Cre', typeNote : 'shoppingCart-Con', typeNote : 'shoppingCart-dell', typeNote : 'shoppingCart-RPay', 
  times: '03-09-2025 09:30',
  objeAvatar: { avatar: '', avatarDefault: '332b4823f0219bc69bbf84f6d4df41ee' },
  username: 'Lorenzobastardo',
  question: '¡Hola! Lorenzobastardo te ha realizado una compra.',
  toCreatedArticleId: '66ec3ad3ceacc8a916d29e59',
  cartId: '1756906203753',
  answer: 'waiting',
  view: false,
  createdAt: ISODate('2025-09-03T13:30:04.279Z'),
  updatedAt: ISODate('2025-09-03T13:30:04.279Z'),
  __v: 0
},
{
  typeNote: 'shoppingCart-Del',
  times: '29-08-2025 14:50',
  objeAvatar: { avatar: '', avatarDefault: 'dd7ee795a010fe7953f74ba1547055ad' },
  username: 'develop-test1',
  question: '¡Hola! develop-test1 ha eliminado tu compra.',
  toCreatedArticleId: '66ab9dc1b8c25e5528f4ea9d',
  ownerStore: 'develop-test1',
  answer: 'waiting',
  view: false,
  _id: new ObjectId("68b1f663b5a6eebfc0fcad4d")
}

{
  typeNote: 'shoppingCart-Con',
  times: '29-08-2025 14:50',
  objeAvatar: { avatar: '', avatarDefault: 'dd7ee795a010fe7953f74ba1547055ad' },
  username: 'develop-test1',
  question: '¡Hola! develop-test1 te ha hecho una compra',
  toCreatedArticleId: '66ab9dc1b8c25e5528f4ea9d',
  ownerStore: 'develop-test1',
  answer: 'waiting',
  view: false,
  _id: new ObjectId("68b1f663b5a6eebfc0fcad4d")
}

{
  typeNote: 'shoppingCart-Pay',
  times: '29-08-2025 14:50',
  objeAvatar: { avatar: '', avatarDefault: 'dd7ee795a010fe7953f74ba1547055ad' },
  username: 'develop-test1',
  question: '¡Exito! develop-test1 ha definido un tipo de pago. Revisalo y prosigue con el despacho',
  toCreatedArticleId: '66ab9dc1b8c25e5528f4ea9d',
  ownerStore: 'develop-test1',
  answer: 'waiting',
  view: false,
  _id: new ObjectId("68b1f663b5a6eebfc0fcad4d")
}
*/

//tipos de notas

//1. spread
//2. followMe
//3. note
//4. messages
//5. availability-noti
//6. delete-shoppingCart

