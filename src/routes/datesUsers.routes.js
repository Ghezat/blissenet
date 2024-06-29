const { Router } = require('express');
const routes = Router();
const modelProfile = require('../models/profile.js');


routes.post('/date', async (req, res)=>{
  boxDate = [];
  //console.log("Esto es lo que llega del Front ---->",req.body);
  const Username = req.body.store;
  console.log("esto es Username",Username)                                                  
  const searchProfile = await modelProfile.find({ username: Username });
  const dateCreation = searchProfile[0].createdAt
  console.log("Esto es dateCreation", dateCreation)

  time();

  function time(){
 
  const year = dateCreation.getFullYear();  
  //console.log('Esto es año', year);
  const month = dateCreation.getMonth() + 1;
  //console.log('Esto es mes', month);
  const day = dateCreation.getDate();
  //console.log('Esto es dia', day);

  const yearCurrent = new Date().getFullYear();
  //console.log('Esto es el año actual', yearCurrent);

  boxDate.push(year, month, day, yearCurrent);

  res.json(boxDate);
  };
  

 
  

});

module.exports = routes;