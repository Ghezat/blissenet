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
const modelCustomerSurvey = require('../models/customerSurvey.js');
const messages = require('../models/messages.js');

const axios = require('axios');
      
//este Token es la KEY del bot de Telegram
const Token =  process.env.Token_Bot;

routes.get('/account/:account', async (req,res)=>{
    //console.log("Este es el parametroooo ---->",req.params);
    const account  = req.params.account;
    console.log("este es el account a visitar o tienda", account) //rogelio 
    
    const boxPublisher = [];
    let newBox;
    let boxOffert = [];
    const user = req.session.user;
    
    //console.log("este es el usuario visitante--->", user);
    const countMessages = req.session.countMessages
    const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
    //console.log("ver receive -------------------------->", receive);
    let searchProfile;
    const segment = null;

    //aqui obtengo la cantidad de negotiationsBuySell
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
    //console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
    const Account = await modelUser.find({ username : account });
    const accountID = Account[0]._id;
    //console.log("Este es la data del account que queremos visitar ...", Account);

    async function searchOffert(){
        //ahora es momento de consultar en todas las colecciones de articulos en busca de ofertas.
        const respItems = await modelItems.find({ user_id: accountID, offer: true });
        if (respItems.length > 0) {
            boxOffert.push(...respItems); // Usar el spread operator para añadir los elementos al array
        }
            
        const respAerop = await modelAirplane.find({user_id : accountID, offer : true });
        if (respAerop.length > 0){
            boxOffert.push(...respAerop);
        }

        const respAutom = await modelAutomotive.find({user_id : accountID, offer : true });
        if (respAutom.length > 0){
            boxOffert.push(...respAutom);
        }

        const respArtes = await modelArtes.find({user_id : accountID, offer : true });
        if (respArtes.length > 0){
            boxOffert.push(...respArtes);
        }

        const respReals = await modelRealstate.find({user_id : accountID, offer : true });
        if (respReals.length > 0){
            boxOffert.push(...respReals);
        }

        const respServi = await modelService.find({user_id : accountID, offer : true });
        if (respServi.length > 0){
            boxOffert.push(...respServi);
        }

        const respNauti = await modelNautical.find({user_id : accountID, offer : true });
        if (respNauti.length > 0){
            boxOffert.push(...respNauti);
        }

        const respAucti = await modelAuction.find({user_id : accountID, offer : true });
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
        
    if (user){
        //console.log("Esto es user._id ------>", user._id );
        const userId = user._id; //usaremos con el indexed en la coleccion profile.
        searchProfile = await modelProfile.find({ indexed : userId });
        //console.log("Aqui el profile de la cuenta", searchProfile);


        if (Account.length !== 0){// si la cuenta (user) a la que se quiere acceder existe (tendra una longitud diferente a 0, entonces ejecuta el bloque siguiente)


            const accountId = Account[0]._id; //esto es un array y dentro esta el objeto al que queremos acceder
            const accountIdString = accountId.toString(); //paso de objectId a String
            console.log("**********************ver esto**********************************")
            console.log("Este es el id user del account que queremos visitar ...", accountId);  
            console.log("typeof accountId ---->", typeof accountId); 
            
            //---consultamos si el user que visita esta tienda ya la sigue.     
            const statusFollow = await modelProfile.findOne({ indexed : userId, favoritestores : accountIdString });
            console.log("statusFollow --->", statusFollow);
            //-----------------------------------------------------------------

            const storeProfile = await modelProfile.findOne({ indexed : accountId });
            const segmentations = storeProfile.segment; // ["All", "Hoverboard"];
            const segmentDefault = segmentations[0];
            //console.log("Aqui el profile de la **Tienda** a visistar --->", storeProfile);
            console.log("Aqui la segmentations de la Tienda a visistar --->", segmentations);
            console.log("Aqui el segmentDefault de la Tienda a visistar --->", segmentDefault);


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
                  

            } else {
                res.render('page/account', {searchBanner, user, storeProfile, searchProfile, Account, countMessages, countNegotiationsBuySell});
            }   
               
        } else {
            res.render('partials/error404');
        };
        

    } else {
        //console.log("No hay usuario visitante.")

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
        //console.log("No hay usuario visitante.")

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
        };    
        
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
            //console.log("-------------------------------------")
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
                const usernameTiendaAseguir = tiendaAseguir.username; 
                //userOfStore = al indexed 
                console.log("Esto es avatar>>", avatar);
                console.log("Esto es avatarDefault>>", avatarDefault);
                
               
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

        }else {
            const result = await modelItems.findByIdAndUpdate( id, { soldOut : false }, { new: true });
            //console.log('esto es resultSearch', resultSearch );
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
            //console.log('esto es resultSearch', resultSearch );
            //console.log('esto es boxInfo------->', boxInfo); 

            console.log('esto es boxInfo------->', boxInfo);  
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
        }else {
            const result = await modelArtes.findByIdAndUpdate( id, { soldOut : false }, { new: true });

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

            const resultSearch = await modelArtes.findByIdAndUpdate( id, { $set: { purchaseTime: [] } },{ new: true });
            boxInfo.push(resultSearch);
        }
        
    }    

    
    res.json(boxInfo);
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

    const date = new Date();
    let dia = date.getDate(); let mes = date.getMonth() +1; let anio = date.getFullYear();
    let hora = date.getHours(); let minu = date.getMinutes();

    let mesFormatted = String(mes).padStart(2, '0');
    let minuFormatted = String(minu).padStart(2, '0');
    const dateSend = `${dia}-${mesFormatted}-${anio} ${hora}:${minuFormatted}`;

    
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
    //console.log("account/pountRate");
    const {storeName} = req.body; // esto debe ser modificado y buscado por id y no por nombre de tienda.
    
    const rateStore = await modelStoreRate.find({storeName}).sort({updatedAt : -1});
    //console.log("searchStore x storeName --->", searchStore)
    res.json(rateStore);
})

routes.post('/account/pountRate/star-1', async(req, res)=>{
    //console.log("account/pountRate/start-1");
    const {storeName} = req.body; // esto debe ser modificado y buscado por id y no por nombre de tienda.
    
    const rateStore = await modelStoreRate.find( {$and : [{storeName}, {markStar : '1'}]} ).sort({updatedAt : -1});
    console.log("rateStore --->", rateStore)
    res.json(rateStore);
})
              
routes.post('/account/pountRate/star-2', async(req, res)=>{
    //console.log("account/pountRate/star-2");
    const {storeName} = req.body; // esto debe ser modificado y buscado por id y no por nombre de tienda.
    
    const rateStore = await modelStoreRate.find( {$and : [{storeName}, {markStar : '2'}]} ).sort({updatedAt : -1});
    console.log("rateStore --->", rateStore)
    res.json(rateStore);
})

routes.post('/account/pountRate/star-3', async(req, res)=>{
    //console.log("account/pountRate/start-3");
    const {storeName} = req.body; // esto debe ser modificado y buscado por id y no por nombre de tienda.
    
    const rateStore = await modelStoreRate.find( {$and : [{storeName}, {markStar : '3'}]} ).sort({updatedAt : -1});
    console.log("rateStore --->", rateStore)
    res.json(rateStore);
})

routes.post('/account/pountRate/star-4', async(req, res)=>{
    //console.log("account/pountRate/start-4");
    const {storeName} = req.body; // esto debe ser modificado y buscado por id y no por nombre de tienda.
    
    const rateStore = await modelStoreRate.find( {$and : [{storeName}, {markStar : '4'}]} ).sort({updatedAt : -1});
    //console.log("rateStore --->", rateStore)
    res.json(rateStore);
})

routes.post('/account/pountRate/star-5', async(req, res)=>{
    //console.log("account/pountRate/start-5");
    const {storeName} = req.body; // esto debe ser modificado y buscado por id y no por nombre de tienda.
    
    const rateStore = await modelStoreRate.find( {$and : [{storeName}, {markStar : '5'}]} ).sort({updatedAt : -1});
    //console.log("rateStore --->", rateStore)
    res.json(rateStore);
});

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

//en esta ruta evaluamos si el visitante ha hecho la encuesta y si la ha hecho enviamos al fronted 
//para que le salte una notificacion de encuesta activa para que la haga.
routes.post('/account/survey/openStore', async(req, res)=>{



})


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

//-------------- controlando las peticiones de BlissBot bot de Telegram

// Endpoint para recibir actualizaciones de Telegram
routes.post(`/webhook/${Token}`, (req, res) => {
    const update = req.body;

    // Verificar si es un mensaje y contiene el comando /start
    if (update.message && update.message.text === '/start') {
        const chatId = update.message.chat.id;
        const usernameTelegram = update.chat.username;

        // Aquí el chatId del usuario que esta interactuando con el BlissBot
        console.log(`Capturado chat_id: ${chatId}`);
        //Capturado chat_id: 1629241334

        // Aquí el username de telegram de este usuario que esta interactuando con el BlissBot
        console.log(`Capturado usernameTelegram: ${usernameTelegram}`);
        //Capturado usernameTelegram: 

        // Enviar mensaje de bienvenida al usuario
        const welcomeMessage = '¡Hola! Has iniciado una conversación con BlissBot.';

        axios.post(`https://api.telegram.org/bot${Token}/sendMessage`, {
            chat_id: chatId,
            text: welcomeMessage,
        })
        .then(response => {
            console.log('Mensaje enviado con éxito:', response.data);
        })
        .catch(error => {
            console.error('Error al enviar el mensaje:', error.response.data);
        });
    }

    // Responder a Telegram con un 200 OK
    res.sendStatus(200);
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

module.exports = routes;