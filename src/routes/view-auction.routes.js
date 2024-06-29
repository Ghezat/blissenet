const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelAuction = require('../models/auction.js');
const modelMessages = require('../models/messages.js');
const modelProfile = require('../models/profile.js');
            


routes.get('/view-auction/', async (req, res)=>{
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
   
    console.log("este es el user desde la view-auction: ",  user);
    if ( searcherCache ){
        console.log("Estoy en el seccion que tiene valor el seracherCache", searcherCache);
        const cardArticleAuction = await modelAuction.paginate( {$and : [{ title: {$regex: searcherCache , $options: "i" }},{ paused : false } ] }, options );       
        //console.log(":::-- Aqui cardArticleAuction --:::", cardArticleAuction)
        const countSearch = await modelAuction.find( {$and : [{paused : false },{title: {$regex: searcherCache, $options: "i"}} ]}).count();
        const stateGroup = null;
        const categoryAndSub = await modelAuction.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
    
        res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
    
    } else {
        const searcherCache = null;
        const cardArticleAuction = await modelAuction.paginate({paused : false }, options);
        const countSearch = await modelAuction.find({paused : false }).count();
        const stateGroup = null;
        const categoryAndSub = await modelAuction.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
    
        res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
    
    }
   
});


routes.post('/view-auction/', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    console.log(":::: view-auction ::::")
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

        const cardArticleAuction = await modelAuction.paginate( {$and : [{ title: {$regex: Searcher , $options: "i" }},{ paused : false } ] }, options );       
        console.log(":::-- Aqui cardArticleAuction --:::", cardArticleAuction);
        const countSearch = await modelAuction.find( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}} ]}).count();
        const stateGroup = await modelAuction.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {title: {$regex: Searcher, $options: "i"}} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" } }} ]);
        console.log("aqui estados por grupo :", stateGroup);
        const categoryAndSub = await modelAuction.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
        let subCategory = null  

        res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache })
  
    } else if (category == "All" && searcher !== "") { 
  
        console.log("************ searcherCache ************")
        console.log("searcherCache ---->", searcherCache);

        const cardArticleAuction = await modelAuction.paginate( {$and : [{ title: {$regex: Searcher , $options: "i" }},{ paused : false } ] }, options );       
        //console.log(":::-- Aqui cardArticleAuction --:::", cardArticleAuction);
        const countSearch = await modelAuction.find( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}} ]}).count();
        console.log("|||||:::::::: Esto es countSearch", countSearch);
        const stateGroup = await modelAuction.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {title: {$regex: Searcher, $options: "i"}} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" } }} ]);
        //console.log("aqui estados por grupo :", stateGroup);
        const categoryAndSub = await modelAuction.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
        let subCategory = null;  
        //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
            
        res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });    
    

    } else if (category !== "All" && category !== undefined && searcher !=="") {
        
        if (subCategory == "All"){
                                                             
            const cardArticleAuction = await modelAuction.paginate( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}}, { category } ]}  , options);
            const countSearch = await modelAuction.find( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}}, { category } ]}).count();
            const stateGroup = await modelAuction.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {category}]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
            console.log("aqui estados por grupo :", stateGroup);
            const categoryAndSub = await modelAuction.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
            console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
    
            res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache })

        } else {

            const cardArticleAuction = await modelAuction.paginate( {$and : [{paused : false }, {title: {$regex: Searcher, $options: "i"}}, { category } ]}  , options);
            const countSearch = await modelAuction.find( {$and : [{paused : false },{title: {$regex: Searcher, $options: "i"}}, { category } ]}).count();
            const stateGroup = await modelAuction.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {category}]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
            console.log("::: Aqui estados por grupo :", stateGroup);
            const categoryAndSub = await modelAuction.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
            console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);           

            res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache })

        }

    } else if (category !== "All" && category !== undefined && searcher ==="") {

        if (subCategory == "All"){
            console.log("****Estamos en esta condicion cuando esta el buscador vacio ****");
            console.log("subCategory == All");
            const cardArticleAuction = await modelAuction.paginate( {$and : [{paused : false }, { category } ]}  , options);
            const countSearch = await modelAuction.find( {$and : [{paused : false }, { category } ]}).count();
            const stateGroup = await modelAuction.aggregate([ {$match: {$and: [ {category}]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
            console.log("aqui estados por grupo :", stateGroup);
            const categoryAndSub = await modelAuction.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
            console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
    
            res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache })

        } else {
            console.log("****Estamos en esta condicion cuando esta el buscador vacio ****");
            console.log("subCategory !== All");
            const cardArticleAuction = await modelAuction.paginate( {$and : [{paused : false }, { category } ]}  , options);
            console.log("Ver cardArticleAuction : ", cardArticleAuction)
            const countSearch = await modelAuction.find( {$and : [{paused : false },{ category } ]}).count();
            const stateGroup = await modelAuction.aggregate([ {$match: {$and: [{category} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
            console.log("::: Aqui estados por grupo :", stateGroup);
            const categoryAndSub = await modelAuction.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
            console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);           

            res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache })

        }        
    }
     
});    

// view-items/type1/algo/Bolívar
// view-items/type1/algo/Bolívar?page=2
// type : 1 con Searcher y estado   
routes.get('/view-auction/type1/:searcher/:stateprovince', async (req, res)=>{
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

    console.log("este es el user desde la view-auction: ",  user);
    console.log("Aqui debo mostrar un resultado de consulta --->", Searcher);

    const cardArticleAuction = await modelAuction.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }}, {state_province : State} ] }, options  );
    console.log(cardArticleAuction);
    const countSearch = await modelAuction.find({$and : [{ title: {$regex: Searcher , $options: "i" }}, {state_province : State} ] }).count();
    const stateGroup = await modelAuction.aggregate([ {$match: {title: {$regex: Searcher, $options: "i"}}},{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelAuction.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
});

// view-items/type1/Bolívar?page=2
// type : 1 sin Searcher    cuando es sin searcher searcherCache = null;     
routes.get('/view-auction/type1/:stateprovince', async (req, res)=>{
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

    console.log("este es el user desde la view-auction: ",  user);
    console.log("Aqui debo mostrar un resultado de consulta --->", Searcher);

    const cardArticleAuction = await modelAuction.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }}, {state_province : State} ] }, options  );
    console.log(cardArticleAuction);
    const countSearch = await modelAuction.find({$and : [{ title: {$regex: Searcher , $options: "i" }}, {state_province : State} ] }).count();
    const stateGroup = await modelAuction.aggregate([ {$match: {title: {$regex: Searcher, $options: "i"}}},{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelAuction.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
});

// type : 2 con Searcher           
routes.get('view-auction/type2/:searcher/:category/:stateprovince', async (req, res)=>{
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

    console.log("este es el user desde la view-auction: ",  user);
    console.log("Aqui debo mostrar un resultado de Searcher --->", Searcher);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    
    const cardArticleAuction = await modelAuction.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }}, { category }, {state_province : State} ] }, options  );
    console.log(cardArticleAuction);
    const countSearch = await modelAuction.find({$and : [{ title: {$regex: Searcher , $options: "i" }}, { category }, {state_province : State} ] }).count(); 
    const stateGroup = await modelAuction.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {category}]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelAuction.aggregate([ { $match: {$and : [ {title: {$regex: Searcher , $options: "i" }}, { category }]} }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
});

// type : 2 sin Searcher con estado
// /view-items/type2/Category/Bolívar?page=2      
routes.get('/view-auction/type2/:category/:stateprovince', async (req, res)=>{
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

    console.log("este es el user desde la view-auction: ",  user);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    console.log("Estamos en type 2 sin Search")
    
    const cardArticleAuction = await modelAuction.paginate({$and : [{ category }, {state_province : State} ] }, options  );
    console.log(cardArticleAuction);
    const countSearch = await modelAuction.find({$and : [{ category }, {state_province : State} ] }).count();
    const stateGroup = await modelAuction.aggregate([ { $match: {category} } ,{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelAuction.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
});

// type2 sin search y sin distincion de estado
routes.get('/view-auction/type2/:category/', async (req, res)=>{
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

    console.log("este es el user desde la view-auction: ",  user);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    console.log("Estamos en type 2 sin Search ni estados");
    
     
    const cardArticleAuction = await modelAuction.paginate({ category }, options );
    console.log("cardArticleAuction :", cardArticleAuction);
    const countSearch = await modelAuction.find({ category }).count();
    console.log("countSearch --->", countSearch);
    const stateGroup = await modelAuction.aggregate([ { $match: {category} } ,{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, type: { $first: "2" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelAuction.aggregate([ { $match: { category } }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });

});


// type : 3 con Searcher 
//           view-items/type3/algo/categoria/sub?categoria/Bolívar?page=2          
routes.get('/view-auction/type3/:searcher/:category/:sub_category/:stateprovince', async (req, res)=>{
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

    console.log("este es el user desde la view-auction: ",  user);
    console.log("Aqui debo mostrar un resultado de Searcher --->", Searcher);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    
    const cardArticleAuction = await modelAuction.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }}, { category }, { sub_category: subCategory }, {state_province : State} ] }, options  );
    console.log(cardArticleAuction);
    const countSearch = await modelAuction.find({$and : [{ title: {$regex: Searcher , $options: "i" }}, { category }, { sub_category: subCategory }, {state_province : State} ] }).count();
    const stateGroup = await modelAuction.aggregate([ {$match: {$and: [{title: {$regex: Searcher, $options: "i"}}, {category}, { sub_category: subCategory }, {state_province : State} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelAuction.aggregate([ { $match: { $and : [ { title: {$regex: Searcher , $options: "i" }}, { category }, { sub_category: subCategory }, {state_province : State}]} }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-auction', { user, searchProfile, cardArticleAuction, stateGroup, categoryAndSub, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
});

// type : 3 sin Searcher con estado                    
routes.get('/view-auction/type3/:category/:sub_category/:stateprovince', async (req, res)=>{
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

    console.log("este es el user desde la view-auction: ",  user);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    console.log("Aqui debo mostrar un resultado de Searcher --->", Searcher);
    console.log(" :::::::Mirar los resultados sobre todo el objeto stateGroup :::::::::::");

          
    const cardArticleAuction = await modelAuction.paginate({$and : [ { category }, { sub_category: subCategory }, {state_province : State} ] }, options  );
    console.log(cardArticleAuction);
    const countSearch = await modelAuction.find({$and : [ { category }, { sub_category: subCategory }, {state_province : State} ] }).count();
    const stateGroup = await modelAuction.aggregate([ {$match: {$and: [ {category}, { sub_category: subCategory }, {state_province : State} ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelAuction.aggregate([ { $match: { $and : [{ category }, { sub_category: subCategory }, {state_province : State}]} }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-auction', { user, searchProfile, cardArticleAuction, Searcher, stateGroup, categoryAndSub, subCategory, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
});

// type3 sin Searcher y sin distincion de estado         
routes.get('/view-auction/type3/:category/:sub_category/', async (req, res)=>{
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

    console.log("este es el user desde la view-auction: ",  user);
    console.log("Aqui debo mostrar un resultado de Category --->", category);
    console.log(" :::::::Mirar los resultados sobre todo el objeto stateGroup :::::::::::");

  
    const cardArticleAuction = await modelAuction.paginate({$and : [ { category }, { sub_category: subCategory }] }, options  );
    console.log(cardArticleAuction);
    const countSearch = await modelAuction.find({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category }, { sub_category: subCategory }] }).count();
    const stateGroup = await modelAuction.aggregate([ {$match: {$and: [ {category}, { sub_category: subCategory } ]} },{$group: {_id : "$state_province", repetido: {$sum: 1}, category: { $first: "$category" }, sub_category: { $first: "$sub_category" }, type: { $first: "3" } }} ]);
    console.log("aqui estados por grupo :", stateGroup);
    const categoryAndSub = await modelAuction.aggregate([ { $match: { $and : [{ category }, { sub_category: subCategory }]} }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}]);
    console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

    res.render('page/view-auction', { user, searchProfile, cardArticleAuction, Searcher, stateGroup, categoryAndSub, subCategory, countMessages, countNegotiationsBuySell, countSearch, searcherCache });

    

});

module.exports = routes;