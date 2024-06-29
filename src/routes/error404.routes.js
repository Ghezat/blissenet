const { Router } = require('express');
const routes = Router()

routes.get('/*', (req,res)=>{
    res.render('partials/error404');
})


module.exports = routes;