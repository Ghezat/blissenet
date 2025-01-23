const { Router } = require('express');
const hash = require('object-hash');
const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelMessages = require('../models/messages.js');

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
        searchMessageInbox = searchBoxMessageInbox; 
        console.log("Estos son todos los mensajes que tiene este usuario en Inbox --->", searchMessageInbox);
       
        countMessagesInbox = searchMessageInbox.length;
   
        console.log('esta es la cantidad de mensajes que tiene este usario en inbox--->', countMessagesInbox)

        const searchMessageOutbox = await modelMessages.find( { $and: [{userId : userId },{view: false},{ typeNote: { $ne: "availability-noti" } } ] } );
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
    console.log("** Aqui el objeto actualizado ***",response)

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

    if (result.typeNote === "notes" || result.typeNote === "spread" || result.typeNote === "followMe" || result.typeNote === "availability-noti" ){ 
        
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







