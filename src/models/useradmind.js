const { Schema, model } = require('mongoose');

const userAdminSchema = new Schema({
    adminName : { type : String },
    workerNumber : { type : Number }, //numero de trabajador. 
    email : { type : String },
    rol : { type : String }, //adminAdmin, adminMarketing, adminReport, adminMaster
    password : { type : String },
    confirmPassword : { type : String },
    locked : { type : Boolean, default : false },
    namesAdmin : { type : String, default : "no_name"}, //nombre del administrador.
    lastName : { type : String, default : "no_lastname"}, //apellido del administrador.
    identification : { type : String, default : "no_identification" }, //numero de cedula o de identificacion
    socialSecurity : { type : String, default: "no_socialSecurity" }, //aqui el numero de seguro social del empleado.
    address : { type : String, default : "no_address" }, //direccion completa donde reside actualmente el admin
    phone1 : { type : String, default : "no_phone" },//telefono personal del administrador
    phone2 : { type : String, default : "no_phone" }, //otro telefono de alguien cercano del admin puede ser mama papa esposa hijo
    sons : { type : Number, default : 0 }, //es la cantidad de hijos que tiene.
    married : { type: Boolean, default : false }, //estado civil casado es true o false
    dates : { type : String, default : "no_dates" },// aqui vamos a meter la fecha con el formato necesario. eje. 10-11-2023 esta fecha es el dia que el admin inicia sus labores de trabajo formalmente. 
    contractStatus : { type : String, default : "no_contract" }, // estado de contrato tendra tres valores, inicial "no_contractStatus", luego puede ser "Active" personal contratado o "Canceled" personal desactivado o botado ya no trabaja.
    dateOff : { type : String, default : "no_dateOff" }, // fecha de culminacion de contrato. 
    token : { type : Number }, //todos los token debe ser numeros de 6 caracteres.
    emailVerify : { type : Boolean, default : false} //este campo guarda un token que debera saber el admin maste rpara poder agregar un nuevo administrador. Este Token llegara a un unico correo. es como un doble factor de seguridad
},{
    timestamps : true
});

module.exports = model('adminModel', userAdminSchema, 'admins');

