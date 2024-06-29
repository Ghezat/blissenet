const { Schema, model } = require('mongoose');

const documentReceiptSchema = new Schema({
    platform : { type : String }, //aqui va el nombr de la plataforma;
    nameTaxInstitute : { type : String }, //nombre del instituto u organo tributario de ese pais. 
    typeDocument : { type : String, default : "Recibo" }, //puede ser Factura (donde el usuario paga el servicio) o Recibo gratuito un "recibo de cortesía" dira el mismo monto pero no pagara nada. la diferencia es que si es factura llevará el número correlativo mientras si es un recibo de cortesia no  llevara el correlativo ni el impuesto tampoco.
    numberReceipt : { type : Number }, //este es el numero correlativo de los recibos.
    company : { type : String }, //este es el nombre de la compañia que administra la plataforma. ejemplo: "Trade Center California, LTC".
    companyID : { type : String },//numero de identificacion de la empresa otrogado por el instituto de recaudacion tributaria del pais.  ejemplo j-120025655
    companyAddress : { type : String }, //este es la direccion fiscal de la empresa que emite la factura
    companyPhone : { type : String }, //este es el telefono de la empresa.
    companyEmail : { type : String }, //este es el email de la empresa. 
    receptorName : { type : String }, //nombre de la persona o empresa que recibe la factura
    receptorID : { type : String }, //este es el numero de identificacion de la persona natural o juridica.
    receptorAddress: { type : String }, //direccion donde se encuentra la persona o empresa que obtiene el servicio
    date: { type : String }, //aqui la fecha con formato dd-mm-yyyy
    typeService : { type : String }, //el tipo de servicio define el costo del servicio y esto se define con el departamento 
    title : { type : String }, //importante mostrar el titulo de lo que va a vender a parte del departamento.
    orderID : {  type : String }, //aqui guardo el ID de la order para diferenciarlo de forma mas especifica.  
    amount : { type : Number }, //monto que debe pagar
    totalAmount : { type : Number, default : 0 }, //monto que se vera reflejado con el mismo monto de amount si es Factura si es Recibo sera de cero (0)
    taxFree : { type : Number, default : 0 }, //monto sin impuesto. 
    taxesCode : { type : String }, // codigo suministrado por el organo tributario (codigo para facturas digitales).
    taxesName : { type : String }, // este es el nombre del impuesto por ejemplo IVA en venezuela o IGIC para españa o Tax para estados unidos.
    taxesPercent : { type : Number }, // porcentaje del impuesto. 
    taxesAmount : { type : Number, default : 0 }, // esto es el monto que representa el impuesto.
    indexed :  { type : String }  //este es el id del user (el profile tambien tiene este campo !importante porque puedes acceder con este dato a la colleccion profile y al "user con el _id" por igual.)  
},{
    timestamps : true
});

module.exports = model('documentReceiptModel', documentReceiptSchema, 'documentReceipt');

//indexed es el numero de _id de un usuario
//tambien lo encontramos en la collecion profile y tambien aqui en el documentInvoice. 