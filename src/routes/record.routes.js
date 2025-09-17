const { Router } = require('express');
const routes = Router()
const modelProfile = require('../models/profile.js');
const modelBuySell = require('../models/buySell.js');
const modelInvoice = require('../models/invoice.js');
const modelRaffleHistory = require('../models/raffleHistory.js');

const user = require('../models/user.js');


routes.get('/record', async (req,res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let searchProfile;
        
    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
    }

    res.render('page/record', {user, countMessages, countNegotiationsBuySell, searchProfile});
  
});


//Esto esta en desarrollo, esta version vieja debe ser actualizado
routes.get('/record-trust', async(req, res)=>{
    const user = req.session.user;
    const username = user.username;
    let boxRaffle = [];
    let objeData = [];
    let forBuy, forSell, trustBuy, trustSell;
    console.log('Estamos en recordTrust');
    console.log(user);

    let countRafflePositivo = 0;
    let countRaffleNegativo = 0;
    let countOperationsRaffle = 0;

    async function countRafflePositive(){
        const searchRaffle = await modelRaffleHistory.find( { $and: [{ anfitrion : username }, { celebration : true }] } );
            
            for ( i= 0; i < searchRaffle.length; i++ ){
                const ID = searchRaffle[i].title_id
                const raffle = await modelRaffleHistory.find({ title_id : ID });
                console.log("**************ver*************")
                console.log("raffle :", raffle);
                const prizesObject = raffle[0].PrizesObject;
                console.log("Estamos en Record.routes");
                console.log("Esto es prizesObject --->", prizesObject)
                const numberOfPrizes = prizesObject.length;
                

                if ( prizesObject.length !==0 ){
                    console.log("existe elementos que se pueden iterar")
                    console.log("prizesObject", prizesObject)
                    for (let n = 0; n < prizesObject.length; n++ ){
                        const rate = prizesObject[n].rate;
                        console.log("rate :", rate);

                        if (rate === 'positivo'){
                            countRafflePositivo = countRafflePositivo + 1
                        } else if (rate === 'negativo') {
                            countRaffleNegativo = countRaffleNegativo + 1
                        }

                    }

                    countOperationsRaffle = countRafflePositivo + countRaffleNegativo;
                    //el contador de operaciones es la suma de los puntos positivos y negativos.
                    //puesto que si se llegara a usar la cantidad de premios y un usuario no pueda calificar no 
                    //dañe la reputacion del anfitrion. 
                }



                
            }
    }

    async function searchData(){

        const searchProfile = await modelProfile.find( {username : username } );
        
        const searchForBuy = await modelBuySell.find( {$and : [{usernameBuy : username }, {  confirmPay : 'Yes' }]} ).count();
        const searchForSell = await modelBuySell.find( {$and : [{usernameSell : username}, { payCommission : true }]} ).count();
        
        const trustBuyPosi = await modelBuySell.find( {$and: [{usernameBuy : username},{ratingBuy : 'Positivo'}]}  ).count();
        const trustBuyNega = await modelBuySell.find( {$and: [{usernameBuy : username},{ratingBuy : 'Negativo'}]}  ).count();
        const trustBuyNeut = await modelBuySell.find( {$and: [{usernameBuy : username},{ratingBuy : 'Neutral'}]}  ).count();
        const trustBuyOper = await modelBuySell.find( {usernameBuy : username} ).count();

        const trustSellPosi = await modelBuySell.find( {$and: [{usernameSell : username},{ratingBuy : 'Positivo'}, {payCommission : true}]}  ).count();
        const trustSellNega = await modelBuySell.find( {$and: [{usernameSell : username},{ratingBuy : 'Negativo'}]}  ).count();
        const trustSellNeut = await modelBuySell.find( {$and: [{usernameSell : username},{ratingBuy : 'Neutral'}]}  ).count();
        const trustSellOper = await modelBuySell.find( {usernameSell : username} ).count();

        forBuy = { data : "buyer", count : searchForBuy, avatar : searchProfile[0].avatarPerfil[0].url, mailhash : user.mailhash};
        forSell = { data : "seller", count : searchForSell,  avatar : searchProfile[0].avatarPerfil[0].url, mailhash : user.mailhash};

        trustBuy = { data : "trustBuy", positive : trustBuyPosi, negative : trustBuyNega, neutral : trustBuyNeut, operationsBuy : trustBuyOper };
        trustSell = { data : "trustSell", positive : trustSellPosi, negative : trustSellNega, neutral : trustSellNeut, operationsSell : trustSellOper };
    }
        
    
    countRafflePositive()
        .then(()=>{
            searchData()
                .then(()=>{
                    console.log("countRafflePositivo", countRafflePositivo);
                    const dataRaffle = { countRafflePositivo, countRaffleNegativo, countOperationsRaffle };
                    boxRaffle.push(dataRaffle); //todos los puntos ganados por positivos.
            
                    objeData.push(forBuy);
                    objeData.push(forSell);
                    objeData.push(trustBuy);
                    objeData.push(trustSell);
                    objeData.push(dataRaffle);
            
                    res.json(objeData);
                })

        })
        .catch((error)=>{
            console.log("Ha habido un error", error);
        })
    
    //console.log("Esto es objeData ------->",objeData);

    
});

//Ruta para acceder al Record-Trust de cualquier Store o Usuario.

routes.post('/record-trust', async(req, res)=>{
   
    //console.log(req.body);
    const store = req.body.store;
    //console.log("estamos enviando la tienda para buscar toda la informacion requerida", store)
    let countRafflePositivo = 0;
    let countRaffleNegativo = 0;
    let countOperationsRaffle = 0;
    let forSell, trustSell;
    let objeData = [];

    //console.log('Estamos en recordTrust');

    async function countRafflePositive(){
        const searchRaffle = await modelRaffleHistory .find( { $and: [{ anfitrion : store }, { celebration : true }] } );
            
            for ( i= 0; i < searchRaffle.length; i++ ){
                const ID = searchRaffle[i].title_id
                const raffle = await modelRaffleHistory.find({ title_id : ID });
                const prizesObject = raffle[0].PrizesObject;
                //console.log("Estamos en Record.routes");
                //console.log("Esto es prizesObject --->", prizesObject)
                const numberOfPrizes = prizesObject.length;
                
    
                if ( prizesObject.length !==0 ){
                    //console.log("existe elementos que se pueden iterar")
                    //console.log("prizesObject", prizesObject)
                    for (let n = 0; n < prizesObject.length; n++ ){
                        const rate = prizesObject[n].rate;
                        console.log("rate :", rate);
    
                        if (rate === 'positivo'){
                            countRafflePositivo = countRafflePositivo + 1
                        } else if (rate === 'negativo') {
                            countRaffleNegativo = countRaffleNegativo + 1
                        }
    
                    }
    
                    countOperationsRaffle = countRafflePositivo + countRaffleNegativo;
                    //el contador de operaciones es la suma de los puntos positivos y negativos.
                    //puesto que si se llegara a usar la cantidad de premios y un usuario no pueda calificar no 
                    //dañe la reputacion del anfitrion. 
                }
    
    
    
                
            }
    }

    async function searchData(){

        const searchForSell = await modelBuySell.find( {$and : [{usernameSell : store}, { payCommission : true }]} ).count();
        const trustSellPosi = await modelBuySell.find( {$and: [{usernameSell : store},{ratingBuy : 'Positivo'}, {payCommission : true}]}  ).count();
        const trustSellNega = await modelBuySell.find( {$and: [{usernameSell : store},{ratingBuy : 'Negativo'}]}  ).count();
        const trustSellNeut = await modelBuySell.find( {$and: [{usernameSell : store},{ratingBuy : 'Neutral'}]}  ).count();
        const trustSellOper = await modelBuySell.find( {usernameSell : store} ).count();

        forSell = { data : "seller", count : searchForSell};

        trustSell = { data : "trustSell", positive : trustSellPosi, negative : trustSellNega, neutral : trustSellNeut, operationsSell : trustSellOper };    
    
    }

    countRafflePositive()
    .then(()=>{
        searchData()
            .then(()=>{
                console.log("countRafflePositivo", countRafflePositivo);
                const dataRaffle = { countRafflePositivo, countRaffleNegativo, countOperationsRaffle };
                
                objeData.push(dataRaffle);
                objeData.push(forSell, trustSell);
                //console.log("Esto es objeData ------->",objeData); 
                

                res.json(objeData);

                
        
              
            })

    })
    .catch((error)=>{
        console.log("Ha habido un error", error);
    })



});


module.exports = routes;
