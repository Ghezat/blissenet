const { Router } = require('express');
const hash = require('object-hash');
const mongoose = require('mongoose');

const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelMessage = require('../models/messages.js');

const modelArtes = require('../models/artes.js');
const modelAirplane = require('../models/airplane.js');
const modelItems = require('../models/items.js');
const modelAutomotive = require('../models/automotive.js');
const modelRealstate = require('../models/realstate.js');
const modelNautical = require('../models/nautical.js');
const modelService = require('../models/services.js');
const modelAuction = require('../models/auction.js');
const modelRaffle = require('../models/raffle.js');

const modelStoreRate = require('../models/storeRate.js');
const modelCustomerSurvey = require('../models/customerSurvey.js');
const messages = require('../models/messages.js');
const modelFavorites = require('../models/favorites.js');
const modelBuySell = require('../models/buySell.js');
const modelNegotiation = require('../models/negotiations.js');
const modelShoppingCart = require('../models/shoppingCart.js');

const axios = require('axios');
const fs = require('fs-extra');
      
//este Token es la KEY del bot de Telegram
const Token =  process.env.Token_Bot;
//console.log("este es el Token de telegram :", Token);

routes.get('/account/:account', async (req,res)=>{
    
    //console.log("Este es el parametroooo ---->",req.params);
    const account  = req.params.account;
    console.log("este es el account a visitar o tienda", account) //rogelio 
    let countNegotiationsBuySell;
    let countMessages;
    
    const boxPublisher = [];
    let newBox;
    let boxOffert = [];
    const user = req.session.user;
        
    
    //console.log("este es el usuario visitante--->", user);
    //const countMessages = req.session.countMessages
    const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
    //console.log("ver receive -------------------------->", receive);
    let searchProfile;
    const segment = null;
    

    const Account = await modelUser.find({ username : account });
    const accountID = Account[0]._id;    

    async function searchOffert(){
        //ahora es momento de consultar en todas las colecciones de articulos en busca de ofertas.
        const respItems = await modelItems.find({ user_id: accountID, offer: true }).sort({ view: -1 });
        if (respItems.length > 0) {
            boxOffert.push(...respItems); // Usar el spread operator para añadir los elementos al array
        }
            
        const respAerop = await modelAirplane.find({user_id : accountID, offer : true }).sort({ view: -1 });
        if (respAerop.length > 0){
            boxOffert.push(...respAerop);
        }

        const respAutom = await modelAutomotive.find({user_id : accountID, offer : true }).sort({ view: -1 });
        if (respAutom.length > 0){
            boxOffert.push(...respAutom);
        }

        const respArtes = await modelArtes.find({user_id : accountID, offer : true }).sort({ view: -1 });
        if (respArtes.length > 0){
            boxOffert.push(...respArtes);
        }

        const respReals = await modelRealstate.find({user_id : accountID, offer : true }).sort({ view: -1 });
        if (respReals.length > 0){
            boxOffert.push(...respReals);
        }

        const respServi = await modelService.find({user_id : accountID, offer : true }).sort({ view: -1 });
        if (respServi.length > 0){
            boxOffert.push(...respServi);
        }

        const respNauti = await modelNautical.find({user_id : accountID, offer : true }).sort({ view: -1 });
        if (respNauti.length > 0){
            boxOffert.push(...respNauti);
        }

        const respAucti = await modelAuction.find({user_id : accountID, offer : true }).sort({ view: -1 });
        if (respAucti.length > 0){
            boxOffert.push(...respAucti);
        }

    }

    searchOffert()
        .then(()=>{
            //console.log("Aqui lo recaudado de las ofertas");
            //console.log("boxOffert --->",boxOffert);
            
        })
        .catch((err)=>{
            console.log("Ha ocurrido un error en la function searchOffert()")
        })
        
        
    if (user){
        //console.log("Esto es user._id ------>", user._id );
        const userId = user._id; //usaremos con el indexed en la coleccion profile.

        //aqui obtengo la cantidad de negotiationsBuySell
        //const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        //console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);

        const count = await negotiationsBuySell(userId); //llamamos la funcion y esperamos el valor para asignarlo en  countNegotiationsBuySell; 
        countNegotiationsBuySell = count;
        req.session.countNegotiationsBuySell = countNegotiationsBuySell; // ---> Esto es lo que se propagara por toda la aplicacion.
        console.log("VER....countNegotiationsBuySell........:", countNegotiationsBuySell); 

        const countMsg = await messengerCount(userId);
        countMessages = countMsg;
        req.session.countMessages = countMessages; // ---> Esto es lo que se propagara por toda la aplicacion
        console.log("VER....countMessages........:", countMessages); 


        searchProfile = await modelProfile.find({ indexed : userId });
        //console.log("Aqui el profile de la cuenta", searchProfile);

        const favoritesOfUser = await modelFavorites.find({indexed:userId}); //todos los favoritos de este usuario,
        console.log("favoritesOfUser ....... :", favoritesOfUser);

        if (Account.length !== 0){// si la cuenta (user) a la que se quiere acceder existe (tendra una longitud diferente a 0, entonces ejecuta el bloque siguiente)


            const accountId = Account[0]._id; //esto es un array y dentro esta el objeto al que queremos acceder
            const accountIdString = accountId.toString(); //paso de objectId a String
            //console.log("**********************ver esto**********************************")
            //console.log("Este es el id user del account que queremos visitar ...", accountId);  
            //console.log("typeof accountId ---->", typeof accountId); 
            
            //---consultamos si el user que visita esta tienda ya la sigue.     
            const statusFollow = await modelProfile.findOne({ indexed : userId, favoritestores : accountIdString });
            //console.log("statusFollow --->", statusFollow);
            //-----------------------------------------------------------------

            const storeProfile = await modelProfile.findOne({ indexed : accountId });
            const segmentations = storeProfile.segment; // ["All", "Hoverboard"];
            const segmentDefault = segmentations[0];
            //console.log("Aqui el profile de la **Tienda** a visistar --->", storeProfile);
            //console.log("Aqui la segmentations de la Tienda a visistar --->", segmentations);
            //console.log("Aqui el segmentDefault de la Tienda a visistar --->", segmentDefault);


            let view = storeProfile.view; //aqui guardo la cantidad de visitas actuales que tiene la tienda;
            //console.log('aqui las vistas  view---->', view);
            let signature = (view + 1);     

            //sumaremos la visita del visitante. osea aqui firma que llego a esa tienda.ok genial no? 
            //pero solo si el visistante no es el mismo propietario de la tienda ojo con eso.
            if ( storeProfile.indexed !== user._id ){
            //console.log("Esto es el storeProfile--->",storeProfile[0].indexed);
            //console.log("Esto es el user._id---->",user._id);
            const firmaVisitante = await modelProfile.updateOne({ indexed : accountId },{ view : signature });
            //console.log("Aqui la firma del visitante ---->", firmaVisitante)
            }


    
            //**Orden descendente (`-1`)**: En tu ejemplo, al ordenar por vistas de forma descendente, los documentos se mostrarían en el siguiente orden: primero el documento con 30 vistas, luego el de 15 vistas y finalmente el de 7 vistas. Así que el resultado sería **(30, 15, 7)**.
            //**Orden ascendente (`1`)**: Si quisieras hacerlo al revés, es decir, que los documentos se muestren desde el menor número de vistas al mayor, deberías usar `sort({ views: 1 })`, lo que daría como resultado **(7, 15, 30)**.
            //const resultAirplane = await modelAirplane.find({ $and: [{ user_id: accountId }, { visibleStore: true }] }).sort({ views: -1 }) -->por vista ascendete 50,40,16,7,3
            //const resultAirplane = await modelAirplane.find({ $and: [{ user_id: accountId }, { visibleStore: true }] }).sort({ createdAt: -1 }) -->por creacion ascendete 50,40,16,7,3

            //**Orden por title ascendente a, b, c, d, e, f */
            /* const resultAirplane = await modelAirplane.find({ $and: [{ user_id: accountId }, { visibleStore: true }] }).sort({ title: 1 }); */

            if (storeProfile) { 
                const searchBanner = storeProfile.bannerPerfil;
                const buyCar = storeProfile.buyCar; //esto es para detectar si la tienda tiene activado el carrito de compra. (importante porque el carrito solo muestra items y arte)
                console.log("...........................ver......................")
                //console.log("Esto es Account: ", Account);
                //console.log("Este es el valor de buyCar ...", buyCar);
                //console.log("Este es el valor de typeof buyCar ...", typeof buyCar);

                        //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones. 
                        const resultAirplane = await modelAirplane.find( { $and : [{user_id : accountId}, {visibleStore : true }] }).sort({ title: 1 });
                        const resultArtes = await modelArtes.find( { $and : [{user_id : accountId}, {visibleStore : true }] }).sort({ title: 1 });
                        const resultItems = await modelItems.find({ $and : [{user_id : accountId} , {visibleStore : true }] }).sort({ title: 1 });
                        const resultAutomotive = await modelAutomotive.find({ $and : [{user_id : accountId} , {visibleStore : true }] }).sort({ title: 1 });
                        const resultRealstate = await modelRealstate.find({ $and : [{user_id : accountId} , {visibleStore : true }] }).sort({ title: 1 });
                        const resultNautical = await modelNautical.find({ $and : [{user_id : accountId} , {visibleStore : true }] }).sort({ title: 1 });
                        const resultService = await modelService.find({ $and : [{user_id : accountId} , {visibleStore : true }]}).sort({ title: 1 });
                        const resultAuction = await modelAuction.find({ $and : [{user_id : accountId} , {visibleStore : true }]}).sort({ title: 1 });
                        const resultRaffle = await modelRaffle.find({ $and : [{user_id : accountId} , {visibleStore : true }]}).sort({ title: 1 });

                    if (buyCar === false){
                        
                        if (resultAirplane) {
                            boxPublisher.push(...resultAirplane)
                        } 
                        if (resultArtes) {
                            boxPublisher.push(...resultArtes)
                        }
                        if (resultItems) {
                            boxPublisher.push(...resultItems)
                        }
                        if (resultAutomotive) {
                            boxPublisher.push(...resultAutomotive)
                        }
                        if (resultRealstate) {
                            boxPublisher.push(...resultRealstate)
                        }
                        if (resultNautical) {
                            boxPublisher.push(...resultNautical)
                        }
                        if (resultService) {
                            boxPublisher.push(...resultService)
                        }
                        if (resultAuction) {
                            boxPublisher.push(...resultAuction)
                        }
                        if (resultRaffle) {
                            boxPublisher.push(...resultRaffle)
                        }

                    } else {

                        if (resultArtes) {
                            boxPublisher.push(...resultArtes)
                        }
                        if (resultItems) {
                            boxPublisher.push(...resultItems)
                        }

                    }    
    
                //console.log("Este es el boxPublisher ------>", boxPublisher);

                // paginate
                let long = boxPublisher.length; //conocer la longitud del array
                const limit = 20; //establecer la cantidad  de elementos que se mostrarán
                let pagina = 1; //declaracion de la pagina por default en 1
                let X, V; //variables importantes para guardar datos necesarios
                let totalPagina = Math.ceil(long / limit);    

                console.log("long : ", long);
                console.log("limit : ", limit);
                console.log("totalPagina : ", totalPagina);
    

                if (receive == undefined){

                    req.session.x = 0;
                    X = req.session.x;

                    //console.log("Estamos aqui en el inicio");
                    //console.log("Esto es el valor de x : ", X );
                    //aqui el nuevo arreglo por default 
                    newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                    const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                    res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert, favoritesOfUser });

                } else if (receive == "first"){

                    X = 0;//0
                    req.session.x = X;
                      
                    newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                     //        6    + 0  / 6 = 1 //aqui no hace falta el Math.ceil ya que siempre se dividira entre el mismo numero, siempre dara "1" 
                     pagina = (limit + X) / limit; //perfecto
                    //console.log("pagina :  ", pagina);
                    //console.log("totalPagina :  ", totalPagina);
                    const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                    res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert, favoritesOfUser });

                } else if (receive == "next"){

                    X = req.session.x; //24 al inicio.... en la cuarta vuelta es 24
                    // 20 +  8    < 31  =  true      
                    if (X + limit < long ){
                     // X  16 +  8  = 24
                        X = X + limit;
                        //console.log("XXXXXXXXXXXXXXXXXXXXXX");
                        //console.log("Ver valor de X :", X);
                        req.session.x = X;//24

                        newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                                    //       8   + 16 / 8 = 3
                        pagina = Math.ceil((limit + X) / limit);
                        //console.log("pagina :  ", pagina);
                        //console.log("totalPagina :  ", totalPagina);
                        const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                        res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert, favoritesOfUser });
           
                    }
          
            
                } else if (receive == "prev"){

                    X = req.session.x;
                    //console.log("Estamos en Prev");
                    //console.log("Esto es el valor de x :", X); //30

                    if (X  > 0){
   
                        X = X - limit //20
                        //console.log("XXXXXXXXXXXXXXXXXXXXXX");
                        //console.log("Ver valor de X :", X);//20
                        req.session.x = X; //20

                        newBox = boxPublisher.slice(X , limit + X); 
  
                        pagina = Math.ceil((limit + X) / limit);
                        //console.log("pagina :  ", pagina);
                        //console.log("totalPagina :  ", totalPagina);
                        const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                        res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert, favoritesOfUser });
                    } 
          

                } else if (receive == "last"){

                //console.log("Esto es long :", long);//30
                //console.log("Esto es limit :", limit);//10

                let n = (long % limit);//0

                if (n !==0 ){
                    X = long - limit; //30- 10 = 20
                    V = long - n;     //30- 3  = 27
                    req.session.x = V; //27
                    //console.log("Esto es n :", n);//3
                    //console.log("Esto es X :", X);//20
                } else {
                    X = long - limit; //30- 10 = 20
                    V = long - limit; //30- 10 = 20
                    req.session.x = V; //30
                    //console.log("Esto es n :", n);//0
                    //console.log("Esto es X :", X);//20
                }

                newBox = boxPublisher.slice(V , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                //       10   + 23  / 10 = 3.3 pero el Mat.ceil lo lleva a 4 perfecto
                pagina = Math.ceil((limit + X) / limit);
                //console.log("pagina :  ", pagina);
                //console.log("totalPagina :  ", totalPagina);
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };


                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert, favoritesOfUser });

                }
                  

            } else {
                res.render('page/account', {searchBanner, user, storeProfile, searchProfile, Account, countMessages, countNegotiationsBuySell});
            }   
               
        } else {
            res.render('partials/error404');
        };
        

    } else {
        //console.log("No hay usuario visitante.")
        searchProfile = []; 

        if (Account.length !== 0){// si la cuenta (user) a la que se quiere acceder existe (tendra una longitud diferente a 0, entonces ehecuta el bloque siguiente)


            const accountId = Account[0]._id; //esto es un array y dentro esta el objeto al que queremos acceder
            //console.log("Este es el id del account que queremos visitar ...", accountId);  

            const storeProfile = await modelProfile.findOne({ indexed : accountId });
            //console.log("Aqui el profile de la cuenta", storeProfile);

            let view = storeProfile.view; //aqui guardo la cantidad de visitas actuales que tiene la tienda;
            //console.log('aqui las vistas  view---->', view);
            let signature = (view + 1);     

            //sumaremos la visita del visitante. osea aqui firma que llego a esa tienda.ok genial no?

            const firmaVisitante = await modelProfile.updateOne({ indexed : accountId },{ view : signature });
            //console.log("Aqui la firma del visitante ---->", firmaVisitante)
            

            if (storeProfile) { 
                const searchBanner = storeProfile.bannerPerfil;
        
                //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones. 
                const resultAirplane = await modelAirplane.find({ $and : [{user_id : accountId}, {visibleStore : true }]}).sort({ title: 1 });
                const resultArtes = await modelArtes.find({ $and : [{user_id : accountId}, {visibleStore : true }]}).sort({ title: 1 });
                const resultItems = await modelItems.find({ $and : [{user_id : accountId}, {visibleStore : true }]}).sort({ title: 1 });
                const resultAutomotive = await modelAutomotive.find({ $and : [{user_id : accountId}, {visibleStore : true }]}).sort({ title: 1 });
                const resultRealstate = await modelRealstate.find({ $and : [{user_id : accountId}, {visibleStore : true }]}).sort({ title: 1 });
                const resultNautical = await modelNautical.find({ $and : [{user_id : accountId}, {visibleStore : true }]}).sort({ title: 1 });
                const resultService = await modelService.find({ $and : [{user_id : accountId}, {visibleStore : true }]}).sort({ title: 1 });
                const resultAuction = await modelAuction.find({ $and : [{user_id : accountId}, {visibleStore : true }]}).sort({ title: 1 });
                const resultRaffle = await modelRaffle.find({ $and : [{user_id : accountId} , {visibleStore : true }]}).sort({ title: 1 });

                if (resultAirplane) {
                    boxPublisher.push(...resultAirplane)
                } 
                if (resultArtes) {
                    boxPublisher.push(...resultArtes)
                }
                if (resultItems) {
                    boxPublisher.push(...resultItems)
                }
                if (resultAutomotive) {
                    boxPublisher.push(...resultAutomotive)
                }
                if (resultRealstate) {
                    boxPublisher.push(...resultRealstate)
                }
                if (resultNautical) {
                    boxPublisher.push(...resultNautical)
                }
                if (resultService) {
                    boxPublisher.push(...resultService)
                }
                if (resultAuction) {
                    boxPublisher.push(...resultAuction)
                }
                if (resultRaffle) {
                    boxPublisher.push(...resultRaffle)
                }

                //console.log("Este es el boxPublisher ------>", boxPublisher);
                // paginate
                let long = boxPublisher.length; //conocer la longitud del array
                const limit = 20; //establecer la cantidad  de elementos que se mostrarán
                let pagina = 1; //declaracion de la pagina por default en 1
                let X;
                let totalPagina = Math.ceil(long / limit);    
 
                //console.log("long : ", long);
                //console.log("limit : ", limit);
                //console.log("totalPagina : ", totalPagina);
     
 
                if (receive == undefined){
 
                     req.session.x = 0;
                     X = req.session.x;
 
                     //console.log("Estamos aqui en el inicio");
                     //console.log("Esto es el valor de x : ", X );
                     //aqui el nuevo arreglo por default 
                     newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
     
                     const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
 
                     res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, boxOffert});
 
                } else if (receive == "first"){
 
                     X = 0;//0
                     req.session.x = X;
                                            //   0    10 + 0
                     newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                                         // 10      / 10 = 1
                     pagina = Math.ceil((limit + X) / limit);
                     //console.log("pagina :  ", pagina);
                     //console.log("totalPagina :  ", totalPagina);
                     const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
 
                     res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, boxOffert});
 
                } else if (receive == "next"){
 
                     X = req.session.x;
 
                     if (X + limit < long ){
    
                         X = X + limit;//6
                         req.session.x = X;
 
                         newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
            
                         pagina = Math.ceil((limit + X) / limit);
                         //console.log("pagina :  ", pagina);
                         //console.log("totalPagina :  ", totalPagina);
                         const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
 
                         res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, boxOffert});
            
                     }
           
             
                } else if (receive == "prev"){
 
                     X = req.session.x;
                     //console.log("Estamos en Prev");
                     //console.log("Esto es el valor de x :", X); 
 
                     if (X  > 0){
    
                         X = X - limit
                         req.session.x = X;
 
                         newBox = boxPublisher.slice(X , limit + X); 
   
                         pagina = Math.ceil((limit + X) / limit);
                         //console.log("pagina :  ", pagina);
                         //console.log("totalPagina :  ", totalPagina);
                         const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
 
                         res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, boxOffert});
                     } 
           
 
                } else if (receive == "last"){
 

                    let n = (long % limit);
                    X = long - limit; 
                    V = long - n;    
                    req.session.x = V;
                            
                    newBox = boxPublisher.slice(V , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
            
                    pagina = Math.ceil((limit + X) / limit);
                    //console.log("pagina :  ", pagina);
                    //console.log("totalPagina :  ", totalPagina);
                    const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
 
                    res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, boxOffert});
 
                }

            } 

        } else {
            res.render('partials/error404');
        };
    }                       

    
    
});
    
    async function messengerCount(userId){

        let searchBoxMessageInbox = [];
        let searchMessageInbox;
        //primer paso ubicar todos los mensajes que tenga el usuario logeado y que el campo answer diga waiting.
        const searchMessageInbox0 = await modelMessage.find( { $and: [{ toCreatedArticleId : userId },{answer: "waiting"}, { typeNote: { $ne: "availability-noti" } } ] } );
        const searchMessageInbox1 = await modelMessage.find( { $and: [{ userId : userId }, { typeNote : "availability-noti" }, {answer: "waiting"} ] } );
        
        searchBoxMessageInbox.push(...searchMessageInbox0, ...searchMessageInbox1);
        searchBoxMessageInbox.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); //aqui ordenamos de menor a mayor por fecha
        searchMessageInbox = searchBoxMessageInbox; 
        const countMessagesInbox = searchMessageInbox.length;

        const searchMessageOutbox = await modelMessage.find( { $and: [{userId : userId },{view: false},{ typeNote: { $ne: "availability-noti" } } ] } ).sort({ createdAt: 1 }); // 1 para orden ascendente, -1 para descendente;
        const searchMessageOutboxAlert = await modelMessage.find( { $and: [{userId : userId },{view: false},{ typeNote: { $ne: "availability-noti" }}, { answer: { $ne: "waiting" } } ] } );
        const countMessagesOutbox = searchMessageOutboxAlert.length;

        const totalMessages = (countMessagesInbox + countMessagesOutbox);
        return totalMessages; // Retorna el conteo
    }

    async function negotiationsBuySell(userId){
        // :::::: Aqui obtengo la cantidad de negotiationsBuySell ::::::::
        const searchBuy = [];
        const searchSell = [];
    
        const searchOneBuy = await modelBuySell.find({  $and : [{ indexedBuy : userId},{ closeOperationBuy : false }, { cancel : false } ] });
        if (searchOneBuy){
            searchBuy.push(...searchOneBuy);
        }
        const searchTwoBuy = await modelNegotiation.find({ $and : [{ indexedBuy : userId }, { closeOperationBuy : false }]} );
        if (searchTwoBuy){
            searchBuy.push(...searchTwoBuy);
        }
        //aqui vamos a buscar todos los carritos pendinte por pagar que tiene este usuario
        const searchShoppingCartBuy = await modelShoppingCart.find({ $and : [{ customerId: userId }, { CommentSeller: "no_comment" } ]  });
        if (searchShoppingCartBuy){
            searchBuy.push(...searchShoppingCartBuy);
        }    

        const searchOneSell = await modelBuySell.find({ $and : [{ indexedSell : userId }, { closeOperationSeller : false },{ cancel : false } ] });
        if (searchOneSell){
            searchSell.push(...searchOneSell);
        }         
        const searchTwoSell = await modelNegotiation.find({ $and : [{ indexedSell : userId }, { closeOperationSeller : false }]} );
        if (searchTwoSell){
            searchSell.push(...searchTwoSell);
        }
        //aqui vamos a buscar todos los carritos pendinte por pagar que tiene este usuario    
        const searchShoppingCartSell = await modelShoppingCart.find({ $and : [{ sellerId: userId }, { CommentBuy: "no_comment" } ]  });
        if (searchShoppingCartSell){
            searchSell.push(...searchShoppingCartSell);
        }     

        const countNegotiationsBuySell = (searchBuy.length + searchSell.length);
        return countNegotiationsBuySell; // Retorna el conteo

    }
             
///account/${storeUsername}/${segment}
routes.get('/account/:storeUsername/:segment', async (req, res)=>{
    console.log('**************** selectSegment *****************');
    console.log('/account/${storeUsername}/${segment}');
    
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const {storeUsername, segment} = req.params
    let boxOffert = [];
     
    console.log(`store --> ${storeUsername} |  segment -->${segment} `);
    const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
    console.log(`receive --------------------------------------------->${receive}`);

    const usernameStore = await modelProfile.findOne({username : storeUsername});
    const StoreUsername = usernameStore.username;
    const storeID = usernameStore.indexed;

    //Consultamos todas las ofertas -----------------------------------------------

    async function searchOffert(){
        //ahora es momento de consultar en todas las colecciones de articulos en busca de ofertas.
        const respItems = await modelItems.find({ user_id: storeID, offer: true });
        if (respItems.length > 0) {
            boxOffert.push(...respItems); // Usar el spread operator para añadir los elementos al array
        }
            
        const respAerop = await modelAirplane.find({user_id : storeID, offer : true });
        if (respAerop.length > 0){
            boxOffert.push(...respAerop);
        }

        const respAutom = await modelAutomotive.find({user_id : storeID, offer : true });
        if (respAutom.length > 0){
            boxOffert.push(...respAutom);
        }

        const respArtes = await modelArtes.find({user_id : storeID, offer : true });
        if (respArtes.length > 0){
            boxOffert.push(...respArtes);
        }

        const respReals = await modelRealstate.find({user_id : storeID, offer : true });
        if (respReals.length > 0){
            boxOffert.push(...respReals);
        }

        const respServi = await modelService.find({user_id : storeID, offer : true });
        if (respServi.length > 0){
            boxOffert.push(...respServi);
        }

        const respNauti = await modelNautical.find({user_id : storeID, offer : true });
        if (respNauti.length > 0){
            boxOffert.push(...respNauti);
        }

        const respAucti = await modelAuction.find({user_id : storeID, offer : true });
        if (respAucti.length > 0){
            boxOffert.push(...respAucti);
        }

    }

    searchOffert()
        .then(()=>{
            console.log("Aqui lo recaudado de las ofertas");
            console.log("boxOffert --->",boxOffert);
            
        })
        .catch((err)=>{
            console.log("Ha ocurrido un error en la function searchOffert()")
        })


    //-----------------------------------------------------------------------------
    
    const url = `${StoreUsername}`; //el username del store
    let searchProfile;
    let searchBanner;
    const boxPublisher = [];
    const account = StoreUsername;

            
    if (user){
        const userId = user._id; //usaremos con el indexed en la coleccion profile.

        searchProfile = await modelProfile.find({ indexed : userId });
        //console.log("Aqui el profile de la cuenta", searchProfile);
    
        const Account = await modelUser.find({ username : account }); //esto hay que acomodar hay que buscar por id
        //console.log("Este es la data del account que queremos visitar ...", Account);

        if (Account.length !== 0){// si la cuenta (user) a la que se quiere acceder existe (tendra una longitud diferente a 0, entonces ejecuta el bloque siguiente)

            const accountId = Account[0]._id; //esto es un array y dentro esta el objeto al que queremos acceder
            const accountIdString = accountId.toString(); //paso de objectId a String
            //console.log("Este es el id del account que queremos visitar ...", accountId);  

            //---consultamos si el user que visita esta tienda ya la sigue.     
            const statusFollow = await modelProfile.findOne({ indexed : userId, favoritestores : accountIdString });
            console.log("statusFollow --->", statusFollow);
            //-----------------------------------------------------------------

            const storeProfile = await modelProfile.findOne({ indexed : accountId });
            //const segmentations = storeProfile.segment; // ["All", "Hoverboard"];
            //const segmentDefault = segmentations[0];
            console.log("///ver --> Aqui el profile de la ******Tienda***** a visistar --->", storeProfile);
            //console.log("Aqui la segmentations de la Tienda a visistar --->", segmentations);
            //console.log("Aqui el segmentDefault de la Tienda a visistar --->", segmentDefault);


            let view = storeProfile.view; //aqui guardo la cantidad de visitas actuales que tiene la tienda;
            //console.log('aqui las vistas  view---->', view);
            let signature = (view + 1);     

            //sumaremos la visita del visitante. osea aqui firma que llego a esa tienda.ok genial no? 
            //pero solo si el visistante no es el mismo propietario de la tienda ojo con eso.
            if ( storeProfile.indexed !== user._id ){
            //console.log("Esto es el storeProfile--->",storeProfile[0].indexed);
            //console.log("Esto es el user._id---->",user._id);
            const firmaVisitante = await modelProfile.updateOne({ indexed : accountId },{ view : signature });
            //console.log("Aqui la firma del visitante ---->", firmaVisitante)
            }


            //----------------------------------------------

            if (storeProfile) { 
                const searchBanner = storeProfile.bannerPerfil;

                if (segment === "All"){
                        //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones. 
                        const resultAirplane = await modelAirplane.find( { $and : [{user_id : accountId}, {visibleStore : true } ]}).sort({ title: 1 });
                        const resultArtes = await modelArtes.find( { $and : [{user_id : accountId}, {visibleStore : true } ]}).sort({ title: 1 });
                        const resultItems = await modelItems.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });
                        const resultAutomotive = await modelAutomotive.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });
                        const resultRealstate = await modelRealstate.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });
                        const resultNautical = await modelNautical.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });
                        const resultService = await modelService.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });
                        const resultAuction = await modelAuction.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });
                        const resultRaffle = await modelRaffle.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });

                        if (resultAirplane) {
                            boxPublisher.push(...resultAirplane)
                        } 
                        if (resultArtes) {
                            boxPublisher.push(...resultArtes)
                        }
                        if (resultItems) {
                            boxPublisher.push(...resultItems)
                        }
                        if (resultAutomotive) {
                            boxPublisher.push(...resultAutomotive)
                        }
                        if (resultRealstate) {
                            boxPublisher.push(...resultRealstate)
                        }
                        if (resultNautical) {
                            boxPublisher.push(...resultNautical)
                        }
                        if (resultService) {
                            boxPublisher.push(...resultService)
                        }
                        if (resultAuction) {
                            boxPublisher.push(...resultAuction)
                        }
                        if (resultRaffle) {
                            boxPublisher.push(...resultRaffle)
                        }
            
                        console.log("Este es el boxPublisher del selector de segmentos con valor All ------>");
                        console.log("Este es el boxPublisher un array de esta cantidad de elementos ------>", boxPublisher.length );

                        // paginate
                        let long = boxPublisher.length; //conocer la longitud del array
                        const limit = 20; //establecer la cantidad  de elementos que se mostrarán
                        let pagina = 1; //declaracion de la pagina por default en 1
                        let X, V; //variables importantes para guardar datos necesarios
                        let totalPagina = Math.ceil(long / limit);    

                        console.log("long : ", long);
                        console.log("limit : ", limit);
                        console.log("totalPagina : ", totalPagina);
            

                        if (receive == undefined){

                            req.session.x = 0;
                            X = req.session.x;

                            console.log("Estamos aqui en el inicio");
                            console.log("Esto es el valor de x : ", X );
                            //aqui el nuevo arreglo por default 
                            newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                            res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });

                        } else if (receive == "first"){

                            X = 0;//0
                            req.session.x = X;
                            
                            newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                            //        6    + 0  / 6 = 1 //aqui no hace falta el Math.ceil ya que siempre se dividira entre el mismo numero, siempre dara "1" 
                            pagina = (limit + X) / limit; //perfecto
                            //console.log("pagina :  ", pagina);
                            //console.log("totalPagina :  ", totalPagina);
                            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                            res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });

                        } else if (receive == "next"){
                            console.log("Estamos en paginate next ******************")
                            X = req.session.x; //24 al inicio.... en la cuarta vuelta es 24
                            // 20 +  8    < 31  =  true      
                            if (X + limit < long ){
                            // X  16 +  8  = 24
                                X = X + limit;
                                //console.log("XXXXXXXXXXXXXXXXXXXXXX");
                                //console.log("Ver valor de X :", X);
                                req.session.x = X;//24

                                newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                                            //       8   + 16 / 8 = 3
                                pagina = Math.ceil((limit + X) / limit);
                                //console.log("pagina :  ", pagina);
                                //console.log("totalPagina :  ", totalPagina);
                                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
                                console.log("newBox ver estamo sen next---->", newBox)

                                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
              
                            }
                
                    
                        } else if (receive == "prev"){

                            X = req.session.x;
                            //console.log("Estamos en Prev");
                            //console.log("Esto es el valor de x :", X); //30

                            if (X  > 0){
        
                                X = X - limit //20
                                //console.log("XXXXXXXXXXXXXXXXXXXXXX");
                                //console.log("Ver valor de X :", X);//20
                                req.session.x = X; //20

                                newBox = boxPublisher.slice(X , limit + X); 
        
                                pagina = Math.ceil((limit + X) / limit);
                                //console.log("pagina :  ", pagina);
                                //console.log("totalPagina :  ", totalPagina);
                                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
                            } 
                

                        } else if (receive == "last"){

                        //console.log("Esto es long :", long);//30
                        //console.log("Esto es limit :", limit);//10

                        let n = (long % limit);//0

                        if (n !==0 ){
                            X = long - limit; //30- 10 = 20
                            V = long - n;     //30- 3  = 27
                            req.session.x = V; //27
                            //console.log("Esto es n :", n);//3
                            //console.log("Esto es X :", X);//20
                        } else {
                            X = long - limit; //30- 10 = 20
                            V = long - limit; //30- 10 = 20
                            req.session.x = V; //30
                            //console.log("Esto es n :", n);//0
                            //console.log("Esto es X :", X);//20
                        }

                        newBox = boxPublisher.slice(V , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                        //       10   + 23  / 10 = 3.3 pero el Mat.ceil lo lleva a 4 perfecto
                        pagina = Math.ceil((limit + X) / limit);
                        //console.log("pagina :  ", pagina);
                        //console.log("totalPagina :  ", totalPagina);
                        const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };


                        res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });

                        }
                  


                } else {

                        //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones. 
                        const resultAirplane = await modelAirplane.find( { $and : [{user_id : accountId}, {visibleStore : true }, {segment : segment } ]}).sort({ title: 1 });
                        const resultArtes = await modelArtes.find( { $and : [{user_id : accountId}, {visibleStore : true }, {segment : segment }]}).sort({ title: 1 });
                        const resultItems = await modelItems.find({ $and : [{user_id : accountId} , {visibleStore : true }, {segment : segment} ]}).sort({ title: 1 });
                        const resultAutomotive = await modelAutomotive.find({ $and : [{user_id : accountId} , {visibleStore : true }, {segment : segment} ]}).sort({ title: 1 });
                        const resultRealstate = await modelRealstate.find({ $and : [{user_id : accountId} , {visibleStore : true } , {segment : segment} ]}).sort({ title: 1 });
                        const resultNautical = await modelNautical.find({ $and : [{user_id : accountId} , {visibleStore : true } , {segment : segment} ]}).sort({ title: 1 });
                        const resultService = await modelService.find({ $and : [{user_id : accountId} , {visibleStore : true } , {segment : segment} ]}).sort({ title: 1 });
                        const resultAuction = await modelAuction.find({ $and : [{user_id : accountId} , {visibleStore : true } , {segment : segment} ]}).sort({ title: 1 });
                        const resultRaffle = await modelRaffle.find({ $and : [{user_id : accountId} , {visibleStore : true } , {segment : segment} ]}).sort({ title: 1 });

                        if (resultAirplane) {
                            boxPublisher.push(...resultAirplane)
                        } 
                        if (resultArtes) {
                            boxPublisher.push(...resultArtes)
                        }
                        if (resultItems) {
                            boxPublisher.push(...resultItems)
                        }
                        if (resultAutomotive) {
                            boxPublisher.push(...resultAutomotive)
                        }
                        if (resultRealstate) {
                            boxPublisher.push(...resultRealstate)
                        }
                        if (resultNautical) {
                            boxPublisher.push(...resultNautical)
                        }
                        if (resultService) {
                            boxPublisher.push(...resultService)
                        }
                        if (resultAuction) {
                            boxPublisher.push(...resultAuction)
                        }
                        if (resultRaffle) {
                            boxPublisher.push(...resultRaffle)
                        }
            
                        //console.log("Este es el boxPublisher ------>", boxPublisher);

                        // paginate
                        let long = boxPublisher.length; //conocer la longitud del array
                        const limit = 20; //establecer la cantidad  de elementos que se mostrarán
                        let pagina = 1; //declaracion de la pagina por default en 1
                        let X, V; //variables importantes para guardar datos necesarios
                        let totalPagina = Math.ceil(long / limit);    

                        console.log("long : ", long);
                        console.log("limit : ", limit);
                        console.log("totalPagina : ", totalPagina);
            

                        if (receive == undefined){

                            req.session.x = 0;
                            X = req.session.x;

                            console.log("Estamos aqui en el inicio");
                            console.log("Esto es el valor de x : ", X );
                            //aqui el nuevo arreglo por default 
                            newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                            res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });

                        } else if (receive == "first"){

                            X = 0;//0
                            req.session.x = X;
                            
                            newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                            //        6    + 0  / 6 = 1 //aqui no hace falta el Math.ceil ya que siempre se dividira entre el mismo numero, siempre dara "1" 
                            pagina = (limit + X) / limit; //perfecto
                            //console.log("pagina :  ", pagina);
                            //console.log("totalPagina :  ", totalPagina);
                            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                            res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });

                        } else if (receive == "next"){

                            X = req.session.x; //24 al inicio.... en la cuarta vuelta es 24
                            // 20 +  8    < 31  =  true      
                            if (X + limit < long ){
                            // X  16 +  8  = 24
                                X = X + limit;
                                //console.log("XXXXXXXXXXXXXXXXXXXXXX");
                                //console.log("Ver valor de X :", X);
                                req.session.x = X;//24

                                newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                                            //       8   + 16 / 8 = 3
                                pagina = Math.ceil((limit + X) / limit);
                                //console.log("pagina :  ", pagina);
                                //console.log("totalPagina :  ", totalPagina);
                                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
                
                            }
                
                    
                        } else if (receive == "prev"){

                            X = req.session.x;
                            //console.log("Estamos en Prev");
                            //console.log("Esto es el valor de x :", X); //30

                            if (X  > 0){
        
                                X = X - limit //20
                                //console.log("XXXXXXXXXXXXXXXXXXXXXX");
                                //console.log("Ver valor de X :", X);//20
                                req.session.x = X; //20

                                newBox = boxPublisher.slice(X , limit + X); 
        
                                pagina = Math.ceil((limit + X) / limit);
                                //console.log("pagina :  ", pagina);
                                //console.log("totalPagina :  ", totalPagina);
                                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
                            } 
                

                        } else if (receive == "last"){

                        //console.log("Esto es long :", long);//30
                        //console.log("Esto es limit :", limit);//10

                        let n = (long % limit);//0

                        if (n !==0 ){
                            X = long - limit; //30- 10 = 20
                            V = long - n;     //30- 3  = 27
                            req.session.x = V; //27
                            //console.log("Esto es n :", n);//3
                            //console.log("Esto es X :", X);//20
                        } else {
                            X = long - limit; //30- 10 = 20
                            V = long - limit; //30- 10 = 20
                            req.session.x = V; //30
                            //console.log("Esto es n :", n);//0
                            //console.log("Esto es X :", X);//20
                        }

                        newBox = boxPublisher.slice(V , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                        //       10   + 23  / 10 = 3.3 pero el Mat.ceil lo lleva a 4 perfecto
                        pagina = Math.ceil((limit + X) / limit);
                        //console.log("pagina :  ", pagina);
                        //console.log("totalPagina :  ", totalPagina);
                        const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };


                        res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });

                        }
                  

                }    

            } else {
                res.render('page/account', {searchBanner, user, storeProfile, searchProfile, Account, countMessages, countNegotiationsBuySell, boxOffert});
            }   
               
        } else {
            res.render('partials/error404');
        };
        

    } else {
        //console.log("Usuarios sin Logearse.")
        searchProfile = [];
        const Account = await modelUser.find({ username : account });
        //console.log("Este es la data del account que queremos visitar ...", Account);

        if (Account.length !== 0){// si la cuenta (user) a la que se quiere acceder existe (tendra una longitud diferente a 0, entonces ehecuta el bloque siguiente)


            const accountId = Account[0]._id; //esto es un array y dentro esta el objeto al que queremos acceder
            const accountIdString = accountId.toString(); //paso de objectId a String
            //console.log("Este es el id del account que queremos visitar ...", accountId);  

            //---consultamos si el user que visita esta tienda ya la sigue.     
            const statusFollow = null
            console.log("statusFollow --->", statusFollow);
            //-----------------------------------------------------------------

            const storeProfile = await modelProfile.findOne({ indexed : accountId });
            //console.log("Aqui el profile de la cuenta", storeProfile);

            let view = storeProfile.view; //aqui guardo la cantidad de visitas actuales que tiene la tienda;
            //console.log('aqui las vistas  view---->', view);
            let signature = (view + 1);     

            //sumaremos la visita del visitante. osea aqui firma que llego a esa tienda.ok genial no?

            const firmaVisitante = await modelProfile.updateOne({ indexed : accountId },{ view : signature });
            //console.log("Aqui la firma del visitante ---->", firmaVisitante)
            

            if (storeProfile) { 
                const searchBanner = storeProfile.bannerPerfil;
        
                //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones.
                if (segment === "All"){
                    //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones. 
                    const resultAirplane = await modelAirplane.find( { $and : [{user_id : accountId}, {visibleStore : true } ]}).sort({ title: 1 });
                    const resultArtes = await modelArtes.find( { $and : [{user_id : accountId}, {visibleStore : true } ]}).sort({ title: 1 });
                    const resultItems = await modelItems.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });
                    const resultAutomotive = await modelAutomotive.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });
                    const resultRealstate = await modelRealstate.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });
                    const resultNautical = await modelNautical.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });
                    const resultService = await modelService.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });
                    const resultAuction = await modelAuction.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });
                    const resultRaffle = await modelRaffle.find({ $and : [{user_id : accountId} , {visibleStore : true } ]}).sort({ title: 1 });

                    if (resultAirplane) {
                        boxPublisher.push(...resultAirplane)
                    } 
                    if (resultArtes) {
                        boxPublisher.push(...resultArtes)
                    }
                    if (resultItems) {
                        boxPublisher.push(...resultItems)
                    }
                    if (resultAutomotive) {
                        boxPublisher.push(...resultAutomotive)
                    }
                    if (resultRealstate) {
                        boxPublisher.push(...resultRealstate)
                    }
                    if (resultNautical) {
                        boxPublisher.push(...resultNautical)
                    }
                    if (resultService) {
                        boxPublisher.push(...resultService)
                    }
                    if (resultAuction) {
                        boxPublisher.push(...resultAuction)
                    }
                    if (resultRaffle) {
                        boxPublisher.push(...resultRaffle)
                    }
        
                    console.log("Este es el boxPublisher del selector de segmentos con valor All ------>");
                    console.log("Este es el boxPublisher un array de esta cantidad de elementos ------>", boxPublisher.length );

                    // paginate
                    let long = boxPublisher.length; //conocer la longitud del array
                    const limit = 20; //establecer la cantidad  de elementos que se mostrarán
                    let pagina = 1; //declaracion de la pagina por default en 1
                    let X, V; //variables importantes para guardar datos necesarios
                    let totalPagina = Math.ceil(long / limit);    

                    console.log("long : ", long);
                    console.log("limit : ", limit);
                    console.log("totalPagina : ", totalPagina);
        

                    if (receive == undefined){

                        req.session.x = 0;
                        X = req.session.x;

                        console.log("Estamos aqui en el inicio");
                        console.log("Esto es el valor de x : ", X );
                        //aqui el nuevo arreglo por default 
                        newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                        const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                        res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });

                    } else if (receive == "first"){

                        X = 0;//0
                        req.session.x = X;
                        
                        newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                        //        6    + 0  / 6 = 1 //aqui no hace falta el Math.ceil ya que siempre se dividira entre el mismo numero, siempre dara "1" 
                        pagina = (limit + X) / limit; //perfecto
                        //console.log("pagina :  ", pagina);
                        //console.log("totalPagina :  ", totalPagina);
                        const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                        res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });

                    } else if (receive == "next"){
                        console.log("Estamos en paginate next ******************")
                        X = req.session.x; //24 al inicio.... en la cuarta vuelta es 24
                        // 20 +  8    < 31  =  true      
                        if (X + limit < long ){
                        // X  16 +  8  = 24
                            X = X + limit;
                            //console.log("XXXXXXXXXXXXXXXXXXXXXX");
                            //console.log("Ver valor de X :", X);
                            req.session.x = X;//24

                            newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                                        //       8   + 16 / 8 = 3
                            pagina = Math.ceil((limit + X) / limit);
                            //console.log("pagina :  ", pagina);
                            //console.log("totalPagina :  ", totalPagina);
                            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
                            console.log("newBox ver estamo sen next---->", newBox)

                            res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
          
                        }
            
                
                    } else if (receive == "prev"){

                        X = req.session.x;
                        //console.log("Estamos en Prev");
                        //console.log("Esto es el valor de x :", X); //30

                        if (X  > 0){
    
                            X = X - limit //20
                            //console.log("XXXXXXXXXXXXXXXXXXXXXX");
                            //console.log("Ver valor de X :", X);//20
                            req.session.x = X; //20

                            newBox = boxPublisher.slice(X , limit + X); 
    
                            pagina = Math.ceil((limit + X) / limit);
                            //console.log("pagina :  ", pagina);
                            //console.log("totalPagina :  ", totalPagina);
                            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                            res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
                        } 
            

                    } else if (receive == "last"){

                    //console.log("Esto es long :", long);//30
                    //console.log("Esto es limit :", limit);//10

                    let n = (long % limit);//0

                    if (n !==0 ){
                        X = long - limit; //30- 10 = 20
                        V = long - n;     //30- 3  = 27
                        req.session.x = V; //27
                        //console.log("Esto es n :", n);//3
                        //console.log("Esto es X :", X);//20
                    } else {
                        X = long - limit; //30- 10 = 20
                        V = long - limit; //30- 10 = 20
                        req.session.x = V; //30
                        //console.log("Esto es n :", n);//0
                        //console.log("Esto es X :", X);//20
                    }

                    newBox = boxPublisher.slice(V , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                    //       10   + 23  / 10 = 3.3 pero el Mat.ceil lo lleva a 4 perfecto
                    pagina = Math.ceil((limit + X) / limit);
                    //console.log("pagina :  ", pagina);
                    //console.log("totalPagina :  ", totalPagina);
                    const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };


                    res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });

                    }
              


                } else {

                        //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones. 
                        const resultAirplane = await modelAirplane.find( { $and : [{user_id : accountId}, {visibleStore : true }, {segment : segment } ]}).sort({ title: 1 });
                        const resultArtes = await modelArtes.find( { $and : [{user_id : accountId}, {visibleStore : true }, {segment : segment }]}).sort({ title: 1 });
                        const resultItems = await modelItems.find({ $and : [{user_id : accountId} , {visibleStore : true }, {segment : segment} ]}).sort({ title: 1 });
                        const resultAutomotive = await modelAutomotive.find({ $and : [{user_id : accountId} , {visibleStore : true }, {segment : segment} ]}).sort({ title: 1 });
                        const resultRealstate = await modelRealstate.find({ $and : [{user_id : accountId} , {visibleStore : true } , {segment : segment} ]}).sort({ title: 1 });
                        const resultNautical = await modelNautical.find({ $and : [{user_id : accountId} , {visibleStore : true } , {segment : segment} ]}).sort({ title: 1 });
                        const resultService = await modelService.find({ $and : [{user_id : accountId} , {visibleStore : true } , {segment : segment} ]}).sort({ title: 1 });
                        const resultAuction = await modelAuction.find({ $and : [{user_id : accountId} , {visibleStore : true } , {segment : segment} ]}).sort({ title: 1 });
                        const resultRaffle = await modelRaffle.find({ $and : [{user_id : accountId} , {visibleStore : true } , {segment : segment} ]}).sort({ title: 1 });

                        if (resultAirplane) {
                            boxPublisher.push(...resultAirplane)
                        } 
                        if (resultArtes) {
                            boxPublisher.push(...resultArtes)
                        }
                        if (resultItems) {
                            boxPublisher.push(...resultItems)
                        }
                        if (resultAutomotive) {
                            boxPublisher.push(...resultAutomotive)
                        }
                        if (resultRealstate) {
                            boxPublisher.push(...resultRealstate)
                        }
                        if (resultNautical) {
                            boxPublisher.push(...resultNautical)
                        }
                        if (resultService) {
                            boxPublisher.push(...resultService)
                        }
                        if (resultAuction) {
                            boxPublisher.push(...resultAuction)
                        }
                        if (resultRaffle) {
                            boxPublisher.push(...resultRaffle)
                        }
            
                        //console.log("Este es el boxPublisher ------>", boxPublisher);

                        // paginate
                        let long = boxPublisher.length; //conocer la longitud del array
                        const limit = 20; //establecer la cantidad  de elementos que se mostrarán
                        let pagina = 1; //declaracion de la pagina por default en 1
                        let X, V; //variables importantes para guardar datos necesarios
                        let totalPagina = Math.ceil(long / limit);    

                        console.log("long : ", long);
                        console.log("limit : ", limit);
                        console.log("totalPagina : ", totalPagina);
            

                        if (receive == undefined){

                            req.session.x = 0;
                            X = req.session.x;

                            console.log("Estamos aqui en el inicio");
                            console.log("Esto es el valor de x : ", X );
                            //aqui el nuevo arreglo por default 
                            newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                            res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });

                        } else if (receive == "first"){

                            X = 0;//0
                            req.session.x = X;
                            
                            newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                            //        6    + 0  / 6 = 1 //aqui no hace falta el Math.ceil ya que siempre se dividira entre el mismo numero, siempre dara "1" 
                            pagina = (limit + X) / limit; //perfecto
                            //console.log("pagina :  ", pagina);
                            //console.log("totalPagina :  ", totalPagina);
                            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                            res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });

                        } else if (receive == "next"){

                            X = req.session.x; //24 al inicio.... en la cuarta vuelta es 24
                            // 20 +  8    < 31  =  true      
                            if (X + limit < long ){
                            // X  16 +  8  = 24
                                X = X + limit;
                                //console.log("XXXXXXXXXXXXXXXXXXXXXX");
                                //console.log("Ver valor de X :", X);
                                req.session.x = X;//24

                                newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                                            //       8   + 16 / 8 = 3
                                pagina = Math.ceil((limit + X) / limit);
                                //console.log("pagina :  ", pagina);
                                //console.log("totalPagina :  ", totalPagina);
                                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
                
                            }
                
                    
                        } else if (receive == "prev"){

                            X = req.session.x;
                            //console.log("Estamos en Prev");
                            //console.log("Esto es el valor de x :", X); //30

                            if (X  > 0){
        
                                X = X - limit //20
                                //console.log("XXXXXXXXXXXXXXXXXXXXXX");
                                //console.log("Ver valor de X :", X);//20
                                req.session.x = X; //20

                                newBox = boxPublisher.slice(X , limit + X); 
        
                                pagina = Math.ceil((limit + X) / limit);
                                //console.log("pagina :  ", pagina);
                                //console.log("totalPagina :  ", totalPagina);
                                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
                            } 
                

                        } else if (receive == "last"){

                        //console.log("Esto es long :", long);//30
                        //console.log("Esto es limit :", limit);//10

                        let n = (long % limit);//0

                        if (n !==0 ){
                            X = long - limit; //30- 10 = 20
                            V = long - n;     //30- 3  = 27
                            req.session.x = V; //27
                            //console.log("Esto es n :", n);//3
                            //console.log("Esto es X :", X);//20
                        } else {
                            X = long - limit; //30- 10 = 20
                            V = long - limit; //30- 10 = 20
                            req.session.x = V; //30
                            //console.log("Esto es n :", n);//0
                            //console.log("Esto es X :", X);//20
                        }

                        newBox = boxPublisher.slice(V , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                        //       10   + 23  / 10 = 3.3 pero el Mat.ceil lo lleva a 4 perfecto
                        pagina = Math.ceil((limit + X) / limit);
                        //console.log("pagina :  ", pagina);
                        //console.log("totalPagina :  ", totalPagina);
                        const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };


                        res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });

                        }
                

                }  

            } 

        } else {
            res.render('partials/error404');
        };
    }

})

            
routes.get('/account/search/:store/:segment/:element', async (req, res)=>{

    try {
        console.log("Estamos en la seccion de busqueda filtro");
        console.log("Esto es un protocolo get no existe solicitud de cuerpo no hay req.body ---->", req.body);
        const user = req.session.user;
        const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell
        console.log("req.params ----->", req.params);
        let { store, segment, element } = req.params; 
        
        console.log(`store -> ${store} | segment -> ${segment} | element -> ${element} `);
        const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        const url = `${store}`;
        let searchProfile;
        let searchBanner;
        let userId;
        const boxPublisher = [];
        let boxOffert = [];
        const account = store;
        const Account = await modelUser.find({ username : account });
        console.log("*****************************************************************");
        console.log("*************************** segment **************************************")
        console.log("Esto es segment ----->", segment);
        console.log("Esto es segment typeof----->", typeof segment);
        
    
        //console.log("nada de busqueda esta en blanco, entonces redirecciona a la busqueda original");
        //res.redirect(url); con esto podemos recargar la pagina antes usado  
    
        
        if (user){
            userId = user._id; //usaremos con el indexed en la coleccion profile.
            searchProfile = await modelProfile.find({ indexed : userId });
            //console.log("Aqui el profile de la cuenta", searchProfile);
        } else {
            searchProfile = [];
        }    
        
        const accountId = Account[0]._id; //esto es un array y dentro esta el objeto al que queremos acceder
        const storeID = accountId;
        const accountIdString = accountId.toString(); //paso de objectId a String
        //console.log("Este es el id del account que queremos visitar ...", accountId);
        
        //Consultamos todas las ofertas -----------------------------------------------

            async function searchOffert(){
                //ahora es momento de consultar en todas las colecciones de articulos en busca de ofertas.
                const respItems = await modelItems.find({ user_id: storeID, offer: true });
                if (respItems.length > 0) {
                    boxOffert.push(...respItems); // Usar el spread operator para añadir los elementos al array
                }
                    
                const respAerop = await modelAirplane.find({user_id : storeID, offer : true });
                if (respAerop.length > 0){
                    boxOffert.push(...respAerop);
                }

                const respAutom = await modelAutomotive.find({user_id : storeID, offer : true });
                if (respAutom.length > 0){
                    boxOffert.push(...respAutom);
                }

                const respArtes = await modelArtes.find({user_id : storeID, offer : true });
                if (respArtes.length > 0){
                    boxOffert.push(...respArtes);
                }

                const respReals = await modelRealstate.find({user_id : storeID, offer : true });
                if (respReals.length > 0){
                    boxOffert.push(...respReals);
                }

                const respServi = await modelService.find({user_id : storeID, offer : true });
                if (respServi.length > 0){
                    boxOffert.push(...respServi);
                }

                const respNauti = await modelNautical.find({user_id : storeID, offer : true });
                if (respNauti.length > 0){
                    boxOffert.push(...respNauti);
                }

                const respAucti = await modelAuction.find({user_id : storeID, offer : true });
                if (respAucti.length > 0){
                    boxOffert.push(...respAucti);
                }

            }
        

            searchOffert()
                .then(()=>{
                    //console.log("Aqui lo recaudado de las ofertas");
                    //console.log("boxOffert --->",boxOffert);
                    //luego sigue todo normal                    
                })
                .catch((err)=>{
                    console.log("Ha ocurrido un error en la function searchOffert()");
                })


        //-----------------------------------------------------------------------------
        //---consultamos si el user que visita esta tienda ya la sigue.     
        const statusFollow = await modelProfile.findOne({ indexed : userId, favoritestores : accountIdString });
        console.log("statusFollow --->", statusFollow);
        //---------------------------------------------------------

        const storeProfile = await modelProfile.findOne({ indexed : accountId });
        //console.log("Aqui el profile de la **Tienda** a visistar --->", storeProfile);
        const Segment = storeProfile.segment; //["All"] All siempre va a existir
        //cuando exista un null o un All siempre termina en "All" 
        //All como segmento jamas podrá sera eliminada ni editado.
        
        if (segment === "null"){
            segment = Segment[0];
        }
        if (element === "null"){
            element = "";
        }

        if (storeProfile) { 
            searchBanner = storeProfile.bannerPerfil;
        }

        if (segment === "All"){
            console.log(`segment ---> ${segment} | element ---> ${element}`);
            console.log("Busacmos es todo sin condicion de segmento en las colecciones");
            const resultAirplane = await modelAirplane.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : element, $options : "i" }}] } );
            const resultArtes = await modelArtes.find( { $and : [{username : store }, {visibleStore : true },  { title : { $regex : element, $options : "i" }}] } );
            const resultItems = await modelItems.find( { $and : [{username : store }, {visibleStore : true },  { title : { $regex : element, $options : "i" }}] } );
            const resultAutomotive = await modelAutomotive.find( { $and : [{username : store }, {visibleStore : true },  { title : { $regex : element, $options : "i" }}] } );
            const resultRealstate = await modelRealstate.find( { $and : [{username : store }, {visibleStore : true },  { title : { $regex : element, $options : "i" }}] } );
            const resultNautical = await modelNautical.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : element, $options : "i" }}] } );
            const resultService = await modelService.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : element, $options : "i" }}] } );
            const resultAuction = await modelAuction.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : element, $options : "i" }}] } );
            const resultRaffle = await modelRaffle.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : element, $options : "i" }}] } );
    
            if (resultAirplane) {
                boxPublisher.push(...resultAirplane)
            } 
            if (resultArtes) {
                boxPublisher.push(...resultArtes)
            }
            if (resultItems) {
                boxPublisher.push(...resultItems)
            }
            if (resultAutomotive) {
                boxPublisher.push(...resultAutomotive)
            }
            if (resultRealstate) {
                boxPublisher.push(...resultRealstate)
            }
            if (resultNautical) {
                boxPublisher.push(...resultNautical)
            }
            if (resultService) {
                boxPublisher.push(...resultService)
            }
            if (resultAuction) {
                boxPublisher.push(...resultAuction)
            }
            if (resultRaffle) {
                boxPublisher.push(...resultRaffle)
            }

            console.log("Este es el boxPublisher ------>", boxPublisher);
            // paginate
            let long = boxPublisher.length; //conocer la longitud del array
            const limit = 20; //establecer la cantidad  de elementos que se mostrarán
            let pagina = 1; //declaracion de la pagina por default en 1
            let X;
            let totalPagina = Math.ceil(long / limit);    
    
            //console.log("long : ", long);
            //console.log("limit : ", limit);
            //console.log("totalPagina : ", totalPagina);
    
    
            if (receive == undefined){
    
                req.session.x = 0;
                X = req.session.x;
    
                //console.log("Estamos aqui en el inicio");
                //console.log("Esto es el valor de x : ", X );
                //aqui el nuevo arreglo por default 
                newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
    
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
    
            } else if (receive == "first"){
    
                X = 0;//0
                req.session.x = X;
                    
                newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
        
                pagina = (limit + X) / limit;
                //console.log("pagina :  ", pagina);
                //console.log("totalPagina :  ", totalPagina);
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
    
            } else if (receive == "next"){
    
                X = req.session.x;
    
                if (X + limit < long ){
    
                    X = X + limit;//6
                    req.session.x = X;
    
                    newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
        
                    pagina = (limit + X) / limit;
                    //console.log("pagina :  ", pagina);
                    //console.log("totalPagina :  ", totalPagina);
                    const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
                    res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
        
                }
        
        
            } else if (receive == "prev"){
    
                X = req.session.x;
                //console.log("Estamos en Prev");
                //console.log("Esto es el valor de x :", X); //6
    
                if (X  > 0){
    
                    X = X - limit
                    req.session.x = X;
    
                    newBox = boxPublisher.slice(X , limit + X); 
    
                    pagina = (limit + X) / limit;
                    //console.log("pagina :  ", pagina);
                    //console.log("totalPagina :  ", totalPagina);
                    const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
                    res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
                } 
        
    
            } else if (receive == "last"){
    
                let n = (long % limit);
                X = long - n;
                req.session.x = X;
                        
                newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
        
                pagina = (limit + X) / limit;
                //console.log("pagina :  ", pagina);
                //console.log("totalPagina :  ", totalPagina);
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
    
            }
    
            
        } else {
            console.log(`segment ---> ${segment} | element ---> ${element}`);
            console.log("Buscamos en todas las colecciones con la condicion de segmento");
            const resultAirplane = await modelAirplane.find( { $and : [{username : store }, {visibleStore : true }, {segment : segment }, { title : { $regex : element, $options : "i" }}] } );
            const resultArtes = await modelArtes.find( { $and : [{username : store }, {visibleStore : true }, {segment : segment }, { title : { $regex : element, $options : "i" }}] } );
            const resultItems = await modelItems.find( { $and : [{username : store }, {visibleStore : true }, {segment : segment }, { title : { $regex : element, $options : "i" }}] } );
            const resultAutomotive = await modelAutomotive.find( { $and : [{username : store }, {visibleStore : true }, {segment : segment },  { title : { $regex : element, $options : "i" }}] } );
            const resultRealstate = await modelRealstate.find( { $and : [{username : store }, {visibleStore : true }, {segment : segment }, { title : { $regex : element, $options : "i" }}] } );
            const resultNautical = await modelNautical.find( { $and : [{username : store }, {visibleStore : true }, {segment : segment }, { title : { $regex : element, $options : "i" }}] } );
            const resultService = await modelService.find( { $and : [{username : store }, {visibleStore : true }, {segment : segment }, { title : { $regex : element, $options : "i" }}] } );
            const resultAuction = await modelAuction.find( { $and : [{username : store }, {visibleStore : true }, {segment : segment }, { title : { $regex : element, $options : "i" }}] } );
            const resultRaffle = await modelRaffle.find( { $and : [{username : store }, {visibleStore : true }, {segment : segment }, { title : { $regex : element, $options : "i" }}] } );
    
            if (resultAirplane) {
                boxPublisher.push(...resultAirplane)
            } 
            if (resultArtes) {
                boxPublisher.push(...resultArtes)
            }
            if (resultItems) {
                boxPublisher.push(...resultItems)
            }
            if (resultAutomotive) {
                boxPublisher.push(...resultAutomotive)
            }
            if (resultRealstate) {
                boxPublisher.push(...resultRealstate)
            }
            if (resultNautical) {
                boxPublisher.push(...resultNautical)
            }
            if (resultService) {
                boxPublisher.push(...resultService)
            }
            if (resultAuction) {
                boxPublisher.push(...resultAuction)
            }
            if (resultRaffle) {
                boxPublisher.push(...resultRaffle)
            }

            console.log("Este es el boxPublisher ------>", boxPublisher);
            // paginate
            let long = boxPublisher.length; //conocer la longitud del array
            const limit = 20; //establecer la cantidad  de elementos que se mostrarán
            let pagina = 1; //declaracion de la pagina por default en 1
            let X;
            let totalPagina = Math.ceil(long / limit);    
    
            //console.log("long : ", long);
            //console.log("limit : ", limit);
            //console.log("totalPagina : ", totalPagina);
    
    
            if (receive == undefined){
    
                req.session.x = 0;
                X = req.session.x;
    
                //console.log("Estamos aqui en el inicio");
                //console.log("Esto es el valor de x : ", X );
                //aqui el nuevo arreglo por default 
                newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
    
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
    
            } else if (receive == "first"){
    
                X = 0;//0
                req.session.x = X;
                    
                newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
        
                pagina = (limit + X) / limit;
                //console.log("pagina :  ", pagina);
                //console.log("totalPagina :  ", totalPagina);
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
    
            } else if (receive == "next"){
    
                X = req.session.x;
    
                if (X + limit < long ){
    
                    X = X + limit;//6
                    req.session.x = X;
    
                    newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
        
                    pagina = (limit + X) / limit;
                    //console.log("pagina :  ", pagina);
                    //console.log("totalPagina :  ", totalPagina);
                    const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
                    res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
        
                }
        
        
            } else if (receive == "prev"){
    
                X = req.session.x;
                //console.log("Estamos en Prev");
                //console.log("Esto es el valor de x :", X); //6
    
                if (X  > 0){
    
                    X = X - limit
                    req.session.x = X;
    
                    newBox = boxPublisher.slice(X , limit + X); 
    
                    pagina = (limit + X) / limit;
                    //console.log("pagina :  ", pagina);
                    //console.log("totalPagina :  ", totalPagina);
                    const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
                    res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
                } 
        
    
            } else if (receive == "last"){
    
                let n = (long % limit);
                X = long - n;
                req.session.x = X;
                        
                newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
        
                pagina = (limit + X) / limit;
                //console.log("pagina :  ", pagina);
                //console.log("totalPagina :  ", totalPagina);
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, segment, statusFollow, boxOffert });
    
            }
    
        }

    } catch (error) {
        console.log("ha habido un error, en la busqueda");
    }

});


//esta ruta es accedida por tres peticiones, desde el stores, desde una tienda sobre el banner y en el view-general-product.
routes.post('/account/myfavorite-stores', async (req,res)=>{

    try {
        
        //console.log("Esto es lo que esta llegando de un favoritoStore al backend ---->", req.body)
        const { user, userOfStore } = req.body;
        console.log(` user:  ${user}    userOfStore:  ${userOfStore} `);
        //user:  66ac0281a3afb22ac770d5f2    userOfStore:  66fd4cede0160a6c5f8d5954
        let searchProfile;
        
        let date = new Date();
        let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
        let hora = date.getHours(); let minu = date.getMinutes();

        //### Consideraciones adicionales:
        //Si deseas que los minutos siempre se muestren con dos dígitos (por ejemplo, `03` en lugar de `3`), puedes agregar un formato adicional. Por ejemplo:
        //String(minu)`**: Esta parte convierte el valor de la variable `minu` a un tipo de dato `String`. Esto es importante porque queremos asegurarnos de que el valor que estamos manejando sea una cadena de texto.
        //padStart(2, '0')`**: Esta es una función que se aplica a la cadena que obtenemos del paso anterior. La función `padStart` se utiliza para rellenar la cadena con un carácter específico hasta alcanzar una longitud deseada. 
        //El primer argumento (`2`) indica que queremos que la longitud total de la cadena sea de al menos 2 caracteres.
        //El segundo argumento (`'0'`) especifica que queremos rellenar con ceros (`'0'`) si la longitud original de la cadena es menor que 2.

        let mesFormatted = String(mes).padStart(2, '0');
        let minuFormatted = String(minu).padStart(2, '0');
        const timeNow = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;
        
        console.log("Esto es timeNow>>>", timeNow);

        searchProfile = await modelProfile.findOne({ indexed : user });
        console.log("Esto es searchProfile : ", searchProfile)

        
        if (searchProfile){

            //const elqueSigue = await modelProfile.findOne({ indexed : user });
            // ya tenemos este objeto "searchProfile" asi que no hace falta volverlo a buscar 
            const alqueSigue = await modelProfile.findOne({ indexed : userOfStore }, {username : 1, indexed : 1} );
            console.log("-------------------------------------")
            console.log("elqueSigue >>", searchProfile);
            console.log("alqueSigue >>", alqueSigue);
            console.log("-------------------------------------")
            const usernameElqueSigue = searchProfile.username; 
            const avatar = searchProfile.avatarPerfil[0].url; const avatarDefault = searchProfile.mailhash;
            const usernameAlqueSigue = alqueSigue.username; //const idAlqueSiguen = alqueSigue._id; borrar
            //userOfStore = al indexed 
            console.log("Esto es avatar>>", avatar);
            console.log("Esto es avatarDefault>>", avatarDefault);
            
            const favoriteStores = searchProfile.favoritestores;
            //console.log("Aqui veo el user --->",searchProfile)
            //console.log("Aqui veo las tiendas favoritas del user --->", favoriteStores); //esto es un array que contiene todas las cuentas a las que yo estoy siguiendo
            
            async function Follow(){
                console.log("No existe esta tienda en el array favoriteStore de este usuario")
                console.log("----------------------------see-------------------------")
                const resultUpdate = await modelProfile.updateOne({ indexed : user }, {$push:{ favoritestores : userOfStore }});
                //ahora vamos a agregar al user al array folowMe
                const followMe = await modelProfile.updateOne({ indexed : userOfStore }, { $push: { followMe : user } } );

            }
            //ahora que amvas partes tienen la informacion de siguiendo y seguido procedemos a crear la notificacion
            //de siguiendome para que el usuario sepa cuando lo siguen y quien lo sigue.
            async function Notification(){
                //enviar mensaje al usuario que lo estan siguiendo.
                const newNotification = new modelMessage( { typeNote: 'followMe',
                                                            times: timeNow,
                                                            objeAvatar : {avatar, avatarDefault},
                                                            username: usernameElqueSigue,
                                                            question: `¡Hola! ${usernameElqueSigue} te está siguiendo. Visítala y descubre si te interesa seguirla también.`,
                                                            toCreatedArticleId : userOfStore,
                                                            ownerStore  : usernameAlqueSigue,
                                                            answer: 'waiting',
                                                            view: false } );
                console.log("newNotification ------>", newNotification);
                const saveMessage = await newNotification.save();
                console.log("se ha creado la notificacion del seguidor");
            }


            
            //const search = await modelProfile.findOne({ favoritestores : userOfStore }); maloooo
            const search = await modelProfile.findOne({
                indexed: user,
                'favoritestores': userOfStore 
            });
            console.log ("userOfStore ---->", userOfStore);
            console.log ("search ---->", search);
            if (search !== null) {

                    console.log("Resultado encontrado:");
                    res.json({ "type" : "Following", "message" : "Sigo esta Tienda"});

            } else {
                    console.log("No se encontró ningún documento con ese valor en favoriteStores.");
                    Follow()
                        .then(()=>{
                            Notification()
                                .then(()=>{
                                    res.json({ "type" : "Save", "message" : "Tienda guardada y siguiendo"});
                                })
                                .catch((error)=>{
                                    res.json({ "type" : "Error", "message" : "Ha habido un error em Notificaction(), intente luego"});        
                                })
                            
                        })
                        .catch((error)=>{
                            res.json({ "type" : "Error", "message" : "Ha habido un error en Follow(), intente luego"});
                        })
                    
            }
            

        }

    } catch (error) {
    console.log("Ha habido un error, intente luego", error); 
    }  

    
// hay tres valores en Type = "Save", "Following", "Error"


});

//esta es la nueva forma de seguir a una tienda. Forma Toggle "Seguir/Siguiendo" -->esto esta en la tienda debajo del banner un boton seguir/siguiendo
routes.post('/account/followStore', async(req, res)=>{
    try {
      
        console.log("Esto es lo que esta llegando de un favoritoStore al backend ---->", req.body)
        const { user, userOfStore } = req.body;
        console.log(` user:  ${user}    userOfStore:  ${userOfStore} `);
        //user:  66ac0281a3afb22ac770d5f2    userOfStore:  66fd4cede0160a6c5f8d5954
        let searchProfile;
        
        let date = new Date();
        let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
        let hora = date.getHours(); let minu = date.getMinutes();
    
        //### Consideraciones adicionales:
        //Si deseas que los minutos siempre se muestren con dos dígitos (por ejemplo, `03` en lugar de `3`), puedes agregar un formato adicional. Por ejemplo:
        //String(minu)`**: Esta parte convierte el valor de la variable `minu` a un tipo de dato `String`. Esto es importante porque queremos asegurarnos de que el valor que estamos manejando sea una cadena de texto.
        //padStart(2, '0')`**: Esta es una función que se aplica a la cadena que obtenemos del paso anterior. La función `padStart` se utiliza para rellenar la cadena con un carácter específico hasta alcanzar una longitud deseada. 
        //El primer argumento (`2`) indica que queremos que la longitud total de la cadena sea de al menos 2 caracteres.
        //El segundo argumento (`'0'`) especifica que queremos rellenar con ceros (`'0'`) si la longitud original de la cadena es menor que 2.
    
        let mesFormatted = String(mes).padStart(2, '0');
        let minuFormatted = String(minu).padStart(2, '0');
        const timeNow = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;
        
        console.log("Esto es timeNow>>>", timeNow);
    
        searchProfile = await modelProfile.findOne({ indexed : user });
        console.log("Esto es searchProfile : ", searchProfile)
    
         
        if (searchProfile){

    
            //const elqueSigue = await modelProfile.findOne({ indexed : user });
            // ya tenemos este objeto "searchProfile" asi que no hace falta volverlo a buscar 
            const tiendaAseguir = await modelProfile.findOne({ indexed : userOfStore }, {username : 1, indexed : 1} );
            console.log("-------------------------------------")
            //console.log("elqueSigue >>", searchProfile);
            console.log("tiendaAseguir >>", tiendaAseguir); //esta es la tienda que vamos a seguir

            const sigoEstaTienda = await modelProfile.findOne({ indexed : user, favoritestores : userOfStore  }, { username: 1, favoritestores: 1 });
            console.log("sigoEstaTienda -------->", sigoEstaTienda); // null o envia un objeto
            
            if (sigoEstaTienda){
                console.log("Sigo esta tienda, es hora de dejar de seguirla", sigoEstaTienda.favoritestores );
                const usernameElqueSigue = searchProfile.username;

                async function stopFollowing(){
                    const stopFollow =  await modelProfile.updateOne({ indexed : user }, {$pull:{ favoritestores : userOfStore }});
                    //retiro la tienda que estaba siguiendo de mi lista de favoritos.
                    const stopFollowMe = await modelProfile.updateOne({ indexed : userOfStore }, { $pull: { followMe : user } });
                    //retiro de la lista de siguiendome al usuario que lo estaba siguiendo.
                }

                async function deleteNotification(){ //aqui buscamos si esta notificacion existe para eliminarla.
                    const deleteNoti = await modelMessage.deleteMany({ typeNote : "followMe", username : usernameElqueSigue, answer: 'waiting' });
                }

                stopFollowing()
                    .then(()=>{
                        deleteNotification()
                            .then(()=>{
                                res.json({ "type" : "stopFollowing", "note" : "Hemos dejado de seguir esta tienda" });
                            })
                            .catch((err)=>{
                                res.json({ "type" : "Error", "message" : "Ha habido un error en deleteNotification(), intente luego"});        
                            })
                        
                    })
                    .catch((err)=>{
                        res.json({ "type" : "Error", "message" : "Ha habido un error en stopFollowing(), intente luego"});
                    })

                

            } else {
                console.log("No sigo esta tienda, es hora de seguirla", sigoEstaTienda);

                const usernameElqueSigue = searchProfile.username; 
                const avatar = searchProfile.avatarPerfil[0].url; const avatarDefault = searchProfile.mailhash;
                const banner = searchProfile.bannerPerfil[0].url;
                const usernameTiendaAseguir = tiendaAseguir.username; 
                //userOfStore = al indexed 
                console.log("Esto es avatar>>", avatar);
                console.log("Esto es avatarDefault>>", avatarDefault);

                //descubrimos el chatId del user de la Tienda si posee
                const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(userOfStore));
                const chatId = searchUserStore.blissBot.chatId; //si la tienda posee chatId esta sincronizada.

    
               
                async function Follow(){
                    console.log("No existe esta tienda en el array favoriteStore de este usuario");
                    console.log("----------------------------see-------------------------")
                    const resultUpdate = await modelProfile.updateOne({ indexed : user }, {$push:{ favoritestores : userOfStore }});
                    //ahora vamos a agregar al user al array folowMe pero antes vamos a revisar si ya lo tiene.

                    const existUser = await modelProfile.findOne({ indexed : userOfStore, followMe : user }); //consultamos si tiene este dato.

                    if (!existUser) {
                        const followMe = await modelProfile.updateOne({ indexed : userOfStore }, { $push: { followMe : user } } );
                    } 
                    //esto es muy importante porque sino cada vez que un usuario sigue a una tienda y la deje de seguir y luego vuelva a 
                    // seguirla se marcara en el apartado de siguiendome y esto temrina con muchos clones o repeticiones de personas que te siguen que es el mismo.
                        
                }
                //ahora que amvas partes tienen la informacion de siguiendo y seguido procedemos a crear la notificacion
                //de siguiendome para que el usuario sepa cuando lo siguen y quien lo sigue.
                async function Notification(){
                    //enviar mensaje al usuario que lo estan siguiendo.
                    const newNotification = new modelMessage( { typeNote: 'followMe',
                                                                times: timeNow,
                                                                objeAvatar : {avatar, avatarDefault},
                                                                username: usernameElqueSigue,
                                                                question: `¡Hola! ${usernameElqueSigue} te está siguiendo. Visítala y descubre si te interesa seguirla también.`,
                                                                toCreatedArticleId : userOfStore,
                                                                ownerStore  : usernameTiendaAseguir,
                                                                answer: 'waiting',
                                                                view: false } );
                    console.log("newNotification ------>", newNotification);
                    const saveMessage = await newNotification.save();
                    console.log("se ha creado la notificacion del seguidor");
                }

                async function blissBotNoti(){
                    console.log("banner dentro de blissBotNoti() >>", banner); 
                    const Message = `Notificación de Blissenet.com: Follow me\n\n¡Hola! ${usernameElqueSigue} te está siguiendo. Visítala y descubre si te interesa seguirla también.`;

                    const response = await axios.post(`https://api.telegram.org/bot${Token}/sendPhoto`, {
                        chat_id: chatId,
                        photo: banner, //¡Este artículo ya esta disponible! "Monopatin MK086 (Pro2)"'
                        caption: Message
                    })
                    .then(response => {
                        console.log('Mensaje enviado con éxito:', response.data);
                    })
                    .catch(error => {
                        console.error('Error al enviar el mensaje:', error);
                    });

                }
        
                if (chatId === ""){

            
                    Follow()
                        .then(()=>{
                            Notification()
                                .then(()=>{
                                    res.json({ "type" : "Following", "note" : "Tienda guardada y siguiendo" });
                                })
                                .catch((error)=>{
                                    res.json({ "type" : "Error", "note" : "Ha habido un error em Notificaction(), intente luego"});        
                                })
                            
                        })
                        .catch((error)=>{
                            res.json({ "type" : "Error", "message" : "Ha habido un error en Follow(), intente luego"});
                        })

                } else {

                    Follow()
                        .then(()=>{
                            Notification()
                                .then(()=>{
                                    blissBotNoti()
                                        .then(()=>{
                                            res.json({ "type" : "Following", "note" : "Tienda guardada y siguiendo" });
                                        })
                                        .catch((error)=>{
                                            res.json({ "type" : "Error", "message" : "Ha habido un error en  blissBotNotification(), intente luego"});
                                        })
                                    
                                })
                                .catch((error)=>{
                                    res.json({ "type" : "Error", "note" : "Ha habido un error em Notificaction(), intente luego"});        
                                })
                            
                        })
                        .catch((error)=>{
                            res.json({ "type" : "Error", "message" : "Ha habido un error en Follow(), intente luego"});
                        })

                }    

            }
                        
    
        }
    
    } catch (error) {
       console.log("Ha habido un error, intente luego", error); 
    }  
    
        
    // hay tres valores en Type = "Save", "Following", "Error"
    
});

routes.post('/account/offer', async (req, res)=>{
    const boxInfo = []
    console.log("hemos llegado a setting/offer")
    console.log(req.body)
    const { depart, id } = req.body;

    const date = new Date();
    let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
    let hora = date.getHours(); let minu = date.getMinutes();

    let mesFormatted = String(mes).padStart(2, '0');
    let minuFormatted = String(minu).padStart(2, '0');
    const times = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

    if (depart === 'items'){
        const resultOffer = await modelItems.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const result = await modelItems.findByIdAndUpdate( id, { offer : true, soldOut : false },{ new : true });
    
            //console.log('esto es resul', result );
            
            //es hora de evaluar si el campo purchaseTime del documento items tiene elementos, estos elementos osn indexed de personas que quieren ser avisados para recibir notificacion en su inbox cuando este producto este disponible.
            const PurchaseTime = result.purchaseTime; //aqui tenemos el array de usuarios indexed para buscar en el profile
            const titleArticle = result.title; const urlImageArticle = result.images[0].url;
            const question = '¡Este artículo ya esta disponible!'; const toCreatedArticleId = result.user_id;
            const ownerStore = result.username; const productId = result._id;
            const depart = 'items'; const answer = 'waiting'; const view = 'false';


            if (PurchaseTime.length !==0){
                
                for (const ele of PurchaseTime) {
                    
                    console.log("usuarios que debemos enviar notificación de que ya esta disponible ->", ele);
                    
                    const newMessage = new modelMessage({times, typeNote: 'availability-noti', titleArticle, urlImageArticle, userId : ele, question, depart, productId, toCreatedArticleId, ownerStore });
                    console.log("newMessage :", newMessage);
                    const saveMessage = await newMessage.save();

                }
            }

            const resultSearch = await modelItems.findByIdAndUpdate( id, { $set: { purchaseTime: [] } },{ new: true });
            boxInfo.push(resultSearch);

        }else {
            const resultSearch = await modelItems.findByIdAndUpdate( id, { offer : false }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }
        
    } else if ( depart === "arts"){
        const resultOffer = await modelArtes.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const result = await modelArtes.findByIdAndUpdate( id, { offer : true, soldOut : false });
 
            //console.log('esto es result', result );
            //console.log('esto es boxInfo------->', boxInfo);
            //es hora de evaluar si el campo purchaseTime del documento arts tiene elementos, estos elementos son indexed de personas que quieren ser avisados para recibir notificacion en su inbox cuando este producto este disponible.

            const PurchaseTime = result.purchaseTime; //aqui tenemos el array de usuarios indexed para buscar en el profile
            const titleArticle = result.title; const urlImageArticle = result.images[0].url;
            const question = '¡Este artículo ya esta disponible!'; const toCreatedArticleId = result.user_id;
            const ownerStore = result.username; const productId = result._id;
            const depart = 'arts'; const answer = 'waiting'; const view = 'false';


            if (PurchaseTime.length !==0){
                
                for (const ele of PurchaseTime) {
                    
                    console.log("usuarios que debemos enviar notificación de que ya esta disponible ->", ele);
                    
                    const newMessage = new modelMessage({times, typeNote: 'availability-noti', titleArticle, urlImageArticle, userId : ele, question, depart, productId, toCreatedArticleId, ownerStore });
                    console.log("newMessage :", newMessage);
                    const saveMessage = await newMessage.save();

                }
            }

            const resultSearch = await modelArtes.findByIdAndUpdate( id, { $set: { purchaseTime: [] } },{ new: true });
            boxInfo.push(resultSearch);


        }else {
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { offer : false }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }

    } else if ( depart === "automotive"){
        const resultOffer = await modelAutomotive.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelAutomotive.findByIdAndUpdate( id, { offer : true }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelAutomotive.findByIdAndUpdate( id, { offer : false }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }

    }   else if ( depart === "airplanes"){
        const resultOffer = await modelAirplane.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelAirplane.findByIdAndUpdate( id, { offer : true }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelAirplane.findByIdAndUpdate( id, { offer : false }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "nautical"){
        const resultOffer = await modelNautical.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelNautical.findByIdAndUpdate( id, { offer : true }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelNautical.findByIdAndUpdate( id, { offer : false }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "realstate"){
        const resultOffer = await modelRealstate.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelRealstate.findByIdAndUpdate( id, { offer : true }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelRealstate.findByIdAndUpdate( id, { offer : false }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "service"){
        const resultOffer = await modelService.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelService.findByIdAndUpdate( id, { offer : true }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelService.findByIdAndUpdate( id, { offer : false }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }   else if ( depart === "auctions"){
        const resultOffer = await modelAuction.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelAuction.findByIdAndUpdate( id, { offer : true }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelAuction.findByIdAndUpdate( id, { offer : false }, {new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }

    
    res.json(boxInfo);
});

routes.post('/account/best-product', async (req, res)=>{
    const boxInfo = []
    //console.log("hemos llegado a account/best-product")
    //console.log(req.body)
    const { depart, id } = req.body;

    if (depart === 'items'){
        const resultBestProduct = await modelItems.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelItems.findByIdAndUpdate( id, { bestProduct : true },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo); 
        }else {
            const resultSearch = await modelItems.findByIdAndUpdate( id, { bestProduct : false },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }
        
    } else if ( depart === "arts"){
        const resultBestProduct = await modelArtes.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { bestProduct : true },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { bestProduct : false },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }

    } else if ( depart === "automotive"){
        const resultBestProduct = await modelAutomotive.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelAutomotive.findByIdAndUpdate( id, { bestProduct : true },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelAutomotive.findByIdAndUpdate( id, { bestProduct : false },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }

    }   else if ( depart === "airplanes"){
        const resultBestProduct = await modelAirplane.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelAirplane.findByIdAndUpdate( id, { bestProduct : true },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelAirplane.findByIdAndUpdate( id, { bestProduct : false },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "nautical"){
        const resultBestProduct = await modelNautical.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelNautical.findByIdAndUpdate( id, { bestProduct : true },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelNautical.findByIdAndUpdate( id, { bestProduct : false },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "realstate"){
        const resultBestProduct = await modelRealstate.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelRealstate.findByIdAndUpdate( id, { bestProduct : true },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelRealstate.findByIdAndUpdate( id, { bestProduct : false },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "service"){
        const resultBestProduct = await modelService.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelService.findByIdAndUpdate( id, { bestProduct : true },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelService.findByIdAndUpdate( id, { bestProduct : false },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "auctions"){
        const resultBestProduct = await modelAuction.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelAuction.findByIdAndUpdate( id, { bestProduct : true },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelAuction.findByIdAndUpdate( id, { bestProduct : false },{new : true});
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }

    
    res.json(boxInfo);
});

routes.post('/account/only-one-available', async (req, res)=>{
    const boxInfo = []
    //console.log("hemos llegado a account/only-one-available")
    //console.log(req.body)
    const { depart, id } = req.body;

    const date = new Date();
    let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
    let hora = date.getHours(); let minu = date.getMinutes();

    let mesFormatted = String(mes).padStart(2, '0');
    let minuFormatted = String(minu).padStart(2, '0');
    const times = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;    


    if (depart === 'items'){
        const resultOnlyOneAvailable = await modelItems.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const result = await modelItems.findByIdAndUpdate( id, { onlyOneAvailable : true, soldOut : false }, { new: true });
            
            //console.log('esto es result', result );
            //console.log('esto es boxInfo------->', boxInfo); 
            //es hora de evaluar si el campo purchaseTime del documento arts tiene elementos, estos elementos son indexed de personas que quieren ser avisados para recibir notificacion en su inbox cuando este producto este disponible.

            const PurchaseTime = result.purchaseTime; //aqui tenemos el array de usuarios indexed para buscar en el profile
            const titleArticle = result.title; const urlImageArticle = result.images[0].url;
            const question = '¡Este artículo ya esta disponible!'; const toCreatedArticleId = result.user_id;
            const ownerStore = result.username; const productId = result._id;
            const depart = 'items'; const answer = 'waiting'; const view = 'false';


            if (PurchaseTime.length !==0){
                
                for (const ele of PurchaseTime) {
                    
                    console.log("usuarios que debemos enviar notificación de que ya esta disponible ->", ele);
                    
                    const newMessage = new modelMessage({times, typeNote: 'availability-noti', titleArticle, urlImageArticle, userId : ele, question, depart, productId, toCreatedArticleId, ownerStore });
                    console.log("newMessage :", newMessage);
                    const saveMessage = await newMessage.save();

                }
            }

            const resultSearch = await modelItems.findByIdAndUpdate( id, { $set: { purchaseTime: [] } },{ new: true });
            boxInfo.push(resultSearch);


        }else {
            const resultSearch = await modelItems.findByIdAndUpdate( id, { onlyOneAvailable : false }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }
        
    } else if ( depart === "arts"){
        const resultOnlyOneAvailable = await modelArtes.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const result = await modelArtes.findByIdAndUpdate( id, { onlyOneAvailable : true },{ new: true });
    
            //console.log('esto es result', result );
            //console.log('esto es boxInfo------->', boxInfo);
            //es hora de evaluar si el campo purchaseTime del documento arts tiene elementos, estos elementos son indexed de personas que quieren ser avisados para recibir notificacion en su inbox cuando este producto este disponible.

            const PurchaseTime = result.purchaseTime; //aqui tenemos el array de usuarios indexed para buscar en el profile
            const titleArticle = result.title; const urlImageArticle = result.images[0].url;
            const question = '¡Este artículo ya esta disponible!'; const toCreatedArticleId = result.user_id;
            const ownerStore = result.username; const productId = result._id;
            const depart = 'arts'; const answer = 'waiting'; const view = 'false';


            if (PurchaseTime.length !==0){
                
                for (const ele of PurchaseTime) {
                    
                    console.log("usuarios que debemos enviar notificación de que ya esta disponible ->", ele);
                    
                    const newMessage = new modelMessage({times, typeNote: 'availability-noti', titleArticle, urlImageArticle, userId : ele, question, depart, productId, toCreatedArticleId, ownerStore });
                    console.log("newMessage :", newMessage);
                    const saveMessage = await newMessage.save();

                }
            }

            const resultSearch = await modelArtes.findByIdAndUpdate( id, { $set: { purchaseTime: [] } },{ new: true });
            boxInfo.push(resultSearch);            
            
        }else {
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { onlyOneAvailable : false }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }

    } else if ( depart === "automotive"){
        const resultOnlyOneAvailable = await modelAutomotive.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelAutomotive.findByIdAndUpdate( id, { onlyOneAvailable : true }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelAutomotive.findByIdAndUpdate( id, { onlyOneAvailable : false }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }

    }   else if ( depart === "airplanes"){
        const resultOnlyOneAvailable = await modelAirplane.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelAirplane.findByIdAndUpdate( id, { onlyOneAvailable : true }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelAirplane.findByIdAndUpdate( id, { onlyOneAvailable : false }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "nautical"){
        const resultOnlyOneAvailable = await modelNautical.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelNautical.findByIdAndUpdate( id, { onlyOneAvailable : true }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelNautical.findByIdAndUpdate( id, { onlyOneAvailable : false }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "realstate"){
        const resultOnlyOneAvailable = await modelRealstate.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelRealstate.findByIdAndUpdate( id, { onlyOneAvailable : true }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelRealstate.findByIdAndUpdate( id, { onlyOneAvailable : false }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "service"){
        const resultOnlyOneAvailable = await modelService.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelService.findByIdAndUpdate( id, { onlyOneAvailable : true }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelService.findByIdAndUpdate( id, { onlyOneAvailable : false }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "auctions"){
        const resultOnlyOneAvailable = await modelAuction.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelAuction.findByIdAndUpdate( id, { onlyOneAvailable : true }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelAuction.findByIdAndUpdate( id, { onlyOneAvailable : false }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }

    
    res.json(boxInfo);
});

routes.post('/account/delivery', async (req, res)=>{
    const boxInfo = []
    console.log("hemos llegado a setting/delivery")
    console.log(req.body)
    const { depart, id } = req.body;

    if (depart === 'items'){
        const result = await modelItems.findById(id);
        const Delivery = result.delivery;
        console.log("Esto es Delivery", Delivery);

        if (Delivery === false){
            const resultSearch = await modelItems.findByIdAndUpdate( id, { delivery : true }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            console.log('esto es boxInfo------->', boxInfo); 
        }else {
            const resultSearch = await modelItems.findByIdAndUpdate( id, { delivery : false }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            console.log('esto es boxInfo------->', boxInfo);  
        }
        
    } else if ( depart === "arts"){
        const result = await modelArtes.findById(id);
        const Delivery = result.delivery;

        if (Delivery === false){
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { delivery : true }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { delivery : false }, { new: true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }
        
    }    

    
    res.json(boxInfo);
});

//agotado
routes.post('/account/soldOut', async (req, res)=>{ 
    const boxInfo = []
    console.log("hemos llegado a setting/soldOut")
    console.log(req.body)
    const { depart, id } = req.body;

    const date = new Date();
    let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
    let hora = date.getHours(); let minu = date.getMinutes();

    let mesFormatted = String(mes).padStart(2, '0');
    let minuFormatted = String(minu).padStart(2, '0');
    const times = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;    

    if (depart === 'items'){
        const result = await modelItems.findById(id);
        const soldOut = result.soldOut;
        //console.log("Esto es soldOut", soldOut);

        if (soldOut === false){
            const resultSearch = await modelItems.findByIdAndUpdate( id, { soldOut : true, offer : false, onlyOneAvailable : false }, { new: true });
            //cuando colocamos la etiqueta de agotado, quitamos oferta y ultimo disponible por si los tenia.
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo); 
            res.json(boxInfo);

        }else {
            const result = await modelItems.findByIdAndUpdate( id, { soldOut : false }, { new: true });
            //console.log('esto es resultSearch', resultSearch );
            //es hora de evaluar si el campo purchaseTime del documento arts tiene elementos, estos elementos son indexed de personas que quieren ser avisados para recibir notificacion en su inbox cuando este producto este disponible.

            const PurchaseTime = result.purchaseTime; //aqui tenemos el array de usuarios indexed para buscar en el profile
            const titleArticle = result.title; const urlImageArticle = result.images[0].url;
            const question = '¡Este artículo ya esta disponible!'; const toCreatedArticleId = result.user_id;
            const ownerStore = result.username; const productId = result._id;
            const depart = 'items'; const answer = 'waiting'; const view = 'false';
            const imageFirst = result.images[0].url; 

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
            
            const titleURL = transformarTitle(titleArticle);
            //console.log(titleURL); // "hoverboard-blue-tooth-250w"
            

            async function sendindNotification(){
                if (PurchaseTime.length !==0){
                    
                    for (const ele of PurchaseTime) {
                        
                        console.log("usuarios que debemos enviar notificación de que ya esta disponible ->", ele);
                        
                        const newMessage = new modelMessage({times, typeNote: 'availability-noti', titleArticle, titleURL, urlImageArticle, userId : ele, question, depart, productId, toCreatedArticleId, ownerStore });
                        console.log("newMessage :", newMessage);
                        const saveMessage = await newMessage.save();

                    }
                }
            }    

            async function resetADS(){
                console.log("resetADS() ---->")
                console.log("Esto es id ---->", id)
                const resultSearch = await modelItems.findByIdAndUpdate( id, { $set: { purchaseTime: [] } },{ new: true });            
                boxInfo.push(resultSearch);
                console.log('esto es resultSearch debemo sverificar que realmente borro el array purchaseTime', resultSearch );
                //console.log('esto es boxInfo------->', boxInfo); 

                console.log('esto es boxInfo------->', boxInfo);
                res.json(boxInfo); //enviamos el resultado rapido para que actualice en el fronted mientras el backend se queda enviando telegramas
            }

            //es hora de enviar tegramas.
            async function blissBotNoti() {
                //console.log("imageFirst en blissBotNoti function ---->", imageFirst);
                //console.log("question en blissBotNoti function ---->", question);  
                //console.log("titleArticle en blissBotNoti function ----->", titleArticle);
                //console.log("ownerStore en blissBotNoti function ----->", ownerStore);
                
                let messageCount = 0; // Inicializa el contador
            
                // Verifica si ya se enviaron 100 mensajes antes de comenzar
                if (messageCount >= 99) return; 
            
                const promises = PurchaseTime.map(async (indexed) => {
                    if (messageCount >= 99) return; // Detiene si se ha enviado 100 mensajes
            
                    try {
                        const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(indexed));
                        const chatId = searchUserStore.blissBot.chatId;
                        console.log("chatId ---->", chatId);
            
                        if (chatId) {
                            const response = await axios.post(`https://api.telegram.org/bot${Token}/sendPhoto`, {
                                chat_id: chatId,
                                photo: imageFirst, //¡Este artículo ya esta disponible! "Monopatin MK086 (Pro2)"'
                                caption: `Notificación de Blissenet.com: Available\n\n${ownerStore} anuncia "${titleArticle}" ya se encuentra disponible.`
                            });
            
                            console.log('--------------------------- BlissBot----------------------------');
                            //console.log('Mensaje enviado con éxito:', response.data);
            
                            messageCount++; // Incrementa el contador solo si se envió exitosamente
                        }
            
                    } catch (error) {
                        console.log('--------------------------- BlissBot----------------------------');
                        console.error('Error al enviar el mensaje:', error );
                    }
                });
            
                await Promise.all(promises);
            }   



            async function ejecutarFunciones() {
                try {
                    await sendindNotification();
                    console.log("sendindNotification ejecutado correctamente.");

                    await resetADS();
                    console.log("resetADS ejecutado correctamente.");

                    await blissBotNoti();
                    console.log("blissBotNoti ejecutado correctamente.");
            
                } catch (error) {
                    const errorMessage = error.message || "Ha habido un error, intente luego.";
                }
            }
            
            ejecutarFunciones()

        }
        
    } else if ( depart === "arts"){
        const result = await modelArtes.findById(id);
        const soldOut = result.soldOut;
        //console.log("Esto es soldOut", soldOut);

        if (soldOut === false){
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { soldOut : true, offer : false, onlyOneAvailable : false }, { new: true });
            //es hora de evaluar si el campo purchaseTime del documento arts tiene elementos, estos elementos son indexed de personas que quieren ser avisados para recibir notificacion en su inbox cuando este producto este disponible.
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);
            res.json(boxInfo);

        }else {
            const result = await modelArtes.findByIdAndUpdate( id, { soldOut : false }, { new: true });

            const PurchaseTime = result.purchaseTime; //aqui tenemos el array de usuarios indexed para buscar en el profile
            const titleArticle = result.title; const urlImageArticle = result.images[0].url;
            const question = '¡Este artículo ya esta disponible!'; const toCreatedArticleId = result.user_id;
            const ownerStore = result.username; const productId = result._id;
            const depart = 'items'; const answer = 'waiting'; const view = 'false';
            const imageFirst = result.images[0].url;

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
            
            const titleURL = transformarTitle(titleArticle);
            //console.log(titleURL); // "hoverboard-blue-tooth-250w"

            async function sendindNotification(){
                if (PurchaseTime.length !==0){
                    
                    for (const ele of PurchaseTime) {
                        
                        console.log("usuarios que debemos enviar notificación de que ya esta disponible ->", ele);
                        
                        const newMessage = new modelMessage({times, typeNote: 'availability-noti', titleArticle, titleURL, urlImageArticle, userId : ele, question, depart, productId, toCreatedArticleId, ownerStore });
                        console.log("newMessage :", newMessage);
                        const saveMessage = await newMessage.save();

                    }
                }
            }    

            async function resetADS(){
                const resultSearch = await modelArtes.findByIdAndUpdate( id, { $set: { purchaseTime: [] } },{ new: true });
                boxInfo.push(resultSearch);
                res.json(boxInfo); //enviamos el resultado rapido para que actualice en el fronted mientras el backend se queda enviando telegramas
            }

            //es hora de enviar tegramas.
            async function blissBotNoti() {
                //console.log("imageFirst en blissBotNoti function ---->", imageFirst);
                //console.log("question en blissBotNoti function ---->", question);  
                //console.log("titleArticle en blissBotNoti function ----->", titleArticle);
                
                let messageCount = 0; // Inicializa el contador
            
                // Verifica si ya se enviaron 100 mensajes antes de comenzar
                if (messageCount >= 99) return; 
            
                const promises = PurchaseTime.map(async (indexed) => {
                    if (messageCount >= 99) return; // Detiene si se ha enviado 100 mensajes
            
                    try {
                        const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(indexed));
                        const chatId = searchUserStore.blissBot.chatId;
                        console.log("chatId ---->", chatId);
            
                        if (chatId) {
                            const response = await axios.post(`https://api.telegram.org/bot${Token}/sendPhoto`, {
                                chat_id: chatId,
                                photo: imageFirst,
                                caption: `Notificación de Blissenet.com: Available\n\n${ownerStore} anuncia "${titleArticle}" ya se encuentra disponible.`
                            });
            
                            console.log('--------------------------- BlissBot----------------------------');
                            //console.log('Mensaje enviado con éxito:', response.data);
            
                            messageCount++; // Incrementa el contador solo si se envió exitosamente
                        }
            
                    } catch (error) {
                        console.log('--------------------------- BlissBot----------------------------');
                        console.error('Error al enviar el mensaje:', error );
                    }
                });
            
                await Promise.all(promises);
            }                 


            async function ejecutarFunciones() {
                try {
                    await sendindNotification();
                    console.log("sendindNotification ejecutado correctamente.");
                   
                    await resetADS();
                    console.log("resetADS ejecutado correctamente.");

                    await blissBotNoti();
                    console.log("blissBotNoti ejecutado correctamente.");

            
                } catch (error) {
                    const errorMessage = error.message || "Ha habido un error, intente luego.";
                }
            }
            
            ejecutarFunciones()

        }
        
    }    

    
  
});
 

routes.post('/account/purchaseTime', async (req, res)=>{
    console.log("hemos llegado a /account/purchaseTime")
    const user = req.session.user;
    const indexed = user._id;

    console.log(req.body)
    const { depart, id } = req.body;

    if (depart === 'items'){
        const result = await modelItems.findOne( {_id : id, purchaseTime : indexed} );

        if (!result){
            console.log("Esto es result", result);
            const updatePurchaseTime = await modelItems.findByIdAndUpdate(
                id,
                { $push: { purchaseTime: indexed } },
                { new: true } // Esto asegura que obtienes el documento actualizado
            );
            console.log("updatePurchaseTime ->", updatePurchaseTime);
            const response = { note: 1 };
            res.json(response);

        } else {
            console.log("Esto es result", result);
            const updatePurchaseTime = await modelItems.findByIdAndUpdate(
                id,
                { $pull: { purchaseTime: indexed } },
                { new: true } // Esto asegura que obtienes el documento actualizado
            );
            console.log("updatePurchaseTime ->", updatePurchaseTime);
            const response = { note: 0 };
            res.json(response);

        }
        //const purchaseTime = result;
        


    } else if ( depart === "arts"){
        const result = await modelArtes.findOne( {_id : id, purchaseTime : indexed} );

        if (!result){
            console.log("Esto es result", result);
            const updatePurchaseTime = await modelArtes.findByIdAndUpdate(
                id,
                { $push: { purchaseTime: indexed } },
                { new: true } // Esto asegura que obtienes el documento actualizado
            );
            console.log("updatePurchaseTime ->", updatePurchaseTime);
            const response = { note: 1 };
            res.json(response);

        } else {
            console.log("Esto es result", result);
            const updatePurchaseTime = await modelArtes.findByIdAndUpdate(
                id,
                { $pull: { purchaseTime: indexed } },
                { new: true } // Esto asegura que obtienes el documento actualizado
            );
            console.log("updatePurchaseTime ->", updatePurchaseTime);
            const response = { note: 0 };
            res.json(response);

        }

        
    }   
});


//envio de solicitud de consolidacion
routes.post('/send_shoppingCart/consolidate', async(req, res)=>{

    try {
        
        console.log("......../send_shoppingCart/consolidate..........");
        //console.log("req.boy", req.body);
        
        const {boxShopping, StoreId, UserId, Amount, clientAddress, clientPhone, clientIndentification, clientName, deliveryOptionV, orderDetail } = req.body;
        
        console.log("boxShopping :", boxShopping);
        console.log("StoreId :", StoreId);
        console.log("UserId :", UserId); //comprador

        const boxReceiver = {
            clientAddress, 
            clientPhone,
            clientIndentification,
            clientName
        }
 
        const date = new Date();
        const cartId = date.getTime(); //codigo para identificar el carrito.

        const hour = date.getHours(); const minut = date.getMinutes();
        const dd = date.getDate(); const mm = date.getMonth() +1; const yyyy = date.getFullYear();
        
        const ddFormatted = String(dd).padStart(2, '0');
        const mmFormatted = String(mm).padStart(2, '0');
        const hourFormatted = String(hour).padStart(2, '0');
        const minuteFormatted = String(minut).padStart(2, '0');

        const time = `${ddFormatted}-${mmFormatted}-${yyyy} ${hourFormatted}:${minuteFormatted}`;

        console.log("time :", time); //time : 16-8-2025 11:47 

        const searchStore = await modelProfile.findOne({indexed : StoreId}, {username: 1, countryCode: 1, country:1, state:1, city: 1, sellerType: 1 });
        const store = searchStore;
        console.log("store:", store);
        const sellerName = store.username;
        const SellerType = searchStore.sellerType;

        const storeChatId = await modelUser.findById(StoreId);
        const chatId = storeChatId.blissBot.chatId

        console.log("storeChatId..............:", storeChatId);
        console.log("chatId..............:", chatId); //es la tienda que recibe el telegrama 

        const searchCustomer = await modelProfile.findOne({indexed : UserId});
        let client;
        let CustomerName;


        if (searchCustomer){
            client = searchCustomer;
            CustomerName = client.username;
            const avatar = client.avatarPerfil[0].url;
            const avatarDefault = client.mailhash;

            console.log("cliente:", client);
            console.log("CustomerName:", CustomerName);

            
            const existShoppingCart = await modelShoppingCart.findOne({ customerId : UserId, sellerId : StoreId, paid: 'false' });

            console.log("existShoppingCart :", existShoppingCart);

            if (!existShoppingCart){
                //No existe, entonces se crea, es null
                console.log("no existe es null")
                if (SellerType.internacional === "false"){
                    console.log("esta tienda tiene la opcion internacional desabilitada")
                    console.log("SellerType.nacional :", SellerType.nacional);
                    console.log("typeof SellerType.nacional :", typeof SellerType.nacional);


                    //La tienda tiene restricciones de vender.
                    if (SellerType.nacional === "true" && SellerType.estadal === "true" && SellerType.local ==="true"){ //nacional es el pais, por eso evaluo el codigo del pais.
                        //solo se evalua el pais nada mas porque al seleccionar esta opcion tiene estadal y city activas
                        console.log("La opcion nacional esta activada en true");
                        if (searchStore.countryCode === searchCustomer.countryCode){
                            //se puede ejecutar la venta
                            console.log("estamos la rama de internacionl:false, nacional:true");
                            console.log("estamos en el mismo pais y podemos seguir adelante con la consolidacion");

                            createShoppingCart()
                                .then(()=>{
                                    Notification()
                                        .then(()=>{

                                            if (chatId){
                                                blissBotNoti()
                                                    .then(()=>{
                                                        const response = { code: "ok", message: "En proceso de consolidación, espere por favor."}
                                                        res.json(response);  
                                                    })
                                                    .catch(error => {
                                                        console.error('Error al ejecutar la funcion blissBotNoti', error);
                                                    });  

                                            } else {
                                                const response = { code: "ok", message: "En proceso de consolidación, espere por favor."}
                                                res.json(response);
                                            }


                                        })
                                        .catch(error => {
                                            console.error('Error al ejecutar la funcion Notification', error);
                                        });

                                })
                                .catch(error => {
                                    console.error('Error al ejecutar la funcion createShoppingCart', error);
                                });

                        } else {
                            //seguimos evaluando si podemos sacar esta venta adelante
                            console.log("estamos la rama de internacionl:false");
                            console.log("El pais es diferente no podemos ejecutar la consolidacion");
                            const response = { code: "err", message: `Esta tienda solo vende en el interior del pais: ${searchStore.country}`};
                            res.json(response);
                        }
                        
                    }

                    if (SellerType.nacional === "false" && SellerType.estadal === "true" && SellerType.local ==="true"){

                        if (searchStore.state === searchCustomer.state){
                            console.log("estamos la rama de internacionl:false, nacional:false, estadal:true");
                            console.log("estamos en el mismo estado y podemos seguir adelante con la consolidacion");
                               

                            createShoppingCart()
                                .then(()=>{
                                    Notification()
                                        .then(()=>{
                                            
                                            if (chatId){
                                                blissBotNoti()
                                                    .then(()=>{
                                                        const response = { code: "ok", message: "En proceso de consolidación, espere por favor."}
                                                        res.json(response);  
                                                    })
                                                    .catch(error => {
                                                        console.error('Error al ejecutar la funcion blissBotNoti', error);
                                                    });

                                            } else {
                                                const response = { code: "ok", message: "En proceso de consolidación, espere por favor."}
                                                res.json(response);
                                            }

                                        })
                                        .catch(error => {
                                            console.error('Error al ejecutar la funcion Notification', error);
                                        });

                                })
                                .catch(error => {
                                    console.error('Error al ejecutar la funcion createShoppingCart', error);
                                });

                        } else {
                            console.log("estamos la rama de internacionl:false, nacional:false, estadal:true");
                            console.log("El estado es diferente no podemos ejecutar la consolidacion");
                            const response = { code: "err", message: `Esta tienda solo vende en el interior del Estado: ${searchStore.state}, Pais: ${searchStore.country}. `};
                            res.json(response);
                        }

                    } 
                        
                    if (SellerType.nacional === "false" && SellerType.estadal === "false" && SellerType.local ==="true"){
                        
                        if (searchStore.city === searchCustomer.city){
                            console.log("estamos la rama de internacionl:false, nacional:false, estadal:false y city:true");
                            console.log("estamos en la misma ciudad y podemos seguir adelante con la consolidacion");
                                                                 

                            createShoppingCart()
                                .then(()=>{
                                    Notification()
                                        .then(()=>{
                                            
                                            if (chatId){
                                                blissBotNoti()
                                                    .then(()=>{
                                                        const response = { code: "ok", message: "En proceso de consolidación, espere por favor."}
                                                        res.json(response);  
                                                    })
                                                    .catch(error => {
                                                        console.error('Error al ejecutar la funcion blissBotNoti', error);
                                                    });    

                                            } else {
                                                const response = { code: "ok", message: "En proceso de consolidación, espere por favor."}
                                                res.json(response);
                                            }


                                        })
                                        .catch(error => {
                                            console.error('Error al ejecutar la funcion Notification', error);
                                        });

                                })
                                .catch(error => {
                                    console.error('Error al ejecutar la funcion createShoppingCart', error);
                                });

                     
                        } else {
                            console.log("estamos la rama de internacionl:false, nacional:false, estadal:false y city:true");
                            console.log("La ciudad es diferente no podemos ejecutar la consolidacion");
                            const response = { code: "err", message: `Esta tienda solo vende en la ciudad de ${searchStore.city} de ${searchStore.state}, Pais: ${searchStore.city}`};
                        }
                        
                    }    

                } else {

                    //La tienda es libre de vender sin restricciones a todo el mundo.

                    createShoppingCart()
                        .then(()=>{
                            Notification()
                                .then(()=>{
                                    
                                    if (chatId){
                                        blissBotNoti()
                                            .then(()=>{
                                                const response = { code: "ok", message: "En proceso de consolidación, espere por favor."}
                                                res.json(response);  
                                            })
                                            .catch(error => {
                                                console.error('Error al ejecutar la funcion blissBotNoti', error);
                                            });

                                    } else {
                                        const response = { code: "ok", message: "En proceso de consolidación, espere por favor."}
                                        res.json(response);
                                    }


                                })
                                .catch(error => {
                                    console.error('Error al ejecutar la funcion Notification', error);
                                });

                        })
                        .catch(error => {
                            console.error('Error al ejecutar la funcion createShoppingCart', error);
                        });

                }

                    
            } else {
                //existe, entonces se envia un mensaje de calma y que debe esperar la consolidación.
                const consolidate = existShoppingCart.consolidate;

                if (consolidate === "false"){

                    console.log("si existe el carrito y esta siendo consolidado")
                    const response = { code: "info", message: "En proceso de consolidación, espere por favor."}
                    res.json(response); 

                } else {

                    console.log("si existe el carrito y ya fue consolidado")
                    const response = { code: "info", message: "Su pedido a sido Consolidado, Vaya a Notificaciones y acceda al link para gestionar el pago."}
                    res.json(response); 

                }


            }

            async function createShoppingCart(){
                const newShoppingCart = new modelShoppingCart({  
                                            cartId,
                                            customerId : UserId,
                                            customerName : CustomerName,
                                            sellerId : StoreId,
                                            sellerName : sellerName,
                                            boxShoppingCart : boxShopping,
                                            date : time,
                                            amount : Amount,
                                            purchaseReceiver : boxReceiver,
                                            deliveryOptions : deliveryOptionV,
                                            boxReceiver : boxReceiver,
                                            orderDetail : orderDetail
                                        });
                const saveShoppingCart  = await newShoppingCart.save();
            }  
            
            async function Notification(){
                //enviar mensaje al usuario que lo estan siguiendo.
                const newNotification = new modelMessage( { typeNote: 'shoppingCart-Cre',
                                                            cartId,
                                                            times: time,
                                                            objeAvatar : {avatar, avatarDefault},
                                                            username: CustomerName,
                                                            question: `¡Hola! ${CustomerName} te ha realizado una compra.`,
                                                            toCreatedArticleId : StoreId, //el id de la cuenta donde debe llegar la notificacion
                                                            answer: 'waiting',
                                                            view: false, 
                                                        } );
                console.log("newNotification ------>", newNotification);

                const saveMessage = await newNotification.save();
                console.log("se ha creado la notificacion de creación de un carrito");
            }            

            async function blissBotNoti(){ //esta funcion es para enviar un Telegrama al vendedor. debe ser avisado de inmediato.
                console.log("Estamos dentro de la funcion blissBotNoti() ---------------------------->");

                const Message = `Notificación de Blissenet.com: Shopping Cart\n\n¡Hola! ${CustomerName} te ha realizado una compra.`;
                console.log("chatId --->", chatId);          

                axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                    chat_id: chatId,
                    text: Message,
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

        } else {
            //el cliente no tiene perfil
            console.log("Este proceso requiere perfil.")
            const response = { code: "info", message: "Este proceso requiere Perfil."}
            res.json(response); 
        }

        
    } catch (error) {
        console.log("Ha habido un error en el endPoint")
        const response = { code : "err", message : "Ha habido un error, intente mas tarde." };
        res.json(response);
    }

});

routes.post('/done_shoppingCart/consolidate', async(req, res)=>{

    try {

        console.log("......../done_shoppingCart/consolidate..........");
        console.log("req.boy................ :", req.body);
        const { box } = req.body;
        
        const iDCart = box.iDCart;
        const clientName = box.clientName;
        const boxShopping = box.boxShopping;
        const total = box.total;

        console.log("iDCart :", box.iDCart);

        let date = new Date();
        let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
        let hora = date.getHours(); let minu = date.getMinutes();

        let mesFormatted = String(mes).padStart(2, '0');
        let minuFormatted = String(minu).padStart(2, '0');
        const timeNow = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

        //console.log("timeNow :", timeNow);

        //Primero ubicamos el carrito.
        const searchShoppingCart = await modelShoppingCart.findById(iDCart);

        //console.log("Esto es searchShoppingCart :", searchShoppingCart);
        //IMPORTANTE evaluar que exista informacion de searchShoppingCart
        if (searchShoppingCart) {

            const cartId = searchShoppingCart.cartId; //identificador de carrito para poder eliminar el mensaje shoppingCart-Cre
            const customerId = searchShoppingCart.customerId;
            const customerName = searchShoppingCart.customerName;
            const sellerId = searchShoppingCart.sellerId;
            const sellerName = searchShoppingCart.sellerName;

            //busco en el perfil del vendedor el avatar 
            const searchProfileSeller = await modelProfile.findOne({ indexed : sellerId });
            //console.log("searchProfileSeller....:", searchProfileSeller);

            const sellerUsername = searchProfileSeller.username;
            const avatar = searchProfileSeller.avatarPerfil[0].url; const avatarDefault = searchProfileSeller.mailhash;
            //console.log("Este es el avatar :", avatar);
            //console.log("Este es el avatarDefault :", avatarDefault);

            const searchUserClient = await modelUser.findById(customerId);
            const chatId = searchUserClient.blissBot.chatId

            //console.log("searchUserClient..............:", searchUserClient);
            console.log("chatId..............:", chatId);

            async function Notification(){

                //eliminamos el mensaje de shoppingCart-Cre, para mantener el inbox limpio de mensajes innesarios
                await modelMessage.deleteOne({ typeNote: 'shoppingCart-Cre', cartId: cartId});

                //enviar mensaje de que su pedido ha sido consolidado
                const newNotification = new modelMessage( { typeNote: 'shoppingCart-Con',
                                                            cartId,
                                                            times: timeNow,
                                                            objeAvatar : {avatar, avatarDefault},
                                                            username: sellerUsername,
                                                            question: `¡Hola! ${sellerUsername} notifica que su pedido a sido consolidado,`,
                                                            toCreatedArticleId : customerId, //el id de la cuenta donde debe llegar la notificacion
                                                            answer: 'waiting',
                                                            view: false } );
                console.log("newNotification ------>", newNotification);

                const saveMessage = await newNotification.save();
                console.log("se ha creado la notificacion de consolidación del carrito");
            }

            async function blissBotNoti(){ //esta funcion es para enviar un Telegrama al comprador. Que debe ser avisado de inmediato.
                console.log("Estamos dentro de la funcion blissBotNoti() ---------------------------->");

                const Message = `Notificación de Blissenet.com: Shopping Cart\n\n¡Hola! ${sellerUsername} notifica que su pedido a sido consolidado. Entre a Blissenet.com y en Notificaciones tendrás el enlace para gestionar el pago.`;
                console.log("chatId --->", chatId);          

                axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                    chat_id: chatId,
                    text: Message,
                })
                .then(response => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.log('Mensaje enviado con éxito:', response.data);
                })
                .catch(error => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.error('Error al enviar el mensaje:', error.response.data);
                });
        
            }

            async function doneShoppingcart() {
                await modelShoppingCart.findByIdAndUpdate(iDCart, { boxShoppingCart: boxShopping, amount: total, consolidate : "true" },{ new: true });
            }

            Notification()
                .then(()=>{

                    if (chatId){

                        blissBotNoti()
                            .then(()=>{
                                doneShoppingcart()
                                    .then(()=>{
                                        const message = "Pedido Consolidado y notificado a su cliente.";
                                        const response = { "code" : "ok", "message" : message};
                                        res.json(response);
                                    })
                                    .catch(error => {
                                        console.error('Error al ejecutar la funcion doneShoppingcart', error);
                                    });
                            })
                            .catch(error => {
                                console.error('Error al ejecutar la funcion blissBotNoti', error);
                            });

                    } else {

                        doneShoppingcart()
                            .then(()=>{
                                const message = "Pedido Consolidado y notificado a su cliente.";
                                const response = { "code" : "ok", "message" : message};
                                res.json(response);
                            })
                            .catch(error => {
                                console.error('Error al ejecutar la funcion deleteShoppingcart', error);
                            });

                    }
                })
                .catch(error => {
                    console.error('Error al ejecutar la funcion Notification()....', error);
                });

        } else {
            console.log("No existe el carrito que se quiere consolidar");
        }        


    } catch (error) {
        console.log("error :", error);
    }

});

routes.post('/delete_shoppingCart/consolidate', async(req, res)=>{

    try {

        console.log("......../delete_shoppingCart/consolidate..........");
        console.log("req.boy :", req.body);
        const { box } = req.body;
        
        const iDCart = box.iDCart;
        const clientName = box.clientName;
        const boxShopping = box.boxShopping;
        const total = box.total;

        console.log("iDCart :", box.iDCart);

        let date = new Date();
        let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
        let hora = date.getHours(); let minu = date.getMinutes();

        let mesFormatted = String(mes).padStart(2, '0');
        let minuFormatted = String(minu).padStart(2, '0');
        const timeNow = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

        //console.log("timeNow :", timeNow);

        const searchShoppingCart = await modelShoppingCart.findById(iDCart);
        if (searchShoppingCart){
       
            //console.log("Esto es searchShoppingCart :", searchShoppingCart);
            const cartId = searchShoppingCart.cartId; //identificador de carrito para poder eliminar el mensaje shoppingCart-Cre
            const customerId = searchShoppingCart.customerId;
            const customerName = searchShoppingCart.customerName;
            const sellerId = searchShoppingCart.sellerId;

            //busco en el perfil del vendedor el avatar 
            const searchProfileSeller = await modelProfile.findOne({ indexed : sellerId });
            console.log("searchProfileSeller....:", searchProfileSeller);

            const sellerUsername = searchProfileSeller.username;
            const avatar = searchProfileSeller.avatarPerfil[0].url; const avatarDefault = searchProfileSeller.mailhash;
            console.log("Este es el avatar :", avatar);
            console.log("Este es el avatarDefault :", avatarDefault);

            const searchUserClient = await modelUser.findById(customerId);
            const chatId = searchUserClient.blissBot.chatId

            console.log("searchUserClient..............:", searchUserClient);
            console.log("chatId..............:", chatId);

            async function Notification(){

                //eliminamos el mensaje de shoppingCart-Cre, para mantener el inbox limpio de mensajes innesarios
                await modelMessage.deleteOne({ typeNote: 'shoppingCart-Cre', cartId: cartId});


                //enviar mensaje al comprador de que su pedido ha sido eliminado, por alguna razon.
                const newNotification = new modelMessage( { typeNote: 'shoppingCart-Del',
                                                            times: timeNow,
                                                            objeAvatar : {avatar, avatarDefault},
                                                            username: sellerUsername,
                                                            question: `¡Hola! ${sellerUsername} ha eliminado tu compra. Puedes comunicarte con ellos para saber el motivo.`,
                                                            toCreatedArticleId : customerId, //el id de la cuenta donde debe llegar la notificacion
                                                            answer: 'waiting',
                                                            view: false } );
                console.log("newNotification ------>", newNotification);

                const saveMessage = await newNotification.save();
                console.log("se ha creado la notificacion de eliminación del carrito");
            }

            async function blissBotNoti(){ //esta funcion es para enviar un Telegrama al vendedor. debe ser avisado de inmediato.
                console.log("Estamos dentro de la funcion blissBotNoti() ---------------------------->");

                const Message = `Notificación de Blissenet.com: Shopping Cart\n\n¡Hola! ${sellerUsername} ha eliminado tu compra. Puedes comunicarte con ellos para saber el motivo.`;
                console.log("chatId --->", chatId);          

                axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                    chat_id: chatId,
                    text: Message,
                })
                .then(response => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.log('Mensaje enviado con éxito:', response.data);
                })
                .catch(error => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.error('Error al enviar el mensaje:', error.response.data); //esto es porque el error del api de telegram es muy extenso y para filtar la informacion se hace asi. si quieres verlo uso solo "error"
                });
        
            }

            async function deleteShoppingcart() {
                await modelShoppingCart.findByIdAndDelete(iDCart);
            }

            Notification()
                .then(()=>{

                    if (chatId){

                        blissBotNoti()
                            .then(()=>{
                                deleteShoppingcart()
                                    .then(()=>{
                                        const message = "Solicitud de Compra eliminado.";
                                        const response = { "code" : "ok", "message" : message};
                                        res.json(response);
                                    })
                                    .catch(error => {
                                        console.error('Error al ejecutar la funcion deleteShoppingcart', error);
                                    });
                            })
                            .catch(error => {
                                console.error('Error al ejecutar la funcion blissBotNoti', error);
                            });

                    } else {

                        deleteShoppingcart()
                            .then(()=>{
                                const message = "Solicitud de Compra eliminado.";
                                const response = { "code" : "ok", "message" : message};
                                res.json(response);
                            })
                            .catch(error => {
                                console.error('Error al ejecutar la funcion deleteShoppingcart', error);
                            });

                    }
                })
                .catch(error => {
                    console.error('Error al ejecutar la funcion Notification()', error);
                });

        } else {
            console.log("No existe el carrito")
        }       

    } catch (error) {
        console.log("error :", error);
    }

});

routes.post('/done_shoppingCart/registerPay', async(req, res)=>{
    //aqui reguistramos el pago

    try {

        console.log("......../done_shoppingCart/registerPay..........");
        console.log("req.boy................ :", req.body);
        const { IDCart, methodName, textDetailPay } = req.body;
        
        //dataRegPay = [ {methodPay : "", detailPay : "", response : "" } ]

        console.log("IDCart :", IDCart);

        let date = new Date();
        let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
        let hora = date.getHours(); let minu = date.getMinutes();

        let mesFormatted = String(mes).padStart(2, '0');
        let minuFormatted = String(minu).padStart(2, '0');
        const timeNow = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

        //console.log("timeNow :", timeNow);

        //Primero ubicamos el carrito.
        const searchShoppingCart = await modelShoppingCart.findById(IDCart);

        //console.log("Esto es searchShoppingCart :", searchShoppingCart);
        //IMPORTANTE evaluar que exista informacion de searchShoppingCart
        if (searchShoppingCart) {

            const cartId = searchShoppingCart.cartId; //identificador de carrito para poder eliminar el mensaje shoppingCart-Cre
            const customerId = searchShoppingCart.customerId;
            const customerName = searchShoppingCart.customerName;
            const sellerId = searchShoppingCart.sellerId;
            const sellerName = searchShoppingCart.sellerName;

            //busco en el perfil del comprador el avatar 
            const searchProfileCustomer = await modelProfile.findOne({ indexed : customerId });
            //console.log("searchProfileSeller....:", searchProfileSeller);

            const avatar = searchProfileCustomer.avatarPerfil[0].url; 
            const avatarDefault = searchProfileCustomer.mailhash;
            //console.log("Este es el avatar :", avatar);
            //console.log("Este es el avatarDefault :", avatarDefault);

            const searchUserSeller = await modelUser.findById(sellerId);
            const chatId = searchUserSeller.blissBot.chatId

            //console.log("searchUserSeller..............:", searchUserSeller);
            console.log("chatId..............:", chatId);

            async function Notification(){

                //enviar mensaje de que su pedido ha sido consolidado
                const newNotification = new modelMessage( { typeNote: 'shoppingCart-RPay',
                                                            cartId,
                                                            times: timeNow,
                                                            objeAvatar : {avatar, avatarDefault},
                                                            username: customerName,
                                                            question: `¡Hola! ${customerName} ha notificado que ha registrado un pago. Por favor, verifica y procesa dicho pago.`,
                                                            toCreatedArticleId : sellerId, //el id de la cuenta donde debe llegar la notificacion
                                                            answer: 'waiting',
                                                            view: false } );
                console.log("newNotification ------>", newNotification);

                const saveMessage = await newNotification.save();
                console.log("se ha creado la notificacion del registro de pago del carrito");
            }

            async function blissBotNoti(){ //esta funcion es para enviar un Telegrama al comprador. Que debe ser avisado de inmediato.
                console.log("Estamos dentro de la funcion blissBotNoti() ---------------------------->");

                const Message = `Notificación de Blissenet.com: Shopping Cart\n\n¡Hola! ${customerName} notifica que su pedido a sido consolidado. Entre a Blissenet.com y en Notificaciones tendrás el enlace para gestionar el pago.`;
                console.log("chatId --->", chatId);          

                axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                    chat_id: chatId,
                    text: Message,
                })
                .then(response => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.log('Mensaje enviado con éxito:', response.data);
                })
                .catch(error => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.error('Error al enviar el mensaje:', error.response.data);
                });
        
            }

            async function regPayShoppingcart() {
                //dataRegPay = [ ] es un array vacio 
                // debo meter este objeto dentro del array dataRegPay {methodPay : "", detailPay : "", response : "" } 
                const boxDetailPay = {methodPay : methodName, detailPay : textDetailPay, response : "" };
                await modelShoppingCart.findByIdAndUpdate(IDCart, 
                    { regPay : "true", $push : { dataRegPay : boxDetailPay } },
                    { new: true });
            }

            Notification()
                .then(()=>{

                    if (chatId){

                        blissBotNoti()
                            .then(()=>{
                                regPayShoppingcart()
                                    .then(()=>{
                                        const message = "Pago registrado y notificado a la tienda para su revisión y proceso.";
                                        const response = { "code" : "ok", "message" : message};
                                        res.json(response);
                                    })
                                    .catch(error => {
                                        console.error('Error al ejecutar la funcion doneShoppingcart', error);
                                    });
                            })
                            .catch(error => {
                                console.error('Error al ejecutar la funcion blissBotNoti', error);
                            });

                    } else {

                        regPayShoppingcart()
                            .then(()=>{
                                const message = "Pago registrado y notificado a la tienda para su revisión y proceso.";
                                const response = { "code" : "ok", "message" : message};
                                res.json(response);
                            })
                            .catch(error => {
                                console.error('Error al ejecutar la funcion deleteShoppingcart', error);
                            });

                    }
                })
                .catch(error => {
                    console.error('Error al ejecutar la funcion Notification()....', error);
                });

        } else {
            console.log("No existe el carrito que se quiere consolidar");
        }        


    } catch (error) {
        console.log("error :", error);
    }

});

routes.post('/done_shoppingCart/registerPay/paid', async(req, res)=>{

    try {

        console.log("......../done_shoppingCart/registerPay/paid..........");
        console.log("req.boy................ :", req.body);
        const { box } = req.body;

        //{iDCart: '68b9e3497d4ff9bed2d79d60', clientName: 'rogelio', boxShopping: Array(5), total: '36.71'}

        const iDCart = box.iDCart;
        const clientName = box.clientName;
        const boxShopping = box.boxShopping; //array :  {depart: 'items', id: '68aa1e4be584597f2050cb56', title: 'Queso Semiduro', price: '4.8', countRequest: 1}
        const total = box.total;

        console.log("iDCart :", box.iDCart);

        let date = new Date();
        let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
        let hora = date.getHours(); let minu = date.getMinutes();

        let mesFormatted = String(mes).padStart(2, '0');
        let minuFormatted = String(minu).padStart(2, '0');
        const timeNow = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

        //console.log("timeNow :", timeNow);

        //Primero ubicamos el carrito.
        const searchShoppingCart = await modelShoppingCart.findById(iDCart);

        //console.log("Esto es searchShoppingCart :", searchShoppingCart);
        //IMPORTANTE evaluar que exista informacion de searchShoppingCart
        if (searchShoppingCart) {

            const cartId = searchShoppingCart.cartId; //identificador de carrito para poder eliminar el mensaje shoppingCart-Cre
            const customerId = searchShoppingCart.customerId;
            const customerName = searchShoppingCart.customerName;
            const sellerId = searchShoppingCart.sellerId;
            const sellerName = searchShoppingCart.sellerName;

            //busco en el perfil del vendedor el avatar 
            const searchProfileSeller = await modelProfile.findOne({ indexed : sellerId });
            //console.log("searchProfileSeller....:", searchProfileSeller);

            const sellerUsername = searchProfileSeller.username;
            const avatar = searchProfileSeller.avatarPerfil[0].url; const avatarDefault = searchProfileSeller.mailhash;
            //console.log("Este es el avatar :", avatar);
            //console.log("Este es el avatarDefault :", avatarDefault);

            const searchUserClient = await modelUser.findById(customerId);
            const chatId = searchUserClient.blissBot.chatId

            //console.log("searchUserClient..............:", searchUserClient);
            console.log("chatId..............:", chatId);

            async function updateADS() {
                const promises = boxShopping.map(async (ele) => {
                    const { depart, id, countRequest } = ele;
                    const countRequestFormat = parseFloat(countRequest); // Convertir el string a número

                    try {
                        let status;
                        if (depart === "items") {
                            status = await modelItems.findById(id, { title: 1, count: 1, sales: 1 });
                        } else {
                            status = await modelArtes.findById(id, { title: 1, count: 1, sales: 1 });
                        }

                        if (status) {
                            const countNow = status.count;
                            const salesNow = status.sales;

                            if (depart === "items") {
                                return modelItems.findByIdAndUpdate(id, { count: countNow - countRequestFormat, sales: salesNow + countRequestFormat });
                            } else {
                                return modelArtes.findByIdAndUpdate(id, { count: countNow - countRequestFormat, sales: salesNow + countRequestFormat });
                            }
                        }
                    } catch (error) {
                        console.error(`Error updating item with id ${id}:`, error);
                    }
                });

                await Promise.all(promises);
            }

            async function Notification(){

                //eliminamos el mensaje de shoppingCart-Con, para mantener el inbox limpio de mensajes innesarios
                await modelMessage.deleteOne({ typeNote: 'shoppingCart-Con', cartId: cartId });

                //eliminamos el mensaje shoppingCart-RPay. De esta manera limpiamos el inbox del la tienda, que decia ¡Hola! usuario notifica que ha registrado un pago, verifica y procesa su pago. Ir a la Administración de carritos.
                await modelMessage.deleteOne({ typeNote: 'shoppingCart-RPay', cartId: cartId });

                await modelMessage.deleteMany({ typeNote: 'shoppingCart-unPaid', cartId: cartId });

                //enviar mensaje de que su pedido ha sido pagado
                const newNotification = new modelMessage( { typeNote: 'shoppingCart-Paid',
                                                            cartId,
                                                            times: timeNow,
                                                            objeAvatar : {avatar, avatarDefault},
                                                            username: sellerUsername,
                                                            question: `¡Hola! ${sellerUsername} notifica que su pago ha sido validado.`,
                                                            toCreatedArticleId : customerId, //el id de la cuenta donde debe llegar la notificacion
                                                            answer: 'waiting',
                                                            view: false } );
                console.log("newNotification ------>", newNotification);

                const saveMessage = await newNotification.save();
                console.log("se ha creado la notificacion de consolidación del carrito");
            }

            async function blissBotNoti(){ //esta funcion es para enviar un Telegrama al comprador. Que debe ser avisado de inmediato.
                console.log("Estamos dentro de la funcion blissBotNoti() ---------------------------->");

                const Message = `Notificación de Blissenet.com: Shopping Cart\n\n¡Hola! ${sellerUsername} notifica que su pago ha sido validado. Entre a Blissenet.com y en Notificaciones tendrás el enlace para ver el status de tu compra.`;
                console.log("chatId --->", chatId);          

                axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                    chat_id: chatId,
                    text: Message,
                })
                .then(response => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.log('Mensaje enviado con éxito:', response.data);
                })
                .catch(error => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.error('Error al enviar el mensaje:', error.response.data);
                });
        
            }


            async function doneShoppingcart() {
                //debemos actualizar el ultimo elemento del array dataRegPay, el campo response. 
                const shoppingCart = await modelShoppingCart.findById(iDCart);
                if (shoppingCart && shoppingCart.dataRegPay.length > 0) {
                    const lastIndex = shoppingCart.dataRegPay.length - 1; // Índice del último elemento
                    await modelShoppingCart.findByIdAndUpdate(
                        iDCart,
                        { 
                            paid: "true", 
                            [`dataRegPay.${lastIndex}.response`]: "ok" // Actualiza el campo response del último elemento
                        },
                        { new: true }
                    );
                }
            }            

            updateADS()
                .then(()=>{

                    Notification()
                        .then(()=>{

                            if (chatId){

                                blissBotNoti()
                                    .then(()=>{
                                        doneShoppingcart()
                                            .then(()=>{
                                                const message = "Pago efectivo y notificado a su cliente.";
                                                const response = { "code" : "ok", "message" : message};
                                                res.json(response);
                                            })
                                            .catch(error => {
                                                console.error('Error al ejecutar la funcion doneShoppingcart', error);
                                            });
                                    })
                                    .catch(error => {
                                        console.error('Error al ejecutar la funcion blissBotNoti', error);
                                    });

                            } else {

                                doneShoppingcart()
                                    .then(()=>{
                                        const message = "Pedido efectivo y notificado a su cliente.";
                                        const response = { "code" : "ok", "message" : message};
                                        res.json(response);
                                    })
                                    .catch(error => {
                                        console.error('Error al ejecutar la funcion doneShoppingcart', error);
                                    });

                            }
                        })
                        .catch(error => {
                            console.error('Error al ejecutar la funcion Notification()....', error);
                        });

                })
                .catch(error => {
                    console.error('Error al ejecutar la funcion updateADS()....', error);
                })         

        } else {
            console.log("No existe el carrito que se quiere consolidar");
        }        


    } catch (error) {
        console.log("error :", error);
    }

});

routes.post('/done_shoppingCart/registerPay/unpaid', async(req, res)=>{

    try {

        console.log("......../done_shoppingCart/registerPay/unpaid..........");
        console.log("req.boy................ :", req.body);
        const { box } = req.body;

        //{iDCart: '68b9e3497d4ff9bed2d79d60', clientName: 'rogelio', boxShopping: Array(5), total: '36.71'}

        const iDCart = box.iDCart;
        const clientName = box.clientName;
        const boxShopping = box.boxShopping; //array :  {depart: 'items', id: '68aa1e4be584597f2050cb56', title: 'Queso Semiduro', price: '4.8', countRequest: 1}
        const total = box.total;

        console.log("iDCart :", box.iDCart);

        let date = new Date();
        let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
        let hora = date.getHours(); let minu = date.getMinutes();

        let mesFormatted = String(mes).padStart(2, '0');
        let minuFormatted = String(minu).padStart(2, '0');
        const timeNow = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

        //console.log("timeNow :", timeNow);

        //Primero ubicamos el carrito.
        const searchShoppingCart = await modelShoppingCart.findById(iDCart);

        //console.log("Esto es searchShoppingCart :", searchShoppingCart);
        //IMPORTANTE evaluar que exista informacion de searchShoppingCart
        if (searchShoppingCart) {

            const cartId = searchShoppingCart.cartId; //identificador de carrito para poder eliminar el mensaje shoppingCart-Cre
            const customerId = searchShoppingCart.customerId;
            const customerName = searchShoppingCart.customerName;
            const sellerId = searchShoppingCart.sellerId;
            const sellerName = searchShoppingCart.sellerName;

            //busco en el perfil del vendedor el avatar 
            const searchProfileSeller = await modelProfile.findOne({ indexed : sellerId });
            //console.log("searchProfileSeller....:", searchProfileSeller);

            const sellerUsername = searchProfileSeller.username;
            const avatar = searchProfileSeller.avatarPerfil[0].url; const avatarDefault = searchProfileSeller.mailhash;
            //console.log("Este es el avatar :", avatar);
            //console.log("Este es el avatarDefault :", avatarDefault);

            const searchUserClient = await modelUser.findById(customerId);
            const chatId = searchUserClient.blissBot.chatId

            //console.log("searchUserClient..............:", searchUserClient);
            console.log("chatId..............:", chatId);


            async function Notification(){

                //eliminamos el mensaje de shoppingCart-Con, para mantener el inbox limpio de mensajes innesarios
                //await modelMessage.deleteOne({ typeNote: 'shoppingCart-Con', cartId: cartId });

                //eliminamos el mensaje shoppingCart-RPay. De esta manera limpiamos el inbox del la tienda, que decia ¡Hola! usuario notifica que ha registrado un pago, verifica y procesa su pago. Ir a la Administración de carritos.
                await modelMessage.deleteOne({ typeNote: 'shoppingCart-RPay', cartId: cartId });

                //enviar mensaje de que su pedido ha sido consolidado
                const newNotification = new modelMessage( { typeNote: 'shoppingCart-unPaid',
                                                            cartId,
                                                            times: timeNow,
                                                            objeAvatar : {avatar, avatarDefault},
                                                            username: sellerUsername,
                                                            question: `¡Hola! ${sellerUsername} lamentamos notificar que su pago no ha podido ser validado. Si ya lo ha realizado por favor registre nuevamente el pago, coloque el método y el detalle que identifique su confirmación.`,
                                                            toCreatedArticleId : customerId, //el id de la cuenta donde debe llegar la notificacion
                                                            answer: 'waiting',
                                                            view: false } );
                console.log("newNotification ------>", newNotification);

                const saveMessage = await newNotification.save();
                console.log("se ha creado la notificacion de consolidación del carrito");
            }

            async function blissBotNoti(){ //esta funcion es para enviar un Telegrama al comprador. Que debe ser avisado de inmediato.
                console.log("Estamos dentro de la funcion blissBotNoti() ---------------------------->");

                const Message = `Notificación de Blissenet.com: Shopping Cart\n\n¡Hola! ${sellerUsername} lamentamos notificar que su pago no ha podido ser validado. Entre a Blissenet.com y en Notificaciones tendrás el enlace para ver el status de tu compra.`;
                console.log("chatId --->", chatId);          

                axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                    chat_id: chatId,
                    text: Message,
                })
                .then(response => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.log('Mensaje enviado con éxito:', response.data);
                })
                .catch(error => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.error('Error al enviar el mensaje:', error.response.data);
                });
        
            }


            async function doneShoppingcart() {
                //debemos actualizar el ultimo elemento del array dataRegPay, el campo response. 
                const shoppingCart = await modelShoppingCart.findById(iDCart);
                if (shoppingCart && shoppingCart.dataRegPay.length > 0) {
                    const lastIndex = shoppingCart.dataRegPay.length - 1; // Índice del último elemento
                    await modelShoppingCart.findByIdAndUpdate(
                        iDCart,
                        {  
                            $set: { [`dataRegPay.${lastIndex}.response`]: "error" } // Usando $set para actualizar el campo response del último elemento
                        },
                        { new: true }
                    );
                } else {
                    await modelShoppingCart.findByIdAndUpdate(
                        iDCart,
                        {  
                            $set: { [`dataRegPay.0.response`]: "error" } // Usando $set para actualizar el campo response del primer elemento
                        },
                        { new: true }
                    );
                }
            }            

 

            Notification()
                .then(()=>{

                    if (chatId){

                        blissBotNoti()
                            .then(()=>{
                                doneShoppingcart()
                                    .then(()=>{
                                        const message = "Pago declinado y notificado a su cliente.";
                                        const response = { "code" : "ok", "message" : message};
                                        res.json(response);
                                    })
                                    .catch(error => {
                                        console.error('Error al ejecutar la funcion doneShoppingcart', error);
                                    });
                            })
                            .catch(error => {
                                console.error('Error al ejecutar la funcion blissBotNoti', error);
                            });

                    } else {

                        doneShoppingcart()
                            .then(()=>{
                                const message = "Pedido declinado y notificado a su cliente.";
                                const response = { "code" : "ok", "message" : message};
                                res.json(response);
                            })
                            .catch(error => {
                                console.error('Error al ejecutar la funcion doneShoppingcart', error);
                            });

                    }
                })
                .catch(error => {
                    console.error('Error al ejecutar la funcion Notification()....', error);
                });
         

        } else {
            console.log("No existe el carrito que se quiere consolidar");
        }        


    } catch (error) {
        console.log("error :", error);
    }

});


routes.post('/done_shoppingCart/registerSent', async(req, res)=>{
//aqui se registra que el pedido esta listo para ser entregado
    try {

        console.log("......../done_shoppingCart/registerSent..........");
        console.log("req.boy................ :", req.body);
        const { box, sentDetails } = req.body;

        //{iDCart: '68b9e3497d4ff9bed2d79d60', clientName: 'rogelio', boxShopping: Array(5), total: '36.71'}

        const iDCart = box.iDCart;
        const clientName = box.clientName;
        const boxShopping = box.boxShopping; //array :  {depart: 'items', id: '68aa1e4be584597f2050cb56', title: 'Queso Semiduro', price: '4.8', countRequest: 1}
        const total = box.total;

        console.log("iDCart :", box.iDCart);

        let date = new Date();
        let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
        let hora = date.getHours(); let minu = date.getMinutes();

        let mesFormatted = String(mes).padStart(2, '0');
        let minuFormatted = String(minu).padStart(2, '0');
        const timeNow = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

        //console.log("timeNow :", timeNow);

        //Primero ubicamos el carrito.
        const searchShoppingCart = await modelShoppingCart.findById(iDCart);

        //console.log("Esto es searchShoppingCart :", searchShoppingCart);
        //IMPORTANTE evaluar que exista informacion de searchShoppingCart
        if (searchShoppingCart) {

            const cartId = searchShoppingCart.cartId; //identificador de carrito para poder eliminar el mensaje shoppingCart-Cre
            const customerId = searchShoppingCart.customerId;
            const customerName = searchShoppingCart.customerName;
            const sellerId = searchShoppingCart.sellerId;
            const sellerName = searchShoppingCart.sellerName;

            //busco en el perfil del vendedor el avatar 
            const searchProfileSeller = await modelProfile.findOne({ indexed : sellerId });
            //console.log("searchProfileSeller....:", searchProfileSeller);

            const sellerUsername = searchProfileSeller.username;
            const avatar = searchProfileSeller.avatarPerfil[0].url; const avatarDefault = searchProfileSeller.mailhash;
            //console.log("Este es el avatar :", avatar);
            //console.log("Este es el avatarDefault :", avatarDefault);

            const searchUserClient = await modelUser.findById(customerId);
            const chatId = searchUserClient.blissBot.chatId

            //console.log("searchUserClient..............:", searchUserClient);
            console.log("chatId..............:", chatId);


            async function Notification(){

                //eliminamos el mensaje de shoppingCart-Con, para mantener el inbox limpio de mensajes innesarios
                //await modelMessage.deleteOne({ typeNote: 'shoppingCart-Con', cartId: cartId });
                //await modelMessage.deleteOne({ typeNote: 'shoppingCart-RPay', cartId: cartId });
                //eliminamos el mensaje shoppingCart-RPay. De esta manera limpiamos el inbox del la tienda, que decia ¡Hola! usuario notifica que ha registrado un pago, verifica y procesa su pago. Ir a la Administración de carritos.
                

                //enviar mensaje de que su pedido ha sido consolidado
                const newNotification = new modelMessage( { typeNote: 'shoppingCart-Sent',
                                                            cartId,
                                                            times: timeNow,
                                                            objeAvatar : {avatar, avatarDefault},
                                                            username: sellerUsername,
                                                            question: `¡Atención! ${sellerUsername} notifica que su pedido esta listo para su entrega.`,
                                                            toCreatedArticleId : customerId, //el id de la cuenta donde debe llegar la notificacion
                                                            answer: 'waiting',
                                                            view: false } );
                console.log("newNotification ------>", newNotification);

                const saveMessage = await newNotification.save();
                console.log("se ha creado la notificacion de consolidación del carrito");
            }

            async function blissBotNoti(){ //esta funcion es para enviar un Telegrama al comprador. Que debe ser avisado de inmediato.
                console.log("Estamos dentro de la funcion blissBotNoti() ---------------------------->");

                const Message = `Notificación de Blissenet.com: Shopping Cart\n\n¡Atención! ${sellerUsername} notifica que su pedido esta listo para su entrega. Entre a Blissenet.com y en Notificaciones tendrás el enlace para ver el status de tu compra.`;
                console.log("chatId --->", chatId);          

                axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                    chat_id: chatId,
                    text: Message,
                })
                .then(response => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.log('Mensaje enviado con éxito:', response.data);
                })
                .catch(error => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.error('Error al enviar el mensaje:', error.response.data);
                });
        
            }


            async function updateShoppingcart() {
                //debemos actualizar el ultimo elemento del array dataRegPay, el campo response.             
                await modelShoppingCart.findByIdAndUpdate(
                    iDCart, { $set: { 'sent.sentStatus': "true", 'sent.sentDetails': sentDetails} },{ new: true }
                );
           
            }            

    
            updateShoppingcart()
                .then(()=>{
                    Notification()
                        .then(()=>{

                            if (chatId){

                                blissBotNoti()
                                    .then(()=>{

                                        const message = "Padido listo para su entrega y notificado a su cliente.";
                                        const response = { "code" : "ok", "message" : message};
                                        res.json(response);
                                    
                                    })
                                    .catch(error => {
                                        console.error('Error al ejecutar la funcion blissBotNoti', error);
                                    });

                            } else {

                                const message = "Padido listo para su entrega y notificado a su cliente.";
                                const response = { "code" : "ok", "message" : message};
                                res.json(response);

                            }
                        })
                        .catch(error => {
                            console.error('Error al ejecutar la funcion Notification()....', error);
                        });
                        
                })
                .catch(err =>{

                })

       

        } else {
            console.log("No existe el carrito que se quiere consolidar");
        }        


    } catch (error) {
        console.log("error :", error);
    }

});

routes.post('/done_shoppingCart/registerReceived', async(req, res)=>{
//aqui se registra que el pedido que ya se ha recibido
    try {

        console.log("......../done_shoppingCart/registerReceiver..........");
        console.log("req.boy................ :", req.body);
        const { IDCart } = req.body;

        //{iDCart: '68b9e3497d4ff9bed2d79d60'}

        console.log("IDCart :", IDCart);

        let date = new Date();
        let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
        let hora = date.getHours(); let minu = date.getMinutes();

        let mesFormatted = String(mes).padStart(2, '0');
        let minuFormatted = String(minu).padStart(2, '0');
        const timeNow = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

        //console.log("timeNow :", timeNow);

        //Primero ubicamos el carrito.
        const searchShoppingCart = await modelShoppingCart.findById(IDCart);

        //console.log("Esto es searchShoppingCart :", searchShoppingCart);
        //IMPORTANTE evaluar que exista informacion de searchShoppingCart
        if (searchShoppingCart) {

            const cartId = searchShoppingCart.cartId; //identificador de carrito para poder eliminar el mensaje shoppingCart-Cre
            const customerId = searchShoppingCart.customerId;
            const customerName = searchShoppingCart.customerName;
            const sellerId = searchShoppingCart.sellerId;
            const sellerName = searchShoppingCart.sellerName;

            //busco en el perfil del comprador el avatar 
            const searchProfileCustomer = await modelProfile.findOne({ indexed : customerId });
            //console.log("searchProfileCustomer....:", searchProfileCustomer);

            const customerUsername = searchProfileCustomer.username;
            const avatar = searchProfileCustomer.avatarPerfil[0].url; const avatarDefault = searchProfileCustomer.mailhash;
            //console.log("Este es el avatar :", avatar);
            //console.log("Este es el avatarDefault :", avatarDefault);

            const searchUserSeller = await modelUser.findById(sellerId);
            const chatId = searchUserSeller.blissBot.chatId

            //console.log("searchUserClient..............:", searchUserClient);
            console.log("chatId..............:", chatId);


            async function Notification(){

                //eliminamos el mensaje de shoppingCart-Con, para mantener el inbox limpio de mensajes innesarios
                //await modelMessage.deleteOne({ typeNote: 'shoppingCart-Con', cartId: cartId });
                await modelMessage.deleteOne({ typeNote: 'shoppingCart-Sent', cartId: cartId });
                //eliminamos el mensaje shoppingCart-RPay. De esta manera limpiamos el inbox del la tienda, que decia ¡Hola! usuario notifica que ha registrado un pago, verifica y procesa su pago. Ir a la Administración de carritos.
                

                //enviar mensaje de que su pedido ha sido consolidado
                const newNotification = new modelMessage( { typeNote: 'shoppingCart-Received',
                                                            cartId,
                                                            times: timeNow,
                                                            objeAvatar : {avatar, avatarDefault},
                                                            username: customerName,
                                                            question: `¡Bien hecho! ${customerName} notifica que ha recibido su pedido.`,
                                                            toCreatedArticleId : sellerId, //el id de la cuenta donde debe llegar la notificacion
                                                            answer: 'waiting',
                                                            view: false } );
                console.log("newNotification ------>", newNotification);

                const saveMessage = await newNotification.save();
                console.log("se ha creado la notificacion de consolidación del carrito");
            }

            async function blissBotNoti(){ //esta funcion es para enviar un Telegrama al comprador. Que debe ser avisado de inmediato.
                console.log("Estamos dentro de la funcion blissBotNoti() ---------------------------->");

                const Message = `Notificación de Blissenet.com: Shopping Cart\n\n¡Bien hecho! ${customerName} notifica que ha recibido su pedido.. Entre a Blissenet.com y califica a tu comprador.`;
                console.log("chatId --->", chatId);          

                axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                    chat_id: chatId,
                    text: Message,
                })
                .then(response => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.log('Mensaje enviado con éxito:', response.data);
                })
                .catch(error => {
                    console.log('--------------------------- BlissBot----------------------------');
                    console.error('Error al enviar el mensaje:', error.response.data);
                });
        
            }


            async function updateShoppingcart() {
                //debemos actualizar el ultimo elemento del array dataRegPay, el campo response.             
                await modelShoppingCart.findByIdAndUpdate(
                    IDCart, { $set: { received : "true" } },{ new: true }
                );
           
            }            

    
            updateShoppingcart()
                .then(()=>{
                    Notification()
                        .then(()=>{

                            if (chatId){

                                blissBotNoti()
                                    .then(()=>{

                                        const message = "Gracias por registrar la recepción de su pedido.";
                                        const response = { "code" : "ok", "message" : message};
                                        res.json(response);
                                    
                                    })
                                    .catch(error => {
                                        console.error('Error al ejecutar la funcion blissBotNoti', error);
                                    });

                            } else {

                                const message = "Gracias por registrar la recepción de su pedido.";
                                const response = { "code" : "ok", "message" : message};
                                res.json(response);

                            }
                        })
                        .catch(error => {
                            console.error('Error al ejecutar la funcion Notification()....', error);
                        });
                        
                })
                .catch(err =>{

                })

       

        } else {
            console.log("No existe el carrito que se quiere actualizar como recibido");
        }        


    } catch (error) {
        console.log("error :", error);
    }

});

routes.post('/done_shoppingCart/registerCommentRatingToSell', async(req, res)=>{
//aqui se registra el comentario y calificacion al vendedor
    try {

        console.log("......../done_shoppingCart/registerCommentRatingToSell..........");
        console.log("req.boy................ :", req.body);
        const { IDCart, comment, rating } = req.body;

        const user = req.session.user;
        const idUser = user._id
        //IDCart: '68c49d90f345c0e54fb621ae',
        //comment: 'Excelente servicio, lo recomiendo ampliamente a toda la comunidad de blissenet.com',
        //rating: '5'

        console.log("IDCart :", IDCart);
        console.log("user :", user);
        console.log("idUser :", idUser);

        let date = new Date();
        let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
        let hora = date.getHours(); let minu = date.getMinutes();

        let mesFormatted = String(mes).padStart(2, '0');
        let minuFormatted = String(minu).padStart(2, '0');
        const timeNow = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

        //console.log("timeNow :", timeNow);

        //Primero ubicamos el carrito.
        const searchShoppingCart = await modelShoppingCart.findById(IDCart);

        console.log("Esto es searchShoppingCart :", searchShoppingCart);
        //IMPORTANTE evaluar que exista informacion de searchShoppingCart

        //aqui buscamos el perfil del cliente que dejara el comentaio y calificacion de la tienda.
        const searchProfile = await modelProfile.findById()
         
        if (searchShoppingCart) {

            const cartId = searchShoppingCart.cartId; //identificador de carrito para poder eliminar el mensaje shoppingCart-Cre
            const customerId = searchShoppingCart.customerId;
            const customerName = searchShoppingCart.customerName;
            const sellerId = searchShoppingCart.sellerId;
            const sellerName = searchShoppingCart.sellerName;

            //aqui buscamos el perfil del cliente que dejara el comentaio y calificacion de la tienda.
            const searchProfile = await modelProfile.findOne( {indexed : customerId} );
            console.log("VER searchProfile ..........:", searchProfile);
            //avatarPerfil: [ { url: '', public_id: 'sin_data' } ]

            const avatarPerfil = searchProfile.avatarPerfil; //esto es un array;
            const url = avatarPerfil[0].url; const public_id = avatarPerfil[0].public_id;
            const mailhash = searchProfile.mailhash;

            if (customerId == idUser){

                //aseguramos que el es el clinte de este carrito.
                updateShoppingcart()
                    .then(()=>{
                        storeRateComent()
                            .then(()=>{
                                const message = "Gracias por el comentario y la calificación";
                                const response = { "code" : "ok", "message" : message};
                                res.json(response);
                            })
                            .catch(error =>{
                                 console.error('Error al ejecutar la funcion storeRateComent', error);
                            })

                                        
                    })
                    .catch(error => {
                        console.error('Error al ejecutar la funcion updateShoppingcart', error);
                    });


            } else {
                //no es el cliente de este carrito.
                const message = "No es posbible dejar comentrio ni calificación a esta compra.";
                const response = { "code" : "err", "message" : message};
                res.json(response);

            }

            
            async function updateShoppingcart() {
                //debemos actualizar el ultimo elemento del array dataRegPay, el campo response. 
                await modelMessage.deleteMany({ typeNote: 'shoppingCart-Received', cartId: cartId });
                await modelMessage.deleteMany({ typeNote: 'shoppingCart-Paid', cartId: cartId });

                await modelShoppingCart.findByIdAndUpdate(
                    IDCart, { $set: { CommentSeller: comment, ratingSeller: rating  } },{ new: true }
                );
           
            }            

            async function storeRateComent() {
                //aqui vamos a guardar los datos necesarios para tener los comentarios y estrellas en un solo lugar.
                
                const newRateComment =  new modelStoreRate
                 ({ 
                    store: sellerId, logeado: customerId, markStar: rating, comment: comment, storeName: sellerName,
                    dataLogeado: { username: customerName, avatarPerfil: [ { "url" : url, "public_id" : public_id } ], mailhash: mailhash }
                 });

                const saveRateComment = await newRateComment.save();
                console.log("Se ha creado la primera calificacion y comentario organico de blissenet.com", saveRateComment)
       
            }    

        } else {
            console.log("No existe el carrito que se quiere actualizar como recibido");
        }        
 

    } catch (error) {
        console.log("error :", error);
    }

});

routes.post('/done_shoppingCart/registerCommentRatingToBuy', async(req, res)=>{
//aqui se registra el comentario y la calificacion al comprador.
    try {

        console.log("......../done_shoppingCart/registerCommentRatingToBuy..........");
        console.log("req.boy................ :", req.body);
        const { IDCart, comment, rating } = req.body;

        const user = req.session.user;
        const idUser = user._id
        //IDCart: '68c49d90f345c0e54fb621ae',
        //comment: 'Excelente servicio, lo recomiendo ampliamente a toda la comunidad de blissenet.com',
        //rating: '5'

        console.log("IDCart :", IDCart);
        console.log("user :", user);
        console.log("idUser :", idUser);

        let date = new Date();
        let dia = date.getDate(); let mes = date.getMonth() + 1; let anio = date.getFullYear();
        let hora = date.getHours(); let minu = date.getMinutes();

        let mesFormatted = String(mes).padStart(2, '0');
        let minuFormatted = String(minu).padStart(2, '0');
        const timeNow = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

        //console.log("timeNow :", timeNow);

        //Primero ubicamos el carrito.
        const searchShoppingCart = await modelShoppingCart.findById(IDCart);

        console.log("Esto es searchShoppingCart :", searchShoppingCart);
        //IMPORTANTE evaluar que exista informacion de searchShoppingCart
         
        if (searchShoppingCart) {

            const cartId = searchShoppingCart.cartId; //identificador de carrito para poder eliminar el mensaje shoppingCart-Cre
            const customerId = searchShoppingCart.customerId;
            const customerName = searchShoppingCart.customerName;
            const sellerId = searchShoppingCart.sellerId;
            const sellerName = searchShoppingCart.sellerName;

            //aqui buscamos el perfil de la tienda que dejara el comentaio y calificacion a su cliente.
            const searchProfile = await modelProfile.findOne( {indexed : sellerId} );
            console.log("VER searchProfile ..........:", searchProfile);
            //avatarPerfil: [ { url: '', public_id: 'sin_data' } ]

            const avatarPerfil = searchProfile.avatarPerfil; //esto es un array;
            const url = avatarPerfil[0].url; const public_id = avatarPerfil[0].public_id;
            const mailhash = searchProfile.mailhash;            


            if (sellerId == idUser){

                //aseguramos que el es la tienda que vende este carrito.
                updateShoppingcart()
                    .then(()=>{
                        storeRateComent()
                            .then(()=>{
                                const message = "Gracias por el comentario y la calificación";
                                const response = { "code" : "ok", "message" : message};
                                res.json(response);
                            })
                            .catch(error =>{
                                 console.error('Error al ejecutar la funcion storeRateComent', error);
                            })

                                        
                    })
                    .catch(error => {
                        console.error('Error al ejecutar la funcion updateShoppingcart', error);
                    });


            } else {
                //no es el cliente de este carrito.
                const message = "No es posbible dejar comentrio ni calificación a esta compra.";
                const response = { "code" : "err", "message" : message};
                res.json(response);

            }

            
            async function updateShoppingcart() {
                //debemos actualizar el ultimo elemento del array dataRegPay, el campo response. 
                await modelMessage.deleteMany({ typeNote: 'shoppingCart-Received', cartId: cartId });
                await modelMessage.deleteMany({ typeNote: 'shoppingCart-Paid', cartId: cartId });

                await modelShoppingCart.findByIdAndUpdate(
                    IDCart, { $set: { CommentBuy: comment, ratingBuy: rating  } },{ new: true }
                );
           
            }            
    
            async function storeRateComent() {
                //aqui vamos a guardar los datos necesarios para tener los comentarios y estrellas en un solo lugar.
                
                const newRateComment =  new modelStoreRate
                 ({ 
                    store: customerId, logeado: sellerId, markStar: rating, comment: comment, storeName: customerName,
                    dataLogeado: { username: sellerName, avatarPerfil: [ { "url" : url, "public_id" : public_id } ], mailhash: mailhash }
                 });

                const saveRateComment = await newRateComment.save();
                console.log("Se ha creado la primera calificacion y comentario organico de blissenet.com", saveRateComment)
       
            }               


       

        } else {
            console.log("No existe el carrito que se quiere actualizar como recibido");
        }        
 

    } catch (error) {
        console.log("error :", error);
    }

});

//Sección de manejo de Raffles --------------------------------------------
routes.get('/raffleModule-admin/:id', async(req, res)=>{

    const idRaffle = req.params.id;
    //console.log("Este es el id del sorteo", idRaffle);
    //siempre será un solo sorteo por cuenta

    const user = req.session.user;
    //console.log("user ->", user);
    
    const countMessages = req.session.countMessages; //contador de mensajes
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //contador de alertas de negociación.
    let searchProfile, username, boxTickets;

    if (user){
        //console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        username = user.username;
        //console.log("Aqui el profile de la cuenta del visitante -->", searchProfile);
    }

    const search = await modelRaffle.findById(idRaffle);

    if (search){ //si existe el sorteo renderiza la admisnitracion del sorteo en la tienda
        boxTickets = search.boxTickets;
        res.render('page/account-raffle', {user, countMessages, countNegotiationsBuySell, searchProfile, search, boxTickets});
    } else { //No existe entonces lo envia a su cuenta.
        
        res.redirect(`/account/${username}`);
    }    
    
    //console.log('boxTickets :', boxTickets);


    
});


// Sección de Difusión de un articulo a los seguidores de una cuenta
routes.post('/account/spread', async (req, res)=>{
    const User = req.session.user;
    //console.log(User);
    const userId = User._id;
    const username = User.username;
    //console.log("------- /account/spread -------")
    //console.log(req.body);
    const { depart, title, titleId } = req.body;
    const Note = `${username} te invita a que veas su nuevo anuncio publicado.`;
    let avatar; let avatarDefault;
    let imageFirst; //aqui guardamos la imagen que vamos a pasar por el BlissBot y les llegue a telegram. 

    console.log("*******variables*******");
    console.log("userId", userId);
    console.log("username", username);
    console.log("depart", depart);
    console.log("title", title); 
    console.log("titleId", titleId);

    const date = new Date();
    let dia = date.getDate(); let mes = date.getMonth() +1; let anio = date.getFullYear();
    let hora = date.getHours(); let minu = date.getMinutes();

    let mesFormatted = String(mes).padStart(2, '0');
    let minuFormatted = String(minu).padStart(2, '0');
    const dateSend = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

    function transformarTitle(title) {
        return title
            .normalize("NFD") // Elimina acentos
            .replace(/[\u0300-\u036f]/g, "") // Elimina caracteres de acento
            .toLowerCase() // Convierte a minúsculas
            .replace(/\s+/g, '-') // Reemplaza espacios por guiones
            .replace(/[^\w\-]+/g, '') // Elimina caracteres no alfanuméricos excepto guiones
            .replace(/\-\-+/g, '-') // Reemplaza múltiples guiones por uno solo
            .trim(); // Elimina guiones al inicio y al final
    }
    
    const titleURL = transformarTitle(title);
    console.log(titleURL); // "hoverboard-blue-tooth-250w"
    
    // avatarPerfil, mailhash
    //Aqui buscamos el avatar de la tienda que esta difundiendo el anuncio.
    const searhAvatar = await modelProfile.find({ indexed : userId }, {'_id' : 0, 'avatarPerfil' : 1, 'mailhash' : 1 } );
    //console.log("searhAvatar", searhAvatar);
    avatarDefault = searhAvatar[0].mailhash
    const Avatar = searhAvatar[0].avatarPerfil;
    if (Avatar.length !==0){
        avatar = Avatar[0].url;
    }

    const objAvatar = { "avatar" : avatar, "avatarDefault" : avatarDefault };
    //console.log("objAvatar", objAvatar); 

    //Aqui escaneamos en toda la DB cuales usuarios siguen a esta tienda
    const searchToFollowMe = await modelProfile.find({ indexed : userId } );
    const FollowMe = searchToFollowMe[0].followMe; //esto es un array de id de users 
    console.log("FollowMe ----------->", FollowMe);
    const count = FollowMe.length;
    //console.log("esto es FollowMe", FollowMe); //esto es un array donde estan todas las cuentas que me siguen.
    //console.log("seguiendo esta cuenta", count);


    async function sendingSpread(){

        try {
            
            for (let i = 0; i < FollowMe.length; i++) {
                const indexed = FollowMe[i] //un id de usuario que deseo enviar el mensaje;
                
                const searchReceive = await modelProfile.find({indexed});
                console.log("usernameReceive", searchReceive[0].username);
                const usernameReceive = searchReceive[0].username;

                //enviamo el mensaje a este usuario
                const newMessage = new modelMessage( { typeNote: "spread", times: dateSend, username, question : Note, toCreatedArticleId: indexed,  ownerStore: usernameReceive, depart, titleArticle: title, titleURL, productId : titleId, objeAvatar : objAvatar } );
                console.log("newMessage :", newMessage);
                const saveMessage = await newMessage.save();
            }

        } catch (error) {
            console.log("Este es el error en sendingSpread() :", error);
        }    

    }

   
    async function spreadDone(){
        //especificamos cual depart estamos trabajando y al conseguirlo cambiamos el campo "spread" a true.
        // titleId, depart
        if (depart === "arts"){
            const update =  await modelArtes.findByIdAndUpdate(titleId, { $set: { "spread.spreading" : true, "spread.time": date } },{ new: true } ); // Esta opción devuelve el documento actualizado );
            imageFirst = update.images[0].url;
            console.log("imageFirst en spreadDone functon ---->", imageFirst);
        } else if (depart === "automotive"){
            const update =  await modelAutomotive.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }}, { new: true } );
            imageFirst = update.images[0].url;
            console.log("imageFirst en spreadDone functon ---->", imageFirst);
        } else if (depart === "airplanes"){
            const update =  await modelAirplane.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }}, { new: true } );
            imageFirst = update.images[0].url;
            console.log("imageFirst en spreadDone functon ---->", imageFirst);
        } else if (depart === "auctions"){    
            const update =  await modelAuction.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }}, { new: true } );
            imageFirst = update.images[0].url;
        } else if (depart === "items"){
            const update =  await modelItems.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }}, { new: true } );
            imageFirst = update.images[0].url;
            console.log("imageFirst en spreadDone functon ---->", imageFirst);
        } else if (depart === "nautical"){
            const update =  await modelNautical.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }}, { new: true } );
            imageFirst = update.images[0].url;
            console.log("imageFirst en spreadDone functon ---->", imageFirst);
        } else if (depart === "service"){
            const update =  await modelService.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }}, { new: true } );
            imageFirst = update.images[0].url;
            console.log("imageFirst en spreadDone functon ---->", imageFirst);
        } else if (depart === "raffle"){
            const update =  await modelRaffle.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }}, { new: true } );
            imageFirst = update.images[0].url;
            console.log("imageFirst en spreadDone functon ---->", imageFirst);
        } else if (depart === "realstate"){
            const update =  await modelRealstate.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }}, { new: true } );
            imageFirst = update.images[0].url;
            console.log("imageFirst en spreadDone functon ---->", imageFirst);
        }

    }    

        //primer version funcional
 /*    async function blissBotNoti(){  
        console.log("imageFirst en blissBotNoti function ---->", imageFirst);
        console.log("Note en blissBotNoti function ---->", Note);  
        //imaginate luzia que FollowMe es un array con 2000 datos... esto puede ocurrir que perdamos la API de Telegram, Es necesario limitarlo a 100 nada mas.
        //pero no todos los usuariuos que estan en FollowMe tienen chatId asi que lo que pienso es usar un contador si tiene chatId entonces chat ++ asumiendo que chat inicia en 0
        //y cuando el contador llega a 99 se detiene la funcion blissBoNoti(). que te parece la idea

        let messageCount = 0; // Inicializa el contador

        const promises = FollowMe.map(async (indexed) => {
            try {
                const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(indexed));
                //index siempre existira y es un string que lo uso para ubicar el user en modelUser
    
                const chatId = searchUserStore.blissBot.chatId;
                console.log("chatId ---->", chatId);

                if (chatId){
                   
                    const response = await axios.post(`https://api.telegram.org/bot${Token}/sendPhoto`, {
                        chat_id: chatId,
                        photo: imageFirst,
                        caption: `Notificación de Blissenet.com: Spread\n\n ${Note}`
                    });
                    console.log('--------------------------- BlissBot----------------------------');
                    console.log('Mensaje enviado con éxito:', response.data);

                }

            } catch (error) {
                console.log('--------------------------- BlissBot----------------------------');
                console.error('Error al enviar el mensaje:', error.response ? error.response.data : error.message);
            }
        });
    
        await Promise.all(promises);
    }
     */

    //segunda version funcional
    //esta es la nueva version con el contador para cuidar no exceder las politicas de Telegram
    async function blissBotNoti() {
        console.log("imageFirst en blissBotNoti function ---->", imageFirst);
        console.log("Note en blissBotNoti function ---->", Note);  
        console.log("title en blissBotNoti function ----->", title);
        
        let messageCount = 0; // Inicializa el contador
    
        // Verifica si ya se enviaron 100 mensajes antes de comenzar
        if (messageCount >= 99) return; 
    
        const promises = FollowMe.map(async (indexed) => {
            if (messageCount >= 99) return; // Detiene si se ha enviado 100 mensajes
    
            try {
                const searchUserStore = await modelUser.findById(new mongoose.Types.ObjectId(indexed));
                const chatId = searchUserStore.blissBot.chatId;
                console.log("chatId ---->", chatId);
    
                if (chatId) {
                    const response = await axios.post(`https://api.telegram.org/bot${Token}/sendPhoto`, {
                        chat_id: chatId,
                        photo: imageFirst,
                        caption: `Notificación de Blissenet.com: Spread\n\n ${Note} "${title}"`
                    })
    
                    console.log('--------------------------- BlissBot----------------------------');
                    console.log('Mensaje enviado con éxito:', response.data);
    
                    messageCount++; // Incrementa el contador solo si se envió exitosamente
                }
    
            } catch (error) {
                console.log('--------------------------- BlissBot----------------------------');
                console.error('Error al enviar el mensaje:', error );
            }
        });
    
        await Promise.all(promises);
    }    

    async function ejecutarFunciones() {
        try {
            console.log("Iniciando sendingSpread...");
            await sendingSpread();
            console.log("sendingSpread ejecutado correctamente.");
    
            console.log("Iniciando spreadDone...");
            await spreadDone();
            console.log("spreadDone ejecutado correctamente.");
    
            console.log("Iniciando blissBotNoti...");
            await blissBotNoti();
            console.log("blissBotNoti ejecutado correctamente.");

            res.json({ "response": "Se ha enviado el mensaje a todos nuestros seguidores.", "type": "success", "followMe": count });
        } catch (error) {
            const errorMessage = error.message || "Ha habido un error, intente luego.";
            res.json({ "response": errorMessage, "type": "error" });
        }
    }
    
    ejecutarFunciones()

});



routes.post('/account/pountRate', async(req, res)=>{
    //console.log("account/pountRate");
    //{ store : indexedStore }
    const {store} = req.body; // store es el indexed del profile pero tambien es un campo de la collecion rateStore.
    
    const rateStore = await modelStoreRate.find({store : store}).sort({updatedAt : -1});
    //console.log("Estamos haciendo una consulta a la DB para conseguir las calificacioens de esta tienda por su indexed --->");
    //console.log("rateStore :", rateStore);
    res.json(rateStore);
})



routes.post('/account/survey/search', async(req, res)=>{
    try {
        console.log("*----------------------- Consulta de Encuesta ----------------------------*");
        console.log("/account/survey/search");
        const { surveyId, indexed } = req.body; 
        
        const user = req.session.user;
        const indexedCustomer = user._id;

        console.log("indexedCustomer quien hace la encuesta --->", indexedCustomer);
        console.log("surveyId --->", surveyId);
        console.log("indexed dueño de tienda --->", indexed);

        const searchUser = await modelCustomerSurvey.findOne({ surveyId, indexedCustomer });

        if (searchUser){
            
            res.json({ code : 1 }) //1 es que existe una encuesta ya realizada.

        } else {

            res.json({ code : 0 }) //0 es que NO existe una encuesta realizada.

        }

    } catch (error) {
        
        res.json({ code : 2 }) //2 error al hacer la consulta.

    }
});

//aqui es donde llegan las encustas que hacen los clientes en las tiendas
routes.post('/account/survey', async(req, res)=>{
        
    try{
        console.log("*----------------------- Encuesta ----------------------------*");
        console.log("account/survey");
        const { surveyTitle, surveyId, surveyTime, surveyData, boxSurvey, indexed } = req.body;
        const surveyQuestion = []; //aqui guardamos todas las preguntas de la encuesta.

        const user = req.session.user;
        const indexedCustomer = user._id;

        console.log("indexedCustomer quien hace la encuesta --->", indexedCustomer);
        console.log("surveyTitle --->", surveyTitle);
        console.log("surveyId --->", surveyId); //es el id en fecha unix asi que sirvecomo id y como fecha tambien
        console.log("surveyTime --->", surveyTime);
        console.log("boxSurvey --->", boxSurvey); //esto es un array
        console.log("indexed dueño de tienda --->", indexed);

        console.log("surveyData --->", surveyData ) //esto es un array.
        surveyData.forEach(element => {
            const quest = element.question
            surveyQuestion.push(quest)
        });

        const searchUser = await modelCustomerSurvey.findOne({ surveyId, indexedCustomer });

        if (searchUser){
            console.log("usuario ya ha hecho la encuesta");
            res.json({ message : "Ya ha realizado la encuesta", code : 0 })
        } else {
            console.log("usuario no ha hecho la encuesta");

            const newSurvey = new modelCustomerSurvey( { surveyTitle, surveyId, surveyTime, indexed, indexedCustomer, surveyResponse : boxSurvey, surveyQuestion  } );
            newSurvey.save()
                .then(savedSurvey => {
                    console.log("Encuesta guardada con éxito:", savedSurvey);
                    res.json({ message : "Encuesta realizada satisfactoriamente", code : 1, data : savedSurvey }); // Envía la respuesta al cliente
                })
                .catch(error => {
                    console.error("Error al guardar la encuesta:", error);
                    res.status(500).json({ message: "Error al guardar la encuesta", code : 2 });
                });
        }


    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error al procesar la solicitud" });
    }


});

//aqui es donde consultamos todas las encuestas que hacen los clientes para enviar solo un id con su titulo de cada encuesta para poder crear un selector de opciones en el fronted
routes.post('/account/survey/analysis', async(req, res)=>{
        
    try{
        console.log("*----------------------- Analysis de Encuesta ----------------------------*");
        console.log("/account/survey/analysis");
        const { userID } = req.body;
        
        const searchSurvey = await modelCustomerSurvey.find({ indexed: userID });

        // Usamos un Set para almacenar los IDs únicos
        const uniqueSurveys = new Map();
        
        searchSurvey.forEach(ele => {
            const surveyId = ele.surveyId;
            const surveyTitle = ele.surveyTitle;
        
            // Si el surveyId no está en el Map, lo agregamos
            if (!uniqueSurveys.has(surveyId)) {
                uniqueSurveys.set(surveyId, surveyTitle);
            }
        });
        
        // Convertimos el Map a un Array de objetos
        const resultArray = Array.from(uniqueSurveys, ([surveyId, surveyTitle]) => ({
            surveyId,
            surveyTitle
        }));
        
        console.log("resultArray --> Lista de surveys únicos:", resultArray);

 
        if (resultArray){
            console.log("usuario tiene encuesta en su tienda");
            res.json({ resultArray })
        } else {
            console.log("usuario no tiene encuesta");
            res.json({ resultArray })
        }


    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error al procesar la solicitud" });
    }


});

//aqui si hacemos la consulta de una encuesta predeterminada.
routes.post('/account/survey/analysisData', async(req, res)=>{
    try {

        console.log("*----------------------- Extraccion de datos de Encuesta ----------------------------*");
        console.log("/account/survey/analysisData");
        const { surveyId } = req.body;

        const searchSurveyData = await modelCustomerSurvey.find({ surveyId });
        console.log("**************** searchSurveyData *************");
        console.log(searchSurveyData);

        res.json({ searchSurveyData });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error al procesar la solicitud" });
    }
})

routes.get('/cut', async (req,res)=>{

    res.render('page/cut');
         
});


//-------------- controlando las peticiones de BlissBot bot de Telegram
// aqui guardamos el username de telegram en la base de datos
routes.post('/acount/blissBot/userTelegram', async(req, res)=>{
    
    try {
        
        const { userTelegram } = req.body;
        console.log("-------------------------------------------------");
        console.log("Llegando a la ruta /acount/blissBot/userTelegram");
        console.log("userTelegram --->", userTelegram);
    
        const user = req.session.user;
        const userId = user._id;
        console.log("userId", userId)
        //userId : '66ab9dc1b8c25e5528f4ea9d'
    
        const searchUser = await modelUser.findById(userId);
    
        if (searchUser) {
            console.log("Usuario encontrado");

            //hacemos una nueva consulta... revisamos si este userTelegram lo tiene alguien mas en blissenet.
            const searchUserTelegram = await modelUser.findOne({'blissBot.userTelegram' : userTelegram });
            
            if (searchUserTelegram){
                console.log("Existe ese userTelegram ya y vamos a ver quien es");
                console.log("searchUserTelegram :", searchUserTelegram);
                const user = searchUserTelegram._id;

                if (user == userId){
                    //es el mismo usuario que porta este userTelegram, enviamos un code : 3  "Ya posee este userTegram en su registro"
                    const response = { code : 3 }
                    res.json(response);

                } else {
                    //otro usuario porta este userTelegram enviar un code : 2
                    const response = { code : 2 }
                    res.json(response);
                }


            } else {

                const updateUser = await modelUser.findByIdAndUpdate(userId,
                    { $set: { 'blissBot.userTelegram': userTelegram } }, { new: true });

                console.log("updateUser ------->", updateUser);    
                req.session.user = updateUser//actualizo el user
                
                const response = { code : 1 }
                res.json(response);
            }

                
            
        }     

    } catch (error) {
      console.log("ha habido un error en el envio del user de telegram", error)
      const response = { code : 0 }
      res.json(response);   
    }

});

// Endpoint para conectar usuarios de Blissenet con Telegram
routes.post(`/webhook/${Token}`, async(req, res) => {
    const update = req.body;
    console.log("....................Telegram ....................:");
    console.log("update de Telegram ....................:", update );
    
    // Verificar si es un mensaje y contiene el comando /start
    if (update.message && update.message.text === '/start') {
        const chatId = update.message.chat.id;
        const usernameTelegram = update.message.chat.username;

        // Aquí el chatId del usuario que esta interactuando con el BlissBot
        console.log(`Capturado chat_id: ${chatId}`);
        //Capturado chat_id: 1629241334
        
        // Aquí el username de telegram de este usuario que esta interactuando con el BlissBot
        console.log(`Capturado usernameTelegram: ${usernameTelegram}`);
        //Capturado usernameTelegram: orbigpzo

        const updateUser = await modelUser.findOneAndUpdate(
            { 'blissBot.userTelegram': usernameTelegram },
            { $set: { 'blissBot.chatId': chatId } },
            { new: true }
        );

        console.log("updateUser ------->", updateUser);    
        req.session.user = updateUser//actualizo el user
        
        const userBliss = updateUser.username;
        
        if (updateUser){

            // Enviar mensaje de bienvenida al usuario
            const Message = `¡Hola! ${userBliss} has sincronizado satistactoriamente con BlissBot, ahora podrás recibir todas las notificaciones en tu Telegram`;

            axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                chat_id: chatId,
                text: Message,
            })
            .then(response => {
                console.log('Mensaje enviado con éxito:', response.data);
                location.reload(); //esto refresca la pantalla y mostrará elmensaje de Conectado a BlissBot.
            })
            .catch(error => {
                console.error('Error al enviar el mensaje:', error);
            });

        } else {

            // Enviar mensaje de bienvenida al usuario
            const Message = '¡Hola! Has iniciado una conversación con BlissBot.';

            axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
                chat_id: chatId,
                text: Message,
            })
            .then(response => {
                console.log('Mensaje enviado con éxito:', response.data);
            })
            .catch(error => {
                console.error('Error al enviar el mensaje:', error);
            });

        }


    }

    // Responder a Telegram con un 200 OK
    res.sendStatus(200);
});

/* 

//ejemplo de mensaje mas imagen
axios.post(`https://api.telegram.org/bot${Token}/sendPhoto`, {
    chat_id: chatId,
    photo: fs.createReadStream(imagePath), // Usando fs para leer el archivo
    caption: message // El mensaje que quieres enviar junto a la imagen
})
    
//ejemplo de solo mensaje
axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
    chat_id: chatId,
    text: Message,
})
.then(response => {
    console.log('Mensaje enviado con éxito:', response.data);
})
.catch(error => {
    console.error('Error al enviar el mensaje:', error);
});

*/

module.exports = routes;


