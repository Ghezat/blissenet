const { Router } = require('express');
const hash = require('object-hash');
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
      

routes.get('/account/:account', async (req,res)=>{
    console.log("Este es el parametroooo ---->",req.params);
    const account  = req.params.account;
    console.log("este es el account a visitar o tienda",account)
    const boxPublisher = [];
    let newBox;
    const user = req.session.user;
    console.log("este es el usuario visitante--->", user);
    const countMessages = req.session.countMessages
    const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
    let searchProfile;

    //aqui obtengo la cantidad de negotiationsBuySell
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
    console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  

        
    if (user){
        //console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        //console.log("Aqui el profile de la cuenta", searchProfile);
    
        const Account = await modelUser.find({ username : account });
        //console.log("Este es la data del account que queremos visitar ...", Account);

        if (Account.length !== 0){// si la cuenta (user) a la que se quiere acceder existe (tendra una longitud diferente a 0, entonces ejecuta el bloque siguiente)

            const accountId = Account[0]._id; //esto es un array y dentro esta el objeto al que queremos acceder
            //console.log("Este es el id del account que queremos visitar ...", accountId);  

            const storeProfile = await modelProfile.find({ indexed : accountId });
            //console.log("Aqui el profile de la **Tienda** a visistar --->", storeProfile);


            let view = storeProfile[0].view; //aqui guardo la cantidad de visitas actuales que tiene la tienda;
            //console.log('aqui las vistas  view---->', view);
            let signature = (view + 1);     

            //sumaremos la visita del visitante. osea aqui firma que llego a esa tienda.ok genial no? 
            //pero solo si el visistante no es el mismo propietario de la tienda ojo con eso.
            if ( storeProfile[0].indexed !== user._id ){
            //console.log("Esto es el storeProfile--->",storeProfile[0].indexed);
            //console.log("Esto es el user._id---->",user._id);
            const firmaVisitante = await modelProfile.updateOne({ indexed : accountId },{ view : signature });
            //console.log("Aqui la firma del visitante ---->", firmaVisitante)
            }

            //aqui busco el id del sorteo. 
            const raffle = await modelRaffle.find({ user_id : accountId });
            //si tiene entonces lo incluyo en los objetos a enviar al front para anexarlo en el contenedor derecho alargado donde esta el Score y el trust 
            let raffle_Id;
    
            if (raffle.length !==0){
                raffle_Id = raffle[0]._id;

            } else {
                raffle_Id = undefined;
            }

            //----------------------------------------------

            if (storeProfile.length !== 0) { 
                const searchBanner = storeProfile[0].bannerPerfil;
        
                //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones. 
                const resultAirplane = await modelAirplane.find( { $and : [{user_id : accountId}, {visibleStore : true }]});
                const resultArtes = await modelArtes.find( { $and : [{user_id : accountId}, {visibleStore : true }]});
                const resultItems = await modelItems.find({ $and : [{user_id : accountId} , {visibleStore : true }]});
                const resultAutomotive = await modelAutomotive.find({ $and : [{user_id : accountId} , {visibleStore : true }]});
                const resultRealstate = await modelRealstate.find({ $and : [{user_id : accountId} , {visibleStore : true }]});
                const resultNautical = await modelNautical.find({ $and : [{user_id : accountId} , {visibleStore : true }]});
                const resultService = await modelService.find({ $and : [{user_id : accountId} , {visibleStore : true }]});
                const resultAuction = await modelAuction.find({ $and : [{user_id : accountId} , {visibleStore : true }]});
                const resultRaffle = await modelRaffle.find({ $and : [{user_id : accountId} , {visibleStore : true }]});

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
                const limit = 10; //establecer la cantidad  de elementos que se mostrarán
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

                    res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, raffle_Id});

                } else if (receive == "first"){

                    X = 0;//0
                    req.session.x = X;
                      
                    newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                     //        6    + 0  / 6 = 1 //aqui no hace falta el Math.ceil ya que siempre se dividira entre el mismo numero, siempre dara "1" 
                     pagina = (limit + X) / limit; //perfecto
                    //console.log("pagina :  ", pagina);
                    //console.log("totalPagina :  ", totalPagina);
                    const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                    res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, raffle_Id});

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

                        res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, raffle_Id});
           
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

                        res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, raffle_Id});
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


                res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, raffle_Id});

                }
                  

            } else {
                res.render('page/account', {searchBanner, user, storeProfile, searchProfile, Account, countMessages, countNegotiationsBuySell});
            }   
               
        } else {
            res.render('partials/error404');
        };
        

    } else {
        //console.log("No hay usuario visitante.")

        const Account = await modelUser.find({ username : account });
        //console.log("Este es la data del account que queremos visitar ...", Account);

        if (Account.length !== 0){// si la cuenta (user) a la que se quiere acceder existe (tendra una longitud diferente a 0, entonces ehecuta el bloque siguiente)


            const accountId = Account[0]._id; //esto es un array y dentro esta el objeto al que queremos acceder
            //console.log("Este es el id del account que queremos visitar ...", accountId);  

            const storeProfile = await modelProfile.find({ indexed : accountId });
            //console.log("Aqui el profile de la cuenta", storeProfile);

            let view = storeProfile[0].view; //aqui guardo la cantidad de visitas actuales que tiene la tienda;
            //console.log('aqui las vistas  view---->', view);
            let signature = (view + 1);     

            //sumaremos la visita del visitante. osea aqui firma que llego a esa tienda.ok genial no?

            const firmaVisitante = await modelProfile.updateOne({ indexed : accountId },{ view : signature });
            //console.log("Aqui la firma del visitante ---->", firmaVisitante)
            

            if (storeProfile.length !== 0) { 
                const searchBanner = storeProfile[0].bannerPerfil;
        
                //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones. 
                const resultAirplane = await modelAirplane.find({ $and : [{user_id : accountId}, {visibleStore : true }]});
                const resultArtes = await modelArtes.find({ $and : [{user_id : accountId}, {visibleStore : true }]});
                const resultItems = await modelItems.find({ $and : [{user_id : accountId}, {visibleStore : true }]});
                const resultAutomotive = await modelAutomotive.find({ $and : [{user_id : accountId}, {visibleStore : true }]});
                const resultRealstate = await modelRealstate.find({ $and : [{user_id : accountId}, {visibleStore : true }]});
                const resultNautical = await modelNautical.find({ $and : [{user_id : accountId}, {visibleStore : true }]});
                const resultService = await modelService.find({ $and : [{user_id : accountId}, {visibleStore : true }]});
                const resultAuction = await modelAuction.find({ $and : [{user_id : accountId}, {visibleStore : true }]});
                const resultRaffle = await modelRaffle.find({ $and : [{user_id : accountId} , {visibleStore : true }]});

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
                const limit = 10; //establecer la cantidad  de elementos que se mostrarán
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
 
                     res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell});
 
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
 
                     res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell});
 
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
 
                         res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell});
            
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
 
                         res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell});
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
 
                    res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell});
 
                }

            } 

        } else {
            res.render('partials/error404');
        };
    }                       

    
});
 
routes.post('/account/search', async (req, res)=>{
    console.log("Este es el elemento de busqueda ---->", req.body);
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const { store, search } = req.body;
    const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
    const url = `${store}`;
    let searchProfile;
    let searchBanner;
    const boxPublisher = [];
    const account = store;
    const Account = await modelUser.find({ username : account });

    
    if (search.length === 0) {
        //console.log("nada de busqueda esta en blanco, entonces redirecciona a la busqueda original");
        res.redirect(url);  
    } else {
        //console.log("aqui si hay elemento de busqueda, vamos a ejecutar una busqueda y enviarlo al front-end");
       
        
        if (user){
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.find({ indexed : user._id });
            //console.log("Aqui el profile de la cuenta", searchProfile);
        };    
        
        const accountId = Account[0]._id; //esto es un array y dentro esta el objeto al que queremos acceder
   
        const storeProfile = await modelProfile.find({ indexed : accountId });
        //console.log("Aqui el profile de la **Tienda** a visistar --->", storeProfile);
        

        if (storeProfile.length !== 0) { 
            searchBanner = storeProfile[0].bannerPerfil;
        }

        //aqui busco el id del sorteo. 
        const raffle = await modelRaffle.find({ user_id : accountId });
        //si tiene entonces lo inlcuyo en elos objetos a enviar al front para anexarlo en el contenedor derecho alargado donde esta el Score y el trust 
        let raffle_Id;
            
        if (raffle.length !==0){
            raffle_Id = raffle[0]._id;
        
        } else {
            raffle_Id = undefined;
        }
        
        //----------------------------------------------

        //aqui vamos a buscar en todas las colecciones el filto de busqueda 
        //console.log("esto es store ------------->", store);
        //console.log("esto es search ------------->", search);

        const resultAirplane = await modelAirplane.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : search, $options : "i" }}] } );
        const resultArtes = await modelArtes.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : search, $options : "i" }}] } );
        const resultItems = await modelItems.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : search, $options : "i" }}] } );
        const resultAutomotive = await modelAutomotive.find( { $and : [{username : store }, {visibleStore : true },  { title : { $regex : search, $options : "i" }}] } );
        const resultRealstate = await modelRealstate.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : search, $options : "i" }}] } );
        const resultNautical = await modelNautical.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : search, $options : "i" }}] } );
        const resultService = await modelService.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : search, $options : "i" }}] } );
        const resultAuction = await modelAuction.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : search, $options : "i" }}] } );
        const resultRaffle = await modelRaffle.find( { $and : [{username : store }, {visibleStore : true }, { title : { $regex : search, $options : "i" }}] } );

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
        const limit = 10; //establecer la cantidad  de elementos que se mostrarán
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

              res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, raffle_Id});

        } else if (receive == "first"){

              X = 0;//0
              req.session.x = X;
                
              newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
     
              pagina = (limit + X) / limit;
              //console.log("pagina :  ", pagina);
              //console.log("totalPagina :  ", totalPagina);
              const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

              res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, raffle_Id});

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

                  res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, raffle_Id});
     
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

                  res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, raffle_Id });
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

              res.render('page/account', { newBox, paginate, searchBanner, user, Account, storeProfile, searchProfile, boxPublisher, countMessages, countNegotiationsBuySell, raffle_Id});

        }

        
    }

});

//esta ruta es accedida por dos peticiones, desde el stores y desde una tienda sobre el banner.
routes.post('/account/myfavorite-stores', async (req,res)=>{
try {
      
    //console.log("Esto es lo que esta llegando de un favoritoStore al backend ---->", req.body)
    const { user, userOfStore } = req.body;
    //console.log(` user:  ${user}    userOfStore:  ${userOfStore} `) 
    let searchProfile;
    
    searchProfile = await modelProfile.find({ indexed : user });
    //console.log("Esto es searchProfile : ", searchProfile)
     
    if (searchProfile.length !== 0){
        
        const favoriteStores = searchProfile[0].favoritestores;
        //console.log("Aqui veo el user --->",searchProfile)
        //console.log("Aqui veo las tiendas favoritas del user --->", favoriteStores); //esto es un array que contiene todas las cuentas a las que yo estoy siguiendo
        let exist = 0;

        if ( favoriteStores.length !== 0){
            for (let i = 0; i < favoriteStores.length; i++) {
                const Indexed = favoriteStores[i];
                if ( userOfStore !== Indexed ){
                    console.log("No existe")
                        
                } else {
                    console.log("Si existe")
                    exist ++;
                }
            }
                
            if (exist === 0 ){
                async function Follow(){
                    //console.log("No existe esta tienda en el array favoriteStore de este usuario")
                    const resultUpdate = await modelProfile.updateOne({ indexed : user }, {$push:{ favoritestores : userOfStore }});
                    //ahora vamos a agregar al user al array folowMe
                    const followMe = await modelProfile.updateOne({ indexed : userOfStore }, { $push: { followMe : user } } );
                }

                Follow()
                    .then(()=>{
                        res.json({ "type" : "Save", "message" : "Tienda guardada y siguiendo"});
                    })
                    .catch((error)=>{
                        res.json({ "type" : "Error", "message" : "Ha habido un error, intente luego"});
                    })

            } else {

                res.json({ "type" : "Following", "message" : "Sigo esta Tienda"});

            } 

        } else {
            async function Follow(){
                const resultUpdate = await modelProfile.updateOne({ indexed : user },{$push:{ favoritestores : userOfStore }});
                //console.log("Aqui el result de la update ---->",resultUpdate);
                //ahora vamos a agregar al user al array folowMe
                const followMe = await modelProfile.updateOne({ indexed : userOfStore }, { $push: { followMe : user } } );
            }
            
            Follow()
            .then(()=>{
                res.json({ "type" : "Save", "message" : "Tienda guardada y siguiendo"});
            })
            .catch((error)=>{
                res.json({ "type" : "Error", "message" : "Ha habido un error, intente luego"});
            })
        }

    } 
    
    
} catch (error) {
   //console.log("Ha habido un error, intente luego", error); 
}  
    
// hay tres valores en Type = "Save", "Following", "Error"

});

routes.post('/account/offer', async (req, res)=>{
    const boxInfo = []
    console.log("hemos llegado a setting/offer")
    console.log(req.body)
    const { depart, id } = req.body;

    if (depart === 'items'){
        const resultOffer = await modelItems.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelItems.findByIdAndUpdate( id, { offer : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo); 
        }else {
            const resultSearch = await modelItems.findByIdAndUpdate( id, { offer : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }
        
    } else if ( depart === "arts"){
        const resultOffer = await modelArtes.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { offer : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { offer : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }

    } else if ( depart === "automotive"){
        const resultOffer = await modelAutomotive.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelAutomotive.findByIdAndUpdate( id, { offer : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelAutomotive.findByIdAndUpdate( id, { offer : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }

    }   else if ( depart === "airplanes"){
        const resultOffer = await modelAirplane.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelAirplane.findByIdAndUpdate( id, { offer : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelAirplane.findByIdAndUpdate( id, { offer : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "nautical"){
        const resultOffer = await modelNautical.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelNautical.findByIdAndUpdate( id, { offer : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelNautical.findByIdAndUpdate( id, { offer : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "realstate"){
        const resultOffer = await modelRealstate.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelRealstate.findByIdAndUpdate( id, { offer : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelRealstate.findByIdAndUpdate( id, { offer : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "service"){
        const resultOffer = await modelService.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelService.findByIdAndUpdate( id, { offer : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelService.findByIdAndUpdate( id, { offer : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }   else if ( depart === "auctions"){
        const resultOffer = await modelAuction.findById(id);
        const Offer = resultOffer.offer;

        if (Offer === false){
            const resultSearch = await modelAuction.findByIdAndUpdate( id, { offer : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelAuction.findByIdAndUpdate( id, { offer : false });
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
            const resultSearch = await modelItems.findByIdAndUpdate( id, { bestProduct : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo); 
        }else {
            const resultSearch = await modelItems.findByIdAndUpdate( id, { bestProduct : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }
        
    } else if ( depart === "arts"){
        const resultBestProduct = await modelArtes.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { bestProduct : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { bestProduct : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }

    } else if ( depart === "automotive"){
        const resultBestProduct = await modelAutomotive.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelAutomotive.findByIdAndUpdate( id, { bestProduct : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelAutomotive.findByIdAndUpdate( id, { bestProduct : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }

    }   else if ( depart === "airplanes"){
        const resultBestProduct = await modelAirplane.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelAirplane.findByIdAndUpdate( id, { bestProduct : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelAirplane.findByIdAndUpdate( id, { bestProduct : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "nautical"){
        const resultBestProduct = await modelNautical.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelNautical.findByIdAndUpdate( id, { bestProduct : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelNautical.findByIdAndUpdate( id, { bestProduct : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "realstate"){
        const resultBestProduct = await modelRealstate.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelRealstate.findByIdAndUpdate( id, { bestProduct : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelRealstate.findByIdAndUpdate( id, { bestProduct : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "service"){
        const resultBestProduct = await modelService.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelService.findByIdAndUpdate( id, { bestProduct : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelService.findByIdAndUpdate( id, { bestProduct : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "auctions"){
        const resultBestProduct = await modelAuction.findById(id);
        const BestProduct = resultBestProduct.bestProduct;

        if (BestProduct === false){
            const resultSearch = await modelAuction.findByIdAndUpdate( id, { bestProduct : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelAuction.findByIdAndUpdate( id, { bestProduct : false });
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

    if (depart === 'items'){
        const resultOnlyOneAvailable = await modelItems.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelItems.findByIdAndUpdate( id, { onlyOneAvailable : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo); 
        }else {
            const resultSearch = await modelItems.findByIdAndUpdate( id, { onlyOneAvailable : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }
        
    } else if ( depart === "arts"){
        const resultOnlyOneAvailable = await modelArtes.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { onlyOneAvailable : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { onlyOneAvailable : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }

    } else if ( depart === "automotive"){
        const resultOnlyOneAvailable = await modelAutomotive.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelAutomotive.findByIdAndUpdate( id, { onlyOneAvailable : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelAutomotive.findByIdAndUpdate( id, { onlyOneAvailable : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }

    }   else if ( depart === "airplanes"){
        const resultOnlyOneAvailable = await modelAirplane.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelAirplane.findByIdAndUpdate( id, { onlyOneAvailable : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelAirplane.findByIdAndUpdate( id, { onlyOneAvailable : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "nautical"){
        const resultOnlyOneAvailable = await modelNautical.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelNautical.findByIdAndUpdate( id, { onlyOneAvailable : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelNautical.findByIdAndUpdate( id, { onlyOneAvailable : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "realstate"){
        const resultOnlyOneAvailable = await modelRealstate.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelRealstate.findByIdAndUpdate( id, { onlyOneAvailable : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }else {
            const resultSearch = await modelRealstate.findByIdAndUpdate( id, { onlyOneAvailable : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "service"){
        const resultOnlyOneAvailable = await modelService.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelService.findByIdAndUpdate( id, { onlyOneAvailable : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelService.findByIdAndUpdate( id, { onlyOneAvailable : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }
        
    }  else if ( depart === "auctions"){
        const resultOnlyOneAvailable = await modelAuction.findById(id);
        const OnlyOneAvailable = resultOnlyOneAvailable.onlyOneAvailable;

        if (OnlyOneAvailable === false){
            const resultSearch = await modelAuction.findByIdAndUpdate( id, { onlyOneAvailable : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelAuction.findByIdAndUpdate( id, { onlyOneAvailable : false });
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
            const resultSearch = await modelItems.findByIdAndUpdate( id, { delivery : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            console.log('esto es boxInfo------->', boxInfo); 
        }else {
            const resultSearch = await modelItems.findByIdAndUpdate( id, { delivery : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            console.log('esto es boxInfo------->', boxInfo);  
        }
        
    } else if ( depart === "arts"){
        const result = await modelArtes.findById(id);
        const Delivery = result.delivery;

        if (Delivery === false){
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { delivery : true });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);   
        }else {
            const resultSearch = await modelArtes.findByIdAndUpdate( id, { delivery : false });
            boxInfo.push(resultSearch);
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo);  
        }
        
    }    

    
    res.json(boxInfo);
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

    //console.log("*******variables*******");
    //console.log("userId", userId); console.log("username", username); console.log("depart", depart); console.log("title", title); console.log("titleId", titleId);

    let dateSend;
    const date = new Date();
    let dia = date.getDate(); let mes = date.getMonth() +1; let anio = date.getFullYear();
    let hora = date.getHours(); let minu = date.getMinutes();

    if (minu <= 9){
        dateSend = `${dia}-0${mes}-${anio} ${hora}:0${minu}`; 
    } else {
        dateSend = `${dia}-0${mes}-${anio} ${hora}:${minu}`;
    }

    
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
    const FollowMe = searchToFollowMe[0].followMe;
    //console.log("FollowMe ----------->", FollowMe);
    const count = FollowMe.length;
    //console.log("esto es FollowMe", FollowMe); //esto es un array donde estan todas las cuentas que me siguen.
    //console.log("seguiendo esta cuenta", count);

    async function sendingSpread(){
        for (let i = 0; i < FollowMe.length; i++) {
            const indexed = FollowMe[i] //un id de usuario que deseo enviar el mensaje;
            
            const searchReceive = await modelProfile.find({indexed});
            //console.log("usernameReceive", searchReceive[0].username);
            const usernameReceive = searchReceive[0].username;

            //enviamo el mensaje a este usuario
            const newMessage = new modelMessage( { typeNote: "spread", times: dateSend, username, question : Note, toCreatedArticleId: indexed,  ownerStore: usernameReceive, depart, titleArticle: title, productId : titleId, objeAvatar : objAvatar } );
            //console.log("newMessage :", newMessage);
            const saveMessage = await newMessage.save();
        }
    }

    async function spreadDone(){
        //especificamos cual depart estamos trabajando y al conseguirlo cambiamos el campo "spread" a true.
        // titleId, depart
        if (depart === "arts"){
            const update =  await modelArtes.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }} );
        } else if (depart === "automotive"){
            const update =  await modelAutomotive.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }} );
        } else if (depart === "airplanes"){
            const update =  await modelAirplane.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }} );
        } else if (depart === "auctions"){    
            const update =  await modelAuction.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }} );
        } else if (depart === "items"){
            const update =  await modelItems.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }} );
        } else if (depart === "nautical"){
            const update =  await modelNautical.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }} );
        } else if (depart === "service"){
            const update =  await modelService.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }} );
        } else if (depart === "raffle"){
            const update =  await modelRaffle.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }} );
        } else if (depart === "realstate"){
            const update =  await modelRealstate.findByIdAndUpdate(titleId, { $set:{ "spread.spreading" : true, "spread.time" : date }} );
        }

    }    
    
    sendingSpread()
        .then(()=>{
            spreadDone()
            .then(()=>{
                res.json({"response" : "Se ha enviado el mensage a todos nuestros seguidores.", "type" : "success", "followMe" : count });
            })
            .catch((error)=>{
                res.json({"response" : "Ha habido un error, intente luego.", "type" : "error"});
            })
    
            
        })
        .catch((error)=>{
            res.json({"response" : "Ha habido un error, intente luego.", "type" : "error"});
        })


});


routes.post('/account/storeRate', async(req, res)=>{

    console.log("Estamos llegando con estos datos al backend");
    console.log("/account/storeRate");
    const {store, logeado, markStar, comment} = req.body;
    console.log(`store: ${store} logeado: ${logeado} markStar: ${markStar} comment: ${comment}`);
    
    if (store !== logeado){

        //primero obtener el nombre de la tienda que se esta calificando;
        const searchStoreName = await modelUser.findById(store);
        const storeName = searchStoreName.username;
        console.log("nombre de tienda ->", storeName);

        //segundo debemos capturar los datos de user que esta calificando.(avatar, username):
        const searchProfile = await modelProfile.find({indexed : logeado});
        console.log("searchProfile de logeado ---->", searchProfile);
        const { username , avatarPerfil, mailhash } = searchProfile[0];
        console.log("Ver datos importantes -->", username, avatarPerfil, mailhash);
        const dataLogeado = { username, avatarPerfil, mailhash };

        //tercero buscamos todas las calificaciones de esta tienda para luego buscar si el logeado ha calificado
        const searchStore = await modelStoreRate.find({store, logeado});
        console.log("searchStore ->", searchStore);

        if (searchStore.length !==0 ){
            
            console.log("esta persona a calificado esta tienda");
            const updateRate = await modelStoreRate.updateOne({store, logeado}, {markStar, comment, dataLogeado});
            console.log("ya hemos actualizado", updateRate);

        } else {
            console.log("esta persona No a calificado esta tienda");
            const newRate = new modelStoreRate({ store, logeado, markStar, comment, storeName, dataLogeado });
            const newRateSave = await newRate.save();
            console.log("Ya ha calificado ", newRateSave);
        }


    }

});



routes.post('/account/pountRate', async(req, res)=>{
    console.log("  ''''''''''''''' AQUI '''''''''''''''''' ");
    console.log("account/pountRate");
    const {storeName} = req.body; // esto debe ser modificado y buscado por id y no por nombre de tienda.
    
    const rateStore = await modelStoreRate.find({storeName});
    //console.log("searchStore x storeName --->", searchStore)
    res.json(rateStore);
})

routes.post('/account/pountRate/star-1', async(req, res)=>{
    console.log("  ''''''''''''''' AQUI '''''''''''''''''' ");
    console.log("account/pountRate/start-1");
    const {storeName} = req.body; // esto debe ser modificado y buscado por id y no por nombre de tienda.
    
    const rateStore = await modelStoreRate.find( {$and : [{storeName}, {markStar : '1'}]} );
    console.log("rateStore --->", rateStore)
    res.json(rateStore);
})
              
routes.post('/account/pountRate/star-2', async(req, res)=>{
    console.log("  ''''''''''''''' AQUI '''''''''''''''''' ");
    console.log("account/pountRate/star-2");
    const {storeName} = req.body; // esto debe ser modificado y buscado por id y no por nombre de tienda.
    
    const rateStore = await modelStoreRate.find( {$and : [{storeName}, {markStar : '2'}]} );
    console.log("rateStore --->", rateStore)
    res.json(rateStore);
})

routes.post('/account/pountRate/star-3', async(req, res)=>{
    console.log("  ''''''''''''''' AQUI '''''''''''''''''' ");
    console.log("account/pountRate/start-3");
    const {storeName} = req.body; // esto debe ser modificado y buscado por id y no por nombre de tienda.
    
    const rateStore = await modelStoreRate.find( {$and : [{storeName}, {markStar : '3'}]} );
    console.log("rateStore --->", rateStore)
    res.json(rateStore);
})

routes.post('/account/pountRate/star-4', async(req, res)=>{
    console.log("  ''''''''''''''' AQUI '''''''''''''''''' ");
    console.log("account/pountRate/start-4");
    const {storeName} = req.body; // esto debe ser modificado y buscado por id y no por nombre de tienda.
    
    const rateStore = await modelStoreRate.find( {$and : [{storeName}, {markStar : '4'}]} );
    console.log("rateStore --->", rateStore)
    res.json(rateStore);
})

routes.post('/account/pountRate/star-5', async(req, res)=>{
    console.log("  ''''''''''''''' AQUI '''''''''''''''''' ");
    console.log("account/pountRate/start-5");
    const {storeName} = req.body; // esto debe ser modificado y buscado por id y no por nombre de tienda.
    
    const rateStore = await modelStoreRate.find( {$and : [{storeName}, {markStar : '5'}]} );
    console.log("rateStore --->", rateStore)
    res.json(rateStore);
})

module.exports = routes;