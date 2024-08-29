const { Router } = require('express');
const routes = Router();
const modelProfile = require('../models/profile.js');


routes.post('/date', async (req, res)=>{

  try {
    
    boxDate = [];
    //console.log("Esto es lo que llega del Front ---->",req.body);
    const Username = req.body.store;
    console.log("esto es Username", Username);                                                  
    const searchProfile = await modelProfile.find({ username: Username });
    console.log("searchProfile", searchProfile);
    const dateCreation = searchProfile[0].createdAt
    console.log("Esto es dateCreation", dateCreation)

    time();

    function time(){
  
      const year = dateCreation.getFullYear();  
      const month = dateCreation.getMonth() + 1;
      const day = dateCreation.getDate();

      const yearCurrent = new Date().getFullYear();
      //console.log('Esto es el año actual', yearCurrent);

      boxDate.push(year, month, day, yearCurrent);

      res.json(boxDate);
    };
    
  } catch (error) {
    console.log("ha ocurrido un error y debe ser evisado routes.post :/date", error); 
  }  


});

module.exports = routes;