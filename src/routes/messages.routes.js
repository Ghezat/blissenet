const { Router } = require('express');
const hash = require('object-hash');
const mongoose = require('mongoose');

const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelMessages = require('../models/messages.js');
const modelArtAndArticle = require('../models/rateArtAndArticle.js');

const modelArtes = require('../models/artes.js');
const modelAirplane = require('../models/airplane.js');
const modelItems = require('../models/items.js');
const modelAutomotive = require('../models/automotive.js');
const modelRealstate = require('../models/realstate.js');
const modelNautical = require('../models/nautical.js');
const modelService = require('../models/services.js');
const modelAuction = require('../models/auction.js'); 
const modelRaffle = require('../models/raffle.js');
//const { search } = require('./index.routes.js');

//este Token es la KEY del bot de Telegram
const Token =  process.env.Token_Bot;

const axios = require('axios');

routes.post('/rateProduct', async(req, res)=>{
    console.log('···· /rateProduct ····');
    console.log(req.body);

    const { department, productId, starValue, answer, idMesagge } = req.body
    const StarValue = parseInt(starValue); //siempre es un numero entero el que se envia para calificar.
    //ahora vamos a crear la calificacion de este articulo. 
    //que luego se mostrara en el view-general-product
    //tambien se usara para dejar la media de calificacion en el producto en si. que es las estrellas que mosytrara en la tarjeta.

    const user = req.session.user;
    const userId = user._id;

    const perfilData = await modelProfile.findOne({ indexed : userId });
    const blissName = perfilData.blissName;
    const mailhash = perfilData.mailhash;
    const avatarPerfil = perfilData.avatarPerfil;
    const commentatorId = perfilData.indexed;
    const country = perfilData.country;
    const flag = perfilData.flag;

    console.log("user :", user);
    console.log("blissName :", blissName);
    console.log("mailhash :", mailhash); console.log("avatarPerfil :", avatarPerfil); console.log("commentatorId :", commentatorId);

    //blissName : Falcon Roger; mailhash : fd25e003e3b6b4b4f60c0659099321bd
    //avatarPerfil : [ { url: '', public_id: 'sin_data' } ]; commentatorId : 66ba334e0e5f1becbefdb4d5

    const searhRateArtAndArticle = await modelArtAndArticle.find({ department, productId });
    
    async function createRateArtAndArticle(){
        //{username, avatarPerfil, mailhash, country, flag}
        const Data = {username : blissName, avatarPerfil, mailhash, country, flag}; 
        //commentatorData : { type : Object }, //aqui va a estar un objeto asi {username, avatarPerfil, mailhash country, flag}

        const newArtAndArticle = new modelArtAndArticle ( {department, productId, markStar: StarValue, comment : answer, commentatorData : Data, commentatorId} );
        //console.log("newArtAndArticle :", newArtAndArticle);
        const saveArtAndArticle = newArtAndArticle.save();
    }

    async function editProduct(){

        if (department === "items"){
            const search = await modelItems.findOne({ _id : productId});
            const markStarCurrent = search.rateData.markStar;
            const commentsCurrent = search.rateData.comments; 
            console.log("search :", search); 

            console.log(`StarValue  : ${StarValue}`);
            console.log(`markStarCurrent  : ${markStarCurrent}`);
            console.log(`commentsCurrent  : ${commentsCurrent}`);
            console.log(`typeof---> StarValue  : ${typeof StarValue} | markStarCurrent  : ${typeof markStarCurrent} | commentsCurrent  : ${typeof commentsCurrent} `);
            //typeof  : number | starValue  : string
            let newMarkStar, comments;


            if (markStarCurrent !==0){
                newMarkStar = parseFloat(((markStarCurrent + StarValue) / 2).toFixed(1));
                comments = commentsCurrent + 1;
                console.log("newMarkStar .....:", newMarkStar);
                console.log("comments .....:", comments);
            } else {
                newMarkStar = StarValue;
                comments = commentsCurrent + 1 ;
                console.log("newMarkStar .....:", newMarkStar);
                console.log("comments .....:", comments);
            }

            const update = await modelItems.updateOne({ _id : productId}, {$set : { 'rateData.markStar' : newMarkStar, 'rateData.comments' : comments } } );
            const updateMessage = await modelMessages.findByIdAndUpdate( idMesagge, {$set : {view: true, markStar: newMarkStar, answer: answer}} );

        } else {
            const search = await modelArtes.findOne({ _id : productId});
            const markStarCurrent = search.rateData.markStar;
            const commentsCurrent = search.rateData.comments; 
            console.log("search :", search); 

            console.log(`markStarCurrent  : ${markStarCurrent} | StarValue  : ${StarValue}`);
            console.log(`commentsCurrent  : ${commentsCurrent}`);
            console.log(`typeof--->  markStarCurrent  : ${typeof markStarCurrent} | StarValue  : ${typeof StarValue}`);
            //typeof  : number | starValue  : string
            let newMarkStar, comments;

            if (markStarCurrent !==0){
                newMarkStar = parseFloat(((markStarCurrent + StarValue) / 2).toFixed(1));
                comments = commentsCurrent + 1;
                console.log("newMarkStar .....:", newMarkStar);
            } else {
                newMarkStar = StarValue;
                comments = commentsCurrent + 1;
                console.log("newMarkStar .....:", newMarkStar);
            }

            const update = await modelArtes.updateOne({ _id : productId}, {$set : { 'rateData.markStar' : newMarkStar, 'rateData.comments' : comments } } );
            const updateMessage = await modelMessages.findByIdAndUpdate( idMesagge, {$set : {view: true, markStar: newMarkStar, answer: answer}} );
        }

    }

     

    createRateArtAndArticle()
        .then(()=>{

            editProduct()
                .then(()=>{
                    console.log("todo ha resultado de maravilla");
                    const message = "Calificación y Comentario enviado.";
                    res.json({ code: "ok", message});
                })
                .catch((err)=>{
                    console.log("ha habido un error en editProduct()", err);
                    const message = "Ha habido un error, intente mas tarde.";
                    res.json({ code: "err", message});
                })
        })
        .catch((err)=>{
            console.log("ha habido un error en createArtAndArticle()", err);
            const message = "Ha habido un error, intente mas tarde.";
            res.json({ code: "err", message});
        })


});

routes.get('/myaccount/messenger', async (req,res)=>{
    let userId;
    let searchProfile, searchMessageInbox, searchMessageOutbox, countMessagesInbox, countMessagesOutbox, totalMessages;
    let searchMessageSend, countMessages;
    let searchBoxMessageInbox = [];
    const user = req.session.user; // datos del usuario

    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell
 
    if (user){
        userId = user._id;
        console.log("este es el id del usuarios logeado --->", userId);

        searchProfile = await modelProfile.find({ indexed : userId });
    
        console.log("Aqui el profile de la cuenta", searchProfile);

        //primer paso ubicar todos los mensajes que tenga el usuario logeado y que el campo answer diga waiting.
        const searchMessageInbox0 = await modelMessages.find( { $and: [{ toCreatedArticleId : userId },{answer: "waiting"}, { typeNote: { $ne: "availability-noti" } } ] } );
        const searchMessageInbox1 = await modelMessages.find( { $and: [{ userId : userId }, { typeNote : "availability-noti" }, {answer: "waiting"} ] } );
        
        searchBoxMessageInbox.push(...searchMessageInbox0, ...searchMessageInbox1);
        searchBoxMessageInbox.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); //aqui ordenamos de menor a mayor por fecha
        searchMessageInbox = searchBoxMessageInbox; 
        console.log("Estos son todos los mensajes que tiene este usuario en Inbox --->", searchMessageInbox);
       
        countMessagesInbox = searchMessageInbox.length;
   
        console.log('esta es la cantidad de mensajes que tiene este usario en inbox--->', countMessagesInbox)

        const searchMessageOutbox = await modelMessages.find( { $and: [{userId : userId },{view: false},{ typeNote: { $ne: "availability-noti" } } ] } ).sort({ createdAt: 1 }); // 1 para orden ascendente, -1 para descendente;
        const searchMessageOutboxAlert = await modelMessages.find( { $and: [{userId : userId },{view: false},{ typeNote: { $ne: "availability-noti" }}, { answer: { $ne: "waiting" } } ] } );
        countMessagesOutbox = searchMessageOutboxAlert.length;


        console.log('esta es la cantidad de mensajes que tiene este usario en Outbox--->', countMessagesOutbox)

        totalMessages = (countMessagesInbox + countMessagesOutbox);
        console.log("este es la totalidad de los mensajes en inbox y en outbox ----->", totalMessages)
        //aqui tenemos la sumatoria de mensajes en Inbox y Outbox

        req.session.countMessages = totalMessages
        countMessages = req.session.countMessages;

        //este objeto muestra los mensajes enviados de cada usuario
        searchMessageSend = await modelMessages.find( {$and: [{userId : userId }, {view : false} ]} );

        res.render('page/messenger', {user, searchMessageInbox, searchMessageOutbox, countNegotiationsBuySell, countMessages, searchMessageSend, searchProfile})   
      
    } else {

        res.render('page/messenger', {user})   
    }
   


});

routes.post('/myaccount/messenger/response', async(req, res)=>{
    const idMesagge = req.body.idMesagge;
    const answer = req.body.answer;
    console.log("Esta es la respuesta del anunciante al posible comprador", answer)
    const response = await modelMessages.findByIdAndUpdate(idMesagge, {answer} );
    console.log("---------------------- revisar --------------------------");
    console.log("** Aqui el objeto actualizado ***",response);
    const userId = response.userId; //66ab9dc1b8c25e5528f4ea9d -->string
    const titleArticle = response.titleArticle; //string
    const urlImageArticle = response.urlImageArticle; //url de imagen

    //descubrimos el chatId del user de la Tienda si posee
    const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(userId));
    const chatId = searchUserStore.blissBot.chatId; //si la tienda posee chatId esta sincronizada.
    console.log("chatId ---->", chatId);

    if (chatId){
        blissBotNoti()
    }

    async function blissBotNoti(){
        const Message = `Notificación de Blissenet.com: Message\n\n¡Hola! Te han respondido la pregunta que has hecho sobre "${titleArticle}". No pierdas tu artículo mira la respuesta ahora en Blissenet.com`;

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

    //buscamos el user



    res.redirect('/myaccount/messenger')
})

routes.get('/myaccount/messenger/view/:id', async(req, res)=>{
    console.log("Estoy llegando al backend para cambiar de false a true en el campo view");
    const idMessage = req.params.id;
    console.log("Este es el id del message ***************", idMessage)

    const result = await modelMessages.findById(idMessage);
    console.log("Esto es result message", result);
    console.log("*********************************************** ver ********************************************************");
    console.log("Esto es result result.typeNote -->", result.typeNote );

    if (result.typeNote === "notes" || result.typeNote === "spread" || result.typeNote === "followMe" || result.typeNote === "availability-noti" || result.typeNote ===  "shoppingCart-Del" || result.typeNote ===  "shoppingCart-Paid" || result.typeNote ===  "shoppingCart-unPaid" ){ 
        
        const change = await modelMessages.findByIdAndUpdate(idMessage, { view : true, answer : 'process' } );

    } else { //result.typeNote === "message"

        const change = await modelMessages.findByIdAndUpdate(idMessage, { view : true } );

    }

   
    //con este cambio de estado false a true ya no aparece en mi Outbox
    res.redirect('/myaccount/messenger');
});


routes.post('/messages-product', async(req, res)=>{
    //console.log("<<<<<<<<Esto es lo que esta llegando al backend>>>>>>>>>>");
    //console.log(req.body);
    const { idProduct } = req.body
    //console.log(idProduct);
    const viewMessage = await modelMessages.find({productId : idProduct}).sort({createdAt : -1})
    //console.log("::::: viewMessage :::::", viewMessage )
    res.json(viewMessage);
});


//-----------------------------------------------------------------------------------------------------
//esta ruta maneja las notas creadas por el anfitrion de una subasta.
routes.post('/express-notes', async(req, res)=>{

    console.log("Hemos llegado a /express-notes");
    let updateRaffle, updateAuction;
    const { id, depart, nota, color } = req.body
    const date = new Date();
    const epoch = date.getTime();

    const newNote = { "depart" : depart, "id" : id ,"nota" : nota, "color" : color, "idNota" : epoch }; 
    console.log("Esto es newNote :", newNote);

    try{

        if (depart == 'auctions'){
            updateAuction = await modelAuction.findByIdAndUpdate(id, { $push : {notes : newNote }});
        } else if (depart == 'raffle'){
            updateRaffle = await modelRaffle.findByIdAndUpdate(id, { $push : {notes : newNote }});
        }
        
    
        if (updateAuction){
            //si este obejto existe es porque ha hecho una actualizacion
            //ahora buscamos nuevamente en la base de datos los datos que existen en el campo "notes"
            const searchAuctions = await modelAuction.findById(id);
            const searchNotes = searchAuctions.notes;
            console.log("Esto es searchNotes :". searchNotes);
                    
            res.json(searchNotes);
        }

        if (updateRaffle){
            //si este obejto existe es porque ha hecho una actualizacion
            //ahora buscamos nuevamente en la base de datos los datos que existen en el campo "notes"
            const searchRaffle = await modelRaffle.findById(id);
            const searchNotes = searchRaffle.notes;
            console.log("Esto es searchNotes :". searchNotes);
                    
            res.json(searchNotes);
        }

    }catch(error){
        console.log("Ha ocurrido un error, intente en unos minutos", error);
        const msgError = { msg: 'Ha ocurrido un error, intente en unos minutos'}
        res.json(msgError);
    }    
    

});


//ruta para extraer las notas de un anuncio. 
routes.post('/express-notes-extraer', async(req, res)=>{
        //console.log("Estamos en ----> : /express-notes-extraer")
        let searchNotes;
        const { id, depart } = req.body;

        if (depart == 'auctions'){
            const searchAuctions = await modelAuction.findById(id);
            if (searchAuctions){
                searchNotes = searchAuctions.notes;
                console.log("Esto es searchNotes :", searchNotes);
            }
        }

        if (depart == 'raffle'){
            const searchRaffle = await modelRaffle.findById(id);
            if (searchRaffle){
                searchNotes = searchRaffle.notes;
                console.log("Esto es searchNotes :", searchNotes);
            }
        }

        res.json(searchNotes);

});



//ruta para eliminar una nota de un anuncio. 
routes.post('/express-notes-deleting', async(req, res)=>{
        console.log("Estamos en ----> : /express-notes-deleting")
        let searchNotes;
        const { id, idNota, depart } = req.body;
        console.log("Esto es idNota", idNota);
        console.log(idNota);
        console.log(typeof idNota);

        if (depart == 'raffle'){
            const updateNotes = await modelRaffle.findByIdAndUpdate(id, { $pull : { notes : { idNota : idNota } }});         
            console.log("esto es updateNotes", updateNotes);
            //ahora vamos a buscar nuevamente en la DB y enviamos el nuevo array de notes actualizado via JSON
            const search = await modelRaffle.findById(id);
            searchNotes = search.notes;
        }

        if (depart == 'auctions'){
            const updateNotes = await modelAuction.findByIdAndUpdate(id, { $pull : { notes : { idNota : idNota } }});         
            console.log("esto es updateNotes", updateNotes);
            //ahora vamos a buscar nuevamente en la DB y enviamos el nuevo array de notes actualizado via JSON
            const search = await modelAuction.findById(id);
            searchNotes = search.notes;
        }


        res.json(searchNotes);
});



//-------------------------------------------------------------------------------------------------
module.exports = routes;







