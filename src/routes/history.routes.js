const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelBuysell = require('../models/buySell.js');
const modelNegotiation = require('../models/negotiations.js');
const modelRaffleHistory = require('../models/raffleHistory.js');

routes.get('/history/', async(req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let searchProfile;
    let searchBuy, searchSell;
    let searchContactBuy, searchContactSell;
    let raffleHistory
    
    console.log(":::: Cantidad de mensajes que tiene este usuario :::: ->", countMessages);    
    console.log(":::: Esto es la cantidad de negotiationsBuySell :::: ->", countNegotiationsBuySell);
    
    if (user){// este codigo es para poder ver esta pagina sin estar logeado
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);

        searchBuy =  await modelBuysell.find(  {$and : [{ usernameBuy : user.username },{ CommentSeller : { $ne : 'no_comment'}}]}   );
        searchSell = await modelBuysell.find(  {$and : [{ usernameSell : user.username },{ CommentBuy : { $ne : 'no_comment'}}]}  ); 
        
        searchContactBuy = await modelNegotiation.find( { $and : [{ usernameBuy : user.username }, { closedContact : true} ] } );
        searchContactSell = await modelNegotiation.find( { $and : [{ usernameSell : user.username }, { closedContact : true} ] } );

        raffleHistory = await modelRaffleHistory.find( { $and : [{anfitrion : user.username}, { celebration : true }]} );
    }


    //console.log("searchBuy -->", searchBuy);
    //console.log("searchSell -->", searchSell);
    console.log("raffleHistory -->", raffleHistory);            
   
    console.log('-------------')
    //console.log("searchContactBuy -->", searchContactBuy);
    //console.log("searchContactSell -->", searchContactSell);


    res.render('page/history', {user, countMessages, countNegotiationsBuySell, searchProfile, searchBuy, searchSell, searchContactBuy, searchContactSell, raffleHistory });
});
           
routes.get('/comments/:username', async(req, res)=>{
    
    let Date;
    let searchProfile;
    const countMessages = req.session.countMessages; //obtengo la cantidad de mensajes que pueda tener.
    //aqui obtengo la cantidad de negotiationsBuySell
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
    //console.log(":::: Esto es la cantidad de negotiationsBuySell desde comments ::::", countNegotiationsBuySell);

    const user = req.session.user; //obtengo el user

    if (user){// este codigo es para poder ver esta pagina sin estar logeado
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
    }
   
    //console.log("Esto es el parametro ----->", req.params)
    const username = req.params.username;
    console.log("Esto es username (Store:) ---->", username);
    
    const storeSearch = await modelProfile.find( { username } );
    console.log("Esto es el profile de esta store investigada storeSearch--->", storeSearch);
    
    const dateCreated = storeSearch.forEach((ele)=>{
    Date = ele.createdAt;
    });
    
    //Armando la fecha de creacion de esta tienda
    const dia = Date.getDate();
    const mes = Date.getMonth();
    const year = Date.getFullYear();
    
    const fullDate = `${dia}-${mes}-${year}`;
    console.log("Esto es fullDate ------>",fullDate);

    const searchSell = await modelBuysell.find(  {$and : [{ usernameSell : username },{ CommentBuy : { $ne : 'no_comment'}}]}  ); 
    console.log("::::::: Esto es el resultado de la busqueda searchSell ---->", searchSell );

    raffleHistory = await modelRaffleHistory.find( { $and : [{anfitrion : username}, { celebration : true }]} );

    res.render('page/comments', {user, searchProfile, countMessages, countNegotiationsBuySell, storeSearch, searchSell, raffleHistory, fullDate});  

});


module.exports = routes;
