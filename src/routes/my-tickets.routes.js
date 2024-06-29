const { Router } = require('express');
const routes = Router()
const modelTickets = require('../models/tickets.js');
const modelRaffle = require('../models/raffle.js');
const modelProfile = require('../models/profile.js');

//const user = require('../models/user.js');


routes.get('/mytickets', async (req,res)=>{
    const user = req.session.user;    
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    let searchProfile, tickets;

    const deleteTicket = req.session.deleteTicket;
    const deleteNoTicket = req.session.deleteNoTicket;
    delete req.session.deleteTicket;
    delete req.session.deleteNoTicket

    const page = req.query.page;
    const options = {
        page: parseInt(page, 10) || 1,
        limit: 3
    }
        
    if (user){
        console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.find({ indexed : user._id });
        console.log("Aqui el profile de la cuenta", searchProfile);
        const username = user.username;
        //const cardArticleArts = await modelRaffle.paginate({paused : false }, options );
        tickets = await modelTickets.paginate({ username : username}, options );
        //tickets = await modelTickets.find({ username : username });
        console.log("tickets ---->", tickets); //esto es un array
    }


    res.render('page/my-tickets', {user, countMessages, countNegotiationsBuySell, searchProfile, tickets, deleteTicket, deleteNoTicket});
  
});

routes.post('/mytickets', async (req,res)=>{
    console.log("**********id raffle **********")
    console.log(req.body);
    const id = req.body.id;
    console.log(id);
    const search = await modelRaffle.findById(id);
    //console.log("Esto es search de modelRaffle", search);

    res.json(search);


});


routes.get('/deleteTicket/:id/:serial', async (req, res)=>{

    const ID = req.params.id; // id_raffle
    const serial = req.params.serial; // serial
    console.log(" ****** Mira abajo el ID del Raffle que debemos investigar ******* ");
    console.log("Esto es ID ------------>", ID);
    const result = await modelRaffle.findById(ID);
    console.log("Esto result :", result);

    if (result !== null){
        //aqui enviara un mensaje diciendo que no se puede elimiinar el tickets
        req.session.deleteNoTicket = 'El Ticket No puede ser borrado. ¡El Sorteo aun existe!';
        res.redirect('/mytickets');

    } else {
        //aqui enviara un mensaje diciendo el tickets fue borrado de su lista
        //const ver = await modelTickets.find({ serial: serial });
        //console.log("Este es el Ticket a eliminar :", ver);
        const deleteTicket = await modelTickets.deleteOne({ serial: serial });
        //console.log("Este es el Ticket eliminado :", deleteTicket);
        req.session.deleteTicket = `El Ticket ${serial} ha sido borrado de su lista`;
        res.redirect('/mytickets');

    }


});

module.exports = routes;