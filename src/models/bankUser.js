const { Schema, model } = require('mongoose');

const bankUserSchema = new Schema({
    indexed : { type : String }, // id del user esto es para uso interno y poder identificar.
    username : { type : String}, //este campo esta tambien en la coleccion profile.
    paymentSystem : { type : Object, default : [] } //Esto es un objecto array que porta todos los sistemas de pago que quieras integrar.

   // paymentSystem : [
   // { name: Transferencia Bancaria, idMethod: 1234765, c3: "juan pablo guanipa", c4: "15371263", c1: "123456789012345678901234567890", c5: Banco de Venezuela, c2: "0128",  },
   // { name: Pago movil, idMethod: 1235858, c1: "jonuribe2112@gmail.com", c2: "jon uribe ramon", c3: "15371263" c4: "BOFA" },
   // { name: Zelle, idMethod: 1240934, c1: "Banco de Venezuela", c2: "15371263", c3: "0412 0811945" }, ...
   // ]
   // el objeto tendra un campo llamado name y luego 5 campos siento estos c1,c2,c3,c4,c5
   // el name es lo que se usa para ofrecer una lista de los metodos de pagos.
   
},{
    timestamps : true
});

module.exports = model('bankUserModel', bankUserSchema, 'bankUser');

