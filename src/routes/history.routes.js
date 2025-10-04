const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelBuysell = require('../models/buySell.js');
const modelNegotiation = require('../models/negotiations.js');
const modelRaffleHistory = require('../models/raffleHistory.js');
const modelShoppingCart = require('../models/shoppingCart.js');

routes.get('/history/', async(req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let searchProfile;
    const searchBuy = [];
    const searchSell = [];
    let searchContactBuy, searchContactSell;
    let raffleHistory

    
    console.log(":::: Cantidad de mensajes que tiene este usuario :::: ->", countMessages);    
    console.log(":::: Esto es la cantidad de negotiationsBuySell :::: ->", countNegotiationsBuySell);
    
    if (user){// este codigo es para poder ver esta pagina sin estar logeado
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        //console.log("Aqui el profile de la cuenta", searchProfile);

        const commertBuy =  await modelBuysell.find(  {$and : [{ usernameBuy : user.username },{ CommentSeller : { $ne : 'no_comment'}}]}   );
        const shoppCartBuy = await modelShoppingCart.find( { $and : [{ customerId: user._id }, { CommentBuy: { $ne : "no_comment" } } ]  });
        searchBuy.push(... commertBuy, ...shoppCartBuy);

        const commertSell = await modelBuysell.find(  {$and : [{ usernameSell : user.username },{ CommentBuy : { $ne : 'no_comment'}}]}  ); 
        const shoppCartSell = await modelShoppingCart.find({ $and : [{ sellerId: user._id }, { CommentSeller: { $ne : "no_comment" } } ]  });
        searchSell.push(... commertSell, ...shoppCartSell);

        searchContactBuy = await modelNegotiation.find( { $and : [{ usernameBuy : user.username }, { closeOperationBuy : true} ] } );
        searchContactSell = await modelNegotiation.find( { $and : [{ usernameSell : user.username }, { closeOperationSeller : true} ] } );

        raffleHistory = await modelRaffleHistory.find( { $and : [{anfitrion : user.username}, { celebration : true }]} );

        
       
    }

    console.log("searchBuy -->", searchBuy);
    console.log("searchSell -->", searchSell);
    console.log("raffleHistory -->", raffleHistory);            
   
    console.log('-------------')
    //console.log("searchContactBuy -->", searchContactBuy);
    //console.log("searchContactSell -->", searchContactSell);


    res.render('page/history', {user, countMessages, countNegotiationsBuySell, searchProfile, searchBuy, searchSell, searchContactBuy, searchContactSell, raffleHistory });
});
           
routes.get('/comments/:username', async(req, res)=>{
    
   try {
    
        let Date;
        let searchProfile;
        const countMessages = req.session.countMessages; //obtengo la cantidad de mensajes que pueda tener.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;

        console.log(":::: Esto es la cantidad de countMessages ::::", countMessages);
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);

        const user = req.session.user; //obtengo el user

        if (user){// este codigo es para poder ver esta pagina sin estar logeado
            console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.find({ indexed : user._id });
            //console.log("Aqui el profile de la cuenta", searchProfile);
        }
    
        //console.log("Esto es el parametro ----->", req.params)
        const username = req.params.username;
        console.log("Esto es username (Store:) ---->", username);
        
        const storeSearch = await modelProfile.find( { username } );
        //console.log("Esto es el profile de esta Tienda --->", storeSearch);
        Date = storeSearch[0].createdAt;
        indexed = storeSearch[0].indexed;

        //Armando la fecha de creacion de esta tienda
        const dia = Date.getDate();
        const mes = Date.getMonth() + 1;
        const year = Date.getFullYear();
        
        const fullDate = `${dia}-${mes}-${year}`;
        console.log("Esto es fullDate ------>",fullDate);

        let searchSell = [];
        //const searchSell = await modelBuysell.find(  {$and : [{ usernameSell : username },{ CommentBuy : { $ne : 'no_comment'}}]}  ); 
    
        const commentbuySell = await modelBuysell.find(  {$and : [{ indexedSell : indexed },{ CommentBuy : { $ne : 'no_comment'}}]}  ); 
        const shoppCartSell = await modelShoppingCart.find({ $and : [{ sellerId: indexed }, { CommentSeller: { $ne : "no_comment" } } ]  });
        searchSell.push(... commentbuySell, ...shoppCartSell);
 
        raffleHistory = await modelRaffleHistory.find( { $and : [{anfitrion : username}, { celebration : true }]} );

        console.log("Esto es searchSell ---->", searchSell );
        console.log("Esto es raffleHistory :", raffleHistory);

        res.render('page/comments', { user, searchProfile, countMessages, countNegotiationsBuySell, storeSearch, searchSell,raffleHistory, fullDate });  
    
    } catch (error) {
        console.log("ha habido un error", error );
        res.status(500).send("Error en el servidor");
   }

});


module.exports = routes;
