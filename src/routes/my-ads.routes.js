const { Router } = require('express');
const routes = Router()
const modelProfile = require('../models/profile.js');

const modelAirplane = require('../models/airplane.js');
const modelArtes = require('../models/artes.js');
const modelItems = require('../models/items.js');
const modelAutomotive = require('../models/automotive.js');
const modelRealstate = require('../models/realstate.js');
const modelNautical = require('../models/nautical.js');
const modelService = require('../models/services.js');
const modelAuction = require('../models/auction.js');

const user = require('../models/user.js');


routes.get('/my-ads', async (req,res)=>{
    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const boxProducts = [];
    const receive  = req.query.paginate;
    let searchProfile;

    console.log(":::: Cantidad de mensajes que tiene este usuario :::: ->", countMessages);    
    console.log(":::: Esto es la cantidad de negotiationsBuySell :::: ->", countNegotiationsBuySell);

        
    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);

        const requestArt = await modelArtes.find({ user_id : user._id });
        const requestAir = await modelAirplane.find({ user_id : user._id });
        const requestIte = await modelItems.find({ user_id : user._id });
        const requestAut = await modelAutomotive.find({ user_id : user._id });
        const requestRea = await modelRealstate.find({ user_id : user._id });
        const requestNau = await modelNautical.find({ user_id : user._id });
        const requestSer = await modelService.find({ user_id : user._id });
        const requestAuc = await modelAuction.find({ user_id : user._id });

        
        if (requestArt.length !== 0){   //este if es para evitar se agregue al array boxProduct un objeto vacio porque no exista a causa de que alla sido eliminado por su creadoe.
            boxProducts.push(...requestArt);
        } 

        if (requestAir.length !== 0){   //este if es para evitar se agregue al array boxProduct un objeto vacio porque no exista a causa de que alla sido eliminado por su creadoe.
            boxProducts.push(...requestAir);
        } 

        if (requestIte.length !== 0){   //este if es para evitar se agregue al array boxProduct un objeto vacio porque no exista a causa de que alla sido eliminado por su creadoe.
            boxProducts.push(...requestIte);
        }

        if (requestAut.length !== 0){   //este if es para evitar se agregue al array boxProduct un objeto vacio porque no exista a causa de que alla sido eliminado por su creadoe.
            boxProducts.push(...requestAut);
        }

        if (requestRea.length !== 0){   //este if es para evitar se agregue al array boxProduct un objeto vacio porque no exista a causa de que alla sido eliminado por su creadoe.
            boxProducts.push(...requestRea);
        }

        if (requestNau.length !== 0){   //este if es para evitar se agregue al array boxProduct un objeto vacio porque no exista a causa de que alla sido eliminado por su creadoe.
            boxProducts.push(...requestNau);
        }
    
        if (requestSer.length !== 0){   //este if es para evitar se agregue al array boxProduct un objeto vacio porque no exista a causa de que alla sido eliminado por su creadoe.
            boxProducts.push(...requestSer);
        }

        if (requestAuc.length !== 0){   //este if es para evitar se agregue al array boxProduct un objeto vacio porque no exista a causa de que alla sido eliminado por su creadoe.
            boxProducts.push(...requestAuc);
        }


        console.log("aqui todos los anuncios de este usuario", boxProducts );

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
 
             req.session.x = 0;
             X = req.session.x;
 
             console.log("Estamos aqui en el inicio");
             console.log("Esto es el valor de x : ", X );
             //aqui el nuevo arreglo por default 
             let newBox = boxProducts.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
         
             console.log("pagina :  ", pagina);
             console.log("totalPagina :  ", totalPagina);
             const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
 
             res.render('page/my-ads', {user, newBox, paginate, boxProducts, countMessages, countNegotiationsBuySell, searchProfile});

        } else if (receive == "first"){
 
             X = 0;//0
             req.session.x = X;
                       
             newBox = boxProducts.slice(X , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
            
             pagina = (limit + X) / limit;
             console.log("pagina :  ", pagina);
             console.log("totalPagina :  ", totalPagina);
             const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
 
             res.render('page/my-ads', {user, newBox, paginate, boxProducts, countMessages, countNegotiationsBuySell, searchProfile});
 
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
 
                res.render('page/my-ads', {user, newBox, paginate, boxProducts, countMessages, countNegotiationsBuySell, searchProfile});;
            
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
 
                res.render('page/my-ads', {user, newBox, paginate, boxProducts, countMessages, countNegotiationsBuySell, searchProfile});
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
                            
            newBox = boxProducts.slice(V , limit + X); //el primer parametro indica la posicion y el segundo indica la cantidad de elementos.
            //       10   + 23  / 10 = 3.3 pero el Mat.ceil lo lleva a 4 perfecto
            pagina = Math.ceil((limit + X) / limit);
            console.log("pagina :  ", pagina);
            console.log("totalPagina :  ", totalPagina);
            const paginate = { "pagina" : pagina, "totalPagina" : totalPagina };
 
            res.render('page/my-ads', {user, newBox, paginate, boxProducts, countMessages, countNegotiationsBuySell, searchProfile});  
 
        }
        

    }  else {

        res.render('page/my-ads', {user});
    }   
        
    
});


module.exports = routes;

