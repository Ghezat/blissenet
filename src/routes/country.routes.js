const { Router } = require('express');
const routes = Router()

const venezuela = require('venezuela');

//ruta que maneja toda la informacion del pais en donde va a operar esta pagina.
routes.get('/country', async (req,res)=>{

const ve = venezuela.pais
//console.log("Esto es ve", ve);
res.json(ve);

});


module.exports = routes;