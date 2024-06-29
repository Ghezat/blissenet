const { Router } = require('express');
const hash = require('object-hash');
const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');

const modelArtes = require('../models/artes.js');
const modelAirplane = require('../models/airplane.js');
const modelItems = require('../models/items.js');
const modelAutomotive = require('../models/automotive.js');
const modelRealstate = require('../models/realstate.js');
const modelNautical = require('../models/nautical.js');
const modelAuction = require('../models/auction.js');
const modelService = require('../models/services.js');
const modelRaffle = require('../models/raffle.js');


routes.get('/myaccount/manage', async (req,res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let active = 0, paused = 0;
    const boxPublisher = [];
    const receive  = req.query.paginate;// aqui las query para operar con la paginacion.
    let searchProfile, Indexed, fascinometro_store, fascinometroStoreCount, followMe, followMeCount, followingCount;
    let view_store, viewStoreCount ;
    console.log("este es el usuario --->", user);

    if (user){
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile del usuer", searchProfile);

        if (searchProfile.length !== 0) { 
            
            Indexed = searchProfile[0].indexed;
            console.log("aqui el Indexed ---->", Indexed); //capturo este dato para poder usarlo para encontrarlo en todos los array favoritestores de todos los perfiles de la comunidad. con ello saber cuantas personas siguen como favorito al usuario activo.
    
            followMe = searchProfile[0].followMe;
            followMeCount = followMe.length;
            following = searchProfile[0].favoritestores;
            followingCount = following.length;

            //fascinometro_store = await modelProfile.find({ favoritestores : Indexed });
            //fascinometroStoreCount = fascinometro_store.length
             
            
            const searchBanner = searchProfile[0].bannerPerfil;
    
            //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones. 
            const resultAirplane = await modelAirplane.find({ user_id : user._id });
            const resultArtes = await modelArtes.find({ user_id : user._id });
            const resultItems = await modelItems.find({ user_id : user._id });
            const resultAutomotive = await modelAutomotive.find({ user_id : user._id });
            const resultRealstate = await modelRealstate.find({ user_id : user._id });
            const resultNautical = await modelNautical.find({ user_id : user._id });
            const resultService = await modelService.find({ user_id : user._id });
            const resultAuction = await modelAuction.find({ user_id : user._id });
            const resultRaffle = await modelRaffle.find({ user_id : user._id });
    
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
            for (let i = 0; i < boxPublisher.length; i++) {
                const ele = boxPublisher[i].paused;
                console.log("este es el estado del atributo paused ----->", ele);
                if (ele === false ){
                    active = active + 1
                } else {
                    paused = paused + 1
                }
            };
        
            const objActive = { active, paused }; //este objeto tiene ambas variables 
            //console.log("anuncios activos --->", active );
            //console.log("anuncios paused --->", paused );
            console.log("objeto actived", objActive);


            // paginate
            let long = boxPublisher.length; //conocer la longitud del array
            const limit = 10; //establecer la cantidad  de elementos que se mostrarán
            let pagina = 1; //declaracion de la pagina por default en 1
            let X;
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
                let newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
        
                console.log("pagina :  ", pagina);
                console.log("totalPagina :  ", totalPagina);
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                res.render('page/manage', {searchBanner, user, searchProfile, newBox, paginate, boxPublisher, countMessages, countNegotiationsBuySell, followMe, followMeCount, followingCount, objActive});

            } else if (receive == "first"){

                X = 0;
                req.session.x = X;
                      
                newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
           
                pagina = (limit + X) / limit;
                console.log("pagina :  ", pagina);
                console.log("totalPagina :  ", totalPagina);
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                res.render('page/manage', {searchBanner, user, searchProfile, newBox, paginate, boxPublisher, countMessages, countNegotiationsBuySell, followMe, followMeCount, followingCount, objActive});
           
            } else if (receive == "next"){

                X = req.session.x;

                if (X + limit < long ){
   
                    X = X + limit;//6
                    req.session.x = X;

                    newBox = boxPublisher.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
           
                    pagina = (limit + X) / limit;
                    console.log("pagina :  ", pagina);
                    console.log("totalPagina :  ", totalPagina);
                    const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                    res.render('page/manage', {searchBanner, user, searchProfile, newBox, paginate, boxPublisher, countMessages, countNegotiationsBuySell, followMe, followMeCount, followingCount, objActive});
           
                }
          
            
            } else if (receive == "prev"){

                X = req.session.x;
                console.log("Estamos en Prev");
                console.log("Esto es el valor de x :", X); //30

                if (X  > 0){

                    X = X - limit //20
                    console.log("XXXXXXXXXXXXXXXXXXXXXX");
                    console.log("Ver valor de X :", X);//20
                    req.session.x = X; //20

                    newBox = boxPublisher.slice(X , limit + X); 

                    pagina = Math.ceil((limit + X) / limit);
                    //console.log("pagina :  ", pagina);
                    //console.log("totalPagina :  ", totalPagina);
                    const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                    res.render('page/manage', {searchBanner, user, searchProfile, newBox, paginate, boxPublisher, countMessages, countNegotiationsBuySell, followMe, followMeCount, followingCount, objActive});
                } 
          

            } else if (receive == "last"){

                console.log("Esto es long :", long);//30
                console.log("Esto es limit :", limit);//10

                let n = (long % limit);//0

                if (n !==0 ){
                    X = long - limit; //30- 10 = 20
                    V = long - n;     //30- 3  = 27
                    req.session.x = V; //27
                    console.log("Esto es n :", n);//3
                    console.log("Esto es X :", X);//20
                } else {
                    X = long - limit; //30- 10 = 20
                    V = long - limit; //30- 10 = 20
                    req.session.x = V; //30
                    console.log("Esto es n :", n);//0
                    console.log("Esto es X :", X);//20
                }

                                           
                newBox = boxPublisher.slice(V , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
                            //       10   + 23  / 10 = 3.3 pero el Mat.ceil lo lleva a 4 perfecto
                pagina = Math.ceil((limit + X) / limit);
                console.log("pagina :  ", pagina);
                console.log("totalPagina :  ", totalPagina);
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                res.render('page/manage', {searchBanner, user, searchProfile, newBox, paginate, boxPublisher, countMessages, countNegotiationsBuySell, followMe, followMeCount, followingCount, objActive});

            }

        } else {
            res.render('page/manage', {user, searchProfile, countMessages, countNegotiationsBuySell});
        }                            

    } else {
        console.log("hemos llegado al manage pero sin user");
        res.render('page/manage', {user, searchProfile});
    }
    
});

//esta es la direccion donde el fetch trae la data para crear las donas 
routes.get('/myaccount/manage/datafront', async(req, res)=>{
    const user = req.session.user;
    const boxPublisher = [];
    
    const resultAirplane = await modelAirplane.find({ user_id : user._id });
    const resultArtes = await modelArtes.find({ user_id : user._id });
    const resultItems = await modelItems.find({ user_id : user._id });
    const resultAutomotive = await modelAutomotive.find({ user_id : user._id });
    const resultRealstate = await modelRealstate.find({ user_id : user._id });
    const resultNautical = await modelNautical.find({ user_id : user._id });
    const resultService = await modelService.find({ user_id : user._id });
    const resultAuction = await modelAuction.find({ user_id : user._id });
    const resultRaffle = await modelRaffle.find({ user_id : user._id });

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
    const data = boxPublisher;
    res.json({data, user});
 })


// /myaccount/manage/<%= ele.department %>/<%= ele._id %>
routes.get('/myaccount/manage/:department/:id', async (req,res)=>{
    console.log('***** Le di al boton y estos son los parametros enviados *****')
    const department = req.params.department;  
    const id = req.params.id;

    if (department == 'arts'){
        const result = await modelArtes.findById(id);
        const paused = result.paused;
        if (paused == false){
           const pausadoChange = await modelArtes.findByIdAndUpdate( id, {paused : true});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        } else {
           const pausadoChange = await modelArtes.findByIdAndUpdate( id, {paused : false});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        }

    } else if (department == 'airplanes'){
        const result = await modelAirplane.findById(id);
        const paused = result.paused;
        if (paused == false){
           const pausadoChange = await modelAirplane.findByIdAndUpdate( id, {paused : true});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        } else {
           const pausadoChange = await modelAirplane.findByIdAndUpdate( id, {paused : false});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        }

    } else if (department == 'items'){
        const result = await modelItems.findById(id);
        const paused = result.paused;
        if (paused == false){
           const pausadoChange = await modelItems.findByIdAndUpdate( id, {paused : true});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        } else {
           const pausadoChange = await modelItems.findByIdAndUpdate( id, {paused : false});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        }

    }  else if (department == 'automotive'){
        const result = await modelAutomotive.findById(id);
        const paused = result.paused;
        if (paused == false){
           const pausadoChange = await modelAutomotive.findByIdAndUpdate( id, {paused : true});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        } else {
           const pausadoChange = await modelAutomotive.findByIdAndUpdate( id, {paused : false});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        }
    
    }  else if (department == 'realstate'){
        const result = await modelRealstate.findById(id);
        const paused = result.paused;
        if (paused == false){
           const pausadoChange = await modelRealstate.findByIdAndUpdate( id, {paused : true});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        } else {
           const pausadoChange = await modelRealstate.findByIdAndUpdate( id, {paused : false});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        }

    }   else if (department == 'nautical'){
        const result = await modelNautical.findById(id);
        const paused = result.paused;
        if (paused == false){
           const pausadoChange = await modelNautical.findByIdAndUpdate( id, {paused : true});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        } else {
           const pausadoChange = await modelNautical.findByIdAndUpdate( id, {paused : false});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        }

    }   else if (department == 'service'){
        const result = await modelService.findById(id);
        const paused = result.paused;
        if (paused == false){
           const pausadoChange = await modelService.findByIdAndUpdate( id, {paused : true});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        } else {
           const pausadoChange = await modelService.findByIdAndUpdate( id, {paused : false});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        }

    }   else if (department == 'auctions'){
        const result = await modelAuction.findById(id);
        const paused = result.paused;
        if (paused == false){
           const pausadoChange = await modelAuction.findByIdAndUpdate( id, {paused : true});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        } else {
           const pausadoChange = await modelAuction.findByIdAndUpdate( id, {paused : false});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        }

    }   else if (department == 'raffle'){
        const result = await modelRaffle.findById(id);
        const paused = result.paused;
        if (paused == false){
           const pausadoChange = await modelRaffle.findByIdAndUpdate( id, {paused : true});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        } else {
           const pausadoChange = await modelRaffle.findByIdAndUpdate( id, {paused : false});
           console.log("hemos cambiado el estado del pausa", pausadoChange.paused);
        }
    }    

    res.redirect('/myaccount/manage')
});

routes.get('/myaccount/visible-store/:department/:id', async (req, res)=>{
    console.log('***** Le di al boton visible y estos son los parametros enviados *****')
    const department = req.params.department;  
    const id = req.params.id;

    if (department == 'arts'){
        const result = await modelArtes.findById(id);
        const visible = result.visibleStore;
        if (visible === true ){
           const resultVisible = await modelArtes.findByIdAndUpdate( id, {visibleStore : false});
           console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        } else {
           const resultVisible = await modelArtes.findByIdAndUpdate( id, {visibleStore : true});
           console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        }

    } else if (department == 'airplanes'){
        const result = await modelAirplane.findById(id);
        const visible = result.visibleStore;
        if (visible === true){
            const resultVisible = await modelAirplane.findByIdAndUpdate( id, {visibleStore : false});
            console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        } else {
            const resultVisible = await modelAirplane.findByIdAndUpdate( id, {visibleStore : true});
            console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        }

    } else if (department == 'items'){
        const result = await modelItems.findById(id);
        const visible = result.visibleStore;
        if (visible === true){
           const resultVisible = await modelItems.findByIdAndUpdate( id, {visibleStore : false});
           console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        } else {
           const resultVisible = await modelItems.findByIdAndUpdate( id, {visibleStore : true});
           console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        }

    }  else if (department == 'automotive'){
        const result = await modelAutomotive.findById(id);
        const visible = result.visibleStore;
        if (visible === true){
           const resultVisible = await modelAutomotive.findByIdAndUpdate( id, {visibleStore : false});
           console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        } else {
           const resultVisible = await modelAutomotive.findByIdAndUpdate( id, {visibleStore : true});
           console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        }
    
    }   else if (department == 'realstate'){
        const result = await modelRealstate.findById(id);
        const visible = result.visibleStore;
        if (visible === true){
           const resultVisible = await modelRealstate.findByIdAndUpdate( id, {visibleStore : false});
           console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        } else {
           const resultVisible = await modelRealstate.findByIdAndUpdate( id, {visibleStore : true});
           console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        }

    }   else if (department == 'nautical'){
        const result = await modelNautical.findById(id);
        const visible = result.visibleStore;
        if (visible === true){
            const resultVisible = await modelNautical.findByIdAndUpdate( id, {visibleStore : false});
            console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        } else {
            const resultVisible = await modelNautical.findByIdAndUpdate( id, {visibleStore : true});
            console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        }

    }   else if (department == 'service'){
        const result = await modelService.findById(id);
        const visible = result.visibleStore;
        if (visible === true){
            const resultVisible = await modelService.findByIdAndUpdate( id, {visibleStore : false});
            console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        } else {
            const resultVisible = await modelService.findByIdAndUpdate( id, {visibleStore : true});
            console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        }
    }   else if (department == 'auctions'){
        const result = await modelAuction.findById(id);
        const visible = result.visibleStore;
        if (visible === true){
            const resultVisible = await modelAuction.findByIdAndUpdate( id, {visibleStore : false});
            console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        } else {
            const resultVisible = await modelAuction.findByIdAndUpdate( id, {visibleStore : true});
            console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        }
    }   else if (department == 'auctions'){
        const result = await modelAuction.findById(id);
        const visible = result.visibleStore;
        if (visible === true){
            const resultVisible = await modelAuction.findByIdAndUpdate( id, {visibleStore : false});
            console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        } else {
            const resultVisible = await modelAuction.findByIdAndUpdate( id, {visibleStore : true});
            console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        }
    }   else if (department == 'raffle'){
        const result = await modelRaffle.findById(id);
        const visible = result.visibleStore;
        if (visible === true){
            const resultVisible = await modelRaffle.findByIdAndUpdate( id, {visibleStore : false});
            console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        } else {
            const resultVisible = await modelRaffle.findByIdAndUpdate( id, {visibleStore : true});
            console.log("hemos cambiado el estado del visibleStore", resultVisible.visibleStore);
        }
    }


    res.redirect('/myaccount/manage')
});

module.exports = routes;
