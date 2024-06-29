/*
const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelNautical = require('../models/nautical.js');
const modelMessages = require('../models/messages.js');
const modelProfile = require('../models/profile.js');

routes.get('/view-nautical', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell
    const subCategory = null; 

    const searcher = req.query.search;
    req.session.search = searcher;
    const Searcher = req.session.search;
    delete req.session.search;
    let searchProfile;

    const page = req.query.page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }
        
    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
    }
    
    console.log("Aqui los parametros --->",req.params);

    console.log("este es el user desde la view-nautical: ",  user);
    const cardArticleNautical = await modelNautical.paginate({paused : false }, options);
    const countSearch = await modelNautical.find({paused : false }).count();
    const stateGroup = null;
    const categoryAndSub = await modelNautical.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch })
      
}); 

routes.post('/view-nautical/', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    console.log(":::: view-nautical ::::")
    console.log(req.body);
    const { searcher, category, subCategory } = req.body;
    console.log("searcher ----> ",searcher);
    console.log("category ----> ",category);
    console.log("subCategory ----> ",subCategory);

    req.session.search = searcher;
    const Searcher = req.session.search;
    delete req.session.search;
    console.log(":::: Esto es type searcher ::::", typeof searcher );
    console.log(":::: Esto es type category ::::", typeof category );
    console.log(":::: Esto es type subCategory ::::", typeof subCategory );
    
    let searchProfile;
    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
    }

    let page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    if (category == "All"){

        const cardArticleNautical = await modelNautical.paginate( {$and : [{ title: {$regex: searcher , $options: "i" }},{ paused : false } ] }, options );       
        console.log(":::-- Aqui cardArticleNautical --:::", cardArticleNautical);
        const countSearch = await modelNautical.find( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}} ]}).count();
        console.log("|||||:::::::: Esto es countSearch", countSearch);
        const stateGroup = await modelNautical.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {title: {$regex: Searcher, $options: "i"}} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" } }} ]);
        console.log("aqui estados por grupo :", stateGroup);
        const categoryAndSub = await modelNautical.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        let subCategory = null;       
        res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch });    


    } else if (category !== "All" && category !== undefined) {
        
        if (subCategory == "All"){

            const cardArticleNautical = await modelNautical.paginate( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}}, { category } ]}  , options);
            const countSearch = await modelNautical.find( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}}, { category } ]}).count();
            const stateGroup = await modelNautical.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {category}]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
            console.log("aqui estados por grupo :", stateGroup);
            const categoryAndSub = await modelNautical.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
            console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
    
            res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch })

        } else {

            const cardArticleNautical = await modelNautical.paginate( {$and : [{paused : false }, {title: {$regex: Searcher, $options: "i"}}, { category }, { sub_category : subCategory } ]}  , options);
            const countSearch = await modelNautical.find( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}}, { category }, { sub_category : subCategory } ]}).count();
            const stateGroup = await modelNautical.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {category}, { sub_category : subCategory }]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
            console.log("::: Aqui estados por grupo :", stateGroup);
            const categoryAndSub = await modelNautical.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
            console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);           
           
            //db.services.aggregate([ { $match: { category } }, { $group: { _id: "$category", subcategorias: { $addToSet: "$sub_category" }}}])

            res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch })

        }
       
    }
        
});    

// type : 1 con Searcher           
routes.get('/view-nautical/type1/:searcher/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const Searcher = req.params.searcher;
    const State = req.params.stateprovince;
    let subCategory = null;
    let searchProfile;
        
    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
    }

    let page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    console.log("este es el user desde la view-nautical: ",  user);
    console.log("Aqui debo mostrar un resultado de consulta --->", Searcher);
    
    const cardArticleNautical = await modelNautical.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }}, {state_province : State} ] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [{ title: {$regex: Searcher , $options: "i" }}, {state_province : State} ] }).count();
    const stateGroup = await modelNautical.aggregate([ {$match: {title: {$regex: Searcher, $options: "i"}}},{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch });
});

// type : 1 sin Searcher           
routes.get('/view-nautical/type1/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let Searcher = "";
    const State = req.params.stateprovince;
    let subCategory = null;
    let searchProfile;
        
    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
    }

    let page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    console.log("este es el user desde la view-nautical: ",  user);
    console.log("Aqui debo mostrar un resultado de consulta --->", Searcher);
    
    const cardArticleNautical = await modelNautical.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }}, {state_province : State} ] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [{ title: {$regex: Searcher , $options: "i" }}, {state_province : State} ] }).count();
    const stateGroup = await modelNautical.aggregate([ {$match: {title: {$regex: Searcher, $options: "i"}}},{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch });
});

// type : 2 con Searcher           
routes.get('/view-nautical/type2/:searcher/:category/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const Searcher = req.params.searcher;
    const category = req.params.category;
    const subCategory = "All";
    const State = req.params.stateprovince;
    let searchProfile;
        
    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
    }

    let page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    console.log("este es el user desde la view-nautical: ",  user);
    console.log("Aqui debo mostrar un resultado de Searcher --->", Searcher);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    
    const cardArticleNautical = await modelNautical.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }}, { category }, {state_province : State} ] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [{ title: {$regex: Searcher , $options: "i" }}, { category }, {state_province : State} ] }).count(); 
    const stateGroup = await modelNautical.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {category}]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $match: {$and : [ {title: {$regex: Searcher , $options: "i" }}, { category }]} }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch });
});

// type : 2 sin Searcher           
routes.get('/view-nautical/type2/:category/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let Searcher ="";
    const category = req.params.category;
    const subCategory = "All";
    const State = req.params.stateprovince;
    let searchProfile;
        
    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
    }

    let page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    console.log("este es el user desde la view-nautical: ",  user);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    console.log("Estamos en type 2 sin Search")
    
    const cardArticleNautical = await modelNautical.paginate({$and : [{ category }, {state_province : State} ] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [{ category }, {state_province : State} ] }).count();
    const stateGroup = await modelNautical.aggregate([ { $match: {category} } ,{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch });
});

// type : 3 con Searcher           
routes.get('/view-nautical/type3/:searcher/:category/:sub_category/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const Searcher = req.params.searcher;
    const category = req.params.category;
    const subCategory = req.params.sub_category;
    const State = req.params.stateprovince;
    let searchProfile;
        
    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
    }

    let page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    console.log("este es el user desde la view-nautical: ",  user);
    console.log("Aqui debo mostrar un resultado de Searcher --->", Searcher);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    
    const cardArticleNautical = await modelNautical.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }}, { category }, { sub_category: subCategory }, {state_province : State} ] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [{ title: {$regex: Searcher , $options: "i" }}, { category }, { sub_category: subCategory }, {state_province : State} ] }).count();
    const stateGroup = await modelNautical.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {category}, { sub_category: subCategory }, {state_province : State} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $match: { $and : [ { title: {$regex: Searcher , $options: "i" }}, { category }, { sub_category: subCategory }, {state_province : State}]} }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch });
});

// type : 3 sin Searcher           
routes.get('/view-nautical/type3/:category/:sub_category/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let Searcher = "";
    const category = req.params.category;
    const subCategory = req.params.sub_category;
    const State = req.params.stateprovince;
    let searchProfile;
        
    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
    }

    let page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    console.log("este es el user desde la view-nautical: ",  user);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    console.log("Aqui debo mostrar un resultado de Searcher --->", Searcher);
    console.log(" :::::::Mirar los resultados sobre todo el objeto stateGroup :::::::::::");

          
    const cardArticleNautical = await modelNautical.paginate({$and : [ { category }, { sub_category: subCategory }, {state_province : State} ] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [ { category }, { sub_category: subCategory }, {state_province : State} ] }).count();
    const stateGroup = await modelNautical.aggregate([ {$match: {$and: [ {category}, { sub_category: subCategory }, {state_province : State} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $match: { $and : [{ category }, { sub_category: subCategory }, {state_province : State}]} }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, Searcher, stateGroup, categoryAndSub, subCategory, countMessages, countNegotiationsBuySell, countSearch });
});


module.exports = routes;

*/

// nuevo codigo. 
const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelNautical = require('../models/nautical.js');
const modelMessages = require('../models/messages.js');
const modelProfile = require('../models/profile.js');

routes.get('/view-nautical/', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell
    const subCategory = null; 
    
    const searcher = req.query.search;
    req.session.search = searcher;
    const Searcher = req.session.search;

    const searcherCache = req.session.searcherCache;
    console.log("*****************searcherCache***************");
    console.log("searcherCache ------------------------>", searcherCache);

    //delete req.session.search;
    let searchProfile;

    const page = req.query.page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
    }
   
    console.log("este es el user desde la view-items: ",  user);
    if ( searcherCache ){
        console.log("Estoy en el seccion que tiene valor el seracherCache", searcherCache);
        cardArticleNautical = await modelNautical.paginate( {$and : [{ title: {$regex: searcherCache , $options: "i" }},{ paused : false } ] }, options );       
        //console.log(":::-- Aqui cardArticleNautical --:::", cardArticleNautical)
        const countSearch = await modelNautical.find( {$and : [{paused : false },{title: {$regex: searcherCache, $options: "i"}} ]}).count();
        const stateGroup = null;
        const categoryAndSub = await modelNautical.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
    
        res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
    
    } else {
        const searcherCache = null;
        const cardArticleNautical = await modelNautical.paginate({paused : false }, options);
        const countSearch = await modelNautical.find({paused : false }).count();
        const stateGroup = null;
        const categoryAndSub = await modelNautical.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
    
        res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
    
    }
   
});


routes.post('/view-nautical/', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    console.log(":::: view-items ::::")
    console.log(req.body);
    const { searcher, category, subCategory } = req.body;
    console.log("searcher ----> ",searcher);
    console.log("category ----> ",category);
    console.log("subCategory ----> ",subCategory);

    req.session.search = searcher;
    const Searcher = req.session.search;
    //delete req.session.search;
    console.log(":::: Esto es type searcher ::::", typeof searcher );
    console.log(":::: Esto es type category ::::", typeof category );
    console.log(":::: Esto es type subCategory ::::", typeof subCategory );

    req.session.searcherCache = Searcher;
    let searcherCache = req.session.searcherCache;
    
    let searchProfile;
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

    if (category == "All" && searcher ===""){

        console.log("************ searcherCache ************")
        console.log("searcherCache ---->", searcherCache);

        const cardArticleNautical = await modelNautical.paginate( {$and : [{ title: {$regex: Searcher , $options: "i" }},{ paused : false } ] }, options );       
        console.log(":::-- Aqui cardArticleNautical --:::", cardArticleNautical);
        const countSearch = await modelNautical.find( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}} ]}).count();
        const stateGroup = await modelNautical.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {title: {$regex: Searcher, $options: "i"}} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" } }} ]);
        console.log("aqui estados por grupo :", stateGroup);
        const categoryAndSub = await modelNautical.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        let subCategory = null  

        res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache })
  
    } else if (category == "All" && searcher !== "") { 
  
        console.log("************ searcherCache ************")
        console.log("searcherCache ---->", searcherCache);
        
        const cardArticleNautical = await modelNautical.paginate( {$and : [{ title: {$regex: Searcher , $options: "i" }},{ paused : false } ] }, options );       
        //console.log(":::-- Aqui cardArticleNautical --:::", cardArticleNautical);
        const countSearch = await modelNautical.find( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}} ]}).count();
        console.log("|||||:::::::: Esto es countSearch", countSearch);
        const stateGroup = await modelNautical.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {title: {$regex: Searcher, $options: "i"}} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" } }} ]);
        //console.log("aqui estados por grupo :", stateGroup);
        const categoryAndSub = await modelNautical.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        let subCategory = null;  
        //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
            
        res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });    
    

    } else if (category !== "All" && category !== undefined && searcher !=="") {
        
        if (subCategory == "All"){
                                                             
            const cardArticleNautical = await modelNautical.paginate( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}}, { category } ]}  , options);
            const countSearch = await modelNautical.find( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}}, { category } ]}).count();
            const stateGroup = await modelNautical.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {category}]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
            console.log("aqui estados por grupo :", stateGroup);
            const categoryAndSub = await modelNautical.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
            console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
    
            res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache })

        } else {

            const cardArticleNautical = await modelNautical.paginate( {$and : [{paused : false }, {title: {$regex: Searcher, $options: "i"}}, { category } ]}  , options);
            const countSearch = await modelItems.find( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}}, { category } ]}).count();
            const stateGroup = await modelItems.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {category}]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
            console.log("::: Aqui estados por grupo :", stateGroup);
            const categoryAndSub = await modelItems.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
            console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);           

            res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache })

        }

    } else if (category !== "All" && category !== undefined && searcher ==="") {

        if (subCategory == "All"){
            console.log("****Estamos en esta condicion cuando esta el buscador vacio ****");
            console.log("subCategory == All");
            const cardArticleNautical = await modelNautical.paginate( {$and : [{paused : false }, { category } ]}  , options);
            const countSearch = await modelNautical.find( {$and : [{paused : false }, { category } ]}).count();
            const stateGroup = await modelNautical.aggregate([ {$match: {$and: [ {category}]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
            console.log("aqui estados por grupo :", stateGroup);
            const categoryAndSub = await modelNautical.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
            console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
    
            res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache })

        } else {
            console.log("****Estamos en esta condicion cuando esta el buscador vacio ****");
            console.log("subCategory !== All");
            const cardArticleNautical = await modelNautical.paginate( {$and : [{paused : false }, { category } ]}  , options);
            console.log("Ver cardArticleNautical : ", cardArticleNautical)
            const countSearch = await modelNautical.find( {$and : [{paused : false },{ category } ]}).count();
            const stateGroup = await modelNautical.aggregate([ {$match: {$and: [{category} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
            console.log("::: Aqui estados por grupo :", stateGroup);
            const categoryAndSub = await modelNautical.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
            console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);           

            res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache })

        }        
    }
     
});    

// view-items/type1/algo/Bolívar
// view-items/type1/algo/Bolívar?page=2
// type : 1 con Searcher y estado   
routes.get('/view-nautical/type1/:searcher/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const Searcher = req.params.searcher;
    const State = req.params.stateprovince;
    let subCategory = null;
    let searchProfile;

    req.session.searcherCache = Searcher;
    let searcherCache = req.session.searcherCache;
        
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

    console.log("este es el user desde la view-artes: ",  user);
    console.log("Aqui debo mostrar un resultado de consulta --->", Searcher);

    const cardArticleNautical = await modelNautical.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }}, {state_province : State} ] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [{ title: {$regex: Searcher , $options: "i" }}, {state_province : State} ] }).count();
    const stateGroup = await modelNautical.aggregate([ {$match: {title: {$regex: Searcher, $options: "i"}}},{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
});

// view-items/type1/Bolívar?page=2
// type : 1 sin Searcher    cuando es sin searcher searcherCache = null;     
routes.get('/view-nautical/type1/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let Searcher = "";
    const State = req.params.stateprovince;
    const searcherCache = null;
    let subCategory = null;
    let searchProfile;
        
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

    console.log("este es el user desde la view-artes: ",  user);
    console.log("Aqui debo mostrar un resultado de consulta --->", Searcher);

    const cardArticleNautical = await modelNautical.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }}, {state_province : State} ] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [{ title: {$regex: Searcher , $options: "i" }}, {state_province : State} ] }).count();
    const stateGroup = await modelNautical.aggregate([ {$match: {title: {$regex: Searcher, $options: "i"}}},{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
});

// type : 2 con Searcher           
routes.get('view-nautical/type2/:searcher/:category/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const Searcher = req.params.searcher;
    const category = req.params.category;
    const subCategory = "All";
    const State = req.params.stateprovince;
    let searchProfile;

    req.session.searcherCache = Searcher;
    let searcherCache = req.session.searcherCache;   
        
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

    console.log("este es el user desde la view-services: ",  user);
    console.log("Aqui debo mostrar un resultado de Searcher --->", Searcher);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    
    const cardArticleNautical = await modelNautical.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }}, { category }, {state_province : State} ] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [{ title: {$regex: Searcher , $options: "i" }}, { category }, {state_province : State} ] }).count(); 
    const stateGroup = await modelNautical.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {category}]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $match: {$and : [ {title: {$regex: Searcher , $options: "i" }}, { category }]} }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
});

// type : 2 sin Searcher con estado
// /view-items/type2/Category/Bolívar?page=2      
routes.get('/view-nautical/type2/:category/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let Searcher ="";
    const category = req.params.category;
    const subCategory = "All";
    const searcherCache = null;
    const State = req.params.stateprovince;
    let searchProfile;
        
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

    console.log("este es el user desde la view-services: ",  user);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    console.log("Estamos en type 2 sin Search")
    
    const cardArticleNautical = await modelNautical.paginate({$and : [{ category }, {state_province : State} ] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [{ category }, {state_province : State} ] }).count();
    const stateGroup = await modelNautical.aggregate([ { $match: {category} } ,{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
});

// type2 sin search y sin distincion de estado
routes.get('/view-nautical/type2/:category/', async (req, res)=>{
    console.log("type2 sin distincion de estado");
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let Searcher ="";
    const category = req.params.category;
    const subCategory = "All";
    const searcherCache = null;
    let searchProfile;
        
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

    console.log("este es el user desde la view-services: ",  user);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    console.log("Estamos en type 2 sin Search ni estados");
    
     
    const cardArticleNautical = await modelNautical.paginate({ category }, options );
    console.log("cardArticleNautical :", cardArticleNautical);
    const countSearch = await modelNautical.find({ category }).count();
    console.log("countSearch --->", countSearch);
    const stateGroup = await modelNautical.aggregate([ { $match: {category} } ,{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleItems, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });

});


// type : 3 con Searcher 
//           view-items/type3/algo/categoria/sub?categoria/Bolívar?page=2          
routes.get('/view-nautical/type3/:searcher/:category/:sub_category/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const Searcher = req.params.searcher;
    const category = req.params.category;
    const subCategory = req.params.sub_category;
    const State = req.params.stateprovince;

    req.session.searcherCache = Searcher;
    let searcherCache = req.session.searcherCache;

    let searchProfile;
        
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

    console.log("este es el user desde la view-artes: ",  user);
    console.log("Aqui debo mostrar un resultado de Searcher --->", Searcher);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    
    const cardArticleNautical = await modelNautical.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }}, { category }, { sub_category: subCategory }, {state_province : State} ] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [{ title: {$regex: Searcher , $options: "i" }}, { category }, { sub_category: subCategory }, {state_province : State} ] }).count();
    const stateGroup = await modelNautical.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {category}, { sub_category: subCategory }, {state_province : State} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $match: { $and : [ { title: {$regex: Searcher , $options: "i" }}, { category }, { sub_category: subCategory }, {state_province : State}]} }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
});

// type : 3 sin Searcher con estado                    
routes.get('/view-nautical/type3/:category/:sub_category/:stateprovince', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let Searcher = "";
    const category = req.params.category;
    const subCategory = req.params.sub_category;
    const searcherCache = null;
    const State = req.params.stateprovince;
    let searchProfile;
        
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

    console.log("este es el user desde la view-artes: ",  user);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    console.log("Aqui debo mostrar un resultado de Searcher --->", Searcher);
    console.log(" :::::::Mirar los resultados sobre todo el objeto stateGroup :::::::::::");

          
    const cardArticleNautical = await modelNautical.paginate({$and : [ { category }, { sub_category: subCategory }, {state_province : State} ] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [ { category }, { sub_category: subCategory }, {state_province : State} ] }).count();
    const stateGroup = await modelNautical.aggregate([ {$match: {$and: [ {category}, { sub_category: subCategory }, {state_province : State} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $match: { $and : [{ category }, { sub_category: subCategory }, {state_province : State}]} }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, Searcher, stateGroup, categoryAndSub, subCategory, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
});

// type3 sin Searcher y sin distincion de estado         
routes.get('/view-nautical/type3/:category/:sub_category/', async (req, res)=>{
    console.log("type3 sin distincion de estado");
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let Searcher = "";
    const category = req.params.category;
    const subCategory = req.params.sub_category;
    const searcherCache = null;
    let searchProfile;
        
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

    console.log("este es el user desde la view-artes: ",  user);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    console.log(" :::::::Mirar los resultados sobre todo el objeto stateGroup :::::::::::");

  
    const cardArticleNautical = await modelNautical.paginate({$and : [ { category }, { sub_category: subCategory }] }, options  );
    console.log(cardArticleNautical);
    const countSearch = await modelNautical.find({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category }, { sub_category: subCategory }] }).count();
    const stateGroup = await modelNautical.aggregate([ {$match: {$and: [ {category}, { sub_category: subCategory } ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelNautical.aggregate([ { $match: { $and : [{ category }, { sub_category: subCategory }]} }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-nautical', { user, searchProfile, cardArticleNautical, Searcher, stateGroup, categoryAndSub, subCategory, countMessages, countNegotiationsBuySell, countSearch, searcherCache });

    

});

module.exports = routes;