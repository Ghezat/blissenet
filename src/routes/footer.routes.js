const { Router } = require('express');
const routes = Router()

const user = require('../models/user.js');
const modelProfile = require('../models/profile.js');

routes.get('/manual', async (req,res)=>{

    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell
    let searchProfile;
    
    if (user){
        //console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
    }

    res.render('footerPage/manual', {user,searchProfile, countMessages, countNegotiationsBuySell });

});

routes.get('/terms', async (req,res)=>{

    const user = req.session.user;
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell
    let searchProfile;
    
    if (user){
        //console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
    }

    res.render('footerPage/terms', {user,searchProfile, countMessages, countNegotiationsBuySell });

});

module.exports = routes;