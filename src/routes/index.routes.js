const { Router } = require('express');
const hash = require('object-hash');
const passport = require('passport');

const nodemailer = require('nodemailer');
const routes = Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

//este Token es la KEY del bot de Telegram
const Token =  process.env.Token_Bot;

const countries = require('../countries.js');

const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelBankUser = require('../models/bankUser.js');
const modelStopped = require('../models/stoppedUser.js');
const modelMessages = require('../models/messages.js');
const modelBuySell = require('../models/buySell.js');
const modelNegotiation = require('../models/negotiations.js');

const modelAirplane = require('../models/airplane.js');
const modelArtes = require('../models/artes.js');
const modelItems = require('../models/items.js');
const modelAutomotive = require('../models/automotive.js');
const modelRealstate = require('../models/realstate.js');
const modelNautical = require('../models/nautical.js');
const modelService = require('../models/services.js');
const modelAuction = require('../models/auction.js');
const modelRaffle = require('../models/raffle.js'); 
const modelBannerFront = require('../models/bannerFront.js');
const modelNewsDay = require('../models/newsDay.js');
const modelBannerDefault = require('../models/bannerUserDefault.js');
const modelBackgroundSign = require('../models/backgroundSign.js');
const modelStoreRate = require('../models/storeRate.js');

const modelShoppingCart = require('../models/shoppingCart.js');

const modelRateCurrency = require('../models/rateCurrency.js');

const fetch = require('node-fetch'); //ver: 2.6.1 ultima dependencia instalada. 
const bcrypt = require('bcryptjs');

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


routes.get('/', async(req, res)=>{
    
    let username;

    
    const user = req.session.user;
    const success = req.session.success; //"¡Bienvenido! Has entrado a Blissenet.com. Tu red de mercado mundial.";
    const stopped = req.session.stopped; //"Su cuenta ha sido baneada por infringir nuestras normas.";
    const dataLocked = req.session.dataLocked // {username, date, ban}; envo estos tres datos para especificar el username cantidad de dias y la fecga de bloqueo
    const methodLoging = req.session.methodLoging  //"Su cuenta usa el metodo de Usuario y Contraseña.";

    let countMessages, countMessagesInbox
    let searchBoxMessageInbox = [];
    let boxOffert = []; //este es el array que contendra todas las trending ofertas.  
    let boxBestView = []; //este es el array de contendra la lista de los anuncios mas vistos.

    delete req.session.success;
    delete req.session.stopped;
    delete req.session.dataLocked;
    delete req.session.methodLoging;
    console.log("Esto es user ->", user);


    let searchProfile;
    const boxResult = [];

        
    if (user){
        //console.log("Esto es user._id ------>", user._id );
        const userId = user._id;
        const searchCountry = await modelUser.findById(userId);
        const countryCode = searchCountry.seeMarket.countryMarketCode;
        console.log("Este es el code de pais -->", countryCode);
        let countNegotiationsBuySell;

        searchProfile = await modelProfile.find({ indexed : userId });
        console.log("Aqui el profile de la cuenta", searchProfile);
        username = user.username;

        //:::::::: Alert of message :::::::::::

        //primer paso ubicar todos los mensajes que tenga el usuario logeado y que el campo answer diga waiting.
        const searchMessageInbox0 = await modelMessages.find( { $and: [{ toCreatedArticleId : userId },{answer: "waiting"}, { typeNote: { $ne: "availability-noti" } } ] } );
        const searchMessageInbox1 = await modelMessages.find( { $and: [{ userId : userId }, { typeNote : "availability-noti" }, {answer: "waiting"} ] } );
        
        searchBoxMessageInbox.push(...searchMessageInbox0, ...searchMessageInbox1);
        console.log("Estos son todos los mensajes que tiene este usuario en Inbox --->", searchBoxMessageInbox);
       
        countMessagesInbox = searchBoxMessageInbox.length;
   
        console.log('esta es la cantidad de mensajes que tiene este usario en inbox--->', countMessagesInbox)

        const searchMessageOutbox = await modelMessages.find( { $and: [{userId : userId },{view: false},{ typeNote: { $ne: "availability-noti" } } ] } );
        const searchMessageOutboxAlert = await modelMessages.find( { $and: [{userId : userId },{view: false},{ typeNote: { $ne: "availability-noti" }}, { answer: { $ne: "waiting" } } ] } );
        let countMessagesOutbox = searchMessageOutboxAlert.length;

        totalMessages = (countMessagesInbox + countMessagesOutbox);
        console.log("La totalidad de los mensajes en inbox y en outbox Una sumatoria de contadores resultado un numero --->", totalMessages)
        //aqui tenemos la sumatoria de mensajes en Inbox y Outbox


        req.session.countMessages = totalMessages
        countMessages = req.session.countMessages;
        //:::::::: End of message ::::::::

        const currentBanner = await modelBannerFront.find({ "active" : true, "delete" : false });
        //console.log("Esto es currentBanner ----->", currentBanner);
    
        const currentNewsDay = await modelNewsDay.find({ "active" : true, "delete" : false });
        //console.log("Esto es currentNewsDay ----->", currentNewsDay);
    
        const profileLast = await modelProfile.find({},{ username: 1, country: 1, countryCode: 1, avatarPerfil: 1, mailhash: 1 }).sort({ createdAt : -1 }).limit(8);

        async function negotiationsBuySell(){
            // :::::: Aqui obtengo la cantidad de negotiationsBuySell ::::::::
            const searchBuy = [];
            const searchSell = [];
        
            const searchOneBuy = await modelBuySell.find({  $and : [{usernameBuy : username},{ closeOperationBuy : false }] });
            if (searchOneBuy){
                searchBuy.push(...searchOneBuy);
            }
            const searchTwoBuy = await modelNegotiation.find({ $and : [{ usernameBuy : username }, { closeOperationBuy : false }]} );
            if (searchTwoBuy){
                searchBuy.push(...searchTwoBuy);
            }
            //aqui vamos a buscar todos los carritos pendinte por pagar que tiene este usuario
            const searchShoppingCartBuy = await modelShoppingCart.find({ $and : [{ customerId: user._id }, { CommentSeller: "no_comment" } ]  });
            if (searchShoppingCartBuy){
                searchBuy.push(...searchShoppingCartBuy);
            }    

            const searchOneSell = await modelBuySell.find({ $and : [{usernameSell : username}, { closeOperationSeller : false }] });
            if (searchOneSell){
                searchSell.push(...searchOneSell);
            }         
            const searchTwoSell = await modelNegotiation.find({ $and : [{ usernameSell : username }, { closeOperationSeller : false }]} );
            if (searchTwoSell){
                searchSell.push(...searchTwoSell);
            }
            //aqui vamos a buscar todos los carritos pendinte por pagar que tiene este usuario    
            const searchShoppingCartSell = await modelShoppingCart.find({ $and : [{ sellerId: user._id }, { CommentBuy: "no_comment" } ]  });
            if (searchShoppingCartSell){
              searchSell.push(...searchShoppingCartSell);
            }     
    
            countNegotiationsBuySell = (searchBuy.length + searchSell.length);
            req.session.countNegotiationsBuySell = countNegotiationsBuySell; // ---> Esto es lo que se propagara por toda la aplicacion.
            //Nota: La linea de arriba es la session que guarda la cantidad de negociacione sy buySell que tiene el usuario.
            //console.log("Esto es countNegotiationsBuySell ---->", countNegotiationsBuySell);
        }

                


        //Esta funcion ejecuta una consulta en todos los anuncios que tengan ofertas y las atrapa para 
        async function searchOffert(){
            //ahora es momento de consultar en todas las colecciones de articulos en busca de ofertas.
            const respItems = await modelItems.find( { $and: [{ offer: true },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respItems.length > 0) {
                boxOffert.push(...respItems); // Usar el spread operator para añadir los elementos al array
            }
                
            const respAerop = await modelAirplane.find( { $and: [{ offer: true },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respAerop.length > 0){
                boxOffert.push(...respAerop);
            }

            const respAutom = await modelAutomotive.find( { $and: [{ offer: true },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respAutom.length > 0){
                boxOffert.push(...respAutom);
            }

            const respArtes = await modelArtes.find( { $and: [{ offer: true },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respArtes.length > 0){
                boxOffert.push(...respArtes);
            }

            const respReals = await modelRealstate.find( { $and: [{ offer: true },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respReals.length > 0){
                boxOffert.push(...respReals);
            }

            const respServi = await modelService.find( { $and: [{ offer: true },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respServi.length > 0){
                boxOffert.push(...respServi);
            }

            const respNauti = await modelNautical.find( { $and: [{ offer: true },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respNauti.length > 0){
                boxOffert.push(...respNauti);
            }

            const respAucti = await modelAuction.find( { $and: [{ offer: true },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respAucti.length > 0){
                boxOffert.push(...respAucti);
            }

        }

        //Esta funcion ejecuta una consulta en todos los anuncios que tengan mas vistas y que no esten en oferta
        async function searchBestView(){
            //ahora es momento de consultar en todas las colecciones de articulos en busca de ofertas.
            const respItems = await modelItems.find( { $and: [{ offer: false },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respItems.length > 0) {
                boxBestView.push(...respItems); // Usar el spread operator para añadir los elementos al array
            }
                
            const respAerop = await modelAirplane.find( { $and: [{ offer: false },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respAerop.length > 0){
                boxBestView.push(...respAerop);
            }

            const respAutom = await modelAutomotive.find( { $and: [{ offer: false },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respAutom.length > 0){
                boxBestView.push(...respAutom);
            }

            const respArtes = await modelArtes.find( { $and: [{ offer: false },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respArtes.length > 0){
                boxBestView.push(...respArtes);
            }

            const respReals = await modelRealstate.find( { $and: [{ offer: false },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respReals.length > 0){
                boxBestView.push(...respReals);
            }

            const respServi = await modelService.find( { $and: [{ offer: false },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respServi.length > 0){
                boxBestView.push(...respServi);
            }

            const respNauti = await modelNautical.find( { $and: [{ offer: false },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respNauti.length > 0){
                boxBestView.push(...respNauti);
            }

            const respAucti = await modelAuction.find( { $and: [{ offer: false },{countryCode}] } ).sort( {view : -1} ).limit(10);
            if (respAucti.length > 0){
                boxBestView.push(...respAucti);
            }

        }


        negotiationsBuySell()
            .then(()=>{
                searchOffert()
                    .then(()=>{
                        searchBestView()
                            .then(()=>{
                                console.log("Aqui lo recaudado de las ofertas");
                                console.log("boxOffert ----------------con user---------------->",boxOffert);
                                res.render('page/home', {user, success, stopped, dataLocked, methodLoging, countMessages, countNegotiationsBuySell, searchProfile, currentBanner, currentNewsDay, boxOffert, boxBestView, profileLast })
                            })
                            .catch((err)=>{
                                console.log("Ha ocurrido un error en la function searchBestView()")
                                res.render('page/home', {user, success, stopped, dataLocked, methodLoging, countMessages, countNegotiationsBuySell, searchProfile, currentBanner, currentNewsDay, boxOffert, boxBestView, profileLast })
                            })
                   
                        
                    })
                    .catch((err)=>{
                        console.log("Ha ocurrido un error en la function searchOffert()")
                    })

            })
            .catch((err)=>{
                console.log("Ha ocurrido un error en la function negotiationsBuySell()")
            })



    } else {

        const currentBanner = await modelBannerFront.find({ "active" : true, "delete" : false });
        //console.log("Esto es currentBanner ----->", currentBanner);
    
        const currentNewsDay = await modelNewsDay.find({ "active" : true, "delete" : false });
        //console.log("Esto es currentNewsDay ----->", currentNewsDay);

        const profileLast = await modelProfile.find({},{ username: 1, country: 1, countryCode: 1, avatarPerfil: 1, mailhash: 1 }).sort({ createdAt : -1 }).limit(8);
        //console.log("--------------------------------------------> :");
        //console.log("profileLast :", profileLast);

        //Esta funcion ejecuta una consulta en todos los anuncios que tengan ofertas y las atrapa para 
        async function searchOffert(){
            //ahora es momento de consultar en todas las colecciones de articulos en busca de ofertas.
            const respItems = await modelItems.find({ offer: true }).sort( {view : -1} ).limit(10);
            if (respItems.length > 0) {
                boxOffert.push(...respItems); // Usar el spread operator para añadir los elementos al array
            }
                
            const respAerop = await modelAirplane.find({ offer : true }).sort( {view : -1} ).limit(10);
            if (respAerop.length > 0){
                boxOffert.push(...respAerop);
            }

            const respAutom = await modelAutomotive.find({ offer : true }).sort( {view : -1} ).limit(10);
            if (respAutom.length > 0){
                boxOffert.push(...respAutom);
            }

            const respArtes = await modelArtes.find({ offer : true }).sort( {view : -1} ).limit(10);
            if (respArtes.length > 0){
                boxOffert.push(...respArtes);
            }

            const respReals = await modelRealstate.find({ offer : true }).sort( {view : -1} ).limit(10);
            if (respReals.length > 0){
                boxOffert.push(...respReals);
            }

            const respServi = await modelService.find({ offer : true }).sort( {view : -1} ).limit(10);
            if (respServi.length > 0){
                boxOffert.push(...respServi);
            }

            const respNauti = await modelNautical.find({ offer : true }).sort( {view : -1} ).limit(10);
            if (respNauti.length > 0){
                boxOffert.push(...respNauti);
            }

            const respAucti = await modelAuction.find({ offer : true }).sort( {view : -1} ).limit(10);
            if (respAucti.length > 0){
                boxOffert.push(...respAucti);
            }

        }


        //Esta funcion ejecuta una consulta en todos los anuncios que tengan mas vistas y que no esten en oferta
        async function searchBestView(){
            //ahora es momento de consultar en todas las colecciones de articulos en busca de ofertas.
            const respItems = await modelItems.find({ offer: false }).sort( {view : -1} ).limit(10);
            if (respItems.length > 0) {
                boxBestView.push(...respItems); // Usar el spread operator para añadir los elementos al array
            }
                
            const respAerop = await modelAirplane.find({ offer: false }).sort( {view : -1} ).limit(10);
            if (respAerop.length > 0){
                boxBestView.push(...respAerop);
            }

            const respAutom = await modelAutomotive.find({ offer: false }).sort( {view : -1} ).limit(10);
            if (respAutom.length > 0){
                boxBestView.push(...respAutom);
            }

            const respArtes = await modelArtes.find({ offer: false }).sort( {view : -1} ).limit(10);
            if (respArtes.length > 0){
                boxBestView.push(...respArtes);
            }

            const respReals = await modelRealstate.find({ offer: false }).sort( {view : -1} ).limit(10);
            if (respReals.length > 0){
                boxBestView.push(...respReals);
            }

            const respServi = await modelService.find({ offer: false }).sort( {view : -1} ).limit(10);
            if (respServi.length > 0){
                boxBestView.push(...respServi);
            }

            const respNauti = await modelNautical.find({ offer: false }).sort( {view : -1} ).limit(10);
            if (respNauti.length > 0){
                boxBestView.push(...respNauti);
            }

            const respAucti = await modelAuction.find({ offer: false }).sort( {view : -1} ).limit(10);
            if (respAucti.length > 0){
                boxBestView.push(...respAucti);
            }

        }

      
        searchOffert()
            .then(()=>{
                searchBestView()
                    .then(()=>{
                        console.log("Aqui lo recaudado de las ofertas");
                        //console.log("boxOffert ---------------sin user------------------->",boxOffert);
                        res.render('page/home', {user, success, stopped, dataLocked, methodLoging, countMessages, searchProfile, currentBanner, currentNewsDay, boxOffert, boxBestView, profileLast })
                    })
                    .catch((err)=>{
                        //console.log("Ha ocurrido un error en la function searchOffert()")
                        res.render('page/home', {user, success, stopped, dataLocked, methodLoging, countMessages, searchProfile, currentBanner, currentNewsDay, boxOffert, boxBestView, profileLast })
                    })
                
                
            })
            .catch((err)=>{
                
            })


    }





    
});

routes.get('/restcountries', async(req, res)=>{
    
    try {
        res.json(countries)
    } catch (error) {
        console.log('Ha ocurrido un error', error);
    }

});

routes.get('/requireDate', async(req, res)=>{
    const rateUpdate = await modelRateCurrency.find();
    const rateSort = rateUpdate.reverse()[0];
    console.log("Esto es rateSort >>", rateSort);
    console.log("******RATE UPDATE******");

    //vamos a sacar la fecha del servidor
    const date = new Date()
    //const dia = date.getDate(); const mes = date.getMonth() + 1; const anio = date.getFullYear();
    //const hora = date.getHours()
    //const minu = String(date.getMinutes()).padStart(2, '0'); // Asegura que los minutos tengan dos dígitos
    //const segu = String(date.getSeconds()).padStart(2, '0'); // Asegura que los segundos tengan dos dígitos

    //const timerNowServ = `${dia}-${mes}-${anio} ${hora}:${minu}:${segu}`;
    const response = { date };
    //console.log("Esto es response >>", response);

    res.json(response);
    
});

routes.get('/alertNotProfile', async (req, res)=>{

    try{

        if (req.session.user){
            const user = req.session.user;
            const userId = user._id;
            //console.log("este es el id del usuario en cuestion --->", userId);
            const profile = await modelProfile.find({ indexed : userId }); 
            //console.log("muestrame el perfil del usuario ----->",  profile );
            res.json({profile})
        }

    } catch (error){
        console.log("ha ocurrido un error", error)
    }

});

routes.post('/locationMarket', async (req, res)=>{
    try {
        console.log('Estoy llegando a locationMarket');
        
        const { idUser, countryMarket, countryMarketCode, flag } = req.body;
        console.log(`idUser: ${idUser}, countryMarket: ${countryMarket}, countryMarketCode: ${countryMarketCode}, flag: ${flag}`);

        const updateUser = await modelUser.findByIdAndUpdate(idUser, { $set: { seeMarket: { countryMarket, countryMarketCode, flag } } }, {new: true});
        console.log("updateUser ---->", updateUser);
        req.session.user = updateUser //aqui actualizamos la session de user
        res.json({code : 1, msg : updateUser});

    } catch (error) {
        console.log("Ha ocurrido un error, intente luego.", error);
        res.json({code : 0, msg : "Ha ocurrido un error"});
    }
});

//top 50 de tiendas mas vistas.
routes.get('/mosaico-store-view', async (req,res)=>{
    const resultStore = await modelProfile.find().sort({ view : -1 }).limit(50);
    res.json(resultStore);
});

//:::::: esto es la informacion del mosaico que se envia al home via json :::::::
routes.get('/mosaico', async (req,res)=>{
    const boxResult = [];

    const resultArt = await modelArtes.find().sort({ createdAt : -1 }).limit(4);
    if (resultArt) {
        //console.log('esto es resultArt', resultArt);
        boxResult.push(...resultArt);
    }
    const resultAir = await modelAirplane.find().sort({ createdAt : -1 }).limit(4);
    if (resultAir) {
        //console.log('esto es resultAir', resultAir);
        boxResult.push(...resultAir);
    }
    const resultIte = await modelItems.find().sort({ createdAt : -1 }).limit(16);
    if (resultIte) {
        //console.log('esto es resultIte', resultIte);
        boxResult.push(...resultIte);
    }
    const resultAut = await modelAutomotive.find().sort({ createdAt : -1 }).limit(4);
    if (resultAut) {
        //console.log('esto es resultAut', resultAut);
        boxResult.push(...resultAut);
    }
    const resultRea = await modelRealstate.find().sort({ createdAt : -1 }).limit(4);
    if (resultRea) {
        //console.log('esto es resultRea', resultRea);
        boxResult.push(...resultRea);
    }
    const resultNau = await modelNautical.find().sort({ createdAt : -1 }).limit(4);
    if (resultNau) {
        //console.log('esto es resultRea', resultNau);
        boxResult.push(...resultNau);
    }
    const resultSer = await modelService.find().sort({ createdAt : -1 }).limit(4);
    if (resultSer) {
        //console.log('esto es resultSer', resultSer);
        boxResult.push(...resultSer);
    }
    const resultAuc = await modelAuction.find().sort({ createdAt : -1 }).limit(4);
    if (resultAuc) {
        //console.log('esto es resultSer', resultSer);
        boxResult.push(...resultAuc);
    }

    res.json(boxResult);

});

//mosaico de los artiulos y servicios mas vistos 
routes.get('/mosaico-more-view', async (req,res)=>{
    const boxResult = [];

    const resultArt = await modelArtes.find().sort({ view : -1 }).limit(4);
    if (resultArt) {
        //console.log('esto es resultArt', resultArt);
        boxResult.push(...resultArt);
    }
    const resultAir = await modelAirplane.find().sort({ view : -1 }).limit(4);
    if (resultAir) {
        //console.log('esto es resultAir', resultAir);
        boxResult.push(...resultAir);
    }
    const resultIte = await modelItems.find().sort({ view : -1 }).limit(16);
    if (resultIte) {
        //console.log('esto es resultIte', resultIte);
        boxResult.push(...resultIte);
    }
    const resultAut = await modelAutomotive.find().sort({ view : -1 }).limit(4);
    if (resultAut) {
        //console.log('esto es resultAut', resultAut);
        boxResult.push(...resultAut);
    }
    const resultRea = await modelRealstate.find().sort({ view : -1 }).limit(4);
    if (resultRea) {
        //console.log('esto es resultRea', resultRea);
        boxResult.push(...resultRea);
    }
    const resultNau = await modelNautical.find().sort({ view : -1 }).limit(4);
    if (resultNau) {
        //console.log('esto es resultRea', resultNau);
        boxResult.push(...resultNau);
    }
    const resultSer = await modelService.find().sort({ view : -1 }).limit(4);
    if (resultSer) {
        //console.log('esto es resultSer', resultSer);
        boxResult.push(...resultSer);
    }
    const resultAuc = await modelAuction.find().sort({ view : -1 }).limit(4);
    if (resultAuc) {
        //console.log('esto es resultSer', resultSer);
        boxResult.push(...resultAuc);
    }

    res.json(boxResult);

});    

//:::::: esto es la informacion de las barras porcentuales que se envia al home via json :::::::
routes.get('/percent', async (req,res)=>{
    const percentResult = [];

    const percentArt = await modelArtes.find().count();
    //console.log('esto es percentArt', percentArt);
    if (percentArt >= 0) {
        percentResult.push({ 'arte' : percentArt});
    }
    const percentAir = await modelAirplane.find().count();
    if (percentAir >= 0) {
        percentResult.push({ 'aeronautico' : percentAir});
    }
    const percentIte = await modelItems.find().count();
    if (percentIte >= 0) {
        percentResult.push({ 'items' : percentIte});
    }
    const percentAut = await modelAutomotive.find().count();
    if (percentAut >= 0) {
        percentResult.push({ 'automotriz' : percentAut});
    }
    const percentRea = await modelRealstate.find().count();
    if (percentRea >= 0) {
        percentResult.push({ 'realstate' : percentRea});
    }
    const percentNau = await modelNautical.find().count();
    if (percentNau >= 0) {
        percentResult.push({ 'nautico' : percentNau});
    }
    const percentSer = await modelService.find().count();
    if (percentSer >= 0) {
        percentResult.push({ 'servicio' : percentSer});
    }
    const percentSub = await modelAuction.find().count();
    console.log("************************percentSub***********************************")
    console.log("Esto es percentSub ------------------------------------->", percentSub);
    if (percentSub >= 0) {
        percentResult.push({ 'subasta' : percentSub});
    }

    res.json(percentResult);

});


routes.get('/myaccount/signin-change', async (req, res)=>{
 
    const user = req.session.user;
    const signIn = await modelBackgroundSign.find( {active : true, typeBackground : "SignIn"} );
    console.log("Esto es signIn", signIn);

    res.render('page/signin-change', {user, signIn});

});

routes.get('/myaccount/signin', async (req,res)=>{
    const user = req.session.user;

    const passwError = req.session.passwError; 
    const userError = req.session.userError;
    const registered = req.session.registered; //¡Se ha registrado exitosamente!
    const donePasswSuccess = req.session.donePasswSuccess; //"Cambio exitoso de Contraseña.";
    const seeBot = req.session.seeBot; //"Espero te hayas divertido con Blissenet.com";
    const recaptchaFail = req.session.recaptchaFail; //"La verificacion de reCAPTCHA ha Fallado";
    const seeBotObjec = req.session.seeBotObjec; // { "message" : "Hemos detectado un posible ataque", "score" : score };

    delete req.session.passwError;
    delete req.session.userError;
    delete req.session.registered;
    delete req.session.donePasswSuccess;
    delete req.session.seeBot;
    delete req.session.recaptchaFail;
    delete req.session.seeBotObjec;

    if (user === undefined){
        //lo que obtiene esta const es un array con un objeto que posee la imagen de fondo del signIn.
        const signIn = await modelBackgroundSign.find( {active : true, typeBackground : "SignIn"} );
        console.log("Esto es signIn", signIn);
        res.render('page/signin', {user, signIn, passwError, userError, registered, donePasswSuccess, recaptchaFail, seeBot, seeBotObjec});
    } else {
        //console.log("ya estas logeado");
        res.redirect('/');
    }
    
});

routes.post('/myaccount/signin', async(req,res)=>{
    const {email, password, recaptchaResponse} = req.body;
    //console.log(`email : ${email} password : ${password} recaptchaResponse : ${recaptchaResponse}`)
    const search = await modelUser.findOne({ email : email, emailVerify : true });
    const secretKey = "6LccKFYlAAAAAG48hyi4xBbeRMYMXfwMI7BdA7MV"; // -->Esto es la Clave Secreta que va aqui en el servidor
    //data-sitekey="6LccKFYlAAAAAKiLwTw_Xz2l7_Qm_6PTe7_RyEG0"  --->Esto es la Clave de Sitio esta en el front
    //Para saber mas ir al fronted page/signis.ejs 
    //La interaccion de ambas claves es fundamental para lograr enviar el token a la api de google reCAPTCHA.
    //console.log("secretKey -->", secretKey);

    const datos = {
        secret : secretKey,
        response : recaptchaResponse
    };

    //console.log("Esto es datos ->", datos);

           
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

                if (search){
                    console.log("esto es search es: ", search)
                    let id = search._id;
                    let hashPassword = search.password;
                    let Stopped = search.stopped;
                    let idSession = search.idSession;
        
                    async function hashing(){
                        const compares = await bcrypt.compare(password, hashPassword);
                        console.log("resul de la compracion--->",compares)
        
                        if (compares == true) {
        
                            if (Stopped == false){
        
                                //console.log("password acertado, bienvenido")
                                req.session.success = "¡Bienvenido! Has entrado a Blissenet.com. Tu red de mercado mundial.";
                                
                                const user = search
                                req.session.user = user;
                                res.redirect('/')


                            } else {
        
                                const stoppedUser = await modelStopped.find( {indexed : id, status : 'locked'} );
                                console.log("Aqui informacion del bloqueo ->", stoppedUser); const stopped = stoppedUser[0];
                                const username = stopped.username; const ban = stopped.ban; const dates = new Date(stopped.createdAt);
                                const dia = dates.getDate(); const mes = dates.getMonth()+1; const anio = dates.getFullYear();
                                const date = `${dia}-${mes}-${anio}`;
                                req.session.dataLocked = {username, ban, date};
                                console.log('username' , username); console.log('ban' , ban); console.log('date' , date);
                                req.session.stopped = "Su cuenta ha sido baneada por infringir nuestras normas.";
                                res.redirect('/')
        
                            }
        
            
                        } else {
                            console.log("Password Errado")
                            req.session.passwError = "Password Errado";
                            res.redirect('/myaccount/signin');
                        }
                    }
        
                    hashing()
        
                    
                } else {
                    console.log("usuario no existe")
                    req.session.userError = "Usuario no existe, vuelva a intoducir el correo con que registro su cuenta";
                    res.redirect('/myaccount/signin');
                }   
                                 
            } else {
                req.session.seeBotObjec = { "message" : "Hemos detectado un posible ataque", "score" : score };
                req.session.seeBot = "Hemos detectado un comportamiento inusual en Blissenet.com";
                res.redirect('/myaccount/signin');
                console.log("Eres un fucking bot");
            }    
        } else {
            req.session.recaptchaFail = "La verificacion de reCAPTCHA ha Fallado";
            res.redirect('/myaccount/signin');
            console.log("La verificacion de reCAPTCHA ha Fallado");
        }

    })
    .catch( err => console.log(err));       

});

routes.get('/myaccount/signup', async (req,res)=>{
    const user = req.session.user;

    const mailExist = req.session.email;
    const passwNoMatch = req.session.passwNoMatch;
    const passMaxLength = req.session.passMaxLength;
    const usernameExist = req.session.usernameExist;
    const usernameErr = req.session.usernameErr;
    const seeBot = req.session.seeBot; //"Espero te hayas divertido con Blissenet.com";
    const recaptchaFail = req.session.recaptchaFail; //"La verificacion de reCAPTCHA ha Fallado";
    const seeBotObjec = req.session.seeBotObjec; // { "message" : "Hemos detectado un posible ataque", "score" : score };


    delete req.session.email;
    delete req.session.passwNoMatch;
    delete req.session.passMaxLength;
    delete req.session.usernameExist;
    delete req.session.usernameErr;
    delete req.session.seeBot;
    delete req.session.recaptchaFail;
    delete req.session.seeBotObjec;

    if (user === undefined){

        //lo que obtiene esta const es un array con un objeto que posee la imagen de fondo del signUp.
        const signUp = await modelBackgroundSign.find({active : true, typeBackground : "SignUp"});
        res.render('page/signup', {user, signUp,  mailExist, passwNoMatch, passMaxLength, usernameExist, usernameErr, recaptchaFail, seeBot, seeBotObjec});

    } else {
        //console.log("estas logeado no tienes acceso a este apartado");
        res.redirect('/');
    }


})                                                                

routes.post('/myaccount/signup', async(req,res)=>{
    
    const secretKey = "6LfVgFYlAAAAAGPSo7nb1KZ48cJN-DH-SSRAJ2c2"; // -->Esto es la Clave Secreta que va aqui en el servidor
    //data-sitekey="6LfVgFYlAAAAAAdKk3Ksy7jHovwp6rK90s5kmNOK"  --->Esto es la Clave de Sitio esta en el front
    
    //tomamos los datos del formulario y se guardan en constantes
    const {username, email, password, confirmPassword, token, recaptchaResponse} = req.body
    //console.log(`username : ${username}, email : ${email}, password : ${password}, confirmPassword : ${confirmPassword}, token : ${token} recaptchaResponse : ${recaptchaResponse}`)
    const emailLower = email.toLowerCase();//transformo en minisculas el correo
    const mailhash = hash.MD5(emailLower); 
    
    const blissName = username.trim(); //--> Este es el nombre que vamos a mostrar en las tiendas y tarjetas 
    let usernameParse; // esta variable guarda el nombre parseado sin espacios en blanco. Para URL y codigos QR
  
    usernameParse = username.replace(/\s+/g, '').trim(); //Quitamos todos los espacios.
    console.log("usernameParse", usernameParse);

    const search = await modelUser.findOne({email}) //consulta en la base de datos del campo email

    const result = await modelUser.findOne({ username: new RegExp( '^' + usernameParse + '$','i' ) });

    const datos = {
        secret : secretKey,
        response : recaptchaResponse
    };

    //console.log("Esto es datos ->", datos);

           
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
        //const score = 0.4; //para test
        console.log(`success -> ${success} | score -> ${score}`);


        if (success === true){
            if (score >= 0.5){
                console.log("Es un humano");    
   
                if (usernameParse.length > 5 && usernameParse.length <= 24 ){
                    // el username debe ser minimo 6 y maximo 24 
                    if (password == confirmPassword) {
                        //console.log('password concuerda con la confirmacion')

                        //si existe tendremos un objeto sino tendremos un valor null
                        //console.log(search);
                        if (search) {
                            //console.log('correo ya existe')
                            req.session.email = "Este email ya esta registrado";
                            res.redirect('/myaccount/signup');
                        } else {

                            
                                if (password == null || password.length <= 6 ) {
                                    //console.log("no sean tramposo mete un dato que te estoy pillando");
                                    req.session.passMaxLength = "El campo no puede estar vacio o contener menos de seis (6) caracteres."
                                    res.redirect('/myaccount/signup')
                                } else {
                                    //const result = await modelUser.findOne({ username: new RegExp( '^' + usernameParse + '$','i' ) });
                                    console.log("Esto es result ---->", result);
                                    if (result !== null) {

                                        console.log("¡Este usuario existe! Debe buscar un nombre de usario unico.")
                                        req.session.usernameExist = "¡Este nombre de username ya existe!"
                                        res.redirect('/myaccount/signup');

                                    } else {
                                        console.log("ha pasado todos los criterios y pasa a la segunda fase de registro");
                                        
                                        let hashPassword, newTN, newToken;

                                        async function hashing(){
                                            hashPassword = await bcrypt.hash(password, 6);
                                            console.log("password--->", password);
                                            console.log("Este es el hash del password--->",hashPassword);
                                            /* const compares = await bcrypt.compare(password, hashPassword);
                                            console.log("resul de la compracion--->",compares)*/
                                            //crear un token random de 6 caracteres

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
                                            console.log("newToken", newToken);

                                        }

                                        async function createUser(){
                                            const newUser = new modelUser({username: usernameParse, blissName, email: emailLower , password : hashPassword, mailhash, token: newToken});
                                            const saveUser = await newUser.save();
                                            console.log(saveUser);
                                        }

                                        async function sendToken(){
                                            
                                            
                                            // detalle del correo a enviar 
                                            const message = "Confirmar Correo Electronico."
                                            const contentHtml = `
                                            <h2 style="color: black">Token Enviado Para Validar Cuenta. </h2>
                                            <ul> 
                                                <li> cuenta : ${email} </li> 
                                                <li> asunto : ${message} </li>
                                            <ul>
                                            <h2> ${newToken} </h2>
                                            `

                                            //enviar correo
                                            //(SMTP)-> Simple Mail Transfer Protocol --> es el protocolo con que los servidores se comunican a traves de correos.
                                            const emailMessage = {
                                                from: "Blissenet<sistemve@blissenet.com>", //remitente
                                                to: email,
                                                subject: "Ya casi esta lista su cuenta - Blissenet", //objeto
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
                                        

                                        hashing()
                                            .then(()=>{
                                                createUser()
                                                    .then(()=>{
                                                        sendToken()
                                                            .then(()=>{
                                                                req.session.mailSent =  "Token enviado al correo para validación, 90 segundos para su confirmación.";
                                                                req.session.datauser = {usernameParse, blissName, email}; // aqui guardamos los datos necesarios para trabajar en signup-emailverify
                                                                res.redirect('/myaccount/signup-emailverify')
                                                            })
                                                            .catch((error)=>{
                                                                console.log("Ha habido un error en sendToken", error);
                                                            })

                                                    })
                                                    .catch((error)=>{
                                                        console.log("Ha habido un error en createUser()", error);
                                                    })
                                                
                                            })
                                            .catch((error)=>{
                                                console.log("Ha habido un error em hashing()", error);
                                            })

                                    }
                                        
                                }

                        }

                    } else {
                        console.log('password no concuerda con la confirmacion')
                        req.session.passwNoMatch = "¡Error en confirmacion de password, vuelva a intentar!"
                        res.redirect('/myaccount/signup')
                    }

                } else {
                    console.log('No cumple con la condicion de carcateres su usuario');
                    req.session.usernameErr = "¡Su username debe tener entre 6 y 22 caracteres!"
                    res.redirect('/myaccount/signup')
                }    

            } else {
                req.session.seeBotObjec = { "message" : "Hemos detectado un posible ataque", "score" : score };
                req.session.seeBot = "Hemos detectado un comportamiento inusual en Blissenet.com";
                res.redirect('/myaccount/signup');
                console.log("Eres un fucking bot");
            }    
        } else {
            req.session.recaptchaFail = "La verificacion de reCAPTCHA ha Fallado";
            res.redirect('/myaccount/signup');
            console.log("La verificacion de reCAPTCHA ha Fallado");
        }
    
    })
    .catch( err => console.log(err)); 

});

routes.get('/myaccount/signup-emailverify', async(req,res)=>{
    const user = req.session.user;
    const validData = req.session.datauser;
    const mailSent = req.session.mailSent;  //Token enviado al correo para validación, 90 segundos para su confirmación.
    
    delete req.session.mailSent;
    console.log("validData", validData);

    // buscamos el background de register
    const signUp = await modelBackgroundSign.find({active : true, typeBackground : "SignUp"});

    res.render('page/signup-emailverify', {user, validData, signUp, mailSent});
});

//myaccount/signup-emailverify
routes.post('/myaccount/signup-emailverify', async(req,res)=>{
 
    try {
        const { username, blissName, email, token } = req.body;
        console.log(`${username}  ${email}  ${token}`);
        // buscamos el background de register
        const search = await modelUser.find({username});
    
        if (search){
            console.log("Esto es search", search);
            const Token = search[0].token;
    
            if (Token == token){
                console.log("el token es igual, su cuenta esta validad y puede hacer uso de ella");
                
                //cambiamos el estatus de verificacion de email a true.
                async function verify(){
                    const verify = await modelUser.findOneAndUpdate({username}, { emailVerify : true });
                }

                // enviamos correo de bienvenida.
                async function sendMail(){
                            
                    /* detalle del correo a enviar */
                    const message = "Registro exitoso."
                    const contentHtml = `
                    <h2 style="color: black"> Bienvenid@ a Blissenet.com. </h2>
                    <ul> 
                        <li> cuenta : ${email} </li>
                        <li> usuario : ${blissName} </li> 
                        <li> asunto : ${message} </li>
                    <ul>
                    <h3 style="color: black;"> Estimado usuario,</h3>
                    <p style="color: black;"> ¡Felicitaciones! Ahora formas parte de la comunidad Blissenet.com. Te animamos a leer detenidamente nuestros "Términos y Condiciones" para sacar el máximo provecho de esta magnífica herramienta. Con tu cuenta, tendrás la oportunidad de crear tu propia tienda virtual y expandir tu emprendimiento, negocio o empresa en Internet.
                    </p>
                    <p style="color: black;"> El siguiente paso es crear tu perfil y personalizar tu tienda. Podrás darle un toque único con colores, un atractivo banner y un avatar que represente tu marca y atraiga a la comunidad.  
                    </p>
                    <h4 style="color: black;"> <b> ¿Aún estás aquí? ¡Vamos, hay una tienda por armar! <b></h4>
                    <h4 style="color: black;"> ¡Gracias por unirte a Blissenet.com! </h4>
                    `

                    //enviar correo
                    //(SMTP)-> Simple Mail Transfer Protocol --> es el protocolo con que los servidores se comunican a traves de correos.
                    const emailMessage = {
                        from: "Blissenet<sistemve@blissenet.com>", //remitente
                        to: email,
                        subject: "🚀 Registro exitoso - Blissenet", //objeto
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

                verify()
                    .then(()=>{
                        sendMail()
                            .then(()=>{ 
                                req.session.registered = "¡Se ha registrado exitosamente!";
                                res.redirect('/myaccount/signin');
                            })
                            .catch((error)=>{
                                console.log("Ha habido un error", error);
                            })
                    })
                    .catch((error)=>{
                        console.log("Ha habido un error", error);
                    })
                    
            } else {
                console.log("Error de token, Registro será eliminado");
                // buscamos el background de register y eliminamos (Mantenemos nuestra DB limpia);
                const searchDel = await modelUser.deleteOne({username, email});
                res.redirect('/myaccount/signup');
            }
        }
    } catch (error) {
        console.log("Ha ocurrido un error", error);
    }
    
});

routes.post('/myaccount/signup-delete', async(req,res)=>{
    
    try {

        console.log(req.body);
        const { user, email } = req.body;

        // buscamos el background de register y eliminamos (Mantenemos nuestra DB limpia);
        const searchDel = await modelUser.deleteOne({username : user, email : email});
        
        const response = { resp: "Registro Eliminado" , type : "delete"};
        res.json(response);

    } catch (error) {
        
        const response = { resp: "error" , type : "error"};
        res.json(response);
        

    }


        
});


/* aqui abajo el forgotten passw */
routes.get('/myaccount/signin-forgottenpassw', async(req,res)=> {
    const user = req.session.user;
    console.log("Estamos en signin-forgottenpassw");
    console.log("user ->", user);

    
    const seeBot = req.session.seeBot; //"Espero te hayas divertido con Blissenet.com";
    const recaptchaFail = req.session.recaptchaFail; //"La verificacion de reCAPTCHA ha Fallado";
    const seeBotObjec = req.session.seeBotObjec; // { "message" : "Hemos detectado un posible ataque", "score" : score };
    const emailNofound = req.session.emailNofound; //"Cuenta no encontrada. Verifique em email con que se registro.";

    delete req.session.seeBot;
    delete req.session.recaptchaFail;
    delete req.session.seeBotObjec;
    delete req.session.emailNofound;


    if (user === undefined){
        //lo que obtiene esta const es un array con un objeto que posee la imagen de fondo del signIn.
        const signIn = await modelBackgroundSign.find( {active : true, typeBackground : "SignIn"} );
        console.log("Esto es signIn", signIn );
        res.render('page/signin-forgottenpassw', {user, signIn, recaptchaFail, seeBot, seeBotObjec, emailNofound})
    } else {
        //console.log("ya estas logeado");
        res.redirect('/');
    }
            
});

routes.post('/myaccount/signin-forgottenpassw', async(req, res)=> {
       
    const secretKey = "6LfhgFIlAAAAAD_tlCj6EsY60pqaWNWJmAnNIi-7"; // -->Esto es la Clave Secreta que va aqui en el servidor
    //   data-sitekey="6LfhgFIlAAAAAODB3P24Ea32aXgbqEHb3iVJGrJP"  --->Esto es la Clave de Sitio esta en el front
    
    const {email, recaptchaResponse} = req.body

    const emailSearch = await modelUser.findOne({ email });
    let newToken, newTN; 
    
    //console.log("emailSearch --->", emailSearch);
    //console.log( `email {email} | recaptchaResponse {recaptchaResponse}`);

    const datos = {
        secret : secretKey,
        response : recaptchaResponse
    };

    //console.log("Esto es datos ->", datos);

           
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
        //const score = 0.4; //para test
        console.log(`success -> ${success} | score -> ${score}`);


        if (success === true){
            if (score >= 0.5){
                console.log("Es un humano");  

     
                if (emailSearch) {

                    const chatId = emailSearch.blissBot.chatId; //este es el chatId del user.
                    console.log( `mail encontrado ${emailSearch.email}` );

                    async function createToken(){
                        createNewToken()
                        function createNewToken(){
                            let ran = Math.random();
                            let random = Math.ceil(ran * 1000000);
                            newTN = random.toString(); //este estrin de numeros tiene que ser de 6 caracteres.;
                        }    

                        while(newTN.length < 6){
                            createNewToken()
                        } 

                        newToken = `${newTN}`;
                        //console.log("newToken", newToken);

                    }

                    async function editToken(){
                        //actualizamos el campo token en la Base de datos.
                        console.log( "su nuevo Token es : ", newToken );
                        const edit = await modelUser.updateOne({email}, {token : newToken})
                                                                                    
                        console.log(edit);
                    }

                    async function sendToken(){
                        //enviamos al correo el nuevo token a usar
                        const message = "Confirmación de Cuenta."
                        const contentHtml = `
                        <h2 style="color: black"> Restableciendo Contraseña. </h2>
                        <ul> 
                            <li> cuenta : ${email} </li> 
                            <li> asunto : ${message} </li>
                        <ul>
                        <h2> ${newToken} </h2>
                        <p> <b> Estimado usuario, </b> Si usted no ha solicitado restablecer su Contraseña, deje este correo sin efecto.</p>
                        `

                        //enviar correo
                        //(SMTP)-> Simple Mail Transfer Protocol --> es el protocolo con que los servidores se comunican a traves de correos.
                        const emailMessage = {
                            from: "Blissenet<sistemve@blissenet.com>", //remitente
                            to: email,
                            subject: "🔑 Hemos recibido su petición de reset de password - Blissenet", //objeto
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

                    async function blissBotNoti(){ //esta funcon es para enviar un Telegrama al vendedor. debe ser avisado de inmediato.
                        console.log("Estamos dentro de la funcion blissBotNoti() ---------------------------->");
                        const Message = `Notificación de Blissenet.com: Safety\n\nCodigo de seguridad: ${newToken}`;
                        console.log("chatId --->", chatId);          
            
                        axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                            chat_id: chatId,
                            text: Message
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


                    if (chatId){

                        createToken()
                            .then(()=>{
                                editToken()
                                    .then(()=>{
                                        sendToken()
                                            .then(()=>{
                                                blissBotNoti()
                                                    .then(()=>{
                                                        req.session.email = {email : email};
                                                        console.log("proceso de restauracion por olvido de contraseña OK");
                                                        req.session.tokenForgottenPassw = "¡Token enviado al email para restauración de Contraseña!"
                                                        res.redirect('/myaccount/signin-forgottenpasswToken');
                                                    })
                                                    .catch((error)=>{
                                                        console.log("Ha habido un error blissBotNoti()", error);
                                                    })

                                            })
                                            .catch((error)=>{
                                                console.log("Ha habido un error sendToken()", error);
                                            })
                                    })
                                    .catch((error)=>{
                                        console.log("Ha habido un error editToken()", error);
                                    })
                            })
                            .catch((error)=>{
                                console.log("Ha habido un error createToken()", error);
                            })                        

                    } else {

                        createToken()
                            .then(()=>{
                                editToken()
                                    .then(()=>{
                                        sendToken()
                                            .then(()=>{
                                                req.session.email = {email : email};
                                                console.log("proceso de restauracion por olvido de contraseña OK");
                                                req.session.tokenForgottenPassw = "¡Token enviado al email para restauración de Contraseña!"
                                                res.redirect('/myaccount/signin-forgottenpasswToken');
                                            })
                                            .catch((error)=>{
                                                console.log("Ha habido un error sendToken", error);
                                            })
                                    })
                                    .catch((error)=>{
                                        console.log("Ha habido un error editToken()", error);
                                    })
                            })
                            .catch((error)=>{
                                console.log("Ha habido un error createToken()", error);
                            })

                    }





                    
                } else {
                    console.log( "mail no found");
                    req.session.emailNofound = "Cuenta no encontrada. Verifique el email con que se registro.";
                    res.redirect('/myaccount/signin-forgottenpassw'); 
                };

    

            } else {
                req.session.seeBotObjec = { "message" : "Hemos detectado un posible ataque", "score" : score };
                req.session.seeBot = "Hemos detectado un comportamiento inusual en Blissenet.com";
                res.redirect('/myaccount/signin-forgottenpassw');
                console.log("Eres un fucking bot");
            }    
        } else {
            req.session.recaptchaFail = "La verificacion de reCAPTCHA ha Fallado";
            res.redirect('/myaccount/signin-forgottenpassw');
            console.log("La verificacion de reCAPTCHA ha Fallado");
        }

    })
    .catch( err => console.log(err));         

});

routes.get('/myaccount/signin-forgottenpasswToken', async(req, res)=>{

    const email = req.session.email; // el email que el usuario ha colocado. ¡Importante!
    const user = req.session.user;

    const tokenForgottenPassw = req.session.tokenForgottenPassw // "¡Token enviado para restauración de Contraseña!"
    delete req.session.tokenForgottenPassw;

    console.log("Estamos en signin-forgottenpasswToken");
    console.log("user ->", user);

    if (user === undefined){
        //lo que obtiene esta const es un array con un objeto que posee la imagen de fondo del signIn.
        const signIn = await modelBackgroundSign.find( {active : true, typeBackground : "SignIn"} );
        console.log("Esto es signIn", signIn );
        res.render('page/signin-forgottenpasswToken', {user, signIn, email, tokenForgottenPassw})
    } else {
        //console.log("ya estas logeado");
        res.redirect('/');
    }
});

routes.post('/myaccount/signin-forgottenpasswToken', async(req, res)=>{
    console.log("Enviando a signin-forgottenpasswToken");
    console.log(req.body)
    const {token, email } = req.body;
    const search = await modelUser.find({ email });

    if (search){
        console.log("search", search);
        const tokenDB = search[0].token;

        if (token == tokenDB){
            res.redirect('/myaccount/signin-forgottenpasswProcess')
            req.session.tokenForgottenPasswSuccess = "Puede Ahora reasignar su nuevo password."
        }

    } else {
        console.log("Este correo no registrado");
    }

});

// direccion de apertura de formulario para cambiar la contraseña
routes.get('/myaccount/signin-forgottenpasswProcess', async(req, res)=>{
    const user = req.session.user;
    const email = req.session.email; // el email que el usuario ha colocado. ¡Importante!
    const tokenForgottenPasswSuccess = req.session.tokenForgottenPasswSuccess; // "Puede Ahora reasignar su nuevo password."
    delete req.session.tokenForgottenPasswSuccess;

    if (user === undefined){
        //lo que obtiene esta const es un array con un objeto que posee la imagen de fondo del signIn.
        const signIn = await modelBackgroundSign.find( {active : true, typeBackground : "SignIn"} );
        console.log("Esto es signIn", signIn );
        res.render('page/signin-forgottenpasswProcess', {user, signIn, email, tokenForgottenPasswSuccess})
    } else {
        //console.log("ya estas logeado");
        res.redirect('/');
    }
   

});

// direccion donde envia los datos del formulario de cambio de contraseña y donde finalmente se encripta.
routes.post('/myaccount/signin-forgottenpasswProcess', async(req, res)=>{
    console.log("Enviando a signin-forgottenpasswProcess")
    console.log(req.body)
    const {email, passw, confirmPassw } = req.body;
    const search = await modelUser.find({ email });
    let hashPassword;

    if (search){
        console.log("search", search);
        //const tokenDB = search[0].token;

        if (confirmPassw == passw){
            console.log("passw.length --->", passw.length);

            if (passw.length >6 ){
                
                //encritar passw
                async function hashing(){
                    hashPassword = await bcrypt.hash(passw, 6);
                    console.log("passw--->", passw);
                    console.log("Este es el hash del passw--->",hashPassword);
                }    
                //actualizar passw en DB
                async function updateDB(){
                    const update = await modelUser.updateOne({email}, { $set: {password : hashPassword} } );
                }

                hashing()
                    .then(()=>{
                        updateDB()
                            .then(()=>{
                                req.session.donePasswSuccess = "Cambio exitoso de Contraseña.";
                                res.redirect('/myaccount/signin')

                            })
                            .catch((error)=>{
                                console.log("Ha ocurrido un error", error);
                            })
                    })
                    .catch((error)=>{
                        console.log("Ha ocurrido un error", error);
                    })

                
            } else {
                req.session.errorPasswSuccess = "su Contraseña debe tener al menos 7 caracteres.";
                res.redirect('/myaccount/signin-forgottenpasswProcess');
                              
            }

        }

    } else {
        console.log("Este correo no registrado");
    }    
    
});



/* aqui nuevo password */
routes.post('/myaccount/new-password', async(req, res)=>{

    let newToken, newTN;
    user = req.session.user;
    const email = user.email;

    const result = await modelUser.findById(user._id)
    const chatId = result.blissBot.chatId; //este es el chatId del user.
    req.session.result = result
   
    
        //creacion de Token
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
            console.log("newToken", newToken);

            req.session.token = newToken;

        }

        //actualizacion de la Data Base
        async function updateDB(){
            const update = await modelUser.findByIdAndUpdate( user._id, { $set: { token : newToken } } );
        }

        //crear el correo y enviarlo
        async function sendToken(){
            //enviamos al correo el nuevo token a usar
            const message = "Confirmación de Cuenta."
            const contentHtml = `
            <h2 style="color: black"> Restableciendo Nueva Contraseña. </h2>
            <ul> 
                <li> cuenta : ${email} </li> 
                <li> asunto : ${message} </li>
            <ul>
            <h2> ${newToken} </h2>
            <p> <b> Estimado usuario, </b> Si usted no ha solicitado restablecer su Contraseña. <b> Esta siendo victima de hackeo </b>. </p>
            <h4><b> Pongase en contacto con la adminsitración de Blissenet.com  adminve@blissenet.com </b>.  </4>
            `

            //enviar correo
            //(SMTP)-> Simple Mail Transfer Protocol --> es el protocolo con que los servidores se comunican a traves de correos.
            const emailMessage = {
                from: "Blissenet<sistemve@blissenet.com>", //remitente
                to: email,
                subject: "🔑 Hemos recibido su petición de cambio de password - Blissenet", //objeto
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

        async function blissBotNoti(){ //esta funcon es para enviar un Telegrama al vendedor. debe ser avisado de inmediato.
            console.log("Estamos dentro de la funcion blissBotNoti() ---------------------------->");
            const Message = `Notificación de Blissenet.com: Safety\n\nCodigo de seguridad: ${newToken}`;
            console.log("chatId --->", chatId);          

            axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                chat_id: chatId,
                text: Message
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


        if (chatId){
            console.log("Existe chatId, asi que vamos a ejecutar todas las funciones..................... ");

            createToken()
                .then(()=>{
                    updateDB()
                        .then(()=>{
                            sendToken()
                                .then(()=>{
                                    blissBotNoti()
                                        .then(()=>{
                                                console.log("proceso de restauracion de contraseña OK");
                                                res.redirect('profile')
                                        })
                                        .catch((error)=>{
                                            console.log("Ha habido un error blissBotNoti()", error);
                                        })        
                                })
                                .catch((error)=>{
                                    console.log("Ha habido un error sendToken()", error);
                                })
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error updateDB()", error);
                        })
                })
                .catch((error)=>{
                    console.log("Ha habido un error createToken()", error);
                })

        } else {

            createToken()
                .then(()=>{
                    updateDB()
                        .then(()=>{
                            sendToken()
                                .then(()=>{
                                    console.log("proceso de restauracion de contraseña OK");
                                    res.redirect('profile')
                                })
                                .catch((error)=>{
                                    console.log("Ha habido un error sendToken()", error);
                                })
                        })
                        .catch((error)=>{
                            console.log("Ha habido un error updateDB()", error);
                        })
                })
                .catch((error)=>{
                    console.log("Ha habido un error createToken()", error);
                })

        }


       
});


routes.post('/myaccount/change-password', async(req, res)=>{
        const {token, newPassword} = req.body
        const user = req.session.user
        const ID = user._id
        const result = req.session.result
        tokenNew = req.session.token

        let hashPassword;
        //console.log("este es el usuario que debe estar actualizado")
        //console.log(result)

        if (token == tokenNew) {
            console.log("el token es el correcto")
            if(newPassword.length >= 6) {
                console.log('puedo guardar la nueva password')

                //encriptar la contraseña
                async function hashing(){
                    hashPassword = await bcrypt.hash(newPassword, 6);
                    console.log("newPassword--->", newPassword);
                    console.log("Este es el hash del password--->",hashPassword);
                }

                //actulizar Data Base
                async function updateDB(){
                    const updatePassword = await modelUser.findByIdAndUpdate( ID,  { $set: { password : hashPassword } } );
                }                  
                
                hashing()
                    .then(()=>{
                        updateDB()
                            .then(()=>{
                                req.session.changePasswSuccess = "¡Contraseña exitosamente cambiada!"
                                delete req.session.token
                                res.redirect('/myaccount/profile')
                            })
                            .catch((error)=>{
                                console.log("Ha habido un error", error);
                            })
                    })
                    .catch((error)=>{
                        console.log("Ha habido un error", error);
                    })

                
            }else {
                console.log('su nuevo password debe tener minimo 6 caracteres para guardar la informacion')
                req.session.errorChange = "¡Su password debe tener mínimo seis (6) caracteres!"
                res.redirect('profile')
            }
        } else {
            console.log("el token no es correcto")
            req.session.errorToken = "¡El token usado no es correcto mire mejor en su email copie y pegue!"
            res.redirect('profile')
        }
        
});
                        
routes.get('/myaccount/profile', async (req,res)=>{
        const user = req.session.user;
        const indexed = user._id;
        const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

        let sumCount = 0;
        let searchProfile, username, Dateborn;

        const profSuccess = req.session.profSuccess;
        const updateSuccess = req.session.updateSuccess;
        const token = req.session.token;
        const changePasswSuccess = req.session.changePasswSuccess; //
        const errorChange = req.session.errorChange;
        const errorToken = req.session.errorToken;
        const noProfile = req.session.noProfile;
        const msgHashtagExito = req.session.msgHashtagExito;
        const msgHashtagDenegado =  req.session.msgHashtagDenegado;
        const msgHashtagDelete = req.session.msgHashtagDelete;
        const msgHashtagError = req.session.msgHashtagError;
        const avatarErrorSizeMimetype = req.session.avatarErrorSizeMimetype;
        const avatarErrorCharge = req.session.avatarErrorCharge;
        const bannerErrorSizeMimetype = req.session.bannerErrorSizeMimetype;
        const bannerErrorCharge = req.session.bannerErrorCharge;
        const withoutDefinedBanner = req.session.withoutDefinedBanner;
        const bannerDefaultRestart = req.session.bannerDefaultRestart;
        const catchError = req.session.catchError; //'Ha ocurrido un error, intente en unos minutos.';

        delete req.session.profSuccess;
        delete req.session.updateSuccess;
        delete req.session.changePasswSuccess;
        delete req.session.errorChange;
        delete req.session.errorToken;
        delete req.session.noProfile;
        delete req.session.msgHashtagExito;
        delete req.session.msgHashtagDenegado;
        delete req.session.msgHashtagDelete;
        delete req.session.msgHashtagError;
        delete req.session.avatarErrorSizeMimetype;
        delete req.session.avatarErrorCharge;
        delete req.session.bannerErrorSizeMimetype;
        delete req.session.bannerErrorCharge;
        delete req.session.withoutDefinedBanner;
        delete req.session.bannerDefaultRestart;
        delete req.session.catchError;
 
        if (user !== undefined){  
            searchProfile = await modelProfile.find({ indexed : indexed });  
            console.log("existe perfil de este usuario ---->", searchProfile);
            //console.log("Este es el usuario ---->", user);
            username = user.username;

            if (searchProfile.length !== 0){
                //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones y contarlas 
                const countAir = await modelAirplane.find({ user_id : indexed }).count();
                sumCount = sumCount + countAir; 
                const countArt = await modelArtes.find({ user_id : indexed }).count();
                sumCount = sumCount + countArt; 
                const countIte = await modelItems.find({ user_id : indexed }).count();
                sumCount = sumCount + countIte; 
                const countAut = await modelAutomotive.find({ user_id : indexed }).count();
                sumCount = sumCount + countAut; 
                const countRea = await modelRealstate.find({ user_id : indexed }).count();
                sumCount = sumCount + countRea; 
                const countNau = await modelNautical.find({ user_id : indexed }).count();
                sumCount = sumCount + countNau; 
                const countSer = await modelService.find({ user_id : indexed }).count();
                sumCount = sumCount + countSer;
                const countAuc = await modelAuction.find({ user_id : indexed }).count();
                sumCount = sumCount + countAuc;
                const countRaf = await modelRaffle.find({ user_id : indexed }).count();
                sumCount = sumCount + countRaf;
                
             
                console.log('Esto es sumCount contamos los anuncios de este user-->', sumCount);

                const dateborn = searchProfile[0].dateborn;
                const date = new Date(dateborn);
                console.log(dateborn);
                console.log("dia :",date.getUTCDate());
                console.log("mes :",date.getMonth() +1);
                console.log("anio :",date.getFullYear());
                const dia = date.getUTCDate();
                const mes = date.getMonth() +1;
                const anio = date.getFullYear();

                Dateborn = `${dia}/${mes}/${anio}`;
                //console.log("Esto es Dateboard : ", Dateborn);

                res.render('page/profile', {user, Dateborn, profSuccess, searchProfile, sumCount, updateSuccess, token, changePasswSuccess, errorChange, errorToken, noProfile, msgHashtagExito, msgHashtagDenegado, msgHashtagDelete, msgHashtagError, countMessages, countNegotiationsBuySell, avatarErrorSizeMimetype, avatarErrorCharge, bannerErrorSizeMimetype, bannerErrorCharge, withoutDefinedBanner, bannerDefaultRestart, catchError });
            } else {
                res.render('page/profile', {user, profSuccess, searchProfile, updateSuccess, token, changePasswSuccess, errorChange, errorToken, noProfile, msgHashtagExito, msgHashtagDenegado, msgHashtagDelete, msgHashtagError, countMessages, countNegotiationsBuySell, avatarErrorSizeMimetype, avatarErrorCharge, bannerErrorSizeMimetype, bannerErrorCharge, withoutDefinedBanner, bannerDefaultRestart, catchError });
            }
        } else {
            console.log("no existe usuario");
            res.render('page/profile', {user, searchProfile, profSuccess, updateSuccess, token, changePasswSuccess,errorChange, errorToken, noProfile, msgHashtagExito, msgHashtagDenegado, msgHashtagDelete, msgHashtagError, countMessages, countNegotiationsBuySell, avatarErrorSizeMimetype, avatarErrorCharge, bannerErrorSizeMimetype, bannerErrorCharge, withoutDefinedBanner, catchError });
        }      

});

routes.post('/myaccount/profile', async (req, res)=>{

    try{
        console.log("-------------- /myaccount/profile ------------------")
        const user = req.session.user;
        const blissName = user.blissName;
        console.log(req.body);      
        const {names, identification, dateborn, gender, company, companyRif, lon, lat, country, countryCode, state, quarter, cityBlock, postCode, city, suburb, phone, phoneAlt, address, profileMessage, facebook, instagram, youtube, tiktok} = req.body
        console.log("company, companyRif, country, countryCode, state, quarter, cityBlock, postCode");
        console.log(company, companyRif, country, state, quarter, cityBlock, postCode, city, suburb,);
        let messageProfile;
        const geolocation = { lon, lat };
        const geoData = [parseFloat(geolocation.lon), parseFloat(geolocation.lat)]; //objeto para guardar en location.coordinates; importante para calculos geograficos
        console.log("geoData : ", geoData); // geoData :  [ -62.736074, 8.2871893 ]
        
        const searchBanner = await modelBannerDefault.find();
        console.log("geolocation: ", geolocation);

        if (searchBanner.length !== 0){
            //tenemos banner default para darles a los usuarios, se puede crear el profile
            const bannerDefault_url = searchBanner[0].url;           
            console.log("bannerDefault_url ->", bannerDefault_url); //https://bucket-blissve.nyc3.digitaloceanspaces.com/bannerUserDefault/bannerDefault.jpg

            const boxObjetBanner = [{ url : bannerDefault_url , public_id : "sin_data" }];
            const boxObjetAvatar = [{ url : "" , public_id : "sin_data" }];
                        
            if (!profileMessage || profileMessage.trim() === ""){
                //si no coloca nada en mensaje de tienda este debe guardar ¡Sin descripción...!
                messageProfile = "¡Sin descripción...!"
            } else {
                //pero si coloca alguna informacion esta se asinga a esta variable;
                messageProfile = profileMessage;
            }


        
            
            const newProfile = new modelProfile({ username: user.username, blissName, names, identification, company, companyRif, dateborn, gender, geolocation, locations: { type: 'Point', coordinates: geoData }, country, countryCode, state, quarter, cityBlock, postCode, city, suburb, phone,  phoneAlt, address, profileMessage : messageProfile, facebook, instagram, youtube, tiktok, indexed : user._id, bannerPerfil: boxObjetBanner, avatarPerfil: boxObjetAvatar, mailhash : user.mailhash });
            console.log("newProfile ........................................>:", newProfile); 
            const saveProfile =  await newProfile.save()
            
            console.log("esto es lo que se registro en la DB ----->",saveProfile);
            req.session.profSuccess = '¡ Perfil creado satifactoriamente !'
            console.log("'¡ Perfil creado satifactoriamente !") 
            
            res.redirect('/myaccount/profile');

        } else {
            //NO hay banner default para darles a los usuarios, NO se puede crear el profile
            req.session.withoutDefinedBanner = "Sin banner por defecto definido, comunicarse con la administración.";
            res.redirect('/myaccount/profile');
        }


    }catch(error){

        req.session.catchError = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/myaccount/profile');

    }

});
           
/* aqui llegan los datos para editar el perfil */
routes.post('/myaccount/edit/:id', async (req, res)=>{

    try {

        //const user = req.session.user;
        const ID = req.params.id;
        console.log("aqui el parametro", ID);
        const {names, identification, company, companyRif, lon, lat, country, countryCode, state, quarter, cityBlock, postCode, city, suburb, phone, phoneAlt, address, profileMessage, facebook, instagram, youtube, tiktok } = req.body;
        let messageProfile;
        const geolocation = { lon, lat };
        const geoData = [parseFloat(geolocation.lon), parseFloat(geolocation.lat)]; //objeto para guardar en location.coordinates; importante para calculos geograficos
        console.log("geoData : ", geoData); // geoData :  [ -62.736074, 8.2871893 ]
        const result = await modelProfile.findById(ID);

        
        if (!profileMessage || profileMessage.trim() === ""){
            //si no coloca nada en mensaje de tienda este debe guardar ¡Sin descripción...!
            messageProfile = "¡Sin descripción...!"
        } else {
            //pero si coloca alguna informacion esta se asinga a esta variable;
            messageProfile = profileMessage;
        }

        if (result) { 
            const updates = await modelProfile.findByIdAndUpdate(ID, { $set: { names, identification, company, companyRif, geolocation, "locations.coordinates": geoData, country, countryCode, state, quarter, cityBlock, postCode, city, suburb, phone, phoneAlt, address, profileMessage : messageProfile, facebook, instagram, youtube, tiktok}}, {new:true});
            console.log("updates .........................:", updates);
            req.session.updateSuccess = "Su perfil ha sido actualizado satisfactoriamente";
        } 
            
        res.redirect('/myaccount/profile');

    } catch (error) {

        req.session.catchError = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/myaccount/profile');
    }

});



/* recibir un banner desde el front */
routes.post('/myaccount/banner', async (req, res, next)=>{

    try {

        const user = req.session.user;
        const userId = user._id;
        console.log("este es el id del usuario en cuestion --->", userId);
        const profile = await modelProfile.find({ indexed : userId }); 
        console.log("muestrame el perfil del usuario ----->",  profile );
        const boxImg = [];
        const fileBanner = req.files[0];
        console.log("Este es el banner que esta llegando al backend ----->",fileBanner)
        
        if (fileBanner !== undefined ){ //esta condicion evalua si el usuario a cargado una foto. sino hay cargado estara en el valor undefined

            if (fileBanner.size <= 3000000  &&  fileBanner.mimetype.startsWith("image/")){

                if (profile.length !== 0 ){
                
                    for (let i = 0; i < profile.length; i++) {
                        const ele = profile[i];
                        
                        ele.bannerPerfil.forEach( (element)=>{
                            if (element.public_id == "sin_data") {
                                //console.log("Es primera vez que cambia el banner")
                                first()
                            
                            } else {
                                const publidIdentificado = element.public_id;
                                //console.log("el public_id identificado es ----->",publidIdentificado);
                                //console.log("Esta banner ya ha sido cambiado otras veces!");
                                some(publidIdentificado)
                            }

                            async  function first(){

                                const folder = 'bannerProfile'; const ident = new Date().getTime();
                                const pathField = fileBanner.path; const extPart = pathField.split(".");
                                const ext = extPart[1];
                                
                                //console.log("Bucket :", bucketName);console.log("folder :", folder);
                                //console.log("patchField :", pathField);console.log("ext", ext);
                            
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
                                        
                                        //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                                        let url = `https://${bucketName}.${endpoint}/${key}`;
                                        let public_id = key;
                                        
                                        boxImg.push({url, public_id});
                
                                        async function saveDB(){
                                            //console.log("este es el path que tiene que ser eliminado:", element.path)
                                            await fs.unlink(fileBanner.path); 
                                                                                
                                            const updatesProfile =  await modelProfile.updateOne({ indexed : userId }, { bannerPerfil : boxImg});
                                            console.log("aqui el resultado de la actualizacion --->",updatesProfile);                 
                                        }
                
                                                
                                        saveDB()
                                            .then(()=>{
                                                //console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                                                res.redirect('profile');
                                            })
                                            .catch((err)=>{
                                                //console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                                res.redirect('profile');
                                            })
                
                                    }
                                    
                                });

                            }

                            async  function some(publidIdentificado){

                                const folder = 'bannerProfile'; const ident = new Date().getTime();
                                const pathField = fileBanner.path; const extPart = pathField.split(".");
                                const ext = extPart[1];
                                
                                //console.log("Bucket :", bucketName);console.log("folder :", folder);
                                //console.log("patchField :", pathField);console.log("ext", ext);
                            
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
                                        
                                        //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                                        let url = `https://${bucketName}.${endpoint}/${key}`;
                                        let public_id = key;
                                        
                                        boxImg.push({url, public_id});
                
                                        async function saveDB(){
                                            //console.log("este es el path que tiene que ser eliminado:", element.path)
                                            await fs.unlink(fileBanner.path); 
                                                                                
                                            const updatesProfile =  await modelProfile.updateOne({ indexed : userId }, { bannerPerfil : boxImg});
                                            //console.log("aqui el resultado de la actualizacion --->",updatesProfile);                 
                                        }

                                        async function deleteBannerOld(){

                                            //publidIdentificado es el public_id que debemos eliminar 

                                            const params = {
                                                Bucket : bucketName,
                                                Key : publidIdentificado
                                            }
                                            s3.deleteObject(params, (err, data)=>{
                                                if (err){
                                                    console.error("Error al eliminar el archivo", err);
                                                    res.redirect('profile');
                                                } else {
                                                    console.log("Archivo eliminado con exito");
                                                    res.redirect('profile');
                                                }
                                            });
                                        }
                
                                                
                                        saveDB()
                                            .then(()=>{
                                                // console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                                                deleteBannerOld();
                                            })
                                            .catch((err)=>{
                                                //console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                                res.redirect('profile');
                                            })
                
                                    }
                                    
                                });

                            }

                        })          
                    
                    }
                    
                }
                
            } else {
                //console.log("Supera el maximo peso de 3 MB o el archivo no es de tipo image");
                req.session.bannerErrorSizeMimetype = 'Supera el maximo peso de 3 MB o el archivo no es de tipo image.';
                res.redirect('profile');
            }    

        } else {
            res.redirect('profile');
        }

    } catch (error) {
        req.session.bannerErrorCharge = 'Ha habido un problema con la carga de archivo. Intente luego.';
        res.redirect('/myaccount/profile');
    }    
       
});

/* ruta para reestablecer el banner por defecto */
routes.get('/myaccount/bannerDefault', async(req, res)=>{

    try {

        const user = req.session.user;
        const userId = user._id;

        const searchBanner = await modelBannerDefault.find();
        const bannerDefault_url = searchBanner[0].url;    

        const search_public_id =  await modelProfile.find({indexed : userId });   
        const banner = search_public_id[0].bannerPerfil;
        const public_id = banner[0].public_id;
        //console.log("**********Banner a eliminar***********");
        //console.log("Este es el banner", banner);
        //console.log("Este es el public_id", public_id);

             
        //console.log("bannerDefault_url ->", bannerDefault_url); //https://bucket-blissve.nyc3.digitaloceanspaces.com/bannerUserDefault/bannerDefault.jpg
        const boxObjetBanner = [{ url : bannerDefault_url , public_id : "sin_data" }];

        //primero guardamos el nuevo banner
        const updatesProfile =  await modelProfile.updateOne({ indexed : userId }, { bannerPerfil : boxObjetBanner});
        //console.log("aqui el resultado de la actualizacion --->",updatesProfile);

        //luego eliminamos el banner viejo customizado
        const params = {
            Bucket : bucketName,
            Key : public_id
        }
        s3.deleteObject(params, (err, data)=>{
            if (err){
                console.error("Error al eliminar el archivo", err);
            } else {
                console.log("Archivo eliminado con exito", data);
                req.session.bannerDefaultRestart = 'Se ha restablecido el banner por defecto';
                res.redirect('profile');
            }
        }); 


    } catch (error) {

        req.session.bannerErrorCharge = 'Ha habido un problema con la carga de archivo. Intente luego.';
        res.redirect('/myaccount/profile');

    }

})

/* recibir el avatar desde profile al backend */ 
routes.post('/myaccount/avatar', async (req, res)=>{

        try {

            const user = req.session.user;
            const userId = user._id;
            console.log("este es el id del usuario en cuestion --->", userId);
            const profile = await modelProfile.find({ indexed : userId }); 
            //console.log("muestrame el perfil del usuario ----->",  profile );
            const boxImg = [];
            const fileAvatar = req.files[0];
            console.log("Este es el fileAvatar que esta llegando al backend ----->",fileAvatar)            
      
            if (fileAvatar !== undefined ){ //esta condicion evalua si el usuario a cargado una foto. sino hay cargado estara en el valor undefined
                console.log("Se ha cargado un avatar");
                console.log("este es profile", profile);

                if (fileAvatar.size <= 3000000  &&  fileAvatar.mimetype.startsWith("image/")){

                    console.log("El archivo cumple con las condiciones establecidas para ser aceptado.");
                    const avatar = profile[0].avatarPerfil;
                    console.log("Este es el avatar --->", avatar)

                    if (avatar[0].public_id == "sin_data") {
                        console.log("Es primera vez que cambia el avatar")

                        firstAvatar();

                    } else {
                        const avatarIdentificado = avatar[0].public_id;
                        console.log("el public_id identificado es ----->", avatarIdentificado)
                        console.log("Este avatar ya ha sido cambiado otras veces!")
                    
                        someAvatar(avatarIdentificado);
                    }
                    
                    async function firstAvatar(){

                        const folder = 'avatar'; const ident = new Date().getTime();
                        const pathField = fileAvatar.path; const extPart = pathField.split(".");
                        const ext = extPart[1];
                        
                        //console.log("Bucket :", bucketName);console.log("folder :", folder);
                        //console.log("patchField :", pathField);console.log("ext", ext);
                    
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
                                
                                //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                                let url = `https://${bucketName}.${endpoint}/${key}`;
                                let public_id = key;
                                
                                boxImg.push({url, public_id});
        
                                async function saveDB(){
                                    //console.log("este es el path que tiene que ser eliminado:", element.path)
                                    await fs.unlink(fileAvatar.path); 
                                                                     
                                    const updatesProfile =  await modelProfile.updateOne({ indexed : userId }, { avatarPerfil : boxImg});
                                    console.log("aqui el resultado de la actualizacion --->",updatesProfile);                 
                                }
        
                                        
                                saveDB()
                                    .then(()=>{
                                        console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                                        res.redirect('profile');
                                    })
                                    .catch((err)=>{
                                        console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                        res.redirect('profile');
                                    })
        
                            }
                            
                        });

                                            
                        
                    }

                    async function someAvatar(avatarIdentificado){

                        console.log("Este perfil tiene un avatar debemos primero guardar el nuevo y luego eliminar el viejo"); 

                        const folder = 'avatar'; const ident = new Date().getTime();
                        const pathField = fileAvatar.path; const extPart = pathField.split(".");
                        const ext = extPart[1];
                        
                        //console.log("Bucket :", bucketName);console.log("folder :", folder);
                        //console.log("patchField :", pathField);console.log("ext", ext);
                    
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
                                
                                //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                                let url = `https://${bucketName}.${endpoint}/${key}`;
                                let public_id = key;
                                
                                boxImg.push({url, public_id});
        
                                async function saveDB(){
                                    //console.log("este es el path que tiene que ser eliminado:", element.path)
                                    await fs.unlink(fileAvatar.path); 
                                                                     
                                    const updatesProfile =  await modelProfile.updateOne({ indexed : userId }, { avatarPerfil : boxImg});
                                    console.log("aqui el resultado de la actualizacion --->",updatesProfile);                 
                                }
        
                                        
                                saveDB()
                                    .then(()=>{
                                        console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                                        deleteAvatarOld()
                                    })
                                    .catch((err)=>{
                                        console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                        res.redirect('profile');
                                    })
        
                            }
                            
                        });


                        async function deleteAvatarOld(){
                            //Segunda tarea es eliminar el avatar
                            //console.log("avatar existente que debemos eliminar------>", avatar); //esto es un array
                            const public_id = avatar[0].public_id;

                            const params = {
                                Bucket : bucketName,
                                Key : public_id
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    console.error("Error al eliminar el archivo", err);
                                    res.redirect('profile');
                                } else {
                                    console.log("Archivo eliminado con exito", data);
                                    res.redirect('profile');
                                }
                            });

                        }    

                    }


                } else {
                    console.log("Supera el maximo peso de 3 MB o el archivo no es de tipo image");
                    req.session.avatarErrorSizeMimetype = 'Supera el maximo peso de 3 MB o el archivo no es de tipo image.';
                    res.redirect('profile')
                }    

                
            } else {
                console.log("NO se ha cargado un avatar");
                res.redirect('profile');
            }
            
        } catch (error) {
            req.session.avatarErrorCharge = 'Ha habido un problema con la carga de archivo. Intente luego.';
            res.redirect('/myaccount/profile');
        }    
        
});

/* recibir el backgroundColor del Text desde el profile al backend */
routes.post('/myaccount/bGColor', async(req, res)=>{

    try {
        
        const user = req.session.user;
        const userId = user._id;
        const datos = req.body
        const { ColorText, ColorTopbar, ColorWorkspace } = req.body;
    
        console.log("Estamos llegando a /myaccount/bGColor")
        console.log("este es el user ------->", user.username );
        //console.log("Este es el objeto datos ------------------>", datos);
        console.log(`ColorText--> ${ColorText}  ColorTopbar--> ${ColorTopbar}  ColorWorkspace--> ${ColorWorkspace}`)
        //ColorText--> #fcf7f7  ColorTopbar--> #1c1c1c  ColorWorkspace--> #bdddff

        const updatesProfile =  await modelProfile.updateOne({ indexed : userId },
            { 
                bGColorText : ColorText,
                bGColorTopbar : ColorTopbar,
                bGColorWorkspace : ColorWorkspace
            });

        res.json({updatesProfile});
        
    } catch (error) {
        req.session.catchError = 'Ha ocurrido un error, intente en unos minutos.';
    }    
   
        
});



//---------------------------Tools - Store--------------------------------

routes.get('/tools', async(req, res)=>{
   
    try {
        
        console.log("*********tools******** -->");
        const user = req.session.user;
        console.log("este es el usuario propietario -->", user);
        const countMessages = req.session.countMessages
        console.log("esto es countMessages -->", countMessages);
        //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
        let searchProfile;
        let sumCount = 0;
    
        if (user){
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.findOne({ indexed : user._id });
            console.log("searchProfile -->", searchProfile);

            //hacemos la busqueda de posibles rifa.
            //aqui busco el id del sorteo. 
            const Raffle = await modelRaffle.findOne({ user_id : user._id });
            console.log("raffle ver --->", Raffle);
            //si tiene entonces lo incluyo en los objetos a enviar al front para anexarlo en el contenedor derecho alargado donde esta el Score y el trust 
    
            //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones y contarlas 
            const countAir = await modelAirplane.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAir; 
            const countArt = await modelArtes.find({ user_id : user._id  }).count();
            sumCount = sumCount + countArt; 
            const countIte = await modelItems.find({ user_id : user._id  }).count();
            sumCount = sumCount + countIte; 
            const countAut = await modelAutomotive.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAut; 
            const countRea = await modelRealstate.find({ user_id : user._id  }).count();
            sumCount = sumCount + countRea; 
            const countNau = await modelNautical.find({ user_id : user._id  }).count();
            sumCount = sumCount + countNau; 
            const countSer = await modelService.find({ user_id : user._id  }).count();
            sumCount = sumCount + countSer;
            const countAuc = await modelAuction.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAuc;
            const countRaf = await modelRaffle.find({ user_id : user._id  }).count();
            sumCount = sumCount + countRaf;
                            
                         
            console.log('Esto es sumCount contamos los anuncios de este user-->', sumCount);
            res.render('page/tools-store', { user, searchProfile, countMessages, countNegotiationsBuySell, Raffle, sumCount });
        }   

        

    } catch (error) {
        console.log("Ha habido un error en la carga de tools-store", error);
    }
                     
});

//---------------------------ZonaBliss--------------------------------

routes.get('/zonabliss/:user_id', async(req, res)=>{
   
    try {
        
        console.log("*********zonabliss******** -->");
        const user = req.session.user;
        const userID = user._id;
        const boxOffert = [];
        console.log("este es el usuario propietario que esta logeado -->", userID);

        //ahora vamos a obtener el user_id del parametro para hacer una comparacion y de esta forma asegurar que solo el propietario esta accediendo a esta parte.
        const userIDParam = req.params.user_id; 
        console.log("este es el usuario propietario que esta logeado -->", userIDParam);

        //este es el usuario propietario que esta logeado --> 66ac0281a3afb22ac770d5f2
        //este es el usuario propietario que esta logeado --> 66ac0281a3afb22ac770d5f2

        if (userID === userIDParam){
            //comprobamos que el usuario logeado es el mismo dueño de la tienda -POR SEGURIDAD-

            const countMessages = req.session.countMessages
            console.log("esto es countMessages -->", countMessages);
            //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
            //aqui obtengo la cantidad de negotiationsBuySell
            const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
            console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
    
            let searchProfile;
        
            if (user){
                //console.log("Esto es user._id ------>", user._id );
                searchProfile = await modelProfile.findOne({ indexed : user._id });
                console.log("searchProfile -->", searchProfile);
                const searchBanner = searchProfile.bannerPerfil;
                console.log("searchBanner --->", searchBanner);


                async function searchOffert(){
                    //ahora es momento de consultar en todas las colecciones de articulos en busca de ofertas.
                    const respItems = await modelItems.find({ user_id: userID, offer: true });
                    if (respItems.length > 0) {
                        boxOffert.push(...respItems); // Usar el spread operator para añadir los elementos al array
                    }
                        
                    const respAerop = await modelAirplane.find({user_id : userID, offer : true });
                    if (respAerop.length > 0){
                        boxOffert.push(...respAerop);
                    }

                    const respAutom = await modelAutomotive.find({user_id : userID, offer : true });
                    if (respAutom.length > 0){
                        boxOffert.push(...respAutom);
                    }

                    const respArtes = await modelArtes.find({user_id : userID, offer : true });
                    if (respArtes.length > 0){
                        boxOffert.push(...respArtes);
                    }

                    const respReals = await modelRealstate.find({user_id : userID, offer : true });
                    if (respReals.length > 0){
                        boxOffert.push(...respReals);
                    }

                    const respServi = await modelService.find({user_id : userID, offer : true });
                    if (respServi.length > 0){
                        boxOffert.push(...respServi);
                    }

                    const respNauti = await modelNautical.find({user_id : userID, offer : true });
                    if (respNauti.length > 0){
                        boxOffert.push(...respNauti);
                    }

                    const respAucti = await modelAuction.find({user_id : userID, offer : true });
                    if (respAucti.length > 0){
                        boxOffert.push(...respAucti);
                    }

                }

                searchOffert()
                    .then(()=>{
                        console.log("Aqui lo recaudado de las ofertas");
                        console.log("boxOffert --->",boxOffert);
                        res.render('page/zonabliss', { user, searchProfile, searchBanner,  countMessages, countNegotiationsBuySell, boxOffert });
                    })
                    .catch((err)=>{
                        console.log("Ha ocurrido un error en la function searchOffert()")
                    })
                
                
            }   

        } 
        

    } catch (error) {
        console.log("Ha habido un error en la carga de /zonaBliss/:user_id", error);
    }
                     
    
});

/* recibir el backgroundColor del Text desde el profile al backend */
routes.post('/zonabliss/bGColor', async(req, res)=>{

    try {
        
        const user = req.session.user;
        const userId = user._id;
        const datos = req.body
        const { ColorText, ColorTopbar, ColorGallery, ColorWorkspace } = req.body;
    
        //console.log("este es el user._id ------->", user );
        //console.log("Este es el objeto datos ------------------>", datos);

        //console.log(` bGColorText--> ${ColorText}   bGColorTopbar--> ${ColorTopbar}  bGColorWorkspace--> ${ColorWorkspace}  bGColorGallery--> ${ColorGallery}`);
        
        //bGColorText--> #f90606   bGColorTopbar--> #181616  bGColorWorkspace--> #fffafa  bGColorGallery--> #131313
        const updatesProfile =  await modelProfile.updateOne({ indexed : userId },  { $set : { 
                                                                                        bGColorText : ColorText,
                                                                                        bGColorTopbar : ColorTopbar,
                                                                                        bGColorWorkspace : ColorWorkspace,
                                                                                        bGColorGallery : ColorGallery
                                                                                    } });

        res.json({updatesProfile});
        
    } catch (error) {
        req.session.catchError = 'Ha ocurrido un error, intente en unos minutos.';
    }    
        
});

routes.post('/zonabliss/setupGallery', async(req, res)=>{
    try{
        console.log("LLegando a /zonabliss/setupGallery");
        const user = req.session.user;
        const userId = user._id;
        const { carouselOffert, sectionMedias, carouselImages ,carouselBanner } = req.body;

        const updatesProfile = await modelProfile.updateOne(
            { indexed: userId },
            { $set: { 'gallery.carouselOffert.show': carouselOffert,
                      'gallery.carouselImages.show': carouselImages,
                      'gallery.carouselBanner.show': carouselBanner,
                      'gallery.sectionMedia.show' : sectionMedias
                    } }
        );

        res.json(updatesProfile);
        
    } catch (error) {
        res.json({ response : "Ha ocurrido un error en /zonabliss/setupGallery"});
    }
})

routes.post('/zonabliss/upload/media', async (req, res)=> {
    try {
        console.log("Llegando a /zonabliss/upload/media");
        const user = req.session.user;
        const userId = user._id;
        const element = req.files[0]; // Aquí accedes al archivo subido
        let boxImg = [];
        let boxVideo = [];

        console.log("element ->", element);

        const statusProfileGallery = await modelProfile.findOne(
            { indexed: userId },
            { 'gallery.sectionMedia.data': 1 }
          );

        //console.log("statusProfileGallery -->", statusProfileGallery);  
        const data = statusProfileGallery.gallery.sectionMedia.data;
        //console.log("aqui en data hay esta cantidad de elementos -->", data.length);

        if (data.length < 2){
            //solo se puede recibir 2 recursos de media para la seccion de media.
            
            if (element.mimetype.startsWith("image/")){
                //caso de ser imagen validar que no supere los 3 mb.
                if (element.size <= 3000000 ){
                                    
                    //console.log("una imagen aqui aceptada----->", element)

                    const folder = 'gallery'; const ident = new Date().getTime();
                    const pathField = element.path; const extPart = pathField.split(".");
                    const ext = extPart[1];
                                
                    //console.log("Bucket :", bucketName); console.log("folder :", folder);
                    // console.log("pathField :", pathField); console.log("ext", ext);

                    const fileContent = fs.readFileSync(pathField);
                    const key = `${folder}/${ident}.${ext}`;
                    console.log("key -->", key);

                    //const endpoint = 'nyc3.digitaloceanspaces.com';
                    //const bucketName = 'bucket-blissve';
                    
                    const params = { 
                        Bucket : bucketName,
                        Key : key,
                        Body : fileContent,
                        ACL : 'public-read' 
                    };

                    s3.putObject(params, function(err, data){
                    
                        if (err){
                            console.log('Error al subir un archivo', err);
                            res.json({ code : -1, response: "¡Ha ocurrido un error!. Intenta luego."});
                        } else {
                            console.log('La imagen fue subida, Exito', data);
                            
                            //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                            let format = ext;
                            let url = `https://${bucketName}.${endpoint}/${key}`;
                            let bytes = element.size;
                            let public_id = key;
                            let type = 'image';
                            
                            //console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id}, type : ${type} `);
                            boxImg.push( {url, public_id, bytes, format, type} );            

                            async function saveDB(){
                                //console.log("este es el path que tiene que ser eliminado:", element.path)
                                await fs.unlink(element.path) 
                                
                                //console.log("Esto es boxImg -------->", boxImg);
                                const box = boxImg[0]; 
                                //console.log("Esto es box -------->", box);
                                
                                const updateProfile = await modelProfile.findOneAndUpdate({indexed: userId}, { $push: { 'gallery.sectionMedia.data': box } });
                                                                
                            }
            
                            saveDB()
                                .then(()=>{
                                    console.log("Se ha guardado en la base de datos. Imagen Subido y Guardado en la DB");
                                    res.json({ code : 1, response: "¡Genial! Tu imagen se ha subido exitosamente."});
                                
                                })
                                .catch((err)=>{
                                    console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                    res.json({ code : -1, response: "¡Ha habido un error!. Intente mas tarde."});
                                })

                        }
                        
                    }); 

                } else {
                    //supera los 3mb
                    res.json({ code : 0,  response: "Su imagen supera el peso de 3mb" });
                    await fs.unlink(element.path); 
                }

            } else if (element.mimetype.startsWith("video/")) {

                //casi de ser video validar que no supere los 50mb.
                if (element.size <= 50000000 ){

                    //console.log("una video aqui aceptado----->", element)

                    const folder = 'gallery'; const ident = new Date().getTime();
                    const pathField = element.path; const extPart = pathField.split(".");
                    const ext = extPart[1];
                                
                    //console.log("Bucket :", bucketName); console.log("folder :", folder);
                    // console.log("pathField :", pathField); console.log("ext", ext);

                    //const fileContent = fs.readFileSync(pathField); //imagen
                    const fileContent = fs.createReadStream(pathField); //video largos
                    const key = `${folder}/${ident}.${ext}`;
                    
                    const params = {
                        Bucket : bucketName,
                        Key : key,
                        Body : fileContent,
                        ACL : 'public-read'
                    }
    
                    s3.upload(params, (err, data)=>{
                        if (err){
                            console.error("Error al subir un video", err);
                            req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
                            res.redirect('/department/create/items');
                        } else {
                            console.log("Video subido con exito", data);
            
                            //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.
                            let format = ext;
                            let url = `https://${bucketName}.${endpoint}/${key}`;
                            let bytes = element.size;
                            let public_id = key;
                            let type = 'video';
                            
                            console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id}, type : ${type} `);    
                            boxVideo.push( {url, public_id, bytes, format, type} );
                            //console.log("Esto es boxVideo -------->", boxVideo);
            
                                
                            async function saveDB(){
                                //console.log("este es el path que tiene que ser eliminado:", element.path)
                                await fs.unlink(element.path) 
                                
                                //console.log("Esto es boxImg -------->", boxImg);
                                const box = boxVideo[0]; 
                                //console.log("Esto es box -------->", box);
                                
                                const updateProfile = await modelProfile.findOneAndUpdate({indexed: userId}, { $push: { 'gallery.sectionMedia.data': box } });
                                        
                            }
    
                            saveDB()
                                .then(()=>{
                                    console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                                    res.json({ code : 1, response: "¡Genial! Tu video se ha subido exitosamente."});
                                })
                                .catch((err)=>{
                                    console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                    res.json({ code : -1, response: "¡Ha habido un error!. Intente mas tarde."});
                                })
    
    
                        }
                    });

                } else {
                    //supera los 50mb
                    await fs.unlink(element.path) 
                    res.json({ code : 0,  response: "Su video supera el peso de 50mb" });
                    
                }

            } else {
                //no es ni imagen ni video
                await fs.unlink(element.path) 
                res.json({ code : 0,  response: "Su archivo no es de video ni de imagen." });
            }

        } else {
            await fs.unlink(element.path) 
            res.json({ code : 0,  response: "Ha llegado al tope máximo de subida de dos (2) Medias." });
        }

        
    } catch (error) {
        console.error(error); // Es buena práctica loggear el error
        res.status(500).json({ code : -1, response: "Ha ocurrido un error al intentar subir una Imagen." });
    }

    //code 1 --> guardado; code 0 --> No guardado por llegar al tope de 6 banner; code -1 --> No guardado por algun error;  

});

routes.post('/zonabliss/upload/imgCarousel', async (req, res)=> {
    try {
        console.log("Llegando a /zonabliss/upload/imgCarousel");
        const user = req.session.user;
        const userId = user._id;
        const element = req.files[0]; // Aquí accedes al archivo subido
        let boxImg = [];

        console.log("element ->", element);

        const statusProfileGallery = await modelProfile.findOne(
            { indexed: userId },
            { 'gallery.carouselImages.data': 1 }
          );

        //console.log("statusProfileGallery -->", statusProfileGallery);  
        const data = statusProfileGallery.gallery.carouselImages.data;
        //console.log("aqui en data hay esta cantidad de elementos -->", data.length);

        if (data.length < 12){
            //solo se puede recibir 12 imagenes para el carousel de imagenes.
                    
            if (element.size <= 3000000  && element.mimetype.startsWith("image/")){

                console.log("es una imagen y pesa menos de 3mb ");

                //console.log("una imagen aqui aceptada----->", element)

                const folder = 'gallery'; const ident = new Date().getTime();
                const pathField = element.path; const extPart = pathField.split(".");
                const ext = extPart[1];
                            
                //console.log("Bucket :", bucketName); console.log("folder :", folder);
                // console.log("pathField :", pathField); console.log("ext", ext);

                const fileContent = fs.readFileSync(pathField);
                const key = `${folder}/${ident}.${ext}`;
                console.log("key -->", key);

                //const endpoint = 'nyc3.digitaloceanspaces.com';
                //const bucketName = 'bucket-blissve';
                
                const params = { 
                    Bucket : bucketName,
                    Key : key,
                    Body : fileContent,
                    ACL : 'public-read' 
                };

                s3.putObject(params, function(err, data){
                
                    if (err){
                        console.log('Error al subir un archivo', err);
                        res.json({ code : -1, response: "¡Ha ocurrido un error!. Intenta luego."});
                    } else {
                        console.log('La imagen fue subida, Exito', data);
                        
                        //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                        let format = ext;
                        let url = `https://${bucketName}.${endpoint}/${key}`;
                        let bytes = element.size;
                        let public_id = key;
                        
                        //console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id} `);
                        boxImg.push( {url, public_id, bytes, format} );            

                        async function saveDB(){
                            //console.log("este es el path que tiene que ser eliminado:", element.path)
                            await fs.unlink(element.path) 
                            
                            //console.log("Esto es boxImg -------->", boxImg);
                            const box = boxImg[0]; 
                            //console.log("Esto es box -------->", box);
                            
                            const updateProfile = await modelProfile.findOneAndUpdate({indexed: userId}, { $push: { 'gallery.carouselImages.data': box } });
                                                            
                        }
        
                        saveDB()
                            .then(()=>{
                                console.log("Se ha guardado en la base de datos. Imagen Subido y Guardado en la DB");
                                res.json({ code : 1, response: "¡Genial! Tu imagen se ha subido exitosamente."});
                               
                            })
                            .catch((err)=>{
                                console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                          
                            })

                    }
                    
                }); 

            } else {
                res.json({ code : 0,  response: "Supera el peso de 3mb o el archivo no es de imagen." });    
            }

        } else {
            
            await fs.unlink(element.path) 
            res.json({ code : 0,  response: "Ha llegado al tope máximo de subida de cinco (10) imagenes." });

        }


        
        // Aquí puedes agregar la lógica para procesar el banner

        
    } catch (error) {
        console.error(error); // Es buena práctica loggear el error
        res.status(500).json({ code : -1, response: "Ha ocurrido un error al intentar subir una Imagen." });
    }

    //code 1 --> guardado; code 0 --> No guardado por llegar al tope de 6 banner; code -1 --> No guardado por algun error;  
});

routes.post('/zonabliss/upload/bannerCarousel', async (req, res)=> {
    try {
        console.log("Llegando a /zonabliss/upload/bannerCarousel");
        const user = req.session.user;
        const userId = user._id;
        const element = req.files[0]; // Aquí accedes al archivo subido
        let boxImg = [];

        console.log("element ->", element);

        const statusProfileGallery = await modelProfile.findOne(
            { indexed: userId },
            { 'gallery.carouselBanner.data': 1 }
          );

        //console.log("statusProfileGallery -->", statusProfileGallery);  
        const data = statusProfileGallery.gallery.carouselBanner.data;
        //console.log("aqui en data hay esta cantidad de elementos -->", data.length);

        if (data.length < 5){
            //solo se puede recibir 5 banner para el carousel de banner.
                    
            if (element.size <= 3000000  && element.mimetype.startsWith("image/")){

                console.log("es una imagen y pesa menos de 3mb ");

                //console.log("una imagen aqui aceptada----->", element)

                const folder = 'gallery'; const ident = new Date().getTime();
                const pathField = element.path; const extPart = pathField.split(".");
                const ext = extPart[1];
                            
                //console.log("Bucket :", bucketName); console.log("folder :", folder);
                // console.log("pathField :", pathField); console.log("ext", ext);

                const fileContent = fs.readFileSync(pathField);
                const key = `${folder}/${ident}.${ext}`;
                console.log("key -->", key);

                //const endpoint = 'nyc3.digitaloceanspaces.com';
                //const bucketName = 'bucket-blissve';
                
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
                        
                        //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                        let format = ext;
                        let url = `https://${bucketName}.${endpoint}/${key}`;
                        let bytes = element.size;
                        let public_id = key;
                        
                        //console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id} `);
                        boxImg.push( {url, public_id, bytes, format} );            

                        async function saveDB(){
                            //console.log("este es el path que tiene que ser eliminado:", element.path)
                            await fs.unlink(element.path) 
                            
                            //console.log("Esto es boxImg -------->", boxImg);
                            const box = boxImg[0]; 
                            //console.log("Esto es box -------->", box);
                            
                            const updateProfile = await modelProfile.findOneAndUpdate({indexed: userId}, { $push: { 'gallery.carouselBanner.data': box } });
                                                            
                        }
        
                        saveDB()
                            .then(()=>{
                                console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                                res.json({ code : 1, response: "¡Genial! Tu banner se ha subido exitosamente."});
                                //res.redirect('/department/create/items');
                            })
                            .catch((err)=>{
                                console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                //res.redirect('/department/create/items');
                            })

                    }
                    
                }); 

            } else {
                res.json({ code : 0,  response: "Supera el peso de 3mb o el archivo no es de imagen." });    
            }

        } else {
            
            await fs.unlink(element.path) 
            res.json({ code : 0,  response: "Ha llegado al tope máximo de subida de cinco (5) Banner." });

        }


        
        // Aquí puedes agregar la lógica para procesar el banner

        
    } catch (error) {
        console.error(error); // Es buena práctica loggear el error
        res.status(500).json({ code : -1, response: "Ha ocurrido un error al intentar subir un Banner." });
    }

    //code 1 --> guardado; code 0 --> No guardado por llegar al tope de 6 banner; code -1 --> No guardado por algun error;  
});

routes.get('/zonabliss/delete_sourceMedia/gallery/:public_id', async (req, res)=> {
    console.log("Llegando a /zonabliss/delete_sourceMedia/:public_id");
    console.log("req.params", req.params);
    const user = req.session.user;
    const userId = user._id;
    const id  = req.params.public_id
    const public_id = "gallery/"+id;
    console.log("public_id ->", public_id);
 
    //console.log("este es el publicId a eliminar  ------>", public_id)
    //=> "gallery/1720566117383.jpg
    //encontrar la imagen en la DB
    try{
        const result = await modelProfile.findOne({indexed : userId, 'gallery.sectionMedia.data.public_id' : public_id });
        console.log("esto es result ->", result); //si existe este recurso. el objeto existira.

        if (result){

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
                        const deleteSource = await modelProfile.findOneAndUpdate(
                            { indexed: userId },
                            { $pull: { 'gallery.sectionMedia.data': { public_id: public_id } } },
                            { new: true } // Esto devuelve el documento actualizado
                        );

                    }

                    deleteDB()
                        .then(()=>{ 

                            setTimeout(() => {
                                res.redirect(`/zonabliss/${userId}`);    
                            }, 2000); //un poco de tiempo para detener al usuario y no saturar al servidor
                            

                        })
                        .catch((err)=>{
                            console.log("Ha ocurrido un error, intente mas tarde.", err);
                            res.redirect(`/zonabliss/${userId}`);
                        })

                }
            });            


        } 
 
    } catch (error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        (`/zonabliss/${userId}`);
    }    

});

routes.get('/zonabliss/delete_sourceImg/gallery/:public_id', async (req, res)=> {
    console.log("Llegando a /zonabliss/delete_sourceImg/:public_id");
    console.log("req.params", req.params);
    const user = req.session.user;
    const userId = user._id;
    const id  = req.params.public_id
    const public_id = "gallery/"+id;
    console.log("public_id ->", public_id);
 
    //console.log("este es el publicId a eliminar  ------>", public_id)
    //=> "gallery/1720566117383.jpg
    //encontrar la imagen en la DB
    try{
        const result = await modelProfile.findOne({indexed : userId, 'gallery.carouselImages.data.public_id' : public_id });
        console.log("esto es result ->", result); //si existe este recurso. el objeto existira.

        if (result){

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
                        const deleteSource = await modelProfile.findOneAndUpdate(
                            { indexed: userId },
                            { $pull: { 'gallery.carouselImages.data': { public_id: public_id } } },
                            { new: true } // Esto devuelve el documento actualizado
                        );

                    }

                    deleteDB()
                        .then(()=>{ 

                            setTimeout(() => {
                                res.redirect(`/zonabliss/${userId}`);    
                            }, 2000); //un poco de tiempo para detener al usuario y no saturar al servidor
                            

                        })
                        .catch((err)=>{
                            console.log("Ha ocurrido un error, intente mas tarde.", err);
                            res.redirect(`/zonabliss/${userId}`);
                        })

                }
            });            


        } 
 
    } catch (error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        (`/zonabliss/${userId}`);
    }    

});

routes.get('/zonabliss/delete_source/gallery/:public_id', async (req, res)=> {
    console.log("Llegando a /zonabliss/delete/source/:public_id");
    console.log("req.params", req.params);
    const user = req.session.user;
    const userId = user._id;
    const id  = req.params.public_id
    const public_id = "gallery/"+id;
    console.log("public_id ->", public_id);
 
    //console.log("este es el publicId a eliminar  ------>", public_id)
    //=> "gallery/1720566117383.jpg
    //encontrar la imagen en la DB
    try{
        const result = await modelProfile.findOne({indexed : userId, 'gallery.carouselBanner.data.public_id' : public_id });
        console.log("esto es result ->", result); //si existe este recurso. el objeto existira.

        if (result){

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
                        const deleteSource = await modelProfile.findOneAndUpdate(
                            { indexed: userId },
                            { $pull: { 'gallery.carouselBanner.data': { public_id: public_id } } },
                            { new: true } // Esto devuelve el documento actualizado
                        );

                    }

                    deleteDB()
                        .then(()=>{ 

                            setTimeout(() => {
                                res.redirect(`/zonabliss/${userId}`);    
                            }, 2000); //un poco de tiempo para detener al usuario y no saturar al servidor
                            

                        })
                        .catch((err)=>{
                            console.log("Ha ocurrido un error, intente mas tarde.", err);
                            res.redirect(`/zonabliss/${userId}`);
                        })

                }
            });            


        } 
 
    } catch (error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        (`/zonabliss/${userId}`);
    }    

});


routes.get('/myaccount/search', async(req, res)=>{

        try {
        
        console.log("*********search******** -->");
        const user = req.session.user;
        console.log("este es el usuario propietario -->", user);
        const countMessages = req.session.countMessages
        console.log("esto es countMessages -->", countMessages);
        //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
        let searchProfile;
        let sumCount = 0;
    
        if (user){
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.findOne({ indexed : user._id });
            console.log("searchProfile -->", searchProfile);

            //hacemos la busqueda de posibles rifa.
            //aqui busco el id del sorteo. 
            const Raffle = await modelRaffle.findOne({ user_id : user._id });
            console.log("raffle ver --->", Raffle);
            //si tiene entonces lo incluyo en los objetos a enviar al front para anexarlo en el contenedor derecho alargado donde esta el Score y el trust 
    
            //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones y contarlas 
            const countAir = await modelAirplane.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAir; 
            const countArt = await modelArtes.find({ user_id : user._id  }).count();
            sumCount = sumCount + countArt; 
            const countIte = await modelItems.find({ user_id : user._id  }).count();
            sumCount = sumCount + countIte; 
            const countAut = await modelAutomotive.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAut; 
            const countRea = await modelRealstate.find({ user_id : user._id  }).count();
            sumCount = sumCount + countRea; 
            const countNau = await modelNautical.find({ user_id : user._id  }).count();
            sumCount = sumCount + countNau; 
            const countSer = await modelService.find({ user_id : user._id  }).count();
            sumCount = sumCount + countSer;
            const countAuc = await modelAuction.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAuc;
            const countRaf = await modelRaffle.find({ user_id : user._id  }).count();
            sumCount = sumCount + countRaf;
                            
                         
            console.log('Esto es sumCount contamos los anuncios de este user-->', sumCount);
            res.render('page/search', { user, searchProfile, countMessages, countNegotiationsBuySell, Raffle, sumCount });
        }   

        

    } catch (error) {
        console.log("Ha habido un error en la carga de tools-store", error);
    }

})

routes.post('/myaccount/search', async(req, res)=>{

    try {

        const user = req.session.user;
        console.log('Has enviado un dato de colocacion de un buscador en la tienda')
        console.log(req.body);
        const searchFilter = req.body.searchFilter;
        console.log("searchFilter --->" , searchFilter);
        
        const updateProfile = await modelProfile.findOneAndUpdate( {username : user.username}, { searchFilter : searchFilter}, {new : true} );
        console.log("Esto es updateProfile ---> cambiando el estado de search filter", updateProfile);
        const response = { code : "Ok", result : updateProfile};
        res.json(response);

    } catch (error) {
        const response = { code : "Error", result : updateProfile};
        res.json(response);

    }

    
});


routes.get('/myaccount/shopping-cart', async(req, res)=>{

        try {
        
        console.log("*********search******** -->");
        const user = req.session.user;
        console.log("este es el usuario propietario -->", user);
        const countMessages = req.session.countMessages
        console.log("esto es countMessages -->", countMessages);
        //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
        let searchProfile;
        let sumCount = 0;
    
        if (user){
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.findOne({ indexed : user._id });
            console.log("searchProfile -->", searchProfile);

            //hacemos la busqueda de posibles rifa.
            //aqui busco el id del sorteo. 
            const Raffle = await modelRaffle.findOne({ user_id : user._id });
            console.log("raffle ver --->", Raffle);
            //si tiene entonces lo incluyo en los objetos a enviar al front para anexarlo en el contenedor derecho alargado donde esta el Score y el trust 
    
            //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones y contarlas 

            const countArt = await modelArtes.find({ user_id : user._id  }).count();
            sumCount = sumCount + countArt; 
            const countIte = await modelItems.find({ user_id : user._id  }).count();
            sumCount = sumCount + countIte; 
                                        
                         
            console.log('Esto es sumCount contamos los anuncios de este user-->', sumCount);
            res.render('page/shopping-cart', { user, searchProfile, countMessages, countNegotiationsBuySell, Raffle, sumCount });
        }   

        

    } catch (error) {
        console.log("Ha habido un error en la carga de tools-store", error);
    }

})

routes.post('/myaccount/shopping-cart', async(req, res)=>{

    try {

        const user = req.session.user;
        console.log('Has enviado un dato activar o desactivar carrito de compra.')
        console.log(req.body);
        const shoppingCart = req.body.buyCar; 
        console.log("shoppingCart --->" , shoppingCart);
        console.log("typeof shoppingCart --->" , typeof shoppingCart);
        
        const updateProfile = await modelProfile.findOneAndUpdate( {username : user.username}, { $set: { buyCar : shoppingCart } }, {new : true} );
        console.log("Esto es updateProfile ---> cambiando el estado de buyCar", updateProfile);
        const response = { code : "Ok", result : updateProfile};
        res.json(response);

    } catch (error) {
        const response = { code : "Error", result : updateProfile};
        res.json(response);

    }

    
});

routes.get('/myaccount/shopping-cart-admin', async(req, res)=>{

    try {
        
        console.log("*********/myaccount/shopping-cart-admin******** -->");
        const user = req.session.user;
        console.log("este es el usuario propietario -->", user);
        let countMessages; //esta variable de actiualizara con la funcion searchMessages();
        
        //console.log("esto es countMessages -->", countMessages);
        //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
        let searchProfile;
        let sumCount = 0;
        let shoppingCartPending = [];
    
        if (user){
            //console.log("Esto es user._id ------>", user._id );
            const userID = user._id;
            searchProfile = await modelProfile.findOne({ indexed : userID });
            console.log("searchProfile -->", searchProfile);

            searchMessages(userID, req) //---> nueva funcion;
               .then( Messages => 
                {
                    countMessages = Messages;
                 
                        shoppingCarts()
                            .then(()=>{
                                console.log("esto es countMessages :", countMessages);            
                                console.log('Esto es sumCount-->', sumCount);
                                res.render('page/shopping-cart-admin', { user, searchProfile, countMessages, countNegotiationsBuySell, shoppingCartPending, sumCount });
                            })

                }  
            ) 

            //aqui vamos a buscar todos los carritos de esta tienda y las contamos 
            async function shoppingCarts(){
                //const shoppingCart = await modelShoppingCart.find({ $and : [{ sellerId: userID }, { consolidate: "false" }, {paid : "false"} ] });
                //const shoppingCartRegPay = await modelShoppingCart.find({ $and : [{ sellerId: userID }, { consolidate: "true" }, { regPay : "true"}, {paid : "false"} ] });
                const shoppingCartRegPay = await modelShoppingCart.find({ $and : [{ sellerId: userID }, { CommentBuy: "no_comment" } ] });

                shoppingCartPending.push(...shoppingCartRegPay);

                sumCount = shoppingCartPending.length; //aqui tomamos la cantidad de carritos pendientes

                //console.log("shoppingCartPending.......................... ", shoppingCartPending); 
            }

        
        }   

        

    } catch (error) {
        console.log("Ha habido un error en la carga de /myaccount/shopping-cart-admin", error);
    }

})


routes.get('/myaccount/tracking', async(req, res)=>{

    try {
        
        console.log("*********/myaccount/tracking******** -->");
        const user = req.session.user;
        console.log("este es el usuario propietario -->", user);
        let countMessages; //esta variable de actiualizara con la funcion searchMessages();
        
        //console.log("esto es countMessages -->", countMessages);
        //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
        let searchProfile;
        let sumCount = 0;
        let shoppingCartPending = [];
    
        if (user){
            //console.log("Esto es user._id ------>", user._id );
            const userID = user._id;
            searchProfile = await modelProfile.findOne({ indexed : userID });
            console.log("searchProfile -->", searchProfile);

            searchMessages(userID, req) //---> nueva funcion;
               .then( Messages => 
                {
                    countMessages = Messages;
                 
                        shoppingCarts()
                            .then(()=>{
                                console.log("esto es countMessages :", countMessages);            
                                console.log('Esto es sumCount-->', sumCount);
                                res.render('page/tracking', { user, searchProfile, countMessages, countNegotiationsBuySell, shoppingCartPending, sumCount });
                            })

                }  
            ) 

            //aqui vamos a buscar todos los carritos de esta tienda y las contamos 
            async function shoppingCarts(){
                const shoppingCart = await modelShoppingCart.find({ $and : [{ customerId: userID }, {clearTracking: false} ] });
                                
                shoppingCartPending.push(...shoppingCart);

                sumCount = shoppingCartPending.length; //aqui tomamos la cantidad de carritos pendientes

                //console.log("shoppingCartPending.......................... ", shoppingCartPending); 
            }

        
        }   

        

    } catch (error) {
        console.log("Ha habido un error en la carga de /myaccount/shopping-cart-admin", error);
    }

})

routes.post('/myaccount/tracking/clearTracking', async(req, res)=>{

    try {
        const {IDCart} = req.body;
        console.log("........./myaccount/tracking/clearTracking............");
        console.log("IDCart .......... :", IDCart);

        const updateShoppingCart = await modelShoppingCart.findByIdAndUpdate(IDCart, { $set: {clearTracking : true} }, {new: true});
        console.log("updateShoppingCart ....:", updateShoppingCart)

        const msg = "Compra terminada, podrás verla en historial.";
        res.json({ code: "ok", message: msg });

    } catch (error) {
        const msg = "Ha ocurrido un error, intente mas tarde.";
        res.json({ code: "err", message: msg });
    }

})

routes.get('/myaccount/sellerType', async (req, res)=>{
    //Este ruta renderiza la pantalla para que los usuarios o tiendas puedan redefirnir el rango de las ventas,
    //pudiendo ser de tipo : Local, Estadal, Nacional e Internacional. Solo basta con que tenga 1 anuncio para activar estos controles
    try {
        
        console.log("********* sellerType ******** -->");
        const user = req.session.user;
        console.log("este es el usuario propietario -->", user);
        const countMessages = req.session.countMessages
        console.log("esto es countMessages -->", countMessages);
        //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
        let searchProfile; 
        let sumCount = 0;
    
        if (user){
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.findOne({ indexed : user._id });
            console.log("searchProfile -->", searchProfile);

            //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones y contarlas 
        
            const countAir = await modelAirplane.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAir; 
            const countArt = await modelArtes.find({ user_id : user._id  }).count();
            sumCount = sumCount + countArt; 
            const countIte = await modelItems.find({ user_id : user._id  }).count();
            sumCount = sumCount + countIte; 
            const countAut = await modelAutomotive.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAut; 
            const countRea = await modelRealstate.find({ user_id : user._id  }).count();
            sumCount = sumCount + countRea; 
            const countNau = await modelNautical.find({ user_id : user._id  }).count();
            sumCount = sumCount + countNau; 
            const countSer = await modelService.find({ user_id : user._id  }).count();
            sumCount = sumCount + countSer;
            const countAuc = await modelAuction.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAuc;
            const countRaf = await modelRaffle.find({ user_id : user._id  }).count();
            sumCount = sumCount + countRaf;     
                                       
      
            res.render('page/sellerType', { user, searchProfile, sumCount, countMessages, countNegotiationsBuySell });
        }   

 
    } catch (error) {
        console.log("Ha habido un error en la carga de Datos sellerType", error);
    }
});

routes.post('/myaccount/sellerType', async (req, res)=>{
      try {
  
        let updateProfile;
        const user = req.session.user;
        console.log('Has enviado un dato activar o desactivar un tipo de venta Local, Nacional o Internacional.')
        console.log("req.body :", req.body);
        const { sellerType, value, idUser } = req.body;
        console.log("Este es el iduser :", idUser);
   
        if ( sellerType === "local" ){

            if (value === "true"){
                updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'sellerType.local' : value } }, {new : true} );
                console.log("Esto es updateProfile :", updateProfile);
            } else {
                updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'sellerType.local' : value, 'sellerType.estadal' : "false", 'sellerType.nacional' : "false" } }, {new : true} );
                console.log("Esto es updateProfile :", updateProfile);
            }

        } else if (sellerType === "estadal") {

            if (value === "true" ){
                updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'sellerType.local' : "true", 'sellerType.estadal' : value } }, {new : true} );
                console.log("Esto es updateProfile :", updateProfile);
            } else {
                updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'sellerType.estadal' : "false", 'sellerType.nacional' : "false" } }, {new : true} );
                console.log("Esto es updateProfile :", updateProfile);
            }


        } else if (sellerType === "nacional") {

            if (value === "true"){
                updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'sellerType.local' : "true", 'sellerType.estadal' : "true", 'sellerType.nacional' : value } }, {new : true} );
                console.log("Esto es updateProfile :", updateProfile);
            } else {
                updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'sellerType.nacional' : "false" } }, {new : true} );
                console.log("Esto es updateProfile :", updateProfile);
            }
            
        } else {

            updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'sellerType.internacional' : value } }, {new : true} );
            console.log("Esto es updateProfile :", updateProfile);
            
        }
          
                  
        const response = { code : "Ok", result : updateProfile};
        res.json(response);
  
      } catch (error) {

          const response = { code : "Error", result : updateProfile};
          res.json(response);
  
      }
});



//aqui se ejecuta el deliveryOptions
routes.get('/myaccount/deliveryOptions', async (req, res)=>{
    //Este ruta renderiza la pantalla para que los usuarios o tiendas puedan redefirnir el tipo de entregas,
    //Solo basta con que tenga 1 anuncio para activar estos controles
    //pudiendo ser de tres tipo :
    // D01 Retiro en tienda. ()
    // D02 Retiro en lugar acordado. ()
    // D03 Envio en la puerta del cliente. ()

    try {
        
        console.log("********* deliveryOptions ******** -->");
        const user = req.session.user;
        console.log("este es el usuario propietario -->", user);
        const countMessages = req.session.countMessages
        console.log("esto es countMessages -->", countMessages);
        //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
        let searchProfile; 
        let sumCount = 0;
    
        if (user){
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.findOne({ indexed : user._id });
            console.log("searchProfile -->", searchProfile);

            //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones y contarlas 
        
            const countAir = await modelAirplane.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAir; 
            const countArt = await modelArtes.find({ user_id : user._id  }).count();
            sumCount = sumCount + countArt; 
            const countIte = await modelItems.find({ user_id : user._id  }).count();
            sumCount = sumCount + countIte; 
            const countAut = await modelAutomotive.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAut; 
            const countRea = await modelRealstate.find({ user_id : user._id  }).count();
            sumCount = sumCount + countRea; 
            const countNau = await modelNautical.find({ user_id : user._id  }).count();
            sumCount = sumCount + countNau; 
            const countSer = await modelService.find({ user_id : user._id  }).count();
            sumCount = sumCount + countSer;
            const countAuc = await modelAuction.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAuc;
            const countRaf = await modelRaffle.find({ user_id : user._id  }).count();
            sumCount = sumCount + countRaf;     
                                       
      
            res.render('page/deliveryOptions', { user, searchProfile, sumCount, countMessages, countNegotiationsBuySell });
        }   

 
    } catch (error) {
        console.log("Ha habido un error en la carga de Datos optionDelivery", error);
    }
});

routes.post('/myaccount/deliveryOptions', async (req, res)=>{
      try {
  
        let updateProfile;
        const user = req.session.user;
        console.log('Has enviado un dato activar o desactivar un tipo de venta Local, Nacional o Internacional.')
        console.log("req.body :", req.body);
        const { deliveryOptions, value, idUser } = req.body;
        console.log("Este es el iduser :", idUser);
   
        //pickupInStore: "true", pickupAtAgreedPlace: "false", shippingToCustomer: "false"
        if ( deliveryOptions === "D01" ){

            if (value === "true"){
                updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'deliveryOptions.pickupInStore' : value } }, {new : true} );
                console.log("Esto es updateProfile :", updateProfile);
            } else {
                updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'deliveryOptions.pickupInStore' : "false", 'deliveryOptions.pickupAtAgreedPlace' : "false", 'deliveryOptions.shippingToCustomer' : "false" } }, {new : true} );
                console.log("Esto es updateProfile :", updateProfile);
            }

        } else if ( deliveryOptions === "D02" ) {

            if (value === "true" ){
                updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'deliveryOptions.pickupAtAgreedPlace' : value } }, {new : true} );
                console.log("Esto es updateProfile :", updateProfile);
            } else {
                updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'deliveryOptions.pickupAtAgreedPlace' : "false" } }, {new : true} );
                console.log("Esto es updateProfile :", updateProfile);
            }


        } else if ( deliveryOptions === "D03" ) {

            if (value === "true"){
                updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'deliveryOptions.shippingToCustomer' : value } }, {new : true} );
                console.log("Esto es updateProfile :", updateProfile);
            } else {
                updateProfile = await modelProfile.findOneAndUpdate( {indexed : idUser }, { $set: { 'deliveryOptions.shippingToCustomer' : "false" } }, {new : true} );
                console.log("Esto es updateProfile :", updateProfile);
            }
            
        } 
          
                  
        const response = { code : "Ok", result : updateProfile};
        res.json(response);
  
      } catch (error) {

          const response = { code : "Error", result : updateProfile};
          res.json(response);
  
      }
});

// aqui es donde podemos editar el nombre del username mientras cumpla con los requerimentos.
// No poseer anuncios ni haya hecho ninguna compra o negociacion .
routes.post('/myaccount/change-review', async(req, res)=>{

    try{

        console.log("-----change review------");
        console.log(req.body);
        const { indexed, username } = req.body;
        let sumCount =  0;

        console.log("indexed :", indexed); //el indexed es el id del user en la coleccion profile y en los departamentos el indexed esta en el campo "user_id" 
        console.log("username :", username);

        //primero vemos si posee un perfil
        const searchProfile = await modelProfile.find({indexed});// buscamos en la collecion perfil.
        console.log("Primera consulta searchProfile");
        console.log("searchProfile", searchProfile);

        if ( searchProfile.length !==0 ){

            //esta cuenta con perfil no tiene anuncios puede pasar a la siguiente verificacion negociacion y compra/venta.
            const negotiationCount = await modelNegotiation.find({usernameBuy : username}).count();
            const buySellCount = await modelBuySell.find({usernameBuy : username}).count();
            console.log(`negotiationCount-> ${negotiationCount}    buySellCount-> ${buySellCount}`);
            console.log(`typeof negotiationCount-> ${typeof negotiationCount}   typeof buySellCount-> ${typeof buySellCount}`);
            if (negotiationCount === 0 && buySellCount === 0 ){
                //como no tiene negociacion o compras lo que se ejcuta es la verificacion de preguntas y calificaciones.
                const searchMessageCount = await modelMessages.find({ userId : indexed }).count();
                if ( searchMessageCount !==0 ){
                    // este user ha hecho preguntas.
                    // verificamos si ha realizado calificacion y opinion
                    const searchStoreRate = await modelStoreRate.find({logeado : indexed});
                    if (searchStoreRate.length !==0){
                        console.log("Hemos llegado a la ultima condicion y verificacion");
                        console.log("Este usuario SI posee perfil, NO posee negocion NI compras. Ha hecho preguntas y ha calificado");
                        console.log("searcStoreRate", searchStoreRate);
                        const status = { edit : true, msg : "Edite su Username", code : "user_profile_messages_storeRate", note : "Este usuario requiere editar la coleccion user, profile, messages y storeRate" };
                        res.json(status);
                    } else {
                        console.log("Hemos llegado a la ultima condicion y verificacion");
                        console.log("Este usuario SI posee perfil, NO posee negocion NI compras. solo ha hecho preguntas y NO ha calificado");
                        console.log("searcStoreRate", searchStoreRate);
                        const status = { edit : true, msg : "Edite su Username", code : "user_profile_messages", note : "Este usuario requiere editar la coleccion user, profile y messages" };
                        res.json(status);
                    }
                    
                } else {
                    // este user NO ha hecho preguntas.
                    // verificamos si ha realizado calificacion y opinion
                    const searchStoreRate = await modelStoreRate.find({logeado : indexed});
                    if (searchStoreRate.length !==0){
                        console.log("Hemos llegado a la ultima condicion y verificacion");
                        console.log("Este usuario SI posee perfil, NO posee negocion NI compras, NO ha hecho preguntas solo ha calificado");
                        console.log("searcStoreRate", searchStoreRate);
                        const status = { edit : true, msg : "Edite su Username", code : "user_profile_storeRate", note : "Este usuario requiere editar la coleccion user, profile y storeRate" };
                        res.json(status);

                    } else {
                        console.log("Hemos llegado a la ultima condicion y verificacion");
                        console.log("Este usuario SI posee perfil, NO posee negocion NI compras, NO ha hecho preguntas y NO ha calificado");
                        console.log("searcStoreRate", searchStoreRate);
                        const status = { edit : true, msg : "Edite su Username", code : "user_profile", note : "Este usuario requiere editar la coleccion user y profile" };
                        res.json(status);

                    }
                }
    
            } else {
                console.log("esta cuenta posee negociacion o compras realizadas, no puede editar el username");
                const status = { edit : false, msg : "NO es Posible Editar Username", code : "denegado", note : "Este usuario ha realizado compras por lo tanto No es posible cambiar su username." };
                res.json(status);
            } 
        
            
        } else {
            //el user no tiene perfil, es de suponer que no puede crear anuncios asi que directamente se evalua si ha realizado alguna compra o negociacion?
            // y si este ha realizado alguna compra o negocicion no puede editar pero si por el contrario no posee, en este caso se evala si ha realizado alguna pregunta y calificación.     
            console.log("Esta cuenta NO posee perfil");
            const negotiationCount = await modelNegotiation.find({usernameBuy : username}).count();
            const buySellCount = await modelBuySell.find({usernameBuy : username}).count();
            console.log(`negotiationCount-> ${negotiationCount}    buySellCount-> ${buySellCount}`);
            console.log(`typeof negotiationCount-> ${typeof negotiationCount}   typeof buySellCount-> ${typeof buySellCount}`);
            if (negotiationCount === 0 && buySellCount === 0 ){
                //como no tiene negociacion o compras lo que se ejcuta es la verificacion de preguntas y calificaciones.
                const searchMessageCount = await modelMessages.find({ userId : indexed }).count();
                if ( searchMessageCount !==0 ){
                    // este user ha hecho preguntas.
                    // los usarios sin perfil No pueden calificar
                    console.log("Hemos llegado a la ultima condicion y verificacion");
                    console.log("Este usuario NO posee perfil, NO posee negocion NI compras. solo ha hecho preguntas");
                    const status = { edit : true, msg : "Edite su Username", code : "user_messages", note : "Este usuario requiere editar la coleccion user y messages" };
                    res.json(status);
                    
                } else {
                    // este user NO ha hecho preguntas.
                    // los usarios sin perfil No pueden calificar
                    console.log("Hemos llegado a la ultima condicion y verificacion");
                    console.log("Este usuario NO posee perfil, NO posee negocio NI compras, NO ha hecho preguntas");
                    const status = { edit : true, msg : "Edite su Username", code : "user", note : "Este usuario requiere editar la coleccion user" };
                    res.json(status);

                }

            } else {
                console.log("esta cuenta posee negociacion o compras realizadas, no puede editar el username");
                const status = { edit : false, msg : "NO es Posible Editar Username", code : "denegado", note : "Este usuario ha realizado compras por lo tanto No es posible cambiar su username." };
                res.json(status);
            } 

        }

    } catch (error) {
        req.session.catchError = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/myaccount/profile');
    }

});

//Ruta para cambiar el nombre de la tienda 
routes.post('/myaccount/change-username', async(req, res)=>{

    try{
        console.log("-----change username------");
        //console.log(req.body);
        const { indexed, username, newName, code, password } = req.body;
        //console.log("indexed", indexed); console.log("username", username); console.log("newName", newName); console.log("code", code); console.log("password", password);

        const blissName = newName.trim(); //limpiamos los espacios delanteros y traseros.

        function escapeRegex(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        // debemos tomar newName y formatearlo para asegurar que no tiene espacios en blanco ni delante ni detras ni en ningun lado.
        const newNameParse = newName.replace(/\s+/g, ''); // quita todos los espacios
        const escaped = escapeRegex(newNameParse);
        //hacemos una busqueda en la coleccion user para revisar si el newName ya existe
        const searchNewName = await modelUser.findOne({ username: { $regex: `^${escaped}$`, $options: 'i' }}).lean();
        
        //console.log("Esto es searchNewName ......:", searchNewName);

        //searchNewName si no encuentra una coincidencia---> null
        //searchUser -> 

        //Conjunto de funciones que estaran activas para su ejecucion.
        async function editUser(){
            const editUser = await modelUser.updateOne({ _id : indexed}, { $set : {username : newNameParse, blissName} });
        }

        async function editProfile(){
            const editProfile =  await modelProfile.updateOne({indexed : indexed}, { $set : {username : newNameParse, blissName} });
        }
        
        async function editMessages(){
            const editMessages = await modelMessages.updateMany({userId : indexed }, { $set : {username : newNameParse} });
        }
        
        async function editStoreRate(){
            const editStoreRate = await modelStoreRate.updateMany({logeado : indexed}, { $set: {'dataLogeado.username' : newNameParse} });
        }

        async function editAllADS(){
            const itemsExit = await modelItems.find({user_id: indexed});
                await Promise.all( itemsExit.map(async (ele) => {
                    // Aquí actualizas el campo username de cada documento
                    await modelItems.updateOne({ _id: ele._id }, { $set: { username: newNameParse, blissName } });
                }));
            const artesExit = await modelArtes.find({user_id: indexed});
                await Promise.all( artesExit.map(async (ele) => {
                    // Aquí actualizas el campo username de cada documento
                    await modelArtes.updateOne({ _id: ele._id }, { $set: { username: newNameParse, blissName } });
                }));
            const airplaneExit = await modelAirplane.find({user_id: indexed});
                await Promise.all( airplaneExit.map(async (ele) => {
                    // Aquí actualizas el campo username de cada documento
                    await modelAirplane.updateOne({ _id: ele._id }, { $set: { username: newNameParse, blissName } });
                }));
            const automotiveExit = await modelAutomotive.find({user_id: indexed});
                await Promise.all( automotiveExit.map(async (ele) => {
                    // Aquí actualizas el campo username de cada documento
                    await modelAutomotive.updateOne({ _id: ele._id }, { $set: { username: newNameParse, blissName } });
                }));   
            const realstateExit = await modelRealstate.find({user_id: indexed});
                await Promise.all( realstateExit.map(async (ele) => {
                    // Aquí actualizas el campo username de cada documento
                    await modelRealstate.updateOne({ _id: ele._id }, { $set: { username: newNameParse, blissName } });
                }));  
            const nauticalExit = await modelNautical.find({user_id: indexed});
                await Promise.all( nauticalExit.map(async (ele) => {
                    // Aquí actualizas el campo username de cada documento
                    await modelNautical.updateOne({ _id: ele._id }, { $set: { username: newNameParse, blissName } });
                }));
            const serviceExit = await modelService.find({user_id: indexed});
                await Promise.all( serviceExit.map(async (ele) => {
                    // Aquí actualizas el campo username de cada documento
                    await modelService.updateOne({ _id: ele._id }, { $set: { username: newNameParse, blissName } });
                }));     
            const raffleExit = await modelRaffle.find({user_id: indexed});
                await Promise.all( raffleExit.map(async (ele) => {
                    // Aquí actualizas el campo username de cada documento
                    await modelRaffle.updateOne({ _id: ele._id }, { $set: { username: newNameParse, blissName } });
                })); 
            const auctionExit = await modelAuction.find({user_id: indexed});
                await Promise.all( auctionExit.map(async (ele) => {
                    // Aquí actualizas el campo username de cada documento
                    await modelAuction.updateOne({ _id: ele._id }, { $set: { username: newNameParse, blissName } });
                }));                                                                                           
        }


        const searchUser = await modelUser.findOne({_id : indexed});
        console.log("searchUser ->", searchUser);
        const hashPassword = searchUser.password;

        async function hashing(){
            const compares = await bcrypt.compare(password, hashPassword);
            console.log("resul de la comparacion--->",compares)

            if (compares === true) {
        
                //vamos a comprobar que el nuevo nombre no este siendo usado.
                if (!searchNewName){

                    if ( code === 'user_profile_messages_storeRate' ){
                        console.log(`vamos a cambiar el username ${username} por ${newNameParse} en estas colecciones ${code}`);

                        editUser()
                            .then(()=>{
                                editProfile()
                                    .then(()=>{
                                        editMessages()
                                            .then(()=>{
                                                editStoreRate()
                                                    .then(()=>{
                                                        editAllADS()
                                                            .then(()=>{
                                                                res.json({ 'edit': true, 'msg': 'Username Cambiado', 'response' : "Ok", 'editCode' : code });
                                                            })
                                                            .catch((error)=>{
                                                                console.log("Ha habido un error en editAllADS", error);
                                                            })
                                                        
                                                    })
                                                    .catch((error)=>{
                                                        console.log("Ha habido un error en editStoreRate", error);
                                                    })
                                            })
                                            .catch((error)=>{
                                                console.log("Ha habido un error en editMessages", error);
                                            })
                                    })
                                    .catch((error)=>{
                                        console.log("Ha habido un error en editProfile", error);
                                    })
                            })
                            .catch((error)=>{
                                console.log("Ha habido un error en editUser", error);
                            })


                    } else if ( code === 'user_profile_messages') {
                        console.log(`vamos a cambiar el username ${username} por ${newNameParse} en estas colecciones ${code}`);

                        editUser()
                            .then(()=>{
                                editProfile()
                                    .then(()=>{
                                        editMessages()
                                            .then(()=>{
                                                editAllADS()
                                                    .then(()=>{
                                                         res.json({ 'edit': true, 'msg': 'Username Cambiado', 'response' : "Ok", 'editCode' : code });
                                                    })
                                                    .catch((error)=>{
                                                        console.log("Ha habido un error en editAllADS()", error);
                                                    })
                                               
                                            })
                                            .catch((error)=>{
                                                console.log("Ha habido un error en editMessages", error);
                                            })
                                    })
                                    .catch((error)=>{
                                        console.log("Ha habido un error en editProfile", error);
                                    })
                            })
                            .catch((error)=>{
                                console.log("Ha habido un error en editUser", error);
                            })

                    } else if ( code === 'user_profile_storeRate' ) {
                        console.log(`vamos a cambiar el username ${username} por ${newNameParse} en estas colecciones ${code}`);

                        editUser()
                            .then(()=>{
                                editProfile()
                                    .then(()=>{
                                        editStoreRate()
                                            .then(()=>{
                                                editAllADS()
                                                    .then(()=>{
                                                        res.json({ 'edit': true, 'msg': 'Username Cambiado', 'response' : "Ok", 'editCode' : code });
                                                    })
                                                    .catch((error)=>{
                                                        console.log("Ha habido un error en editAllADS", error);
                                                    })
                                                
                                            })
                                            .catch((error)=>{
                                                console.log("Ha habido un error en editStoreRate", error);
                                            })
                                    })
                                    .catch((error)=>{
                                        console.log("Ha habido un error en editProfile", error);
                                    })
                            })
                            .catch((error)=>{
                                console.log("Ha habido un error en editUser", error);
                            })        

                    } else if ( code === 'user_profile' ) {
                        console.log(`vamos a cambiar el username ${username} por ${newNameParse} en estas colecciones ${code}`);

                        editUser()
                            .then(()=>{
                                editProfile()
                                    .then(()=>{
                                        editAllADS()
                                            .then(()=>{
                                                res.json({ 'edit': true, 'msg': 'Username Cambiado', 'response' : "Ok", 'editCode' : code });
                                            })
                                            .catch((error)=>{
                                                console.log("Ha habido un error en editAllADS", error);
                                            })
                                                
                                    })
                                    .catch((error)=>{
                                        console.log("Ha habido un error en editProfile", error);
                                    })
                            })
                            .catch((error)=>{
                                console.log("Ha habido un error en editUser", error);
                            })        

                    } else if ( code === 'user_messages' ) {
                        console.log(`vamos a cambiar el username ${username} por ${newNameParse} en estas colecciones ${code}`);

                        editUser()
                            .then(()=>{
                                editMessages()
                                    .then(()=>{
                                        res.json({ 'edit': true, 'msg': 'Username Cambiado', 'response' : "Ok", 'editCode' : code });
                                    })
                                    .catch((error)=>{
                                        console.log("Ha habido un error en editMessages", error);
                                    })
                            })
                            .catch((error)=>{
                                console.log("Ha habido un error en editUser", error);
                            }) 

                    } else if ( code === 'user' ){
                        console.log(`vamos a cambiar el username ${username} por ${newNameParse} en estas colecciones ${code}`);

                        editUser()
                            .then(()=>{
                                res.json({ 'edit': true, 'msg': 'Username Cambiado', 'response' : "Ok", 'editCode' : code });
                            })
                            .catch((error)=>{
                                console.log("Ha habido un error en editUser", error);
                            })         

                    }

                } else {
                    console.log('Nuevo username ya esta en uso');
                    const status = { edit : false, msg : "Username ocupado", code : "denegado", note : "Nuevo Username ya en uso" };
                    res.json(status);
                }    

            } else {
                console.log('Password Erroneo, no puede cambiar el username');
                const status = { edit : false, msg : "Contraseña Errada", code : "denegado", note : "Contraseña errada." };
                res.json(status);
            }    

        }
        
        hashing()

    } catch (error) {
        req.session.catchError = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/myaccount/profile');
    }        

});


//ruta para consultar el campo hashtags de un usuario
routes.get('/myaccount/palabras-clave', async(req, res)=>{

    try {
        const user = req.session.user;
        
        if (user){
            const userId = user._id;
            const searchProfile =  await modelProfile.findOne({indexed : userId});
            res.json(searchProfile);
        }

    } catch (error) {
        req.session.catchError = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/myaccount/profile');
    }        

});

//ruta para agregar palabras clave en el campo hashtags de un usuario
routes.post('/myaccount/palabras-clave', async(req, res)=>{

    try{
        const user = req.session.user;
        const userId = user._id;

        if (user){
            console.log(":::: Estamos en la ruta de *palabras-claves* ::::");
            console.log("Esto es el id del user :", userId);
            //console.log(req.body);

            try{
                    const boxHashtags = req.body.boxHashtags;
                
                    console.log("Esto es lo que llega del front boxHashtags :",boxHashtags);
                    //const updateProfile =  await modelProfile.findOneAndUpdate({indexed : userId},{ $unset: { "hashtags" : ""}} );

                    if (boxHashtags.length <= 9){
                        //const updatesProfile =  await modelProfile.findOneAndUpdate({indexed : userId},{ $unset: { "hashtags" : ""}} );
                        await modelProfile.findOneAndUpdate( {indexed : userId} , {$set : {hashtags : boxHashtags}} );
                        req.session.msgHashtagExito = 'Ha agregado con exito Palabra(s) Clave.';
                        const msgObje = { msg : 'Ha agregado con exito Palabra(s) Clave.' , type : 'Exito'};
                        res.json(msgObje);

                    }else {
                        console.log("solo puede tener 9 etiquetas en su tienda");
                        req.session.msgHashtagDenegado = 'Solo puede agregar seis (9) Palabras Clave en su sitio.';
                        const msgObje = { msg : 'Solo puede agregar seis (9) Palabras Clave en su sitio.' , type : 'Denegado'};
                        res.json(msgObje);

                    }

            }catch(error){
                req.session.msgHashtagError = 'Ha ocurrido un error, intente en unos minutos.';
                const msgObje = { msg : 'Ha ocurrido un error, intente en unos minutos.' , type : 'Error'};
                res.json(msgObje);
            } 
        } else {
            res.redirect('/myaccount/profile');
        }

    } catch (error) {
        req.session.msgHashtagError = 'Ha ocurrido un error. Intente en unos minutos.';
        res.redirect('/myaccount/profile');
    }                   

});

routes.get('/myaccount/palabras-clave/delete/:i', async(req, res)=>{

    try{

        const user = req.session.user;
        const userId = user._id;
        const eleDelete = req.params.i;
        console.log("He llegado a la ruta :  /myaccount/palabras-clave/delete");
        
        const searchProfile =  await modelProfile.findOne({indexed : userId});

        if (searchProfile){
            const boxHasthtags = searchProfile.hashtags;
            console.log("boxHasthtags :", boxHasthtags);
            
            boxHasthtags.splice(eleDelete, 1);
            console.log("Esto es boxHasthtags :", boxHasthtags);

            await modelProfile.findOneAndUpdate( {indexed : userId} , {$set : {hashtags : boxHasthtags}} );
            req.session.msgHashtagDelete = 'Se ha eliminado una Palabra Clave.';
            res.redirect('/myaccount/profile');
        }
        
    }catch(error){
        req.session.msgHashtagError = 'Ha ocurrido un error. Intente en unos minutos.';
        res.redirect('/myaccount/profile');
    }    

});
    





//----------------------------------------------------------------------

/* esta es la ruta de la seccion de creacion de todos los departamentos "donde estan los iconos" */
routes.get('/department/create', async (req, res)=>{

    try{
        const user = req.session.user;
        const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

        let username, searchProfile, noExistProfile;

        console.log(":::: Cantidad de mensajes que tiene este usuario :::: ->", countMessages);    
        console.log(":::: Esto es la cantidad de negotiationsBuySell :::: ->", countNegotiationsBuySell);

        if (user){
            username = user.username
            searchProfile = await modelProfile.find({ indexed : user._id });
            console.log("Aqui el profile de la cuenta", searchProfile);

            if (searchProfile.length === 0){
                req.session.noProfile = `¡Hola ${username}! Detente un momento : primero debes crear tu perfil para poder publicar.`
                noExistProfile = req.session.noProfile;
                delete req.session.noProfile;
            }

        } 
        
        res.render('page/department', {user, searchProfile, noExistProfile, countMessages, countNegotiationsBuySell});

    } catch (error) {
        req.session.catchError = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/myaccount/profile');
    } 

});

/* esta es la ruta de la seccion de creacion de todos los departamentos "donde estan los iconos" */
routes.get('/department/raffle', async (req, res)=>{

    try{
        const user = req.session.user;
        const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

        let username, searchProfile;

        console.log(":::: Cantidad de mensajes que tiene este usuario :::: ->", countMessages);    
        console.log(":::: Esto es la cantidad de negotiationsBuySell :::: ->", countNegotiationsBuySell);

        if (user){
            username = user.username
            searchProfile = await modelProfile.find({ indexed : user._id });
            console.log("Aqui el profile de la cuenta", searchProfile);
        } 
        
        res.render('page/raffle', {user, searchProfile, countMessages, countNegotiationsBuySell});

    } catch (error) {
        req.session.catchError = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/myaccount/profile');
    }         
});


//Orígenes autorizados de JavaScript
routes.get('/auth/google', (req, res, next) => {
    console.log('Iniciando sesión con Google...');
    next(); // Llama al siguiente middleware
}, passport.authenticate('google', {
    scope: ['profile', 'email']
}));
 
/* 
routes.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query; // Obtienes el perfil del usuario autenticado

    console.log(" code....    :", code); //respuesta  userGoogle....    : undefined

    //const googleEmail = userGoogle.emails[0].value;
    //const googleName = userGoogle.displayName;
    //const googleId = userGoogle.id;

    //const googleEmail = userGoogle.emails[0].value;

    console.log("xxxxxxxxxxxxxxxxxx REVISAR xxxxxxxxxxxxxxx");

    console.log(" /auth/google/callback ");

    try {
        const searchUser = await modelUser.findOne({ email: googleEmail });

        if (searchUser) {
            // Usuario existe

            const googleIdExist = searchUser.googleId;

            if (googleIdExist){
                //existe el usuaro y tiene su googleId
                //logeamos al usuario

                req.login(searchUser, (err) => {
                    if (err) {
                        console.error('Login Error:', err);
                        return res.status(500).send('Error al iniciar sesión.');
                    }
                    res.redirect('/');
                });

        

            } else {
                //existe el usuaro y NO tiene su googleId, se lo agregamos para que tenga todo sus datos completos
                //logeamos al usuario

                const updateUSer = await modelUser.findOneAndUpdate({email: googleEmail},{ googleId: googleId }, { new: true } );

                req.login(searchUser, (err) => {
                    if (err) {
                        console.error('Login Error:', err);
                        return res.status(500).send('Error al iniciar sesión.');
                    }
                    res.redirect('/');
                });

            }
            

        } else {
            // Crear nuevo usuario partiendo de los datos de Google

            const emailLower = googleEmail.toLowerCase();//transformo en minisculas el correo
            const Mailhash = hash.MD5(emailLower); 

            const usernameGoogle = googleName; // Nombre obtenido de Google
            const maxLength = 24;

            // Recorta el nombre si supera los 24 caracteres
            const usernameReview = usernameGoogle.length > maxLength ? usernameGoogle.slice(0, maxLength) : usernameGoogle;

            console.log(usernameReview);

            // Se crea un nuevo usuario
            const newUser = new modelUser({
                googleId: googleId,
                username: usernameReview,
                blissName : usernameReview,
                email: googleEmail,
                emailVerify : true,  
                mailhash : Mailhash        
            });
    
            const savedUser = await newUser.save();
            console.log("savedUser", savedUser);
           
            req.login(savedUser, (err) => {
                if (err) {
                    console.error('Login Error:', err);
                    return res.status(500).send('Error al iniciar sesión.');
                }
                res.redirect('/');
            });            

            //..............................................

        }

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Error en la autenticación.');
    }


});

 */

routes.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;

    try {
        // Intercambiar el código por un token
        //    const response = await axios.post('https://oauth2.googleapis.com/token', querystring.stringify({
        //        code: code,
        //        client_id: process.env.GOOGLE_CLIENT_ID,
        //        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        //        redirect_uri: 'http://localhost:1263/auth/google/callback', //es lo que hemos registrado en google
        //        grant_type: 'authorization_code'
        //    })); sistema antiguo querystring esta deprecado

        const params = new URLSearchParams();
        params.append('code', code);
        params.append('client_id', process.env.GOOGLE_CLIENT_ID);
        params.append('client_secret', process.env.GOOGLE_CLIENT_SECRET);
        params.append('redirect_uri', 'https://blissenet.com/auth/google/callback'); //produccion
        /* params.append('redirect_uri', 'http://localhost:1263/auth/google/callback'); desarrollo */
        params.append('grant_type', 'authorization_code');

        const response = await axios.post('https://oauth2.googleapis.com/token', params);

   
        const { access_token } = response.data;

        // Ahora puedes usar este token para obtener la información del usuario
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const userGoogle = userInfoResponse.data; //esto es la informacion que me envia google despues de autorizar al user.
        console.log("userGoogle ---->", userGoogle); // Aquí deberías ver la información del usuario, incluyendo email y nombre.
/* 
        userGoogle ----> {
            sub: '114062835848042029579',
            name: 'Km Cero',
            given_name: 'Km',
            family_name: 'Cero',
            picture: 'https://lh3.googleusercontent.com/a/ACg8ocJ9h47szF6tZbNvsQhgr_jWY6rnDqL8EEvkmWocvCPr6tY_kOc3=s96-c',
            email: 'scorpinosred@gmail.com',
            email_verified: true
        }
 */
        const googleId = userGoogle.sub;
        const googleEmail = userGoogle.email;
        const googleName = userGoogle.name;

        try {
            const searchUser = await modelUser.findOne({ email: googleEmail, emailVerify : true });

            if (searchUser) {
                // Usuario existe

                const googleIdExist = searchUser.googleId;

                if (googleIdExist){
                    //existe el usuaro y tiene su googleId
                    //logeamos al usuario con el metodo de login con google

                    //const search = await modelUser.findOne({ email : email, emailVerify : true });
                    const user = searchUser
                    req.session.user = user;
                    req.session.success = "¡Bienvenido! Has entrado a Blissenet.com. Tu red de mercado mundial.";
                    res.redirect('/')
            

                } else {
                    //existe el usuaro pero NO tiene googleId, en un usuario de contraseña
                    //NO selogeamos al usuario y se le envia un mensaje

                    req.session.methodLoging = "Su cuenta usa el metodo de Usuario y Contraseña.";
                    res.redirect('/')

                }
                

            } else {
                // Crear nuevo usuario partiendo de los datos de Google

                const emailLower = googleEmail.toLowerCase();//transformo en minisculas el correo
                const Mailhash = hash.MD5(emailLower); 

                const usernameGoogle = googleName; // Nombre obtenido de Google
                const maxLength = 24;

                // Recorta el nombre si supera los 24 caracteres
                const usernameReview = usernameGoogle.length > maxLength ? usernameGoogle.slice(0, maxLength) : usernameGoogle;

                // esta constante guarda el nombre parseado sin espacios en blanco. Para URL y codigos QR
                const usernameParse = usernameReview.replace(/\s+/g, '').trim(); //Quitamos todos los espacios.
                //console.log("usernameParse", usernameParse);

                console.log(usernameReview);

                // Se crea un nuevo usuario
                const newUser = new modelUser({
                    googleId: googleId,
                    username: usernameParse,
                    blissName : usernameReview,
                    email: googleEmail,
                    emailVerify : true,  
                    mailhash : Mailhash,
                    emailVerify : true        
                });
        
                const savedUser = await newUser.save();
                console.log("savedUser", savedUser);
            
                const user = savedUser;
                req.session.user = user;
                req.session.success = "¡Bienvenido! Has entrado a Blissenet.com. Tu red de mercado mundial.";
                res.redirect('/')            

                //..............................................

            }

        } catch (error) {
            console.error('Error:', error);
            return res.status(500).send('Error en la autenticación.');
        }


    
    } catch (error) {
        console.error('Error al intercambiar el código por token:', error);
        return res.status(500).send('Error en la autenticación.');
    }

    //aqui puedo agregar usuario para ir probando
    //https://console.cloud.google.com/auth/audience?project=possible-aspect-450318-k2 
});

routes.get('/myaccount/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
        if (err) {
            res.status(400).send('Unable to log out')
        } else {
            res.redirect('/')
        }
        });
    } else {
        res.redirect('/')
    }
});

async function searchMessages(userID, req){
    console.log("estamos dentro de la funcion global de actualizar la cantidad de messages.......")
    //primer paso ubicar todos los mensajes que tenga el usuario logeado y que el campo answer diga waiting.
    const searchBoxMessageInbox = [];
    let searchMessageInbox;
    let countMessagesInbox;
    let countMessagesOutbox;
    let totalMessages;
    let countMessages;

    const searchMessageInbox0 = await modelMessages.find( { $and: [{ toCreatedArticleId : userID },{answer: "waiting"}, { typeNote: { $ne: "availability-noti" } } ] } );
    const searchMessageInbox1 = await modelMessages.find( { $and: [{ userId : userID }, { typeNote : "availability-noti" }, {answer: "waiting"} ] } );
    
    searchBoxMessageInbox.push(...searchMessageInbox0, ...searchMessageInbox1);
    searchBoxMessageInbox.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); //aqui ordenamos de menor a mayor por fecha
    searchMessageInbox = searchBoxMessageInbox; 
    //console.log("Estos son todos los mensajes que tiene este usuario en Inbox --->", searchMessageInbox);
    
    countMessagesInbox = searchMessageInbox.length;

    console.log("vamos por aqui en la funcion searchMessages ...........")
    //console.log('esta es la cantidad de mensajes que tiene este usario en inbox--->', countMessagesInbox)

    const searchMessageOutbox = await modelMessages.find( { $and: [{userId : userID },{view: false},{ typeNote: { $ne: "availability-noti" } } ] } ).sort({ createdAt: 1 }); // 1 para orden ascendente, -1 para descendente;
    const searchMessageOutboxAlert = await modelMessages.find( { $and: [{userId : userID },{view: false},{ typeNote: { $ne: "availability-noti" }}, { answer: { $ne: "waiting" } } ] } );
    countMessagesOutbox = searchMessageOutboxAlert.length;


    //console.log('esta es la cantidad de mensajes que tiene este usario en Outbox--->', countMessagesOutbox)

    totalMessages = (countMessagesInbox + countMessagesOutbox);
    console.log("este es la totalidad de los mensajes en inbox y en outbox ----->", totalMessages)
    //aqui tenemos la sumatoria de mensajes en Inbox y Outbox
    console.log("Este es el fin delp proceso de la la funcion searchMessages");

    req.session.countMessages = totalMessages
    countMessages = totalMessages
    return countMessages;

    
}


module.exports = routes


                   
                
                      