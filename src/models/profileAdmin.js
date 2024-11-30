const { Schema, model } = require('mongoose');

const SchemaProfileAdmin = new Schema({
    platform : { type : String, default : "Blissenet" }, //este username es el nombre por defecto de la plataforma.
    company : { type : String }, //este es el nombre de la compañia que administra la plataforma. ejemplo: "Trade Center California, LTC".
    companyID : { type : String }, //numero de identificacion de la empresa otorgado por el instituto de recaudacion tributaria del pais.  ejemplo j-120025655
    companyObject : { type : String }, //objeto general y resumido de la compañia.
    franchiseOwner : { type : String }, //dueño de la franquicia "el socio en ese pais determinado".
    manager : { type : String }, //el gerente de operaciones encargado de la plataforma.
    dateborn : { type : Date },// fecha de inicio de operaciones con el sistema de marketplace.
    country : { type : String },  //pais donde va a funcionar el sistema de marketplace. ejemplo Colombia, Ecuador, Bolivia, Argentina, etc.
    coState : { type : String }, //estado donde radicará la oficina adminirativa de la empresa (Franquiado).
    coAddress : { type : String }, //direccion donde estara la oficina de operaciones admisnitrativas.
    phone1 : { type : String }, //número de telefono para comunicacion con algun administrador.
    phone2 : { type : String }, //número de telefono para comunicacion con algun administrador.
    email : { type : String }, //email adminsitrativo de la empresa este dato será suministrado por la admisnitracion mayor de Blissenet para todas sus franquicias. 
    nameTaxInstitute : { type : String }, //nombre del instituto u organo tributario de ese pais. 
    taxesCode : { type : String }, //codigo de contribuyente otorgado por el organo recaudador tributario. 
    taxesName : { type : String }, //nombre del impuesto en el pais donde se ejecuta el sistema. ejemplo en venezuela se llama IVA en españa es IGIC en Estados Unidos es Tax cada pais tiene su organo tributario y pone el nombre que quiera a su impuesto.
    taxesPercent : { type : Number }, //porcentaje de impuesto por venta de bienes y servicio, en este caso es por servicio. 

},{
    timestamps : true
});

module.exports = model('profileAdminModel', SchemaProfileAdmin, "profileAdmins");


//este es el esquema principal y es lo que primero que debe llenar el franquiciado.
//estos datos los usara el sistema en diversos procesos como la generacion de facturas que podrán imprimir los usuarios al pagar su factura.
//tambien existen datos aqui importantes que se requeriran para poder conectar con todas las franquicias desde un unico sistema central, (Panel administrativo donde podremos ver el rendimiento de cada franquicia en diferentes lapsos de tiempos)
//datos importantes para poder enlazar con los franquiciados y poder tener completo control con sus encargados o gerentes. 
//ver estructura organizativa de la plataforma. 
