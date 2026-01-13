const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelStopped = require('../models/stoppedUser.js');
 
const modelArtes = require('../models/artes.js');
const modelAirplane = require('../models/airplane.js');
const modelItems = require('../models/items.js');
const modelAutomotive = require('../models/automotive.js');
const modelRealstate = require('../models/realstate.js');
const modelNautical = require('../models/nautical.js');
const modelService = require('../models/services.js');
const modelAuction = require('../models/auction.js');
const modelRaffle = require('../models/raffle.js');
const modelRaffleHistory = require('../models/raffleHistory.js');

const modelBuySell = require('../models/buySell.js');
const modelInvoice = require('../models/invoice.js');
const modelUserAdmin = require('../models/useradmind.js');
const modelBankAccount = require('../models/bank.js');
const modelBannerFront = require('../models/bannerFront.js');
const modelNewsDay = require('../models/newsDay.js');
const modelBackgroundSign = require('../models/backgroundSign.js');
const modelBannerDefault = require('../models/bannerUserDefault.js');
const modelRateCurrency = require('../models/rateCurrency.js');
const modelAdminProfile = require('../models/profileAdmin.js'); 
const modelDocumentInvoice = require('../models/documentInvoices.js');
const modelDocumentReceipt = require('../models/documentReceipt.js');
const modelMessage = require('../models/messages.js');

const modelReport = require('../models/report.js');
const modelCrono = require('../models/croneTask.js');

const fetch = require('node-fetch'); //ver: 2.6.1 ultima dependencia instalada. 

const cron = require('node-cron');
const pdfMake = require('pdfmake');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;//esto no tendrá cambio

const path = require('path');

const nodemailer = require('nodemailer');
const mail_master = process.env.mail_master;  //aqui esta el correo master-administrativo;


cloudinary.config({
    cloud_name : process.env.CLOUD_NAME,
    api_key: process.env.API_KEY, 
    api_secret : process.env.API_SECRET,
    secure: true
})

const axios = require('axios');
const fs = require('fs-extra');
const {S3} = require('aws-sdk');

const endpoint = 'nyc3.digitaloceanspaces.com';
const bucketName = 'bucket-blissve';

const s3 = new S3({
    endpoint,
    region : 'us-east-1',
    credentials : {
        accessKeyId : process.env.ACCESS_KEY,
        secretAccessKey : process.env.SECRET_KEY
    }
});

//este Token es la KEY del bot de Telegram
const Token =  process.env.Token_Bot;

routes.get('/admin', (req,res)=>{
    const userAdmin = req.session.userAdmin;
    console.log("Aqui el admin ---->",userAdmin);

    const registerNewAdmin = req.session.registerNewAdmin;
    const success_session = req.session.success_session;
    const deleteRegister = req.session.deleteRegister; //"No se pudo registrar un administrador.";

    delete req.session.registerNewAdmin;
    delete req.session.success_session;
    delete req.session.deleteRegister;

    res.render('admin/home', {userAdmin, registerNewAdmin, success_session, deleteRegister});
    
});

routes.get('/admin/signup', (req,res)=>{
    const userAdmin = req.session.userAdmin;

    const shortPassword = req.session.shortPassword;
    const emailInUse = req.session.emailInUse;
    const adminNameInUse = req.session.adminNameInUse;
    

    delete req.session.shortPassword;
    delete req.session.emailInUse;
    delete req.session.adminNameInUse;


    res.render('admin/signup', {userAdmin, shortPassword, emailInUse, adminNameInUse });
    
});

routes.post('/admin/signup', async (req,res)=>{
    //console.log("esto es el cuerpo de la peticion",req.body);
    
    const {adminName, email, rol, password, confirmPassword, recaptchaResponse } = req.body
    //console.log("estos son los datos que llegan del front al back-end")
    const secretKey = "6LdfbNEmAAAAAJ_fJWvKiDg5HfmooDmnVWH-zt-4"; 
    let count;
    const search = await modelUserAdmin.find();

    console.log("......................'/admin/signup'.........................");

    const datos = {
        secret : secretKey,
        response : recaptchaResponse
    };

        fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: "post",
            body: new URLSearchParams(datos),
            headers: {"content-type" : "application/x-www-form-urlencoded"}
      
        })
        .then(response =>response.json() )
        .then( jsonx => {
            //console.log("--------------reCAPTCHA-------------------");
            //console.log("enviando feth a google reCAPTCHA");
            //console.log(jsonx);
            const success = jsonx.success;
            const score = jsonx.score;
            //const score = 0.4; para test 
            console.log(`success -> ${success} | score -> ${score}`);

            if (success === true){   

                if (score >= 0.5){
                    console.log("Es un humano");

                    if (search.length !==0){
                        //console.log("********* Test ***********");
                        //console.log("Esto es search", search);
                        //console.log("search.length --->", search.length);
                        const ultimateNum = search[search.length - 1].workerNumber;
                        //console.log("ultimateNum :", ultimateNum );
                        count = ultimateNum + 1;
                    } else {
                        //esta virgen la DB y no hay ningun administrador
                        count = 1
                    }
                    
                
                    if (password === confirmPassword){
                    
                        if (password.length <= 6) {
                            console.log('el password es muy corto debe tener al menos 7 caracteres');
                            req.session.shortPassword = 'El password es muy corto debe tener al menos 7 caracteres';
                            res.redirect('/admin/signup');
                        } else {

                            search.forEach((ele, i)=>{
                                const Email = ele.email;
                                
                                if (Email === email){
                                    console.log('Este correo ya esta siendo utilizado por otro admin');
                                    req.session.emailInUse = 'Este email ya esta siendo utilizado';
                                    res.redirect('/admin/signup');
                                } else {
                                 
                                    search.forEach((ele)=>{
                                        const AdminName= ele.adminName;

                                        if (AdminName === adminName){
                                            console.log ('Este nombre de admin ya esta siendo utilizado, el nombre debe ser unico');
                                            req.session.adminNameInUse = 'Este nombre de admin ya esta siendo utilizado, El nombre debe ser unico';
                                            res.redirect('/admin/signup');
                                        } else {
                                            let hashPassword;
                                            let newTN, newToken; 

                                            //declarado arriba 
                                            console.log("mail_master-->", mail_master);
                                            

                                            //funcion para crear token
                                            async function createToken(){
                                                createNewToken()
                                                function createNewToken(){
                                                    let ran = Math.random();
                                                    let random = Math.ceil(ran * 1000000);
                                                    newTN = random.toString(); //este estrin de numeros puede ser de 5 caracteres entonces lo forzo a que sean 6;
                                                }    
                                    
                                                while(newTN.length < 6){
                                                    createNewToken()
                                                } 
                                    
                                                newToken = `${newTN}`;
                                                //console.log("newToken", newToken);
                                    
                                            }

                                            //encriptar contraseñas
                                            async function hashing(){
                                                hashPassword = await bcrypt.hash(password, 6);
                                                console.log("Este es el hash del password--->",hashPassword);
                                                /* const compares = await bcrypt.compare(password, hashPassword);
                                                console.log("resul de la compracion--->",compares) */

                                                //---------- fecha de registro en formato dd-mm-yyy -----------
                                                let dateNow = new Date();
                                                let dia = dateNow.getDate();
                                                let mes = dateNow.getMonth() +1;
                                                let anio = dateNow.getFullYear();

                                                let date = `${dia}-${mes}-${anio}`;
                                                //--------------------------------------------------------------

                                                const admin = new modelUserAdmin({adminName, email, rol, password: hashPassword, dates: date, workerNumber : count, token: newToken });
                                                const adminSave = await admin.save();
                                                console.log("aqui admin en la base de datos ---->",adminSave);
                                            }
                                            
                                            //enviar correo con token de seguridad
                                            async function sendToken(){
                                                
                                                const message = "Confirmación de creación de Cuenta Administrativa"
                                                const contentHtml = `
                                                <h2 style="color: black"> Se esta creando una nueva Cuenta Administrativa. </h2>
                                                <ul style="color: black"> 
                                                    <li> cuenta : ${mail_master} </li> 
                                                    <li> asunto : ${message} </li>
                                                <ul>
                                                <h2 style="color: black"> ${newToken} </h2>
                                                <p> <b> Estimado administrador, </b> Si usted no ha solicitado crear nueva cuenta admisnitrativa, Pongase en contacto con sus superiores e informe la situación.</p>
                                                `
                                    
                                                //enviar correo
                                                //(SMTP)-> Simple Mail Transfer Protocol --> es el protocolo con que los servidores se comunican a traves de correos.
                                                const emailMessage = {
                                                    from: "Blissenet<sistemve@blissenet.com>", //remitente
                                                    to: mail_master,
                                                    subject: "🔑 Creación de nueva cuenta administrativa - Blissenet", //objeto
                                                    text: message,
                                                    html: contentHtml
                                                };
                                    
                                                //añadir las credenciales
                                                const transport = nodemailer.createTransport({
                                                    host: "mail.blissenet.com",
                                                    port: 465,
                                                    auth: {
                                                        user: "sistemve@blissenet.com",
                                                        pass: process.env.pass_sistemve
                                                    }
                                                });
                                    
                                                transport.sendMail(emailMessage, (error, info) => {
                                                    if (error) {
                                                        console.log("Error enviando email")
                                                        console.log(error.message)
                                                    } else {
                                                        console.log("Email enviado")
                                                        
                                                    }
                                                }) 
                                            
                                            }

                                            //ejecucion de funciones
                                            createToken()
                                                .then(()=>{
                                                    hashing()
                                                        .then(()=>{
                                                            sendToken()
                                                                .then(()=>{
                                                                    req.session.newAdmin = adminName; //este es el userAdmin del nuevo admin que se desea registrar
                                                                    console.log("proceso inicial de registro OK")                                        
                                                                    res.redirect('/admin/signup-verify');
                                                                })
                                                                .catch((error)=>{
                                                                    console.log("Ha habido un error sendToken()")
                                                                })
                                                        })
                                                        .catch((error)=>{
                                                            console.log("Ha habido un error hashing()")
                                                        })
                                                })
                                                .catch((error)=>{
                                                    console.log("Ha habido un error createToken()")
                                                })

                                        }

                                    })

                                    
                                }


                            })


                            
                        }
                    
                    } else {
                        console.log ('Error al confirmar el password');
                        res.redirect('/admin/signup');
                    }


                } else {
                    req.session.seeBot = "Hemos detectado un comportamiento inusual en Blissenet.com";
                    res.redirect('/admin/signup');
                    console.log("Eres un fucking bot");
                }    

            } else {
                res.redirect('/admin/signup');
                console.log("La verificacion de reCAPTCHA ha Fallado");
            }  

        })
        .catch( err => console.log(err));       
                    
    
    
});

routes.get('/admin/signup-verify', async (req,res)=>{
    const userAdmin = req.session.userAdmin;
    const newAdmin = req.session.newAdmin
    console.log("userAdmin ->", userAdmin );

    res.render('admin/signup-verify', { userAdmin, newAdmin });

});

routes.post('/admin/signup-verify', async(req, res)=>{
    console.log(req.body);
    const {new_admin, token} = req.body;

    const userAdmin = req.session.userAdmin; //aqui esta el admin Master que ha registrado al nuevo admin
    let usernameAdminMaster;

    // es posible que pueda crearse un registro sin un admin-master haya ejecutado la operacion. 
    if (userAdmin){
        usernameAdminMaster = userAdmin[0].adminName;
    } else {
        usernameAdminMaster = "Sin Admin-Master";
    }
    console.log("usernameAdminMaster-->", usernameAdminMaster);
    

    const searchNewAdmin = await modelUserAdmin.find({adminName: new_admin});
    //console.log("searchaNewAdmin ->", searchaNewAdmin);
    const Token = searchNewAdmin[0].token;
    const mailNewAdmin = searchNewAdmin[0].email;

    if (Token == token){
        console.log("Es el token de seguridad");

        //actualizamos la DB
        async function updateDB(){
            const updateAdmin = await modelUserAdmin.updateOne({adminName : new_admin}, { $set : { emailVerify: true } });
        }
        
        //enviamos un correo de bienvenida al nuevo admin registrado
        async function sendEmailNewAdmin(){
            
            //enviamos al correo el nuevo token a usar
            const message = "Registro Exitoso"
            const contentHtml = `
            <h2 style="color: black"> Cuenta Administrativa Creada. </h2>
            <ul style="color: black"> 
                <li> cuenta : ${mailNewAdmin} </li>
                <li> user-admin : ${new_admin} </li> 
                <li> asunto : ${message} </li>
                <li> admin-master : ${usernameAdminMaster} </li> 
            <ul>
            <h2 style="color: black"> <b>${usernameAdminMaster}</b> usted ahora es un Administrador. </h2>
            <p> <b> Estimado Administrador, </b> Usted es parte del equipo de Blissenet.com y debe cumplir con el estatuto de Administrador presentado por su superior, cuyo documento debe haber firmado. Para poder ejerser este nuevo puesto adquirido. </p>
            `
    
            //enviar correo
            //(SMTP)-> Simple Mail Transfer Protocol --> es el protocolo con que los servidores se comunican a traves de correos.
            const emailMessage = {
                from: "Blissenet<sistemve@blissenet.com>", //remitente
                to: mailNewAdmin,
                subject: "Bienvenid@ al Equipo - Blissenet", //objeto
                text: message,
                html: contentHtml
            };
    
            //añadir las credenciales
            const transport = nodemailer.createTransport({
                host: "mail.blissenet.com",
                port: 465,
                auth: {
                    user: "sistemve@blissenet.com",
                    pass: process.env.pass_sistemve
                }
            });
    
            transport.sendMail(emailMessage, (error, info) => {
                if (error) {
                    console.log("Error enviando email")
                    console.log(error.message)
                } else {
                    console.log("Email enviado")
                    
                }
            }) 
            
                         
        }

        //enviamos un correo de Registro exitoso a la cuenta Admin-Master
        async function sendEmailAdminMaster(){
    
            const message = "Registro Exitoso"
            const contentHtml = `
            <h2 style="color: black"> Cuenta Administrativa Creada. </h2>
            <ul style="color: black"> 
                <li> cuenta : ${mail_master} </li>
                <li> admin-master : ${usernameAdminMaster} </li> 
                <li> asunto : ${message} </li>
                <li> nueva-cuenta : ${mailNewAdmin} </li>
                <li> user-admin : ${new_admin} </li>
            <ul>
            <h2 style="color: black"> <b> ${usernameAdminMaster}</b> ha creado un nuevo puesto Administrativo. </h2>
            <p> <b> Como Admin-Master, </b> Usted es responsable de velar por el entrenamiento y supervisión del administrador en todos los procesos que este ejecutará. Debe asegurarse de que antes de que incie sus operaciones como administrador este firme un documento donde se apega al Estatuto de Administrador. </p>
            `
    
            //enviar correo
            //(SMTP)-> Simple Mail Transfer Protocol --> es el protocolo con que los servidores se comunican a traves de correos.
            const emailMessage = {
                from: "Blissenet<sistemve@blissenet.com>", //remitente
                to: mail_master,
                subject: "Bienvenid@ al Equipo - Blissenet", //objeto
                text: message,
                html: contentHtml
            };
    
            //añadir las credenciales
            const transport = nodemailer.createTransport({
                host: "mail.blissenet.com",
                port: 465,
                auth: {
                    user: "sistemve@blissenet.com",
                    pass: process.env.pass_sistemve
                }
            });
    
            transport.sendMail(emailMessage, (error, info) => {
                if (error) {
                    console.log("Error enviando email")
                    console.log(error.message)
                } else {
                    console.log("Email enviado")
                    
                }
            }) 
            
                            
        }

        //ejecutamos la secuencia de funciones
        updateDB()
            .then(()=>{
                sendEmailNewAdmin()
                    .then(()=>{
                        sendEmailAdminMaster()
                            .then(()=>{
                                console.log("Procesos de registro exitoso OK");
                                console.log("Usted ha registrado exitosamente a un nuevo admin");
                                req.session.registerNewAdmin = 'Usted ha registrado exitosamente a un nuevo Admin'
                                res.redirect('/admin');
                            })
                            .catch((error)=>{
                                console.log("Ha habido un error sendEmailAdminMaster()", error);        
                            })
                    })
                    .catch((error)=>{
                        console.log("Ha habido un error sendEmailNewAdmin()", error);
                    })
            })
            .catch((error)=>{
                console.log("Ha habido un error updateDB()", error);
            })




    } else {
        console.log("No conoce el token de seguridad, eliminar el registro");
        req.session.deleteRegister = "Registro Denegado.";
        const deleRegister = await modelUserAdmin.deleteOne({adminName : new_admin});
        res.redirect('/admin');   
    }

    
});

routes.post('/admin/signup-delete', async(req, res)=>{
    console.log("req.body ->", req.body);
    const { user } = req.body;

    //ahora eliminamos este admin sin permisos
    const searchAdmin = await modelUserAdmin.deleteOne({ adminName : user });
    console.log("El admin a eliminar es este -->", searchAdmin);

    const result = { "type" : "delete" , "resp" : "Registro Eliminado" };
    res.json(result);

});

routes.get('/admin/signin', (req,res)=>{
    const userAdmin = req.session.userAdmin;

    const lockedAdmin = req.session.lockedAdmin;
    const noAccount = req.session.noAccount;
    const errorPassw = req.session.errorPassw;
    const seeBot = req.session.seeBot;

    delete req.session.lockedAdmin;
    delete req.session.noAccount;
    delete req.session.errorPassw;
    delete req.session.seeBot;

    res.render('admin/signin', {userAdmin, lockedAdmin, noAccount, errorPassw, seeBot});
    
});

routes.post('/admin/signin', async (req,res)=>{
    const {email, password, recaptchaResponse } = req.body;
    const secretKey = '6LfiYtEmAAAAAJijFJXY0QI0amKJORxHJhTLT_Ti';
    const searchAdmin = await modelUserAdmin.find({email});

    console.log("......................'/admin/signin'.........................");

    const datos = {
        secret : secretKey,
        response : recaptchaResponse
    };

        fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: "post",
            body: new URLSearchParams(datos),
            headers: {"content-type" : "application/x-www-form-urlencoded"}
      
        })
        .then(response =>response.json() )
        .then( jsonx => {
            //console.log("--------------reCAPTCHA-------------------");
            //console.log("enviando feth a google reCAPTCHA");
            //console.log(jsonx);
            const success = jsonx.success;
            const score = jsonx.score;
            //const score = 0.4; para test 
            console.log(`success -> ${success} | score -> ${score}`);
    
            if (success === true){
                if (score >= 0.5){
                    console.log("Es un humano");
    
                    console.log("Esto es searchAdmin --->", searchAdmin);
                    
                    if (searchAdmin.length !== 0 ){

                        if (searchAdmin[0].locked === false && searchAdmin[0].emailVerify === true){    

                            const hashPassword = searchAdmin[0].password;
                           
                            async function Compare(){
                                const compares = await bcrypt.compare(password, hashPassword);
                                console.log("resul de la comparacion--->",compares) //true or false;

                                if ( compares == true ){
                                    console.log("¡Session iniciado con exito!");
                                    req.session.userAdmin = searchAdmin; //aqui creo la sesion y la expando a todo el sistema.
                                    req.session.success_session = "¡Session iniciado con exito!";
                                    res.redirect('/admin');
                                } else {
                                    console.log("¡Password errado!");
                                    console.log("hashPassword ......:", hashPassword);
                                    req.session.errorPassw = "¡Password Errado!";
                                    res.redirect('/admin/signin');
                                };

                            };

                            Compare();
                        
                        } else {
                            req.session.lockedAdmin = "¡Su cuenta administrativa ha sido Bloqueada o no tiene los permisos requeridos!"
                            console.log("No existe esta cuenta")
                            res.redirect('/admin/signin');
                        }   
                            
                    } else {
                        req.session.noAccount = "¡No existe esta cuenta!";
                        console.log("¡No existe esta cuenta!");
                        res.redirect('/admin/signin');
                    }
                    
                        
                } else {
                    //req.session.seeBotObjec = { "message" : "Hemos detectado un posible ataque", "score" : score };
                    req.session.seeBot = "Hemos detectado un comportamiento inusual en Blissenet.com";
                    res.redirect('/admin/signin');
                    console.log("Eres un fucking bot");
                }    
            } else {
                
                //req.session.recaptchaFail = "La verificacion de reCAPTCHA ha Fallado";
                res.redirect('/admin/signin');
                console.log("La verificacion de reCAPTCHA ha Fallado");
            }
    
        })
        .catch( err => console.log(err));       
    
           
    
});

routes.get('/admin/demographic', async (req, res)=>{
    const userAdmin = req.session.userAdmin;

    res.render('admin/demographic', {userAdmin});
});

routes.get('/admin/commercial', async (req, res)=>{
    const userAdmin = req.session.userAdmin;   
    console.log(":::: estamos en /admin/commercial ::::")
   
    res.render('admin/commercial', {userAdmin});
});

routes.get('/admin/commercial-data', async (req, res)=>{
    const boxAds = [];
    let sumBoxAds;

    const resultArte = await modelArtes.find().count();
    const resultAero = await modelAirplane.find().count();
    const resultItem = await modelItems.find().count();
    const resultAuto = await modelAutomotive.find().count();
    const resultNaut = await modelNautical.find().count();
    const resultReal = await modelRealstate.find().count();
    const resultServ = await modelService.find().count();
    const resultAuct = await modelAuction.find().count();

    if (resultArte >= 0){
        boxAds.push({"Artes" : resultArte })
    }
    if (resultAero >= 0){
        boxAds.push({"Aeroplanos" : resultAero})
    }
    if (resultItem >= 0){
        boxAds.push({"Items" : resultItem})
    }
    if (resultAuto >= 0){
        boxAds.push({"Automotriz" : resultAuto})
    }
    if (resultNaut >= 0){
        boxAds.push({"Nauticos" : resultNaut})
    }
    if (resultReal >= 0){
        boxAds.push({"Realstate" : resultReal})
    }
    if (resultServ >= 0){
        boxAds.push({"Servicios" : resultServ})
    }
    if (resultAuct >= 0){
        boxAds.push({"Subastas" : resultAuct})
    }

    sumBoxAds = resultArte + resultAero + resultItem + resultAuto + resultNaut + resultReal + resultServ + resultAuct
    

    console.log(":::: estamos en GET /admin/commercial-data ::::")
    console.log(":::boxAds :", boxAds)
    console.log(":::sumaBoxAds", sumBoxAds);
    const objeData = { boxAds, sumBoxAds}
    res.json(objeData);
});       

routes.post('/admin/commercial-data', async (req, res)=>{
   
    console.log("Estamo enviado a admin/commercial-data");
    //console.log(req.body);
    const {dateFirst, dateLast} = req.body;
    const boxAds = [];
    console.log("dateFirst :", dateFirst);
    console.log("dateLast :", dateLast);
      
    const resArte = await modelArtes.find({ createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}).count();
    if (resArte >= 0){
        boxAds.push({ "Artes" : resArte });
    }
    const resAero = await modelAirplane.find({ createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}).count();
    if (resAero >=0){
        boxAds.push({ "Aeroplanos" : resAero });
    }
   const resItem = await modelItems.find({ createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}).count();
    if (resItem >= 0){
        boxAds.push({ "Items" : resItem });
    }
    const resAuto = await modelAutomotive.find({ createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}).count();
    if (resAuto >= 0){
        boxAds.push({ "Automotriz" : resAuto });
    }
    const resNaut = await modelNautical.find({ createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}).count();
    if (resNaut >= 0){
        boxAds.push({ "Nauticos" : resNaut });
    }
    const resReal = await modelRealstate.find({ createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}).count();
    if (resReal >= 0){
        boxAds.push({ "Realstate" : resReal });
    }
    const resServ = await modelService.find({ createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}).count();
    if (resServ >= 0){
        boxAds.push({ "Servicios" : resServ });
    }
    const resAuct = await modelAuction.find({ createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}).count();
    if (resAuct >= 0){
        boxAds.push({ "Subastas" : resAuct });
    }    
    


    console.log("::::Esto es la operacion por rango de fechas::::");
    console.log(":::boxAds :", boxAds);   
    res.json({boxAds});

});

routes.get('/admin/mercantil', async (req, res)=>{
    const userAdmin = req.session.userAdmin;   
    console.log(":::: estamos en /admin/mercantil ::::")
   
    res.render('admin/mercantil', {userAdmin});
});

routes.get('/admin/mercantil-data', async (req, res)=>{
    const boxAds = [];
    const boxAdsPaid = [];
    const boxIncome = [];

    let sumBoxAds, sumBoxAdsPaid;

    //cantidad de documentos que se pueden interpretar como facturas generadas.
    
    const resultBuySell = await modelBuySell.find().count();
    const resultInvoice = await modelInvoice.find().count();
   

    if (resultBuySell >= 0){
        boxAds.push({"buySells" : resultBuySell });
    }
    if (resultInvoice >= 0){
        boxAds.push({"invoices" : resultInvoice });
    }
   
    //buscaremos recivos pagados
    const resultBuySellPaid = await modelBuySell.find({ payCommission : true }).count()
    const resultInvoicePaid = await modelInvoice.find({ payCommission : true }).count()

    if (resultBuySellPaid >= 0){
        boxAdsPaid.push({"buySells" : resultBuySellPaid });
    }
    if (resultInvoicePaid >= 0){
        boxAdsPaid.push({"invoices" : resultInvoicePaid });
    }


    sumBoxAds = (resultBuySell + resultInvoice);
    sumBoxAdsPaid = (resultBuySellPaid + resultInvoicePaid);

    //::::bloque de income--------------

     //obtener toda la informacion de cuanto significa en recursos todos los recivos generados en su totalidad.
     const resBuySellAllUSD = await modelBuySell.aggregate([ {$group: { _id: "", totalBuySellAllUSD : { $sum : "$commission" }}} ]);
     const resInvoiceAllUSD = await modelInvoice.aggregate([ {$group: { _id: "", totalInvoiceAllUSD : { $sum : "$commission" }}} ]);
   
 
     if (resBuySellAllUSD){
         boxIncome.push(...resBuySellAllUSD);
     }
     if (resInvoiceAllUSD){
         boxIncome.push(...resInvoiceAllUSD);
     }
 
     const resBuySellIncomeUSD = await modelBuySell.aggregate([ {$group: { _id: "$payCommission", buySellUSD : { $sum : "$commission" }}} ]);
     const resInvoiceIncomeUSD = await modelInvoice.aggregate([ {$group: { _id: "$payCommission", invoiceUSD : { $sum : "$commission" }}} ]);
     
   
     if (resBuySellIncomeUSD){
         boxIncome.push(...resBuySellIncomeUSD);
     }
     if (resInvoiceIncomeUSD){
         boxIncome.push(...resInvoiceIncomeUSD);
     }
 
     const resBuySellIncomeVES = await modelBuySell.aggregate([ {$group: { _id: "$payCommission", buySellVES : { $sum : "$montoPay" }}} ]);
     const resInvoiceIncomeVES = await modelInvoice.aggregate([ {$group: { _id: "$payCommission", invoiceVES : { $sum : "$montoPay" }}} ]);
     
 
     if (resBuySellIncomeVES){
         boxIncome.push(...resBuySellIncomeVES);
     }
     if (resInvoiceIncomeVES){
         boxIncome.push(...resInvoiceIncomeVES);
     }
 
     console.log(":::boxIncome", boxIncome);

    //----------------------------------

    console.log(":::: estamos en GET /admin/mercantil-data ::::");
    console.log(":::boxAds :", boxAds)
    console.log(":::sumaBoxAds", sumBoxAds);
    const objeData = { boxAds, sumBoxAds, boxAdsPaid, sumBoxAdsPaid, boxIncome}
    res.json(objeData);
}); 

routes.post('/admin/mercantil-data', async (req, res)=>{

    console.log("Estamo enviado a admin/mercantil-data");
    //console.log(req.body);
    const {dateFirst, dateLast} = req.body;
    const boxAds = [];
    const boxAdsPaid = [];
    const boxIncome = [];

    let sumBoxAds, sumBoxAdsPaid;
    console.log("dateFirst :", dateFirst);
    console.log("dateLast :", dateLast);
    console.log(":::Vamos bien!");

 
    //cantidad de documentos que se pueden interpretar como facturas generadas en un rango de tiempo establecido.
    const resultBuySell = await modelBuySell.find({ createdAt: { $gte: new Date(dateFirst), $lte: new Date(dateLast) }}).count();
    const resultInvoice = await modelInvoice.find({createdAt: { $gte: new Date(dateFirst), $lte: new Date(dateLast) }}).count();
    

    if (resultBuySell >= 0){
        boxAds.push({"buySells" : resultBuySell });
    }
    if (resultInvoice >= 0){
        boxAds.push({"invoices" : resultInvoice });
    }
   
    //buscaremos recivos pagados
    const resultBuySellPaid = await modelBuySell.find({ payCommission : true, createdAt: { $gte: new Date(dateFirst), $lte: new Date(dateLast) }}).count();
    const resultInvoicePaid = await modelInvoice.find({ payCommission : true, createdAt: { $gte: new Date(dateFirst), $lte: new Date(dateLast) }}).count();

    if (resultBuySellPaid >= 0){
        boxAdsPaid.push({"buySells" : resultBuySellPaid});
    }
    if (resultInvoicePaid >= 0){
        boxAdsPaid.push({"invoices" : resultInvoicePaid});
    }
 

    sumBoxAds = (resultBuySell + resultInvoice);
    sumBoxAdsPaid = (resultBuySellPaid + resultInvoicePaid);


    //::::bloque de income--------------

     //obtener toda la informacion de cuanto significa en recursos todos los recivos generados en su totalidad.
     const resBuySellAllUSD = await modelBuySell.aggregate([ {$match: { createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}}, {$group: { _id: "", totalBuySellAllUSD : { $sum : "$commission" }}} ]);
     const resInvoiceAllUSD = await modelInvoice.aggregate([ {$match: { createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}}, {$group: { _id: "", totalInvoiceAllUSD : { $sum : "$commission" }}} ]);
   
     boxIncome.push(...resBuySellAllUSD);
     boxIncome.push(...resInvoiceAllUSD);
 
     if (resBuySellAllUSD){
         boxIncome.push(...resBuySellAllUSD);
     }
     if (resInvoiceAllUSD){
         boxIncome.push(...resInvoiceAllUSD);
     } 

     const resBuySellIncomeUSD = await modelBuySell.aggregate([ {$match: { createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}}, {$group: { _id: "$payCommission", buySellUSD : { $sum : "$commission" }}} ]);
     const resInvoiceIncomeUSD = await modelInvoice.aggregate([ {$match: { createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}}, {$group: { _id: "$payCommission", invoiceUSD : { $sum : "$commission" }}} ]);
     
     boxIncome.push(...resBuySellIncomeUSD);
     boxIncome.push(...resInvoiceIncomeUSD);
     
     if (resBuySellIncomeUSD){
         boxIncome.push(...resBuySellIncomeUSD);
     }
     if (resInvoiceIncomeUSD){
         boxIncome.push(...resInvoiceIncomeUSD);
     } 

     const resBuySellIncomeVES = await modelBuySell.aggregate([ {$match: { createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}}, {$group: { _id: "$payCommission", buySellVES : { $sum : "$montoPay" }}} ]);
     const resInvoiceIncomeVES = await modelInvoice.aggregate([ {$match: { createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)}}}, {$group: { _id: "$payCommission", invoiceVES : { $sum : "$montoPay" }}} ]);
     
 
  
     if (resBuySellIncomeVES){
         boxIncome.push(...resBuySellIncomeVES);
     }
     if (resInvoiceIncomeVES){
         boxIncome.push(...resInvoiceIncomeVES);
     } 
 
     console.log(":::boxIncome", boxIncome);

    //console.log(":::: estamos en GET /admin/mercantil-data ::::");
    //console.log(":::boxAds :", boxAds)
    //console.log(":::sumaBoxAds", sumBoxAds);
    const objeData = { boxAds, sumBoxAds, boxAdsPaid, sumBoxAdsPaid, boxIncome}
    res.json(objeData);
});  

//esta ruta provee al modulo demographic de todos los datos necesarios con una respuesta json()
routes.get('/admin/demographic-data', async (req, res)=>{
    const boxDates = [];
    const boxAge = [];
    const boxGender = [];
   
    //:::::::: obtener la cantidad de usuarios 
    const usersCount = await modelUser.find().count();
    const profileCount = await modelProfile.find().count();
   

    //:::::::: obtener la edad de los usuarios con profiles.
    const currentDate = new Date(); //aqui obtengo la fecha actual (lo que realmente requiero es el año en curso)
    console.log("Esto es currentDate --->", currentDate);
    const yearCurrent = currentDate.getFullYear();//aqui el año en curso
    console.log(yearCurrent);

    const profileAgeSexo = await modelProfile.find();
    //console.log("Esto es profileAgeSexo ---->", profileAgeSexo);
    profileAgeSexo.forEach((ele)=>{
        const date = ele.dateborn;
        const gender = ele.gender;
       
        boxDates.push(date); //fecha de nacimiento. 
        boxGender.push(gender); //genero de la persona "sexo".
       
    });

    console.log("Esto es boxDates ---->",boxDates);
    boxDates.forEach((ele)=>{
        const year = ele.getFullYear();
       
        const age = yearCurrent - year
        boxAge.push(age);

    });

    //agrupo los lugares y sumo
    const places = await modelProfile.aggregate( [{$group: { _id : "$states", repetido: {$sum: 1}} }] );
    console.log("Esto es places ---->", places)
 
    console.log("Esto es boxAge", boxAge);
    console.log("Esto es boxGender", boxGender);
  
    const objectDemoUser = { users : usersCount, profiles : profileCount, ages : boxAge, gender : boxGender, place : places };
    console.log("Esto es objectDemoUser --->",objectDemoUser);

    
    res.json(objectDemoUser);
})

routes.get('/admin/update-rate', async (req, res)=>{
    const userAdmin = req.session.userAdmin;
    const updateCurrency = req.session.updateCurrency;
    delete req.session.updateCurrency; 

    const currentCurrency = await modelRateCurrency.find().sort({_id : -1});
    //console.log("Esto es currentCurrency ---->",currentCurrency)

    res.render('admin/updateRate', {userAdmin, updateCurrency, currentCurrency});
});

// esto ruta es para actualizar la data /admin/update-rate
routes.post('/admin/update-rate', async (req, res)=>{
    const currency = "VES";
    console.log("Aqui la informacion del precio llegando de administracion");
    console.log(req.body);
    const { currentDay, currentPrice } = req.body;

    //primero vamos a consultar la DB
    const resultSearch = await modelRateCurrency.find({ currentDay });
    console.log( "esto es resultSearch ---->", resultSearch);

    if ( resultSearch.length == 0 ){
        const currencyVES = new modelRateCurrency({ currency, currentDay, currentPrice  });
        const currencyDB = await currencyVES.save();
        req.session.updateCurrency = "¡Actualización Exitosa!";
        console.log(currencyDB);
        const response = { "data" : "¡data actualizada exitosamente!"}
        res.json(response);
    } else {
        console.log("data ya actualizada, no puede volver a guardarse")
        const response = { "data" : "data ya actualizada, no puede volver a guardarse"}
        res.json(response);
    }
    
});

// esta ruta es para obtener la ultima data actualizada.
// es el primer paso, ver el diseño en la carpeta design "currencyCurrent.excalidraw".
routes.post('/admin/update-rate-show', async (req, res)=>{
    const currentDay = req.body.currentDay;
    console.log("Esta llegando esto del frontend")
    
    const searchCurrentCurrency = await modelRateCurrency.find({ currentDay });
    console.log("Esto es lo buscado en la DB searchCurrentCurrency --->",searchCurrentCurrency)
    
    if (searchCurrentCurrency.length !== 0){
        const data = { "info" : "Update", searchCurrentCurrency}
        res.json(data);
    } else {
        const data = { "info" : "No_Update"}
        res.json(data);
    }
    
});

routes.get('/admin/buydirect', async (req,res)=>{
    const userAdmin = req.session.userAdmin;
     
    if (userAdmin){
        const adminName = userAdmin[0].adminName; 
        console.log("Aqui el adminName ---->", adminName);

        const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName }).sort({createdAt : -1});
        const searchToProcessCount = null;
        const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
        const searchToProcessNoPayCount = null;
        const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true }).sort({createdAt : -1});
        const searchHistoryCount = null;

        res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount });
    
    } else {

        res.render('admin/buydirect', { userAdmin });

    }    

});

routes.post('/admin/buydirect', async (req,res)=>{
console.log("Hemos llegado a /admin/buydirect")

try {
    
    const userAdmin = req.session.userAdmin;    
    const adminName = userAdmin[0].adminName;

    const {dateForm, searcher, selectSearcher } = req.body;
    console.log(dateForm, searcher, selectSearcher);

    console.log("::::::::::::: Process Reports Busquedas :::::::::::::::::::::::::::::")
        
    if (selectSearcher == "Date"){

        if (dateForm.length !==0 ){
            let splitdate = dateForm.split("-");
            let dia = splitdate[2];
            let mes = splitdate[1];
            let anio = splitdate[0];

            let date = `${dia}-${mes}-${anio}`;
            console.log("date is type", typeof date ); 
            console.log("Esto es date :", date);
                
            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, dates : date }).sort({createdAt : -1});
            const searchToProcessCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, dates : date }).count();
            
            const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, dates : date }).sort({createdAt : -1});
            const searchToProcessNoPayCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, dates : date }).count() 
    
            const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, dates : date }).sort({createdAt : -1});
            const searchHistoryCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, dates : date }).count();

            res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount});
        
        } else {

            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName }).sort({createdAt : -1});
            const searchToProcessCount = null;

            const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
            const searchToProcessNoPayCount = null;

            const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true }).sort({createdAt : -1});
            const searchHistoryCount = null;
    
            res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount});

        }

    }

    if (selectSearcher == "Bank"){

        if(searcher.length !==0 ){

            if (dateForm.length !==0 ){
                let splitdate = dateForm.split("-");
                let dia = splitdate[2];
                let mes = splitdate[1];
                let anio = splitdate[0];

                let date = `${dia}-${mes}-${anio}`;
                console.log("date is type", typeof date ); 
                console.log("Esto es date :", date);

                const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, dates : date, bank: searcher }).sort({createdAt : -1});
                const searchToProcessCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, dates : date, bank: searcher }).count();
            
                const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, dates : date }).sort({createdAt : -1});
                const searchToProcessNoPayCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, dates : date }).count() 
            
                const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, dates : date, bank: searcher }).sort({createdAt : -1});
                const searchHistoryCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, dates : date, bank: searcher }).count();
                
                res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount});
            
            } else {

                const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, bank: searcher }).sort({createdAt : -1});
                const searchToProcessCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, bank: searcher }).count();
            
                const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
                const searchToProcessNoPayCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).count() 
            
                const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, bank: searcher }).sort({createdAt : -1});
                const searchHistoryCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, bank: searcher }).count();
                
                res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount});
            
            }

        } else {

            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName }).sort({createdAt : -1});
            const searchToProcessCount = null;

            const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
            const searchToProcessNoPayCount = null;
    
            const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true }).sort({createdAt : -1});
            const searchHistoryCount = null;

            res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount});
            
        }

    }

    if (selectSearcher == "Ref"){

        if(searcher.length !==0 ){

            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, refer: searcher }).sort({createdAt : -1});
            const searchToProcessCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, refer: searcher }).count();
        
            const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
            const searchToProcessNoPayCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).count() 
        
            const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, refer: searcher }).sort({createdAt : -1});
            const searchHistoryCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, refer: searcher }).count();
            
            res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount});
        

        } else {

            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName }).sort({createdAt : -1});
            const searchToProcessCount = null;
    
            const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
            const searchToProcessNoPayCount = null;
        
            const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true }).sort({createdAt : -1});
            const searchHistoryCount = null;
    
            res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount});
            
        }

    }

    if (selectSearcher == "User"){

        if(searcher.length !==0 ){

            if (dateForm.length !==0 ){
                let splitdate = dateForm.split("-");
                let dia = splitdate[2];
                let mes = splitdate[1];
                let anio = splitdate[0];

                let date = `${dia}-${mes}-${anio}`;
                console.log("date is type", typeof date ); 
                console.log("Esto es date :", date);

                const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, usernameSell: searcher, dates : date }).sort({createdAt : -1});
                const searchToProcessCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, usernameSell: searcher, dates : date }).count();
            
                const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, usernameSell: searcher, dates : date }).sort({createdAt : -1});
                const searchToProcessNoPayCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, usernameSell: searcher, dates : date }).count() 
            
                const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, usernameSell: searcher, dates : date }).sort({createdAt : -1});
                const searchHistoryCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, usernameSell: searcher, dates : date }).count();
                
                res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount});
            
            } else {

                const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, usernameSell: searcher }).sort({createdAt : -1});
                const searchToProcessCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, usernameSell: searcher }).count();
            
                const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
                const searchToProcessNoPayCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).count() 
            
                const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, usernameSell: searcher }).sort({createdAt : -1});
                const searchHistoryCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, usernameSell: searcher }).count();
                
                res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount});
            
            }

        } else {

            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName }).sort({createdAt : -1});
            const searchToProcessCount = null;

            const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
            const searchToProcessNoPayCount = null;

            const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true }).sort({createdAt : -1});
            const searchHistoryCount = null;

            res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount});
            
        }

    }

    if (selectSearcher == "Admin"){

        if(searcher.length !==0 ){

            if (dateForm.length !==0 ){
                let splitdate = dateForm.split("-");
                let dia = splitdate[2];
                let mes = splitdate[1];
                let anio = splitdate[0];

                let date = `${dia}-${mes}-${anio}`;
                console.log("date is type", typeof date ); 
                console.log("Esto es date :", date);

                const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, dates : date }).sort({createdAt : -1});
                const searchToProcessCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName, dates : date }).count();
            
                const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, admin: searcher, dates : date }).sort({createdAt : -1});
                const searchToProcessNoPayCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, admin: searcher, dates : date }).count() 
            
                const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, admin: searcher, dates : date }).sort({createdAt : -1});
                const searchHistoryCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, admin: searcher, dates : date }).count();
                
                res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount });
            
            } else {

                const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName }).sort({createdAt : -1});
                const searchToProcessCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName }).count();
            
                const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, admin: searcher }).sort({createdAt : -1});
                const searchToProcessNoPayCount = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, admin: searcher }).count() 
            
                const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, admin: searcher }).sort({createdAt : -1});
                const searchHistoryCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true, admin: searcher }).count();
                
                res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount });
            
            }

        } else {

            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, userDeclare : true, admin: adminName }).sort({createdAt : -1});
            const searchToProcessCount = null;
            const searchToProcessNoPay = await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
            const searchToProcessNoPayCount = null;
            const searchHistory =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, pay : true, confirmPay : 'Yes', process: true }).sort({createdAt : -1});
            const searchHistoryCount = null;
    
            res.render('admin/buydirect', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchHistory, searchHistoryCount});
        
        }

    }

} catch (error) {

    Console.log("Ha habido un error, intente luego");
    
}



});

//:::::::: aqui trabajaremos los administradores ::::::::::
//:::: Estos son los botones "yes" & "No" ::::
//:::: Es tambien donde se crean las facturas o recibos ::::
routes.post('/admin/buydirect/process', async (req,res)=>{
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;
    console.log("Aqui el adminName ---->", adminName );

    console.log(" *** Estas en process de la administracion *** ")
    console.log(req.body);
    const { idOper, Action } = req.body;
    const eleBuySell = await modelBuySell.findById(idOper) //aqui tengo el documento al que voy a extraer el primer dato "indexed"
    const Indexed = eleBuySell.indexed; //aqui tengo el usuario que esta pagando
    const typeService = eleBuySell.department; //aqui obtengo el departamento que es en la factura typeService.
    const amount = (eleBuySell.montoPay).toFixed(2); //aqui obtengo el monto exacto que pago el usuario; 
    const bank = eleBuySell.bank //aqui se si se hizo a traves de un banco o no, (si es Gratis entonces el tipo de documento es Recibo de lo contario es Factura).
    const title = eleBuySell.title //aqui obtengo el titulo del anuncio.
    const orderID = eleBuySell._id //qui obtengo el id del articulo en cuestion importante para diferenciarlo.
    const createdAt = eleBuySell.createdAt //aqui la fecha completa y que debemos acomodar.
    let date;

    let dia = new Date(createdAt).getDate(); //obtener el dia;
    let mes = new Date(createdAt).getMonth()+1; //obtener el mes;
    let anio = new Date(createdAt).getFullYear(); //obtener el año completo;

    if (mes <= 9){
        date = `${dia}-0${mes}-${anio}`;    
    } else {
        date = `${dia}-${mes}-${anio}`;
    }
    
    
    //Datos bancarios
    const searchBank = await modelBankAccount.find({ bankname : bank });//aqui hago una consulta rapida para extraer el numero de cuenta.
    //console.log(":::searchBank ---->", searchBank );
    const accountnumber = searchBank[0].accountnumber //aqui el numero de cuenta bancaria dodne se hizo el pago.

    //ahora vamos a obtener el nombre su documento ID y su direccion.
    const searchProfile = await modelProfile.find({ indexed : Indexed });
    const names = searchProfile[0].names;
    const identification = searchProfile[0].identification;
    const states = searchProfile[0].states;
    const address = searchProfile[0].address;
    const receptorAddress = states + " " + address;

    let lastNumberInvoice, lastNumberReceipt; 
    //llamamos al profileAdmin //aqui se optiene los datos para para crear la factura.
    const profileAdmin = await modelAdminProfile.find();
    //console.log("Aqui los datos de la administracion del marketplace :", profileAdmin)
    //aqui voy a crear las constantes para poder acceder a los datos de forma rapida.
    const platform = profileAdmin[0].platform;
    const company = profileAdmin[0].company;
    const companyID = profileAdmin[0].companyID;
    const coState = profileAdmin[0].coState;
    const coAddress = profileAdmin[0].coAddress;
    const phone = profileAdmin[0].phone1;
    const nameTaxInstitute = profileAdmin[0].nameTaxInstitute;
    const taxesCode = profileAdmin[0].taxesCode;
    const taxesName = profileAdmin[0].taxesName;
    const taxesPercent = profileAdmin[0].taxesPercent;

    const companyAddress = coState + " " + coAddress;
    const fPercent = (taxesPercent + 100) / 100 //esta formula hara que 16 se transforme en 1.16 que seria el 100% del costo mas el 16% del impuesto (formula investigada). 
    
    const taxFree = (amount /  fPercent).toFixed(2) // Monto sin impuesto.
    const taxesAmount = (amount - taxFree).toFixed(2) // Impuesto represenatdo en monto.
    //el monto total es taxFree + taxOnly que es igual a "amount".

    const searchDocumentInvoice = await modelDocumentInvoice.find();
    const searchDocumentReceipt = await modelDocumentReceipt.find();

    if (searchDocumentInvoice.length !== 0){
        const lastDocument =  searchDocumentInvoice[searchDocumentInvoice.length - 1];//aqui buscamos el ultimo documento y revisamos los numeros de recibo y de factura.
        lastNumberInvoice = lastDocument.numberInvoice;
  
    } else {
        lastNumberInvoice = 0;
    }

    if (searchDocumentReceipt.length !== 0){
        const lastDocument =  searchDocumentReceipt[searchDocumentReceipt.length - 1];//aqui buscamos el ultimo documento y revisamos los numeros de recibo y de factura.
        lastNumberReceipt = lastDocument.numberReceipt;

    } else {
        lastNumberReceipt = 0
    }

    const numberInvoice = (lastNumberInvoice + 1);
    const numberReceipt = (lastNumberReceipt + 1);


    if (Action === 'Yes' ){

        try {
            
            //accion que actualiza a un pago de comision verificado por una administrador
            const searchAndUpdate = await modelBuySell.findByIdAndUpdate( idOper, { admin: adminName , process: true, payCommission : true, userDeclare : true } );
            console.log("se ha elegido la accion Yes");
            console.log("el bank es :", bank);//si es Gratis es recibo de lo contratio es factura
            //::::::: Aqui se crea la Factura ::::::::
            if (bank !== 'Gratis'){
            //como ya ha sido procesado como pagado a traves de la banca se procede a crear la factura.  
            const  documentInvoice = new modelDocumentInvoice({ date, bank, accountnumber, platform, nameTaxInstitute, numberInvoice, company, companyID, companyAddress, companyPhone : phone, receptorName : names, receptorID : identification, receptorAddress, typeService, title, orderID, amount, totalAmount : amount, taxesCode, taxesName, taxesPercent, taxFree, taxesAmount, indexed: Indexed });
            console.log("::::::Esto es documentInvoice de tipo Factura :",documentInvoice);
            const documentInvoiceSave = await documentInvoice.save();
        
            }
            
            if (bank === 'Gratis') {

                //como ya ha sido procesado como Gratis ahora se procede a crear el recibo.  
                const  documentReceipt = new modelDocumentReceipt({ date, platform, nameTaxInstitute, numberReceipt, company, companyID, companyAddress, companyPhone: phone, receptorName : names, receptorID : identification, receptorAddress, typeService, title, orderID, amount, totalAmount: 0, taxesCode, taxesName, taxesPercent, taxFree : 0, taxesAmount: 0, indexed: Indexed });
                console.log(":::::Esto es documentInvoice de tipo Recibo :",documentReceipt);
                const documentReceiptSave = await documentReceipt.save();
            }

        } catch (error) {
            console.log("Ha habido un error", error);
        }    
    
    } else {
        //accion que actualiza a un pago de comision No realizado, resetea todos los valores necesarios para que pueda el cliente volver hacer su declaracion de pago.
        const searchAndUpdate = await modelBuySell.findByIdAndUpdate( idOper, { process: false, payCommission : false, userDeclare : false } );
    }

    res.redirect('/admin/buydirect');
    
});

// Ruta contact pertenecientes a Aeroplanos, Automotriz, Realstate, Nautical.
routes.get('/admin/contact', async (req,res)=>{
    const userAdmin = req.session.userAdmin;

    if (userAdmin){

        const adminName = userAdmin[0].adminName; 
        console.log("Aqui el adminName ---->", adminName);
    
        const searchToProcess =  await modelInvoice.find( { $and : [{userDeclare : true },{payCommission : false }, {admin : adminName } ]} ).sort({createdAt : -1});
        const searchToProcessCount = null;
        const searchToProcessNoPay = await modelInvoice.find( { process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
        const searchToProcessNoPayCount = null;
        const searchProcess =  await modelInvoice.find({process: true }).sort({createdAt : -1});
        const searchProcessCount = null;

        res.render('admin/contact', { userAdmin, searchToProcess, searchToProcessCount, searchProcess, searchProcessCount, searchToProcessNoPay, searchToProcessNoPayCount });

    } else {

        res.render('admin/contact', {userAdmin});

    }    
    
});

//:::::::: aqui trabajaremos los administradores ::::::::::
//:::: Estos son los botones "yes" & "No" ::::
//:::: Es tambien donde se crean las facturas o recibos ::::
routes.post('/admin/contact/process', async (req,res)=>{
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;
    console.log("Aqui el adminName ---->", adminName );

    console.log(" *** Estas en process de la administracion Contact *** ")
    console.log(req.body);
    const { idOper, Action } = req.body;
    const eleInvoice = await modelInvoice.findById(idOper) //aqui tengo el documento al que voy a extraer el primer dato "indexed"
    const Indexed = eleInvoice.indexed; //aqui tengo el usuario que esta pagando
    const typeService = eleInvoice.department; //aqui obtengo el departamento que es en la factura typeService.
    const amount = (eleInvoice.montoPay).toFixed(2); //aqui obtengo el monto exacto que pago el usuario; 
    const bank = eleInvoice.bank; //aqui se si se hizo a traves de un banco o no, (si es Gratis entonces el tipo de documento es Recibo de lo contario es Factura).
    const title = eleInvoice.title; //obtencion de titulo
    const title_id = eleInvoice.title_id; //obtencion de titulo
    const orderID = eleInvoice._id //obtencion deID para poder diferenciar a otros que pudieran tener el mismo titulo.
    const createdAt = eleInvoice.createdAt //aqui la fecha completa y que debemos acomodar. esta fecha es el dia en que el usuario decidio pagar
    let date;

    let dia = new Date(createdAt).getDate(); //obtener el dia;
    let mes = new Date(createdAt).getMonth()+1; //obtener el mes;
    let anio = new Date(createdAt).getFullYear(); //obtener el año completo;

    if (mes <= 9){
        date = `${dia}-0${mes}-${anio}`;    
    } else {
        date = `${dia}-${mes}-${anio}`;
    }

    //Datos bancarios
    const searchBank = await modelBankAccount.find({ bankname : bank });//aqui hago una consulta rapida para extraer el numero de cuenta.
    //console.log(":::searchBank ---->", searchBank );

    let accountnumber;
    if (searchBank.length !==0){
        accountnumber = searchBank[0].accountnumber //aqui el numero de cuenta bancaria donde se hizo el pago.
    }

    //ahora vamos a obtener el nombre su documento ID y su direccion.
    const searchProfile = await modelProfile.find({ indexed : Indexed });
    const names = searchProfile[0].names;
    const identification = searchProfile[0].identification;
    const states = searchProfile[0].states;
    const address = searchProfile[0].address;
    const receptorAddress = states + " " + address;

    let lastNumberInvoice, lastNumberReceipt; 
    //llamamos al profileAdmin //aqui se optiene los datos para para crear la factura.
    const profileAdmin = await modelAdminProfile.find();
    //console.log("Aqui los datos de la administracion del marketplace :", profileAdmin)
    //aqui voy a crear las constantes para poder acceder a los datos de forma rapida.
    const platform = profileAdmin[0].platform;
    const company = profileAdmin[0].company;
    const companyID = profileAdmin[0].companyID;
    const coState = profileAdmin[0].coState;
    const coAddress = profileAdmin[0].coAddress;
    const phone = profileAdmin[0].phone1;
    const nameTaxInstitute = profileAdmin[0].nameTaxInstitute;
    const taxesCode = profileAdmin[0].taxesCode;
    const taxesName = profileAdmin[0].taxesName;
    const taxesPercent = profileAdmin[0].taxesPercent;

    const companyAddress = coState + " " + coAddress;
    const fPercent = (taxesPercent + 100) / 100 //esta formula hara que 16 se transforme en 1.16 que seria el 100% del costo mas el 16% del impuesto (formula investigada). 
    
    const taxFree = (amount /  fPercent).toFixed(2) // Monto sin impuesto.
    const taxesAmount = (amount - taxFree).toFixed(2) // Impuesto represenatdo en monto.
    //el monto total es taxFree + taxOnly que es igual a "amount".
    
    const searchDocumentInvoice = await modelDocumentInvoice.find();
    const searchDocumentReceipt = await modelDocumentReceipt.find();

    if (searchDocumentInvoice.length !== 0){
        const lastDocument =  searchDocumentInvoice[searchDocumentInvoice.length - 1];//aqui buscamos el ultimo documento y revisamos los numeros de recibo y de factura.
        lastNumberInvoice = lastDocument.numberInvoice;
  
    } else {
        lastNumberInvoice = 0;
    }

    if (searchDocumentReceipt.length !== 0){
        const lastDocument =  searchDocumentReceipt[searchDocumentReceipt.length - 1];//aqui buscamos el ultimo documento y revisamos los numeros de recibo y de factura.
        lastNumberReceipt = lastDocument.numberReceipt;

    } else {
        lastNumberReceipt = 0
    }


    const numberInvoice = (lastNumberInvoice + 1);
    const numberReceipt = (lastNumberReceipt + 1);

    console.log("estamos en el proces de Contact")
    console.log("Action --->", Action);
    console.log("bank --->", bank);
    
    if ( Action === 'Yes' ){

        try {
           
            //accion que actualiza a un pago de comision verificado por una administrador
            const searchAndUpdate = await modelInvoice.findByIdAndUpdate( idOper, { admin: adminName , process: true, payCommission : true, userDeclare : true } );
            
            //::::::: Aqui se crea la Factura ::::::::
            if (bank !== 'Gratis'){
                //como ya ha sido procesado como pagado a traves de la banca se procede a crear la factura.  
                const  documentInvoice = new modelDocumentInvoice({ date, bank, accountnumber, platform, nameTaxInstitute, numberInvoice, company, companyID, companyAddress, companyPhone : phone, receptorName : names, receptorID : identification, receptorAddress, typeService, title, orderID, amount, totalAmount : amount, taxesCode, taxesName, taxesPercent, taxFree, taxesAmount, indexed: Indexed });
                console.log("::::::Esto es documentInvoice de tipo Factura :",documentInvoice);
                const documentInvoiceSave = await documentInvoice.save();

                //aqui evaluamos si es de tipo raffle para cambiar en el raffleHistory
                if (typeService === 'raffle'){
                    const raffleHistory  = await modelRaffleHistory.updateOne({title_id}, { payCommission : true, celebration : true}); 
                }
                
            }

            if (bank === 'Gratis') {
                //Estamos en la condicion Gratuita donde se crean Recibos
                console.log('Estamos en la condicion Gratuita donde se crean Recibos');
                //como ya ha sido procesado como Gratis ahora se procede a crear el recibo.  
                                            
                const documentReceipt = new modelDocumentReceipt({ date, platform, nameTaxInstitute, numberReceipt, company, companyID, companyAddress, companyPhone: phone, receptorName : names, receptorID : identification, receptorAddress, typeService, title, orderID, amount, totalAmount: 0, taxesCode, taxesName, taxesPercent, taxFree : 0, taxesAmount: 0, indexed: Indexed });
                const documentReceiptSave = await documentReceipt.save();
                console.log(":::::Esto es documentReceipt de tipo Recibo :", documentReceipt);

                
                //aqui evaluamos si es de tipo raffle para cambiar en el raffleHistory
                if (typeService === 'raffle'){
                    const raffleHistory  = await modelRaffleHistory.updateOne({title_id}, { payCommission : true, celebration : true}); 
                }
                
            }

        }catch(error){
            console.log("Ha habido un error", error)
        }

    } else {
        //accion que actualiza a un pago de comision No realizado, resetea todos los valores necesarios para que pueda el cliente volver hacer su declaracion de pago.
        const searchAndUpdate = await modelInvoice.findByIdAndUpdate( idOper, { process: false, payCommission : false, userDeclare : false } );
    }

    res.redirect('/admin/contact');
    
});

//Ruta para buscar y filtrar información
routes.post('/admin/contact', async (req,res)=>{

    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;
    
    const {dateForm, searcher, selectSearcher } = req.body;
    console.log(dateForm, searcher, selectSearcher);

    console.log("::::::::::::: Process Reports Busquedas :::::::::::::::::::::::::::::")

    if (selectSearcher === "Date"){

        if (dateForm.length !==0 ){
            let splitdate = dateForm.split("-");
            let dia = splitdate[2];
            let mes = splitdate[1];
            let anio = splitdate[0];

            let date = `${dia}-${mes}-${anio}`;
            console.log("date is type", typeof date ); 
            console.log("Esto es date :", date);
                
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;  

            const searchToProcess = await modelInvoice.find({ process: false, userDeclare : true, dates: date, admin : adminName }).sort({createdAt : -1});
            const searchToProcessCount = await modelInvoice.find({ process: false, userDeclare : true, dates: date, admin : adminName }).count();
            const searchToProcessNoPay = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'},  dates: date }).sort({createdAt: -1});
            const searchToProcessNoPayCount = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'},  dates: date }).count();
            const searchProcess =  await modelInvoice.find({ process: true, userDeclare : true,  dates: date }).sort({createdAt : -1});
            const searchProcessCount =  await modelInvoice.find({ process: true, userDeclare : true,  dates: date }).count();
            res.render('admin/contact', {userAdmin, searchToProcess, searchToProcessCount, searchProcess, searchToProcessNoPay, searchToProcessNoPayCount, searchProcessCount, msgOrdersTakenFinded});
      
        } else {

            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            
            const searchToProcess =  await modelInvoice.find( { $and : [{userDeclare : true },{payCommission : false }, {admin : adminName } ]} ).sort({createdAt : -1});
            const searchToProcessCount = null;
            const searchToProcessNoPay = await modelInvoice.find( { process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
            const searchToProcessNoPayCount = null;
            const searchProcess =  await modelInvoice.find({process: true}).sort({createdAt : -1});
            const searchProcessCount =  null;
                        
            res.render('admin/contact', {userAdmin, searchToProcess, searchToProcessCount, searchProcess, searchToProcessNoPay, searchToProcessNoPayCount, searchProcessCount, msgOrdersTakenFinded});
            console.log("searchToProcess", searchToProcess );
        }

    }

    if (selectSearcher == "Bank"){

        if(searcher.length !==0 ){

            if (dateForm.length !==0 ){
                let splitdate = dateForm.split("-");
                let dia = splitdate[2];
                let mes = splitdate[1];
                let anio = splitdate[0];

                let date = `${dia}-${mes}-${anio}`;
                console.log("date is type", typeof date ); 
                console.log("Esto es date :", date);

                const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
                delete req.session.msgOrdersTakenFinded;
                const searchToProcess = await modelInvoice.find({ process: false, userDeclare : true, bank : searcher, dates: date, admin : adminName }).sort({createdAt : -1});
                const searchToProcessCount = await modelInvoice.find({ process: false, userDeclare : true, bank : searcher, dates: date, admin : adminName }).count();
                const searchToProcessNoPay = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'},  dates: date }).sort({createdAt: -1});
                const searchToProcessNoPayCount = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'},  dates: date }).count();
                const searchProcess =  await modelInvoice.find({ process: true, userDeclare : true, bank : searcher, dates: date }).sort({createdAt : -1});
                const searchProcessCount = await modelInvoice.find({ process: true, userDeclare : true, bank : searcher, dates: date }).count();

                res.render('admin/contact', {userAdmin, searchProcess, searchToProcessCount, searchToProcess, searchToProcessNoPay, searchToProcessNoPayCount, searchProcessCount, msgOrdersTakenFinded});

            } else {

                const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
                delete req.session.msgOrdersTakenFinded;
                const searchToProcess = await modelInvoice.find({ process: false, userDeclare : true, bank : searcher, admin : adminName }).sort({createdAt : -1});
                const searchToProcessCount = await modelInvoice.find({ process: false, userDeclare : true, bank : searcher, admin : adminName }).count();
                const searchToProcessNoPay = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt: -1});
                const searchToProcessNoPayCount = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).count();
                const searchProcess =  await modelInvoice.find({ process: true, userDeclare : true, bank : searcher }).sort({createdAt : -1});
                const searchProcessCount =  await modelInvoice.find({ process: true, userDeclare : true, bank : searcher }).count();
                
                res.render('admin/contact', {userAdmin, searchProcess, searchToProcessCount, searchToProcess, searchToProcessNoPay, searchToProcessNoPayCount, searchProcessCount, msgOrdersTakenFinded});
            
            }

        } else {

            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelInvoice.find( { $and : [{userDeclare : true },{payCommission : false }, {admin : adminName } ]} ).sort({createdAt : -1});
            const searchToProcessCount = null;
            const searchToProcessNoPay = await modelInvoice.find( { process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
            const searchToProcessNoPayCount = null;
            const searchProcess =  await modelInvoice.find({process: true}).sort({createdAt : -1});
            const searchProcessCount =  null;
            
            res.render('admin/contact', {userAdmin, searchToProcess, searchToProcessCount, searchProcess, searchToProcessNoPay, searchToProcessNoPayCount, searchProcessCount, msgOrdersTakenFinded});
            console.log("searchToProcess", searchToProcess );
        }

    }

    if (selectSearcher == "Ref"){

        if(searcher.length !==0 ){

            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess = await modelInvoice.find({ process: false, userDeclare : true, refer : searcher, admin : adminName }).sort({createdAt : -1});
            const searchToProcessCount = await modelInvoice.find({ process: false, userDeclare : true, refer : searcher, admin : adminName }).count();
            const searchToProcessNoPay = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'},  refer : searcher}).sort({createdAt: -1});
            const searchToProcessNoPayCount = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'},  refer : searcher}).count();
            const searchProcess =  await modelInvoice.find({ process: true, userDeclare : true, payCommission : true, refer : searcher }).sort({createdAt : -1});
            const searchProcessCount =  await modelInvoice.find({ process: true, userDeclare : true, payCommission : true, refer : searcher }).count();

            res.render('admin/contact', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchProcess, searchProcessCount, msgOrdersTakenFinded});


        } else {

            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelInvoice.find( { $and : [{userDeclare : true },{payCommission : false }, {admin : adminName } ]} ).sort({createdAt : -1});
            const searchToProcessCount = null;
            const searchToProcessNoPay = await modelInvoice.find( { process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
            const searchToProcessNoPayCount = null;
            const searchProcess =  await modelInvoice.find({process: true}).sort({createdAt : -1});
            const searchProcessCount = null;
                        
            res.render('admin/contact', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount,  searchProcess, searchProcessCount, msgOrdersTakenFinded});
         
        }

    }
   
    if (selectSearcher == "User"){

        if(searcher.length !==0 ){

            if (dateForm.length !==0 ){
                let splitdate = dateForm.split("-");
                let dia = splitdate[2];
                let mes = splitdate[1];
                let anio = splitdate[0];

                let date = `${dia}-${mes}-${anio}`;
                console.log("date is type", typeof date ); 
                console.log("Esto es date :", date);

                const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
                delete req.session.msgOrdersTakenFinded;
                const searchToProcess = await modelInvoice.find({ process: false, userDeclare : true, usernameSell : searcher , dates: date, admin : adminName }).sort({createdAt : -1});
                const searchToProcessCount = await modelInvoice.find({ process: false, userDeclare : true, usernameSell : searcher , dates: date, admin : adminName }).count();
                const searchToProcessNoPay = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'},  dates: date, usernameSell : searcher }).sort({createdAt: -1});
                const searchToProcessNoPayCount = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'},  dates: date, usernameSell : searcher }).count();
                const searchProcess =  await modelInvoice.find({ process: true, userDeclare : true, payCommission : true, usernameSell : searcher, dates: date }).sort({createdAt : -1});
                const searchProcessCount = await modelInvoice.find({ process: true, userDeclare : true, payCommission : true, usernameSell : searcher, dates: date }).count();

                res.render('admin/contact', {userAdmin, searchProcess, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchProcessCount, msgOrdersTakenFinded});

            } else {

                const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
                delete req.session.msgOrdersTakenFinded;
                const searchToProcess = await modelInvoice.find({ process: false, userDeclare : true, usernameSell : searcher, admin : adminName }).sort({createdAt : -1});
                const searchToProcessCount = await modelInvoice.find({ process: false, userDeclare : true, usernameSell : searcher, admin : adminName }).count();
                const searchToProcessNoPay = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, usernameSell : searcher }).sort({createdAt: -1});
                const searchToProcessNoPayCount = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, usernameSell : searcher }).count();
                const searchProcess = await modelInvoice.find({ process: true, userDeclare : true, payCommission : true, usernameSell : searcher }).sort({createdAt : -1});
                const searchProcessCount = await modelInvoice.find({ process: true, userDeclare : true, payCommission : true, usernameSell : searcher }).count();

                res.render('admin/contact', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchProcess, searchProcessCount, msgOrdersTakenFinded});
            }

        } else {

            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelInvoice.find( { $and : [{userDeclare : true },{payCommission : false }, {admin : adminName } ]} ).sort({createdAt : -1});
            const searchToProcessCount = null;
            const searchToProcessNoPay = await modelInvoice.find( { process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
            const searchToProcessNoPayCount = null;
            const searchProcess =  await modelInvoice.find({process: true}).sort({createdAt : -1});
            const searchProcessCount = null;
            
            res.render('admin/contact', {userAdmin, searchToProcess, searchToProcessCount, searchProcess, searchToProcessNoPay, searchToProcessNoPayCount, searchProcessCount, msgOrdersTakenFinded});
            console.log("searchToProcess", searchToProcess );
        }

    }

    if (selectSearcher == "Admin"){

        if(searcher.length !==0 ){

            if (dateForm.length !==0 ){
                let splitdate = dateForm.split("-");
                let dia = splitdate[2];
                let mes = splitdate[1];
                let anio = splitdate[0];

                let date = `${dia}-${mes}-${anio}`;
                console.log("date is type", typeof date ); 
                console.log("Esto es date :", date);

                const searchToProcess = await modelInvoice.find({ process: false, userDeclare : true, dates: date, admin : adminName }).sort({createdAt : -1});
                const searchToProcessCount = await modelInvoice.find({ process: false, userDeclare : true, dates: date, admin : adminName }).count();
                const searchToProcessNoPay = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'},  dates: date, admin : searcher }).sort({createdAt: -1});
                const searchToProcessNoPayCount = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'},  dates: date, admin : searcher }).count();
                const searchProcess = await modelInvoice.find({ process: true, userDeclare : true, payCommission : true, admin : searcher, dates: date }).sort({createdAt : -1});
                const searchProcessCount = await modelInvoice.find({ process: true, userDeclare : true, payCommission : true, admin : searcher, dates: date }).count();

                res.render('admin/contact', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchProcess, searchProcessCount });

            } else {

                const searchToProcess = await modelInvoice.find({ process: false, userDeclare : true, admin : adminName }).sort({createdAt : -1});
                const searchToProcessCount = await modelInvoice.find({ process: false, userDeclare : true, admin : adminName }).count();
                const searchToProcessNoPay = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, admin : searcher }).sort({createdAt: -1});
                const searchToProcessNoPayCount = await modelInvoice.find({ process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'}, admin : searcher }).count();
                const searchProcess = await modelInvoice.find({ process: true, userDeclare : true, payCommission : true, admin : searcher }).sort({createdAt : -1});
                const searchProcessCount = await modelInvoice.find({ process: true, userDeclare : true, payCommission : true, admin : searcher }).count();
                

                res.render('admin/contact', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchProcess, searchProcessCount });
            }

        } else {

            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelInvoice.find( { $and : [{userDeclare : true },{payCommission : false }, {admin : adminName } ]} ).sort({createdAt : -1});
            const searchToProcessCount = null;
            const searchToProcessNoPay = await modelInvoice.find( { process: false, payCommission : false, userDeclare : false, bank : { $ne : 'no_bank'} }).sort({createdAt : -1});
            const searchToProcessNoPayCount = null;
            const searchProcess =  await modelInvoice.find({process: true}).sort({createdAt : -1});
            const searchProcessCount = null;
                        
            res.render('admin/contact', {userAdmin, searchToProcess, searchToProcessCount, searchToProcessNoPay, searchToProcessNoPayCount, searchProcess, searchProcessCount, msgOrdersTakenFinded});
            
        }

    }

    
});

//aqui vamos al modulo administrativo de facturas y recibos para trabajos contables y pagos de impuestos
routes.get('/admin/invoiceReceipt', async (req,res)=>{
    const userAdmin = req.session.userAdmin;

    if (userAdmin){
        const adminName = userAdmin[0].adminName;
        //console.log("Aqui el admin ---->",adminName);
        let totalSumInv, totalSumRec, objectSearchMessage;
    
        const searchDocumentInvoice =  await modelDocumentInvoice.find().sort({createdAt : -1});
        //console.log("Este es el searchDocumentInvoice ---->", searchDocumentInvoice);
        const searchDocumentReceipt =  await modelDocumentReceipt.find().sort({createdAt : -1});
        //console.log("Este es el searchDocumentReceipt ---->", searchDocumentReceipt);

        res.render('admin/invoiceReceipt', {userAdmin, searchDocumentInvoice, searchDocumentReceipt, totalSumInv, totalSumRec, objectSearchMessage});
    
    } else {

        res.render('admin/invoiceReceipt', {userAdmin});
    }

});

routes.post('/admin/search/invoiceReceipt', async (req,res)=>{
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;
    console.log("Estamos en /admin/search/invoiceReceipt")

    console.log(req.body);
    const searcher = req.body.searcher;
    const selectSearcher = req.body.selectSearcher;
    const dateFirst = req.body.dateFirst;
    const dateLast = req.body.dateLast;

    console.log(searcher);
    console.log(selectSearcher);

    if (selectSearcher === 'Invoice'){ //esto es tanto para invoice como para receipt

        if (searcher){

            const appIncludes = searcher.includes(" ");// esto verifica si hay o no espacios en blanco responde con un true or false
            console.log("tiene espacios vacios = ", appIncludes);

            if (appIncludes === false){
                let totalSumInv, totalSumRec;

                console.log("searcher es de tipo :",typeof searcher)
                const parseSearcher = parseInt(searcher);
               
                const searchDocumentInvoice =  await modelDocumentInvoice.find({ numberInvoice: parseSearcher }).sort({createdAt : -1});
                //console.log("Este es el searchDocumentInvoice ---->", searchDocumentInvoice);
    
                const searchDocumentReceipt =  await modelDocumentReceipt.find({ numberReceipt: parseSearcher }).sort({createdAt : -1});
                //console.log("Este es el searchDocumentReceipt ---->", searchDocumentReceipt);

                const searcherMessage = searcher;
                const typeSearchMessage = 'Invoice/Receipt';
                                      
                const objectSearchMessage = { searcherMessage, typeSearchMessage };
                //estas dos lineas de arriba son para capturar la busqueda que se ha hecho y poder presentarlo cuando la pagina sea reinicida. 
    
                res.render('admin/invoiceReceipt', {userAdmin, searchDocumentInvoice, searchDocumentReceipt, totalSumInv, totalSumRec, objectSearchMessage});
            } else {
                searchClear()
            }
         
        } else {

            searchClear()    
            
        }
            
    } else if (selectSearcher === 'OrderID'){
        let totalSumInv, totalSumRec;

        if (searcher){
            const searchDocumentInvoice =  await modelDocumentInvoice.find({ orderID: searcher }).sort({ createdAt : -1 });
            //console.log("Este es el searchDocumentInvoice ---->", searchDocumentInvoice);
    
            const searchDocumentReceipt =  await modelDocumentReceipt.find({ orderId: searcher }).sort({ createdAt : -1 });
            //console.log("Este es el searchDocumentReceipt ---->", searchDocumentReceipt);

            const searcherMessage = searcher;
            const typeSearchMessage = 'OrderID';
                                  
            const objectSearchMessage = { searcherMessage, typeSearchMessage };
    
            res.render('admin/invoiceReceipt', {userAdmin, searchDocumentInvoice, searchDocumentReceipt, totalSumInv, totalSumRec, objectSearchMessage});
        } else {
            searchClear()
        }

    
    } else if (selectSearcher === 'ID'){ //aqui hay agrupacion y sumas

        if (searcher){

            let totalSumInv, totalSumRec;
            const searchDocumentInvoice =  await modelDocumentInvoice.find({ receptorID: searcher }).sort({ createdAt : -1 });
            //console.log("Este es el searchDocumentInvoice ---->", searchDocumentInvoice);
    
            const searchDocumentReceipt =  await modelDocumentReceipt.find({ receptorID: searcher }).sort({ createdAt : -1});
            //console.log("Este es el searchDocumentReceipt ---->", searchDocumentReceipt);

            const searcherMessage = searcher;
            const typeSearchMessage = 'Doc. ID';
                                          
            const objectSearchMessage = { searcherMessage, typeSearchMessage };

            if (searchDocumentInvoice.length !==0){

                //aqui se agrupa y se suma invoice
                const sumSearchInv = await modelDocumentInvoice.aggregate([ { $match: { receptorID: searcher } },{ $group: { _id: null, totalTaxFree: { $sum: "$taxFree" }, totalizationAmount: {$sum: "$totalAmount"} }} ]);
                //console.log("Esto es sumSearchInv", sumSearchInv);//esto es un arreglo con un solo dato.

                if (sumSearchInv.length !==0){
                    const totalTaxFree = (sumSearchInv[0].totalTaxFree).toFixed(2);
                    const totalizationAmount = (sumSearchInv[0].totalizationAmount).toFixed(2);
                    const totalImp = (totalizationAmount - totalTaxFree).toFixed(2);

                    totalSumInv = { totalBase : totalTaxFree, totalImp : totalImp, totalAmount: totalizationAmount };
                    //console.log("Esto es totalSum: ", totalSumInv);
                }

            }
            
            if (searchDocumentReceipt.length !==0){
                 //aqui se agrupa y se suma receipt
                 const sumSearchRec = await modelDocumentReceipt.aggregate([ { $match: { receptorID: searcher } },{ $group: { _id: null, totalAmount: { $sum: "$amount" }, totalizationAmount: {$sum: "$totalAmount"} }} ]);
                 //console.log("Esto es sumSearchRec", sumSearchRec);//esto es un arreglo con un solo dato.

                 if (sumSearchRec.length !==0){
                    const totalAmountRec = (sumSearchRec[0].totalAmount).toFixed(2);
                    const totalizationAmountRec = sumSearchRec[0].totalizationAmount;
                    const totalImpRec = 0;
 
                    totalSumRec = { totalBase : totalAmountRec, totalImp : totalImpRec, totalAmount: totalizationAmountRec };
                    //console.log("Esto es totalSumRec: ", totalSumRec);
                }

            }                   


            res.render('admin/invoiceReceipt', {userAdmin, searchDocumentInvoice, searchDocumentReceipt, totalSumInv, totalSumRec, objectSearchMessage});       
            

        } else {
            searchClear()
        }
       
        
    } else if (selectSearcher === 'Dates'){//aqui hay agrupacion y sumas 
        
        if (dateFirst && dateLast){
            console.log("dateFirst", dateFirst);
            console.log("dateLast", dateLast);
            let totalSumInv, totalSumRec;
            const searchDocumentInvoice = await modelDocumentInvoice.find({ createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)} }).sort({createdAt : -1});
            const searchDocumentReceipt = await modelDocumentReceipt.find({ createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)} }).sort({createdAt : -1});
        
            const searcherMessage = `${dateFirst} to ${dateLast}`;
            const typeSearchMessage = 'Dates';
                                          
            const objectSearchMessage = { searcherMessage, typeSearchMessage };

            if (searchDocumentInvoice.length !==0){
                //aqui se agrupa y se suma invoice
                const sumSearchInv = await modelDocumentInvoice.aggregate([ { $match: { createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)} } },{ $group: { _id: null, totalTaxFree: { $sum: "$taxFree" }, totalizationAmount: {$sum: "$totalAmount"} }} ]);
                console.log("Esto es sumSearchInv", sumSearchInv);//esto es un arreglo con un solo dato.
                

                if (sumSearchInv.length !==0){
                    const totalTaxFree = (sumSearchInv[0].totalTaxFree).toFixed(2);
                    const totalizationAmount = (sumSearchInv[0].totalizationAmount).toFixed(2);
                    const totalImp = (totalizationAmount - totalTaxFree).toFixed(2);

                    totalSumInv = { totalBase : totalTaxFree, totalImp : totalImp, totalAmount: totalizationAmount };
                    //console.log("Esto es totalSum: ", totalSumInv);    
                }

            }    

            if (searchDocumentReceipt.length !==0){
                //aqui se agrupa y se suma receipt
                const sumSearchRec = await modelDocumentReceipt.aggregate([ { $match: { createdAt: {$gte: new Date(dateFirst), $lte: new Date(dateLast)} } },{ $group: { _id: null, totalAmount: { $sum: "$amount" }, totalizationAmount: {$sum: "$totalAmount"} }} ]);
                console.log("Esto es sumSearchRec", sumSearchRec);//esto es un arreglo con un solo dato.
                
                if (sumSearchRec.length !==0){
                    const totalAmountRec = (sumSearchRec[0].totalAmount).toFixed(2);
                    const totalizationAmountRec = sumSearchRec[0].totalizationAmount;
                    const totalImpRec = 0;
                 
                    totalSumRec = { totalBase : totalAmountRec, totalImp : totalImpRec, totalAmount: totalizationAmountRec };
                    //console.log("Esto es totalSumRec: ", totalSumRec);
                }    
                
            }    

            res.render('admin/invoiceReceipt', {userAdmin, searchDocumentInvoice, searchDocumentReceipt, totalSumInv, totalSumRec, objectSearchMessage});                

        
        } else {

            searchClear()
        }
    }    
    

    async function searchClear(){
        let totalSumInv, totalSumRec, objectSearchMessage;

        const searchDocumentInvoice =  await modelDocumentInvoice.find().sort({createdAt : -1});    
        const searchDocumentReceipt =  await modelDocumentReceipt.find().sort({createdAt : -1});
            
        res.render('admin/invoiceReceipt', {userAdmin, searchDocumentInvoice, searchDocumentReceipt, totalSumInv, totalSumRec, objectSearchMessage});
    }
    
});

//::::: Esta direccion es para poder extraer los datos de la empresa y poder contar con ellos donde se requiera 
// por ejemplo en el membrete de los reportes administrativos.
routes.get('/admin/profileAdmin', async (req,res)=>{
    const companyData = await modelAdminProfile.find();
    res.json(companyData);
});

//ruta de inicio de sala para tomar ordenes que luego serán validadas.
routes.get('/admin/sala/comprasDirectas', async (req, res)=>{
    const userAdmin = req.session.userAdmin;

    if (userAdmin){

        const adminName = userAdmin[0].adminName;
        const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
        delete req.session.msgOrdersTakenFinded;

        console.log("::::::::::::: Sala ComprasDirectas :::::::::::::::::::::::::::::")
        const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true });
        const searchCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true }).count();

        res.render('admin/salaComprasDirectas', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded });

    } else {

        res.render('admin/salaComprasDirectas', {userAdmin});

    }    


});

//esta ruta post es para poder filtrar informacion y permitir que los admisnitradores puedan organizar su trabajo.
routes.post('/admin/sala/comprasDirectas', async (req, res)=>{
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;
    
    const {dateForm, searcher, selectSearcher } = req.body;
    console.log(dateForm, searcher, selectSearcher);

    console.log("::::::::::::: Sala ComprasDirectas Busquedas :::::::::::::::::::::::::::::")

    if (selectSearcher == "Date"){

        if (dateForm.length !==0 ){
            let splitdate = dateForm.split("-");
            let dia = splitdate[2];
            let mes = splitdate[1];
            let anio = splitdate[0];

            let date = `${dia}-${mes}-${anio}`; 
            console.log("Esto es date :", date);
                
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true, dates: date });
            const searchCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true, dates: date }).count();
            res.render('admin/salaComprasDirectas', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});
        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true  });
            const searchCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true  }).count();
            res.render('admin/salaComprasDirectas', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});
        }

    }

    if (selectSearcher == "Departs"){

        if(searcher.length !==0 ){
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true , department : searcher });
            const searchCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true , department : searcher }).count();
            res.render('admin/salaComprasDirectas', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});
        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true  });
            const searchCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true  }).count();
            res.render('admin/salaComprasDirectas', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});
        }

    }

    if (selectSearcher == "Banks"){

        if(searcher.length !==0 ){
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true , bank : searcher });
            const searchCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true , bank : searcher }).count();
            res.render('admin/salaComprasDirectas', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});
        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true  });
            const searchCount =  await modelBuySell.find({CommentSeller :{ $ne : 'no_comment'} , CommentBuy :{ $ne : 'no_comment'}, admin : "no_admin", pay : true, confirmPay : 'Yes', process: false, userDeclare : true  }).count();
            res.render('admin/salaComprasDirectas', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});
        }    
        
    }

});

//Toma de ordenes del grupo buySell
//esta ruta es la que recibe las ordenes que han tomado los administradores "validadores".
routes.post('/admin/sala/comprasDirectas/OrdersTaken', async (req, res)=>{  
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;

    console.log(":::::: Orders Taken ::::::")
    console.log("admin : ", adminName );
    //console.log(req.body.orders);// esto es un array de OrdersID
    const ordersArray = req.body.orders;


    try {
        for (let i = 0; i < ordersArray.length; i++) {
          const orderID = ordersArray[i];
          await modelBuySell.findByIdAndUpdate(orderID, { admin: adminName });
        }
    
        req.session.msgOrdersTakenFinded = "¡Ordenes tomadas satisfactoriamente!";
        let response = { "resp": "ok" };
        res.json(response);

    } catch (error) {
        // Manejo de error si ocurre algún problema en la base de datos
        console.error(error);
        res.status(500).json({ error: "Ocurrió un error en el servidor" });
      }
        

});

routes.get('/admin/sala/contactos', async (req, res)=>{
    const userAdmin = req.session.userAdmin;

    if (userAdmin){
        const adminName = userAdmin[0].adminName;

        const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
        delete req.session.msgOrdersTakenFinded;

        console.log(":::::::::::::::::::::::: Sala  contactos :::::::::::::::::::::::::::::")
        const searchToProcess =  await modelInvoice.find({ admin : "no_admin", process: false, userDeclare : true });
        const searchCount = await modelInvoice.find({ admin : "no_admin", process: false, userDeclare : true }).count();
        console.log("Este es el searchToProcess ---->", searchToProcess);

        res.render('admin/salaContactos', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});

    } else {

        res.render('admin/salaContactos', {userAdmin});

    }

});
             
//esta ruta post es para poder filtrar informacion y permitir que los administradores puedan organizar su trabajo.
routes.post('/admin/sala/contactos', async (req, res)=>{
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;
    
    const {dateForm, searcher, selectSearcher } = req.body;
    console.log(dateForm, searcher, selectSearcher);

    console.log("::::::::::::: Sala Contactos Busquedas :::::::::::::::::::::::::::::")

    if (selectSearcher == "Date"){

        if (dateForm.length !==0 ){
            let splitdate = dateForm.split("-");
            let dia = splitdate[2];
            let mes = splitdate[1];
            let anio = splitdate[0];

            let date = `${dia}-${mes}-${anio}`; 
            console.log("Esto es date :", date);
                
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelInvoice.find({ admin: "no_admin", process: false, userDeclare: true, dates: date });
            const searchCount =  await modelInvoice.find({ admin: "no_admin", process: false, userDeclare: true, dates: date }).count();
            res.render('admin/salaContactos', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});
        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelInvoice.find({ admin: "no_admin", process: false, userDeclare: true });
            const searchCount =  await modelInvoice.find({ admin: "no_admin", process: false, userDeclare: true }).count();
            res.render('admin/salaContactos', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});
        }

    }

    if (selectSearcher == "Departs"){

        if(searcher.length !==0 ){
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelInvoice.find({ admin: "no_admin", process: false, userDeclare: true, department: searcher });
            const searchCount =  await modelInvoice.find({ admin: "no_admin", process: false, userDeclare: true, department: searcher }).count();
            res.render('admin/salaContactos', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});
        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelInvoice.find({ admin: "no_admin", process: false, userDeclare: true });
            const searchCount =  await modelInvoice.find({ admin: "no_admin", process: false, userDeclare: true }).count();
            res.render('admin/salaContactos', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});
        }

    }

    if (selectSearcher == "Banks"){

        if(searcher.length !==0 ){
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelInvoice.find({ admin: "no_admin", process: false, userDeclare: true, bank: searcher });
            const searchCount =  await modelInvoice.find({ admin: "no_admin", process: false, userDeclare: true, bank: searcher }).count();
            res.render('admin/salaContactos', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});
        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchToProcess =  await modelInvoice.find({ admin: "no_admin", process: false, userDeclare: true });
            const searchCount =  await modelInvoice.find({ admin: "no_admin", process: false, userDeclare: true }).count();
            res.render('admin/salaContactos', {userAdmin, searchToProcess, searchCount, msgOrdersTakenFinded});
        }    
        
    }

});

//Toma de ordenes del grupo invoice 
//esta ruta es la que recibe las ordenes que han tomado los administradores "validadores".
routes.post('/admin/sala/contactos/OrdersTaken', async (req, res)=>{  
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;

    console.log(":::::: Orders Taken ::::::")
    console.log("admin : ", adminName );
    //console.log(req.body.orders);// esto es un array de OrdersID
    const ordersArray = req.body.orders;


    try {
        for (let i = 0; i < ordersArray.length; i++) {
          const orderID = ordersArray[i];
          await modelInvoice.findByIdAndUpdate(orderID, { admin: adminName });
        }
    
        req.session.msgOrdersTakenFinded = "¡Ordenes tomadas satisfactoriamente!";
        let response = { "resp": "ok" };
        res.json(response);

    } catch (error) {
        // Manejo de error si ocurre algún problema en la base de datos
        console.error(error);
        res.status(500).json({ error: "Ocurrió un error en el servidor" });
    }
        

});


//::::::::::: invoice-marketing :::::::::::::

// ruta inicial del cronstructor de facturas para servicios de Marketing
routes.get('/admin/invoice-marketing', async (req, res)=>{
    const userAdmin = req.session.userAdmin;

    if (userAdmin){

        const invoiceMarketingError = req.session.invoiceMarketingError; // "Faltan datos para crear una Factura.";
        const invoiceMarketingSuccess = req.session.invoiceMarketingSuccess; // "Factura creada.";
        const adminError = req.session.adminError; //"Ha ocurrido un Error, intente luego."

        delete req.session.invoiceMarketingError;
        delete req.session.invoiceMarketingSuccess;
        delete req.session.adminError;

        let banks; 

        const adminName = userAdmin[0].adminName; 
        banks = await modelBankAccount.find();

        const invoiceMarketingLast = await modelDocumentInvoice.find({ typeService: 'marketing' } ).sort({ createdAt : -1 }).limit(1);
        console.log("*****invoice - marketing****");
        console.log("Esto es invoiceMarketing --->", invoiceMarketingLast);
        const invoiceMarketing = await modelDocumentInvoice.find({ typeService: 'marketing' }).sort({ createdAt : -1 });

        res.render('admin/invoiceMarketing', ({ userAdmin, banks, invoiceMarketingLast, invoiceMarketing, invoiceMarketingError, invoiceMarketingSuccess, adminError }));

    } else {
        res.render('admin/invoiceMarketing', ({ userAdmin }));
    }     
          
});

// ruta para buscar un username              
routes.post('/admin/search-username-marketing', async (req, res)=>{
    console.log("---------- Search username in the DB ----------")
    console.log("Esto es lo que llega --->", req.body);
    //Esto es lo que llega ---> { user: 'gregoriom' }
    const { user } =  req.body;
    console.log("user" , user);
    const search = await modelProfile.find({username : user});
    console.log(search);
    res.json(search);
});
  
//esta ruta es para extraer el precio del dolar actualizado.
routes.get('/admin/search-rate-marketing', async (req, res)=>{
    const searchRate = await modelRateCurrency.find().sort({ updatedAt : -1}).limit(1);
    console.log("searchRate --->", searchRate);
    const lastRate = searchRate[0].currentPrice;

    res.json({lastRate});
});

// ruta para crear una factura de servicio de Marketing
routes.post('/admin/create-invoice-marketing', async (req, res)=>{

    try {
        
        console.log("**---------admin/create-invoice-marketing---------**");
        const userAdmin = req.session.userAdmin;
        const adminName = userAdmin[0].adminName;
        //console.log(req.body);
        const {  descrip, typeCustomer, customerUsername, customerNames, customerDocument, customerAdress, timeDays, price, endPublic, bank, nAccount, refer } = req.body;
        console.log( descrip, typeCustomer, customerUsername, customerNames, customerDocument, customerAdress, timeDays, price, endPublic, bank, nAccount, refer);

        if (typeCustomer === 'select' || customerNames === '' || timeDays === '' || endPublic === '' || bank === '' || nAccount === '' ||  refer === ''){

            console.log("necesita llenar los campos para creacion de la factura");
            req.session.invoiceMarketingError = "Faltan datos para crear una Factura.";
            res.redirect('/admin/invoice-marketing'); 

        } else {

            console.log("Procedemos a crear la factura");

            let date;
            let now = new Date();
            let dia = now.getUTCDate();
            let mes = now.getUTCMonth() + 1;
            let anio = now.getUTCFullYear();
            
            if (mes <= 9){
                date = `${dia}-0${mes}-${anio}`;
            } else {
                date = `${dia}-${mes}-${anio}`;
            }


            let EndPublic;
            let endDATE = new Date(endPublic);
            let diaEnd = endDATE.getUTCDate();
            let mesEnd = endDATE.getUTCMonth() + 1;
            let anioEnd = endDATE.getUTCFullYear();

            if (mesEnd <= 9){
                EndPublic = `${diaEnd}-0${mesEnd}-${anioEnd}`;
            } else {
                EndPublic = `${diaEnd}-0${mesEnd}-${anioEnd}`;
            }

            //aqui obtengo el ultimo numero de factura.
            let lastNumberInvoice; 
            const lastDocument = await modelDocumentInvoice.findOne().sort({ 'createdAt' : -1 }).limit(1);
            lastNumberInvoice = lastDocument.numberInvoice;
            console.log("LastNumberInvoice ---->", lastNumberInvoice);
            //lastNumberInvoice ----> 40

            //aqui obtengo los datos de blissenet
            const adminProfile = await modelAdminProfile.find();
            console.log("Esto es adminProfile", adminProfile);
            let platform = adminProfile[0].platform;
            let company = adminProfile[0].company;
            let companyID = adminProfile[0].companyID;
            let state = adminProfile[0].coState;
            let coAddress = adminProfile[0].coAddress;
            let phone1 = adminProfile[0].phone1;
            let phone2 = adminProfile[0].phone2;
            let email = adminProfile[0].email;
            let nameTaxInstitute = adminProfile[0].nameTaxInstitute;
            let taxesName = adminProfile[0].taxesName;
            let taxesPercent =  adminProfile[0].taxesPercent;

            //aqui obtengo la taza del dolar vs el bolivar
            const searchRate = await modelRateCurrency.find().sort({ updatedAt : -1}).limit(1);
            console.log("searchRate --->", searchRate);
            const lastRate = searchRate[0].currentPrice;
            console.log("lastRate :", lastRate);
            console.log("typeof", typeof lastRate);
            //--------------------------------------------

            const PriceVES = parseFloat( (price * lastRate).toFixed(2) ); //monto sin inpuesto 57.25
            const fpercent = (taxesPercent / 100).toFixed(2);
            const inp = parseFloat( (PriceVES * fpercent).toFixed(2) ); //aqui el inpuesto 
                
            const Amount = (PriceVES + inp).toFixed(2);  //aqui la sumatoria. 
        
            const invoice = new modelDocumentInvoice({

                platform : platform,
                nameTaxInstitute : nameTaxInstitute,
                typeDocument : "Factura",
                numberInvoice : lastNumberInvoice + 1,
                company : company,
                companyID : companyID,
                companyAddress : `${state} ${coAddress}`,
                companyPhone : `${phone1} ${phone2}`,
                receptorName : customerNames,
                receptorID : customerDocument,
                receptorAddress : customerAdress,
                date : date,
                typeService : "marketing",
                service : `${descrip}`,
                title : `Por concepto de publicación de ${descrip}`,
                orderID : "sin-order",
                taxFree : PriceVES,
                amount : Amount,
                totalAmount : Amount,
                taxesAmount : inp,
                taxesName : taxesName,
                taxesPercent : taxesPercent,
                bank : bank,
                accountnumber : nAccount,
                refer : refer,
                indexed : "sin-indexed",
                invoiceUsedMarketing : false, //esto es para tener conocimiento de que factura ya se ha usado y cual no. si dice true es porque ya el servicio ha sido prestado. osea se ha publicado su publicidad.
                timeDays : timeDays, 
                endPublic : EndPublic 

            }); 
            

            console.log("invoice", invoice);
            const invoiceSave = await invoice.save()
            console.log("invoiceSave", invoiceSave)
            req.session.invoiceMarketingSuccess = "Factura creada.";
            res.redirect('/admin/invoice-marketing');

        }

    } catch (error) {
        console.log("------Error------")
        console.log("Ha ocurrido un error, intente luego", error);
        req.session.adminError = "Ha ocurrido un Error, intente luego."
        res.redirect('/admin/invoice-marketing');

    }        

});


//::::::::::: News Day ::::::::

routes.get('/admin/newsDay', async (req, res)=>{

const userAdmin = req.session.userAdmin;

    if (userAdmin){
        //console.log("aqui userAdmin ---->",userAdmin)
    
        const newsDaySave = req.session.newsDaySave; //'Se ha agregado un NewsDay al Carousel.';
        const newsDayNoSave = req.session.newsDayNoSave; //'Falta Imagen o Datos requeridos';
        const newsDayError = req.session.newsDayError; // "Sin petición especifica";
        const newsDayUpdate = req.session.newsDayUpdate; //"Ha Actualizado un News Day.";
        const newsDayDelete = req.session.newsDayDelete; //"Ha Eliminado un News Day.";
        const adminError = req.session.adminError;  //"Ha ocurrido un Error, intente luego."
        
        delete req.session.newsDaySave;
        delete req.session.newsDayNoSave;
        delete req.session.newsDayError;
        delete req.session.newsDayUpdate;
        delete req.session.newsDayDelete;
        delete req.session.adminError;
        
        const currentNewsDay = await modelNewsDay.find({ "active" : true, "delete" : false });
        console.log("Esto es currentNewsDay ----->", currentNewsDay);
        const updateNewsDay = await modelNewsDay.find({ "delete" : false });

        res.render('admin/newsDay', ({userAdmin, currentNewsDay, updateNewsDay, newsDaySave, newsDayNoSave, newsDayError, newsDayUpdate, newsDayDelete, adminError }));
    } else {

        res.render('admin/newsDay', ({ userAdmin }));
        
    }    
});

// ruta para buscar una factura esto es para Banners 
routes.post('/admin/search-invoice-marketing/newsDay', async (req, res)=>{
    console.log("---------- Search invoice in the DB ----------")
    console.log("Esto es lo que llega --->", req.body);

    const { invoice } =  req.body; 
    console.log("invoice" , invoice);
    const search = await modelDocumentInvoice.find({ typeService : "marketing", service : "news_Day", numberInvoice : invoice, invoiceUsedMarketing : false });
    console.log(search);
    res.json(search);
});

routes.post('/admin/newsDay/create', async (req, res)=>{

    try {
        
        const userAdmin = req.session.userAdmin;
        const adminName = userAdmin[0].adminName;
        console.log("LLegando al Backend con los macundales del News Day");
        console.log("aqui userAdmin ---->",userAdmin)
        console.log("Esto es el texto----->", req.body);
        console.log("Esta es la imagen imagen----->", req.files);

        const { mimetype, size, path } = req.files[0];
        const {typeNewsDay, nInvoice, customerName, timeDays, endPublic, newDayTitle, newDayDetails } = req.body;
        
        //console.log("mimetype :", mimetype); console.log("size :", size); console.log("path :", path);
        //console.log("typeNewsDay :", typeNewsDay); console.log("nInvoice :", nInvoice); console.log("customerName :", customerName);
        //console.log("timeDays :", timeDays); console.log("endPublic", endPublic); console.log("newDayTitle", newDayTitle);
        //console.log("newDayDetails", newDayDetails);

        let simplifiedDate;
        let dateNow = new Date();
        let dia = dateNow.getUTCDate();
        let mes = dateNow.getUTCMonth() + 1;
        let anio = dateNow.getUTCFullYear();

        if (mes <= 9){
            simplifiedDate = `${dia}-0${mes}-${anio}`;
        } else {
            simplifiedDate = `${dia}-${mes}-${anio}`;
        }

        const epoch = new Date().getTime(); //esto sera el valor del campo codeBanner : epoch
        const folder = 'newsDay';
        const pathField = path; const extPart = pathField.split(".");
        const ext = extPart[1];

        const fileContent = fs.readFileSync(pathField);
        const key = `${folder}/${epoch}.${ext}`;
        console.log("key -->", key);

        if (typeNewsDay === "admin"){

            if (req.files.length !==0 ) {
            
                if (size <= 2000000 && mimetype.startsWith("image/")){

   
                    const params = { 
                        Bucket : bucketName,
                        Key : key,
                        Body : fileContent,
                        ACL : 'public-read' 
                    };
        
                    s3.putObject(params, function(err, data){
                    
                        if (err){
                            console.log('Error al subir un archivo', err);
                        } else {
                            console.log('La imagen fue subida, Exito', data);
                            //ahora vamos a eliminar la imagen vieja;
                            saveNewsDayDB()
                                .then(()=>{
                                    req.session.newsDaySave = 'Se ha agregado un NewsDay al Carousel.';
                                    res.redirect('/admin/newsDay'); 
                                })
                                .catch((err)=>{
                                    console.log("Ha ocurrido un error", err)
                                })
                        }
                        
                    })   

                    let url = `https://${bucketName}.${endpoint}/${key}`;    
                    let public_id = key;

                    async function saveNewsDayDB(){
                        await fs.unlink(path); //elimino de uppload server

                        console.log("Datos del NewsDay se guardarán en la base de datos");
                        const newDays = new modelNewsDay({ active: true, typeNewsDay, customerName, timeDays, url, public_id, adminName, endPublic, newDayTitle, newDayDetails, simplifiedDate });
                        const newDaysSave = await newDays.save();
    
                        //const updateInvoice = await modelDocumentInvoice.updateOne({ numberInvoice : nInvoice}, { $set : {invoiceUsedMarketing : true} });
                
                    }

                   
                }


            } else {
    
                req.session.newsDayNoSave = 'Falta Imagen o Datos requeridos';
                res.redirect('/admin/newsDay');
            } 

        } else {

            if (req.files.length !==0 && customerName !== "" ) {
            
                if (size <= 2000000 && mimetype.startsWith("image/")){

                    const params = { 
                        Bucket : bucketName,
                        Key : key,
                        Body : fileContent,
                        ACL : 'public-read' 
                    };
        
                    s3.putObject(params, function(err, data){
                    
                        if (err){
                            console.log('Error al subir un archivo', err);
                        } else {
                            console.log('La imagen fue subida, Exito', data);
                            //ahora vamos a eliminar la imagen vieja;
                            saveNewsDayDB()
                                .then(()=>{
                                    req.session.newsDaySave = 'Se ha agregado un NewsDay al Carousel.';
                                    res.redirect('/admin/newsDay'); 
                                })
                                .catch((err)=>{
                                    console.log("Ha ocurrido un error", err)
                                })
                        }
                        
                    })   

                    let url = `https://${bucketName}.${endpoint}/${key}`;    
                    let public_id = key;

                    async function saveNewsDayDB(){
                        await fs.unlink(path); //elimino de uppload server

                        console.log("Datos del NewsDay se guardarán en la base de datos");
                        const newDays = new modelNewsDay({ active: true, typeNewsDay, customerName, timeDays, url, public_id, adminName, endPublic, newDayTitle, newDayDetails, simplifiedDate });
                        const newDaysSave = await newDays.save();
    
                        const updateInvoice = await modelDocumentInvoice.updateOne({ numberInvoice : nInvoice}, { $set : {invoiceUsedMarketing : true} });
                
                    }

                }

                  
            } else {
                
                req.session.newsDayNoSave = 'Falta Imagen o Datos requeridos';
                res.redirect('/admin/newsDay');
            } 
        } 

    } catch (error) {
        console.log("------Error------")
        req.session.adminError = "Ha ocurrido un Error, intente luego.";
        res.redirect('/admin/newsDay');        
    }

});

routes.post('/admin/newsDay/update', async (req, res)=>{

    try {
        
        console.log("-*************update************-");
        console.log(req.body);
        console.log(req.files);
        const { id, titleUpdate, noteUpdate } = req.body;
        let publicToDelete;   
        
        if (id !== "select"){
            const search = await modelNewsDay.findById(id);
            console.log("search :", search);
            publicToDelete = search.public_id;
        }    
        //public_id: 'newsDay/lyga7vuyzka4rm3eo67s'

        if (req.files.length !==0  && id !=="select" ) {
            // update de imagen y texto  (title y note)
        
            console.log("id ----->", id);
            console.log("Texto e IMG (se ejecuta una accion de actualizar)"); 
            const { mimetype, size, path } = req.files[0];
            console.log(mimetype, size, path)

            const epoch = new Date().getTime(); 
            const folder = 'newsDay';
            const pathField = path; const extPart = pathField.split(".");
            const ext = extPart[1];
    
            const fileContent = fs.readFileSync(pathField);
            const key = `${folder}/${epoch}.${ext}`;
            console.log("key -->", key);

            if (size <= 2000000 && mimetype.startsWith("image/")){

                //primero guardamos la imagen en el bucket
                const params = { 
                    Bucket : bucketName,
                    Key : key,
                    Body : fileContent,
                    ACL : 'public-read' 
                };
    
                s3.putObject(params, function(err, data){
                
                    if (err){
                        console.log('Error al subir un archivo', err);
                    } else {
                        console.log('La imagen fue subida, Exito', data);
                        //ahora vamos a eliminar la imagen vieja;

                        const paramsDel = {
                            Bucket : bucketName,
                            Key : publicToDelete
                        }

                        s3.deleteObject(paramsDel, function(err, data){

                            if (err){
                                console.log('Error al eliminar un archivo', err);
                            } else {
                                console.log('Archivo eliminado con Exito');
                                updateNewsDay()
                                    .then(()=>{
                                        req.session.newsDayUpdate = "Se ha actualizado un News Day.";
                                        res.redirect('/admin/newsDay');
                                    })
                                    .catch((err)=>{
                                        req.session.adminError = "Ha ocurrido un Error, intente luego."
                                        res.redirect('/admin/newsDay');
                                    })
                            }
                        })

                        let url = `https://${bucketName}.${endpoint}/${key}`;    
                        let public_id = key;
                        
                        async function updateNewsDay(){
                                            
                            await fs.unlink(path);
                            const newsDayUpdate = await modelNewsDay.findByIdAndUpdate(id, { newDayTitle : titleUpdate , newDayDetails : noteUpdate, url, public_id });
                            
                        }
                    }
                    
                })   

            }
            
        } else if (req.files.length ==0  && id !=="select") {
            // solo texto (title y note)
        
            console.log("id ----->", id);
            //console.log("solo texto <title y note>, (se ejecuta una accion de actualizar)");
            const newsDayUpdate = await modelNewsDay.findByIdAndUpdate(id, { newDayTitle : titleUpdate , newDayDetails : noteUpdate });
            req.session.newsDayUpdate = "Se ha actualizado un News Day.";
            res.redirect('/admin/newsDay');
        } else if (req.files.length !==0  && id ==="select"){
            // solo foto (No se ejecuta ninguna accion)
            
            console.log("solo foto (No se ejecuta ninguna accion)");
            console.log("NO HAY NADA QUE HACER. SIN PETICION PARA ACTUALIZAR NEWS DAY")
            req.session.newsDayError = "Sin petición especifica";
            res.redirect('/admin/newsDay');
        } else if (req.files.length ==0  && id ==="select"){
            console.log("no hay nada (No se ejecuta ninguna accion)");
            console.log("NO HAY NADA QUE HACER. SIN PETICION PARA ACTUALIZAR NEWS DAY")
            req.session.newsDayError = "Sin petición especifica";
            res.redirect('/admin/newsDay');
        }  
        
        console.log("***********end update**********");
        

    } catch (error) {
        console.log("------Error------");
        req.session.adminError = "Ha ocurrido un Error, intente luego."
        res.redirect('/admin/newsDay');
    }    

    
});

routes.post('/admin/newsDay/selectID', async (req, res)=>{
    console.log("here ------> /admin/newsDay/selectID");
    console.log(req.body);
    const IDNewdsDay = req.body.id;
    console.log("IDNewdsDay", IDNewdsDay);

    if ( IDNewdsDay !== "select" ){
        const newsDay = await modelNewsDay.findById(IDNewdsDay);
        console.log("newsDay", newsDay);
        res.json(newsDay);
    } 

});

routes.get('/admin/newsDay/delete/:id', async (req, res)=>{

    try {
        
        console.log(req.params);
        const idNewsDay = req.params.id;
        console.log("Este es el id ----->", idNewsDay);

        const resulDB = await modelNewsDay.findById(idNewsDay);
        const publicToDelete = resulDB.public_id;
        //console.log("Esto es resultDB ------>",resulDB);

        const paramsDel = {
            Bucket : bucketName,
            Key : publicToDelete
        }

        s3.deleteObject(paramsDel, function(err, data){

            if (err){
                console.log('Error al eliminar un archivo', err);
            } else {
                console.log('Archivo eliminado con Exito');
                updateNewsDay()
                    .then(()=>{
                        req.session.newsDayDelete = "Ha Eliminado un News Day.";
                        res.redirect('/admin/newsDay');
                    })
                    .catch((err)=>{
                        req.session.adminError = "Ha ocurrido un Error, intente luego."
                        res.redirect('/admin/newsDay');
                    })
            }
        })

        async function updateNewsDay(){
            const resultDele = await modelNewsDay.findByIdAndUpdate(idNewsDay, { active : false, delete : true, public_id : "", url : "" });    
        }
        

    } catch (error) {
        console.log("------Error------")
        req.session.adminError = "Ha ocurrido un Error, intente luego."
        res.redirect('/admin/newsDay');        
    }

});

// /admin/newsDay/pausar/<%= ele._id %>
routes.get('/admin/newsDay/pausar/:id', async (req, res)=>{
        
    try {
        
        console.log('estamos enviando un id del documento al que deseamos pausar');
        console.log(req.params);
        const idNewsDay = req.params.id;
        console.log("Este es el id ----->", idNewsDay);

        const resultDele = await modelNewsDay.findByIdAndUpdate(idNewsDay, { active : false });

        res.redirect('/admin/newsDay');

    } catch (error) {
        console.log("------Error------")
        console.log("Ha ocurrido un error, intente luego", error);
        req.session.adminError = "Ha ocurrido un Error, intente luego."
        res.redirect('/admin/newsDay');

    }
        
});

routes.get('/admin/newsDay/active/:id', async (req, res)=>{
    console.log('estamos enviando un id del documento al que deseamos activar');
    console.log(req.params);
    const idNewsDay = req.params.id;
    console.log("Este es el id ----->", idNewsDay);

    const resultDele = await modelNewsDay.findByIdAndUpdate(idNewsDay, { active : true });

    res.redirect('/admin/newsDay');
}); 


//:::::::: Banner :::::::

routes.get('/admin/bannersFront', async (req, res)=>{

    const userAdmin = req.session.userAdmin;

    if (userAdmin){    

        const msgBannerSave = req.session.msgBannerSave; //'Se ha agregado un Banner al Carousel.';
        const msgBannerNoSave = req.session.msgBannerNoSave; //'Falta Imagen o Datos requeridos';
        const msgBannerDelete = req.session.msgBannerDelete; //'Se ha eliminado el Banner satisfactoriamente.'
        const msgBannerActive = req.session.msgBannerActive; //Banner Activado.
        const msgBannerPaused = req.session.msgBannerPaused; //Banner Pausado.
        const msgBannerUpdate = req.session.msgBannerUpdate; //"Se ha Actualizado un Banner."
        const adminError = req.session.adminError; // "Ha ocurrido un Error, intente luego."

        delete req.session.msgBannerSave;
        delete req.session.msgBannerNoSave;
        delete req.session.msgBannerDelete;
        delete req.session.msgBannerActive;  
        delete req.session.msgBannerPaused;
        delete req.session.msgBannerUpdate;
        delete req.session.adminError;

        //console.log("aqui userAdmin ---->",userAdmin)
        const currentBanner = await modelBannerFront.find({ "active" : true, "delete" : false });
        //console.log("Esto es currentBanner ----->", currentBanner);

        const updateBanner = await modelBannerFront.find({ "typeBanner" : "admin", "active" : false, "delete" : false });

        res.render('admin/bannersFront', ({userAdmin, currentBanner, updateBanner, msgBannerSave, msgBannerNoSave, msgBannerDelete, msgBannerActive, msgBannerPaused, msgBannerUpdate, adminError }));

    } else {

        res.render('admin/bannersFront', ({userAdmin}));
    }    

});

// ruta para buscar una factura esto es para Banners 
routes.post('/admin/search-invoice-marketing/banner', async (req, res)=>{
    console.log("---------- Search invoice in the DB ----------")
    console.log("Esto es lo que llega --->", req.body);

    const { invoice } =  req.body; 
    console.log("invoice" , invoice);
    const search = await modelDocumentInvoice.find({ typeService : "marketing", service : "banner", numberInvoice : invoice, invoiceUsedMarketing : false });
    console.log(search);
    res.json(search);
});

//ruta para crear un banner en el home Carousel
routes.post('/admin/banner/create', async (req, res)=>{

    try {
        
        const userAdmin = req.session.userAdmin;
        //console.log("LLegando al Backend con los macundales del Banner");
        //console.log("aqui userAdmin ---->",userAdmin)
        const adminName = userAdmin[0].adminName;
        //console.log("Data Form ->", req.body);
        //console.log("Banner ->", req.files);

        const { mimetype, size, path } = req.files[0];
        const {typeBanner,  nInvoice, customerName, timeDays, endPublic} = req.body;

        //console.log("mimetype :", mimetype); console.log("size :", size); console.log("path :", path); console.log("typeBanner :", typeBanner);
        //console.log("nInvoice :", nInvoice); console.log("customerName :", customerName); console.log("timeDays :", timeDays); console.log("endPublic", endPublic);
    
        //crearemos el codeBanner con epoc fecha unix
        const epoch = new Date().getTime(); //esto sera el valor del campo codeBanner : epoch
        const folder = 'bannerCarousel';
        const pathField = path; const extPart = pathField.split(".");
        const ext = extPart[1];

        const fileContent = fs.readFileSync(pathField);
        const key = `${folder}/${epoch}.${ext}`;
        console.log("key -->", key);

        if (typeBanner === "admin"){

            if (req.files.length !==0 ) {
            
                if (size <= 3000000 && mimetype.startsWith("image/")){
        
                    const params = { 
                        Bucket : bucketName,
                        Key : key,
                        Body : fileContent,
                        ACL : 'public-read' 
                    };
        
                    s3.putObject(params, function(err, data){
                    
                        if (err){
                            console.log('Error al subir un archivo', err);
                        } else {
                            console.log('La imagen fue subida, Exito', data);
                    
                            // Ahora que la imagen se ha subido vamos a actualizar la Base de Datos
                            // no se elimina del Cluster ya que como tiene el mismo nombre esta se sobre-escribe
    
                            saveDB()
                                .then(()=>{
                                    console.log("Se ha guardado en la base de datos.");
                                    req.session.msgBannerSave = 'Se ha agregado un Banner al Carousel.';
                                    res.redirect('/admin/bannersFront');
                                })
                                .catch((err)=>{
                                    console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                    res.redirect('/admin/bannersFront');
                                })
    
                            
                            let url = `https://${bucketName}.${endpoint}/${key}`;    
                            let public_id = key;
    
                            async function saveDB(){
                                //console.log("este es el path que tiene que ser eliminado:", element.path)
                                
                                await fs.unlink(path); 
    
                                console.log("Datos del Banner se guardarán en la base de datos");
                                const banner = new modelBannerFront({ active: true, typeBanner, customerName, timeDays, url, public_id, adminName, endPublic, codeBanner : epoch });
                                const bannerSave = await banner.save();
            
                                //const updateInvoice = await modelDocumentInvoice.updateOne({ numberInvoice : nInvoice}, { $set : {invoiceUsedMarketing : true} });
            
                            }
         
    
                        }
                        
                    });  

                }       


            } else {
    
                req.session.msgBannerNoSave = 'Falta Imagen o Datos requeridos';
                res.redirect('/admin/bannersFront');
            } 

        } else {

            if (req.files.length !==0 && customerName !== "" ) {
            
                if (size <= 3000000 && mimetype.startsWith("image/")){


                    const params = { 
                        Bucket : bucketName,
                        Key : key,
                        Body : fileContent,
                        ACL : 'public-read' 
                    };
        
                    s3.putObject(params, function(err, data){
                    
                        if (err){
                            console.log('Error al subir un archivo', err);
                        } else {
                            console.log('La imagen fue subida, Exito', data);
                    
                            // Ahora que la imagen se ha subido vamos a actualizar la Base de Datos
                            // no se elimina del Cluster ya que como tiene el mismo nombre esta se sobre-escribe
    
                            saveDB()
                                .then(()=>{
                                    console.log("Se ha guardado en la base de datos.");
                                    req.session.msgBannerSave = 'Se ha agregado un Banner al Carousel.';
                                    res.redirect('/admin/bannersFront');
                                })
                                .catch((err)=>{
                                    console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                    res.redirect('/admin/bannersFront');
                                })
    
                            
                            let url = `https://${bucketName}.${endpoint}/${key}`;    
                            let public_id = key;
    
                            async function saveDB(){
                                //console.log("este es el path que tiene que ser eliminado:", element.path)
                                
                                await fs.unlink(path); 
    
                                console.log("Datos del Banner se guardarán en la base de datos");
                                const banner = new modelBannerFront({ active: true, typeBanner, customerName, timeDays, url, public_id, adminName, endPublic, codeBanner : epoch });
                                const bannerSave = await banner.save();
            
                                const updateInvoice = await modelDocumentInvoice.updateOne({ numberInvoice : nInvoice}, { $set : {invoiceUsedMarketing : true} });
            
                            }
         
    
                        }
                        
                    });  

                }

                


            } else {
                
                req.session.msgBannerNoSave = '"Falta Imagen o Datos requeridos';
                res.redirect('/admin/bannersFront');
            } 
        } 
        
    } catch (error) {
        console.log("------Error------")
        console.log("Ha ocurrido un error, intente luego", error);
        req.session.adminError = "Ha ocurrido un Error, intente luego."
        res.redirect('/admin/bannersFront');
    }        
  

});

routes.post('/admin/banner/selectID', async (req, res)=>{
    console.log("here ------> /admin/banner/selectID");
    console.log(req.body);
    const IDBanner = req.body.id;
    console.log("IDBanner", IDBanner);

    if ( IDBanner !== "select" ){
        const banner = await modelBannerFront.findById(IDBanner);
        console.log("banner", banner);
        res.json(banner);
    } 
});

//  /admin/banner/update
routes.post('/admin/banner/update', async (req, res)=>{

    try {
        
        console.log("-*************update banner************-");
        console.log(req.body);
        console.log(req.files);
        const { id } = req.body;
        console.log("id ------->", id);
        let publicToDelete;   
        
        if (id !== "select"){
            const search = await modelBannerFront.findById(id);
            console.log("search :", search);
            publicToDelete = search.public_id;
        }    

        if (req.files.length !==0  && id !=="select" ) {
            // update de imagen y un banner seleccioando
            console.log("Hemos pasado el  primer filtro hay una foto y id es diferente de select");
            console.log("id ----->", id);
            const { mimetype, size, path } = req.files[0];
            console.log(mimetype, size, path)

            const epoch = new Date().getTime();
            const folder = 'bannerCarousel';
            const pathField = path; const extPart = pathField.split(".");
            const ext = extPart[1];

            const fileContent = fs.readFileSync(pathField);
            const key = `${folder}/${epoch}.${ext}`;
            console.log("key -->", key);



            if (size <= 3000000 && mimetype.startsWith("image/")){

                //primero cargamos la imagen en digitalOcean y luego eliminamos al vieja
                const params = { 
                    Bucket : bucketName,
                    Key : key,
                    Body : fileContent,
                    ACL : 'public-read' 
                };
    
                s3.putObject(params, function(err, data){
                
                    if (err){
                        console.log('Error al subir un archivo', err);
                    } else {
                        console.log('La imagen fue subida, Exito', data);
                        //ahora vamos a eliminar la imagen vieja;
                                          
                        const paramsDel = { 
                            Bucket : bucketName,
                            Key : publicToDelete 
                        };

                        s3.deleteObject(paramsDel, function(err, data){

                            if (err){
                                console.log('Error al eliminar un Banner', err);
                            } else {
                                console.log('Un Banner eliminado satisfactoriamente');
                                updateData()
                                    .then(()=>{
                                        req.session.msgBannerUpdate = "Se ha Actualizado un Banner.";
                                        res.redirect('/admin/bannersFront');
                                    })
                                    .catch((err)=>{

                                    })
                            }
                        })

                        let url = `https://${bucketName}.${endpoint}/${key}`;    
                        let public_id = key;

                        async function updateData(){
                            await fs.unlink(path); //elimino el archivo en upload del servidor
                            //actualizo la base de datos.

                            const bannerUpdate = await modelBannerFront.findByIdAndUpdate(id, { url, public_id });
                        
                        }
     

                    }
                    
                });  


            } else {
                console.log("ha superado el maximo permitido o no es de tipo imagen")
                res.redirect('/admin/bannersFront');
            }
            
        }
        
    } catch (error) {
        console.log("------Error------")
        console.log("Ha ocurrido un error, intente luego", error);
        req.session.adminError = "Ha ocurrido un Error, intente luego."
        res.redirect('/admin/bannersFront');    
    }

});

// ruta para eliminar un Banner
//           admin/bannersFront/delete/bannerFront/yx5wm3t8vaouhhjuyd7m
routes.get('/admin/bannersFront/delete/:dir/:public', async (req, res)=>{

    try {
        
        const dir = req.params.dir;
        const publicId = req.params.public;
        const public_id = `${dir}/${publicId}`;
        console.log("Ese es el public_Id del banner que deseamos eliminar")
        console.log("Esto es dir", dir);
        console.log("Esto es publicId", publicId);
        console.log("Esto es public_id", public_id);

        const params = {
            Bucket : bucketName,
            Key : public_id
        }
        s3.deleteObject(params, (err, data)=>{
            if (err){
                console.error("Error al eliminar el archivo", err);
            } else {
                console.error("Archivo eliminado con exito", data);

                async function deleteDB(){
                    const updateDB = await modelBannerFront.updateOne({public_id: public_id}, { $set : { "active" : false , "delete" : true, "url" : "", "public_id" : "" }});
                }    

                deleteDB()
                    .then(()=>{
                        req.session.msgBannerDelete = 'Se ha eliminado el Banner satisfactoriamente.' 
                        res.redirect('/admin/bannersFront')
                    })
                    .catch((err)=>{
                        console.log("Ha habido un error, intente mas tarde.", err);
                    })
                

            }
        });
    

    } catch (error) {
        console.log("------Error------")
        console.log("ha ocurrido un error, intente luego", error);
        req.session.adminError = "Ha ocurrido un Error, intente luego."
        res.redirect('/admin/bannersFront')

    }        
    

});

// ruta Pausar Banner
routes.get('/admin/bannersFront/paused/:dir/:public', async (req, res)=>{

    try {
        
        const dir = req.params.dir;
        const publicId = req.params.public;
        const publicIdToDelete = `${dir}/${publicId}`;
        console.log("Ese es el public_Id del banner que deseamos actualizar")
        console.log("Esto es dir", dir);
        console.log("Esto es publicId", publicId);

        
        async function updateBannerDB(){
        const updateDB = await modelBannerFront.updateOne({public_id: publicIdToDelete}, {active: false });
        }


        updateBannerDB()
            .then(()=>{
                req.session.msgBannerPaused = 'Banner Pausado.'; 
                res.redirect('/admin/bannersFront');
            })

    } catch (error) {
        console.log("------Error------")
        console.log("ha ocurrido un error, intente luego", error);
        req.session.adminError = "Ha ocurrido un Error, intente luego."
        res.redirect('/admin/bannersFront')
    
    }        
        
    
});

// ruta Activar Banner
routes.get('/admin/bannersFront/active/:dir/:public', async (req, res)=>{

    try {
        
        const dir = req.params.dir;
        const publicId = req.params.public;
        const publicIdToDelete = `${dir}/${publicId}`;
        console.log("Ese es el public_Id del banner que deseamos actualizar")
        console.log("Esto es dir", dir);
        console.log("Esto es publicId", publicId);

        
            async function updateBannerDB(){
            const updateDB = await modelBannerFront.updateOne({public_id: publicIdToDelete}, {active: true });
            }
        
    
            updateBannerDB()
                .then(()=>{
                    req.session.msgBannerActive = 'Banner Activado.'
                    res.redirect('/admin/bannersFront')
                })


    } catch (error) {
        console.log("------Error------")
        console.log("ha ocurrido un error, intente luego", error);
        req.session.adminError = "Ha ocurrido un Error, intente luego."
        res.redirect('/admin/bannersFront');

    }                
          

});

//:::::::::::::::::::::::

//::::: Background para Signin y Signup :::::

routes.get('/admin/Bg-sign', async (req,res)=>{
    const userAdmin = req.session.userAdmin;

    if (userAdmin){

        const msgBackgroundSave = req.session.msgBackgroundSave; //'Se ha agregado un Background.';
        const msgBackgroundUpdate = req.session.msgBackgroundUpdate; //"Se ha Actualizado un Background.";
        const msgBackgroundDelete = req.session.msgBackgroundDelete; //'Se ha eliminado un Background.'
        const adminError = req.session.adminError;  //"Ha ocurrido un Error, intente luego."

        delete req.session.msgBackgroundSave;
        delete req.session.msgBackgroundUpdate;
        delete req.session.msgBackgroundDelete;
        delete req.session.adminError;
              
        const currentBackgrounds = await modelBackgroundSign.find( {active : true} );
        //typeBackground : { type : String }, //puede ser signIn or signUp.                  
        const disabledBackgroundsSignIn = await modelBackgroundSign.find( {typeBackground : "SignIn", active : false} );
        const disabledBackgroundsSignUp = await modelBackgroundSign.find( {typeBackground : "SignUp", active : false} );
              
        res.render('admin/bg-sign', ({userAdmin, currentBackgrounds, disabledBackgroundsSignIn, disabledBackgroundsSignUp, msgBackgroundSave, msgBackgroundUpdate, msgBackgroundDelete, adminError}));

    } else {

        res.render('admin/bg-sign', ({userAdmin}));

    }

});

routes.post('/admin/background/create', async (req,res)=>{
    
    try {
        
        const userAdmin = req.session.userAdmin;
        const adminName = userAdmin[0].adminName;
        console.log("*******Background******* ");
        console.log("Esto es lo que llega al backend desde la administracion actualizacion de background --->")
        console.log(req.body);
        console.log(req.files);
        //type = 'SignUp or signIn'
        const type = req.body.typeBackground;
        const { mimetype, path, size } = req.files[0];
        console.log("type -------->", type);

            //crearemos el codeBackground con epoc fecha unix
            const epoch = new Date().getTime(); //esto sera el valor del campo codeBackground : epoch
            
            const folder = 'Backgrounds'; const ident = epoch;
            const pathField = path; const extPart = pathField.split(".");
            const ext = extPart[1];

            if (type === "signIn"){

                if (req.files.length !==0 ) {
                
                    if (size <= 3000000 && mimetype.startsWith("image/")){

                        const fileContent = fs.readFileSync(pathField);
                        const key = `${folder}/${ident}.${ext}`;
                        console.log("key -->", key);

                        const params = { 
                            Bucket : bucketName,
                            Key : key,
                            Body : fileContent,
                            ACL : 'public-read' 
                        };
            
                        s3.putObject(params, function(err, data){
                        
                            if (err){
                                console.log('Error al subir un archivo', err);
                            } else {
                                console.log('La imagen fue subida, Exito', data);
                                //ahora vamos a eliminar la imagen vieja;
                                saveSingInDB()
                                    .then(()=>{
                                        req.session.msgBackgroundSave = 'Se ha agregado un Background.';
                                        res.redirect('/admin/bg-sign'); 
                                    })
                                    .catch((err)=>{
                                        console.log("Ha ocurrido un error", err)
                                    })
                            }
                            
                        })   

                        let url = `https://${bucketName}.${endpoint}/${key}`;    
                        let public_id = key;

                        async function saveSingInDB(){

                            // eliminamos el archivo de upload
                            await fs.unlink(path);

                            console.log("Datos del Banner se guardarán en la base de datos");
                            const background = new modelBackgroundSign({ active: false, typeBackground : type, codeBackground : epoch, url, public_id, adminName });
                            const backgroundSave = await background.save();
                        }
                        
                     
                    }       


                } else {
        
                    req.session.msgBackgroundNoSave = 'Falta Imagen o Datos requeridos';
                    res.redirect('/admin/bg-sign');
                } 

            } else {

                if (req.files.length !==0 ) {
                
                    if (size <= 3000000 && mimetype.startsWith("image/")){


                        const fileContent = fs.readFileSync(pathField);
                        const key = `${folder}/${ident}.${ext}`;
                        console.log("key -->", key);
    
                        const params = { 
                            Bucket : bucketName,
                            Key : key,
                            Body : fileContent,
                            ACL : 'public-read' 
                        };
            
                        s3.putObject(params, function(err, data){
                        
                            if (err){
                                console.log('Error al subir un archivo', err);
                            } else {
                                console.log('La imagen fue subida, Exito', data);
                                //ahora vamos a eliminar la imagen vieja;
                                saveSingUpDB()
                                    .then(()=>{
                                        req.session.msgBackgroundSave = 'Se ha agregado un Background.';
                                        res.redirect('/admin/bg-sign'); 
                                    })
                                    .catch((err)=>{
                                        console.log("Ha ocurrido un error", err)
                                    })
                            }
                            
                        })
                        
                        let url = `https://${bucketName}.${endpoint}/${key}`;    
                        let public_id = key;

                        async function saveSingUpDB(){

                            // eliminamos el archivo de upload
                            await fs.unlink(path);
    
                            console.log("Datos del Banner se guardarán en la base de datos");
                            const background = new modelBackgroundSign({ active: false, typeBackground : type, codeBackground : epoch, url, public_id, adminName });
                            const backgroundSave = await background.save();
                        }

/*                         const result = await cloudinary.uploader.upload(path, {folder: 'Backgrounds'});
                        console.log("Esto es result de lo que viene de cloudinary ---->",result);
                        const { url, public_id } = result;

                        //elimino del server
                        await fs.unlink(path);

                        console.log("Datos del Banner se guardarán en la base de datos");
                        const background = new modelBackgroundSign({ active: false, typeBackground : type, codeBackground : epoch, url, public_id, adminName });
                        const backgroundSave = await background.save();

                        req.session.msgBackgroundSave = 'Se ha agregado un Background sl Sign.';
                        res.redirect('/admin/bg-sign');  */
                    }

                    


                } else {
                    
                    req.session.msgBackgroundNoSave = 'Falta Imagen o Datos requeridos';
                    res.redirect('/admin/bg-sign');

                } 
            }  
            
    } catch (error) {
        console.log("Ha ocurrido un error", error);
        req.session.adminError = "Ha ocurrido un Error, intente luego.";
        res.redirect('/admin/bg-sign');
    }        

});

routes.post('/admin/background/selectID', async (req, res)=>{
    console.log("here ------> /admin/background/selectID");
    console.log(req.body);
    const IDbackground = req.body.id;
    console.log("IDbackground", IDbackground);

    if ( IDbackground !== "select" ){
        const background = await modelBackgroundSign.findById(IDbackground);
        console.log("background", background);
        res.json(background);
    } 
});

//  /admin/background/update
routes.post('/admin/background/update', async (req, res)=>{

    try {
        
        console.log("-*************update background************-");
        console.log(req.body);
        console.log(req.files);
        const { id } = req.body;
        console.log("id ------->", id);
        let publicToDelete;   
        
        if (id !== "select"){    
            console.log("id ------->", id);
            const search = await modelBackgroundSign.findById(id);
            console.log("Ver esta busqueda necesaria para un Update");
            console.log("search :", search);
            publicToDelete = search.public_id;
        }    
        
        if (req.files.length !==0  && id !=="select" ) {
            // update de imagen y un banner seleccionado
            console.log("Hemos pasado el  primer filtro hay una foto y id es diferente de select");
            console.log("id ----->", id);
            const { mimetype, size, path } = req.files[0];
            console.log(mimetype, size, path)

            const epoch = new Date().getTime();
            const folder = 'Backgrounds';
            const pathField = path; const extPart = pathField.split(".");
            const ext = extPart[1];

            const fileContent = fs.readFileSync(pathField);
            const key = `${folder}/${epoch}.${ext}`;
            console.log("key -->", key);

            if (size <= 3000000 && mimetype.startsWith("image/")){

                //primero guardamos la foto en el Bucket

                const params = { 
                    Bucket : bucketName,
                    Key : key,
                    Body : fileContent,
                    ACL : 'public-read' 
                };
    
                s3.putObject(params, function(err, data){
                
                    if (err){
                        console.log('Error al subir un archivo', err);
                    } else {
                        console.log('La imagen fue subida, Exito', data);
                        //ahora vamos a eliminar la imagen vieja;
                                          
                        const paramsDel = { 
                            Bucket : bucketName,
                            Key : publicToDelete 
                        };

                        s3.deleteObject(paramsDel, function(err, data){

                            if (err){
                                console.log('Error al eliminar un Banner', err);
                            } else {
                                console.log('Un Banner eliminado satisfactoriamente');
                                updateData()
                                    .then(()=>{
                                        req.session.msgBackgroundUpdate = "Se ha Actualizado un Background.";
                                        res.redirect('/admin/bg-sign');
                                    })
                                    .catch((err)=>{
                                        req.session.adminError = "Ha ocurrido un Error, intente luego.";
                                        res.redirect('/admin/bg-sign');
                                    })
                            }
                        })

                        let url = `https://${bucketName}.${endpoint}/${key}`;    
                        let public_id = key;

                        async function updateData(){
                            await fs.unlink(path); //elimino el archivo en upload del servidor
                            //actualizo la base de datos.

                            const backgroundUpdate = await modelBackgroundSign.findByIdAndUpdate(id, { url, public_id });
                        }

                    }
                    
                });  


            } else {
                console.log("ha superado el maximo permitido o no es de tipo imagen")
                res.redirect('/admin/bg-sign'); 
            }
            
        } 
        
    } catch (error) {
        console.log("------Error------")
        console.log("Ha ocurrido un error, intente luego", error);
        req.session.adminError = "Ha ocurrido un Error, intente luego."
        res.redirect('/admin/bg-sign');  
    }

});

// ruta Activar Background
routes.get('/admin/background/active/:dir/:public/:type', async (req, res)=>{

    try {
        
        const dir = req.params.dir;
        const publicId = req.params.public;
        const type = req.params.type;
        const publicIdToDelete = `${dir}/${publicId}`;
        console.log("Ese es el public_Id del banner que deseamos actualizar")
        console.log("Esto es dir", dir);
        console.log("Esto es publicId", publicId);
        console.log("Esto es type", type);
        
        if (type === "SignIn"){

            async function updateBannerDB(){
            
                const searchBackgroundActive = await modelBackgroundSign.find({ typeBackground : "SignIn", active : true });
                
                if (searchBackgroundActive.length !==0){
                    const IdActive = searchBackgroundActive[0]._id;
                    const disabledBackground = await modelBackgroundSign.findByIdAndUpdate(IdActive, { active : false });    
                
                    const updateDB = await modelBackgroundSign.updateOne({public_id: publicIdToDelete}, {active: true });
                
                } else {
                    const updateDB = await modelBackgroundSign.updateOne({public_id: publicIdToDelete}, {active: true });
                }   

            }

            updateBannerDB()
            .then(()=>{
                //req.session.msgBannerActive = 'Banner Activado.'
                res.redirect('/admin/bg-sign');
            })

        } else {

            async function updateBannerDB(){
            
                const searchBackgroundActive = await modelBackgroundSign.find({ typeBackground : "SignUp", active : true });
                if (searchBackgroundActive.length !==0){
                    const IdActive = searchBackgroundActive[0]._id;
                    const disabledBackground = await modelBackgroundSign.findByIdAndUpdate(IdActive, { active : false });    
                    
                    const updateDB = await modelBackgroundSign.updateOne({public_id: publicIdToDelete}, {active: true });
                } else {
                    const updateDB = await modelBackgroundSign.updateOne({public_id: publicIdToDelete}, {active: true });
                }

            }

            updateBannerDB()
            .then(()=>{
                //req.session.msgBannerActive = 'Banner Activado.'
                res.redirect('/admin/bg-sign');
            })

        }

        
    } catch (error) {
        console.log("------Error------")
        console.log("ha ocurrido un error, intente luego", error);
        req.session.adminError = "Ha ocurrido un Error, intente luego."
        res.redirect('/admin/bg-sign');

    }                
          

});

// /admin/background/delete/<%= ele.public_id %>
routes.get('/admin/background/delete/:dir/:public', async (req, res)=>{

    try {
        
        const dir = req.params.dir;
        const publicId = req.params.public;
        const publicToDelete = `${dir}/${publicId}`;
        console.log("Ese es el public_Id del background que deseamos eliminar")
        console.log("Esto es dir", dir);
        console.log("Esto es publicId", publicId);
    
        const paramsDel = { 
            Bucket : bucketName,
            Key : publicToDelete 
        };

        s3.deleteObject(paramsDel, function(err, data){

            if (err){
                console.log('Error al eliminar un Banner', err);
            } else {
                console.log('Un Banner eliminado satisfactoriamente');
                updateData()
                    .then(()=>{
                        req.session.msgBackgroundDelete = 'Se ha eliminado un Background.';
                        res.redirect('/admin/bg-sign');
                    })
                    .catch((err)=>{
                        req.session.adminError = "Ha ocurrido un Error, intente luego.";
                        res.redirect('/admin/bg-sign');
                    })
            }
        })

        async function updateData(){
            const updateDB = await modelBackgroundSign.deleteOne({public_id: publicToDelete});
        }


    } catch (error) {
        console.log("------Error------")
        console.log("ha ocurrido un error, intente luego", error);
        req.session.adminError = "Ha ocurrido un Error, intente luego."
        res.redirect('/admin/bg-sign');

    }        
    

});



// ---------- Crear el banner que tendran los usuarios por default ---------
routes.get('/admin/bannerDefault', async (req, res)=>{
    const userAdmin = req.session.userAdmin;

    if (userAdmin){

        const bannerDefault = await modelBannerDefault.find();
        res.render('admin/bannerDefault', ({userAdmin, bannerDefault}));

    } else {

        res.render('admin/bannerDefault', ({userAdmin}));

    }

});

routes.post('/admin/bannerDefault/create', async (req, res)=>{
    console.log("Estos son los datos que llegan del front ->",req.body)
    //console.log("Esto es el archivo de imagen ->", req.files)
    const {bannerName} = req.body; 
    const element = req.files[0];
    
    console.log("bannerName ->", bannerName);
    console.log("element ->", element); //aqui tenemos la imagen que el admin esta subiendo
        
    try{
        
        if ( element.size <= 3000000  && element.mimetype === "image/jpeg" ){

            //console.log("una imagen aqui aceptada----->", element)

            const folder = 'bannerUserDefault'; const ident = 'banner';
            const pathField = element.path; const extPart = pathField.split(".");
            const ext = extPart[1];

            const searchBanner = await modelBannerDefault.find();

            if ( searchBanner.length !==0 ) {
                //aqui guardamos la imagen nueva y luego actualizamos la base de Datos (no hace falta eliinar la vieja es sobre-escrita). 

                const fileContent = fs.readFileSync(pathField);
                const key = `${folder}/${ident}.${ext}`;
                console.log("key -->", key);
    
                const params = { 
                    Bucket : bucketName,
                    Key : key,
                    Body : fileContent,
                    ACL : 'public-read' 
                };
    
                s3.putObject(params, function(err, data){
                
                    if (err){
                        console.log('Error al subir un archivo', err);
                    } else {
                        console.log('La imagen fue subida, Exito', data);
                        
                        // Ahora que la imagen se ha subido vamos a actualizar la Base de Datos
                        // no se elimina del Bucket ya que como tiene el mismo nombre esta se sobre-escribe

                        saveDB()
                            .then(()=>{
                                console.log("Se ha guardado en la base de datos.");
                                res.redirect('/admin/bannerDefault');
                            })
                            .catch((err)=>{
                                console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                res.redirect('/admin/bannerDefault');
                            })

                        
                        let url = `https://${bucketName}.${endpoint}/${key}`;    
                        let public_id = key;

                        async function saveDB(){
                            //console.log("este es el path que tiene que ser eliminado:", element.path)
                            await fs.unlink(element.path) 

                            const iDBanner = searchBanner[0]._id;                                                                        
                            const updateImg = await modelBannerDefault.findByIdAndUpdate(iDBanner, { bannerName, url, public_id } );
                        }
     

                    }
                    
                });    
            
            } else {
                //aqui subimos una imagen al bucket y luego guardamos en la base de datos

                const fileContent = fs.readFileSync(pathField);
                const key = `${folder}/${ident}.${ext}`;
                console.log("key -->", key);
    
                const params = { 
                    Bucket : bucketName,
                    Key : key,
                    Body : fileContent,
                    ACL : 'public-read' 
                };

                s3.putObject(params, function(err, data){

                    if (err){
                        console.log('ha habido un error en la subida de imagen al Cluster', err);
                    } else {
                        console.log('Imagen subida al Cluster', data)
                        newData()
                            .then(()=>{
                                console.log("Se ha guardado en la base de datos.");
                                res.redirect('/admin/bannerDefault');
                            })
                            .catch((err)=>{
                                console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                res.redirect('/admin/bannerDefault');
                        })
                    }
                })

                let url = `https://${bucketName}.${endpoint}/${key}`;    
                let public_id = key;

                async function newData(){
                    const newBanner = new modelBannerDefault({ bannerName, url, public_id });
                    const bannerSave = newBanner.save();
                }

            }                 

            
        } else {
            console.log("Archivos no subidos por ser muy pesados o no ser de tipo image 'jpg'.")
            res.redirect('/admin/bannerDefault');        
        }
        

    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/admin/bannerDefault');
    }


});

//:::::::: Cierre y Celebracion Mecanica Administrativo de Emergencia ::::::::
routes.get('/admin/finishMechanic', async (req, res)=>{
    const userAdmin = req.session.userAdmin;

    const finishMechanicErrorAuction = req.session.finishMechanicErrorAuction; // `Ha habido un Error en la Subasta ${title}`;
    const finishMechanicSuccessAuction =  req.session.finishMechanicSuccessAuction; // `La Subasta ${title} ha cerrado exitosamente`;

    const finishMechanicSuccessRaffle = req.session.finishMechanicSuccessRaffle;  //`El Sorteo ${title} se ha celebrado exitosamente`;
    const finishMechanicErrorRaffle = req.session.finishMechanicErrorRaffle;  //`Ha habido un Error en la Celebracion de Sorteo ${title}`;

    delete req.session.finishMechanicErrorAuction;
    delete req.session.finishMechanicSuccessAuction;
    delete req.session.finishMechanicSuccessRaffle;
    delete req.session.finishMechanicErrorRaffle;

    res.render('admin/finishMechanic', { userAdmin, finishMechanicErrorAuction, finishMechanicSuccessAuction, finishMechanicSuccessRaffle, finishMechanicErrorRaffle });
});

//aqui obtenemos el grupo de anuncios que pueden ser Raffle o Auctions
routes.post('/admin/search/finishMechanic', async (req, res)=>{
    console.log("Search Finish Mechanic");
    console.log(req.body);
    const { task } = req.body;
    console.log("task : ", task)

    if (task === "auction"){
        const type = "auction";
        const search = await modelAuction.find({ active : true });
        console.log("search", search);
        const response = { type, search };
        res.json(response);
    } else if (task === "raffle"){
        const type = "raffle";
        const search = await modelRaffle.find({ raffleClosingPolicy: 'byDate', allTicketsTake: false });
        console.log("search", search);
        const response = { type, search };
        res.json(response);
    } else {
        const type = "blank";
        const search = { "search" : "blank"}
        console.log("search", "blank" );
        const response = { type, search };
        res.json(response);
    }

    
});
          
routes.post('/admin/process/finishMechanic', async (req, res)=>{
    console.log("admin/process/finishMechanic");
    console.log(req.body);
    const { chooseTask, selectId, store } = req.body;
    console.log("selectId", selectId);
    // selectId: 'select'

    if (chooseTask === 'auction'){
        
        if (selectId !== "select"){

            const search = await modelAuction.findById(selectId);
            console.log("Este es la subasta que debo procesar", search);
            const titleOfAuction = search._id;
            const anfitrion = search.username;
            const department = search.department;
            const tecnicalDescription = search.tecnicalDescription;
            const participants = search.participants;
            const title = search.title;
            const image = search.images[0].url;
            console.log("participants", participants);

            let emailSell,emailBuy;

            // Inicio de proceso de cierre de Subasta
            //debo averiguar si existe en esta subasta participantes 
            if (participants.length !== 0){
                console.log("Existen participantes entonces debo obtener el ultimo existente, que es el ganador de la subasta");
                const participantWin = participants[participants.length - 1];
                console.log("Este es el ganador de la susbasta :", participantWin);
                const usernameBuy = participantWin.bidUser;
                const bidAmount = participantWin.bidAmountF;
                
                //se envia los datos necesarios para construir el nuevo documento en buySell
                            
                //Busqueda de correos del vendedor y del comprador    
                async function searchEmails(){
                    console.log("Estamos en searchEmails()");
                    const emailSELL = await modelUser.find({username : anfitrion}, {_id:0, email: 1});
                    const emailBUY = await modelUser.find({username : usernameBuy}, {_id: 0, email: 1});

                    emailSell = emailSELL[0].email;  
                    emailBuy = emailBUY[0].email;
                    console.log(`emailSell > ${emailSell}  emailBuy > ${emailBuy}`);
                    console.log("searchEmails(+)");
                }

                //creacion de instancia de compra y venta (Anfitrion y Comprador)
                async function creteBuySellAuction(){

                    const searchIndexed = await modelProfile.find( { username : store } );
                    const indexed = searchIndexed[0].indexed;

                    let valueCommission = 0;

                    let response;
                    async function downloadImgToUpload(){
                        response = await axios.get(image, { responseType: 'arraybuffer', maxContentLength: Infinity });
                        //console.log("response ---->", response); //un espaguitero grande
                    }

                    downloadImgToUpload()
                        .then(()=>{
                                const epoch = new Date().getTime();
                                const folder = 'firstImgBuySell';
                                const pathField = image; const extPart = pathField.split(".");
                                const ext = extPart[4]; console.log("ext------->", ext)
                                //console.log("imagen descargada", response.data); -->response.data  , es la imagen desscargada en formato binario y almacenada en un array buffer, esto es como si alguien hubiera subido una foto al servidor solo que no la guardamos solo se usa para enviar al buckets Spaces;
            
                                const key = `${folder}/${epoch}.${ext}`;
                                console.log("key -->", key);
                                let dImage;
                                
                                const params = { 
                                    Bucket : bucketName,
                                    Key : key,
                                    Body : response.data,
                                    ACL : 'public-read' 
                                };
                                        
                                s3.putObject(params, function(err, data){
                                
                                if (err){
                                    console.log('Error al subir un archivo', err);
                                } else {
                                    console.log('La imagen fue subida, Exitooooooooooooooo', data);
                                            
                                    let url = `https://${bucketName}.${endpoint}/${key}`;    
                                    let public_id = key;
                                    dImage = {public_id, url};
                                    saveDB()
                                }
                                
                                });
                                
                                async function saveDB(){

                                    valueCommission = (bidAmount * 0.03);
                                    let commission = valueCommission.toFixed(2); 
                                    
                                    const BuySell = new modelBuySell({ usernameSell : store, indexed,  usernameBuy: usernameBuy, department : department, title : title, title_id: titleOfAuction, tecnicalDescription, image : dImage, price : bidAmount, commission : commission });
                                    const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
                                    //console.log('Aqui BuySell ---->', BuySell);
                                    console.log("createBuysellAuction(+)")

                                }
                                
                        })
                        .catch((err)=>{
                            console.log("ha habido un error de cierre de Subasta", err);
                        })
                    //------- section to delete   
                    /*                        
                    const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgBuySell'});
                    //console.log("Aqui resultUpload ----->", resultUpload);
                    const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
                    const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.
                    //ya con todos los datos necesarios se procede a guardarlo en la coleccion modelBuysell.
                                
                    valueCommission = (bidAmount * 0.03);
                    let commission = valueCommission.toFixed(2); 
                    
                    const BuySell = new modelBuySell({ usernameSell : store, indexed,  usernameBuy, department, title, title_id: titleOfAuction, tecnicalDescription, image : dImage, price : bidAmount, commission });
                    const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
                    //console.log('Aqui BuySell ---->', BuySell);
                    */
                }

                //Creacion y envio de correo a (vendedor)    
                async function sendEmailSell(){

                    const message = "Cierre de Subasta"
                    const contentHtml = `
                    <h2 style="color: black"> Felicidades su Subasta tiene al mejor Comprador. </h2>
                    <ul> 
                        <li> cuenta : ${emailSell} </li> 
                        <li> asunto : ${message} </li>
                    <ul>
                    <h2> Cierre de Subasta ${title}. </h2>
                    <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y vaya al apartado de negociación, donde le estará esperando su comprador. </p>
                    `

                    //enviar correo
                    //(SMTP)-> Simple Mail Transfer Protocol --> es el protocolo con que los servidores se comunican a traves de correos.
                    const emailMessage = {
                        from: "Blissenet<sistemve@blissenet.com>", //remitente
                        to: emailSell,
                        subject: "🎊 Cierre de Subasta - Blissenet", //objeto
                        text: message,
                        html: contentHtml
                    };

                    //añadir las credenciales
                    const transport = nodemailer.createTransport({
                        host: "mail.blissenet.com",
                        port: 465,
                        auth: {
                            user: "sistemve@blissenet.com",
                            pass: process.env.pass_sistemve
                        }
                    });

                    transport.sendMail(emailMessage, (error, info) => {
                        if (error) {
                            console.log("Error enviando email")
                            console.log(error.message)
                        } else {
                            console.log("Email enviado")
                            
                        }
                    }) 
                
                }

                //Creacion y envio de correo a (comprador)  
                async function sendEmailBuy(){
                            
                    const message = "Cierre de Subasta"
                    const contentHtml = `
                    <h2 style="color: black"> Felicidades has sido ganador en una Subasta. </h2>
                    <ul> 
                        <li> cuenta : ${emailBuy} </li> 
                        <li> asunto : ${message} </li>
                    <ul>
                    <h2> Has comprado ${title}. </h2>
                    <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y vaya al apartado de negociación, donde le estará esperando su vendedor y anfitrión. </p>
                    `

                    const emailMessage = {
                        from: "Blissenet<sistemve@blissenet.com>", //remitente
                        to: emailBuy,
                        subject: "🎊 Cierre de Subasta - Blissenet", //objeto
                        text: message,
                        html: contentHtml
                    };

                    //añadir las credenciales
                    const transport = nodemailer.createTransport({
                        host: "mail.blissenet.com",
                        port: 465,
                        auth: {
                            user: "sistemve@blissenet.com",
                            pass: process.env.pass_sistemve
                        }
                    });

                    transport.sendMail(emailMessage, (error, info) => {
                        if (error) {
                            console.log("Error enviando email")
                            console.log(error.message)
                        } else {
                            console.log("Email enviado")
                            
                        }
                    }) 
            
                }

                //Ya hemos creado la instancia de compra-venta ambas partes tienen ya su negociacion activa y lista para ser cerrada;
                //El proceso que sigue es eliminar el documento de auction de la base de datos;

                async function deletAuction(){
                    await modelAuction.findByIdAndDelete(titleOfAuction)
                }


                searchEmails()
                    .then(()=>{
                        creteBuySellAuction()
                            .then(()=>{
                                sendEmailSell()
                                    .then(()=>{
                                        sendEmailBuy()
                                            .then(()=>{
                                                deletAuction()
                                                    .then(()=>{
                                                        console.log("Proceso de Cierre de Subasta Ok");
                                                        req.session.finishMechanicSuccessAuction = `La Subasta ${title} ha cerrado exitosamente`;
                                                        res.redirect('/admin/finishMechanic');
                                                    })
                                                    .catch((error)=>{
                                                        console.log("Ha habido un error deletAuction()", error);
                                                        req.session.finishMechanicErrorAuction = `Ha habido un Error en la Subasta ${title}`;
                                                        res.redirect('/admin/finishMechanic');
                                                    })  
                                            })
                                            .catch((error)=>{
                                                console.log("Ha habido un error sendEmailBuy()", error);
                                                req.session.finishMechanicErrorAuction = `Ha habido un Error en la Subasta ${title}`;
                                                res.redirect('/admin/finishMechanic')
                                            })
                                    })
                                    .catch((error)=>{
                                        console.log("Ha habido un error sendEmailSell()", error);
                                        req.session.finishMechanicErrorAuction = `Ha habido un Error en la Subasta ${title}`;
                                        res.redirect('/admin/finishMechanic')
                                    })

                            })
                            .catch((error)=>{
                                console.log("Ha ocurrido un error creteBuySellAuction()", error);
                                req.session.finishMechanicErrorAuction = `Ha habido un Error en la Subasta ${title}`;
                                res.redirect('/admin/finishMechanic');
                            }) 
                    })
                    .catch((error)=>{
                        console.log("Ha haido un error searchEmails()", error);
                        req.session.finishMechanicErrorAuction = `Ha habido un Error en la Subasta ${title}`;
                        res.redirect('/admin/finishMechanic');
                    })

 
                

            } else {
                console.log("no hay participantes entonces, solo se procede a limpiar los atributos de fechas, active = false y se pasa a pausado = true")
                
                
                async function desactivar(){
                    await modelAuction.findByIdAndUpdate(titleOfAuction, { paused : true, active : false, auctionDate : " ", auctionDateClose : " " });
                }

                desactivar()
                    .then(()=>{
                        console.log("NO hubo participastes por lo tanto se actualizo los datos de esta subasta para que pueda ser nuevamente progrmada por su anunciante");
                        req.session.finishMechanicSuccessAuction = `La Subasta ${title} ha cerrado exitosamente`;
                        res.redirect('/admin/finishMechanic');
                    })
                    .catch((error)=>{
                        console.log("Ha ocurrido un error, ¡ATENCIO ADMINISTRACION!", error);
                        req.session.finishMechanicErrorAuction = `Ha habido un Error en la Subasta ${title}`;
                        res.redirect('/admin/finishMechanic');
                    })


            }

        } else {
            res.redirect('/admin/finishMechanic');
        }   

    } else if (chooseTask === 'raffle') {
           
        if (selectId !== "select"){

            let ticketRandom = [];
            const searchRaffle = await modelRaffle.findById(selectId);
            console.log("Este es la raffle que debo procesar", searchRaffle);

            const Id = searchRaffle._id;
            const depart = searchRaffle.department; //aqui el depaartamento. 
            const title = searchRaffle.title; //aqui tengo el title
            const titleURL = searchRaffle.titleURL; //aqui el titleURL
            const urlImageArticle = searchRaffle.images[0].url;
            const category = searchRaffle.category; //Pago
            const policy = searchRaffle.raffleClosingPolicy; //politica de celebracion
            const price = searchRaffle.price //precio del ticket
            const dateStart = searchRaffle.dateStart; //aqui la fecha de creacion del sorteo ya formateada.
            const UserName = searchRaffle.username; //anfitrion
            const anfitrion_id = searchRaffle.user_id; //id del anfitrion
            const boxTickets = searchRaffle.boxTickets;
            const CloseDate = searchRaffle.CloseDate;
            const cantPrizes = searchRaffle.numberOfPrizes;
            const cantTicket = searchRaffle.numTickets;
            const chatId = searchRaffle.chatId;
            
            const dtNow = new Date(); 
            const diaNow = dtNow.getDate(); const mesNow = dtNow.getMonth() +1; const yearNow = dtNow.getFullYear();
            const horaNow = dtNow.getHours(); const minuNow = dtNow.getMinutes();
            let dateNowData;

            if (minuNow <= 9){
                dateNowData = `${diaNow}-${mesNow}-${yearNow} ${horaNow}:0${minuNow}`;
            } else {
                dateNowData = `${diaNow}-${mesNow}-${yearNow} ${horaNow}:${minuNow}`;
            }

            console.log("dateNowData", dateNowData);
            console.log(`Id :${Id} depart :${depart} title :${title} category :${category} price :${price}`)
            console.log("Ejecucion de funciones");
            let updatePrizesObject;

            async function allTicketsTrue(){
                //asigno true al campo allTicketsTrue
                const updateRaffle = await modelRaffle.findByIdAndUpdate(Id, { $set: { allTicketsTake : true }} );
                //genero los numeros ganadores sin repetirse (winTicket)
                //cantPrizes (esta variable esta la cantidad de numeros que se deben generar)
                while (ticketRandom.length < cantPrizes){
                    let randomNumber = Math.trunc(Math.random() * cantTicket);
                    if ( randomNumber !== 0 ){
                        
                        if (!ticketRandom.includes(randomNumber)){
                            ticketRandom.push(randomNumber);
                        }

                    }
                }
                console.log("::::::::::::::Aqui los numeros random:::::::::::::");
                console.log('ticketRandom', ticketRandom);
                //PrizesObject arreglo que posee los objetos que deben ser actualizados con los numeros en el campo winTicket 
            }

            async function TicketWin(){

                for (let i = 0; i < ticketRandom.length; i++) {
                        let ticketWin = ticketRandom[i];

                        const updateWinTicket = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                            [`PrizesObject.${i}.winTicket`] : ticketWin
                        }});
                
                }
            };

            async function UpdateBoxTickets() {
                const ticketSet = new Set(ticketRandom); // Usamos un Set para búsquedas rápidas

                // Creamos un array para almacenar las actualizaciones
                const updates = [];
                                    
                //dentro del array boxTickets [ { "No" : 1, "Contestan" : "", "No_Serial" : "", "Date" : "", "Take" : false, "Ref" : "", "Verified" : false, "Winner" : false }, {...}, {...} ];

                // Recorremos boxTickets una sola vez
                for (const ticket of boxTickets) {
                    if (ticketSet.has(ticket.No)) { // Verificamos si el ticket está en ticketRandom
                        updates.push({ id: ticket.No, winner: true }); // Preparamos la actualización
                    }
                }

                // Realizamos las actualizaciones en una sola operación
                for (const update of updates) {
                    await modelRaffle.findByIdAndUpdate(Id, { 
                        $set: { [`boxTickets.${update.id - 1}.Winner`]: update.winner } 
                    });
                }
            }

            async function fContestan(){

                for (let u = 0; u < ticketRandom.length; u++) {
                        const ticketWin = ticketRandom[u];// aqui estaran los numeros ganadores ejemplo 4, 7, 9
                        for (let x = 0; x < boxTickets.length; x++) {
                            const ele = boxTickets[x].No; //1,2,3,4,5,6,7,8,9,...... hasta el ultimo
                            const Contestan = boxTickets[x].Contestan; //aqui iran pasando todos los username que participaron
                            const Verified = boxTickets[x].Verified; //si esta false es porque no ha sido verificado como ticket pagado en el caso de sorteos "pagos"
                        

                            if (category == "Gratis"){

                                if (ele == ticketWin  && Verified === true){
                                    
                                    const updateWinTicket = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                    
                                        [`PrizesObject.${u}.winUser`] : Contestan
                        
                                    }});

                                } else if (ele == ticketWin && Verified === false) {
                                    console.log(":::: Si Encontrado pero No Verificado ::::");
                                    console.log("Aqui meto el *-Anfitrion-* dentro de winUser")
                                    console.log("_______________________");

                                    await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                    
                                        [`PrizesObject.${u}.winUser`] : UserName
                        
                                    }});
                                    
                                }

                            } else {
                                    //ele = No            Verified = 4
                                if (ele == ticketWin && Verified === true){
                                    console.log("::::Si Encontrado y Verificado ::::");
                                    console.log("Aqui meto el ganador *-Contestan-* dentro de winUser")
                                    console.log("_______________________");

                                    await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                    
                                        [`PrizesObject.${u}.winUser`] : Contestan
                        
                                    }}); 
                                    

                                } else if (ele == ticketWin && Verified === false) {
                                    console.log(":::: Si Encontrado pero No Verificado ::::");
                                    console.log("Aqui meto el *-Anfitrion-* dentro de winUser")
                                    console.log("_______________________");

                                    await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                    
                                        [`PrizesObject.${u}.winUser`] : UserName
                        
                                    }});
                                    
                                }
                            }    
                    
                        }
                
                }

            };

            async function messagesForWin(){

                const newRaffle = await modelRaffle.findById(Id);
                updatePrizesObject = newRaffle.PrizesObject
                console.log("Esto es updatePrizesObject -----------> mirar esto, se actualizo", updatePrizesObject);
                for (let n = 0; n < updatePrizesObject.length; n++) {
                    const winUser = updatePrizesObject[n].winUser; //user ganador
                    console.log("winUser --->", winUser);
                    try{
                        const resultUser = await modelUser.find({ username : winUser}); //hago una busqueda para ubicar el Id del user
                        const winId = resultUser[0]._id; //Id del user ganador.
                        console.log("VER ESTO");
                        console.log("------------------------------------");
                        console.log("winUser --->", winUser);
                        console.log("resultUser esto es la busqueda debemos recibir un objeto de la coleccion user--->", resultUser);
                        console.log("Esto es winId", winId);
                                                                                                                                                                                                                                                                                        
                        const newMessage = new modelMessage({times : dateNowData, titleArticle : title, titleURL, urlImageArticle, userId : anfitrion_id, username : UserName , question : "Felicidades ha sido ganador de un Sorteo. ¡Vaya al sorteo reclame su premio y califique!", depart, productId : Id, toCreatedArticleId : winId, ownerStore : winUser  });
                        console.log("newMessage :", newMessage);
                        const saveMessage = await newMessage.save();
                    } catch(error){
                        console.error('Ha ocurrido un error', error);
                    }    
                    
                }

            };

            async function emailsWinTicket(){
                //updatePrizesObject y title estan afuera y tengo acceso a estos datos.
                console.log("emailsWinTicket() -> ejecutandose"); 
                console.log("updatePrizesObject ->", updatePrizesObject);
                for (let i = 0; i < updatePrizesObject.length; i++) {
                    const winUser = updatePrizesObject[i].winUser; //user ganador
                    console.log("winUser --->", winUser )

                    const resultUser = await modelUser.find({ username : winUser}); //hago una busqueda para ubicar el Id del user
                    const winEmail = resultUser[0].email; //Id del user ganador.

                    // con el email y el titulo arriba disponible, se procede a crear el correo y a enviarlo.
                    const message = "Celebración de Sorteo"
                    const contentHtml = `
                    <h2 style="color: black"> Felicidades has sido ganador en un Sorteo. </h2>
                    <ul style="color: black"> 
                        <li> cuenta : ${winEmail} </li> 
                        <li> asunto : ${message} </li>
                    <ul>
                    <h2 style="color: black"> Ganaste Sorteo de ${title}. </h2>
                    <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y vaya al sorteo. Reclame su premio y califique. </p>
                    `

                    const emailMessage = {
                        from: "Blissenet<sistemve@blissenet.com>", //remitente
                        to: winEmail,
                        subject: "🎊 Celebración de Sorteo - Blissenet", //objeto
                        text: message,
                        html: contentHtml
                    };

                    //añadir las credenciales
                    const transport = nodemailer.createTransport({
                        host: "mail.blissenet.com",
                        port: 465,
                        auth: {
                            user: "sistemve@blissenet.com",
                            pass: process.env.pass_sistemve
                        }
                    });

                    transport.sendMail(emailMessage, (error, info) => {
                        if (error) {
                            console.log("Error enviando email")
                            console.log(error.message)
                        } else {
                            console.log("Email enviado")
                            
                        }
                    })                          

                }

            };

            async function emailAnfitrion(){
                console.log("emailAnfitrion() -> ejecutandose"); 

                const resultUser = await modelUser.find({ username : UserName }); //hago una busqueda para ubicar el Id del user
                const anfitrionMail = resultUser[0].email; //Id del user ganador.

                console.log(`anfitrionMail : ${anfitrionMail} | title: ${title}`); 

                const message = "Celebración de Sorteo"
                const contentHtml = `
                <h2 style="color: black"> Felicidades su Sorteo se ha celebrado. </h2>
                <ul style="color: black"> 
                    <li> cuenta : ${anfitrionMail} </li> 
                    <li> asunto : ${message} </li>
                <ul>
                <h2 style="color: black"> Celebración de Sorteo  ${title} </h2>
                <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y atienda con esmero a los dichosos ganadores, para que estos le califiquen de forma positiva. </p>
                `

                const emailMessage = {
                    from: "Blissenet<sistemve@blissenet.com>", //remitente
                    to: anfitrionMail,
                    subject: "🎊 Celebración de Sorteo - Blissenet", //objeto
                    text: message,
                    html: contentHtml
                };

                //añadir las credenciales
                const transport = nodemailer.createTransport({
                    host: "mail.blissenet.com",
                    port: 465,
                    auth: {
                        user: "sistemve@blissenet.com",
                        pass: process.env.pass_sistemve
                    }
                });

                transport.sendMail(emailMessage, (error, info) => {
                    if (error) {
                        console.log("Error enviando email")
                        console.log(error.message)
                    } else {
                        console.log("Email enviado al anfitrion")
                    }
                }) 
            };            

            async function invoiceDone(){
                //aqui creamos la factura del sorteo.
                // category > Gratis or Pago

                
                if (category === "Pago"){
                    let commission = 8;
                    let tecnicalDescription = 'Esto es un Sorteo de Tickets Pago';
                    const Invoice = new modelInvoice({ usernameSell : UserName, indexed : anfitrion_id, department : depart, title, title_id : Id,  tecnicalDescription, price, commission });
                    const InvoiceSave = await Invoice.save();
                } else {
                    let commission = 6;
                    let tecnicalDescription = 'Esto es un Sorteo de Tickets Gratis';
                    const Invoice = new modelInvoice({ usernameSell : UserName, indexed : anfitrion_id, department : depart, title, title_id : Id,  tecnicalDescription, price, commission });
                    const InvoiceSave = await Invoice.save();
                }
            };

            async function raffleHistory(){
                //aqui guardamos la data del raffle history
                const raffle = await modelRaffle.findById(Id);
                const PrizesObject =  raffle.PrizesObject;
                const image = raffle.images[0].url;

                let response;
                async function downloadImgToUpload(){
                    response = await axios.get(image, { responseType: 'arraybuffer', maxContentLength: Infinity });
                    //console.log("response ---->", response); //un espaguitero grande
                }

                downloadImgToUpload()
                    .then(()=>{
                            const epoch = new Date().getTime();
                            const folder = 'firstImgRaffleHistory';
                            const pathField = image; const extPart = pathField.split(".");
                            const ext = extPart[4]; console.log("ext------->", ext)
                            //console.log("imagen descargada", response.data); -->response.data  , es la imagen desscargada en formato binario y almacenada en un array buffer, esto es como si alguien hubiera subido una foto al servidor solo que no la guardamos solo se usa para enviar al buckets Spaces;
        
                            const key = `${folder}/${epoch}.${ext}`;
                            console.log("key -->", key);
                            let dImage;
                            
                            const params = { 
                            Bucket : bucketName,
                            Key : key,
                            Body : response.data,
                            ACL : 'public-read' 
                            };
                                    
                            s3.putObject(params, function(err, data){
                            
                                if (err){
                                    console.log('Error al subir un archivo', err);
                                } else {
                                    console.log('La imagen fue subida, Exitooooooooooooooo', data);
                                            
                                    let url = `https://${bucketName}.${endpoint}/${key}`;    
                                    let public_id = key;
                                    dImage = {public_id, url};

                                    async function saveDB(){ 
                                        const history = new modelRaffleHistory({ category, anfitrion : UserName, anfitrion_id, title_id : Id , title, price, numTickets: cantTicket, PrizesObject, dateStart, image: dImage });
                                        //(anfitrion, anfitrion_id, category, title_id, title, image, price, numTickets, PrizesObject, dateStart)
                                        const historySave = await history.save(); //data salvada.
                                    }

                                    saveDB() //invocar funcion 
                                        .then(()=>{
                                            console.log('se guardo el historial del sorteo OK')
                                        })
                                        .catch((err)=>{
                                            console.log("XXXXXXXXXXXXXXXXXXXXXXX ERROR XXXXXXXXXXXXXXXXXXXXXXXX");
                                            console.log('XXXX  ha habido un error al guardar el historial XXXX', err);
                                        })
                                }
                            
                            });
                            

                            
                    })
                    .catch((err)=>{
                        console.log("ha habido un error en la descarga de la imagen raffle", err);
                    })  


                //-- section to delete
                /*
                const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgRaffleHistory'});
                //console.log("Aqui resultUpload ----->", resultUpload);
                const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
                const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.

                const history = new modelRaffleHistory({ category, anfitrion : UserName, anfitrion_id, title_id : Id , title, price, numTickets: cantTicket, PrizesObject, dateStart, image: dImage });
                //(anfitrion, anfitrion_id, category, title_id, title, image, price, numTickets, PrizesObject, dateStart)
                const historySave = await history.save(); //data salvada.*/ 
            };

            async function blissNoti(){

                //Si el anfitrion tiene chatId entonces le enviamos el Telegrama.
            
                //enviamos un telegrama al Anfitrion para que revise rapidamente esta solicitud de toma de ticket
                const Message = `El Sorteo ${title} ha sido celebrado satifactoriamente.`;
                axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                    chat_id: chatId,
                    text: Message,
                })
                .then(response => {
                    console.log('Mensaje enviado con éxito:', response.data);
                })
                .catch(error => {

                    console.error('Error al enviar el mensaje por Telegram:', error.response.data);
                    
                });

            } 


            allTicketsTrue()
                .then(()=> {
                    TicketWin()
                        .then(()=>{
                            UpdateBoxTickets()
                                .then(()=>{

                                    fContestan()
                                        .then(()=>{
                                            messagesForWin()
                                                .then(()=>{
                                                    emailsWinTicket()
                                                        .then(()=>{
                                                            emailAnfitrion()
                                                                .then(()=>{
                                                                    invoiceDone()
                                                                        .then(()=>{
                                                                            raffleHistory()
                                                                                .then(()=>{

                                                                                    if (chatId !== ""){
                                                                                        //si tiene chatId entonces se envia un Telegrama al Anfitrion de este sirteo.
                                                                                        blissNoti()
                                                                                            .then(()=>{
                                                                                                console.log("Proceso de Celebracion OK");
                                                                                                req.session.finishMechanicSuccessRaffle = `El Sorteo ${title} se ha celebrado exitosamente`;
                                                                                                res.redirect('/admin/finishMechanic');
                                                                                            })
                                                                                            .catch(error =>{
                                                                                                console.log("Ha habido un error blissNoti()", error);
                                                                                                req.session.finishMechanicErrorRaffle = `Ha habido un Error en la Celebracion de Sorteo ${title}`;
                                                                                                res.redirect('/admin/finishMechanic');
                                                                                            })

                                                                                    } else {
                                                                                        console.log("Proceso de Celebracion OK");
                                                                                        req.session.finishMechanicSuccessRaffle = `El Sorteo ${title} se ha celebrado exitosamente`;
                                                                                        res.redirect('/admin/finishMechanic');
                                                                                    }
                                                                                   
                                                                                })
                                                                                .catch((error)=>{
                                                                                    console.log("Ha habido un error raffleHistory()", error);
                                                                                    req.session.finishMechanicErrorRaffle = `Ha habido un Error en la Celebracion de Sorteo ${title}`;
                                                                                    res.redirect('/admin/finishMechanic');
                                                                                })

                                                                        })
                                                                        .catch((error)=>{
                                                                            console.log("Ha habido un error invoiceDone()", error);
                                                                            req.session.finishMechanicErrorRaffle = `Ha habido un Error en la Celebracion de Sorteo ${title}`;
                                                                            res.redirect('/admin/finishMechanic');
                                                                        })
                                                                })
                                                                .catch((error)=>{
                                                                    console.log("Ha habido un error emailAnfitrion()", error);
                                                                    req.session.finishMechanicErrorRaffle = `Ha habido un Error en la Celebracion de Sorteo ${title}`;
                                                                    res.redirect('/admin/finishMechanic'); 
                                                                })

                                                        })
                                                        .catch((error)=>{
                                                            console.log("Ha habido un error emailsWinTicket()", error);
                                                            req.session.finishMechanicErrorRaffle = `Ha habido un Error en la Celebracion de Sorteo ${title}`;
                                                            res.redirect('/admin/finishMechanic');
                                                        })

                                                })
                                                .catch((error)=>{
                                                    console.log("Ha habido un error messagesForWin()", error);
                                                    req.session.finishMechanicErrorRaffle = `Ha habido un Error en la Celebracion de Sorteo ${title}`;
                                                    res.redirect('/admin/finishMechanic');
                                                })                        
                                        })
                                        .catch((error)=>{
                                            console.log("Ha habido un error fContestan()", error);
                                            req.session.finishMechanicErrorRaffle = `Ha habido un Error en la Celebracion de Sorteo ${title}`;
                                            res.redirect('/admin/finishMechanic');
                                        })

                                })
                                .catch((error)=>{
                                    console.log("Ha habido un error UpdateBoxTickets()", error);
                                    req.session.finishMechanicErrorRaffle = `Ha habido un Error en la Celebracion de Sorteo ${title}`;
                                    res.redirect('/admin/finishMechanic');
                                })
        


                        })
                        .catch((error)=>{
                            console.log("Ha habido un error TicketWin()", error);
                            req.session.finishMechanicErrorRaffle = `Ha habido un Error en la Celebracion de Sorteo ${title}`;
                            res.redirect('/admin/finishMechanic');
                        })
                })
                .catch((error)=>{
                    console.log("Ha habido un error allTicketsTrue()", error);
                    req.session.finishMechanicErrorRaffle = `Ha habido un Error en la Celebracion de Sorteo ${title}`;
                    res.redirect('/admin/finishMechanic');
                })
                
        } else {
            res.redirect('/admin/finishMechanic');
        }

    } else {
        res.redirect('/admin/finishMechanic');
    }     


});


//ruta para banner de forma temporal o definitiva a usuarios que violen las reglas
routes.get('/admin/stopped', async (req, res)=>{
    const userAdmin = req.session.userAdmin;

    if (userAdmin){

        const stoppedUser = await modelUser.find({ stopped : true });
        console.log("stoppedUser", stoppedUser);
        //const users = await modelUser.find({stopped : false});
        res.render('admin/stopped', ({ userAdmin, stoppedUser }));

    } else {
        res.render('admin/stopped', ({userAdmin}));
    }

});

//ruta para buscar a usuarios que violen las reglas
routes.post('/admin/stopped-search', async (req, res)=>{
    const userAdmin = req.session.userAdmin;
    const {user} = req.body;
    console.log("ver", user);
    //ahora hay que hacer una busqueda en la base de datos y con capacidad de aproximacion sin distincion de mayusculas y minisculas.

    
    if (userAdmin){

        //const stoppedUser = await modelUser.find( {stopped : true} );
        const users = await modelUser.find( {$and: [{stopped : false}, {username:  { $regex : user, $options: "i" } }] });
        
        res.json(users);

    } 


});

//ruta para buscar a usuarios que violen las reglas
routes.post('/admin/stopped-search-block', async (req, res)=>{
    const userAdmin = req.session.userAdmin;
    const {user} = req.body;
    //ahora hay que hacer una busqueda en la base de datos y con capacidad de aproximacion sin distincion de mayusculas y minisculas.
    
    if (userAdmin){

        //const stoppedUser = await modelUser.find( {stopped : true} );

        const users = await modelUser.find( {$and: [{stopped : true}, {username:  { $regex : user, $options: "i" } }] });
        
        res.json(users);

    } 

});


//ruta para bannear de forma temporal o definitiva a usuarios que violen las reglas
routes.post('/admin/stopped-ban', async (req, res)=>{

    try {
        
        const userAdmin = req.session.userAdmin;
        const admin = userAdmin[0].adminName;
        const {user, id, ban, resume} = req.body;
        console.log('******* stopped-ban ******* ')
        console.log("ver", user, id, ban, resume);
        console.log("admin", admin);
    
        //proceso para actualizar el estatus del usuario y poder luego deslogearlo para sacarlo del sistema.
        if (userAdmin){
            

            updateToLock()
                .then(()=>{
                    const response = { code : "ok", message : `Se ha bloqueado el usuario con el username ${user}` };
                    res.json(response);
                })
                .catch( error =>{
                    console.log("Ha habido un error con la funcion updateUser()");
                    const response = { code : "error", message : `Un error no ha podido bloquear al usuario: ${user}` };
                    res.json(response);
                })


            async function updateToLock(){

                const stopped = new modelStopped({indexed : id, username: user, ban, adminLocked : admin, resume});
                const stoppedSave = await stopped.save();

                const findUserAndStopped = await modelUser.findByIdAndUpdate(id, {stopped : true}); 
                //ahora quiero deslogear al usuario con este id 
            }



        }

    
    } catch (error) {
        console.log("Ha habido un error, error");
    }

});



//ruta para desbloquear un usuario bloqueado
routes.post('/admin/stopped-ban-unlock', async (req, res)=>{

    const userAdmin = req.session.userAdmin;
    const admin = userAdmin[0].adminName;
    const { user, id } = req.body;
    console.log('******* stopped-ban-unlock ******* ')
    console.log("ver", user, id);
    console.log("admin", admin);

    async function unlocked(){
        const stopped =  await modelStopped.updateOne({indexed : id}, { adminUnlocked : admin, status : "unlocked" });
        const findUserAndStopped = await modelUser.findByIdAndUpdate(id, {stopped : false});  
    }        

    unlocked()
        .then(()=>{
            const response = { code : "ok", message : `Se ha desbloqueado el usuario con el username ${user}` };
            res.json(response);
        })
        .catch(err =>{
            const response = { code : "err", message : `Ha ocurrido un error, intente mas tarde.` };
            res.json(response);
        })



});

routes.post('/admin/stopped-search-block-list', async (req, res)=>{
    const userAdmin = req.session.userAdmin;
    const {user} = req.body;
    //ahora hay que hacer una busqueda en la base de datos y con capacidad de aproximacion sin distincion de mayusculas y minisculas.
    
    if (userAdmin){

        //const stoppedUser = await modelUser.find( {stopped : true} );

        const users = await modelUser.find( {$and: [{stopped : true}, {username:  user} ]} );

        const stopped =  await modelStopped.find({username : user});

        console.log("Esto es stopped de /admin/stopped-search-block-list", stopped);
        res.json(stopped);

    } 
});


//:::::::::::   Controlador de user-admin  :::::::::::

//rutas para llegar al contolador de administradores y poder bloquear o desbloquear.
routes.get('/admin/adminControl', async (req, res)=>{
    const userAdmin = req.session.userAdmin;

    const searchAdmins = await modelUserAdmin.find();
    const adminsCount = await modelUserAdmin.find().count();

    const searchAdminsLocked = await modelUserAdmin.find({ locked : true });
    const adminsLockedCount = await modelUserAdmin.find({ locked : true }).count();

    const searchAdminsCanceled = await modelUserAdmin.find({ contractStatus : "Canceled" });
    const adminsCanceledCount = await modelUserAdmin.find({ contractStatus : "Canceled" }).count();

    res.render('admin/adminControl', {userAdmin, searchAdmins, adminsCount, searchAdminsLocked, adminsLockedCount, searchAdminsCanceled, adminsCanceledCount });
});

routes.post('/admin/adminControl/search', async (req, res)=>{
    const userAdmin = req.session.userAdmin;
    const { search, selectSearcher } = req.body;

    console.log(" ***** search, selectSearcher ***** ");
    console.log( search, selectSearcher );

    let searchAdmins, adminsCount, searchAdminsLocked, adminsLockedCount, searchAdminsCanceled, adminsCanceledCount;


    if (selectSearcher == "admin"){
        if (search.length !==0){
            searchAdmins = await modelUserAdmin.find({ adminName : search });
            adminsCount = await modelUserAdmin.find({ adminName : search }).count();
            searchAdminsLocked = await modelUserAdmin.find({ adminName : search, locked : true });
            adminsLockedCount = await modelUserAdmin.find({ adminName : search, locked : true }).count();
            searchAdminsCanceled = await modelUserAdmin.find({ adminName : search, contractStatus : "Canceled" });
            adminsCanceledCount = await modelUserAdmin.find({ adminName : search, contractStatus : "Canceled" }).count();
   
        } else {
            searchAdmins = await modelUserAdmin.find();
            adminsCount = await modelUserAdmin.find().count();
            searchAdminsLocked = await modelUserAdmin.find({ locked : true });
            adminsLockedCount = await modelUserAdmin.find({ locked : true }).count();
            searchAdminsCanceled = await modelUserAdmin.find({ contractStatus : "Canceled" });
            adminsCanceledCount = await modelUserAdmin.find({ contractStatus : "Canceled" }).count();
        }
    } 

    if (selectSearcher == "workerNumber"){
        if (search.length !==0){
            searchAdmins = await modelUserAdmin.find({ workerNumber : search });
            adminsCount = await modelUserAdmin.find({ workerNumber : search }).count();
            searchAdminsLocked = await modelUserAdmin.find({ workerNumber : search, locked : true });
            adminsLockedCount = await modelUserAdmin.find({ workerNumber : search, locked : true }).count();
            searchAdminsCanceled = await modelUserAdmin.find({ workerNumber : search, contractStatus : "Canceled" });
            adminsCanceledCount = await modelUserAdmin.find({ workerNumber : search, contractStatus : "Canceled" }).count();
   
        } else {
            searchAdmins = await modelUserAdmin.find();
            adminsCount = await modelUserAdmin.find().count();
            searchAdminsLocked = await modelUserAdmin.find({ locked : true });
            adminsLockedCount = await modelUserAdmin.find({ locked : true }).count();
            searchAdminsCanceled = await modelUserAdmin.find({ contractStatus : "Canceled" });
            adminsCanceledCount = await modelUserAdmin.find({ contractStatus : "Canceled" }).count();
        }
    } 


    res.render('admin/adminControl', {userAdmin, searchAdmins, adminsCount, searchAdminsLocked, adminsLockedCount, searchAdminsCanceled, adminsCanceledCount});
});

routes.post('/admin/adminControl/update', async (req, res)=>{
    const userAdmin = req.session.userAdmin;

    console.log(":::::::::: Update -> ")
    console.log("estamos en /admin/adminControl/update");
    console.log(req.body);
    
    const { admin_ID, adminNameEdit, emailEdit, namesAdminEdit, lastNameEdit, identificationEdit, socialSecurityEdit, addressEdit, sonsEdit,  marriedEdit, phone1Edit, phone2Edit, dateEdit, rolEdit, lockedEdit, contractStatusEdit, dateContractOffEdit} = req.body;
    //console.log("probando consta de destructuring", admin_ID, adminNameEdit, emailEdit, namesAdminEdit, lastNameEdit, identificationEdit, socialSecurityEdit, addressEdit, sonsEdit, marriedEdit, phone1Edit, phone2Edit, dateEdit, rolEdit, lockedEdit, contractStatusEdit, dateContractOffEdit );

    let date = new Date(dateContractOffEdit);
    let dia = date.getDate(), mes = date.getMonth() +1, anio = date.getFullYear();
    let dateFormat = `${dia}-${mes}-${anio}`;

    console.log("Esto es date metido por el gerente de operaciones o un admin de recurso humano")
    console.log(date);

    if (contractStatusEdit == "Canceled"){

        //aqui los elementos d la DB : email, rol, active, name, lastName, identification, address, phone1, phone2, familyBurden, married, dates 
        const updateAdmin = await modelUserAdmin.findByIdAndUpdate( admin_ID, {email : emailEdit, rol : rolEdit, namesAdmin : namesAdminEdit , lastName : lastNameEdit, identification : identificationEdit, socialSecurity : socialSecurityEdit, address : addressEdit, phone1 : phone1Edit, phone2 : phone2Edit, sons : sonsEdit, married : marriedEdit, dates : dateEdit, locked : "true", contractStatus : contractStatusEdit, dateOff : dateFormat } )
    
        console.log("Esto es updateAdmin :", updateAdmin);

        res.json(req.body);

    } else {

         //aqui los elementos d la DB : email, rol, active, name, lastName, identification, address, phone1, phone2, familyBurden, married, dates 
         const updateAdmin = await modelUserAdmin.findByIdAndUpdate( admin_ID, {email : emailEdit, rol : rolEdit, namesAdmin : namesAdminEdit , lastName : lastNameEdit, identification : identificationEdit, socialSecurity : socialSecurityEdit, address : addressEdit, phone1 : phone1Edit, phone2 : phone2Edit, sons : sonsEdit, married : marriedEdit, dates : dateEdit, locked : lockedEdit, contractStatus : contractStatusEdit, dateOff : "no_dateOff" } )
    
         console.log("Esto es updateAdmin :", updateAdmin);
 
         res.json(req.body);
    }
   
});

routes.post('/admin/adminControl/change-passw', async (req, res)=>{

    console.log("::::::: /admin/adminControl/change-passw ::::::: ")
    console.log(req.body);
    const { id, newPass, confirPass } = req.body;
    let hashPassword; 

    console.log("midiendo los caracteres de newPass");
    console.log(newPass.length)
    if (newPass.length > 6 && newPass.length <= 13 ){

        if (newPass === confirPass){

            console.log("todas las condiciones cumplidas")
            hashing();

        } else {

            const msgPassNoValid = { typeMsg: "redValidpass" , msg : "Error en validación de Contraseña" };
            console.log("Error en validación de Contraseña");
            res.json(msgPassNoValid);

        }

    } else {

        const msgShortPass = { typeMsg: "redCaracter" , msg : "Su contraseña debe tener minimo 7 y un maximo de 13 caracteres" }
        console.log("Su contraseña debe tener minimo 7 carcateres y no superar 12 caracteres");
        res.json(msgShortPass);

    }

    async function hashing(){
        hashPassword = await bcrypt.hash(newPass, 6);
        console.log("Password nuevo ha guardar");
        console.log("Este es el hash del password--->",hashPassword);
        // const compares = await bcrypt.compare(password, hashPassword);
        // console.log("resul de la compracion--->",compares)

        const updateAdminPassw = await modelUserAdmin.findByIdAndUpdate( id, {password : hashPassword} );
        const msgGreenSuccess = { typeMsg: "greenSuccess" , msg : "Su nueva Contraseña ha sido guardada con Exito", obje : updateAdminPassw };

        res.json(msgGreenSuccess); 
    }     


});

routes.get('/admin/accountbanks', async (req,res)=>{
    const userAdmin = req.session.userAdmin;
    //console.log("aqui userAdmin ---->",userAdmin)
    const searchAccounts = await modelBankAccount.find();
    console.log("searchAccounts ----->", searchAccounts);
    res.render('admin/accountbanks', {userAdmin, searchAccounts});
});

routes.post('/admin/new-accountsbank', async (req, res)=>{
    //console.log(req.body);
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;
    const {bankname, accountnumber, phonenumber} = req.body
    let company, companyID;
    //console.log(adminName);
    //console.log(bankname, accountnumber, phonenumber);

    const searchAdminProfile = await modelAdminProfile.find();
    //console.log("::::searchAdminProfile : ", searchAdminProfile )
    if (searchAdminProfile.length !==0){
        company = searchAdminProfile[0].company;
        companyID = searchAdminProfile[0].companyID;
    }


    const accountBank = new modelBankAccount({bankname, accountowner : company, accountnumber , phonenumber, rif : companyID, adminName});
    const accountBankSave = await accountBank.save();
    console.log(accountBankSave);

    res.redirect('/admin/accountbanks')
});

routes.post('/admin/edit-accountsbank', async (req, res)=>{
    
    console.log("Estamos en edit accountBank -----------")
    console.log(req.body);
    const {idAccount, banknameEdit, accountnumberEdit, phonenumberEdit } = req.body;
    let company, companyID;

    const searchAdminProfile = await modelAdminProfile.find();
    //console.log("::::searchAdminProfile : ", searchAdminProfile )
    if (searchAdminProfile.length !==0){
        company = searchAdminProfile[0].company;
        companyID = searchAdminProfile[0].companyID;
    }

    const editAccount = await modelBankAccount.findByIdAndUpdate(idAccount, {bankname : banknameEdit, accountowner : company, accountnumber : accountnumberEdit, phonenumber : phonenumberEdit, rif : companyID}) 
    console.log("Esto es editAccount --->",editAccount);
    res.redirect('/admin/accountbanks')
});

routes.get('/admin/delete-accountbank/:id', async (req,res)=>{
    const userAdmin = req.session.userAdmin;
    //console.log("aqui userAdmin ---->",userAdmin)
    const accountId = req.params.id;
    console.log(accountId)

    const searchAccounts = await modelBankAccount.findByIdAndDelete(accountId);
    console.log("searchAccounts ----->", searchAccounts);
    res.redirect('/admin/accountbanks');
});

routes.get('/admin/lock-accountbank/:id', async (req,res)=>{
    const userAdmin = req.session.userAdmin;
    //console.log("aqui userAdmin ---->",userAdmin)
    const accountId = req.params.id;
    console.log(accountId)
    
    const searchAccount = await modelBankAccount.findById(accountId);
    console.log("searchAccount ---->", searchAccount)
    if (searchAccount.lock === false){
        const searchAccountLock = await modelBankAccount.findByIdAndUpdate(accountId, {lock : true});
    } else {
        const searchAccountLock = await modelBankAccount.findByIdAndUpdate(accountId, {lock : false});
    }

    
    res.redirect('/admin/accountbanks');
});

routes.post('/admin/requestAccountBank', async(req, res)=>{
    const idAccountReq = req.body.idAccountReq;
    console.log("Esto es lo que esta llegando al banckend -----> ", req.body);
    const searchAccount = await modelBankAccount.findById(idAccountReq);
    res.json(searchAccount);
})

routes.post('/admin/invoice-marketing-Bank', async(req, res)=>{
    console.log("Esto es lo que esta llegando al banckend -----> ", req.body);
    const bank  = req.body.bank;
    //console.log("Esto es bank", bank);
    const searchBank = await modelBankAccount.find({ bankname : bank });
    //console.log("searchBank --->", searchBank);
    res.json(searchBank);
});

//::::Perfil Administrativo "Es lo primero que deberia de llenar el franquiciado"
routes.get('/admin/administrativeProfile', async (req, res)=>{
    const userAdmin = req.session.userAdmin;
    //console.log("aqui userAdmin ---->",userAdmin)
    const createAdminProfile = req.session.createAdminProfile;
    const editAdminProfile = req.session.editAdminProfile;

    delete req.session.createAdminProfile;
    delete req.session.editAdminProfile;

    const searchAdminProfile = await modelAdminProfile.find();
    console.log("::::searchAdminProfile ----->", searchAdminProfile);

    res.render('admin/administrativeProfile', {userAdmin, searchAdminProfile, createAdminProfile, editAdminProfile });
});

routes.post('/admin/new-administrativeProfile', async (req, res)=>{
    console.log(req.body);
    console.log("Hemos llegado a : /admin/new-administrativeProfile")
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;
    const { company, companyID, companyObject, franchiseOwner, manager, dateborn, country, coState, coAddress, phone1, phone2, email, nameTaxInstitute, taxesCode, taxesName, taxesPercent } = req.body
    //console.log(adminName);
    //console.log(bankname, accountnumber, phonenumber, rif);
    const adminProfile = new modelAdminProfile({ company, companyID, companyObject, franchiseOwner, manager, dateborn, country, coState, coAddress, phone1, phone2, email, nameTaxInstitute, taxesCode, taxesName, taxesPercent });
    const adminProfileSave = await adminProfile.save();
    console.log(adminProfileSave);

    req.session.createAdminProfile = '!Perfil creado exitosamente!'
    res.redirect('/admin/administrativeProfile');
});

routes.post('/admin/edit-administrativeProfile', async (req, res)=>{
    console.log(req.body);
    console.log("Hemos llegado a : /admin/edit-administrativeProfile")
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;
           
    const {idAdminProfile,  company, companyID, companyObject, franchiseOwner, manager, dateborn, country, coState, coAddress, phone1, phone2, email, nameTaxInstitute, taxesCode, taxesName, taxesPercent } = req.body
    //console.log(adminName);
  
    const EditAdminProfile = await modelAdminProfile.findByIdAndUpdate(idAdminProfile, { company, companyID, companyObject, franchiseOwner, manager, dateborn, country, coState, coAddress, phone1, phone2, email, nameTaxInstitute, taxesCode, taxesName, taxesPercent });
    console.log(":::idAdminProfile : ", idAdminProfile);
    //console.log(EditAdminProfile);
    req.session.editAdminProfile = '!Perfil editado exitosamente!'
    res.redirect('/admin/administrativeProfile');
});
    
routes.post('/admin/report', async (req, res)=>{

    try {
        
        console.log("Hemos llegado a /admin/report");
        console.log(req.body);
        const {visitante, id_anunciante, anunciante, depart, id_title, title, titleURL, denuncia} = req.body;
        
        const date = new Date();
        let dia = date.getDate();
        let mes = date.getMonth() +1;
        let anio = date.getFullYear();
        let dateOpen; 

        if (mes <= 9){
            dateOpen = `${dia}-0${mes}-${anio}`
        } else {
            dateOpen = `${dia}-${mes}-${anio}`
        }
        

        let epoch = date.getTime();
        let codeReport = `RDD-${epoch}` //RDD = Reporte De Denuncia.
        
        console.log("codeReport :", codeReport);
        console.log("dateOpen :", dateOpen);
        console.log(visitante, id_anunciante,  anunciante, depart, id_title, title, titleURL, denuncia);
        
        const search = await modelReport.find({ $and : [{visitante}, {id_title}] });
        //malo debemos hacer una verificacion real 
        console.log("search", search);
        
        if (search.length !==0){
            //console.log('Un reporte de denuncia ya existe sobre este anuncio');
            req.session.reportDone = "Un reporte de denuncia ya existe sobre este anuncio";
        } else {
            const report = new modelReport({ codeReport, dateOpen, visitante, id_anunciante, anunciante, depart, id_title, title, titleURL, denuncia});
            const reportSave = await report.save();
            //console.log('Gracias por su denuncia. En breve un administrador iniciará con la investigación.');
            req.session.reportSuccess = "Gracias por su denuncia. En breve un administrador iniciará con la investigación.";
        }

        // /product/items/68cd5b1a4c908b6558cf8da1/nuevo-humidificador-de-chimenea-con-llama-simulada-
        res.redirect(`/product/${depart}/${id_title}/${titleURL}`);

    } catch (error) {
        
        req.session.errorReport = "Ha ocurrido un error, intente luego";
        res.redirect(`/product/${depart}/${id_title}/${titleURL}`);
        
    }    


});

//aqui es donde los admin toman los reportes que luego procesaran
routes.get('/admin/pool/reports', async (req, res)=>{

    const userAdmin = req.session.userAdmin;
    
    if (userAdmin){

        const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
        delete req.session.msgOrdersTakenFinded;

        const searchReport = await modelReport.find({admin: "no_admin", process: false});
        const searchReportCount = await modelReport.find({admin: "no_admin", process: false}).count();
        console.log("------------- searchReport");
        console.log("searchReport", searchReport);
        
        res.render('admin/poolReport', ({userAdmin, searchReport, searchReportCount, msgOrdersTakenFinded}));

    } else {

        res.render('admin/poolReport', ({ userAdmin }));

    }

});

//esta ruta post es para poder filtrar informacion y permitir que los administradores puedan organizar su trabajo.
routes.post('/admin/pool/reports', async (req, res)=>{
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;
    
    const {dateForm, searcher, selectSearcher } = req.body;
    console.log(dateForm, searcher, selectSearcher);

    console.log("::::::::::::: Pool Reports Busquedas :::::::::::::::::::::::::::::")

    if (selectSearcher == "Date"){

        if (dateForm.length !==0 ){
            let splitdate = dateForm.split("-");
            let dia = splitdate[2];
            let mes = splitdate[1];
            let anio = splitdate[0];

            let date = `${dia}-${mes}-${anio}`;
            console.log("date is type", typeof date ); 
            console.log("Esto es date :", date);
                
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchReport =  await modelReport.find({ admin: "no_admin", process: false, dateOpen: date });
            console.log("searchReport :", searchReport);
            const searchReportCount =  await modelReport.find({ admin: "no_admin", process: false, dateOpen: date }).count();
            res.render('admin/poolReport', {userAdmin, searchReport, searchReportCount, msgOrdersTakenFinded});
        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchReport =  await modelReport.find({ admin: "no_admin", process: false });
            const searchReportCount =  await modelReport.find({ admin: "no_admin", process: false }).count();
            res.render('admin/poolReport', {userAdmin, searchReport, searchReportCount, msgOrdersTakenFinded});
        }

    }

    if (selectSearcher == "Departs"){

        if(searcher.length !==0 ){
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchReport =  await modelReport.find({ admin: "no_admin", process: false, depart: searcher });
            const searchReportCount =  await modelReport.find({ admin: "no_admin", process: false, depart: searcher }).count();
            res.render('admin/poolReport', {userAdmin, searchReport, searchReportCount, msgOrdersTakenFinded});
        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchReport =  await modelReport.find({ admin: "no_admin", process: false });
            const searchReportCount =  await modelReport.find({ admin: "no_admin", process: false }).count();
            res.render('admin/poolReport', {userAdmin, searchReport, searchReportCount, msgOrdersTakenFinded});
        }

    }

    if (selectSearcher == "CodeReport"){

        if(searcher.length !==0 ){
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchReport =  await modelReport.find({ admin: "no_admin", process: false,  codeReport: searcher });
            console.log("searchReport", searchReport);
            const searchReportCount =  await modelReport.find({ admin: "no_admin", process: false, codeReport: searcher }).count();
            res.render('admin/poolReport', {userAdmin, searchReport, searchReportCount, msgOrdersTakenFinded});
        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchReport =  await modelReport.find({ admin: "no_admin", process: false });
            const searchReportCount =  await modelReport.find({ admin: "no_admin", process: false }).count();
            res.render('admin/poolReport', {userAdmin, searchReport, searchReportCount, msgOrdersTakenFinded});
        }    
        
    }

    if (selectSearcher == "Anunciante"){

        if(searcher.length !==0 ){
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchReport =  await modelReport.find({ admin: "no_admin", process: false,  anunciante: searcher });
            console.log("searchReport", searchReport);
            const searchReportCount =  await modelReport.find({ admin: "no_admin", process: false, anunciante: searcher }).count();
            res.render('admin/poolReport', {userAdmin, searchReport, searchReportCount, msgOrdersTakenFinded});
        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchReport =  await modelReport.find({ admin: "no_admin", process: false });
            const searchReportCount =  await modelReport.find({ admin: "no_admin", process: false }).count();
            res.render('admin/poolReport', {userAdmin, searchReport, searchReportCount, msgOrdersTakenFinded});
        }    
        
    }

});

//Toma de ordenes del grupo invoice 
//esta ruta es la que recibe las ordenes que han tomado los administradores "validadores".
routes.post('/admin/pool/reports/OrdersTaken', async (req, res)=>{  
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;

    console.log(":::::: Orders Taken ::::::")
    console.log("admin : ", adminName );
    //console.log(req.body.orders);// esto es un array de OrdersID
    const ordersArray = req.body.orders;


    try {
        for (let i = 0; i < ordersArray.length; i++) {
          const orderID = ordersArray[i];
          await modelReport.findByIdAndUpdate(orderID, { admin: adminName });
        }
    
        req.session.msgOrdersTakenFinded = "¡Ordenes tomadas satisfactoriamente!";
        let response = { "resp": "ok" };
        res.json(response);

    } catch (error) {
        // Manejo de error si ocurre algún problema en la base de datos
        console.error(error);
        res.status(500).json({ error: "Ocurrió un error en el servidor" });
      }
        

});

// aqui es donde el admin puede processar las denuncias
routes.get('/admin/process/reports', async (req,res)=>{
    const userAdmin = req.session.userAdmin;


    if (userAdmin){

        const adminName = userAdmin[0].adminName; 
        console.log("Aqui el adminName ---->", adminName);
    
        const searchToProcess =  await modelReport.find({admin: adminName , process: false});
        //console.log("Este es el searchToProcess ---->", searchToProcess);
        const searchProcess =  await modelReport.find({process: true}).sort({createdAt : -1});
        const searchProcessCount =  null;
        //console.log("Este es el searchHistory ---->", searchHistory);


        res.render('admin/report', { userAdmin, searchToProcess, searchProcess, searchProcessCount });

    } else {

        res.render('admin/report', { userAdmin });
    }
    
});

routes.post('/admin/process/reports', async(req, res)=>{
    console.log("Estamos en /admin/process/reports")
    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName;
    
    const {dateForm, searcher, selectSearcher } = req.body;
    console.log(dateForm, searcher, selectSearcher);

    console.log("::::::::::::: Process Reports Busquedas :::::::::::::::::::::::::::::")

    if (selectSearcher == "Date"){

        if (dateForm.length !==0 ){
            let splitdate = dateForm.split("-");
            let dia = splitdate[2];
            let mes = splitdate[1];
            let anio = splitdate[0];

            let date = `${dia}-${mes}-${anio}`;
            console.log("date is type", typeof date ); 
            console.log("Esto es date :", date);
                
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchProcess =  await modelReport.find({ process: true, dateOpen: date }).sort({createdAt : -1});
            console.log("searchReport :", searchProcess);
            const searchProcessCount =  await modelReport.find({ process: true, dateOpen: date }).count();
            const searchToProcess = await modelReport.find({ process: false, dateOpen: date });
            res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded});
        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchProcess =  await modelReport.find({ process: true }).sort({createdAt : -1});
            const searchProcessCount =  null;
            const searchToProcess = await modelReport.find({ process: false });
            res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded});
        }

    }

    if (selectSearcher == "Departs"){

        if(searcher.length !==0 ){

            if (dateForm.length !==0 ){
                let splitdate = dateForm.split("-");
                let dia = splitdate[2];
                let mes = splitdate[1];
                let anio = splitdate[0];

                let date = `${dia}-${mes}-${anio}`;
                console.log("date is type", typeof date ); 
                console.log("Esto es date :", date);

                const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
                delete req.session.msgOrdersTakenFinded;
                const searchProcess =  await modelReport.find({  process: true, depart: searcher, dateOpen: date }).sort({createdAt : -1});
                const searchProcessCount =  await modelReport.find({  process: true, depart: searcher, dateOpen: date }).count();
                const searchToProcess = await modelReport.find({ process: false, depart: searcher, dateOpen: date });
                res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded});

            } else {

                const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
                delete req.session.msgOrdersTakenFinded;
                const searchProcess =  await modelReport.find({  process: true, depart: searcher }).sort({createdAt : -1});
                const searchProcessCount =  await modelReport.find({  process: true, depart: searcher }).count();
                const searchToProcess = await modelReport.find({ process: false, depart: searcher });
                res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded});
            }

        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchProcess =  await modelReport.find({ process: true }).sort({createdAt : -1});
            const searchProcessCount =  null;
            const searchToProcess = await modelReport.find({ process: false });
            res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded});
        }

    }

    if (selectSearcher == "CodeReport"){

        if(searcher.length !==0 ){
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchProcess =  await modelReport.find({ process: true,  codeReport: searcher }).sort({createdAt : -1});
            console.log("searchProcess", searchProcess);
            const searchProcessCount =  await modelReport.find({  process: true, codeReport: searcher }).count();
            const searchToProcess = await modelReport.find({ process: false, codeReport: searcher });
            res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded});
        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchProcess =  await modelReport.find({  process: true }).sort({createdAt : -1});
            const searchProcessCount =  null;
            const searchToProcess = await modelReport.find({ process: false });
            res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded});
        }    
        
    }

    if (selectSearcher == "Anunciante"){
       
        if(searcher.length !==0 ){

            if (dateForm.length !==0 ){
                let splitdate = dateForm.split("-");
                let dia = splitdate[2];
                let mes = splitdate[1];
                let anio = splitdate[0];

                let date = `${dia}-${mes}-${anio}`;
                console.log("date is type", typeof date ); 
                console.log("Esto es date :", date);

    
                const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
                delete req.session.msgOrdersTakenFinded;                         
                const searchProcess =  await modelReport.find({ process: true,  anunciante: searcher, dateOpen: date }).sort({createdAt : -1});
                console.log("Estamos buscando por anunciante", searcher);
                console.log("searchProcess", searchProcess);
                const searchProcessCount =  await modelReport.find({ process: true, anunciante: searcher, dateOpen: date }).count();
                const searchToProcess = await modelReport.find({ process: false, anunciante: searcher, dateOpen: date });
                res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded});                

            } else {
    
                const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
                delete req.session.msgOrdersTakenFinded;                         
                const searchProcess =  await modelReport.find({ process: true,  anunciante: searcher }).sort({createdAt : -1});
                console.log("Estamos buscando por anunciante", searcher);
                console.log("searchProcess", searchProcess);
                const searchProcessCount =  await modelReport.find({ process: true,  anunciante: searcher }).count();
                const searchToProcess = await modelReport.find({ process: false, anunciante: searcher });
                res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded});


            }

        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchProcess =  await modelReport.find({ process: true }).sort({createdAt : -1});
            const searchProcessCount =  null;
            const searchToProcess = await modelReport.find({ process: false });
            res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded});
        }    
        
    }
    
    if (selectSearcher === "Admin"){
        console.log("***** Por Admin *****")

        if(searcher.length !==0 ){

            if (dateForm.length !==0 ){
                let splitdate = dateForm.split("-");
                let dia = splitdate[2];
                let mes = splitdate[1];
                let anio = splitdate[0];

                let date = `${dia}-${mes}-${anio}`;
                console.log("date is type", typeof date ); 
                console.log("Esto es date :", date);

                const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
                delete req.session.msgOrdersTakenFinded;                         
                const searchProcess =  await modelReport.find({ process: true, admin: searcher, dateOpen: date }).sort({createdAt : -1});
                console.log("Estamos buscando por anunciante", searcher);
                console.log("searchProcess", searchProcess);
                const searchProcessCount =  await modelReport.find({ process: true, admin: searcher, dateOpen: date }).count();
                const searchToProcess = await modelReport.find({ process: false, admin: searcher, dateOpen: date });
                res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded}); 

            } else {
            
                const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
                delete req.session.msgOrdersTakenFinded;                         
                const searchProcess =  await modelReport.find({ process: true,  admin: searcher }).sort({createdAt : -1});
                console.log("Estamos buscando por anunciante", searcher);
                console.log("searchProcess", searchProcess);
                const searchProcessCount =  await modelReport.find({ process: true, admin: searcher }).count();
                const searchToProcess = await modelReport.find({ process: false, admin: searcher });
                res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded});

            }

        } else {
            const msgOrdersTakenFinded = req.session.msgOrdersTakenFinded;
            delete req.session.msgOrdersTakenFinded;
            const searchProcess =  await modelReport.find({ process: true }).sort({createdAt : -1});
            const searchProcessCount =  null;
            const searchToProcess = await modelReport.find({ process: false });
            res.render('admin/report', {userAdmin, searchProcess, searchProcessCount, searchToProcess, msgOrdersTakenFinded});
        } 

    }



});
             
//esta es la ruta para tomar los reportes y poder luego ejecutar una accion que puede ser
// : Eliminar todo al ADS o Eiminar recursos de tipo Media. (videos e imaganes).
routes.post('/admin/process/taking/reports', async (req,res)=>{

    console.log(req.body);
    const {id, title_id} = req.body;
    console.log("id", id);
    const search = await modelReport.findById(id);
    console.log("search: ", search)

    res.json(search);

});

//esta es la ruta donde se definen las acciones a tomar. y a evaluar si posee una factura. 
routes.post('/admin/search/taking/reports', async (req,res)=>{

    console.log(req.body);
    const { action, codeReport } = req.body;
    
    const search = await modelReport.find({ codeReport });
    console.log("********ver********")
    console.log("action: ", action)
    console.log("search: ", search)

    if (search.length !==0 ){

        const id_title = search[0].id_title;
        const depart = search[0].depart;

        if (action === "deleteAll"){

            const searchInvoice = await modelInvoice.find({title_id : id_title, payCommission : false});
            console.log("searchInvoice : ", searchInvoice);
            console.log("action -> deleteAll");
            const resp = { action : 'deleteAll', invoice : searchInvoice }

            res.json(resp);

        } else if (action === "deleteMedia" ){
            console.log("action -> deleteMedia");
            
            if (depart === 'arts'){

                const searchPubli = await modelArtes.findById(id_title);     
                const resp = { action : 'deleteMedia', publi : searchPubli }
                res.json(resp);

            } else if (depart ==='airplanes'){

                const searchPubli = await modelAirplane.findById(id_title);
                const resp = { action : 'deleteMedia', publi : searchPubli }
                res.json(resp);

            } else if (depart === 'automotive') {

                const searchPubli = await modelAutomotive.findById(id_title);
                const resp = { action : 'deleteMedia', publi : searchPubli }
                res.json(resp);

            } else if (depart === 'items'){

                const searchPubli = await modelItems.findById(id_title);
                const resp = { action : 'deleteMedia', publi : searchPubli }
                res.json(resp);

            } else if (depart === 'nautical'){

                const searchPubli = await modelNautical.findById(id_title);
                const resp = { action : 'deleteMedia', publi : searchPubli }
                res.json(resp);

            } else if (depart === 'realstate'){

                const searchPubli = await modelRealstate.findById(id_title);
                const resp = { action : 'deleteMedia', publi : searchPubli }
                res.json(resp);

            } else if (depart === 'service'){

                const searchPubli = await modelService.findById(id_title);
                const resp = { action : 'deleteMedia', publi : searchPubli }
                res.json(resp);

            } else if (depart === 'auctions'){

                const searchPubli = await modelAuction.findById(id_title);
                const resp = { action : 'deleteMedia', publi : searchPubli }
                res.json(resp);

            }
            
        } else if (action === "rejectDenunt"){

            console.log("action -> rejectDenunt");
            
            if (depart === 'arts'){

                const searchPubli = await modelArtes.findById(id_title);     
                const resp = { action : 'rejectDenunt', publi : searchPubli }
                res.json(resp);

            } else if (depart ==='airplanes'){

                const searchPubli = await modelAirplane.findById(id_title);
                const resp = { action : 'rejectDenunt', publi : searchPubli }
                res.json(resp);

            } else if (depart === 'automotive') {

                const searchPubli = await modelAutomotive.findById(id_title);
                const resp = { action : 'rejectDenunt', publi : searchPubli }
                res.json(resp);

            } else if (depart === 'items'){

                const searchPubli = await modelItems.findById(id_title);
                const resp = { action : 'rejectDenunt', publi : searchPubli }
                res.json(resp);

            } else if (depart === 'nautical'){

                const searchPubli = await modelNautical.findById(id_title);
                const resp = { action : 'rejectDenunt', publi : searchPubli }
                res.json(resp);

            } else if (depart === 'realstate'){

                const searchPubli = await modelRealstate.findById(id_title);
                const resp = { action : 'rejectDenunt', publi : searchPubli }
                res.json(resp);

            } else if (depart === 'service'){

                const searchPubli = await modelService.findById(id_title);
                const resp = { action : 'rejectDenunt', publi : searchPubli }
                res.json(resp);

            } else if (depart === 'auctions'){

                const searchPubli = await modelAuction.findById(id_title);
                const resp = { action : 'rejectDenunt', publi : searchPubli }
                res.json(resp);

            }            

        }

    }    


});

routes.post('/admin/processing/taking/reports', async (req,res)=>{
    console.log("···Estamos en el end-point...")

    const userAdmin = req.session.userAdmin;
    const adminName = userAdmin[0].adminName; //administrador

    const { data } = req.body;
    console.log( data );
    const Action = data.action;
    const IdReport = data.IdReport;
    const Title = data.Title;
    const IdTitle = data.IdTitle;
    const Depart = data.Depart;
    const IdAnunciante = data.IdAnunciante;
    const Anunciante = data.anunciante;
    const BoxMedia = data.boxMedia;
    const Note = data.note;
    let dateClose;

    console.log("Action", Action);
    console.log("IdReport", IdReport);
    console.log("Title", Title);
    console.log("IdTitle", IdTitle);
    console.log("Depart", Depart);
    console.log("Anunciante", Anunciante);
    console.log("Note", Note);

    const dateNow = new Date();
    let dia = dateNow.getDate();
    let mes = dateNow.getMonth() +1;
    let anio = dateNow.getFullYear();
    let hora = dateNow.getHours();
    let minu = dateNow.getMinutes();

    if (minu <=9){
        dateClose = `${dia}-${mes}-${anio} ${hora}:0${minu}`
    } else {
        dateClose = `${dia}-${mes}-${anio} ${hora}:${minu}`
    }


    //aqui eliminar un anuncio 
    //action : deleteAll, deleteMedia, rejectDenunt
    try {
        
        if (Action === 'deleteAll') {
            //Se elimina todo el objeto completo. 

            if (Depart === 'airplanes'){

                const resultBD = await modelAirplane.findById(IdTitle)
                //console.log("Here this body for delete :", resultBD);
                const imagesToDelete = resultBD.images;
                const videoToDelete = resultBD.video;
                let boxMedia;

                if (videoToDelete.length !=0){
                    boxMedia = [...imagesToDelete, ...videoToDelete];
                    countMedia = boxMedia.length;         
                } else {
                    boxMedia = [...imagesToDelete];
                    countMedia = boxMedia.length;
                }

                console.log("Here all array to the images & video :", boxMedia);

                async function deleteMedias(){

                    for (let i = 0; i < boxMedia.length; i++) {
                        const public_id = boxMedia[i].public_id;
                        
                        console.log("este es el public_id a eliminar : ", public_id);

                        async function deleteMedias(public_id){
        
                            const params = {
                                Bucket : bucketName,
                                Key : public_id
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    //countFall ++;
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    //countSuccess ++;
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }
        
                        deleteMedias(public_id)        
                    }

                    console.log("se ha ejecutado deleteMedias()")
                }

                async function deletingDocInvoiceReport(){
                    //elimina el anuncio 
                    const deletingDoc = await modelAirplane.findByIdAndDelete(IdTitle);
                    
                    //elimina una factura si existe  
                    const resultInvoice = await modelInvoice.find({title_id : IdTitle});
                    //console.log("Esto es resultInvoice", resultInvoice);
                    if (resultInvoice.length !==0){
                        const deleteInvoice = await modelInvoice.deleteOne({title_id : IdTitle});
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action : "deleteAll", dateClose });

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();
                    console.log("se ha ejecutado deletingDocInvoiceReport()")
                }
                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Anuncio Eliminado, Invoice eliminado Si hay, Reporte ha sido actualizado"};
                deleteMedias()
                    .then(()=>{
                        deletingDocInvoiceReport()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch( (e)=> { console.error("Ha ocurrido un error en deletingDocInvoiceReport()",e)} );
                    })
                    .catch( (e)=>{ console.error("Ha ocurrido un error en deleteMedias()",e)} );


            } else if (Depart === 'arts'){

                const resultBD = await modelArtes.findById(IdTitle)
                //console.log("Here this body for delete :", resultBD);
                const imagesToDelete = resultBD.images;
                const videoToDelete = resultBD.video;
                let boxMedia;

                if (videoToDelete.length !=0){
                    boxMedia = [...imagesToDelete, ...videoToDelete];
                    countMedia = boxMedia.length;         
                } else {
                    boxMedia = [...imagesToDelete];
                    countMedia = boxMedia.length;
                }

                console.log("Here all array to the images & video :", boxMedia);

                async function deleteMedias(){

                    for (let i = 0; i < boxMedia.length; i++) {
                        const public_id = boxMedia[i].public_id;
                        
                        console.log("este es el public_id a eliminar : ", public_id);

                        async function deleteMedias(public_id){
        
                            const params = {
                                Bucket : bucketName,
                                Key : public_id
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    //countFall ++;
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    //countSuccess ++;
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }
        
                        deleteMedias(public_id)        
                    }

                    console.log("se ha ejecutado deleteMedias()")
                }

                async function deletingDocInvoiceReport(){
                    //elimina el anuncio 
                    const deletingDoc = await modelArtes.findByIdAndDelete(IdTitle);
                    
                    //elimina una factura si existe  
                    const resultInvoice = await modelInvoice.find({title_id : IdTitle});
                    //console.log("Esto es resultInvoice", resultInvoice);
                    if (resultInvoice.length !==0){
                        const deleteInvoice = await modelInvoice.deleteOne({title_id : IdTitle});
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action : "deleteAll", dateClose });

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();
                    console.log("se ha ejecutado deletingDocInvoiceReport()");
                }
                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Anuncio Eliminado, Invoice eliminado Si hay, Reporte ha sido actualizado"};
                deleteMedias()
                    .then(()=>{
                        deletingDocInvoiceReport()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=> {console.error("Ha ocurrido un error en deletingDocInvoiceReport().", e)})
                    })
                    .catch((e)=> {console.error("Ha ocurrido un error en deleteMedias().", e)})
                    

            } else if (Depart === 'service') {
            
                const resultBD = await modelService.findById(IdTitle)
                console.log("Here this body for delete :", resultBD);
                const imagesToDelete = resultBD.images;
                const videoToDelete = resultBD.video;
                let boxMedia;

                if (videoToDelete.length !=0){
                    boxMedia = [...imagesToDelete, ...videoToDelete];
                    countMedia = boxMedia.length;         
                } else {
                    boxMedia = [...imagesToDelete];
                    countMedia = boxMedia.length;
                }

                console.log("Here all array to the images & video :", boxMedia);

                async function deleteMedias(){

                    for (let i = 0; i < boxMedia.length; i++) {
                        const public_id = boxMedia[i].public_id;
                        
                        console.log("este es el public_id a eliminar : ", public_id);

                        async function deleteMedias(public_id){
        
                            const params = {
                                Bucket : bucketName,
                                Key : public_id
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    //countFall ++;
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    //countSuccess ++;
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }
        
                        deleteMedias(public_id)        
                    }

                    console.log("se ha ejecutado deleteMedias()")
                }

                async function deletingDocInvoiceReport(){
                    //elimina el anuncio 
                    const deletingDoc = await modelService.findByIdAndDelete(IdTitle);
                    
                    //elimina una factura si existe
                    const resultInvoice = await modelInvoice.find({title_id : IdTitle});
                    if (resultInvoice.length !==0){
                        const deleteInvoice = await modelInvoice.deleteOne({title_id : IdTitle});
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action : "deleteAll", dateClose });

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();
                    console.log("se ha ejecutado deletingDocInvoiceReport()")
                 
                }

                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Anuncio Eliminado, Invoice eliminado Si hay, Reporte ha sido actualizado"};
                deleteMedias()
                    .then(()=>{
                        deletingDocInvoiceReport()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=> console.log("Ha ocurrido un error en deletingDocInvoiceReport().", e))
                    })
                    .catch((e)=>{ console.error("Ha ocurrido un error en deleteMedias().", e)})

                
                
            } else if (Depart === 'automotive'){

                const resultBD = await modelAutomotive.findById(IdTitle)
                console.log("Here this body for delete :", resultBD);
                const imagesToDelete = resultBD.images;
                const videoToDelete = resultBD.video;
                let boxMedia;

                if (videoToDelete.length !=0){
                    boxMedia = [...imagesToDelete, ...videoToDelete];
                    countMedia = boxMedia.length;         
                } else {
                    boxMedia = [...imagesToDelete];
                    countMedia = boxMedia.length;
                }

                console.log("Here all array to the images & video :", boxMedia);

                async function deleteMedias(){

                    for (let i = 0; i < boxMedia.length; i++) {
                        const public_id = boxMedia[i].public_id;
                        
                        console.log("este es el public_id a eliminar : ", public_id);

                        async function deleteMedias(public_id){
        
                            const params = {
                                Bucket : bucketName,
                                Key : public_id
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    //countFall ++;
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    //countSuccess ++;
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }
        
                        deleteMedias(public_id)        
                    }

                    console.log("se ha ejecutado deleteMedias()")
                }

                async function deletingDocInvoiceReport(){
                    //elimina el anuncio 
                    const deletingDoc = await modelAutomotive.findByIdAndDelete(IdTitle);
                    
                    //elimina una factura si existe
                    const resultInvoice = await modelInvoice.find({title_id : IdTitle});
                    //console.log("Ver aqui el resultado de la busqueda de la factura");
                    //console.log(resultInvoice);
                    if (resultInvoice.length !==0){
                        const deleteInvoice = await modelInvoice.deleteOne({title_id : IdTitle});
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action : "deleteAll", dateClose });

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();
                    console.log("se ha ejecutado deletingDocInvoiceReport()");
                         
                }

                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Anuncio Eliminado, Invoice eliminado Si hay, Reporte ha sido actualizado"};
                deleteMedias()
                    .then(()=>{
                        deletingDocInvoiceReport()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=>{ console.log("Ha ocurrido un error en deletingDocInvoiceReport().", e)})
                    })
                    .catch((e)=> { console.log("Ha ocurrido un error en deleteMedias().", e)})

            } else if (Depart === 'items'){

                const resultBD = await modelItems.findById(IdTitle)
                console.log("Here this body for delete :", resultBD);
                const imagesToDelete = resultBD.images;
                const videoToDelete = resultBD.video;
                let boxMedia;

                if (videoToDelete.length !=0){
                    boxMedia = [...imagesToDelete, ...videoToDelete];
                    countMedia = boxMedia.length;         
                } else {
                    boxMedia = [...imagesToDelete];
                    countMedia = boxMedia.length;
                }

                console.log("Here all array to the images & video :", boxMedia);

                async function deleteMedias(){

                    for (let i = 0; i < boxMedia.length; i++) {
                        const public_id = boxMedia[i].public_id;
                        
                        console.log("este es el public_id a eliminar : ", public_id);

                        async function deleteMedias(public_id){
        
                            const params = {
                                Bucket : bucketName,
                                Key : public_id
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    //countFall ++;
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    //countSuccess ++;
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }
        
                        deleteMedias(public_id)        
                    }

                    console.log("se ha ejecutado deleteMedias()")
                }

                async function deletingDocInvoiceReport(){
                    //elimina el anuncio 
                    const deletingDoc = await modelItems.findByIdAndDelete(IdTitle);
                    
                    //elimina una factura si existe
                    const resultInvoice = await modelInvoice.find({title_id : IdTitle});
                    if (resultInvoice.length !==0){
                        const deleteInvoice = await modelInvoice.deleteOne({title_id : IdTitle});
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action : "deleteAll", dateClose });

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();
                    console.log("se ha ejecutado deletingDocInvoiceReport()");
                    
                }

                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Anuncio Eliminado, Invoice eliminado Si hay, Reporte ha sido actualizado"};
                deleteMedias()
                    .then(()=>{
                        deletingDocInvoiceReport()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=> {console.error("Ha ocurrido un error en deleteMedias().", e)})
                    })
                    .catch((e)=> {console.error("Ha ocurrido un error en deletingDocInvoiceReport().",e)})            

            } else if (Depart === 'nautical'){

                const resultBD = await modelNautical.findById(IdTitle)
                console.log("Here this body for delete :", resultBD);
                const imagesToDelete = resultBD.images;
                const videoToDelete = resultBD.video;
                let boxMedia;

                if (videoToDelete.length !=0){
                    boxMedia = [...imagesToDelete, ...videoToDelete];
                    countMedia = boxMedia.length;         
                } else {
                    boxMedia = [...imagesToDelete];
                    countMedia = boxMedia.length;
                }

                console.log("Here all array to the images & video :", boxMedia);

                async function deleteMedias(){

                    for (let i = 0; i < boxMedia.length; i++) {
                        const public_id = boxMedia[i].public_id;
                        
                        console.log("este es el public_id a eliminar : ", public_id);

                        async function deleteMedias(public_id){
        
                            const params = {
                                Bucket : bucketName,
                                Key : public_id
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    //countFall ++;
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    //countSuccess ++;
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }
        
                        deleteMedias(public_id)        
                    }

                    console.log("se ha ejecutado deleteMedias()")
                }

                async function deletingDocInvoiceReport(){
                    //elimina el anuncio 
                    const deletingDoc = await modelNautical.findByIdAndDelete(IdTitle);
                    
                    //elimina una factura si existe
                    const resultInvoice = await modelInvoice.find({title_id : IdTitle});
                    if (resultInvoice.length !==0){
                        const deleteInvoice = await modelInvoice.deleteOne({title_id : IdTitle});
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action : "deleteAll", dateClose });

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();
                    console.log("se ha ejecutado deletingDocInvoiceReport()");
                                        
                }

                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Anuncio Eliminado, Invoice eliminado Si hay, Reporte ha sido actualizado"};
                deleteMedias()
                    .then(()=>{
                        deletingDocInvoiceReport()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=>{ console.log("Ha ocurrido un error en deletingDocInvoiceReport().", e)})
                    })
                    .catch((e)=> { console.log("Ha ocurrido un error en deleteMedias().", e)})


            } else if (Depart === 'realstate'){
        

                const resultBD = await modelRealstate.findById(IdTitle)
                console.log("Here this body for delete :", resultBD);
                const imagesToDelete = resultBD.images;
                const videoToDelete = resultBD.video;
                let boxMedia;

                if (videoToDelete.length !=0){
                    boxMedia = [...imagesToDelete, ...videoToDelete];
                    countMedia = boxMedia.length;         
                } else {
                    boxMedia = [...imagesToDelete];
                    countMedia = boxMedia.length;
                }

                console.log("Here all array to the images & video :", boxMedia);

                async function deleteMedias(){

                    for (let i = 0; i < boxMedia.length; i++) {
                        const public_id = boxMedia[i].public_id;
                        
                        console.log("este es el public_id a eliminar : ", public_id);

                        async function deleteMedias(public_id){
        
                            const params = {
                                Bucket : bucketName,
                                Key : public_id
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    //countFall ++;
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    //countSuccess ++;
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }
        
                        deleteMedias(public_id)        
                    }

                    console.log("se ha ejecutado deleteMedias()")
                }

                async function deletingDocInvoiceReport(){
                    //elimina el anuncio 
                    const deletingDoc = await modelRealstate.findByIdAndDelete(IdTitle);
                    
                    //elimina una factura si existe
                    const resultInvoice = await modelInvoice.find({title_id : IdTitle});
                    if (resultInvoice.length !==0){
                        const deleteInvoice = await modelInvoice.deleteOne({title_id : IdTitle});
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action : "deleteAll", dateClose });

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();
                    console.log("se ha ejecutado deletingDocInvoiceReport()");
                   
                }

                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Anuncio Eliminado, Invoice eliminado Si hay, Reporte ha sido actualizado"};
                deleteMedias()
                    .then(()=>{
                        deletingDocInvoiceReport()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=>{ console.log("Ha ocurrido un error en deletingDocInvoiceReport().", e)})
                    })
                    .catch((e)=> { console.log("Ha ocurrido un error en deleteMedias().", e)})       

                    

            } else if (Depart === 'auctions'){


                const resultBD = await modelAuction.findById(IdTitle)
                console.log("Here this body for delete :", resultBD);
                const imagesToDelete = resultBD.images;
                const videoToDelete = resultBD.video;
                let boxMedia;

                if (videoToDelete.length !=0){
                    boxMedia = [...imagesToDelete, ...videoToDelete];
                    countMedia = boxMedia.length;         
                } else {
                    boxMedia = [...imagesToDelete];
                    countMedia = boxMedia.length;
                }

                console.log("Here all array to the images & video :", boxMedia);

                async function deleteMedias(){

                    for (let i = 0; i < boxMedia.length; i++) {
                        const public_id = boxMedia[i].public_id;
                        
                        console.log("este es el public_id a eliminar : ", public_id);

                        async function deleteMedias(public_id){
        
                            const params = {
                                Bucket : bucketName,
                                Key : public_id
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    //countFall ++;
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    //countSuccess ++;
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }
        
                        deleteMedias(public_id)        
                    }

                    console.log("se ha ejecutado deleteMedias()")
                }

                async function deletingDocInvoiceReport(){
                    //elimina el anuncio 
                    const deletingDoc = await modelAuction.findByIdAndDelete(IdTitle);
                    
                    //elimina una factura si existe
                    const resultInvoice = await modelInvoice.find({title_id : IdTitle});
                    if (resultInvoice.length !==0){
                        const deleteInvoice = await modelInvoice.deleteOne({title_id : IdTitle});
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action : "deleteAll", dateClose });

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle, productId : IdTitle } );
                    const saveMessage = await newMessage.save();
                    console.log("se ha ejecutado deletingDocInvoiceReport()");
                }

                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Anuncio Eliminado, Invoice eliminado Si hay, Reporte ha sido actualizado"};
                deleteMedias()
                    .then(()=>{
                        deletingDocInvoiceReport()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=>{ console.log("Ha ocurrido un error en deletingDocInvoiceReport().", e)})
                    })
                    .catch((e)=> { console.log("Ha ocurrido un error en deleteMedias().", e)})  

            }

        } else if (Action === 'deleteMedia'){
            //se eliminan los recursos Medias dispuesto por el admin. 
            
            if (Depart === 'airplanes'){


                async function deleteMediaDocReport(){
                    console.log("******************** BoxMedia *********************");
                    console.log("Ver BoxMedia", BoxMedia);
                    if (BoxMedia.length !==0){
                        for (let i = 0; i < BoxMedia.length; i++) {
                            const Type = BoxMedia[i].type;
                            const publicId = BoxMedia[i].publicId;

                            if (Type === 'video'){
                                
                                console.log("eliminar video del documento", publicId);
                                const resultBD = await modelAirplane.findByIdAndUpdate(IdTitle,{ $pull: {"video":{"public_id": publicId }}} )
                            } else if ( Type === 'image'){
                        
                                console.log("eliminar image del documento", publicId);
                                const resultBD = await modelAirplane.findByIdAndUpdate(IdTitle,{ $pull: {"images":{"public_id": publicId }}} )
                            
                            }

                        }
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action: "deleteMedia", dateClose });
                    console.log("se ha ejecutado deleteMediaDocReport()")

                }    

                async function deleteMediaSpaces(){

                    /* Aqui elimino las fotos de spaces */
                    for (let i = 0; i < BoxMedia.length; i++) {
                        const publicId = BoxMedia[i].publicId;
                        console.log("este es el publicId a eliminar : ", publicId);

                        async function deleteMedias(publicId){
        
                            const params = {
                                Bucket : bucketName,
                                Key : publicId
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }

                        deleteMedias(publicId)
                    }

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();

                }
                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Denuncia processada. ¡Varios recursos de Media han sido eliminados satisfactoriamente!"};

                deleteMediaDocReport()
                    .then(()=>{
                        deleteMediaSpaces()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=> console.error("Ha ocurrido un error en deleteMediaSpaces().", e))
                    })
                    .catch((e)=> console.error("Ha ocurrido un error en deleteMediaDocReport().", e))            

            } else if (Depart === 'arts'){


                async function deleteMediaDocReport(){

                    if (BoxMedia.length !==0){
                        for (let i = 0; i < BoxMedia.length; i++) {
                            const Type = BoxMedia[i].type;
                            const publicId = BoxMedia[i].publicId;

                            if (Type === 'video'){
                                
                                console.log("eliminar video del documento", publicId);
                                const resultBD = await modelArtes.findByIdAndUpdate(IdTitle,{ $pull: {"video":{"public_id": publicId }}} )
                            } else if ( Type === 'image'){
                        
                                console.log("eliminar image del documento", publicId);
                                const resultBD = await modelArtes.findByIdAndUpdate(IdTitle,{ $pull: {"images":{"public_id": publicId }}} )
                            
                            }

                        }
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action: "deleteMedia", dateClose });
                    console.log("se ha ejecutado deleteMediaDocReport()")

                }    

                async function deleteMediaSpaces(){

                    /* Aqui elimino las fotos de spaces */
                    for (let i = 0; i < BoxMedia.length; i++) {
                        const publicId = BoxMedia[i].publicId;
                        console.log("este es el publicId a eliminar : ", publicId);

                        async function deleteMedias(publicId){
        
                            const params = {
                                Bucket : bucketName,
                                Key : publicId
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }

                        deleteMedias(publicId)
                    }

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();

                }
                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Denuncia processada. ¡Varios recursos de Media han sido eliminados satisfactoriamente!"};

                deleteMediaDocReport()
                    .then(()=>{
                        deleteMediaSpaces()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=> console.error("Ha ocurrido un error en deleteMediaSpaces().", e))
                    })
                    .catch((e)=> console.error("Ha ocurrido un error en deleteMediaDocReport().", e)) 
                

            } else if (Depart === 'service'){


                async function deleteMediaDocReport(){

                    if (BoxMedia.length !==0){
                        for (let i = 0; i < BoxMedia.length; i++) {
                            const Type = BoxMedia[i].type;
                            const publicId = BoxMedia[i].publicId;

                            if (Type === 'video'){
                                
                                console.log("eliminar video del documento", publicId);
                                const resultBD = await modelService.findByIdAndUpdate(IdTitle,{ $pull: {"video":{"public_id": publicId }}} )
                            } else if ( Type === 'image'){
                        
                                console.log("eliminar image del documento", publicId);
                                const resultBD = await modelService.findByIdAndUpdate(IdTitle,{ $pull: {"images":{"public_id": publicId }}} )
                            
                            }

                        }
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action: "deleteMedia", dateClose });
                    console.log("se ha ejecutado deleteMediaDocReport()")

                }    

                async function deleteMediaSpaces(){

                    /* Aqui elimino las fotos de spaces */
                    for (let i = 0; i < BoxMedia.length; i++) {
                        const publicId = BoxMedia[i].publicId;
                        console.log("este es el publicId a eliminar : ", publicId);

                        async function deleteMedias(publicId){
        
                            const params = {
                                Bucket : bucketName,
                                Key : publicId
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }

                        deleteMedias(publicId)
                    }

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();

                }
                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Denuncia processada. ¡Varios recursos de Media han sido eliminados satisfactoriamente!"};

                deleteMediaDocReport()
                    .then(()=>{
                        deleteMediaSpaces()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=> console.error("Ha ocurrido un error en deleteMediaSpaces().", e))
                    })
                    .catch((e)=> console.error("Ha ocurrido un error en deleteMediaDocReport().", e))

            } else if (Depart === 'automotive'){


                async function deleteMediaDocReport(){

                    if (BoxMedia.length !==0){
                        for (let i = 0; i < BoxMedia.length; i++) {
                            const Type = BoxMedia[i].type;
                            const publicId = BoxMedia[i].publicId;

                            if (Type === 'video'){
                                
                                console.log("eliminar video del documento", publicId);
                                const resultBD = await modelAutomotive.findByIdAndUpdate(IdTitle,{ $pull: {"video":{"public_id": publicId }}} )
                            } else if ( Type === 'image'){
                        
                                console.log("eliminar image del documento", publicId);
                                const resultBD = await modelAutomotive.findByIdAndUpdate(IdTitle,{ $pull: {"images":{"public_id": publicId }}} )
                            
                            }

                        }
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action: "deleteMedia", dateClose });
                    console.log("se ha ejecutado deleteMediaDocReport()")

                }    

                async function deleteMediaSpaces(){

                    /* Aqui elimino las fotos de spaces */
                    for (let i = 0; i < BoxMedia.length; i++) {
                        const publicId = BoxMedia[i].publicId;
                        console.log("este es el publicId a eliminar : ", publicId);

                        async function deleteMedias(publicId){
        
                            const params = {
                                Bucket : bucketName,
                                Key : publicId
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }

                        deleteMedias(publicId)
                    }

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();

                }
                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Denuncia processada. ¡Varios recursos de Media han sido eliminados satisfactoriamente!"};

                deleteMediaDocReport()
                    .then(()=>{
                        deleteMediaSpaces()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=> console.error("Ha ocurrido un error en deleteMediaSpaces().", e))
                    })
                    .catch((e)=> console.error("Ha ocurrido un error en deleteMediaDocReport().", e))

            } else if (Depart === 'items'){


                async function deleteMediaDocReport(){

                    if (BoxMedia.length !==0){
                        for (let i = 0; i < BoxMedia.length; i++) {
                            const Type = BoxMedia[i].type;
                            const publicId = BoxMedia[i].publicId;

                            if (Type === 'video'){
                                
                                console.log("eliminar video del documento", publicId);
                                const resultBD = await modelItems.findByIdAndUpdate(IdTitle,{ $pull: {"video":{"public_id": publicId }}} )
                            } else if ( Type === 'image'){
                        
                                console.log("eliminar image del documento", publicId);
                                const resultBD = await modelItems.findByIdAndUpdate(IdTitle,{ $pull: {"images":{"public_id": publicId }}} )
                            
                            }

                        }
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action: "deleteMedia", dateClose });
                    console.log("se ha ejecutado deleteMediaDocReport()")

                }    

                async function deleteMediaSpaces(){

                    /* Aqui elimino las fotos de spaces */
                    for (let i = 0; i < BoxMedia.length; i++) {
                        const publicId = BoxMedia[i].publicId;
                        console.log("este es el publicId a eliminar : ", publicId);

                        async function deleteMedias(publicId){
        
                            const params = {
                                Bucket : bucketName,
                                Key : publicId
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }

                        deleteMedias(publicId)
                    }

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();

                }
                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Denuncia processada. ¡Varios recursos de Media han sido eliminados satisfactoriamente!"};

                deleteMediaDocReport()
                    .then(()=>{
                        deleteMediaSpaces()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=> console.error("Ha ocurrido un error en deleteMediaSpaces().", e))
                    })
                    .catch((e)=> console.error("Ha ocurrido un error en deleteMediaDocReport().", e))

            } else if (Depart === 'nautical'){


                async function deleteMediaDocReport(){

                    if (BoxMedia.length !==0){
                        for (let i = 0; i < BoxMedia.length; i++) {
                            const Type = BoxMedia[i].type;
                            const publicId = BoxMedia[i].publicId;

                            if (Type === 'video'){
                                
                                console.log("eliminar video del documento", publicId);
                                const resultBD = await modelNautical.findByIdAndUpdate(IdTitle,{ $pull: {"video":{"public_id": publicId }}} )
                            } else if ( Type === 'image'){
                        
                                console.log("eliminar image del documento", publicId);
                                const resultBD = await modelNautical.findByIdAndUpdate(IdTitle,{ $pull: {"images":{"public_id": publicId }}} )
                            
                            }

                        }
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action: "deleteMedia", dateClose });
                    console.log("se ha ejecutado deleteMediaDocReport()")

                }    

                async function deleteMediaSpaces(){

                    /* Aqui elimino las fotos de spaces */
                    for (let i = 0; i < BoxMedia.length; i++) {
                        const publicId = BoxMedia[i].publicId;
                        console.log("este es el publicId a eliminar : ", publicId);

                        async function deleteMedias(publicId){
        
                            const params = {
                                Bucket : bucketName,
                                Key : publicId
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }

                        deleteMedias(publicId)
                    }

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();

                }
                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Denuncia processada. ¡Varios recursos de Media han sido eliminados satisfactoriamente!"};

                deleteMediaDocReport()
                    .then(()=>{
                        deleteMediaSpaces()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=> console.error("Ha ocurrido un error en deleteMediaSpaces().", e))
                    })
                    .catch((e)=> console.error("Ha ocurrido un error en deleteMediaDocReport().", e))

            } else if (Depart === 'realstate'){


                async function deleteMediaDocReport(){

                    if (BoxMedia.length !==0){
                        for (let i = 0; i < BoxMedia.length; i++) {
                            const Type = BoxMedia[i].type;
                            const publicId = BoxMedia[i].publicId;

                            if (Type === 'video'){
                                
                                console.log("eliminar video del documento", publicId);
                                const resultBD = await modelRealstate.findByIdAndUpdate(IdTitle,{ $pull: {"video":{"public_id": publicId }}} )
                            } else if ( Type === 'image'){
                        
                                console.log("eliminar image del documento", publicId);
                                const resultBD = await modelRealstate.findByIdAndUpdate(IdTitle,{ $pull: {"images":{"public_id": publicId }}} )
                            
                            }

                        }
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action: "deleteMedia", dateClose });
                    console.log("se ha ejecutado deleteMediaDocReport()")

                }    

                async function deleteMediaSpaces(){

                    /* Aqui elimino las fotos de spaces */
                    for (let i = 0; i < BoxMedia.length; i++) {
                        const publicId = BoxMedia[i].publicId;
                        console.log("este es el publicId a eliminar : ", publicId);

                        async function deleteMedias(publicId){
        
                            const params = {
                                Bucket : bucketName,
                                Key : publicId
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }

                        deleteMedias(publicId)
                    }

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();

                }
                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Denuncia processada. ¡Varios recursos de Media han sido eliminados satisfactoriamente!"};

                deleteMediaDocReport()
                    .then(()=>{
                        deleteMediaSpaces()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=> console.error("Ha ocurrido un error en deleteMediaSpaces().", e))
                    })
                    .catch((e)=> console.error("Ha ocurrido un error en deleteMediaDocReport().", e))

            } else if (Depart === 'auctions'){


                async function deleteMediaDocReport(){

                    if (BoxMedia.length !==0){
                        for (let i = 0; i < BoxMedia.length; i++) {
                            const Type = BoxMedia[i].type;
                            const publicId = BoxMedia[i].publicId;

                            if (Type === 'video'){
                                
                                console.log("eliminar video del documento", publicId);
                                const resultBD = await modelAuction.findByIdAndUpdate(IdTitle,{ $pull: {"video":{"public_id": publicId }}} )
                            } else if ( Type === 'image'){
                        
                                console.log("eliminar image del documento", publicId);
                                const resultBD = await modelAuction.findByIdAndUpdate(IdTitle,{ $pull: {"images":{"public_id": publicId }}} )
                            
                            }

                        }
                    }

                    //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                    const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action: "deleteMedia", dateClose });
                    console.log("se ha ejecutado deleteMediaDocReport()")

                }    

                async function deleteMediaSpaces(){

                    /* Aqui elimino las fotos de spaces */
                    for (let i = 0; i < BoxMedia.length; i++) {
                        const publicId = BoxMedia[i].publicId;
                        console.log("este es el publicId a eliminar : ", publicId);

                        async function deleteMedias(publicId){
        
                            const params = {
                                Bucket : bucketName,
                                Key : publicId
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    console.log("Media eliminada con exito --->");
                                }
                            })  
                                
                        }

                        deleteMedias(publicId)
                    }

                    //enviar mensaje al usuario al que se le ha eliminado su anuncio por infringir reglas de uso.
                    const newMessage = new modelMessage( { typeNote: "notes", times: dateClose, username : adminName, question : Note, toCreatedArticleId: IdAnunciante,  ownerStore: Anunciante, depart: Depart, titleArticle: Title, productId : IdTitle } );
                    const saveMessage = await newMessage.save();

                }
                
                //req.session.adminDeletePublication = "Publicación eliminada"
                const messageSucces = { "note" : "Denuncia processada. ¡Varios recursos de Media han sido eliminados satisfactoriamente!"};

                deleteMediaDocReport()
                    .then(()=>{
                        deleteMediaSpaces()
                            .then(()=>{
                                res.json(messageSucces)
                            })
                            .catch((e)=> console.error("Ha ocurrido un error en deleteMediaSpaces().", e))
                    })
                    .catch((e)=> console.error("Ha ocurrido un error en deleteMediaDocReport().", e))           
            }
            

        
        } else if (Action === 'rejectDenunt'){
            //se rechaza le denuncia. 

            async function processReportReject(){
                //actualiza el Report y los demas reportes que tengan el mismo "id_title" : "661422df5e8a27bacc5fb20a"
                const resultReport = await modelReport.updateMany({id_title : IdTitle}, { process : true, action: "rejectDenunt",  dateClose });
                console.log("se ha ejecutado delprocessReportReject()");
            }

            //req.session.adminDeletePublication = "Publicación eliminada"
            const messageSucces = { "note" : "Denuncia rechazada. ¡Este anuncio no presenta ningun problema!"};

            processReportReject()
                .then(()=>{
                    res.json(messageSucces)
                })
                .catch((e)=> console.log("Ha ocurrido un error, intente luego.", e))


        }
        
    } catch (error) {
        console.log("Ha ocurrido un error, intentelo mas tarde", error)   
    }     

});


//operaciones mecanicas de acciones
routes.get('/admin/cronoTask', async(req, res)=>{
    const userAdmin = req.session.userAdmin;

    let currentDay;
    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear();

    currentDay = `${Dia}-${Mes}-${Anio}`;


    const searchCrono = await modelCrono.find( {cronoDate : currentDay} );

    if (userAdmin){
        res.render('admin/cronoTask', {userAdmin, searchCrono} );
    } else {
        res.render('admin/cronoTask', {userAdmin} );
    }    
    
});

routes.get('/admin/cronoTask/croneDeleteADS', async(req, res)=>{

    let currentDay;
    let croneDeleteADS;
    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear();

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneDeleteADS = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;
    //modelAirplane, modelAutomotive, modelRealstate, modelNautical
    //db.users.find({"emailVerify" : false}).pretty();
    // const ahoraUnix = Math.floor(ahora / 1000);

    const ahora =  new Date();
    const haceUnAnio = Math.floor(ahora.setFullYear(ahora.getFullYear()-1) / 1000)

    //console.log("ahora -->", ahora);
    console.log("haceUnAnio -->", haceUnAnio);

    async function deleteAirplane(){

        const searchADS = await modelAirplane.find();

        if (searchADS.length !==0){

            searchADS.forEach(ele => {
                const datePubli = Math.floor(ele.createdAt / 1000);
                const id_Publi = ele._id;

                console.log(`${haceUnAnio} > ${datePubli}`);      
                console.log(`id_Publi -> ${id_Publi}`);

                if (haceUnAnio > datePubli){

                    async function deleteElement(){
                        console.log("Esta publicacion tiene mas de un año, se procede a eliminar")
                        const eledelete = await modelAirplane.findByIdAndDelete(id_Publi);
                    }

                    deleteElement()
                        .then(()=>{
                            console.log("Document Eliminado Satisfactoriamente");
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error deleteElement()", error);
                        })

                }
        
            });
        }

    }

    async function deleteAutomotive(){

        const searchADS = await modelAutomotive.find();

        if (searchADS.length !==0){

            searchADS.forEach(ele => {
                const datePubli = Math.floor(ele.createdAt / 1000);
                const id_Publi = ele._id;

                console.log(`${haceUnAnio} > ${datePubli}`);      
                console.log(`id_Publi -> ${id_Publi}`);

                if (haceUnAnio > datePubli){  

                    async function deleteElement(){
                        console.log("Esta publicacion tiene mas de un año, se procede a eliminar")
                        const eledelete = await modelAutomotive.findByIdAndDelete(id_Publi);
                    }

                    deleteElement()
                        .then(()=>{
                            console.log("Document Eliminado Satisfactoriamente");
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error deleteElement()", error);
                        })
                }
        
            });
        }

    }

    async function deleteRealstate(){

        const searchADS = await modelRealstate.find();

        if (searchADS.length !==0){

            searchADS.forEach(ele => {
                const datePubli = Math.floor(ele.createdAt / 1000);
                const id_Publi = ele._id;

                console.log(`${haceUnAnio} > ${datePubli}`);      
                console.log(`id_Publi -> ${id_Publi}`);   
                
                if (haceUnAnio > datePubli){
                  
                    async function deleteElement(){
                        console.log("Esta publicacion tiene mas de un año, se procede a eliminar")
                        const eledelete = await modelRealstate.findByIdAndDelete(id_Publi);
                    }

                    deleteElement()
                        .then(()=>{
                            console.log("Document Eliminado Satisfactoriamente");
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error deleteElement()", error);
                        })
                }
        
            });
        }

    }
    
    async function deleteNautical(){

        const searchADS = await modelNautical.find();

        if (searchADS.length !==0){

            searchADS.forEach(ele => {
                const datePubli = Math.floor(ele.createdAt / 1000);
                const id_Publi = ele._id;

                console.log(`${haceUnAnio} > ${datePubli}`);      
                console.log(`id_Publi -> ${id_Publi}`);  
                
                if (haceUnAnio > datePubli){
                    
                    async function deleteElement(){
                        console.log("Esta publicacion tiene mas de un año, se procede a eliminar")
                        const eledelete = await modelNautical.findByIdAndDelete(id_Publi);
                    }

                    deleteElement()
                        .then(()=>{
                            console.log("Document Eliminado Satisfactoriamente");
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error deleteElement()", error);
                        })

                }
        
            });
        }

    }

    async function deleteService(){

        const searchADS = await modelService.find();

        if (searchADS.length !==0){

            searchADS.forEach(ele => {
                const datePubli = Math.floor(ele.createdAt / 1000);
                const id_Publi = ele._id;

                console.log(`${haceUnAnio} > ${datePubli}`);      
                console.log(`id_Publi -> ${id_Publi}`);  
                
                if (haceUnAnio > datePubli){
                    
                    async function deleteElement(){
                        console.log("Esta publicacion tiene mas de un año, se procede a eliminar")
                        const eledelete = await modelService.findByIdAndDelete(id_Publi);
                    }

                    deleteElement()
                        .then(()=>{
                            console.log("Document Eliminado Satisfactoriamente");
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error deleteElement()", error);
                        })

                }
        
            });
        }

    }

    async function updateCrono(){

        const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
        
        if ( searchCrono.length !==0 ){
            const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, { $set: {croneDeleteADS } });
        } else {
            const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteADS });
            const cronoSave = await updatecrono.save();
        }

    }

    //al terminar de eliminar todos los documentos que tengan mas de un año 
    //se actualiza la data del crono-task


    deleteAirplane()
        .then(()=>{
            deleteAutomotive()
                .then(()=>{
                    deleteRealstate()
                        .then(()=>{
                            deleteNautical()
                                .then(()=>{
                                    deleteService()
                                        .then(()=>{
                                            updateCrono()
                                                .then(()=>{
                                                    console.log("------ Cron-deleteADS Ejecutado OK ------");
                                                    res.json({type : "Ok", msg: "Crono-DeleteADS Ejecutado"});
                                                })
                                                .catch((error)=>{
                                                    console.log("Ha habido un error updateCrono()", error);
                                                    res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteADS"});
                                                })
                                            
                                        })
                                        .catch((error)=>{
                                            console.log("Ha habido un error deleteService()", error);
                                            res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteADS"});
                                        })
                                    
                                })
                                .catch((error)=>{
                                    console.log("Ha habido un error deleteNautical()", error);
                                    res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteADS"});
                                })
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error deleteRealstate()", error);
                            res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteADS"});
                        })
                })
                .catch((error)=>{
                    console.log("Ha habido un error deleteAutomotive()", error);
                    res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteADS"});
                })
        })
        .catch((error)=>{
            console.log("Ha habido un error deleteAirplane()", error);
            res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteADS"});
        })


});

routes.get('/admin/cronoTask/croneDeleteAdmin', async(req, res)=>{
    let currentDay;
    let croneDeleteAdmin;
    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear(); //20

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneDeleteAdmin = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;
    

    //db.users.find({"emailVerify" : false}).pretty();
    const adminNoVerify = await modelUserAdmin.find({ emailVerify : false });
    console.log("adminNoVerify -->", adminNoVerify); // es un array

    if (adminNoVerify.length !==0){

        adminNoVerify.forEach((ele)=>{
            const ID = ele._id;

            async function deleteAdmin(){
                const delUser = await modelUserAdmin.findByIdAndDelete(ID);
            }
            
            deleteAdmin()
                .then(()=>{
                    console.log("admin No verificado eliminado");
                })
                .catch((error)=>{
                    console.log("Ha habido un error en la eliminacion de un user No verificado", error);
                })

        });

        //luego que borra todos los users no verificados actualiza el crono
        
        async function updateCrono(){

            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            
            if ( searchCrono.length !==0 ){

                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneDeleteAdmin} });
                
            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteAdmin });
                const cronoSave = await updatecrono.save();
            }

        }

        updateCrono()
            .then(()=>{
                console.log("Se ha actualizado la eliminación de administradores no verificados");
                res.json({type : "Ok", msg: "Crono-DeleteAdmins Ejecutado"});
            })
            .catch((error)=>{
                console.log("Ha habido un error en updateCrono()", error);
                res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteAdmins"});
            })

    } else {

        async function updateCrono(){

            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            
            if ( searchCrono.length !==0 ){
                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneDeleteAdmin} });
            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteAdmin });
                const cronoSave = await updatecrono.save();
            }

        }

        updateCrono()
            .then(()=>{
                console.log("Se ha actualizado la eliminación de administradores no verificados");
                res.json({type : "Ok", msg: "Crono-DeleteAdmins Ejecutado"});
            })
            .catch((error)=>{
                console.log("Ha habido un error en updateCrono()", error);
                res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteAdmins"});
            })

    }


});

routes.get('/admin/cronoTask/croneDeleteUsers', async(req, res)=>{

    let currentDay;
    let croneDeleteUsers;
    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear();

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneDeleteUsers = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;

    //db.users.find({"emailVerify" : false}).pretty();
    const usersNoVerify = await modelUser.find({ emailVerify : false });
    console.log("usersNoVerify -->", usersNoVerify); // es un array

    if (usersNoVerify.length !==0){

        usersNoVerify.forEach((ele)=>{
            const ID = ele._id;

            async function deleteUser(){
                const delUser = await modelUser.findByIdAndDelete(ID);
            }
            
            deleteUser()
                .then(()=>{
                    console.log("User No verificado eliminado");
                })
                .catch((error)=>{
                    console.log("Ha habido un error en la eliminacion de un user No verificado", error);
                })

        });

        //luego que borra todos los users no verificados actualiza el crono
        
        async function updateCrono(){

            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            
            if ( searchCrono.length !==0 ){
                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneDeleteUsers} });

            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteUsers });
                const cronoSave = await updatecrono.save();
                
            }

        }

        updateCrono()
            .then(()=>{
                console.log("Se ha actualizado la eliminación de usuarios no verificados")
                res.json({type : "Ok", msg: "Crono-DeleteUsers Ejecutado"});
            })
            .catch((error)=>{
                console.log("Ha habido un error en updateCrono()", error);
                res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteUsers"});
            })

    } else {

        async function updateCrono(){

            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            console.log("searchCrono ->", searchCrono);

            if ( searchCrono.length !==0 ){

                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneDeleteUsers } });

            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteUsers });
                const cronoSave = await updatecrono.save();
            }

        }

        updateCrono()
            .then(()=>{
                console.log("Se ha actualizado la eliminación de usuarios no verificados")
                res.json({type : "Ok", msg: "Crono-DeleteUsers Ejecutado"});
            })
            .catch((error)=>{
                console.log("Ha habido un error en updateCrono()", error)
                res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteUsers"});
            })
    }

});

routes.get('/admin/cronoTask/croneUpdateRate', async(req, res)=>{
    
    const currency = 'VES';

    let currentDay;
    let croneUpdateRate;

    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear();

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneUpdateRate = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;

    ExchangeRate()
        .then(()=>{
            console.log("Hemos recibido la tasa del dia en ExchangeRate()");
            res.json({type : "Ok", msg: "Crono-UpdateRate Ejecutado"});
        })
        .catch((error)=>{
            console.log("Ha habido un error en ExchangeRate()");
            res.json({type : "Error", msg: "Error al Ejecutar Crono-UpdateRate"});
        })

    async function ExchangeRate(){

        fetch('https://v6.exchangerate-api.com/v6/5d6099f94257a7dbcd3ac16e/latest/USD', {

        method: "GET",
        headers: {"content-type" : "application/json"}

        })
            .then(resp => resp.json() )
            .then( jsonExchange => 
                {   
                    //console.log("Esto es jsonExchange",jsonExchange)
                    const rates = jsonExchange.conversion_rates;
                    const currentPrice = rates.VES;
                    //console.log("Esto es rates ----->",rates);
                    console.log("Esto es currentPrice ----->", currentPrice); //36.3789
                    
                    
                    async function updateRate(){

                        //primero vamos a consultar la DB
                        console.log("Debemos tener disponible currentDay para hacer la busqueda ->", currentDay)
                        const resultSearch = await modelRateCurrency.find({ currentDay });
                        console.log( "esto es resultSearch ---->", resultSearch);

                        if ( resultSearch.length == 0 ){ //si no hay resultado es que no esta actualizado y actualizamos con los datos
                            const currencyVES = new modelRateCurrency({ currency, currentDay, currentPrice });
                            const currencyDB = await currencyVES.save();
                        } else {
                            console.log("data ya actualizada, no puede volver a guardarse");
                        }

                    }

                    async function updateCrono(){

                        const searchCrono = await modelCrono.find( {cronoDate : currentDay} );

                        if ( searchCrono.length !==0 ){
                            const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneUpdateRate} });
                        } else {
                            const updatecrono = new modelCrono({ cronoDate: currentDay, croneUpdateRate }); //croneUpdateRate
                            const cronoSave = await updatecrono.save();         
                        }

                    }


                    updateRate()
                        .then(()=>{
                            updateCrono()
                                .then(()=>{
                                    console.log("Se ha actualizado correctamente la tasa del Dolar updateCrono(+)")
                                })
                                .catch((error)=>{
                                    console.log("Ha habido un error en la actualizacion de la tasa del Dolar updateCrono()", error);
                                })
                            
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error en la actualizacion de la tasa del Dolar updateRate()", error);
                        })

                })
            .catch((error)=>{ console.log("Ha habido un error con la funcion ExchangeRate()"), error})    
    }

    
});

routes.get('/admin/cronoTask/croneDeleteUpload', async(req, res)=>{
//croneDeleteUpload
            
    let currentDay;
    let croneDeleteUpload;
    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear();
    
    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneDeleteUpload = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;
    
        async function cleanUpload(){
            const rutaUpload = './src/public/uploads';
    
            fs.readdir(rutaUpload, (err, archivos)=>{
                if (err){
                    console.log("error al leer la carpeta upload", err);
                        return;
                } else {
                    console.log("Archivos en la carpeta upload", archivos);
                    archivos.forEach((archivo)=>{
                        fs.unlinkSync(`${rutaUpload}/${archivo}`);
                        //console.log(`Archivo ${archivo} Eliminado Correctamente`)
                    })
                }
    
            })
        } 
    
        async function updateCrono(){
    
            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            
            if ( searchCrono.length !==0 ){
                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, { $set: {croneDeleteUpload} });
            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteUpload });
                const cronoSave = await updatecrono.save();
            }
    
        }
    
        cleanUpload()
            .then(()=>{
                updateCrono()
                    .then(()=>{
                        console.log("Todos los archivos eliminados correctamente de la carpeta uploads de servidor cleanUpload()");
                        res.json({type : "Ok", msg: "Crono-DeleteUpload Ejecutado"});
                    })
                    .catch((error)=>{
                        console.log("Ha habido un error en updateCrono()", error);
                        res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteUpload"});
                    })
    
            })
            .catch((error)=>{
                console.log("Ha habido un error en cleanUpload()", error);
                res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteUpload"});
            })
    
});

routes.get('/admin/cronoTask/croneUnlockedUsers', async(req, res)=>{

    console.log("---------------------- CRON-O-LETRINA -----------------------")
    console.log("Tarea ejecutada mecanicamente para desbloquear a los usuarios baneados");
    const dateNow = new Date();
    const timeNow = dateNow.getTime(); console.log("timeNow -->", timeNow);

    let currentDay;
    let croneUnlockedUsers;
    const hora = dateNow.getHours(); const minu = dateNow.getMinutes();
    const Dia = dateNow.getDate();
    const Mes = dateNow.getMonth() +1;
    const Anio = dateNow.getFullYear();

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneUnlockedUsers = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;

    const stopped =  await modelStopped.find( { $and : [{status : "locked" }, {ban : { $ne: "undefined" } }]} );
    console.log("bloqueados por revisar");
    console.log("stopped ---->", stopped);
    stopped.forEach((ele)=>{
        console.log("username -->", ele.username);
        const indexed = ele.indexed;
        const ban = parseInt(ele.ban); //number 7, 14, 30
        const dateLocked = ele.createdAt;
        const dateLockedMilisegundos = dateLocked.getTime();
        const diasEnMilisegundos = ban * 24*60*60*1000;
        //console.log("dateLockedMilisegundos", dateLockedMilisegundos);
        //console.log("diasEnMilisegundos", diasEnMilisegundos);
        const dateUnlockedMilisegundos = dateLockedMilisegundos + diasEnMilisegundos;
        //console.log("dateUnlockedMilisegundos --->", dateUnlockedMilisegundos);
        //console.log(`${dateUnlockedMilisegundos} >= ${timeNow}`);
                  
        if (dateUnlockedMilisegundos <= timeNow){
            console.log("procedemos a desbloquear al usuario baneado");
            async function unlockedStopped(){
                const unlockedUser =  await modelStopped.findOneAndUpdate({indexed}, {status : 'unlocked'});    
            }

            async function unlockedUser(){
                const users = await modelUser.findByIdAndUpdate(indexed , {stopped : false});
            }
            

            unlockedStopped()
                .then(()=>{
                    unlockedUser()
                        .then(()=>{
                            console.log("Proceso de desbloqueo realizado OK");       
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error en unlockedUser()", error);
                            res.json({type : "Error", msg: "Error al Ejecutar Crono-UnlockedUsers"});
                        })
                })
                .catch((error)=>{
                    console.log("Ha habido un error en unlockedStooped()", error);
                    res.json({type : "Error", msg: "Error al Ejecutar Crono-UnlockedUsers"});
                })
            
        } 
        
    });

    async function updateCrono(){

        const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
        console.log("searchCrono ->", searchCrono);

        if ( searchCrono.length !==0 ){

            const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneUnlockedUsers} });

        } else {
            const updatecrono = new modelCrono({ cronoDate: currentDay, croneUnlockedUsers });
            const cronoSave = await updatecrono.save();
        }

    }

    updateCrono()
        .then(()=>{
            console.log("updateCrono() OK");
            res.json({type : "Ok", msg: "Crono-UnlockedUsers Ejecutado"});
        })
        .catch((error)=>{
            console.log("Ha habido un error en updateCrono()", error);
            res.json({type : "Error", msg: "Error al Ejecutar Crono-UnlockedUsers"});
        })

});

routes.get('/admin/cronoTask/croneDeleteBuySellCanceled', async(req, res)=>{

    let currentDay;
    let croneDeleteBuySell;
    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear();

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneDeleteBuySell = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;

    const buySellCanceled = await modelBuySell.find({ cancel : true });
    console.log("buySellCanceled -->", buySellCanceled); // es un array

    if (buySellCanceled.length !==0){

        buySellCanceled.forEach((ele)=>{
            const ID = ele._id;

            async function deleteBuySell(){
                const delBuySell = await modelBuySell.findByIdAndDelete(ID);
            }
            
            deleteBuySell()
                .then(()=>{
                    console.log("Se ha eliminado todos los documentos buySell que se hayan cancelado");
                })
                .catch((error)=>{
                    console.log("Ha habido un error en la eliminacion buySell que se hayan cancelado", error);
                })

        });

        //luego que borra todos los buySell cancelados actualiza el crono
        
        async function updateCrono(){

            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            
            if ( searchCrono.length !==0 ){
                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneDeleteBuySell} });
            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteBuySell });
                const cronoSave = await updatecrono.save();
            }

        }

        updateCrono()
            .then(()=>{
                console.log("Se ha eliminado todos los buySell cancelados");
                res.json({type : "Ok", msg: "Crono-DeleteBuySellCanceled Ejecutado"});
            })
            .catch((error)=>{
                console.log("Ha habido un error en deleteBuySellCanceled()", error)
                res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteBuySellCanceled"});
            })

    } else {

        async function updateCrono(){

            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            console.log("searchCrono ->", searchCrono);

            if ( searchCrono.length !==0 ){

                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneDeleteBuySell} });

            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteBuySell });
                const cronoSave = await updatecrono.save();
            }

        }

        updateCrono()
            .then(()=>{
                console.log("Se ha eliminado todos los buySell cancelados");
                res.json({type : "Ok", msg: "Crono-DeleteBuySellCanceled Ejecutado"});
            })
            .catch((error)=>{
                console.log("Ha habido un error en deleteBuySellCanceled()", error)
                res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteBuySellCanceled"});
            })
    }

});

//************ Crone Task **************/
// croneDeleteADS, croneDeleteAdmin, croneDeleteUsers, croneUpdateRate  ---->DATABASE

//croneUpdateRate
cron.schedule('0 3 * * * ', async()=>{

    console.log("---------------------- CRONO UPDATE-RATE -----------------------")
    console.log("Tarea ejecutada a las 03:00")

    const currency = 'VES';

    let currentDay;
    let croneUpdateRate;

    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear();

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneUpdateRate = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;

    ExchangeRate()
        .then(()=>{
            console.log("Hemos recibido la tasa del dia en ExchangeRate()");
        })
        .catch((error)=>{
            console.log("Ha habido un error en ExchangeRate()")
        })

    async function ExchangeRate(){

        fetch('https://v6.exchangerate-api.com/v6/5d6099f94257a7dbcd3ac16e/latest/USD', {

        method: "GET",
        headers: {"content-type" : "application/json"}

        })
            .then(resp => resp.json() )
            .then( jsonExchange => 
                {   
                    //console.log("Esto es jsonExchange",jsonExchange)
                    const rates = jsonExchange.conversion_rates;
                    const currentPrice = rates.VES;
                    //console.log("Esto es rates ----->",rates);
                    console.log("Esto es currentPrice ----->", currentPrice); //36.3789
                    
                    
                    async function updateRate(){

                        //primero vamos a consultar la DB
                        console.log("Debemos tener disponible currentDay para hacer la busqueda ->", currentDay)
                        const resultSearch = await modelRateCurrency.find({ currentDay });
                        console.log( "esto es resultSearch ---->", resultSearch);

                        if ( resultSearch.length == 0 ){ //si no hay resultado es que no esta actualizado y actualizamos con los datos
                            const currencyVES = new modelRateCurrency({ currency, currentDay, currentPrice });
                            const currencyDB = await currencyVES.save();
                        } else {
                            console.log("data ya actualizada, no puede volver a guardarse");
                        }

                    }

                    async function updateCrono(){

                        const searchCrono = await modelCrono.find( {cronoDate : currentDay} );

                        if ( searchCrono.length !==0 ){
                            const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneUpdateRate} });
                        } else {
                            const updatecrono = new modelCrono({ cronoDate: currentDay, croneUpdateRate }); //croneUpdateRate
                            const cronoSave = await updatecrono.save();         
                        }

                    }


                    updateRate()
                        .then(()=>{
                            updateCrono()
                                .then(()=>{
                                    console.log("Se ha actualizado correctamente la tasa del Dolar updateCrono(+)")
                                })
                                .catch((error)=>{
                                    console.log("Ha habido un error en la actualizacion de la tasa del Dolar updateCrono()", error);
                                })
                            
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error en la actualizacion de la tasa del Dolar updateRate()", error);
                        })

                })
            .catch((error)=>{ console.log("Ha habido un error con la funcion ExchangeRate()"), error})    
    }
    
}); 

//croneDeleteUsers
cron.schedule('10 3 * * * ', async()=>{

    console.log("---------------------- CRONO DELETE-USERS -----------------------")
    console.log("Tarea ejecutada a las 03:10")

    let currentDay;
    let croneDeleteUsers;
    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear();

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneDeleteUsers = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;

    //db.users.find({"emailVerify" : false}).pretty();
    const usersNoVerify = await modelUser.find({ emailVerify : false });
    console.log("usersNoVerify -->", usersNoVerify); // es un array

    if (usersNoVerify.length !==0){

        usersNoVerify.forEach((ele)=>{
            const ID = ele._id;

            async function deleteUser(){
                const delUser = await modelUser.findByIdAndDelete(ID);
            }
            
            deleteUser()
                .then(()=>{
                    console.log("User No verificado eliminado");
                })
                .catch((error)=>{
                    console.log("Ha habido un error en la eliminacion de un user No verificado", error);
                })

        });

        //luego que borra todos los users no verificados actualiza el crono
        
        async function updateCrono(){

            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            
            if ( searchCrono.length !==0 ){
                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneDeleteUsers} });

            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteUsers });
                const cronoSave = await updatecrono.save();
                
            }

        }

        updateCrono()
            .then(()=>{
                console.log("Se ha actualizado la eliminación de usuarios no verificados")
            })
            .catch((error)=>{
                console.log("Ha habido un error en updateCrono()", error)
            })

    } else {

        async function updateCrono(){

            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            console.log("searchCrono ->", searchCrono);

            if ( searchCrono.length !==0 ){

                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneDeleteUsers } });

            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteUsers });
                const cronoSave = await updatecrono.save();
            }

        }

        updateCrono()
            .then(()=>{
                console.log("Se ha actualizado la eliminación de usuarios no verificados")
            })
            .catch((error)=>{
                console.log("Ha habido un error en updateCrono()", error)
            })
    }



});

//croneDeleteAdmin    
cron.schedule('20 3 * * * ', async()=>{

    console.log("---------------------- CRONO DELETE-ADMINS -----------------------")
    console.log("Tarea ejecutada a las 03:20");
    
    let currentDay;
    let croneDeleteAdmin;
    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear(); //20

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneDeleteAdmin = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;
    

    //db.users.find({"emailVerify" : false}).pretty();
    const adminNoVerify = await modelUserAdmin.find({ emailVerify : false });
    console.log("adminNoVerify -->", adminNoVerify); // es un array

    if (adminNoVerify.length !==0){

        adminNoVerify.forEach((ele)=>{
            const ID = ele._id;

            async function deleteAdmin(){
                const delUser = await modelUserAdmin.findByIdAndDelete(ID);
            }
            
            deleteAdmin()
                .then(()=>{
                    console.log("admin No verificado eliminado");
                })
                .catch((error)=>{
                    console.log("Ha habido un error en la eliminacion de un user No verificado", error);
                })

        });

        //luego que borra todos los users no verificados actualiza el crono
        
        async function updateCrono(){

            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            
            if ( searchCrono.length !==0 ){

                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneDeleteAdmin} });
                
            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteAdmin });
                const cronoSave = await updatecrono.save();
            }

        }

        updateCrono()
            .then(()=>{
                console.log("Se ha actualizado la eliminación de administradores no verificados")
            })
            .catch((error)=>{
                console.log("Ha habido un error en updateCrono()", error)
            })

    } else {

        async function updateCrono(){

            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            
            if ( searchCrono.length !==0 ){
                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneDeleteAdmin} });
            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteAdmin });
                const cronoSave = await updatecrono.save();
            }

        }

        updateCrono()
            .then(()=>{
                console.log("Se ha actualizado la eliminación de administradores no verificados")
            })
            .catch((error)=>{
                console.log("Ha habido un error en updateCrono()", error)
            })

    }



});

//croneDeleteADS
cron.schedule('30 3 * * * ', async()=>{

    console.log("---------------------- CRONO DELETE-ADS -----------------------")
    console.log("Tarea ejecutada a las 3:30"); 
    
    let currentDay;
    let croneDeleteADS;
    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear();

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneDeleteADS = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;
    //modelAirplane, modelAutomotive, modelRealstate, modelNautical, modelService
    //db.users.find({"emailVerify" : false}).pretty();
    // const ahoraUnix = Math.floor(ahora / 1000);

    const ahora =  new Date();
    const haceUnAnio = Math.floor(ahora.setFullYear(ahora.getFullYear()-1) / 1000)

    //console.log("ahora -->", ahora);
    console.log("haceUnAnio -->", haceUnAnio);

    async function deleteAirplane(){

        const searchADS = await modelAirplane.find();

        if (searchADS.length !==0){

            searchADS.forEach(ele => {
                const datePubli = Math.floor(ele.createdAt / 1000);
                const id_Publi = ele._id;

                console.log(`${haceUnAnio} > ${datePubli}`);      
                console.log(`id_Publi -> ${id_Publi}`);

                if (haceUnAnio > datePubli){

                    async function deleteElement(){
                        console.log("Esta publicacion tiene mas de un año, se procede a eliminar")
                        const eledelete = await modelAirplane.findByIdAndDelete(id_Publi);
                    }

                    deleteElement()
                        .then(()=>{
                            console.log("Document Eliminado Satisfactoriamente");
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error deleteElement()", error);
                        })

                }
        
            });
        }

    }

    async function deleteAutomotive(){

        const searchADS = await modelAutomotive.find();

        if (searchADS.length !==0){

            searchADS.forEach(ele => {
                const datePubli = Math.floor(ele.createdAt / 1000);
                const id_Publi = ele._id;

                console.log(`${haceUnAnio} > ${datePubli}`);      
                console.log(`id_Publi -> ${id_Publi}`);

                if (haceUnAnio > datePubli){  

                    async function deleteElement(){
                        console.log("Esta publicacion tiene mas de un año, se procede a eliminar")
                        const eledelete = await modelAutomotive.findByIdAndDelete(id_Publi);
                    }

                    deleteElement()
                        .then(()=>{
                            console.log("Document Eliminado Satisfactoriamente");
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error deleteElement()", error);
                        })
                }
        
            });
        }

    }

    async function deleteRealstate(){

        const searchADS = await modelRealstate.find();

        if (searchADS.length !==0){

            searchADS.forEach(ele => {
                const datePubli = Math.floor(ele.createdAt / 1000);
                const id_Publi = ele._id;

                console.log(`${haceUnAnio} > ${datePubli}`);      
                console.log(`id_Publi -> ${id_Publi}`);   
                
                if (haceUnAnio > datePubli){
                  
                    async function deleteElement(){
                        console.log("Esta publicacion tiene mas de un año, se procede a eliminar")
                        const eledelete = await modelRealstate.findByIdAndDelete(id_Publi);
                    }

                    deleteElement()
                        .then(()=>{
                            console.log("Document Eliminado Satisfactoriamente");
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error deleteElement()", error);
                        })
                }
        
            });
        }

    }
    
    async function deleteNautical(){

        const searchADS = await modelNautical.find();

        if (searchADS.length !==0){

            searchADS.forEach(ele => {
                const datePubli = Math.floor(ele.createdAt / 1000);
                const id_Publi = ele._id;

                console.log(`${haceUnAnio} > ${datePubli}`);      
                console.log(`id_Publi -> ${id_Publi}`);  
                
                if (haceUnAnio > datePubli){
                    
                    async function deleteElement(){
                        console.log("Esta publicacion tiene mas de un año, se procede a eliminar")
                        const eledelete = await modelNautical.findByIdAndDelete(id_Publi);
                    }

                    deleteElement()
                        .then(()=>{
                            console.log("Document Eliminado Satisfactoriamente");
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error deleteElement()", error);
                        })

                }
        
            });
        }

    }

    async function deleteService(){

        const searchADS = await modelService.find();

        if (searchADS.length !==0){

            searchADS.forEach(ele => {
                const datePubli = Math.floor(ele.createdAt / 1000);
                const id_Publi = ele._id;

                console.log(`${haceUnAnio} > ${datePubli}`);      
                console.log(`id_Publi -> ${id_Publi}`);  
                
                if (haceUnAnio > datePubli){
                    
                    async function deleteElement(){
                        console.log("Esta publicacion tiene mas de un año, se procede a eliminar")
                        const eledelete = await modelService.findByIdAndDelete(id_Publi);
                    }

                    deleteElement()
                        .then(()=>{
                            console.log("Document Eliminado Satisfactoriamente");
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error deleteElement()", error);
                        })

                }
        
            });
        }

    }

    async function updateCrono(){

        const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
        
        if ( searchCrono.length !==0 ){
            const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, { $set: {croneDeleteADS } });
        } else {
            const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteADS });
            const cronoSave = await updatecrono.save();
        }

    }

    //al terminar de eliminar todos los documentos que tengan mas de un año 
    //se actualiza la data del crono-task


    deleteAirplane()
        .then(()=>{
            deleteAutomotive()
                .then(()=>{
                    deleteRealstate()
                        .then(()=>{
                            deleteNautical()
                                .then(()=>{
                                    deleteService()
                                        .then(()=>{
                                            updateCrono()
                                                .then(()=>{
                                                    console.log("------ Cron-deleteADS Ejecutado OK ------");                                                 
                                                })
                                                .catch((error)=>{
                                                    console.log("Ha habido un error updateCrono()", error)
                                                })
                                            
                                        })
                                        .catch((error)=>{
                                            console.log("Ha habido un error deleteService()", error)
                                        })
                                    
                                })
                                .catch((error)=>{
                                    console.log("Ha habido un error deleteNautical()", error);
                                })
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error deleteRealstate()", error)
                        })
                })
                .catch((error)=>{
                    console.log("Ha habido un error deleteAutomotive()", error)
                })
        })
        .catch((error)=>{
            console.log("Ha habido un error deleteAirplane()", error)
        })


});

//croneDeleteUpload
cron.schedule('40 3 * * * ', async()=>{

    console.log("---------------------- CRONO DELETE-UPLOADS -----------------------")
    console.log("Tarea ejecutada a las 3:40"); 
        
    let currentDay;
    let croneDeleteUpload;
    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear();

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneDeleteUpload = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;

    async function cleanUpload(){
        const rutaUpload = './src/public/uploads';

        fs.readdir(rutaUpload, (err, archivos)=>{
            if (err){
                console.log("error al leer la carpeta upload", err);
                    return;
            } else {
                console.log("Archivos en la carpeta upload", archivos);
                archivos.forEach((archivo)=>{
                    fs.unlinkSync(`${rutaUpload}/${archivo}`);
                    //console.log(`Archivo ${archivo} Eliminado Correctamente`)
                })
            }

        })
    } 

    async function updateCrono(){

        const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
        
        if ( searchCrono.length !==0 ){
            const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, { $set: {croneDeleteUpload} });
        } else {
            const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteUpload });
            const cronoSave = await updatecrono.save();
        }

    }

    cleanUpload()
        .then(()=>{
            updateCrono()
                .then(()=>{
                    console.log("Todos los archivos eliminados correctamente de la carpeta uploads de servidor cleanUpload()");
                })
                .catch((error)=>{
                    console.log("Ha habido un error en updateCrono()", error);
                })

        })
        .catch((error)=>{
            console.log("Ha habido un error en cleanUpload()", error);
            res.json({type : "Error", msg: "Error al Ejecutar Crono-DeleteUpload"});
        })

});

//croneDeleteAdmin    
cron.schedule('50 3 * * * ', async()=>{

    console.log("---------------------- CRON-O-LETRINA -----------------------")
    console.log("Tarea ejecutada a las 3:50 AM para desbloquear a los usuarios baneados");
    const dateNow = new Date();
    const timeNow = dateNow.getTime(); console.log("timeNow -->", timeNow);

    let currentDay;
    let croneUnlockedUsers;
    const hora = dateNow.getHours(); const minu = dateNow.getMinutes();
    const Dia = dateNow.getDate();
    const Mes = dateNow.getMonth() +1;
    const Anio = dateNow.getFullYear();

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneUnlockedUsers = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;

    const stopped =  await modelStopped.find( { $and : [{status : "locked" }, {ban : { $ne: "undefined" } }]} );
    console.log("bloqueados por revisar");
    console.log("stopped ---->", stopped);
    stopped.forEach((ele)=>{
        console.log("username -->", ele.username);
        const indexed = ele.indexed;
        const ban = parseInt(ele.ban); //number 7, 14, 30
        const dateLocked = ele.createdAt;
        const dateLockedMilisegundos = dateLocked.getTime();
        const diasEnMilisegundos = ban * 24*60*60*1000;
        //console.log("dateLockedMilisegundos", dateLockedMilisegundos);
        //console.log("diasEnMilisegundos", diasEnMilisegundos);
        const dateUnlockedMilisegundos = dateLockedMilisegundos + diasEnMilisegundos;
        //console.log("dateUnlockedMilisegundos --->", dateUnlockedMilisegundos);
        //console.log(`${dateUnlockedMilisegundos} >= ${timeNow}`);
                  
        if (dateUnlockedMilisegundos <= timeNow){
            console.log("procedemos a desbloquear al usuario baneado");
            async function unlockedStopped(){
                const unlockedUser =  await modelStopped.findOneAndUpdate({indexed}, {status : 'unlocked'});    
            }

            async function unlockedUser(){
                const users = await modelUser.findByIdAndUpdate(indexed , {stopped : false});
            }
            

            unlockedStopped()
                .then(()=>{
                    unlockedUser()
                        .then(()=>{
                            console.log("Proceso de desbloqueo realizado OK");       
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error en unlockedUser()", error);
                            res.json({type : "Error", msg: "Error al Ejecutar Crono-UnlockedUsers"});
                        })
                })
                .catch((error)=>{
                    console.log("Ha habido un error en unlockedStooped()", error);
                    res.json({type : "Error", msg: "Error al Ejecutar Crono-UnlockedUsers"});
                })
            
        } 
        
    });

    async function updateCrono(){

        const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
        console.log("searchCrono ->", searchCrono);

        if ( searchCrono.length !==0 ){

            const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneUnlockedUsers} });

        } else {
            const updatecrono = new modelCrono({ cronoDate: currentDay, croneUnlockedUsers });
            const cronoSave = await updatecrono.save();
        }

    }

    updateCrono()
        .then(()=>{
            console.log("updateCrono() OK");
            res.json({type : "Ok", msg: "Crono-UnlockedUsers Ejecutado"});
        })
        .catch((error)=>{
            console.log("Ha habido un error en updateCrono()", error);
            res.json({type : "Error", msg: "Error al Ejecutar Crono-UnlockedUsers"});
        })

});

//croneDeleteBuySellCanceled
cron.schedule('0 4 * * * ', async()=>{

    console.log("---------------------- CRONO DeleteBuySell-Canceled -----------------------")
    console.log("Tarea ejecutada a las 4:00")

    let currentDay;
    let croneDeleteBuySell;
    const time = new Date();
    const hora = time.getHours(); const minu = time.getMinutes();
    const Dia = time.getDate();
    const Mes = time.getMonth() +1;
    const Anio = time.getFullYear();

    currentDay = `${Dia}-${Mes}-${Anio}`;
    croneDeleteBuySell = `${Dia}-${Mes}-${Anio} ${hora}:${minu}`;

    const buySellCanceled = await modelBuySell.find({ cancel : true });
    console.log("buySellCanceled -->", buySellCanceled); // es un array

    if (buySellCanceled.length !==0){

        buySellCanceled.forEach((ele)=>{
            const ID = ele._id;

            async function deleteBuySell(){
                const delBuySell = await modelBuySell.findByIdAndDelete(ID);
            }
            
            deleteBuySell()
                .then(()=>{
                    console.log("Se ha eliminado todos los documentos buySell que se hayan cancelado");
                })
                .catch((error)=>{
                    console.log("Ha habido un error en la eliminacion buySell que se hayan cancelado", error);
                })

        });

        //luego que borra todos los buySell cancelados actualiza el crono
        
        async function updateCrono(){

            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            
            if ( searchCrono.length !==0 ){
                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneDeleteBuySell} });

            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteBuySell });
                const cronoSave = await updatecrono.save();
                
            }

        }

        updateCrono()
            .then(()=>{
                console.log("Se ha actualizado la eliminación de usuarios no verificados")
            })
            .catch((error)=>{
                console.log("Ha habido un error en updateCrono()", error)
            })

    } else {

        async function updateCrono(){

            const searchCrono = await modelCrono.find( {cronoDate : currentDay} );
            console.log("searchCrono ->", searchCrono);

            if ( searchCrono.length !==0 ){

                const updatecrono = await modelCrono.findOneAndUpdate({cronoDate : currentDay}, {  $set: {croneDeleteBuySell} });

            } else {
                const updatecrono = new modelCrono({ cronoDate: currentDay, croneDeleteBuySell });
                const cronoSave = await updatecrono.save();
            }

        }

        updateCrono()
            .then(()=>{
                console.log("Se ha actualizado la eliminación de buySell cancelados")
            })
            .catch((error)=>{
                console.log("Ha habido un error en croneDeleteBuySell()", error)
            })
    }



});


//**************************************/


routes.get('/logout', (req, res) => {
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          res.status(400).send('Unable to log out')
        } else {
          res.redirect('/admin')
        }
      });
    } else {
      res.redirect('/admin')
    }
  });

module.exports = routes;