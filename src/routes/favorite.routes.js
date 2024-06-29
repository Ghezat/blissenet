const { Router } = require('express');
const routes = Router()
/* const modelUser = require('../models/user.js'); */
const modelFavorites = require('../models/favorites.js');
const modelProfile = require('../models/profile.js');

const modelAirplane = require('../models/airplane.js');
const modelArtes = require('../models/artes.js');
const modelItems = require('../models/items.js');
const modelAutomotive = require('../models/automotive.js');
const modelRealstate = require('../models/realstate.js');
const modelNautical = require('../models/nautical.js');
const modelService = require('../models/services.js');
const modelAuction = require('../models/auction.js');
const modelRaffle = require('../models/raffle.js');

const user = require('../models/user.js');
            

routes.get('/myfavorites', async (req,res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const boxProducts = [];
    let searchProfile;
    let requestFav;
    const receive  = req.query.paginate;
    
    console.log(":::::::*******////*******::::::::")
    console.log("::::::::::: Esto es receive : ", receive);
    console.log("Esto es user", user);
          
    //console.log(":::: Cantidad de mensajes que tiene este usuario :::: ->", countMessages);    
    //console.log(":::: Esto es la cantidad de negotiationsBuySell :::: ->", countNegotiationsBuySell);
        
   
    if (user){
        //console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        //console.log("Aqui el profile de la cuenta", searchProfile);


        requestFav = await modelFavorites.find( { indexed : user._id } );
        //console.log("aqui todos los favoritos de este usuario", requestFav)
        for (let i = 0; i < requestFav.length; i++) {
            const element = requestFav[i];
            if (element.department == 'arts') {
                const IdProduct = element.id_product;
                const resultArt = await modelArtes.findById( IdProduct );
                if (resultArt){   //este if es para evitar se agregue al array boxProduct un objeto vacio porque no exista a causa de que alla sido eliminado por su creadoe.
                    boxProducts.push(resultArt);
                } 
            } else if ( element.department == 'airplanes' ){
                const IdProduct = element.id_product;
                const resultAir = await modelAirplane.findById( IdProduct );
                if (resultAir){
                    boxProducts.push(resultAir)
                }    
            } else if ( element.department == 'items' ) {
                const IdProduct = element.id_product;
                const resultIte = await modelItems.findById( IdProduct );
                if (resultIte){
                    boxProducts.push(resultIte)
                }
                
            } else if ( element.department == 'automotive' ) {
                const IdProduct = element.id_product;
                const resultAut = await modelAutomotive.findById( IdProduct );
                if (resultAut){
                    boxProducts.push(resultAut)
                }
                
            } else if ( element.department == 'realstate' ) {
                const IdProduct = element.id_product;
                const resultRea = await modelRealstate.findById( IdProduct );
                if (resultRea){
                    boxProducts.push(resultRea)
                }
                
            } else if ( element.department == 'nautical' ) {
                const IdProduct = element.id_product;
                const resultNau = await modelNautical.findById( IdProduct );
                if (resultNau){
                    boxProducts.push(resultNau)
                }
                
            } else if ( element.department == 'service' ) {
                const IdProduct = element.id_product;
                const resultSer = await modelService.findById( IdProduct );
                if (resultSer){
                    boxProducts.push(resultSer)
                }
                
            } else if ( element.department == 'auctions' ) {
                const IdProduct = element.id_product;
                const resultSer = await modelAuction.findById( IdProduct );
                if (resultSer){
                    boxProducts.push(resultSer)
                }
                
            } else if ( element.department == 'raffle' ) {
                const IdProduct = element.id_product;
                const resultSer = await modelRaffle.findById( IdProduct );
                if (resultSer){
                    boxProducts.push(resultSer)
                }
                
            }
        }
        

        //console.log("Esto son los products del usuario boxProducts  --->", boxProducts);
        const favoritesCount = boxProducts.length; //cantidad de favoritos;


        // paginate
        let long = boxProducts.length; //conocer la longitud del array
        const limit = 10; //establecer la cantidad  de elementos que se mostrarán
        let pagina = 1; //declaracion de la pagina por default en 1
        let X;
        let totalPagina = Math.ceil(long / limit);    

        console.log("long : ", long);
        console.log("limit : ", limit);
        console.log("totalPagina : ", totalPagina);
    

        if (receive == undefined){

            console.log("Esto es long", long);
            console.log("Esto es limit", limit);


            req.session.x = 0;
            X = req.session.x;

            console.log("Estamos aqui en el inicio");
            console.log("Esto es el valor de x : ", X );
            //aqui el nuevo arreglo por default 
            let newBox = boxProducts.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
        
            console.log("pagina :  ", pagina);
            console.log("totalPagina :  ", totalPagina);
            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

            res.render('page/favorites', {user, newBox, paginate, boxProducts, favoritesCount, countMessages, countNegotiationsBuySell, searchProfile});

        } else if (receive == "first"){

            X = 0;//0
            req.session.x = X;
                      
            newBox = boxProducts.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
           
            pagina = (limit + X) / limit;
            console.log("pagina :  ", pagina);
            console.log("totalPagina :  ", totalPagina);
            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

            res.render('page/favorites', {user, newBox, paginate, boxProducts, favoritesCount, countMessages, countNegotiationsBuySell, searchProfile});
           

        } else if (receive == "next"){

         X = req.session.x;

         if (X + limit < long ){
   
              X = X + limit;//6
              req.session.x = X;

            newBox = boxProducts.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
           
             pagina = (limit + X) / limit;
             console.log("pagina :  ", pagina);
             console.log("totalPagina :  ", totalPagina);
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                res.render('page/favorites', {user, newBox, paginate, boxProducts, favoritesCount, countMessages, countNegotiationsBuySell, searchProfile});
           
         }
          
            
        } else if (receive == "prev"){

            X = req.session.x;
            console.log("Estamos en Prev");
            console.log("Esto es el valor de x :", X); //6

            if (X  > 0){
   
             X = X - limit
             req.session.x = X;

             newBox = boxProducts.slice(X , limit + X); 
  
             pagina = (limit + X) / limit;
             console.log("pagina :  ", pagina);
             console.log("totalPagina :  ", totalPagina);
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

                res.render('page/favorites', {user, newBox, paginate, boxProducts, favoritesCount, countMessages, countNegotiationsBuySell, searchProfile});
            } 
          

        } else if (receive == "last"){

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
                           
            newBox = boxProducts.slice(V , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
            //       10   + 23  / 10 = 3.3 pero el Mat.ceil lo lleva a 4 perfecto
            pagina = Math.ceil((limit + X) / limit);
            console.log("pagina :  ", pagina);
            console.log("totalPagina :  ", totalPagina);
            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };

            res.render('page/favorites', {user, newBox, paginate, boxProducts, countMessages, favoritesCount, countNegotiationsBuySell, searchProfile});  

        }

        
    } else {
        res.render('page/favorites', {user});
    }
    
});


routes.post('/myfavorites', async (req, res)=>{
    const User = req.session.user;
    const Depart = req.body.depart;
    const IdProduct = req.body.id;
    console.log("este es el usuario que esta logeado ---> ", User);
    console.log("este es el departamento ----> ", Depart);
    console.log("este es el idArticulo ----> ", IdProduct);


     if (User !== undefined){
        
        const searchFavorites = await modelFavorites.find({ indexed : User._id, id_product : IdProduct }); //aqui busco todos los documentos de la coleccion favoritos que tengan como indexed al usuario en cuestion.
        console.log("esta es la busqueda del producto del usuario --->", searchFavorites);
        
        if (searchFavorites.length !== 0){
            console.log('El producto ya esta guardado en favoritos')
        } else {
            console.log('El producto no existe y se procederá a guardarse!')
            const newFavorite = new modelFavorites( { id_product : IdProduct, department: Depart, indexed : User._id } );
            const savefavorite = await newFavorite.save()
            console.log("Este es el objeto guardado en favoritos ----->",savefavorite);

            /* Aqui con este codigo llevamos la cantidad de favoritos que lleva cada articulo o producto */
            if (Depart == 'arts'){
                const result = await modelArtes.findById(IdProduct);
                const CountFavorite = result.favorite;
                const FavoriteSum = CountFavorite + 1;
                console.log("esta es la cantidad de favoritos que tiene actualmente --->", CountFavorite)
                const updatesfavorite = await modelArtes.findByIdAndUpdate(IdProduct, { favorite : FavoriteSum  } );
                console.log("el campo favorito ya ha sido incrementado como favorito de un usuario");
             } else if (Depart == 'items'){
                const result = await modelItems.findById(IdProduct);
                const CountFavorite = result.favorite;
                const FavoriteSum = CountFavorite + 1;
                console.log("esta es la cantidad de favoritos que tiene actualmente --->", CountFavorite)
                const updatesfavorite = await modelItems.findByIdAndUpdate(IdProduct, { favorite : FavoriteSum  } );
                console.log("el campo favorito ya ha sido incrementado como favorito de un usuario");
             } else if (Depart == 'airplanes'){
                const result = await modelAirplane.findById(IdProduct);
                const CountFavorite = result.favorite;
                const FavoriteSum = CountFavorite + 1;
                console.log("esta es la cantidad de favoritos que tiene actualmente --->", CountFavorite)
                const updatesfavorite = await modelAirplane.findByIdAndUpdate(IdProduct, { favorite : FavoriteSum  } );
                console.log("el campo favorito ya ha sido incrementado como favorito de un usuario");
             } else if (Depart == 'automotive'){
                const result = await modelAutomotive.findById(IdProduct);
                const CountFavorite = result.favorite;
                console.log("Este es la cantidad de favoritos que tiene este articulo", CountFavorite );
                const FavoriteSum = CountFavorite + 1;
                console.log("esta es la cantidad de favoritos que tiene actualmente --->", FavoriteSum);
                const updatesfavorite = await modelAutomotive.findByIdAndUpdate(IdProduct, { favorite : FavoriteSum  } );
                console.log("el campo favorito ya ha sido incrementado como favorito de unusuario");
             }  else if (Depart == 'realstate'){
                const result = await modelRealstate.findById(IdProduct);
                const CountFavorite = result.favorite;
                const FavoriteSum = CountFavorite + 1;
                console.log("esta es la cantidad de favoritos que tiene actualmente --->", CountFavorite)
                const updatesfavorite = await modelRealstate.findByIdAndUpdate(IdProduct, { favorite : FavoriteSum  } );
                console.log("el campo favorito ya ha sido incrementado como favorito de unusuario");
             }  else if (Depart == 'nautical'){
                const result = await modelNautical.findById(IdProduct);
                const CountFavorite = result.favorite;
                const FavoriteSum = CountFavorite + 1;
                console.log("esta es la cantidad de favoritos que tiene actualmente --->", CountFavorite)
                const updatesfavorite = await modelNautical.findByIdAndUpdate(IdProduct, { favorite : FavoriteSum  } );
                console.log("el campo favorito ya ha sido incrementado como favorito de unusuario");
             }  else if (Depart == 'service'){
                const result = await modelService.findById(IdProduct);
                const CountFavorite = result.favorite;
                const FavoriteSum = CountFavorite + 1;
                console.log("esta es la cantidad de favoritos que tiene actualmente --->", CountFavorite)
                const updatesfavorite = await modelService.findByIdAndUpdate(IdProduct, { favorite : FavoriteSum  } );
                console.log("el campo favorito ya ha sido incrementado como favorito de unusuario"); 
             }  else if (Depart == 'auctions'){
                const result = await modelAuction.findById(IdProduct);
                const CountFavorite = result.favorite;
                const FavoriteSum = CountFavorite + 1;
                console.log("esta es la cantidad de favoritos que tiene actualmente --->", CountFavorite)
                const updatesfavorite = await modelAuction.findByIdAndUpdate(IdProduct, { favorite : FavoriteSum  } );
                console.log("el campo favorito ya ha sido incrementado como favorito de unusuario"); 
             }  else if (Depart == 'raffle'){
                const result = await modelRaffle.findById(IdProduct);
                const CountFavorite = result.favorite;
                const FavoriteSum = CountFavorite + 1;
                console.log("esta es la cantidad de favoritos que tiene actualmente --->", CountFavorite)
                const updatesfavorite = await modelRaffle.findByIdAndUpdate(IdProduct, { favorite : FavoriteSum  } );
                console.log("el campo favorito ya ha sido incrementado como favorito de unusuario"); 
             }
                          
        }
        
     }
   
});

routes.get('/myfavorites/delete/:id', async (req,res)=>{
    console.log("Aqui el _id del objeto de la collecion favorito que deseo eliminar --->", req.params)
    const user = req.session.user;

    const Id = req.params.id;

        const resultObject = await modelFavorites.find( {$and: [{ id_product : Id }, { indexed: user._id }] }  );
        console.log("Esto es el objeto de favorito que se va a eliminar", resultObject);
        console.log("Esto es el ID del objeto que se va a eliminar de la coleccion Favorite", resultObject[0]._id)
        const favoriteId = resultObject[0]._id;
        
            if (resultObject[0].department == 'items') {
                const result = await modelItems.findById(Id);
                const CountFavorite = result.favorite;
                const FavoriteRest = CountFavorite - 1;
                const resultItems = await modelItems.findByIdAndUpdate(Id, {favorite : FavoriteRest});
                console.log("***Aqui lo esperado del objeto de la collecion al que le quiero restar el favorito***", resultItems);
                
            } else if (resultObject[0].department == 'arts'){
                const result = await modelArtes.findById(Id);
                const CountFavorite = result.favorite;
                const FavoriteRest = CountFavorite - 1;
                const resultArtes = await modelArtes.findByIdAndUpdate(Id, {favorite : FavoriteRest});
                console.log("***Aqui lo esperado del objeto de la collecion al que le quiero restar el favorito***", resultArtes);
            
            } else if (resultObject[0].department == 'airplanes'){
                const result = await modelAirplane.findById(Id);
                const CountFavorite = result.favorite;
                const FavoriteRest = CountFavorite - 1;
                const resultAirplane = await modelAirplane.findByIdAndUpdate(Id, {favorite : FavoriteRest});
                console.log("***Aqui lo esperado del objeto de la collecion al que le quiero restar el favorito***", resultAirplane);
            
            } else if (resultObject[0].department == 'automotive'){
                const result = await modelAutomotive.findById(Id);
                const CountFavorite = result.favorite;
                const FavoriteRest = CountFavorite - 1;
                const resultAutomotive = await modelAutomotive.findByIdAndUpdate(Id, {favorite : FavoriteRest});
                console.log("***Aqui lo esperado del objeto de la collecion al que le quiero restar el favorito***", resultAutomotive);
            
            } else if (resultObject[0].department == 'realstate'){
                const result = await modelRealstate.findById(Id);
                const CountFavorite = result.favorite;
                const FavoriteRest = CountFavorite - 1;
                const resultRealstate = await modelRealstate.findByIdAndUpdate(Id, {favorite : FavoriteRest});
                console.log("***Aqui lo esperado del objeto de la collecion al que le quiero restar el favorito***", resultRealstate);
            
            } else if (resultObject[0].department == 'nautical'){
                const result = await modelNautical.findById(Id);
                const CountFavorite = result.favorite;
                const FavoriteRest = CountFavorite - 1;
                const resultNautica = await modelNautical.findByIdAndUpdate(Id, {favorite : FavoriteRest});
                console.log("***Aqui lo esperado del objeto de la collecion al que le quiero restar el favorito***", resultNautica);
            
            } else if (resultObject[0].department == 'service'){
                const result = await modelService.findById(Id);
                const CountFavorite = result.favorite;
                const FavoriteRest = CountFavorite - 1;
                const resultNautica = await modelService.findByIdAndUpdate(Id, {favorite : FavoriteRest});
                console.log("***Aqui lo esperado del objeto de la collecion al que le quiero restar el favorito***", resultNautica);
            
            } else if (resultObject[0].department == 'auctions'){
                const result = await modelAuction.findById(Id);
                const CountFavorite = result.favorite;
                const FavoriteRest = CountFavorite - 1;
                const resultAuction = await modelAuction.findByIdAndUpdate(Id, {favorite : FavoriteRest});
                console.log("***Aqui lo esperado del objeto de la collecion al que le quiero restar el favorito***", resultAuction);
            
            } else if (resultObject[0].department == 'raffle'){
                const result = await modelRaffle.findById(Id);
                const CountFavorite = result.favorite;
                const FavoriteRest = CountFavorite - 1;
                const resultAuction = await modelRaffle.findByIdAndUpdate(Id, {favorite : FavoriteRest});
                console.log("***Aqui lo esperado del objeto de la collecion al que le quiero restar el favorito***", resultAuction);
            }                                

        const resultDel = await modelFavorites.findByIdAndDelete(favoriteId);
        console.log("Aqui el documento borrado de la collecion favoritos:", resultDel);

    res.redirect('/myfavorites')
});

module.exports = routes;

