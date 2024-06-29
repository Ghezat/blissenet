const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');


routes.get('/follow', async (req,res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let searchProfile, favoriteStores;
    const boxStores = [];
    const receive  = req.query.paginate;

    console.log(":::: Cantidad de mensajes que tiene este usuario :::: ->", countMessages);    
    console.log(":::: Esto es la cantidad de negotiationsBuySell :::: ->", countNegotiationsBuySell);

    if (user){
        console.log("este es el id de usuario que tiene una coleccion de tiendas guardadas", user._id);
    
        searchProfile = await modelProfile.find({ indexed : user._id});
        follow = searchProfile[0].favoritestores;
        const followCount = follow.length;
        console.log('Aqui las tiendas favoritas ---->', follow);

       
        for (let i = 0; i < follow.length; i++) {
            const userId = follow[i];
                      
            const searchProfile = await modelProfile.find( {indexed : userId} );
            //console.log("esto es searchProfile ---------|", searchProfile)
            if (searchProfile) {
                boxStores.push(...searchProfile)
                //console.log("logro meterlo en boxStore", userId)
            } 
                
        }  


        console.log('esto es boxStores ----->', boxStores)
        //este bloque de abajo ordena en forma alfabetica al array.
        boxStores.sort((a,b)=>{
            if (a.username < b.username) {
                return -1;
            }    
            if (a.username > b.username) {
                return 1;
            }

            return 0;
    
        })

        //console.log('esto es boxStore Ordenado ----->', boxStores); 
    

        // paginate
        let long = boxStores.length; //conocer la longitud del array
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
            let newBox = boxStores.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
            
            console.log("pagina :  ", pagina);
            console.log("totalPagina :  ", totalPagina);
            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
            res.render('page/follow', {user, newBox, paginate, boxStores, followCount, countMessages, searchProfile, countNegotiationsBuySell});
        
    
        } else if (receive == "first"){
    
            X = 0;//0
            req.session.x = X;
                          
            newBox = boxStores.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
               
            pagina = (limit + X) / limit;
            console.log("pagina :  ", pagina);
            console.log("totalPagina :  ", totalPagina);
            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
            res.render('page/follow', {user, newBox, paginate, boxStores, followCount, countMessages,  searchProfile, countNegotiationsBuySell});  
    
        } else if (receive == "next"){
    
            X = req.session.x;
    
            if (X + limit < long ){
       
                X = X + limit;//6
                req.session.x = X;
                                      
                newBox = boxStores.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
               
                pagina = (limit + X) / limit;
                console.log("pagina :  ", pagina);
                console.log("totalPagina :  ", totalPagina);
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
                res.render('page/follow', {user, newBox, paginate, boxStores, followCount, countMessages,  searchProfile, countNegotiationsBuySell});
               
            }
                  
        } else if (receive == "prev"){
    
            X = req.session.x;
            console.log("Estamos en Prev");
            console.log("Esto es el valor de x :", X); //6
    
            if (X  > 0){
       
                X = X - limit
                req.session.x = X;
    
                newBox = boxStores.slice(X , limit + X); 
      
                pagina = (limit + X) / limit;
                console.log("pagina :  ", pagina);
                console.log("totalPagina :  ", totalPagina);
                const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
                res.render('page/follow', {user, newBox, paginate, boxStores, followCount, countMessages,  searchProfile, countNegotiationsBuySell});
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
                               
            newBox = boxStores.slice(V , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
            //       10   + 23  / 10 = 3.3 pero el Mat.ceil lo lleva a 4 perfecto
            pagina = Math.ceil((limit + X) / limit);
            console.log("pagina :  ", pagina);
            console.log("totalPagina :  ", totalPagina);
            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
    
            res.render('page/follow', {user, newBox, paginate, boxStores, followCount, countMessages,  searchProfile, countNegotiationsBuySell});
    
        }
  
    } else {
        res.render('page/follow', {user});
    }
    
   
});

routes.get('/follow/delete/:id', async (req,res)=>{

try {
      
    const user = req.session.user;
    console.log("este es el id del perfil o tienda a eliminar de tiendas favoritas",req.params);
    const Id = req.params.id;
    const favoritestoresDel = await modelProfile.updateOne({ indexed : user._id }, { $pull : { favoritestores : Id } } )
    const followMeDel = await modelProfile.updateOne({ indexed : Id }, { $pull : { followMe : user._id } } );
    
    res.redirect('/follow')

} catch (error) {

    console.log("Ha habdido un Error", error);
    res.redirect('/follow');
    
} 


});


module.exports = routes;