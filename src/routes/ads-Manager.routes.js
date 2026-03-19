const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelStopped = require('../models/stoppedUser.js');
 
const modelArtes = require('../models/artes.js');
const modelAirplane = require('../models/airplane.js');
const modelItems = require('../models/items.js');
const modelAutomotive = require('../models/automotive.js');
const modelRealstate = require('../models/realstate.js');
const modelNautical = require('../models/nautical.js');
const modelService = require('../models/services.js');
const modelAuction = require('../models/auction.js');
const modelRaffle = require('../models/raffle.js');
const modelRaffleHistory = require('../models/raffleHistory.js');

//---------------------------adsmanager--------------------------------

routes.get('/adsManager/:user_id', async(req, res)=>{
   
    try {
       
        console.log("*********ADS Manager******** -->");
        const user = req.session.user;
        const userID = user._id;
        console.log("este es el usuario propietario que esta logeado -->", userID);

        //ahora vamos a obtener el user_id del parametro para hacer una comparacion y de esta forma asegurar que solo el propietario esta accediendo a esta parte.
        const userIDParam = req.params.user_id;
        console.log("este es el usuario propietario que esta logeado -->", userIDParam);

        //este es el usuario propietario que esta logeado --> 66ac0281a3afb22ac770d5f2
        //este es el usuario propietario que esta logeado --> 66ac0281a3afb22ac770d5f2

        if (userID === userIDParam){
            //comprobamos que el usuario logeado es el mismo dueño de la tienda -POR SEGURIDAD-

            const countMessages = req.session.countMessages
            console.log("esto es countMessages -->", countMessages);
            //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
            //aqui obtengo la cantidad de negotiationsBuySell
            const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
            console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
   
            let searchProfile;
       
            if (user){
                //console.log("Esto es user._id ------>", user._id );
                searchProfile = await modelProfile.findOne({ indexed : user._id });
                console.log("searchProfile -->", searchProfile);

                res.render('page/adsManager', { user, searchProfile, countMessages, countNegotiationsBuySell });
               
            }  

        }
       

    } catch (error) {
        console.log("Ha habido un error en la carga de /adsManager/:user_id", error);
    }
                     
});



module.exports = routes;