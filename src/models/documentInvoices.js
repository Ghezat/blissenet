const { Schema, model } = require('mongoose');

const documentInvoiceSchema = new Schema({
    platform : { type : String }, //aqui va el nombr de la plataforma;
    nameTaxInstitute : { type : String }, //nombre del instituto u organo tributario de ese pais. 
    typeDocument : { type : String, default : "Factura" }, //puede ser Factura (donde el usuario paga el servicio) o Recibo gratuito un "recibo de cortesía" dira el mismo monto pero no pagara nada. la diferencia es que si es factura llevará el número correlativo mientras si es un recibo de cortesia no  llevara el correlativo ni el impuesto tampoco.
    numberInvoice : { type : Number }, //este es el numero correlativo que debe llevar este documento. solo si es de tipo "Factura".
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
    orderID : {  type : String }, //aqui guardo el ID de la orden para diferenciarlo de forma mas especifica.  
    amount : { type : Number }, //monto que debe pagar
    totalAmount : { type : Number }, //monto que se vera reflejado con el mismo monto de amount si es Factura si es Recibo sera de cero (0)
    taxFree : { type : Number }, //monto sin impuesto. 
    taxesCode : { type : String }, // codigo suministrado por el organo tributario (codigo para facturas digitales).
    taxesName : { type : String }, // este es el nombre del impuesto por ejemplo IVA en venezuela o IGIC para españa o Tax para estados unidos.
    taxesPercent : { type : Number }, // porcentaje del impuesto. 
    taxesAmount : { type : Number }, // esto es el monto que representa el impuesto.
    bank : { type : String }, // Entidad bancaria donde se efectuo el pago
    accountnumber : { type : String }, // Numero de cuenta bancaria donde se ejecuta el pago coloque de tipo String para evitar un problema ya que las cuentas podian meterla con guiones.
    service : { type : String }, //esto solo es para facturas de tipo "marketing" puede ser Banner o News-Days
    refer : { type : String }, //esto solo es para facturas de tipo "marketing" aqui la refebcia del pago hecho por el cliente
    indexed :  { type : String },  //este es el id del user (el profile tambien tiene este campo !importante porque puedes acceder con este dato a la colleccion profile y al "user con el _id" por igual.)
    timeDays :  { type : String }, //esto solo es para facturas de tipo "marketing"
    endPublic :  { type : String }, //esto solo es para facturas de tipo "marketing"
    invoiceUsedMarketing : { type : Boolean } //esto es solo para las facturas de tipo "marketing". se crea en false pero luego cuando se usa pra publicar un producto (banner o new-day) se pasa a true. para que no se pueda volver a usar esta factura. !Importante¡ 
},{
    timestamps : true
});

module.exports = model('documentInvoiceModel', documentInvoiceSchema, 'documentInvoice');

//indexed es el _id de la coleccion de user de un usuario
//tambien lo encontramos en la collecion profile y tambien aqui en el documentInvoice. 

//:::::Nota importante esta coleccion se crea a partir de la coleccion buySell para los departamentos (items, arts y auctions);
//::::: para el resto de los departamentos se crea a partir de la coleccion invoice;