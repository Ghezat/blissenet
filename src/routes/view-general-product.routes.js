const { Router } = require('express');
const routes = Router()
const mongoose = require('mongoose');

const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelAirplane = require('../models/airplane.js');
const modelArtes = require('../models/artes.js');
const modelItems = require('../models/items.js');
const modelAutomotive = require('../models/automotive.js');
const modelRealstate = require('../models/realstate.js');
const modelNautical = require('../models/nautical.js');
const modelService = require('../models/services.js');
const modelAuction = require('../models/auction.js');
const modelRaffle = require('../models/raffle.js');
const modelRaffleHistory = require('../models/raffleHistory.js');
const modelTickets = require('../models/tickets.js');
const modelInvoice = require('../models/invoice.js');

const modelMessages = require('../models/messages.js');

const nodemailer = require('nodemailer');
      
//este Token es la KEY del bot de Telegram
const Token =  process.env.Token_Bot;

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


//const cloudinary = require('cloudinary').v2;//esto no tendrá cambio
/*
cloudinary.config({
    cloud_name : process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret : process.env.API_SECRET,
    secure: true
}) */

routes.get('/product/:depart/:id/:title', async(req, res)=>{
    const user = req.session.user;
    console.log("Esto es user : ", user)
                                   
    const reportDone = req.session.reportDone;
    const reportSuccess = req.session.reportSuccess;
    const errorReport = req.session.errorReport;
    
 
    delete req.session.reportDone;
    delete req.session.reportSuccess;
    delete req.session.errorReport;

    const depart = req.params.depart;
    req.session.depart = depart;
    const productId = req.params.id;
    req.session.productId = productId; 
    const countMessages = req.session.countMessages; //contador de mensajes
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //contador de alertas de negociación.
    let searchProfile;
           
        
    if (user){
        //console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        //console.log("Aqui el profile de la cuenta del visitante -->", searchProfile);
    }

    //console.log('este es el departamento ----->', depart)
    //console.log('este es el id del producto en cuestion ----->', productId)

    if (depart == 'arts'){
        const depart = 'arts';
        //console.log('este producto es del departamento artes asi que buscamos en la coleccion arte')
        const search = await modelArtes.findById(productId);

        if (search){

            const usernameSell = search.username;
            console.log("Este es el username del vendedor ---->", usernameSell);

            const indexed = search.user_id //esto es el indexed para buscar en el profile.
            const store = await modelProfile.findOne({indexed : indexed});
            console.log("Esto es store   ->", store);

            const viewCount = search.view //aqui obtengo la cantidad actual de vistas.
            console.log('esta es la cantidad de vistas actuales', viewCount);

            if (user){

                if (usernameSell !== user.username) {

                    const viewSum = viewCount + 1;
                    const updateView =  await modelArtes.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
                    //console.log("este es el producto encontrado y que será mostrado en el view-general-product ----->", search);
    
                }
            } else {

                const viewSum = viewCount + 1;
                const updateView =  await modelArtes.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista

            }
           
                                      
            const viewMessage = await modelMessages.find({productId : productId}).sort({createdAt : -1})
            console.log("aqui los mensajes de este articulo: ", viewMessage);//aqui un array con todos las preguntas que se han hecho a este articulo determinado.
            
            res.render('page/view-general-products', {user, usernameSell, store, productId, search, depart, viewMessage, countMessages, countNegotiationsBuySell, searchProfile, reportDone, reportSuccess, errorReport });
        
        } else {
        
            res.render('page/unknown-allDeparts', {user, searchProfile, countMessages, countNegotiationsBuySell});
        
        }

        
    } else if ( depart == 'airplanes'){
        const depart = 'airplanes';
        //console.log('este producto es del departamento aeroplanos asi que buscamos en la coleccion aeroplanos')
        const search = await modelAirplane.findById(productId);

        if (search){

            const usernameSell = search.username;
            console.log("Este es el username del vendedor ---->", usernameSell);

            const indexed = search.user_id //esto es el indexed para buscar en el profile.
            const store = await modelProfile.findOne({indexed : indexed});
            console.log("Esto es store   ->", store);

            const viewCount = search.view //aqui obtengo la cantidad actual de vistas.
            console.log('esta es la cantidad de vistas actuales', viewCount);

            if (user){
                if (usernameSell !== user.username){
                    const viewSum = viewCount + 1;
                    const updateView =  await modelAirplane.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
                    //console.log("este es el producto encontrado y que será mostrado en el view-general-product ----->", search);
                }    

            } else {
                const viewSum = viewCount + 1;
                const updateView =  await modelArtes.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
            }
 
    
            const viewMessage = await modelMessages.find({productId : productId}).sort({createdAt : -1})
            console.log("aqui los mensajes de este articulo: ", viewMessage);//aqui un array con todos las preguntas que se han hecho a este articulo determinado.
    
            res.render('page/view-general-products', {user, usernameSell, store, productId, search, depart, viewMessage, countMessages, countNegotiationsBuySell, searchProfile, reportDone, reportSuccess, errorReport});
        } else {
            res.render('page/unknown-allDeparts', {user, searchProfile, countMessages, countNegotiationsBuySell});
        }


    } else if ( depart == 'items'){
        const depart = 'items';
        //console.log('este producto es del departamento aeroplanos asi que buscamos en la coleccion aeroplanos')
        const search = await modelItems.findById(productId);

        if (search){

            const usernameSell = search.username;
            console.log("Este es el username del vendedor ---->", usernameSell);

            const indexed = search.user_id //esto es el indexed para buscar en el profile.
            const store = await modelProfile.findOne({indexed : indexed});
            console.log("Esto es store   ->", store);

            const viewCount = search.view //aqui obtengo la cantidad actual de vistas.
            console.log('esta es la cantidad de vistas actuales', viewCount);

            if (user){
                if (usernameSell !== user.username){
                    const viewSum = viewCount + 1;
                    const updateView =  await modelItems.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
                    //console.log("este es el producto encontrado y que será mostrado en el view-general-product ----->", search);
                }
            } else {
            
                const viewSum = viewCount + 1;
                const updateView =  await modelArtes.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
            }         
    
            const viewMessage = await modelMessages.find({productId : productId}).sort({createdAt : -1})
            console.log("aqui los mensajes de este articulo: ", viewMessage);//aqui un array con todos las preguntas que se han hecho a este articulo determinado.
    
            res.render('page/view-general-products', {user, usernameSell, store, productId, search, depart, viewMessage, countMessages, countNegotiationsBuySell, searchProfile, reportDone, reportSuccess, errorReport});  
        } else {
            res.render('page/unknown-allDeparts', {user, searchProfile, countMessages, countNegotiationsBuySell});
        }
  

    } else if ( depart == 'automotive'){
        const depart = 'automotive';
        //console.log('este producto es del departamento automotive asi que buscamos en la coleccion automotive')
        const search = await modelAutomotive.findById(productId);
        console.log("::::::::::::::ATENCION:::::::::::::::");
        //console.log("search : ", search);
        console.log("RDD ------------------->");
        console.log("reportDone : ", reportDone);
        
        if (search){

            const usernameSell = search.username;
            console.log("Este es el username del vendedor ---->", usernameSell);

            const indexed = search.user_id //esto es el indexed para buscar en el profile.
            const store = await modelProfile.findOne({indexed : indexed});
            console.log("Esto es store   ->", store);

            const viewCount = search.view //aqui obtengo la cantidad actual de vistas.
            console.log('esta es la cantidad de vistas actuales', viewCount);

            if (user){
                if (usernameSell !== user.username){
                    const viewSum = viewCount + 1;
                    const updateView =  await modelAutomotive.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
                    //console.log("este es el producto encontrado y que será mostrado en el view-general-product ----->", search);
                }
            } else {
                const viewSum = viewCount + 1;
                const updateView =  await modelArtes.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
            } 
     
        
            const viewMessage = await modelMessages.find({productId : productId}).sort({createdAt : -1})
            //console.log("aqui los mensajes de este articulo: ", viewMessage);//aqui un array con todos las preguntas que se han hecho a este articulo determinado.
            console.log("reportDone :", reportDone);
            res.render('page/view-general-products', {user, usernameSell, store, productId, search, depart, viewMessage, countMessages, countNegotiationsBuySell, searchProfile, reportDone, reportSuccess, errorReport});       

        } else {
            //esta pagina se mostrara si el producto no existe pero debemos precisar que no existe por haber sido eliminado.
            //si el id del producto es un caracter que no cumple con id ocurrira un error.
            res.render('page/unknown-allDeparts', {user, searchProfile, countMessages, countNegotiationsBuySell});
        }
    
    } else if ( depart == 'realstate'){
        const depart = 'realstate';
        //console.log('este producto es del departamento aeroplanos asi que buscamos en la coleccion aeroplanos')
        const search = await modelRealstate.findById(productId);

        if (search){

            const usernameSell = search.username;
            console.log("Este es el username del vendedor ---->", usernameSell);

            const indexed = search.user_id //esto es el indexed para buscar en el profile.
            const store = await modelProfile.findOne({indexed : indexed});
            console.log("Esto es store   ->", store);

            const viewCount = search.view //aqui obtengo la cantidad actual de vistas.
            console.log('esta es la cantidad de vistas actuales', viewCount);

            if (user){
                if (usernameSell !== user.username){
                    const viewSum = viewCount + 1;
                    const updateView =  await modelRealstate.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
                    //console.log("este es el producto encontrado y que será mostrado en el view-general-product ----->", search);
                } 
            } else {
                const viewSum = viewCount + 1;
                const updateView =  await modelArtes.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
            }
            
            
            const viewMessage = await modelMessages.find({productId : productId}).sort({createdAt : -1})
            console.log("aqui los mensajes de este articulo: ", viewMessage);//aqui un array con todos las preguntas que se han hecho a este articulo determinado.
        
            res.render('page/view-general-products', {user, usernameSell, store, productId, search, depart, viewMessage, countMessages, countNegotiationsBuySell, searchProfile, reportDone, reportSuccess, errorReport});      

        } else {
            res.render('page/unknown-allDeparts', {user, searchProfile, countMessages, countNegotiationsBuySell});
        }
        
    } else if ( depart == 'nautical'){
        const depart = 'nautical';
        //console.log('este producto es del departamento aeroplanos asi que buscamos en la coleccion aeroplanos')
        const search = await modelNautical.findById(productId);

        if (search){

            const usernameSell = search.username;
            console.log("Este es el username del vendedor ---->", usernameSell);

            const indexed = search.user_id //esto es el indexed para buscar en el profile.
            const store = await modelProfile.findOne({indexed : indexed});
            console.log("Esto es store   ->", store);
            
            const viewCount = search.view //aqui obtengo la cantidad actual de vistas.
            console.log('esta es la cantidad de vistas actuales', viewCount);
            
            if (user){
                if (usernameSell !== user.username){
                    const viewSum = viewCount + 1;
                    const updateView =  await modelNautical.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
                    //console.log("este es el producto encontrado y que será mostrado en el view-general-product ----->", search);   
                }
            } else {
                const viewSum = viewCount + 1;
                const updateView =  await modelArtes.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
            }
                
            const viewMessage = await modelMessages.find({productId : productId}).sort({createdAt : -1})
            console.log("aqui los mensajes de este articulo: ", viewMessage);//aqui un array con todos las preguntas que se han hecho a este articulo determinado.
            
            res.render('page/view-general-products', {user, usernameSell, store, productId, search, depart, viewMessage, countMessages, countNegotiationsBuySell, searchProfile, reportDone, reportSuccess, errorReport});          
            
        } else {
            res.render('page/unknown-allDeparts', {user, searchProfile, countMessages, countNegotiationsBuySell});
        }
       
    } else if ( depart == 'service'){
        const depart = 'service';
        //console.log('este producto es del departamento service asi que buscamos en la coleccion service')
        const search = await modelService.findById(productId);

        if (search){

            const usernameSell = search.username;
            console.log("Este es el username del vendedor ---->", usernameSell);

            const indexed = search.user_id //esto es el indexed para buscar en el profile.
            const store = await modelProfile.findOne({indexed : indexed});
            console.log("Esto es store   ->", store);

            const viewCount = search.view //aqui obtengo la cantidad actual de vistas.
            console.log('esta es la cantidad de vistas actuales', viewCount);

            if (user){
                if (usernameSell !== user.username){
                    const viewSum = viewCount + 1;
                    const updateView =  await modelService.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
                    //console.log("este es el producto encontrado y que será mostrado en el view-general-product ----->", search);
                }
            } else {
                const viewSum = viewCount + 1;
                const updateView =  await modelArtes.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
            }
            
            const viewMessage = await modelMessages.find({productId : productId}).sort({createdAt : -1})
            console.log("aqui los mensajes de este articulo: ", viewMessage);//aqui un array con todos las preguntas que se han hecho a este articulo determinado.

            res.render('page/view-general-products', {user, usernameSell, store, productId, search, depart, viewMessage, countMessages, countNegotiationsBuySell, searchProfile, reportDone, reportSuccess, errorReport});
        } else {
            res.render('page/unknown-allDeparts', {user, searchProfile, countMessages, countNegotiationsBuySell});
        }
        
    } else if ( depart == 'raffle'){
        const depart = 'raffle';
        //console.log('este producto es del departamento service asi que buscamos en la coleccion service')
        const search = await modelRaffle.findById(productId);

        if (search){
        
            const usernameSell = search.username;
            //console.log("Este es el username del vendedor ---->", usernameSell);

            const indexed = search.user_id //esto es el indexed para buscar en el profile.
            const store = await modelProfile.findOne({indexed : indexed});
            console.log("Esto es store   ->", store);
        
            const viewCount = search.view //aqui obtengo la cantidad actual de vistas.
            //console.log('esta es la cantidad de vistas actuales', viewCount);
        
            if (user){
                if (usernameSell !== user.username){
                    const viewSum = viewCount + 1;
                    const updateView =  await modelRaffle.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
                    //console.log("este es el producto encontrado y que será mostrado en el view-general-product ----->", search);
                }
            } else {
                const viewSum = viewCount + 1;
                const updateView =  await modelRaffle.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
            }
                    
            const viewMessage = await modelMessages.find({productId : productId}).sort({createdAt : -1})
            console.log("aqui los mensajes de este articulo: ", viewMessage);//aqui un array con todos las preguntas que se han hecho a este articulo determinado.
        
            res.render('page/view-general-products', {user, usernameSell, store, productId, search, depart, viewMessage, countMessages, countNegotiationsBuySell, searchProfile, reportDone, reportSuccess, errorReport});
        } else {
            res.render('page/unknown-allDeparts', {user, searchProfile, countMessages, countNegotiationsBuySell});
        }     
    } else if ( depart == 'auctions'){
        const depart = 'auctions';
        //capturo los req.session creados para emitir mensajes en el view-general-product en el depart = "auctions";
        //console.log('este producto es del departamento service asi que buscamos en la coleccion service')
        const search = await modelAuction.findById(productId);

        if (search) {

            const usernameSell = search.username;
            console.log("Este es el username del vendedor ---->", usernameSell);

            const indexed = search.user_id //esto es el indexed para buscar en el profile.
            const store = await modelProfile.findOne({indexed : indexed});
            console.log("Esto es store   ->", store);
            
            const viewCount = search.view //aqui obtengo la cantidad actual de vistas.
            //console.log('esta es la cantidad de vistas actuales', viewCount);

            if (user){
                if (usernameSell !== user.username){
                    const viewSum = viewCount + 1;
                    const updateView =  await modelAuction.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
                    //console.log("este es el producto encontrado y que será mostrado en el view-general-product ----->", search);
                }
            } else {
                const viewSum = viewCount + 1;
                const updateView =  await modelArtes.findByIdAndUpdate(productId, {view : viewSum}); //aqui actualizo la vista
            }
            
            const viewMessage = await modelMessages.find({productId : productId}).sort({createdAt : -1})
            //console.log("aqui los mensajes de este articulo: ", viewMessage);//aqui un array con todos las preguntas que se han hecho a este articulo determinado.

            //console.log(":::::: Esto es search ::::::" , search);
            res.render('page/view-general-products', {user, usernameSell, store, productId, search, depart, viewMessage, countMessages, countNegotiationsBuySell, searchProfile, reportDone, reportSuccess, errorReport});
        } else {            
            res.render('page/unknown-auction', {user, searchProfile, countMessages, countNegotiationsBuySell});
        }
        

    }


});

//esta ruta funciona como un observador periodico que verifica si aun existe la subasta
//en caso contrario renderizar la pagina unknown-auction 
routes.post('/product/auctions/exist', async (req, res)=>{

    try {
        console.log(req.body);
        const {id} = req.body;
        //console.log("Estamos llegando a /product/auctions/exist");
        const search = await modelAuction.findById(id);
        //console.log("Esto es search >>>>", search);
    
        if (!search){
            //cuando la subasta sea eliminada envia esto al fronted 
            res.json({ response : "delete"});
        } else {
            res.json({ response : "exist"});
        } 
        
        
    } catch (error){
        console.log("Ha habido un error", error)
    }


});

//esta direccion solo envia un json para capturar la informacion necesaria
//para poder enviar preguntas con la informacion requerida.
routes.get('/extraer', async(req, res)=>{
    
    const user = req.session.user;
    const depart = req.session.depart;
    const productId = req.session.productId;

res.json({user, depart, productId})
});

//aqui envio los datos de las preguntas para ser guardado y procesado.
routes.post('/message', async(req, res)=>{
    console.log("aqui la data ---->", req.body);
    const data = req.body;
    const dataI = data.dataI;
    //console.log("data -->",data)
    //console.log("dataI -->",dataI)
    const userId = dataI.user._id 
    const username = dataI.user.username
    const question = data.questionsI;
    const depart = dataI.depart;
    const productId = dataI.productId;

    const date = new Date();
    let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
    let hora = date.getHours(); let minu = date.getMinutes();

    let mesFormatted = String(mes).padStart(2, '0');
    let minuFormatted = String(minu).padStart(2, '0');
    const times = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

    async function blissBotNoti(titleArticle, urlImageArticle, chatId){
        const Message = `Notificación de Blissenet.com: Message\n\n¡Hola! Tienes una pregunta pendiente sobre tu artículo "${titleArticle}". Tu pronta respuesta es clave para iniciar una exitosa venta. ¡No dejes pasar la oportunidad!`;
        console.log("titleArticle --->", titleArticle);
        console.log("urlImageArticle --->", urlImageArticle);
        console.log("chatId --->", chatId);

        axios.post(`https://api.telegram.org/bot${Token}/sendPhoto`, {
            chat_id: chatId,
            photo: urlImageArticle,
            caption: Message
        })
        .then(response => {
            console.log('--------------------------- BlissBot----------------------------');
            console.log('Mensaje enviado con éxito:', response.data);
        })
        .catch(error => {
            console.log('--------------------------- BlissBot----------------------------');
            console.error('Error al enviar el mensaje:', error);
        });

    }

    //esta funcion logra crear el titleURL campo anexado para implementacion del SEO 
    function transformarTitle(titleArticle) {
        return titleArticle
            .normalize("NFD") // Elimina acentos
            .replace(/[\u0300-\u036f]/g, "") // Elimina caracteres de acento
            .toLowerCase() // Convierte a minúsculas
            .replace(/\s+/g, '-') // Reemplaza espacios por guiones
            .replace(/[^\w\-]+/g, '') // Elimina caracteres no alfanuméricos excepto guiones
            .replace(/\-\-+/g, '-') // Reemplaza múltiples guiones por uno solo
            .trim(); // Elimina guiones al inicio y al final
    }

    //console.log(times)
    if (depart == 'raffle'){
        const search = await modelRaffle.findById(productId);
        const createdArticle = search.user_id; //aqui esta el id del user
        const ownerStore = search.username;
        const titleArticle = search.title;
        const urlImageArticle = search.images[0].url
        
        const titleURL = transformarTitle(titleArticle);

        const newMessage = new modelMessages ({times, titleArticle, titleURL, urlImageArticle, userId, username, question, depart, productId, toCreatedArticleId : createdArticle, ownerStore  });
        //console.log(newMessage);
        const saveMessage = await newMessage.save();
        console.log("Este es el mensage guardado --->", saveMessage);

        //descubrimos el chatId del user de la Tienda si posee
        const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(createdArticle));
        const chatId = searchUserStore.blissBot.chatId; //si la tienda posee chatId esta sincronizada.
        console.log("chatId ---->", chatId);

        if (chatId){
            blissBotNoti(titleArticle, urlImageArticle, chatId)
        }
        
        res.json(saveMessage);
    }

    if (depart == 'arts'){
        const search = await modelArtes.findById(productId);
        const createdArticle = search.user_id;
        const ownerStore = search.username;
        const titleArticle = search.title;
        const urlImageArticle = search.images[0].url 

        console.log("createdArticle :", createdArticle );
        console.log("type de dato de createdArticle :", typeof createdArticle );
        
        const titleURL = transformarTitle(titleArticle);

        const newMessage = new modelMessages ({times, titleArticle, titleURL,  urlImageArticle, userId, username, question, depart, productId, toCreatedArticleId : createdArticle, ownerStore  });
        //console.log(newMessage);
        const saveMessage = await newMessage.save();
        console.log("Este es el mensage guardado --->", saveMessage);

        //descubrimos el chatId del user de la Tienda si posee
        const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(createdArticle));
        const chatId = searchUserStore.blissBot.chatId; //si la tienda posee chatId esta sincronizada.
        console.log("chatId ---->", chatId);

        if (chatId){
            blissBotNoti(titleArticle, urlImageArticle, chatId)
        }

        res.json(saveMessage);
    }

    if (depart == 'airplanes'){
        const search = await modelAirplane.findById(productId);
        const createdArticle = search.user_id;
        const ownerStore = search.username;
        const titleArticle = search.title;
        const urlImageArticle = search.images[0].url  
        
        const titleURL = transformarTitle(titleArticle); 

        const newMessage = new modelMessages ({times, titleArticle, titleURL, urlImageArticle, userId, username, question, depart, productId, toCreatedArticleId : createdArticle, ownerStore  });
        //console.log(newMessage);
        const saveMessage = await newMessage.save();
        console.log("Este es el mensage guardado --->", saveMessage);

        //descubrimos el chatId del user de la Tienda si posee
        const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(createdArticle));
        const chatId = searchUserStore.blissBot.chatId; //si la tienda posee chatId esta sincronizada.
        console.log("chatId ---->", chatId);

        if (chatId){
            blissBotNoti(titleArticle, urlImageArticle, chatId)
        }

        res.json(saveMessage);
    }

    if (depart == 'items'){
        const search = await modelItems.findById(productId);
        const createdArticle = search.user_id;
        const ownerStore = search.username;
        const titleArticle = search.title;
        const urlImageArticle = search.images[0].url  
        
        const titleURL = transformarTitle(titleArticle); 

        const newMessage = new modelMessages ({times, titleArticle, titleURL, urlImageArticle, userId, username, question, depart, productId, toCreatedArticleId : createdArticle, ownerStore  });
        //console.log(newMessage);
        const saveMessage = await newMessage.save();
        console.log("Este es el mensage guardado --->", saveMessage);

        //descubrimos el chatId del user de la Tienda si posee
        const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(createdArticle));
        const chatId = searchUserStore.blissBot.chatId; //si la tienda posee chatId esta sincronizada.
        console.log("chatId ---->", chatId);

        if (chatId){
            blissBotNoti(titleArticle, urlImageArticle, chatId)
        }

        res.json(saveMessage);
    }

    if (depart == 'automotive'){
        const search = await modelAutomotive.findById(productId);
        const createdArticle = search.user_id;
        const ownerStore = search.username;
        const titleArticle = search.title;
        const urlImageArticle = search.images[0].url  

        const titleURL = transformarTitle(titleArticle); 

        const newMessage = new modelMessages ({times, titleArticle, titleURL, urlImageArticle, userId, username, question, depart, productId, toCreatedArticleId : createdArticle, ownerStore  });
        //console.log(newMessage);
        const saveMessage = await newMessage.save();
        console.log("Este es el mensage guardado --->", saveMessage);

        //descubrimos el chatId del user de la Tienda si posee
        const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(createdArticle));
        const chatId = searchUserStore.blissBot.chatId; //si la tienda posee chatId esta sincronizada.
        console.log("chatId ---->", chatId);

        if (chatId){
            blissBotNoti(titleArticle, urlImageArticle, chatId)
        }

        res.json(saveMessage);

    }

    if (depart == 'realstate'){
        const search = await modelRealstate.findById(productId);
        const createdArticle = search.user_id;
        const ownerStore = search.username;
        const titleArticle = search.title;
        const urlImageArticle = search.images[0].url  

        const titleURL = transformarTitle(titleArticle); 

        const newMessage = new modelMessages ({times, titleArticle, titleURL, urlImageArticle, userId, username, question, depart, productId, toCreatedArticleId : createdArticle, ownerStore  });
        //console.log(newMessage);
        const saveMessage = await newMessage.save();
        console.log("Este es el mensage guardado --->", saveMessage);

        //descubrimos el chatId del user de la Tienda si posee
        const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(createdArticle));
        const chatId = searchUserStore.blissBot.chatId; //si la tienda posee chatId esta sincronizada.
        console.log("chatId ---->", chatId);

        if (chatId){
            blissBotNoti(titleArticle, urlImageArticle, chatId)
        }

        res.json(saveMessage)
    }

    if (depart == 'nautical'){
        const search = await modelNautical.findById(productId);
        const createdArticle = search.user_id;
        const ownerStore = search.username;
        const titleArticle = search.title;
        const urlImageArticle = search.images[0].url  

        const titleURL = transformarTitle(titleArticle); 

        const newMessage = new modelMessages ({times, titleArticle, titleURL, urlImageArticle, userId, username, question, depart, productId, toCreatedArticleId : createdArticle, ownerStore  });
        //console.log(newMessage);
        const saveMessage = await newMessage.save();
        console.log("Este es el mensage guardado --->", saveMessage);

        //descubrimos el chatId del user de la Tienda si posee
        const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(createdArticle));
        const chatId = searchUserStore.blissBot.chatId; //si la tienda posee chatId esta sincronizada.
        console.log("chatId ---->", chatId);

        if (chatId){
            blissBotNoti(titleArticle, urlImageArticle, chatId)
        }

        res.json(saveMessage);

    }

    if (depart == 'service'){
        const search = await modelService.findById(productId);
        const createdArticle = search.user_id;
        const ownerStore = search.username;
        const titleArticle = search.title;
        const urlImageArticle = search.images[0].url  

        const titleURL = transformarTitle(titleArticle); 

        const newMessage = new modelMessages ({times, titleArticle, titleURL, urlImageArticle, userId, username, question, depart, productId, toCreatedArticleId : createdArticle, ownerStore  });
        //console.log(newMessage);
        const saveMessage = await newMessage.save();
        console.log("Este es el mensage guardado --->", saveMessage);

        //descubrimos el chatId del user de la Tienda si posee
        const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(createdArticle));
        const chatId = searchUserStore.blissBot.chatId; //si la tienda posee chatId esta sincronizada.
        console.log("chatId ---->", chatId);

        if (chatId){
            blissBotNoti(titleArticle, urlImageArticle, chatId)
        }

        res.json(saveMessage);

    }

    if (depart == 'auctions'){
        const search = await modelAuction.findById(productId);
        const createdArticle = search.user_id;
        const ownerStore = search.username;
        const titleArticle = search.title;
        const urlImageArticle = search.images[0].url  

        const titleURL = transformarTitle(titleArticle); 

        const newMessage = new modelMessages ({times, titleArticle, titleURL, urlImageArticle, userId, username, question, depart, productId, toCreatedArticleId : createdArticle, ownerStore  });
        //console.log(newMessage);
        const saveMessage = await newMessage.save();
        console.log("Este es el mensage guardado --->", saveMessage);
        //descubrimos el chatId del user de la Tienda si posee
        const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(createdArticle));
        const chatId = searchUserStore.blissBot.chatId; //si la tienda posee chatId esta sincronizada.
        console.log("chatId ---->", chatId);

        if (chatId){
            blissBotNoti(titleArticle, urlImageArticle, chatId)
        }

        res.json(saveMessage);        
    }


//res.json({questions})
});

//aqui extraemos todas las pujas de las subastas.
routes.post('/express-bid-extraer', async(req, res)=>{
    try {
        let searchBids;
        const { id } = req.body;
        //console.log("Esto es el id de la Subasta >>>>>>>>>>>>>", id);
    
        const searchAuctions = await modelAuction.findById(id);
        //console.log("searchAuctions ///////////////////////>>>>>>>>>>>>>>>>", searchAuctions)
        searchBids = searchAuctions.participants;
        console.log("searchBids ///////////////////////>>>>>>>>>>>>>>>>", searchBids);

        res.json({searchBids});
    } catch (error) {
        console.log("Ha habdo un error de carga de data, vuelva a intentarlo luego")
    }

});


//Esta es la direccion donde llega las solicitudes de puja . !importante
routes.post('/bidatauction', async(req, res)=>{
    
    try {
        
        const user = req.session.user;    
        let pushBid, Time;
        console.log("***** Estamos en bidatauction felicidades ***** ")
        console.log(req.body);
        const {bidUser, bidAmount, bidDepartment, bidIDProduct} = req.body;

        const bidAmountF = Math.ceil(bidAmount); //aqui formateamos por si meten numeros decimales, lo lleve a un numero mas arriba.
        
        const searchAuction = await modelAuction.findById(bidIDProduct);
        const auctionDateClose = searchAuction.auctionDateClose; //'25-5-2024 14:10',
        let DateClose = auctionDateClose.split(" ");  //separado por espacio;
        let dateCloseStlargue = DateClose[0]; //25-5-2024--->  string;
        let dateCloseArray = dateCloseStlargue.split("-");
        let diaClose =  dateCloseArray[0]; let mesClose =  dateCloseArray[1]; let anioClose =  dateCloseArray[2];
        let dateCloseSt = `${diaClose}${mesClose}${anioClose}`; 
        let dateClose = parseInt(dateCloseSt);
        let horaCloseTime = DateClose[1]; //14:10; esto hay que convertirlo en numero quedando asi 1410; 1335>1410 no
        let horaCloseTimeSplit = horaCloseTime.split(":"); //array separado por :
        //console.log("horaCloseTimeSplit", horaCloseTimeSplit);
        let horaClose =  horaCloseTimeSplit[0] + horaCloseTimeSplit[1];
        let horaCl = parseInt(horaCloseTimeSplit[0]);
        let minuCl = parseInt(horaCloseTimeSplit[1]);
        let updateBids;
        
        let timeCloseSt;
        if (minuCl <= 9){
            timeCloseSt = `${horaCl}0${minuCl}`;
        } else {
            timeCloseSt = `${horaCl}${minuCl}`;
        }
        
        const timeClose = parseInt(timeCloseSt); // debe ser numerico

        //console.log("timeClose typeof", typeof timeClose);
        //console.log("timeClose", timeClose);//perfecto
    

        //console.log("mirar este objeto con atencion, necesito obtener la fecha de cierre para armar un TClose");
        //console.log("searchAuction", searchAuction);

        if (searchAuction !== null){

            //console.log("Esto es searchAuction ---->",searchAuction);
            const participants = searchAuction.participants;
            const priceInitial = searchAuction.price;
            console.log("Esto es participants", participants );
            //console.log("Esto es priceInitial", priceInitial );
        
            const date = new Date();
            const diaNow = date.getDate();
            const mesNow = date.getMonth() +1;
            const anioNow = date.getFullYear();

            const hours = date.getHours();
            const minut = date.getMinutes();
            const secon = date.getSeconds();

            let dateNowSt = `${diaNow}${mesNow}${anioNow}`; //1552024
            let dateNow = parseInt(dateNowSt); //ahora es numerico y pude ser comprobado como tal;
            //console.log("dateNow", dateNow);
            let fechaNow;
            if ( minut <= 9 ){
                fechaNow = `${hours}0${minut}`; //1215 string
            } else {
                fechaNow = `${hours}${minut}`; //1215 string
            }
            let timeNow = parseInt(fechaNow); //ahora es number y puede ser comprobado;
            //console.log("timeNow", timeNow);
            //timeNow 2129 < timeClose 120
            //dateNow 2552024 < dateClose NaN

            if (minut <= 9){
                if (secon <= 9){
                    Time = `${hours}:0${minut}:0${secon}`;
                } else {
                    Time = `${hours}:0${minut}:${secon}`;
                }
            } else {
                if (secon <= 9){
                    Time = `${hours}:${minut}:0${secon}`;
                } else {
                    Time = `${hours}:${minut}:${secon}`;
                }
            }
            
            const objectBid = {bidUser, bidAmountF, Time};
            //console.log(`timeNow ${timeNow} < timeClose ${timeClose}`);
            //console.log(`dateNow ${dateNow} < dateClose ${dateClose}`);
            //timeNow = 1712  timeClose =  1410
            if (dateNow < dateClose ){
                //console.log("Se puede ejecutar la segunda comprobacion")
                
                //segunda  verificion el array participants NO tiene elementos.
                if (participants.length === 0){
                    console.log(" ////// No hay participantes ////////");
                    //buscamos el precio establecido por el anunciante.
                    
                    if (bidAmountF > priceInitial){
                        
                        pushBid = await modelAuction.findByIdAndUpdate(bidIDProduct, { $push :{participants : objectBid} });
                        updateBids = await modelAuction.findById(bidIDProduct);
                    
                        const participantsBid = updateBids.participants
                        const msj = '¡Tiene el mejor precio!';
                        const type = 2;
                        const objetBid = {participantsBid, msj, type};
                        res.json(objetBid);

                    } else {
                        
                        const msj = 'Debe ser mayor al premio mínimo.';
                        const type = 1;
                        const objetBid = {msj, type};
                        res.json(objetBid);
                    }
            
                 //segunda  verificion el array participants Si tiene elementos.    
                } else {
                    //console.log(" ////// Si hay participantes ////////");
                    //buscamos el ultimo elemento del array para verificar el precio final.
                    const lastParticipants = participants[participants.length - 1];
                    //console.log("::::::: Esto es lastParticipants :::::::", lastParticipants);
                    const bidUserLast = lastParticipants.bidUser;
                    const bidAmountLast  = lastParticipants.bidAmountF;
            
                    //console.log("MIrar aqui -------->");
                    //console.log("Esto es user --->", user.username);
                    //console.log("Esto es bidUserLast --->", bidUserLast);
                    //console.log("Esto es bidAmountLast --->", bidAmountLast);
                    //console.log("Esto es bidAmountF --->", bidAmountF);
            
                    if (user.username !== bidUserLast){
                        //el usuario es diferente al ultimo que ha pujado
                        if ( bidAmountF > bidAmountLast){
                            
                            //console.log("como es mayor podemos aceptar la licitacion");
                            pushBid = await modelAuction.findByIdAndUpdate(bidIDProduct, { $push :{participants : objectBid} });
                            updateBids = await modelAuction.findById(bidIDProduct);
                            
                            const participantsBid = updateBids.participants
                            const msj = '¡Tiene el mejor precio!';
                            const type = 2;
                            const objetBid = {participantsBid, msj, type};
                            res.json(objetBid);
                        } else {
                            //console.log("es menor No podemos aceptar la licitacion");
                            const msj = 'Debe ser mayor al ultimo precio.';
                            const type = 1;
                            const objetBid = {msj, type};
                            res.json(objetBid);
                        }
                    } else {

                        //el usuario es EL MISMO que licito la ultima vez
                        //console.log("LO SIENTO YA USTED LICITO EN LA SUBASTA")
                        const msj = 'Usted ya ha participado.';
                        const type = 1;
                        const objetBid = {msj, type};
                        res.json(objetBid);
                    }
                    
                } 


            } else if (dateNow === dateClose) {
                if (timeNow < timeClose){
                    //console.log("Se puede ejecutar la segunda comprobacion")
                
                    //segunda  verificion si el array participants tiene elementos.
                    if (participants.length === 0){
                        //console.log(" ////// no hay participantes ////////");
                        //buscamos el precio establecido por el anunciante.
                        
                        if (bidAmountF > priceInitial){
                            pushBid = await modelAuction.findByIdAndUpdate(bidIDProduct, { $push :{participants : objectBid} });
                            updateBids = await modelAuction.findById(bidIDProduct);
                            
                            const participantsBid = updateBids.participants
                            const msj = '¡Tiene el mejor precio!';
                            const type = 2;
                            const objetBid = {participantsBid, msj, type};
                            res.json(objetBid);
                        } else {
                            
                            const msj = 'Debe ser mayor al premio mínimo.';
                            const type = 1;
                            const objetBid = {msj, type};
                            res.json(objetBid);
                        }
                
                    } else {
                        //console.log(" ////// si hay participantes ////////");
                        //buscamos el ultimo elemento del array para verificar el precio final.
                        const lastParticipants = participants[participants.length - 1];
                        //console.log("::::::: Esto es lastParticipants :::::::", lastParticipants);
                        const bidUserLast = lastParticipants.bidUser;
                        const bidAmountLast  = lastParticipants.bidAmountF;
                
                        //console.log("MIrar aqui -------->");
                        //console.log("Esto es user --->", user.username);
                        //console.log("Esto es bidUserLast --->", bidUserLast);
                        //console.log("Esto es bidAmountLast --->", bidAmountLast);
                        //console.log("Esto es bidAmountF --->", bidAmountF);
                
                        if (user.username !== bidUserLast){
                            //el usuario es diferente al ultimo que ha pujado
                            if ( bidAmountF > bidAmountLast){
                                //console.log("como es mayor podemos aceptar la licitacion");
                                pushBid = await modelAuction.findByIdAndUpdate(bidIDProduct, { $push :{participants : objectBid} });
                                updateBids = await modelAuction.findById(bidIDProduct);
                                
                                const participantsBid = updateBids.participants
                                const msj = '¡Tiene el mejor precio!';
                                const type = 2;
                                const objetBid = {participantsBid, msj, type};
                                res.json(objetBid);

                            } else {
                                //console.log("es menor No podemos aceptar la licitacion");
                                const msj = 'Debe ser mayor al ultimo precio.';
                                const type = 1;
                                const objetBid = {msj, type};
                                res.json(objetBid);
                            }
                        } else {
                            //el usuario es EL MISMO que licito la ultima vez
                            //console.log("LO SIENTO YA USTED LICITO EN LA SUBASTA")
                            const msj = 'Usted ya ha participado.';
                            const type = 1;
                            const objetBid = {msj, type};
                            res.json(objetBid);
                        }
                        
                    } 

                    //type : 0 >>> json de error.
                    //type : 1 >>> json de solo msj.
                    //type : 2 >>> jsonde  participantsBid y msj.

                } else {
                    //console.log("No es posible participar en esta Subasta, Ya se ha Cerrado");
                    const msj = '¡Esta Subasta ha cerrado!';
                    const type = 1;
                    const objetBid = {msj, type};
                    res.json(objetBid);
                }

            } else {
                //console.log("No es posible participar en esta Subasta, Ya se ha Cerrado");
                const msj = '¡Esta Subasta ha cerrado!';
                const type = 1;
                const objetBid = {msj, type};
                res.json(objetBid);
            }

        }
        
    } catch (error) {
        const msj = '¡Ha habido un error, intente luego!'
        const type = 0;
        const objetBid = {msj, type};
        res.json(objetBid);
    }    
    
});

routes.post('/auction/cronoAsta', async(req, res)=>{
    console.log(":::::::::::: Esto es cronoAsta ::::::::::::")
    const idTitle = req.body.idTitle;
    const date = new Date();

    const searchAuction = await modelAuction.findById(idTitle);
    //console.log("Esto es searchAuction ---->", searchAuction);

    console.log("Esto es date", date);
    const objetData = {
        date : date,
        searchAuction : searchAuction
    }

    
    res.json(objetData);
});


//Sección de manejo de Raffles --------------------------------------------
routes.get('/raffleModule/:id', async(req, res)=>{

    const idRaffle = req.params.id;
    const ticketTakeError =  req.session.ticketTakeError;
    const ticketTakeFine = req.session.ticketTakeFine;
    const ticketTakeAnfitrion = req.session.ticketTakeAnfitrion;
    const ticketTakeErrorNoProfile = req.session.ticketTakeErrorNoProfile;
    delete req.session.ticketTakeError;
    delete req.session.ticketTakeFine;
    delete req.session.ticketTakeAnfitrion;
    delete req.session.ticketTakeErrorNoProfile;

    
    const search = await modelRaffle.findById(idRaffle);

    //console.log('search', search);

    const user = req.session.user;
    const countMessages = req.session.countMessages; //contador de mensajes
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //contador de alertas de negociación.
    let searchProfile;
    let ticketsTake;

    if (user){
        //console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        //console.log("Aqui el profile de la cuenta del visitante -->", searchProfile);
        
        if (search){
            ticketsTake = search.boxTickets; //aqui tengo el array con los tickets con toda la inf. necesaria
            res.render('page/raffleModule', {user, countMessages, countNegotiationsBuySell, searchProfile, search, ticketsTake, ticketTakeFine, ticketTakeError, ticketTakeErrorNoProfile, ticketTakeAnfitrion })    
        } else {
            res.redirect('/')
        }

    } else {
            res.render('page/raffleModule', {user, countMessages, countNegotiationsBuySell, searchProfile, search, ticketsTake, ticketTakeFine, ticketTakeError, ticketTakeErrorNoProfile, ticketTakeAnfitrion })       
    }

    
});

//esta direccion la toma desde la pagina raffleModule en un script
routes.post('/raffleModule/data/', async(req, res)=>{

    const id = req.body.id
    //console.log("****** Esto es Body id : ", id);

    const search = await modelRaffle.findById(id);
    //console.log('search que enviare al fronted : ', search);

    res.json(search); 
});

//aqui tomamos un ticket sorteo Gratis 
routes.post('/raffleModule/takeTikets/free', async(req, res)=>{

    try{
        const user = req.session.user;
        const username = user.username;
        let searchProfile, resp;
        console.log(":::::: Tomando un Tickets ::::::");
        console.log("user :", username);

        if (user){
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.find({ indexed : user._id });
            //console.log("Aqui el profile de la cuenta del visitante -->", searchProfile);
        }

        if (searchProfile.length !==0){

            const { Id, NoTicket } = req.body; //Id es el id del raffle
            console.log("Id :", Id); 
            console.log("NoTicket :", NoTicket);
            const Ticket = parseInt(NoTicket);
            console.log("Ticket :", typeof Ticket);
            const n = (Ticket - 1);
            console.log("n :", n);
            const serial = new Date().getTime();
            console.log("serial :", serial);
            const dia = new Date().getDate();
            const mes = new Date().getMonth() + 1;
            const anio = new Date().getFullYear();
            const hora = new Date().getHours();
            const minu = new Date().getMinutes();
            let dateNow;
            if (minu <= 9){
                dateNow = `${dia}-${mes}-${anio} ${hora}:0${minu}`;
            } else {
                dateNow = `${dia}-${mes}-${anio} ${hora}:${minu}`;
            }

            const search = await modelRaffle.findById(Id);
            const productId = search._id; //el id del articulo (Sorteo).
            const depart = search.department; //aqui el departamento.
            const title = search.title; //aqui tengo el title
            const urlImageArticle = search.images[0].url 
            const category = search.category; //aqui la categoria
            const numTickets = search.numTickets; //cantidad de tickets que posee el sorteo
            const cantPrizes = search.numberOfPrizes;//cantidad de premios (cant. de numeros que se generan)
            const policy = search.raffleClosingPolicy; //politica de celebracion
            const price = search.price; //precio del ticket que como es gratis es cero
            const dateStart = search.dateStart; //aqui la fecha de creacion del sorteo ya formateada.
            const anfitrion = search.username; //aqui tenemos el username del anfitrion
            const anfitrion_id = search.user_id; //id del anfitrion
            const boxTickets = search.boxTickets;  //buscar Contestan con un for
            const PrizesObject = search.PrizesObject; //arreglo de lo user ganadores con sus ticket.

            let count = 0;
            let cantVerifiedTicket = 1;

            for (let i = 0; i < boxTickets.length; i++) {
                const element = boxTickets[i].Contestan;
                const ticketVerified = boxTickets[i].Verified;
                
                if (element == username){
                    //console.log("::::: YA el usuario esta participando :::::")
                    count = count + 1;
                }
                
                if (ticketVerified === true){
                    cantVerifiedTicket = cantVerifiedTicket + 1;
                }
            }

            console.log("El usuario ha participado", count, "veces");

            if ( anfitrion !== username ){ 

                    if (cantVerifiedTicket === numTickets){
                        //comparo si hemos llegado a la ultima verificacion ultimo ticket. 
                        //y ejecuto todo el proceso requerido

                        if (count === 0){

                            let ticketRandom = [];
                            console.log('Se han verificado todos los Tickets')
                            console.log('cantVerifiedTicket :', cantVerifiedTicket);
                            console.log('numTickets :', numTickets);
                            console.log(`${cantVerifiedTicket}/${numTickets}`);
                            //verifico el ultimo ticket
                            const updateRef = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                            
                        
                                [`boxTickets.${n}.Contestan`] : username,
                                [`boxTickets.${n}.No_Serial`] : serial,
                                [`boxTickets.${n}.Date`] : dateNow,
                                [`boxTickets.${n}.Take`] : true,
                                [`boxTickets.${n}.Verified`] : true
                            
                        
                            }});

                            //aqui vamos a guardar la informacion en el modelTickets ---------
                            const newTicket = new modelTickets ({ id_raffle: Id, dateStart, category, numTickets, raffleClosingPolicy: policy, title,  price, serial, No : Ticket , username, anfitrion });
                            const newTicketSave = await newTicket.save();

                            //asigno true al campo allTicketsTake
                            const updateRaffle = await modelRaffle.findByIdAndUpdate(Id, { $set: { allTicketsTake : true }} );
                            //genero los numeros ganadores sin repetirse (winTicket)               
                            //cantPrizes (esta variable esta la cantidad de numeros que se deben generar)
                            while (ticketRandom.length < cantPrizes){
                                let randomNumber = Math.trunc(Math.random() * numTickets);
                                if ( randomNumber !== 0 ){
                                    
                                    if (!ticketRandom.includes(randomNumber)){
                                        ticketRandom.push(randomNumber);
                                    }

                                }
                            }

                            console.log(":::::::::::::::::::::::Aqui los numeros random:::::::::::::::::::::::");
                            console.log('ticketRandom', ticketRandom);
                        
                            //PrizesObject arreglo que posee los objetos que deben ser actualizados con los numeros en el campo winTicket 
                            let updatePrizesObject; // esta variable se actualiza cuando la funcion messagesForWin() es ejecutada

                            async function TicketWin(){
                        
                                for (let i = 0; i < ticketRandom.length; i++) {
                                    let ticketWin = ticketRandom[i];

                                    const updateWinTicket = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                        [`PrizesObject.${i}.winTicket`] : ticketWin
                                    }});
                                    
                                }
                                
                                
                            };

                            async function contestan(){
                                console.log(":::Invocacion de la Funcion Contestan()");
                                console.log("Ejecutando la funcion Contestan")
            
                                for (let u = 0; u < ticketRandom.length; u++) {
                                    const ticketWin = ticketRandom[u];// aqui estaran los numeros ganadores ejemplo 4, 7, 9
                                    for (let x = 0; x < boxTickets.length; x++) {
                                        const ele = boxTickets[x].No; //1,2,3,4,5,6,7,8,9,...... hasta el ultimo
                                        const Contestan = boxTickets[x].Contestan; //aqui iran pasando todos los participantes
                                        if (ele == ticketWin){
                                            const updateWinTicket = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                                    
                                                [`PrizesObject.${u}.winUser`] : Contestan
                                        
                                            }});
                                        }
                                        
                                    }
                                    
                                }

                            };
                                
                            async function messagesForWin(){
                                const newRaffle = await modelRaffle.findById(productId);
                                updatePrizesObject = newRaffle.PrizesObject
                                console.log("Esto es updatePrizesObject -----------> mirar esto", updatePrizesObject);
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
                                                                                                                                                                                                                                                                                                        
                                        const newMessage = new modelMessages({times : dateNow, titleArticle : title, urlImageArticle, userId : anfitrion_id, username : anfitrion , question : "Felicidades ha sido ganador de un Sorteo. ¡Vaya al sorteo reclame su premio y califique!", depart, productId, toCreatedArticleId : winId, ownerStore : winUser  });
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
                                    const message = "Celebración de Sorteo."
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
        
                                const resultUser = await modelUser.find({ username : anfitrion }); //hago una busqueda para ubicar el Id del user
                                const anfitrionMail = resultUser[0].email; //Id del user ganador.
        
                                //console.log(`anfitrionMail : ${anfitrionMail} | title: ${title}`); 
        
                                const message = "Celebración de Sorteo."
                                const contentHtml = `
                                <h2 style="color: black"> Felicidades su Sorteo se ha celebrado. </h2>
                                <ul style="color: black"> 
                                    <li> cuenta : ${anfitrionMail} </li> 
                                    <li> asunto : ${message} </li>
                                <ul>
                                <h2 style="color: black"> Celebración de Sorteo  ${title}. </h2>
                                <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y atienda con esmero a los dichosos ganadores, para que estos le califiquen positivo. </p>
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
                                let commission = 6;
                                let tecnicalDescription = 'Esto es un Sorteo de Tickets Gratis';
                                const Invoice = new modelInvoice({ usernameSell : anfitrion, indexed : anfitrion_id, department : depart, title, title_id : productId,  tecnicalDescription, price, commission });
                                const InvoiceSave = await Invoice.save();
                                
                            };

                            async function raffleHistory(){
                                //aqui guardamos la data del raffle history
                                const raffle = await modelRaffle.findById(productId);
                                const PrizesObject =  raffle.PrizesObject;
                                const image = raffle.images[0].url;
                                //console.log("image ---->", image);

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
                                            const ext = extPart[4]; console.log("ext------->", ext) //esto es para conseguir la extencion .png o jpg
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

    /* 
                            {     
                                const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgRaffleHistory'});
                                //console.log("Aqui resultUpload ----->", resultUpload);
                                const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
                                const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.
                                //
                    
                                const history = new modelRaffleHistory({ category, anfitrion, anfitrion_id, title_id : productId, title, price, numTickets, PrizesObject, dateStart, image: dImage });
                                //(anfitrion, anfitrion_id, category, title_id, title, image, price, numTickets, PrizesObject, dateStart)
                                const historySave = await history.save(); //data salvada.
                                }

    */

                            };
                        
                            TicketWin() //:::invocacion de la primera Funcion TicketWin
                                .then(()=>{
                                    //todos los elementos de PrizesObject en el campo winTicket deben tener su numero ganador y no null.
                                    contestan() //:::invocacion segundo funcion 
                                        .then(()=>{
                                            messagesForWin() //invocacion de envio de mensajes a todos los participantes Ganadores.
                                                .then(()=>{
                                                    emailsWinTicket()
                                                        .then(()=>{
                                                            emailAnfitrion()
                                                                .then(()=>{
                                                                    invoiceDone() //aqui invoco el ultimo proceso, la creacion de la factura del Sorteo.
                                                                        .then(()=>{
                                                                            raffleHistory()
                                                                                .then(()=>{
                                                                                    console.log("Procesos de Celebracion de Sorteo ejecutado OK.");
                                                                                })
                                                                                .catch((error)=>{
                                                                                    console.log("Ha habido un error raffleHistory()", error)
                                                                                })
                                                                        })
                                                                        .catch((error)=>{
                                                                            console.log("Ha habido un error invoiceDone()", error)
                                                                        })
                                                                })
                                                                .catch((error)=>{
                                                                    console.log("Ha habido un error emailAnfitrion()", error)
                                                                })

                                                        })
                                                        .catch((error)=>{
                                                            console.log("Ha habido un error emailsWinTicket()", error)
                                                        })

                                                })
                                                .catch((error)=>{
                                                    console.log("Ha habido un error messagesForWin()", error)
                                                })
                                        })
                                        .catch((error)=>{
                                            console.log("Ha habido un error contestan()", error)
                                        })
                                    
                                })
                                .catch((error)=> {
                                    console.log("Ha ocurrido un error TicketWin()", error);
                                })


                            console.log(":::\\\ Fin del raffle y ejecutado con exito ///:::")
                            console.log(":::\\\\\\\\\\ Fin ////////:::")


                        } else {

                            req.session.ticketTakeError = 'Ya ha tomado un Tickets';
                            resp = "ya este usuario ha tomado un Tickets";
                            
                        }    



                    } else {
                        
                        if (count === 0){

                            resp = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                [`boxTickets.${n}.Contestan`] : username,
                                [`boxTickets.${n}.No_Serial`] : serial,
                                [`boxTickets.${n}.Date`] : dateNow,
                                [`boxTickets.${n}.Take`] : true,
                                [`boxTickets.${n}.Verified`] : true
                            }});

                            //aqui vamos a guardar la informacion en el modelTickets ---------
                            const newTicket = new modelTickets ({ id_raffle: Id, dateStart, category, numTickets, raffleClosingPolicy: policy, title,  price, serial, No : Ticket , username , anfitrion });
                            const newTicketSave = await newTicket.save();

                            req.session.ticketTakeFine = `Felicidades, ha tomado el ticket, ${Ticket}`; 
                            
                            console.log("Aun faltan Numeros por tomar")
                            console.log("cantVerifiedTicket", cantVerifiedTicket);
                            console.log("numTickets", numTickets);

                        } else {

                            req.session.ticketTakeError = 'Ya ha tomado un Tickets';
                            resp = "ya este usuario ha tomado un Tickets";

                        } 
                        

                    }    
            
            } else {

                req.session.ticketTakeAnfitrion = 'El Anfitrión no puede participar';

            }

            //este es el patron del nacimiento de un ticket
            //posee 7 propiedades con sus valores por default 
            //estos objetos iran modificandose en el tiempo si es tomado por un usuario

            //"No" : 7,
            //"Contestan" : "",
            //"No_Serial" : 1708869455364,
            //"Date" : "",
            //"Take" : false
            //"Ref" : "",
            //"Verified" : false

            //console.log(update);
            res.json({resp});

        } else {

            req.session.ticketTakeErrorNoProfile = 'Requiere Perfil para participar';
            resp = "Debe tener Perfil para poder participar";
            console.log("********************* L e e r ****************************");
            console.log("Este usuario no tiene Perfil, NO puede tomar ninung Tickets")
            res.json({resp});

        }
     
    } catch(error){
        console.log('Ha ocurrido un error, intente en unos minutos.');
    }   

});

//aqui tomamos un ticket sorteo Pago           
routes.post('/raffleModule/takeTikets/pay', async(req, res)=>{
    
    try{    
        const user = req.session.user;
        const username = user.username;
        let searchProfile, resp;
        console.log(":::::: Tomando un Tickets ::::::");
        console.log("user :", username);

        if (user){
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.find({ indexed : user._id });
            //console.log("Aqui el profile de la cuenta del visitante -->", searchProfile);
        }

        console.log("*********** L e e r **********");
        console.log("searchProfile -->", searchProfile);
        
        if (searchProfile.length !==0){

            const { Id, NoTicket } = req.body;
            console.log("Id :", Id);
            console.log("NoTicket :", NoTicket);
            const Ticket = parseInt(NoTicket);
            console.log("Ticket :", typeof Ticket);
            const n = (Ticket - 1);
            console.log("n :", n);
            const serial = new Date().getTime();
            console.log("serial :", serial);
            const dia = new Date().getDate();
            const mes = new Date().getMonth() + 1;
            const anio = new Date().getFullYear();
            const hora = new Date().getHours();
            const minu = new Date().getMinutes();
            
            let dateNow;
            if (minu <= 9){
                dateNow = `${dia}-${mes}-${anio} ${hora}:0${minu}`;
            } else {
                dateNow = `${dia}-${mes}-${anio} ${hora}:${minu}`;
            }
        
            const search = await modelRaffle.findById(Id);
            const anfitrion = search.username; //aqui tenemos el username del anfitrion
            const boxTickets = search.boxTickets;  //buscar Contestan con un for
            let count = 0;
        
            for (let i = 0; i < boxTickets.length; i++) {
                const contestan = boxTickets[i].Contestan;
                const verified = boxTickets[i].Verified;
                
                if (contestan == username){
                    console.log("::::: YA el usuario esta participando :::::")
                    if (verified === false){
                        count = count + 1;
                    }
                    
                } 
            }
        
            console.log("El usuario ha participado", count, "veces");
        
            if ( anfitrion !== username ){ 
        
                if (count === 0){
        
                    resp = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                        [`boxTickets.${n}.Contestan`] : username,
                        [`boxTickets.${n}.No_Serial`] : serial,
                        [`boxTickets.${n}.Date`] : dateNow,
                        [`boxTickets.${n}.Take`] : true,
            
                    }});
        
                    req.session.ticketTakeFine = `Felicidades, ha tomado el ticket, ${Ticket}`;   
        
                } else {
        
                    req.session.ticketTakeError = 'Ya ha tomado un Tickets';
                    resp = "ya este usuario ha tomado un Tickets";
        
                } 
            
            } else {
        
                req.session.ticketTakeAnfitrion = 'El Anfitrión no puede participar';
        
            }
        
            //"No" : 7,
            //"Contestan" : "",
            //"No_Serial" : 1708869455364,
            //"Date" : "",
            //"Take" : false
            //"Ref" : "",
            //"Verified" : false
        
            //console.log(update);
            res.json({resp});

        } else {

            req.session.ticketTakeErrorNoProfile = 'Requiere Perfil para participar';
            resp = "Debe tener Perfil para poder participar";
            console.log("********************* L e e r ****************************");
            console.log("Este usuario no tiene Perfil, NO puede tomar ningun Tickets")
            res.json({resp});

        }

    } catch(error){
        console.log('Ha ocurrido un error, intente en unos minutos.');
    }   
    

});

//en esta direccion es donde el participante de un sorteo "pago" registra su pago.
routes.post('/raffleModule/registerTicket/pay', async(req, res)=>{
    const user = req.session.user;
    const username = user.username;
    console.log(":::::: Registrando un Tickets ::::::");
    console.log("user :", username);

    const { Id, NoTicket, Ref } = req.body;
    console.log("Id :", Id);
    console.log("NoTicket :", NoTicket);
    const Ticket = parseInt(NoTicket);
    console.log("Ticket :", typeof Ticket);
    const n = (Ticket - 1);
    console.log("n :", n);
    let RefTrim = Ref.trim();
    console.log("RefTrim :", RefTrim);

    const search = await modelRaffle.findById(Id);
    const boxTickets = search.boxTickets; 

    if (RefTrim.length >= 2 ){
        const updateRef = await modelRaffle.findByIdAndUpdate(Id, { $set: {
        
            [`boxTickets.${n}.Ref`] : RefTrim

        }});
    }    

    req.session.ticketRegister = `Felicidades, Ha registrado su Ticket, ${Ticket}`;   

    res.redirect(`/raffleModule/${Id}`);
    
});

////:::YES boton Si (el pago será registrado como Si pagado)
//aqui es donde un anfitrion de un sorteo pago verifica un pago de Tickect
//Tambien se ejecuta una validacion del progreso de la toma y conformacion de Ticket con el fin de ejecutar el script de generacion de Tickets Ganadores.
routes.get("/raffleModule/verifiedTicket/payYes/:id/:contestan/:NoTicket", async(req, res)=>{

    const Id = req.params.id;
    const Contestan = req.params.contestan;
    const NoTicket = req.params.NoTicket;
    let NoParse = parseInt(NoTicket);
    let n = (NoParse - 1);
    let cantVerifiedTicket = 1; //este es el contador de ticket Verficados. Se usara para comparar con * cantTicket *
    const user = req.session.user;
    const username = user.username;
    console.log(":::::: verificando un Tickets ::::::");
    console.log("user :", username);
    console.log("Id :", Id);
    console.log("n :", n);

    const serial = new Date().getTime();
    console.log("serial :", serial);
    const dia = new Date().getDate();
    const mes = new Date().getMonth() + 1;
    const anio = new Date().getFullYear();
    const hora = new Date().getHours();
    const minu = new Date().getMinutes();
    let dateNow;

    if (minu <= 9){
        dateNow = `${dia}-${mes}-${anio} ${hora}:0${minu}`;
    } else {
        dateNow = `${dia}-${mes}-${anio} ${hora}:${minu}`;
    }
   
    const search = await modelRaffle.findById(Id);
    const productId = search._id; //el id del articulo (Sorteo).
    const depart = search.department; //aqui el depaartamento. 
    const title = search.title; //aqui tengo el title
    const urlImageArticle = search.images[0].url 
    const category = search.category; //aqui la categoria
    const policy = search.raffleClosingPolicy; //politica de celebracion
    const price = search.price; //precio del ticket que como es gratis es cero
    const dateStart = search.dateStart; //aqui la fecha de creacion del sorteo ya formateada.
    const anfitrion = search.username; //aqui tenemos el username del anfitrion
    const anfitrion_id = search.user_id; //id del anfitrion
    const cantPrizes = search.numberOfPrizes;//cantidad de premios (cant. de numeros que se generan)
    const cantTicket = search.numTickets; //cantidad de ticket dispensados

    console.log("Esto es cantPrizes : ", cantPrizes);
    //console.log("Esto es cantTicket : ", cantTicket);

    const boxTickets = search.boxTickets; 
    console.log("esto es boxTickets", boxTickets);
    for (let i = 0; i < boxTickets.length; i++) {
        const ticketVerified = boxTickets[i].Verified;

        if (ticketVerified === true){
            cantVerifiedTicket = cantVerifiedTicket + 1;
        }
    }

    //comparo si hemos llegado a la ultima verificacion. 
    //y ejecuto todo el proceso requerido
    if (cantVerifiedTicket == cantTicket ){
        let ticketRandom = [];
        console.log('Se han verificado todos los Tickets como pagados')
        console.log('cantVerifiedTicket :', cantVerifiedTicket);
        console.log('cantTicket :', cantTicket);
        console.log(`${cantVerifiedTicket}/${cantTicket}`);
        //verifico el ultimo ticket
        const updateRef = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                          
            [`boxTickets.${n}.Verified`] : true
    
        }});

        //aqui vamos a guardar la informacion en el modelTickets ---------
        const newTicket = new modelTickets ({ id_raffle: Id, dateStart, category, numTickets: cantTicket, raffleClosingPolicy: policy, title,  price, serial, No : NoParse , username : Contestan , anfitrion });
        const newTicketSave = await newTicket.save();

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
        console.log(":::::::::::::::::::::::Aqui los numeros random:::::::::::::::::::::::");
        console.log('ticketRandom', ticketRandom);
        //PrizesObject arreglo que posee los objetos que deben ser actualizados con los numeros en el campo winTicket 
        let updatePrizesObject;

        async function TicketWin(){
                    
            for (let i = 0; i < ticketRandom.length; i++) {
                let ticketWin = ticketRandom[i];

                const updateWinTicket = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                    [`PrizesObject.${i}.winTicket`] : ticketWin
                }});
                
            }
            
            
        };

        async function contestan(){
            console.log(":::Invocacion de la Funcion Contestan()");
            console.log("Ejecutando la funcion Contestan")

            for (let u = 0; u < ticketRandom.length; u++) {
                const ticketWin = ticketRandom[u];// aqui estaran los numeros ganadores ejemplo 4, 7, 9
                for (let x = 0; x < boxTickets.length; x++) {
                    const ele = boxTickets[x].No; //1,2,3,4,5,6,7,8,9,...... hasta el ultimo
                    const Contestan = boxTickets[x].Contestan; //aqui iran pasando todos los participantes
                    if (ele == ticketWin){
                        const updateWinTicket = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                
                            [`PrizesObject.${u}.winUser`] : Contestan
                    
                        }});
                    }
                    
                }
                
            }

        };

        async function messagesForWin(){
            const newRaffle = await modelRaffle.findById(Id);
            updatePrizesObject = newRaffle.PrizesObject
            console.log("Esto es updatePrizesObject -----------> mirar esto", updatePrizesObject);
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
                                                                                                                                                                                                                                                                                       
                    const newMessage = new modelMessages({times : dateNow, titleArticle : title, urlImageArticle, userId : anfitrion_id, username : anfitrion , question : "Felicidades ha sido ganador de un Sorteo. ¡Vaya al sorteo reclame su premio y califique!", depart, productId : Id, toCreatedArticleId : winId, ownerStore : winUser  });
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
                const message = "Celebración de Sorteo."
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

            const resultUser = await modelUser.find({ username : anfitrion }); //hago una busqueda para ubicar el Id del user
            const anfitrionMail = resultUser[0].email; //Id del user ganador.

            console.log(`anfitrionMail : ${anfitrionMail} | title: ${title}`); 

            const message = "Celebración de Sorteo."
            const contentHtml = `
            <h2 style="color: black"> Felicidades su Sorteo se ha celebrado. </h2>
            <ul style="color: black"> 
                <li> cuenta : ${anfitrionMail} </li> 
                <li> asunto : ${message} </li>
            <ul>
            <h2 style="color: black"> Celebración de Sorteo  ${title}. </h2>
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
            let commission = 8;
            let tecnicalDescription = 'Esto es un Sorteo de Tickets Pago';
            const Invoice = new modelInvoice({ usernameSell : anfitrion, indexed : anfitrion_id, department : depart, title, title_id : productId,  tecnicalDescription, price, commission });
            const InvoiceSave = await Invoice.save();
        };

        async function raffleHistory(){
            //aqui guardamos la data del raffle history
            const raffle = await modelRaffle.findById(productId);
            const PrizesObject =  raffle.PrizesObject;
            const image = raffle.images[0].url;
            //console.log("image ---->", image);

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
                        const ext = extPart[4]; console.log("ext------->", ext) //esto es para conseguir la extencion .png o jpg
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
                                    const history = new modelRaffleHistory({ category, anfitrion, anfitrion_id, title_id : productId , title, price, numTickets: cantTicket, PrizesObject, dateStart, image: dImage }); 
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

//este bloque debe ser eliminado cuando sea probado.
/*             const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgRaffleHistory'});
            //console.log("Aqui resultUpload ----->", resultUpload);
            const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
            const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.
            //

            const history = new modelRaffleHistory({ category, anfitrion, anfitrion_id, title_id : productId , title, price, numTickets: cantTicket, PrizesObject, dateStart, image: dImage });
            //(anfitrion, anfitrion_id, category, title_id, title, image, price, numTickets, PrizesObject, dateStart)
            const historySave = await history.save(); //data salvada.  */
        }
    
        TicketWin() //:::invocacion de la primera Funcion TicketWin
            .then(()=>{
                contestan() //:::invocacion segundo funcion 
                    .then(()=>{
                        messagesForWin() //invocacion de envio de mensajes a todos los participantes Ganadores.
                            .then(()=>{
                                emailsWinTicket()
                                    .then(()=>{
                                        emailAnfitrion()
                                            .then(()=>{
                                                invoiceDone() //aqui invoco el ultimo proceso, la creacion de la factura del Sorteo.
                                                    .then(()=>{
                                                        raffleHistory()
                                                            .then(()=>{
                                                                console.log("Procesos de Celebracion de Sorteo pago ejecutado OK.");
                                                            })
                                                            .catch((error)=>{
                                                                console.log("Ha habido un error raffleHistory()", error);
                                                            })
                                                    })
                                                    .catch((error)=>{
                                                        console.log("Ha habido un error invoiceDone()", error);
                                                    })
                                            })
                                            .catch((error)=>{
                                                console.log("Ha habido un error emailAnfitrion()", error);
                                            })
                                    })
                                    .catch((error)=>{
                                        console.log("Ha habido un error emailsWinTicket()", error);
                                    })
                            })
                            .catch((error)=>{
                                console.log("Ha habido un error messagesForWin()", error); 
                            })

                    })
                    .catch((error)=>{
                        console.log("Ha habido un error contestan()", error); 
                    })
                 
            })
            .catch((error)=> {
                console.log("Ha ocurrido un error TicketWin()", error);
            })

        


    } else {
        //console.log('Aun faltan Tickets por ser verificados')
        //console.log('cantVerifiedTicket :', cantVerifiedTicket);
        //console.log('cantTicket :', cantTicket);
        console.log(`${cantVerifiedTicket}/${cantTicket}`);


        const updateRef = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                          
            [`boxTickets.${n}.Verified`] : true
    
        }});

        //aqui vamos a guardar la informacion en el modelTickets ---------
        const newTicket = new modelTickets ({ id_raffle: Id, dateStart, category, numTickets: cantTicket, raffleClosingPolicy: policy, title,  price, serial: serial, No : NoParse , username : Contestan , anfitrion });
        const newTicketSave = await newTicket.save();

    }
      

    res.redirect(`/raffleModule-admin/${Id}`);
});    

////:::NO boton No (el pago sera registrado como No pagado)
//aqui es donde un anfitrion de un sorteo pago verifica un pago de Ticket
routes.get("/raffleModule/verifiedTicket/payNo/:id/:contestan/:NoTicket", async(req, res)=>{

    const Id = req.params.id;
    const NoTicket = req.params.NoTicket;
    let NoParse = parseInt(NoTicket);
    let n = (NoParse - 1);
    const user = req.session.user;
    const username = user.username;
    console.log(":::::: verificando un Tickets ::::::");
    console.log("user :", username);
    console.log("Id :", Id);
    console.log("n :", n);
   

    const search = await modelRaffle.findById(Id);
    const boxTickets = search.boxTickets; 
    
    
    const updateRef = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                          
        [`boxTickets.${n}.Contestan`] : "",
        [`boxTickets.${n}.No_Serial`] : "",
        [`boxTickets.${n}.Date`] : "",
        [`boxTickets.${n}.Take`] : false,
        [`boxTickets.${n}.Ref`] : "",
        [`boxTickets.${n}.Verified`] : false

    }});

    //"No" : 7,
    //"Contestan" : "",
    //"No_Serial" : 1708869455364,
    //"Date" : "",
    //"Take" : false
    //"Ref" : "",
    //"Verified" : false
  
    res.redirect(`/raffleModule-admin/${Id}`);
}); 

//en esta direccion es donde el participante de un sorteo Califica un Sorteo.
routes.post('/raffleModule/rate', async(req, res)=>{

    console.log(":::::: Calificando Sorteo ::::::");

    const { username, IdRaffle, winTicket, winPrize, rateSelect } = req.body;
   
    const WINTicket = parseInt(winTicket);
    console.log(req.body);
    console.log("IdRaffle", IdRaffle);
    console.log("winTicket", winTicket);
    console.log("WINTicket", WINTicket);
    console.log("rateSelect", rateSelect);

    try{
        const updateRaffle = await modelRaffle.findByIdAndUpdate(
            IdRaffle,
            { $set: { "PrizesObject.$[element].rate": rateSelect } },
            { arrayFilters: [{ "element.winTicket": WINTicket }] }
        );

        const history = await modelRaffleHistory.updateOne(
            { title_id : IdRaffle },
            { $set: { "PrizesObject.$[element].rate": rateSelect } },
            { arrayFilters: [{ "element.winTicket": WINTicket }] }
        );

        res.redirect(`/raffleModule/${IdRaffle}`); 

    }catch(error){
        console.log("ha ocurrido un error, vuelva a intentar luego");
    }    

     
});

module.exports = routes

