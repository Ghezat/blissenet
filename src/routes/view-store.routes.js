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
        
        let Searcher, cacheSearch, cacheHashtag, cacheState, cacheCities;

        cacheSearch = req.session.cacheSearch;
        cacheHashtag = req.session.cacheHashtag;
        cacheState = req.session.state;
        cacheCities = req.session.cities;

        let searchProfile, Hashtag;

            
        if (user){
            console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.find({ indexed : user._id });
            console.log("Aqui el profile de la cuenta", searchProfile);
        }

        const page = req.query.page;
        const options = {
            page: parseInt(page, 10) || 1,
            limit: 10,
            sort : { createdAt : -1 }
        }

        
        console.log("este es el user desde la view-store: ",  user);
        console.log("cacheSearch", cacheSearch);
        console.log("cacheHashtag", cacheHashtag);
        console.log("cacheState", cacheState);
        console.log("cacheCities", cacheCities);
        console.log("Estamos en el get ('/view-store')", );   
        

if (cacheSearch){

    if (cacheState ==="Todos" && cacheCities === "Todos"){
        console.log(" cacheState === Todos && cacheCities === Todos ");
        const cardArticleStore = await modelProfile.paginate( { $and : [{ username: {$regex: cacheSearch , $options: "i" }}, { paused : false }]}, options);
        //console.log(cardArticleStore);
        const countSearch = await modelProfile.find( { $and : [{ username: {$regex: cacheSearch , $options: "i" }}, { paused : false }]}).count();
        const stateGroup = null;
        const categoryAndSub = await modelProfile.aggregate([ { $group: { _id: "$states", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
    

    } else if (cacheState !== "Todos" && cacheCities === "Todos") {
        console.log(" cacheState !== Todos && cacheCities === Todos ");
        const cardArticleStore = await modelProfile.paginate({ $and : [{ username: {$regex: cacheSearch , $options: "i" }},{ paused : false}, {states : cacheState } ]} , options);
        //console.log(cardArticleStore);
        const countSearch = await modelProfile.find({ $and : [{ username: {$regex: cacheSearch , $options: "i" }},{ paused : false}, {states : cacheState } ]}).count();
        const stateGroup = null;
        const categoryAndSub = await modelProfile.aggregate([ { $group: { _id: "$states", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
    
    } else if (cacheState !== "Todos" && cacheCities !== "Todos" && cacheState !== undefined && cacheCities !== undefined ) {
        console.log(" cacheState !== Todos && cacheCities !== Todos ");
        const cardArticleStore = await modelProfile.paginate( { $and : [{ username: {$regex: cacheSearch , $options: "i" }}, { paused : false}, {states : cacheState}, {cities : cacheCities }]}, options);
        //console.log(cardArticleStore);
        const countSearch = await modelProfile.find( { $and : [{ username: {$regex: cacheSearch , $options: "i" }}, { paused : false}, {states : cacheState}, {cities : cacheCities }]}).count();
        const stateGroup = null;
        const categoryAndSub = await modelProfile.aggregate([ { $group: { _id: "$states", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });    

    } else if (!cacheState  && !cacheCities) {
        console.log("Valores undefined");
        const cardArticleStore = await modelProfile.paginate( { $and : [{ username: {$regex: cacheSearch , $options: "i" }}, { paused : false }] } , options);
        //console.log(cardArticleStore);
        const countSearch = await modelProfile.find( { $and : [{ username: {$regex: cacheSearch , $options: "i" }}, { paused : false }]}).count();
        const stateGroup = null;
        const categoryAndSub = await modelProfile.aggregate([ { $group: { _id: "$states", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
    
    }

} else if (cacheHashtag){

    if (cacheState ==="Todos" && cacheCities === "Todos"){
        console.log(" cacheState === Todos && cacheCities === Todos ");
        const cardArticleStore = await modelProfile.paginate( { $and : [{ hashtags: {$regex: cacheHashtag , $options: "i" }}, { paused : false }]}, options);
        //console.log(cardArticleStore);
        const countSearch = await modelProfile.find( { $and : [{ hashtags: {$regex: cacheHashtag , $options: "i" }}, { paused : false }]}).count();
        const stateGroup = null;
        const categoryAndSub = await modelProfile.aggregate([ { $group: { _id: "$states", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
    

    } else if (cacheState !== "Todos" && cacheCities === "Todos") {
        console.log(" cacheState !== Todos && cacheCities === Todos ");
        const cardArticleStore = await modelProfile.paginate({ $and : [{ hashtags: {$regex: cacheHashtag , $options: "i" }},{ paused : false}, {states : cacheState } ]} , options);
        //console.log(cardArticleStore);
        const countSearch = await modelProfile.find({ $and : [{ hashtags: {$regex: cacheHashtag , $options: "i" }},{ paused : false}, {states : cacheState } ]}).count();
        const stateGroup = null;
        const categoryAndSub = await modelProfile.aggregate([ { $group: { _id: "$states", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
    
    } else if (cacheState !== "Todos" && cacheCities !== "Todos" && cacheState !== undefined && cacheCities !== undefined ) {
        console.log(" cacheState !== Todos && cacheCities !== Todos ");
        const cardArticleStore = await modelProfile.paginate( { $and : [{ hashtags: {$regex: cacheHashtag , $options: "i" }}, { paused : false}, {states : cacheState}, {cities : cacheCities }]}, options);
        //console.log(cardArticleStore);
        const countSearch = await modelProfile.find( { $and : [{ hashtags: {$regex: cacheHashtag , $options: "i" }}, { paused : false}, {states : cacheState}, {cities : cacheCities }]}).count();
        const stateGroup = null;
        const categoryAndSub = await modelProfile.aggregate([ { $group: { _id: "$states", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });    

    } else if (!cacheState  && !cacheCities) {
        console.log("Valores undefined");
        const cardArticleStore = await modelProfile.paginate( { $and : [{ hashtags: {$regex: cacheHashtag , $options: "i" }}, { paused : false }] } , options);
        //console.log(cardArticleStore);
        const countSearch = await modelProfile.find( { $and : [{ hashtags: {$regex: cacheHashtag , $options: "i" }}, { paused : false }]}).count();
        const stateGroup = null;
        const categoryAndSub = await modelProfile.aggregate([ { $group: { _id: "$states", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
    
    }

} else {

    if (cacheState ==="Todos" && cacheCities === "Todos"){
        console.log(" cacheState === Todos && cacheCities === Todos ");
        const cardArticleStore = await modelProfile.paginate({ paused : false }, options);
        //console.log(cardArticleStore);
        const countSearch = await modelProfile.find({paused : false }).count();
        const stateGroup = null;
        const categoryAndSub = await modelProfile.aggregate([ { $group: { _id: "$states", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
    

    } else if (cacheState !== "Todos" && cacheCities === "Todos") {
        console.log(" cacheState !== Todos && cacheCities === Todos ");
        const cardArticleStore = await modelProfile.paginate({ paused : false, states : cacheState }, options);
        //console.log(cardArticleStore);
        const countSearch = await modelProfile.find({paused : false, states : cacheState }).count();
        const stateGroup = null;
        const categoryAndSub = await modelProfile.aggregate([ { $group: { _id: "$states", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
    
    } else if (cacheState !== "Todos" && cacheCities !== "Todos" && cacheState !== undefined && cacheCities !== undefined ) {
        console.log(" cacheState !== Todos && cacheCities !== Todos ");
        const cardArticleStore = await modelProfile.paginate({ paused : false, states : cacheState, cities : cacheCities }, options);
        //console.log(cardArticleStore);
        const countSearch = await modelProfile.find({paused : false, states : cacheState, cities : cacheCities }).count();
        const stateGroup = null;
        const categoryAndSub = await modelProfile.aggregate([ { $group: { _id: "$states", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });    

    } else if (!cacheState  && !cacheCities) {
        console.log("Valores undefined");
        const cardArticleStore = await modelProfile.paginate({ paused : false }, options);
        //console.log(cardArticleStore);
        const countSearch = await modelProfile.find({paused : false }).count();
        const stateGroup = null;
        const categoryAndSub = await modelProfile.aggregate([ { $group: { _id: "$states", sub_categories: { $addToSet: "$cities" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, categoryAndSub, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
    
    }

} 

    

}); 

routes.post('/view-store', async (req, res)=>{
    
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    console.log(":::: view-store ::::")
    console.log(req.body);
    const { searcher, states, cities } = req.body; //searcher
    console.log("valores recibidos desde el front ----> ", states , cities, searcher);
    const search = searcher.trim();//limpio la cadena de espacios vacios
    console.log("search ------> ",search); //dato que usaremos para la consulta en la DB
    const searchFirst = search.charAt(0); //metodo chartAt(i) permite acceder a un caracter de la cadena(string) como si fuera un array;
    let Hashtag = "false";
    let searchClean, searchProfile, Searcher, cacheSearch, cacheHashtag, cacheState, cacheCities;
   

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


    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
    }

    let page = req.query.page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    req.session.state = states;  // aqui guardamos la busqueda de estado en session.
    req.session.cities = cities; //aqui guardo la busqyeda por ciudad en session.

    cacheState = req.session.state;
    cacheCities = req.session.cities;

    console.log(":::::::::::  cacheState :::::::::::");
    console.log( cacheState );
    console.log(":::::::::::  ---------- :::::::::::");    
    


        if (states === 'Todos' && cities === 'Todos'){
            console.log("caso : 1");
            console.log("cacheState", cacheState);
            console.log("states", states);
            console.log("states === todos && cities === Todos");
            //1. no considera estados ni ciudades
            if (searchFirst === "#" ){
                console.log("***************************");
                console.log("::: Esto es un hashtag :::");
                console.log("Esto es Searcher :", Searcher);

                const cardArticleStore = await modelProfile.paginate( {$and : [{ hashtags: {$regex: Searcher , $options: "i" }},{ paused : false } ] }, options );
                //console.log("Esto es cardArticleStore ----> ",cardArticleStore);
                const countSearch = await modelProfile.find( {$and : [{paused : false },{ hashtags: {$regex: Searcher, $options: "i"}} ]}).count();
                console.log("::::::::: Esto es countSearch :",countSearch);
                const stateGroup = await modelProfile.aggregate([  {$match: {$and : [{hashtags: {$regex: Searcher, $options: "i"}}, {paused : false} ]}  },{$group: {_id : "$states", repetido: {$sum: 1}}} ]);
                console.log("aqui estados por grupo ----->:", stateGroup);

                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
            } else {

                if (search){
                    console.log("este es el user desde la view-store: ",  user);
                    console.log("Aqui debo mostrar un resultado de consulta --->", search);
                    
                    const cardArticleStore = await modelProfile.paginate( {$and : [{ username: {$regex: Searcher , $options: "i" }},{ paused : false } ] }, options );
                    //console.log(cardArticleStore);
                    const countSearch = await modelProfile.find( {$and : [{paused : false },{ username: {$regex: Searcher, $options: "i"}} ]}).count();
                    console.log("::::::::: Esto es countSearch :",countSearch)
                    const stateGroup = await modelProfile.aggregate([  {$match: {$and : [{username: {$regex: Searcher, $options: "i"}}, {paused : false} ]}  },{$group: {_id : "$states", repetido: {$sum: 1}}} ]);
                    console.log("aqui estados por grupo ----->:", stateGroup);
                    res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
                                                                                        
                } else {
                    console.log("este es el user desde la view-store: ",  user);
                    const cardArticleStore = await modelProfile.paginate( {$and : [{paused : false}]} , options );
                    //console.log("Esto es cardArticleStore ---->", cardArticleStore)           
                    const countSearch = await modelProfile.find( {$and :[{paused : false}]} ).count();
                    const stateGroup = null;
                    res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
                }
            }        

        } else if (states !== 'todos' && cities === 'Todos'){
            console.log("caso : 2");
            console.log("cacheState", cacheState);
            console.log("states", states);
            console.log("states !== todos && cities === Todos");
        //2. considera estado pero no ciudades
            if (searchFirst == "#" ){
                console.log("***************************");
                console.log("::: Esto es un hashtag :::");
                console.log("Esto es Searcher :", Searcher);

                const cardArticleStore = await modelProfile.paginate( {$and : [{ hashtags: {$regex: Searcher , $options: "i" }},{ states: states},{ paused : false } ] }, options );
                console.log("Esto es cardArticleStore ----> ",cardArticleStore);
                const countSearch = await modelProfile.find( {$and : [{paused : false },{ hashtags: {$regex: Searcher, $options: "i"}},{ states: states} ]}).count();
                console.log("::::::::: Esto es countSearch :",countSearch);
                const stateGroup = await modelProfile.aggregate([  {$match: {$and : [{hashtags: {$regex: Searcher, $options: "i"}}, {paused : false},{ states: states} ]}  },{$group: {_id : "$states", repetido: {$sum: 1}}} ]);
                console.log("aqui estados por grupo ----->:", stateGroup);

                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
            } else {

                if (search){
                    console.log("este es el user desde la view-store: ",  user);
                    console.log("Aqui debo mostrar un resultado de consulta --->", search);
                    
                    const cardArticleStore = await modelProfile.paginate( {$and : [{ username: {$regex: Searcher , $options: "i" }},{ states: states},{ paused : false } ] }, options );
                    //console.log(cardArticleStore);
                    const countSearch = await modelProfile.find( {$and : [{paused : false },{ username: {$regex: Searcher, $options: "i"}},{ states: states} ]}).count();
                    console.log("::::::::: Esto es countSearch :",countSearch)
                    const stateGroup = await modelProfile.aggregate([  {$match: {$and : [{username: {$regex: Searcher, $options: "i"}}, {paused : false},{ states: states} ]}  },{$group: {_id : "$states", repetido: {$sum: 1}}} ]);
                    console.log("aqui estados por grupo ----->:", stateGroup);
                    res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag })
                                                                                        
                } else {
                    console.log("Ver este apartado con ATENCION -------->")
                    console.log("cacheState", cacheState);
                    console.log("este es el user desde la view-store: ",  user);
                    const cardArticleStore = await modelProfile.paginate( {$and : [{paused : false},{ states: states}]} , options );
                    //console.log("Esto es cardArticleStore ---->", cardArticleStore)           
                    const countSearch = await modelProfile.find( {$and :[{paused : false},{ states: states}]} ).count();
                    const stateGroup = null;
                    res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });

                }
            }  

        } else if (states !== 'todos' && cities !== 'Todos'){
            console.log("caso : 3");
            console.log("cacheState", cacheState);
            console.log("states", states);
            console.log("states !== todos && cities !== Todos");
        //3. considera estado u ciudad elegida ciudades

            if (searchFirst == "#" ){
                console.log("***************************");
                console.log("::: Esto es un hashtag :::");
                console.log("Esto es Searcher :", Searcher);

                const cardArticleStore = await modelProfile.paginate( {$and : [{ hashtags: {$regex: Searcher , $options: "i" }},{ states: states},{ cities: cities },{ paused : false } ] }, options );
                //console.log("Esto es cardArticleStore ----> ",cardArticleStore);
                const countSearch = await modelProfile.find( {$and : [{paused : false },{ hashtags: {$regex: Searcher, $options: "i"}},{ states: states},{ cities: cities } ]}).count();
                console.log("::::::::: Esto es countSearch :",countSearch);
                const stateGroup = await modelProfile.aggregate([  {$match: {$and : [{hashtags: {$regex: Searcher, $options: "i"}}, {paused : false},{ states: states},{ cities: cities } ]}  },{$group: {_id : "$states", repetido: {$sum: 1}}} ]);
                console.log("aqui estados por grupo ----->:", stateGroup);

                res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
            } else {

                if (search){
                    console.log("este es el user desde la view-store: ",  user);
                    console.log("Aqui debo mostrar un resultado de consulta --->", search);
                    
                    const cardArticleStore = await modelProfile.paginate( {$and : [{ username: {$regex: Searcher , $options: "i" }},{ states: states},{ cities: cities },{ paused : false } ] }, options );
                    //console.log(cardArticleStore);
                    const countSearch = await modelProfile.find( {$and : [{paused : false },{ username: {$regex: Searcher, $options: "i"}},{ states: states},{ cities: cities } ]}).count();
                    console.log("::::::::: Esto es countSearch :",countSearch)
                    const stateGroup = await modelProfile.aggregate([  {$match: {$and : [{username: {$regex: Searcher, $options: "i"}}, {paused : false},{ states: states},{ cities: cities } ]}  },{$group: {_id : "$states", repetido: {$sum: 1}}} ]);
                    console.log("aqui estados por grupo ----->:", stateGroup);
                    res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
                                                                                        
                } else {
                    console.log("este es el user desde la view-store: ",  user);
                    const cardArticleStore = await modelProfile.paginate( {$and : [{paused : false},{ states: states},{ cities: cities }]} , options );
                    //console.log("Esto es cardArticleStore ---->", cardArticleStore)           
                    const countSearch = await modelProfile.find( {$and :[{paused : false},{ states: states},{ cities: cities }]} ).count();
                    const stateGroup = null;
                    res.render('page/view-store', { user, searchProfile, Hashtag, cardArticleStore, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });
                }
            }          

        }



   
}); 
//           view-store/a/Bolívar?page=2
routes.get('/view-store/:filtro/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let cacheSearch, cacheHashtag, cacheState, cacheCities;

    cacheSearch = req.session.cacheSearch;
    cacheHashtag = req.session.cacheHashtag;
    cacheState = req.session.state;
    cacheCities = req.session.cities;

    const Searcher = req.params.filtro;
    const State = req.params.stateprovince;
    let Hashtag = "false";
    let searchProfile;
    

    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        //console.log("Aqui el profile de la cuenta", searchProfile);
    }

    let page = req.query.page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    console.log("este es el user desde la view-services --->", user);
    console.log("Aqui debo mostrar un resultado de consulta --->", Searcher);
    console.log("Aqui debo mostrar estado del pais --->", State);

    
    const cardArticleStore= await modelProfile.paginate({$and : [{ username: {$regex: Searcher , $options: "i" }}, {states : State} ] }, options  );
    console.log("esto es cardArticleStore ---->",cardArticleStore);
    const countSearch = await modelProfile.find({$and : [{ username: {$regex: Searcher , $options: "i" }}, {states : State} ] }).count();
    const stateGroup = await modelProfile.aggregate([ {$match: {username: {$regex: Searcher, $options: "i"}}},{$group: {_id : "$states", repetido: {$sum: 1} }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    res.render('page/view-store', { user, searchProfile, cardArticleStore, Hashtag, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });


});

          
routes.get('/view-store/hashtag/:filtro/:stateprovince', async (req, res)=>{
    
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let storeError = null; //si va bien va con este valor de null pero si por el contrario pasa algo este valor cambiaria a un mensaje de error.

    let cacheSearch, cacheHashtag, cacheState, cacheCities;

    cacheSearch = req.session.cacheSearch;
    cacheHashtag = req.session.cacheHashtag;
    cacheState = req.session.state;
    cacheCities = req.session.cities;

    const Searcher = req.params.filtro;
    const State = req.params.stateprovince;
    let Hashtag = "true";
    let searchProfile;

    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        //console.log("Aqui el profile de la cuenta", searchProfile);
    }

    let page = req.query.page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    console.log("este es el user desde la view-services --->", user);
    console.log("Aqui debo mostrar un resultado de consulta --->", Searcher);
    console.log("Aqui debo mostrar estado del pais --->", State);

try {

    const cardArticleStore= await modelProfile.paginate({$and : [{ hashtags: {$regex: Searcher , $options: "i" }}, {states : State} ] }, options );
    console.log("esto es cardArticleStore ---->",cardArticleStore);
    const countSearch = await modelProfile.find({$and : [{ hashtags: {$regex: Searcher , $options: "i" }}, {states : State} ] }).count();
    const stateGroup = await modelProfile.aggregate([ {$match: {hashtags: {$regex: Searcher, $options: "i"}}},{$group: {_id : "$states", repetido: {$sum: 1} }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    res.render('page/view-store', { user, searchProfile, cardArticleStore, Hashtag, stateGroup, Searcher, countMessages, countNegotiationsBuySell, countSearch, cacheState, cacheCities, cacheSearch, cacheHashtag });

} catch (error) {
    req.session.storeError = "Ha habido un error, intente luego.";
    storeError = req.session.storeError;
    res.render('page/view-store', { storeError, user, searchProfile, Hashtag,  Searcher, countMessages, countNegotiationsBuySell, cacheState, cacheCities, cacheSearch, cacheHashtag }); 
}    


});

module.exports = routes;


