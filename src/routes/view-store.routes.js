const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelMessages = require('../models/messages.js');
const modelProfile = require('../models/profile.js');
const modelBuySell = require('../models/buySell.js');

routes.get('/view-store', async (req, res)=>{

          
        const user = req.session.user;
        const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell
        
        let Searcher, cacheSearch, cacheHashtag

        cacheSearch = req.session.cacheSearch;
        cacheHashtag = req.session.cacheHashtag;

        let searchProfile, Hashtag;

        const page = req.query.page;
        const options = {
            page: parseInt(page, 10) || 1,
            limit: 20,
            sort : { createdAt : -1 }
        }

        if (user){
            console.log("Esto es user._id ------>", user._id );
            countryMarketCode = user.seeMarket.countryMarketCode;

            searchProfile = await modelProfile.find({ indexed : user._id });
            console.log("Aqui el profile de la cuenta", searchProfile);
            console.log("este es el user desde la view-store: ",  user);
            console.log("cacheSearch", cacheSearch);
            console.log("cacheHashtag", cacheHashtag);
            console.log("Estamos en el get ('/view-store')", );   
            
    
            if (cacheSearch){
                
                const cardArticleStore = await modelProfile.paginate( { $and : [{ username: {$regex: cacheSearch , $options: "i" }}, { paused : false },{ countryCode : countryMarketCode }]}, options);
                //console.log(cardArticleStore);
                const countSearch = await modelProfile.find( { $and : [{ username: {$regex: cacheSearch , $options: "i" }}, { paused : false },{ countryCode : countryMarketCode } ]}).count();
                const stateGroup = null;
                const categoryAndSub = await modelProfile.aggregate([ {$match: {$and : [ { username: {$regex: cacheSearch , $options: "i" }},{paused : false},{ countryCode : countryMarketCode } ]}  }, { $group: { _id: "$state", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });
    
            } else if (cacheHashtag){
    
                const cardArticleStore = await modelProfile.paginate( { $and : [{ hashtags: {$regex: cacheHashtag , $options: "i" }},{ paused : false },{ countryCode : countryMarketCode } ]}, options);
                //console.log(cardArticleStore);
                const countSearch = await modelProfile.find( { $and : [{ hashtags: {$regex: cacheHashtag , $options: "i" }},{ paused : false },{ countryCode : countryMarketCode } ]}).count();
                const stateGroup = null;
                const categoryAndSub = await modelProfile.aggregate([ {$match: {$and : [ { hashtags: {$regex: cacheHashtag , $options: "i" }},{paused : false},{ countryCode : countryMarketCode } ]}  },{ $group: { _id: "$state", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });
    
            } else {
    
                const cardArticleStore = await modelProfile.paginate( { $and : [ { paused : false },{ countryCode : countryMarketCode } ] }, options);
                //console.log(cardArticleStore);
                const countSearch = await modelProfile.find( { $and : [ { paused : false },{ countryCode : countryMarketCode } ] }).count();
                const stateGroup = null;
                const categoryAndSub = await modelProfile.aggregate([ {$match: {$and : [ {paused : false},{ countryCode : countryMarketCode } ]}  },{ $group: { _id: "$state", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });
    
            } 
    
        } else {
            
    
            if (cacheSearch){
                
                const cardArticleStore = await modelProfile.paginate( { $and : [{ username: {$regex: cacheSearch , $options: "i" }}, { paused : false }]}, options);
                //console.log(cardArticleStore);
                const countSearch = await modelProfile.find( { $and : [{ username: {$regex: cacheSearch , $options: "i" }}, { paused : false }]}).count();
                const stateGroup = null;
                const categoryAndSub = await modelProfile.aggregate([ {$match: {$and : [ { username: {$regex: cacheSearch , $options: "i" }},{paused : false} ]}  },{ $group: { _id: "$state", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });
    
            } else if (cacheHashtag){
    
                const cardArticleStore = await modelProfile.paginate( { $and : [{ hashtags: {$regex: cacheHashtag , $options: "i" }}, { paused : false }]}, options);
                //console.log(cardArticleStore);
                const countSearch = await modelProfile.find( { $and : [{ hashtags: {$regex: cacheHashtag , $options: "i" }}, { paused : false }]}).count();
                const stateGroup = null;
                const categoryAndSub = await modelProfile.aggregate([ {$match: {$and : [ { username: {$regex: cacheHashtag , $options: "i" }},{paused : false} ]}  },{ $group: { _id: "$state", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });
    
            } else {
    
                const cardArticleStore = await modelProfile.paginate({ paused : false }, options);
                //console.log(cardArticleStore);
                const countSearch = await modelProfile.find({paused : false }).count();
                const stateGroup = null;
                const categoryAndSub = await modelProfile.aggregate([ {$match: {$and : [ {paused : false} ]}  },{ $group: { _id: "$state", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });
    
            } 
    


        }

        

            

}); 

routes.post('/view-store', async (req, res)=>{
    
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    console.log(":::: view-store ::::")
    console.log(req.body);
    const { searcher } = req.body; //searcher
    console.log("valores recibidos desde el front ----> ", searcher);
    const search = searcher.trim();//limpio la cadena de espacios vacios
    console.log("search ------> ",search); //dato que usaremos para la consulta en la DB
    const searchFirst = search.charAt(0); //metodo chartAt(i) permite acceder a un caracter de la cadena(string) como si fuera un array;
    let Hashtag = "false";
    let searchClean, searchProfile, Searcher, cacheSearch, cacheHashtag;
   

    if (searchFirst === "#"){
        console.log("Esto es search con # completo y limpio de espacios", search);
        //aqui hay que quitar el #
        const arrayStg = search.split("");
        arrayStg.splice(0,1);
        const Stg = arrayStg.toString();
        searchClean = Stg.replace(/,/g, "");
        console.log("Esto es searchClean ----->",searchClean);
        console.log("*************************************");
        Hashtag = "true";

        Searcher = searchClean;
        req.session.cacheHashtag = Searcher;
        cacheHashtag = Searcher;
        
    } else {

        Searcher = search;
        req.session.cacheSearch = Searcher;
        cacheSearch = Searcher;

    }

    let page = req.query.page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 20,
        sort : { createdAt : -1 }
    }

    if (user){
        console.log("Esto es user._id ------>", user._id );
        countryMarketCode = user.seeMarket.countryMarketCode;

        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
        
        //vamos por aqui ..................................................................................................
        
        if (searchFirst === "#" ){
            console.log("***************************");
            console.log("::: Esto es un hashtag :::");
            console.log("Esto es Searcher :", Searcher);

            const cardArticleStore = await modelProfile.paginate( {$and : [{ hashtags: {$regex: Searcher , $options: "i" }},{ paused : false },{ countryCode : countryMarketCode } ] }, options );
            //console.log("Esto es cardArticleStore ----> ",cardArticleStore);
            const countSearch = await modelProfile.find( {$and : [{ hashtags: {$regex: Searcher, $options: "i"}},{ paused : false },{ countryCode : countryMarketCode } ]}).count();
            console.log("::::::::: Esto es countSearch :",countSearch);
            const stateGroup = await modelProfile.aggregate([  {$match: {$and : [{hashtags: {$regex: Searcher, $options: "i"}},{paused : false},{ countryCode : countryMarketCode } ]}  },{$group: {_id : "$state", repetido: {$sum: 1}}} ]);
            console.log("aqui estados por grupo ----->:", stateGroup);

            res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });
        } else {

            if (search){
                console.log("este es el user desde la view-store: ",  user);
                console.log("esto es search --->", search);
                console.log("esto es Searcher --->", Searcher);
                console.log("Estamos por aqui ------------");
                
                const cardArticleStore = await modelProfile.paginate( {$and : [{ username: {$regex: Searcher , $options: "i" }},{paused : false},{ countryCode : countryMarketCode } ] }, options );
                console.log("cardArticleStore ---->", cardArticleStore);
                const countSearch = await modelProfile.find( {$and : [{ username: {$regex: Searcher, $options: "i"}},{paused : false},{ countryCode : countryMarketCode } ]}).count();
                console.log("::::::::: Esto es countSearch :",countSearch)
                const stateGroup = await modelProfile.aggregate([  {$match: {$and : [{username: {$regex: Searcher, $options: "i"}},{paused : false},{ countryCode : countryMarketCode } ]}  },{$group: {_id : "$state", repetido: {$sum: 1}}} ]);
                console.log("aqui estados por grupo ----->:", stateGroup);
                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });
                                                                                    
            } else {
                console.log("este es el user desde la view-store: ",  user);
                console.log("El buscador esta totamente limpio debemos borrar la cache de cacheHashtag y de countSearch");
                // aqui limpiamos ambas cache cacheHashtag y de countSearch
                req.session.cacheSearch = ""; // limpiamos cache
                req.session.cacheHashtag = ""; // limpiamos cache
                cacheSearch = req.session.cacheSearch;
                cacheHashtag = req.session.cacheHashtag;

                const cardArticleStore = await modelProfile.paginate( {$and : [{paused : false},{ countryCode : countryMarketCode } ]} , options );
                //console.log("Esto es cardArticleStore ---->", cardArticleStore)           
                const countSearch = await modelProfile.find( { $and :[ {paused : false},{ countryCode : countryMarketCode } ] } ).count();
                const stateGroup = null;
                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });
            }
        }        

    } else {

        if (searchFirst === "#" ){
            console.log("***************************");
            console.log("::: Esto es un hashtag :::");
            console.log("Esto es Searcher :", Searcher);

            const cardArticleStore = await modelProfile.paginate( {$and : [{ hashtags: {$regex: Searcher , $options: "i" }},{ paused : false } ] }, options );
            //console.log("Esto es cardArticleStore ----> ",cardArticleStore);
            const countSearch = await modelProfile.find( {$and : [{paused : false },{ hashtags: {$regex: Searcher, $options: "i"}} ]}).count();
            console.log("::::::::: Esto es countSearch :",countSearch);
            const stateGroup = await modelProfile.aggregate([  {$match: {$and : [{hashtags: {$regex: Searcher, $options: "i"}}, {paused : false} ]}  },{$group: {_id : "$country", repetido: {$sum: 1}}} ]);
            console.log("aqui estados por grupo ----->:", stateGroup);

            res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });
        
        } else {

            if (search){
                console.log("este es el user desde la view-store: ",  user);
                console.log("esto es search --->", search);
                console.log("esto es Searcher --->", Searcher);
                console.log("Estamos por aqui ------------");
                
                const cardArticleStore = await modelProfile.paginate( {$and : [{ username: {$regex: Searcher , $options: "i" }},{ paused : false } ] }, options );
                console.log("cardArticleStore ---->", cardArticleStore);
                const countSearch = await modelProfile.find( {$and : [{paused : false },{ username: {$regex: Searcher, $options: "i"}} ]}).count();
                console.log("::::::::: Esto es countSearch :",countSearch)
                const stateGroup = await modelProfile.aggregate([  {$match: {$and : [{username: {$regex: Searcher, $options: "i"}}, {paused : false} ]}  },{$group: {_id : "$country", repetido: {$sum: 1}}} ]);
                console.log("aqui estados por grupo ----->:", stateGroup);
                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });
                                                                                    
            } else {
                console.log("este es el user desde la view-store: ",  user);
                console.log("El buscador esta totamente limpio debemos borrar la cache de cacheHashtag y de countSearch");
                // aqui limpiamos ambas cache cacheHashtag y de countSearch
                req.session.cacheSearch = ""; // limpiamos cache
                req.session.cacheHashtag = ""; // limpiamos cache
                cacheSearch = req.session.cacheSearch;
                cacheHashtag = req.session.cacheHashtag;

                const cardArticleStore = await modelProfile.paginate( {$and : [{paused : false}]} , options );
                //console.log("Esto es cardArticleStore ---->", cardArticleStore)           
                const countSearch = await modelProfile.find( {$and :[{paused : false}]} ).count();
                const stateGroup = null;
                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });
            }
        }        

    }
  

   
}); 
//           view-store/a/Bolívar?page=2
routes.get('/view-store/:filtro/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let cacheSearch, cacheHashtag;

    cacheSearch = req.session.cacheSearch;
    cacheHashtag = req.session.cacheHashtag;

    const Searcher = req.params.filtro;
    const State = req.params.stateprovince;
    let Hashtag = "false";
    let searchProfile;
    
    let page = req.query.page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 20,
        sort : { createdAt : -1 }
    }


    if (user){
        console.log("Esto es user._id ------>", user._id );
        countryMarketCode = user.seeMarket.countryMarketCode;

        searchProfile = await modelProfile.find({ indexed : user._id });
        //console.log("Aqui el profile de la cuenta", searchProfile);
        console.log("este es el user desde la view-services --->", user);
        console.log("Aqui debo mostrar un resultado de consulta --->", Searcher);
        console.log("Aqui debo mostrar estado del pais --->", State);

        
        const cardArticleStore= await modelProfile.paginate({$and : [{ username: {$regex: Searcher , $options: "i" }},{state : State},{ paused : false },{ countryCode : countryMarketCode } ] }, options  );
        console.log("esto es cardArticleStore ---->",cardArticleStore);
        const countSearch = await modelProfile.find({$and : [{ username: {$regex: Searcher , $options: "i" }},{state : State},{ paused : false },{ countryCode : countryMarketCode } ] }).count();
        const stateGroup = await modelProfile.aggregate([ {$match: { $and : [ {username: {$regex: Searcher, $options: "i"}},{state : State},{ paused : false },{ countryCode : countryMarketCode } ] } },{$group: {_id : "$state", repetido: {$sum: 1} }} ]);
        console.log("aqui estados por grupo :", stateGroup);
        res.render('page/view-store', { user, searchProfile, cardArticleStore, Hashtag, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });

    } else {

        const cardArticleStore= await modelProfile.paginate({$and : [{ username: {$regex: Searcher , $options: "i" }},{country : State},{ paused : false } ] }, options  );
        console.log("esto es cardArticleStore ---->",cardArticleStore);
        const countSearch = await modelProfile.find({$and : [{ username: {$regex: Searcher , $options: "i" }},{country : State},{ paused : false } ] }).count();
        const stateGroup = await modelProfile.aggregate([ {$match: { $and : [ {username: {$regex: Searcher, $options: "i"}},{country : State},{ paused : false } ] } },{$group: {_id : "$country", repetido: {$sum: 1} }} ]);
        console.log("aqui estados por grupo :", stateGroup);
        res.render('page/view-store', { user, searchProfile, cardArticleStore, Hashtag, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });

    }


});

          
routes.get('/view-store/hashtag/:filtro/:stateprovince', async (req, res)=>{
    
    try {

        const user = req.session.user;
        const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

        let storeError = null; //si va bien va con este valor de null pero si por el contrario pasa algo este valor cambiaria a un mensaje de error.

        let cacheSearch, cacheHashtag;

        cacheSearch = req.session.cacheSearch;
        cacheHashtag = req.session.cacheHashtag;
    
        const Searcher = req.params.filtro;
        const State = req.params.stateprovince;
        let Hashtag = "true";
        let searchProfile;

        let page = req.query.page;
        const options = {
            page: parseInt(page, 10) || 1,
            limit: 20,
            sort : { createdAt : -1 }
        }

        if (user){
            console.log("Esto es user._id ------>", user._id );
            countryMarketCode = user.seeMarket.countryMarketCode;

            searchProfile = await modelProfile.find({ indexed : user._id });
            //console.log("Aqui el profile de la cuenta", searchProfile);
            console.log("este es el user desde la view-services --->", user);
            console.log("Aqui debo mostrar un resultado de consulta --->", Searcher);
            console.log("Aqui debo mostrar estado del pais --->", State);


            const cardArticleStore= await modelProfile.paginate({$and : [{ hashtags: {$regex: Searcher , $options: "i" }},{state : State},{ paused : false },{ countryCode : countryMarketCode } ] }, options );
            console.log("esto es cardArticleStore ---->",cardArticleStore);
            const countSearch = await modelProfile.find({$and : [{ hashtags: {$regex: Searcher , $options: "i" }},{state : State},{ paused : false },{ countryCode : countryMarketCode } ] }).count();
            const stateGroup = await modelProfile.aggregate([ {$match: {$and: [ {hashtags: {$regex: Searcher, $options: "i"}}, {state : State},{ paused : false },{ countryCode : countryMarketCode } ]} },{$group: {_id : "$state", repetido: {$sum: 1} }} ]);
            console.log("aqui estados por grupo :", stateGroup);
            res.render('page/view-store', { user, searchProfile, cardArticleStore, Hashtag, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });

        } else {

            const cardArticleStore= await modelProfile.paginate({$and : [{ hashtags: {$regex: Searcher , $options: "i" }},{country : State},{ paused : false } ] }, options );
            console.log("esto es cardArticleStore ---->",cardArticleStore);
            const countSearch = await modelProfile.find({$and : [{ hashtags: {$regex: Searcher , $options: "i" }},{country : State},{ paused : false } ] }).count();
            const stateGroup = await modelProfile.aggregate([ {$match: {$and: [ {hashtags: {$regex: Searcher, $options: "i"}},{country : State},{ paused : false } ]} },{$group: {_id : "$country", repetido: {$sum: 1} }} ]);
            console.log("aqui estados por grupo :", stateGroup);
            res.render('page/view-store', { user, searchProfile, cardArticleStore, Hashtag, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheSearch, cacheHashtag });

        }


    } catch (error) {
        req.session.storeError = "Ha habido un error, intente luego.";
        storeError = req.session.storeError;
        res.render('page/view-store', { storeError, user, searchProfile, Hashtag,  Searcher, countMessages, countNegotiationsBuySell, cacheSearch, cacheHashtag }); 
    }    


});

module.exports = routes;


