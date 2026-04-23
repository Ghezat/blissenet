const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelItems = require('../models/items.js');
const modelMessages = require('../models/messages.js');
const modelProfile = require('../models/profile.js');
const modelFavorites = require('../models/favorites.js');

// Restructuracion de los mercados ya que es muy complicaco de entender y mantener.
// inicio de mejoras v3 
// 10 de abril 2026
// 17 de abril murio el señor omar el papa de leidy. 

routes.get('/view-itemsX/', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell
    const subCategory = null; 
    const boxRange = null;
    let Range = null;
    
    const searcher = req.query.search;
    req.session.search = searcher;
    const Searcher = req.session.search;

    const searcherCache = req.session.searcherCache;
    console.log("*****************searcherCache***************");
    console.log("searcherCache ------------------------>", searcherCache);
    //           searcherCache ------------------------> robot

    //delete req.session.search;
    let searchProfile;

    const page = req.query.page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    console.log("  get  /view-itemsX  -------------------------------------------------| ");

    if (user){
        //console.log("Esto es user._id ------>", user._id );
        countryMarketCode = user.seeMarket.countryMarketCode;

        searchProfile = await modelProfile.find({ indexed : user._id });
        //console.log("Aqui el profile de la cuenta", searchProfile);   
        //console.log("este es el user desde la view-items: ",  user);

        const favoritesOfUser = await modelFavorites.find({indexed:user._id }); //todos los favoritos de este usuario,
        //console.log("favoritesOfUser ....... :", favoritesOfUser);
        
        if ( searcherCache ){

            //console.log("Estoy en el seccion que tiene valor el seracherCache", searcherCache);
            const cardArticleItems = await modelItems.paginate( {$and : [ { title: {$regex: searcherCache , $options: "i" }},{ countryCode : countryMarketCode } ] }, options );
            //const countSearch = await modelItems.find( {$and : [ { countryCode : countryMarketCode } ] }).count();
            const stateGroup = null;
            const categoryAndSub = null;
            const Categories = await modelItems.aggregate([ {$match: { title: {$regex: searcherCache , $options: "i" }, countryCode : countryMarketCode }}, { $group: { _id: "$category" }}, { $project: { _id: 0, category: "$_id" }}]);

            Categories.sort((a,b) => a.category.localeCompare(b.category) );
            console.log("Categories ----> :", Categories);

            res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
        
        } else {

            const searcherCache = null;
            const cardArticleItems = await modelItems.paginate( {$and : [ { countryCode : countryMarketCode } ] }, options );
            //const countSearch = await modelItems.find( {$and : [ { countryCode : countryMarketCode } ] }).count();
            const stateGroup = null;
            const categoryAndSub = null;
            const Categories = await modelItems.aggregate([ {$match: {countryCode : countryMarketCode} } ,{ $group: { _id: "$category" }}, { $project: { _id: 0, category: "$_id" }}]);

            Categories.sort((a,b) => a.category.localeCompare(b.category) );
            console.log("Categories ----> :", Categories);

            res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
        
        }

    }  else {

        if ( searcherCache ){
            //console.log("Estoy en el seccion que tiene valor el seracherCache", searcherCache);
            const cardArticleItems = await modelItems.paginate( {$and : [{ title: {$regex: searcherCache , $options: "i" }} ] }, options );       
            //console.log(":::-- Aqui cardArticleItems --:::", cardArticleItems)
            //const countSearch = await modelItems.find( {$and : [ {title: {$regex: searcherCache, $options: "i"}} ]}).count();
            const stateGroup = null;
            const categoryAndSub = null;
            const Categories = await modelItems.aggregate([ {$match: { title: {$regex: searcherCache , $options: "i" }} } ,{ $group: { _id: "$category" }}, { $project: { _id: 0, category: "$_id" }}]);
            //const categoryAndSub = await modelItems.aggregate([ { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
            //ordenar con el metodo sort();
            Categories.sort((a,b) => a.category.localeCompare(b.category) );
            console.log("Categories ----> :", Categories);
        
            res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
        
        } else {


            const searcherCache = null;
            const cardArticleItems = await modelItems.paginate( {}, options );
            //const countSearch = await modelItems.find().count();
            const stateGroup = null;
            const categoryAndSub = null;
            const Categories = await modelItems.aggregate([ { $group: { _id: "$category" }}, { $project: { _id: 0, category: "$_id" }}]);

            Categories.sort((a,b) => a.category.localeCompare(b.category) );
            console.log("Categories ----> :", Categories);
        
            res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
        
        }
    } 
   
}); 

routes.post('/view-itemsX/', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    //console.log(":::: view-items ::::")
    //console.log(req.body);
    const { searcher } = req.body;
    console.log("searcher ----> ",searcher);

    //searcher ---->  iphone
    
    req.session.search = searcher;
    const Searcher = req.session.search;
    //delete req.session.search;
    //console.log(":::: Esto es type searcher ::::", typeof searcher );

    req.session.searcherCache = Searcher;
    let searcherCache = req.session.searcherCache;

    let searchProfile;
    const boxRange = null;
    let Range = null;

    let page = req.query.page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    console.log("  post  /view-itemsX  -------------------------------------------------| ");


    console.log("searcherCache --------------------:", searcherCache);
    //           searcherCache --------------------: iphone
   
    if (user){
        //console.log("Esto es user._id ------>", user._id );
        countryMarketCode = user.seeMarket.countryMarketCode;

        searchProfile = await modelProfile.find({ indexed : user._id });
        //console.log("Aqui el profile de la cuenta", searchProfile);
    
        const favoritesOfUser = await modelFavorites.find({indexed:user._id }); //todos los favoritos de este usuario,
        //console.log("favoritesOfUser ....... :", favoritesOfUser);
         

        if (searcherCache ===""){

            //console.log("************ searcherCache ************")
            //console.log("searcherCache ---->", searcherCache);

            const cardArticleItems = await modelItems.paginate( {$and : [{ countryCode : countryMarketCode } ] }, options );      
            //console.log(":::-- Aqui cardArticleItems --:::", cardArticleItems);
            //const countSearch = await modelItems.find().count();
            // const stateGroup = await modelItems.aggregate([ {$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" } }} ]); viejo
            //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
            const Categories = await modelItems.aggregate([ {$match : { countryCode : countryMarketCode }}, { $group: { _id: "$category" }}, { $project: { _id: 0, category: "$_id" }}]);
            const stateGroup = null;
            const categoryAndSub = null;
            let subCategory = null  

            res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, subCategory, Searcher, boxRange, Range, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser })
    
        } else { 
    
            //console.log("************ searcherCache ************")
            //console.log("searcherCache ---->", searcherCache);

            const cardArticleItems = await modelItems.paginate( {$and : [{ title: {$regex: Searcher , $options: "i" }},{ countryCode : countryMarketCode } ] }, options );       
            //console.log(":::-- Aqui cardArticleItems --:::", cardArticleItems);
            //const countSearch = await modelItems.find( {$and : [{title: {$regex: Searcher, $options: "i"}} ]}).count();
            //console.log("|||||:::::::: Esto es countSearch", countSearch);
            const Categories = await modelItems.aggregate([ { $match: { title: { $regex: Searcher, $options: "i" }, countryCode: countryMarketCode } }, { $group: { _id: "$category" } }, { $project: { _id: 0, category: "$_id" }}]);
            const stateGroup = null;
            const categoryAndSub = null;
            let subCategory = null   
            //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
                
            res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, subCategory, Searcher, boxRange, Range, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });    
        

        }  


    } else {

        if (searcher ===""){

            //console.log("************ searcherCache ************")
            //console.log("searcherCache ---->", searcherCache);

            const cardArticleItems = await modelItems.paginate({}, options );       
            //console.log(":::-- Aqui cardArticleItems --:::", cardArticleItems);
            //const countSearch = await modelItems.find().count();
            // const stateGroup = await modelItems.aggregate([ {$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" } }} ]); viejo
            //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
            const Categories = await modelItems.aggregate([ { $group: { _id: "$category" }}, { $project: { _id: 0, category: "$_id" }}]);
            const stateGroup = null;
            const categoryAndSub = null;
            let subCategory = null  

            res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, subCategory, Searcher, boxRange, Range, countMessages, countNegotiationsBuySell, searcherCache })
    
        } else { 
    
            //console.log("************ searcherCache ************")
            //console.log("searcherCache ---->", searcherCache);

            const cardArticleItems = await modelItems.paginate( {$and : [{ title: {$regex: Searcher , $options: "i" }} ] }, options );       
            //console.log(":::-- Aqui cardArticleItems --:::", cardArticleItems);
            //const countSearch = await modelItems.find( {$and : [{title: {$regex: Searcher, $options: "i"}} ]}).count();
            //console.log("|||||:::::::: Esto es countSearch", countSearch);
            //const stateGroup = await modelItems.aggregate([ {$match: {$and: [ {title: {$regex: Searcher, $options: "i"}} ]} },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" } }} ]);
            //console.log("aqui estados por grupo :", stateGroup);
            //const categoryAndSub = await modelItems.aggregate([ {$match: {$and: [ { title: {$regex: Searcher , $options: "i" }}]} }, { $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
            const Categories = await modelItems.aggregate([ { $match: { title: {$regex: Searcher , $options: "i" }} },{ $group: { _id: "$category" }}, { $project: { _id: 0, category: "$_id" }}]);
            const stateGroup = null;
            const categoryAndSub = null;
            let subCategory = null   
            //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);
                
            res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, subCategory, Searcher, boxRange, Range, countMessages, countNegotiationsBuySell, searcherCache });    
        

        }        

    }
 
}); 
 
routes.get('/view-itemsX/:categories', async (req, res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    console.log("Estamos en la ruta /view-itemsX/:categories");
    const categories = req.params.categories;
    
    console.log('categories :', categories);

    console.log("req.query", req.query );
    const { geo, range } = req.query; //query de alguna ubicacion o rango de precio;
    console.log(`geo : ${geo}  range : ${range}`);
    
    let Searcher = null;
    let Categories = null;
    let subCategory = null;
    let Range = null;
    let searchProfile;
    let countryMarketCode;
    let boxRange;
    

    let page = req.query.page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    Searcher = req.session.search;
    req.session.searcherCache = Searcher;
    let searcherCache = req.session.searcherCache;

    if (user){
        console.log("Esto es user._id ------>", user._id );
        countryMarketCode = user.seeMarket.countryMarketCode;

        searchProfile = await modelProfile.find({ indexed : user._id });
        //console.log("Aqui el profile de la cuenta", searchProfile);

        const favoritesOfUser = await modelFavorites.find({ indexed:user._id }); //todos los favoritos de este usuario,
        //console.log("favoritesOfUser ....... :", favoritesOfUser);
        //console.log("Aqui debo mostrar un resultado de consulta --->", Searcher);

        console.log("Ver aqui con atencion ...");
        console.log("geo :", geo);
        console.log("range :", range);

        if (searcherCache){

            if (geo && !range){

                console.log("aqui filtramos por geo");
                const searchRangePrices = await modelItems.find({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ countryCode : countryMarketCode },{ state_province : geo } ] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                }   

                const cardArticleItems = await modelItems.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ countryCode : countryMarketCode },{ state_province : geo } ] }, options  );
                //console.log(cardArticleItems);
                //const countSearch = await modelItems.find({$and : [{ category : categories },{ countryCode : countryMarketCode },{ state_province:geo } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories }, { countryCode : countryMarketCode },{ state_province:geo } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories }, { countryCode : countryMarketCode },{ state_province:geo } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
            
            } else if (range && !geo) {

                console.log("aqui filtramos por rango");

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;

                
                const cardArticleItems = await modelItems.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] }, options  );
                //console.log(cardArticleItems);
                //const countSearch = await modelItems.find({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories }, { countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories }, { countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
            
                
            } else if (range && geo) {

                console.log("aqui filtramos por geo y por rango");
                console.log("geo :   ", geo);
                console.log("range : ", range);

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } },{ state_province : geo } ] }, options  );
                //console.log(cardArticleItems);
                //const countSearch = await modelItems.find({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } },{ state_province : geo } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories }, { countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } },{ state_province : geo } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories }, { countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } },{ state_province : geo } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
                        


            } else {

                console.log("estoy dandole a una categoria especifica sin geo ni range", categories);
                const searchRangePrices = await modelItems.find({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ countryCode : countryMarketCode }] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                } 


                const cardArticleItems = await modelItems.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ countryCode : countryMarketCode } ] }, options  );
                //console.log(cardArticleItems);
                //const countSearch = await modelItems.find({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ countryCode : countryMarketCode } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories }, { countryCode : countryMarketCode } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories }, { countryCode : countryMarketCode } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
            
            }   
            
        } else {  
            
            if (geo && !range){

                console.log("aqui filtramos por geo");
                const searchRangePrices = await modelItems.find({$and : [{ category : categories },{ countryCode : countryMarketCode },{ state_province : geo } ] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                }   

                const cardArticleItems = await modelItems.paginate({$and : [{ category : categories },{ countryCode : countryMarketCode },{ state_province : geo } ] }, options  );
                //console.log(cardArticleItems);
                //const countSearch = await modelItems.find({$and : [{ category : categories },{ countryCode : countryMarketCode },{ state_province:geo } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories }, { countryCode : countryMarketCode },{ state_province:geo } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories }, { countryCode : countryMarketCode },{ state_province:geo } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
            
            } else if (range && !geo) {

                console.log("aqui filtramos por rango");

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [{ category : categories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] }, options  );
                //console.log(cardArticleItems);
                //const countSearch = await modelItems.find({$and : [{ category : categories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories }, { countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories }, { countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
            
                
            } else if (range && geo) {

                console.log("aqui filtramos por geo y por rango");
                console.log("geo :   ", geo);
                console.log("range : ", range);

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [{ category : categories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } },{ state_province : geo } ] }, options  );
                //console.log(cardArticleItems);
                //const countSearch = await modelItems.find({$and : [{ category : categories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } },{ state_province : geo } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories }, { countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } },{ state_province : geo } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories }, { countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } },{ state_province : geo } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
                        


            } else {

                console.log("estoy dandole a una categoria especifica sin geo ni range", categories);
                const searchRangePrices = await modelItems.find({$and : [{ category : categories },{ countryCode : countryMarketCode }] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                } 


                const cardArticleItems = await modelItems.paginate({$and : [{ category : categories },{ countryCode : countryMarketCode } ] }, options  );
                //console.log(cardArticleItems);
                //const countSearch = await modelItems.find({$and : [{ category : categories },{ countryCode : countryMarketCode } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories }, { countryCode : countryMarketCode } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories }, { countryCode : countryMarketCode } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
            
            } 

        }    


    } else {

        console.log(" ---------------- estamos sin user y con categoria --------------- ");
        console.log("OJO searcherCache ...........", searcherCache);

        if (searcherCache){

            if (geo && !range){

                console.log("aqui filtramos por geo");
                const searchRangePrices = await modelItems.find({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ country : geo } ] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                }   

                const cardArticleItems = await modelItems.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ country : geo } ] }, options  );
                //console.log(cardArticleItems);
                //const countSearch = await modelItems.find({$and : [{ category : categories },{ country : geo } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories }, { country : geo } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories }, { country : geo } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
            
            } else if (range && !geo) {

                console.log("aqui filtramos por rango");

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ price: { $gte: valor1, $lte: valor2 } } ] }, options  );
                //console.log(cardArticleItems);
                //const countSearch = await modelItems.find({$and : [{ category : categories },{ price: { $gte: valor1, $lte: valor2 } } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ price: { $gte: valor1, $lte: valor2 } } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ price: { $gte: valor1, $lte: valor2 } } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
            
                
            } else if (range && geo) {

                console.log("aqui filtramos por geo y por rango");
                console.log("geo :   ", geo);
                console.log("range : ", range);

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ price: { $gte: valor1, $lte: valor2 } },{ country : geo } ] }, options  );
                //console.log(cardArticleItems);
                //const countSearch = await modelItems.find({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories },{ price: { $gte: valor1, $lte: valor2 } },{ country : geo } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ price: { $gte: valor1, $lte: valor2 } },{ country : geo } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ price: { $gte: valor1, $lte: valor2 } },{ country : geo } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
                        


            } else {

                console.log("estoy dandole a una categoria especifica sin geo ni range", categories);
                const searchRangePrices = await modelItems.find({$and : [{ category : categories }] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                } 


                const cardArticleItems = await modelItems.paginate({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories } ] }, options  );
                //console.log(cardArticleItems);
                const countSearch = await modelItems.find({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
            
            }

        } else {

            if (geo && !range){

                console.log("aqui filtramos por geo");
                const searchRangePrices = await modelItems.find({$and : [{ category : categories },{ country : geo } ] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                }   

                const cardArticleItems = await modelItems.paginate({$and : [{ category : categories },{ country : geo } ] }, options  );
                //console.log(cardArticleItems);
                const countSearch = await modelItems.find({$and : [{ category : categories },{ country : geo } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories }, { country : geo } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories }, { country : geo } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
            
            } else if (range && !geo) {

                console.log("aqui filtramos por rango");

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [{ category : categories },{ price: { $gte: valor1, $lte: valor2 } } ] }, options  );
                //console.log(cardArticleItems);
                const countSearch = await modelItems.find({$and : [{ category : categories },{ price: { $gte: valor1, $lte: valor2 } } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ price: { $gte: valor1, $lte: valor2 } } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ price: { $gte: valor1, $lte: valor2 } } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
            
                
            } else if (range && geo) {

                console.log("aqui filtramos por geo y por rango");
                console.log("geo :   ", geo);
                console.log("range : ", range);

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [{ category : categories },{ price: { $gte: valor1, $lte: valor2 } },{ country : geo } ] }, options  );
                //console.log(cardArticleItems);
                const countSearch = await modelItems.find({$and : [{ category : categories },{ price: { $gte: valor1, $lte: valor2 } },{ country : geo } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ price: { $gte: valor1, $lte: valor2 } },{ country : geo } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ price: { $gte: valor1, $lte: valor2 } },{ country : geo } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
                        


            } else {

                console.log("estoy dandole a una categoria especifica sin geo ni range", categories);
                const searchRangePrices = await modelItems.find({$and : [{ category : categories }] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                } 


                const cardArticleItems = await modelItems.paginate({$and : [{ category : categories } ] }, options  );
                //console.log(cardArticleItems);
                const countSearch = await modelItems.find({$and : [{ category : categories } ] }).count();
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, countSearch, searcherCache });
            
            }

        }    


    } 

});

//vamos por aqui ...............................
routes.get('/view-itemsX/:categories/:subCategories', async (req, res)=>{


    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const { categories, subCategories } = req.params;
    console.log('categories :', categories);
    console.log('subCategories :', subCategories);
    console.log("req.query", req.query );
    const { geo, range } = req.query; //query de alguna ubicacion
    console.log(`geo : ${geo}  range : ${range}`);
        


    let Searcher = null;
    let Categories = null;
    let subCategory = null;
    let Range = null;
    let searchProfile;
    let countryMarketCode;
    let boxRange;

    let page = req.query.page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort : { createdAt : -1 }
    }

    Searcher = req.session.search;
    req.session.searcherCache = Searcher;
    let searcherCache = req.session.searcherCache;
        
    console.log("searcherCache :", searcherCache);

    if (user){
        console.log("Esto es user._id ------>", user._id );
        countryMarketCode = user.seeMarket.countryMarketCode;

        searchProfile = await modelProfile.find({ indexed : user._id });
        //console.log("Aqui el profile de la cuenta", searchProfile);

        const favoritesOfUser = await modelFavorites.find({ indexed:user._id }); //todos los favoritos de este usuario,
        //console.log("favoritesOfUser ....... :", favoritesOfUser);
        //console.log("Aqui debo mostrar un resultado de consulta --->", Searcher);

        if (searcherCache){

            if (geo && !range){

                console.log("aqui filtramos por geo");
                const searchRangePrices = await modelItems.find({$and : [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ state_province:geo } ] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                }   

                const cardArticleItems = await modelItems.paginate({$and : [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ state_province:geo } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
            
            } else if (range && !geo) {

                console.log("aqui filtramos por rango");

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
            
                
            } else if (range && geo) {

                console.log("aqui filtramos por geo y por rango");
                console.log("geo :   ", geo);
                console.log("range : ", range);

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ state_province:geo },{ price: { $gte: valor1, $lte: valor2 } } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ state_province:geo },{ price: { $gte: valor1, $lte: valor2 } } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ state_province:geo },{ price: { $gte: valor1, $lte: valor2 } } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
                        


            } else {

                console.log("estoy dandole a una categoria especifica y una subcategoria pero sin geo ni range", categories );
                const searchRangePrices = await modelItems.find({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories }, { sub_category : subCategories }, { countryCode : countryMarketCode }] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                } 


                const cardArticleItems = await modelItems.paginate({$and : [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category : subCategories },{ countryCode : countryMarketCode } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category : subCategories } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category : subCategories } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
            
            } 

        } else {

            if (geo && !range){

                console.log("aqui filtramos por geo");
                const searchRangePrices = await modelItems.find({$and : [ { category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ state_province:geo } ] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                }   

                const cardArticleItems = await modelItems.paginate({$and : [ { category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ state_province:geo } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
            
            } else if (range && !geo) {

                console.log("aqui filtramos por rango");

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [ { category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ price: { $gte: valor1, $lte: valor2 } } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
            
                
            } else if (range && geo) {

                console.log("aqui filtramos por geo y por rango");
                console.log("geo :   ", geo);
                console.log("range : ", range);

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [ { category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ state_province:geo },{ price: { $gte: valor1, $lte: valor2 } } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ state_province:geo },{ price: { $gte: valor1, $lte: valor2 } } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category:subCategories },{ countryCode : countryMarketCode },{ state_province:geo },{ price: { $gte: valor1, $lte: valor2 } } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
                        


            } else {

                console.log("estoy dandole a una categoria especifica y una subcategoria pero sin geo ni range", categories );
                const searchRangePrices = await modelItems.find({$and : [ { category : categories },{ sub_category : subCategories },{ countryCode : countryMarketCode }] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                } 


                const cardArticleItems = await modelItems.paginate({$and : [ { category : categories },{ sub_category : subCategories },{ countryCode : countryMarketCode } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category : subCategories },{ countryCode : countryMarketCode } ] } },{$group: {_id : "$state_province", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category : subCategories },{ countryCode : countryMarketCode } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache, favoritesOfUser });
            
            } 

        }    


        
    } else {

        //console.log(" ---------------- estamos sin user y con categoria y subcategoria --------------- ");
        if (searcherCache){

            if (geo && !range){

                console.log("aqui filtramos por geo");
                const searchRangePrices = await modelItems.find({$and : [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ country:geo } ] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                }   

                const cardArticleItems = await modelItems.paginate({$and : [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ country:geo } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories }, { country:geo } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ country:geo } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
            
            } else if (range && !geo) {

                console.log("aqui filtramos por rango");

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ price: { $gte: valor1, $lte: valor2 } } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ price: { $gte: valor1, $lte: valor2 } } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ price: { $gte: valor1, $lte: valor2 } } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
            
                
            } else if (range && geo) {

                console.log("aqui filtramos por geo y por rango");
                console.log("geo :   ", geo);
                console.log("range : ", range);

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ country:geo },{ price: { $gte: valor1, $lte: valor2 } } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ country:geo },{ price: { $gte: valor1, $lte: valor2 } } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category:subCategories },{ country:geo },{ price: { $gte: valor1, $lte: valor2 } } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
                        


            } else {

                console.log("estoy dandole a una categoria especifica y una subcategoria pero sin geo ni range", categories );
                const searchRangePrices = await modelItems.find({$and : [{ title: {$regex: Searcher , $options: "i" }},{ category : categories }, { sub_category : subCategories }] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                } 


                const cardArticleItems = await modelItems.paginate({$and : [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category : subCategories } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category : subCategories } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { title: {$regex: Searcher , $options: "i" }},{ category : categories },{ sub_category : subCategories } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
            
            } 

        } else {

            if (geo && !range){

                console.log("aqui filtramos por geo");
                const searchRangePrices = await modelItems.find({$and : [ { category : categories },{ sub_category:subCategories },{ country:geo } ] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                }   

                const cardArticleItems = await modelItems.paginate({$and : [ { category : categories },{ sub_category:subCategories },{ country:geo } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category:subCategories },{ country:geo } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category:subCategories },{ country:geo } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
            
            } else if (range && !geo) {

                console.log("aqui filtramos por rango");

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [ { category : categories },{ sub_category:subCategories },{ price: { $gte: valor1, $lte: valor2 } } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category:subCategories },{ price: { $gte: valor1, $lte: valor2 } } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category:subCategories },{ price: { $gte: valor1, $lte: valor2 } } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
            
                
            } else if (range && geo) {

                console.log("aqui filtramos por geo y por rango");
                console.log("geo :   ", geo);
                console.log("range : ", range);

                let RangeSplit = range.split("~"); // Esto te dará un array: ["2", "13"]
                console.log("RangeSplit :", RangeSplit);

                let valor1 = parseFloat(RangeSplit[0]); // "2"
                let valor2 = parseFloat(RangeSplit[1]); // "13"
                console.log("valor1 :", valor1);
                console.log("valor2 :", valor2);
                Range = `${valor1} ~ ${valor2}`;
                

                const cardArticleItems = await modelItems.paginate({$and : [ { category : categories },{ sub_category:subCategories },{ country:geo },{ price: { $gte: valor1, $lte: valor2 } } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category:subCategories },{ country:geo },{ price: { $gte: valor1, $lte: valor2 } } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category:subCategories },{ country:geo },{ price: { $gte: valor1, $lte: valor2 } } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
                        


            } else {

                console.log("estoy dandole a una categoria especifica y una subcategoria pero sin geo ni range", categories );
                const searchRangePrices = await modelItems.find({$and : [ { category : categories },{ sub_category : subCategories } ] }, { price:1, title:1} );
                //console.log("rangePrices :", rangePrices);
                const Prices = searchRangePrices.map( ele => ele.price ); //Estan todos los precios en este Array;
                Prices.sort( (a,b)=> a-b );
                console.log("Prices :", Prices); 
                const min = Prices.shift(); 
                const max = Prices.pop(); //puede ser undefined;
                console.log("min :", min); console.log("max :", max);
            
                //esta es la condicion para activar el rango de precios;
                const condicion = max && max != undefined && max >= min + 30; 

                if ( condicion ){ //condicion para crear el array de boxRange;

                    console.log("condicion activada", condicion) ;

                    const tercio = (min + max) / 3;
                    console.log("tercio");
                    console.log(`precio menor: ${min}~${tercio}`);
                    console.log(`precio medio: ${tercio}~${max - tercio}`);
                    console.log(`precio mayor: ${max - tercio}~${max}`);
                    const rangeMin = { uno: Math.floor(min), dos: Math.ceil(tercio) };
                    const rangeMed = { uno: Math.ceil(tercio), dos: Math.ceil(max - tercio) };
                    const rangeHig = { uno: Math.ceil(max - tercio), dos: Math.ceil(max) };
                    boxRange = [ rangeMin,rangeMed,rangeHig ];
                    console.log("boxRange :", boxRange);

                } else {
                    boxRange = null;
                } 


                const cardArticleItems = await modelItems.paginate({$and : [ { category : categories },{ sub_category : subCategories } ] }, options  );
                //console.log(cardArticleItems);
                const stateGroup = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category : subCategories } ] } },{$group: {_id : "$country", repetido: {$sum: 1}, type: { $first: "1" }}} ]);
                //console.log("aqui estados por grupo :", stateGroup);
                const categoryAndSub = await modelItems.aggregate([ {$match: { $and: [ { category : categories },{ sub_category : subCategories } ] } },{ $group: { _id: "$category", sub_categories: { $addToSet: "$sub_category" }}}, { $project: { _id: 0, category: "$_id", sub_categories: 1 }}]);
                //console.log("aqui estados por categoryAndSub ----> :", categoryAndSub);

                res.render('page/view-itemsX', { user, searchProfile, cardArticleItems, stateGroup, Categories, categoryAndSub, boxRange, Range, subCategory, Searcher, countMessages, countNegotiationsBuySell, searcherCache });
            
            } 

        } 
  

    } 

});

module.exports = routes;