const { Router } = require('express');
const routes = Router()
const nodemailer = require('nodemailer');
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelBuysell = require('../models/buySell.js');
const modelNegotiation = require('../models/negotiations.js');

const modelArtes = require('../models/artes.js');
const modelAirplane = require('../models/airplane.js');
const modelItems = require('../models/items.js');
const modelAutomotive = require('../models/automotive.js');
const modelRealstate = require('../models/realstate.js');
const modelNautical = require('../models/nautical.js');
const modelService = require('../models/services.js');
const user = require('../models/user.js');

const cloudinary = require('cloudinary').v2;//esto no tendrá cambio

cloudinary.config({
  cloud_name : process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret : process.env.API_SECRET,
  secure: true
})

//esta es la direccion cuando se gana una subasta. 
routes.post('/buysell-one/direct/auction', async(req, res)=>{
  console.log(" ________ aqui_______")
  console.log("Has llegado a la direccion /buysell-one/direct/auction");
  console.log("Esta es la informacion que se ha recibido : ", req.body);
  res.json(req.body);

});

//Esta direccion forma la informacion necesaria para crear la sala donde vendedor y comprador se reunen 
//esta informacion se guardara en buySell si es arts, items, auction
//para el resto se guaradara en negotiation (airplane, automotive, realstate, service) 
routes.get('/buysell-one/direct/:username/:usernameSell/:depart/:id', async(req, res)=>{
  const user = req.session.user;
  const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
  const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

  const searchProfile = await modelProfile.find({ indexed : user._id });

  console.log('He llegado al apartado de buy&sell');
  const buyselle = req.params; //todos los datos necesarios para la compraVenta
  const userBuy = req.params.username; //aqui el username del comprador
  const userSell = req.params.usernameSell; //aqui el username del vendedor
  const depart = req.params.depart; //aqui el department
  const idProduct = req.params.id; //aqui el id del articulo, producto o servicio.
  let indexed, emailSell, emailBuy;


    //crear el correo del vendedor y enviarlo, caso artes e items
    function mailSell(emailSell, title){
     
        const message = "Venta realizada"
        const contentHtml = `
        <h2 style="color: black"> Felicidades has realizado una nueva venta. </h2>
        <ul> 
            <li> cuenta : ${emailSell} </li> 
            <li> asunto : ${message} </li>
        <ul>
        <h2> Has vendido ${title} </h2>
        <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y vaya al apartado de negociacion, donde le estará esperando su comprador. </p>
        `

        //enviar correo
        //(SMTP)-> Simple Mail Transfer Protocol --> es el protocolo con que los servidores se comunican a traves de correos.
        const emailMessage = {
            from: "Blissenet<sistemve@blissenet.com>", //remitente
            to: emailSell,
            subject: "💰 Felicidades has vendido - Blissenet", //objeto
            text: message,
            html: contentHtml
        };

        //añadir las credenciales
        const transport = nodemailer.createTransport({
            host: "mail.blissenet.com",
            port: 465,
            auth: {
                user: "sistemve@blissenet.com",
                pass: process.env.pass_sistemve
            }
        });

        transport.sendMail(emailMessage, (error, info) => {
            if (error) {
                console.log("Error enviando email")
                console.log(error.message)
            } else {
                console.log("Email enviado")
                
            }
        }) 
    
    }

    //crear el correo del comprador y enviarlo, caso artes e items
    function mailBuy(emailBuy, title){

      const message = "Compra realizada"
      const contentHtml = `
      <h2 style="color: black">Felicidades has realizado una nueva compra. </h2>
      <ul> 
          <li> cuenta : ${emailBuy} </li> 
          <li> asunto : ${message} </li>
      <ul>
      <h2> Has comprado ${title} </h2>
      <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y vaya al apartado de negociacion, donde le estará esperando su vendedor. </p>
      `

      const emailMessage = {
          from: "Blissenet<sistemve@blissenet.com>", //remitente
          to: emailBuy,
          subject: "😃 Felicidades has comprado - Blissenet", //objeto
          text: message,
          html: contentHtml
      };

      //añadir las credenciales
      const transport = nodemailer.createTransport({
          host: "mail.blissenet.com",
          port: 465,
          auth: {
              user: "sistemve@blissenet.com",
              pass: process.env.pass_sistemve
          }
      });

      transport.sendMail(emailMessage, (error, info) => {
          if (error) {
              console.log("Error enviando email")
              console.log(error.message)
          } else {
              console.log("Email enviado")
              
          }
      }) 
  
    }

    //crear el correo del vendedor y enviarlo, caso de contactos
    function mailSellContact(emailSell, title){
  
        const message = "Negociación en desarrollo."
        const contentHtml = `
        <h2 style="color: black"> Tienes una nueva negociación. </h2>
        <ul> 
            <li> cuenta : ${emailSell} </li> 
            <li> asunto : ${message} </li>
        <ul>
        <h2> Tienes un interesado en ${title} </h2>
        <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y vaya al apartado de negociación, donde le estará esperando su comprador. </p>
        `

        //enviar correo
        //(SMTP)-> Simple Mail Transfer Protocol --> es el protocolo con que los servidores se comunican a traves de correos.
        const emailMessage = {
            from: "Blissenet<sistemve@blissenet.com>", //remitente
            to: emailSell,
            subject: "💼 Negociación en desarrollo - Blissenet", //objeto
            text: message,
            html: contentHtml
        };

        //añadir las credenciales
        const transport = nodemailer.createTransport({
            host: "mail.blissenet.com",
            port: 465,
            auth: {
                user: "sistemve@blissenet.com",
                pass: process.env.pass_sistemve
            }
        });

        transport.sendMail(emailMessage, (error, info) => {
            if (error) {
                console.log("Error enviando email")
                console.log(error.message)
            } else {
                console.log("Email enviado")
                
            }
        }) 
    
    }

    //crear el correo del comprador y enviarlo, caso de contactos
    function mailBuyContact(emailBuy, title){

      const message = "Negociación en desarrollo."
      const contentHtml = `
      <h2 style="color: black"> Tienes una nueva negociación. </h2>
      <ul> 
          <li> cuenta : ${emailBuy} </li> 
          <li> asunto : ${message} </li>
      <ul>
      <h2> Interesado en ${title} </h2>
      <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y vaya al apartado de negociación, donde le estará esperando su vendedor. </p>
      `

      const emailMessage = {
          from: "Blissenet<sistemve@blissenet.com>", //remitente
          to: emailBuy,
          subject: "💼 Negociación en desarrollo - Blissenet", //objeto
          text: message,
          html: contentHtml
      };

      //añadir las credenciales
      const transport = nodemailer.createTransport({
          host: "mail.blissenet.com",
          port: 465,
          auth: {
              user: "sistemve@blissenet.com",
              pass: process.env.pass_sistemve
          }
      });

      transport.sendMail(emailMessage, (error, info) => {
          if (error) {
              console.log("Error enviando email")
              console.log(error.message)
          } else {
              console.log("Email enviado")
              
          }
      }) 
  
    }


  async function searchData(){

    const searchIndexed = await modelProfile.find( { username : userSell } );
    indexed = searchIndexed[0].indexed;

    //aqui obtengo los email de ambas partes
    const emailSELL = await modelUser.find({ username : userSell }, {_id: 0, email : 1}); //aqui solo recupero el correo del vendedor;
    const emailBUY = await modelUser.find({ username : userBuy }, {_id: 0, email : 1}); //aqui solo recupero el correo del comprador;

    //console.log("emailSell ->", emailSell); console.log("emailBuy ->", emailBuy);

    emailSell = emailSELL[0].email //scorpinosred@gmail.com
    emailBuy = emailBUY[0].email //onixbastardo@gmail.com

  }

  async function departEject(){
    //console.log("Esto es buyselle--------------->", buyselle)
    //Aqui es donde se define la comision de pago a la plataforma siendo para Arte y Items el 5%
    //Auction es el 3% no aparece aqui porque esta se crea automaticamante en depart-auction
    
      if (depart == 'arts') {
        let valueCommission = 0;
        const search = await modelArtes.findById(idProduct);
        //console.log("Este es el resultado de la busqueda de la coleccion arts, aqui el objeto--->", search);
        
        const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
        const image = search.images[0].url;
        const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgBuySell'});
        //console.log("Aqui resultUpload ----->", resultUpload);
        const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
        const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.
        //ya con todos los datos necesarios se procede a guardarlo en la coleccion modelBuysell.
              
        valueCommission = (price * 0.05);
        let commission = valueCommission.toFixed(2); 

        const BuySell = new modelBuysell({ usernameBuy : userBuy, usernameSell : userSell, indexed, department : depart, title, title_id : idProduct, tecnicalDescription, image : dImage, price, commission  });
        const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
        //console.log('Aqui BuySell ---->', BuySell);
        
        mailSell(emailSell, title);
        mailBuy(emailBuy, title);

        //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
        res.render('page/buysell-one', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell }); 
      }

      if (depart == 'items') {
        let valueCommission = 0;
        const search = await modelItems.findById(idProduct);
        //console.log("Este es el resultado de la busqueda de la coleccion items, aqui el objeto--->", search);
        
        const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
        const image = search.images[0].url;
        const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgBuySell'});
        //console.log("Aqui resultUpload ----->", resultUpload);
        const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
        const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.
        //ya con todos los datos necesarios se procede a guardarlo en la coleccion modelBuysell.
              
        valueCommission = (price * 0.05);
        let commission = valueCommission.toFixed(2); 

        const BuySell = new modelBuysell({ usernameBuy : userBuy, usernameSell : userSell, indexed, department : depart, title, title_id : idProduct, tecnicalDescription, image : dImage, price, commission });
        const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
        //console.log('Aqui BuySell ---->', BuySell);

        mailSell(emailSell, title);
        mailBuy(emailBuy, title);

        //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
        res.render('page/buysell-one', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell }); 
      }
    
      if (depart == 'airplanes' ) {

        const search = await modelAirplane.findById(idProduct);
        //console.log("Este es el resultado de la busqueda de la coleccion airplane, aqui el objeto--->", search);
        
        const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
        const image = search.images[0].url;
        const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgBuySell'});
        //console.log("Aqui resultUpload ----->", resultUpload);
        const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
        const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.
        //ya con todos los datos necesarios se procede a guardarlo en la coleccion modelBuysell.
              
        const BuySell = new modelNegotiation({ usernameBuy : userBuy, usernameSell : userSell, department : depart, title, title_id : idProduct, tecnicalDescription, image : dImage, price });
        const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
        //console.log('Aqui BuySell ---->', BuySell);

        mailSellContact(emailSell, title);
        mailBuyContact(emailBuy, title);

        //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
        res.render('page/buysell-one', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell }); 
      }

      if ( depart == 'automotive' ) {

        const search = await modelAutomotive.findById(idProduct);
        //console.log("Este es el resultado de la busqueda de la coleccion arts, aqui el objeto--->", search);
        
        const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
        const image = search.images[0].url;
        const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgBuySell'});
        //console.log("Aqui resultUpload ----->", resultUpload);
        const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
        const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.
        //ya con todos los datos necesarios se procede a guardarlo en la coleccion modelBuysell.
              
        const BuySell = new modelNegotiation({ usernameBuy : userBuy, usernameSell : userSell, department : depart, title, title_id : idProduct, tecnicalDescription, image : dImage, price });
        const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
        //console.log('Aqui BuySell ---->', BuySell);

        mailSellContact(emailSell, title);
        mailBuyContact(emailBuy, title);

        //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
        res.render('page/buysell-one', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell }); 
      }

      if ( depart ==  'realstate' ) {

        const search = await modelRealstate.findById(idProduct);
        //console.log("Este es el resultado de la busqueda de la coleccion arts, aqui el objeto--->", search);
        
        const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
        const image = search.images[0].url;
        const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgBuySell'});
        //console.log("Aqui resultUpload ----->", resultUpload);
        const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
        const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.
        //ya con todos los datos necesarios se procede a guardarlo en la coleccion modelBuysell.
              
        const BuySell = new modelNegotiation({ usernameBuy : userBuy, usernameSell : userSell, department : depart, title, title_id : idProduct, tecnicalDescription, image : dImage, price  });
        const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
        //console.log('Aqui BuySell ---->', BuySell);

        mailSellContact(emailSell, title);
        mailBuyContact(emailBuy, title);

        //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
        res.render('page/buysell-one', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell }); 
      }

      if ( depart == 'nautical' ) {

        const search = await modelNautical.findById(idProduct);
        //console.log("Este es el resultado de la busqueda de la coleccion arts, aqui el objeto--->", search);
        
        const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
        const image = search.images[0].url;
        const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgBuySell'});
        //console.log("Aqui resultUpload ----->", resultUpload);
        const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
        const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.
        //ya con todos los datos necesarios se procede a guardarlo en la coleccion modelBuysell.
              
        const BuySell = new modelNegotiation({ usernameBuy : userBuy, usernameSell : userSell, department : depart, title, title_id : idProduct, tecnicalDescription, image : dImage, price });
        const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
        //console.log('Aqui BuySell ---->', BuySell);

        mailSellContact(emailSell, title);
        mailBuyContact(emailBuy, title);

        //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
        res.render('page/buysell-one', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell }); 
      }

      if ( depart == 'service' ) {

        const search = await modelService.findById(idProduct);
        //console.log("Este es el resultado de la busqueda de la coleccion arts, aqui el objeto--->", search);
        
        const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
        const image = search.images[0].url;
        const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgBuySell'});
        //console.log("Aqui resultUpload ----->", resultUpload);
        const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
        const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.
        //ya con todos los datos necesarios se procede a guardarlo en la coleccion modelBuysell.
              
        const BuySell = new modelNegotiation({ usernameBuy : userBuy, usernameSell : userSell, department : depart, title, title_id : idProduct, tecnicalDescription, image : dImage, price });
        const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
        //console.log('Aqui BuySell ---->', BuySell);

        mailSellContact(emailSell, title);
        mailBuyContact(emailBuy, title);

        //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
        //de esta forma se logra proveer a los usuarios de un Historial que estara siempre a su disposicion.
        res.render('page/buysell-one', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell }); 
      }

      //:::::::: Nota Importante de Auction :::::::::
      //aqui dependiendo del departamento se forma una nueva coleccion que puede ser negotiation o buySell
      //no aparece auction porque esta se forma de manera automatico por el node-cron en la route depart-auction.routes.js
      //despues de tener la colleccion buySell y negotiation, se procede ha crear el invoice del buySell cuando el vendedor valida su pago para los departamentos :
      //'items', 'arts', 'auctions'; mientras que para el resto de los departamentos la invoice se crea acto seguido de crearse el anuncio.
      // buySell y negotiation se usan para el historial y para poder luego gestionar en el casi del buySell la invoice.
      //la invoice es el ultimo producto realizado
 
  }
  
  searchData()
    .then(()=>{
      departEject()
        .then(()=>{
          console.log("Compra ejecutada satisfactoriamente")
        })
        .catch((error)=>{
          console.log("Ha ocurrido un error", error);
        })
    })
    .catch((error)=>{
      console.log("Ha ocurrido un error", error);
    })


});


//esta ruta es la que presenta toda la informacion en buysell-body
routes.get('/buysell-body/:id', async(req, res)=>{
  const user = req.session.user;
  console.log("Esto es user----->", user._id);
  const countMessages = req.session.countMessages;
  const searchProfile = await modelProfile.find({ indexed : user._id });
        
  //aqui obtengo la cantidad de negotiationsBuySell
  const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
  console.log(":::: Esto es la cantidad de negotiationsBuySell, estoy en view-artes ::::", countNegotiationsBuySell);

  console.log('He llegado al apartado de buy&sell-body');
  console.log("Este es el parametro ----> ", req.params);
  const buySellId = req.params.id;

  const buySell =  await modelBuysell.findById(buySellId);
  const msg = buySell.written.reverse(); // aqui se revierte el array written para que el front el forEach() pueda recorrerlo en sentido inverso.

  console.log("buySell, Que hay aqui? --->", buySell);
  console.log("msg, Que hay aqui? --->", msg);
  const fecha =  buySell.createdAt;
  const dia = fecha.getDate();
  const mes = fecha.getMonth() + 1;
  const anio = fecha.getFullYear();
  const fechaNegotiation = ` ${dia}-${mes}-${anio}`
  console.log(fechaNegotiation);
  
  res.render('page/buysell-body', {user, searchProfile, countNegotiationsBuySell, countMessages, buySell, fechaNegotiation, msg}); 
});


routes.get('/negotiation-body/:id', async(req, res)=>{
  const user = req.session.user;
  console.log("Esto es user----->", user._id);
  const countMessages = req.session.countMessages;
  const searchProfile = await modelProfile.find({ indexed : user._id });
        
  //aqui obtengo la cantidad de negotiationsBuySell
  const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
  console.log(":::: Esto es la cantidad de negotiationsBuySell, estoy en view-artes ::::", countNegotiationsBuySell);
  
  console.log('He llegado al apartado de negotiation-body');
  console.log("Este es el parametro ----> ", req.params);
  const negotiationId = req.params.id;

  const buySell =  await modelNegotiation.findById(negotiationId);
  const msg = buySell.written.reverse(); // aqui se revierte el array written para que el front el forEach() pueda recorrerlo en sentido inverso.

  console.log("negotiation, Que hay aqui? --->", buySell);
  console.log("msg, Que hay aqui? --->", msg);
  const fecha =  buySell.createdAt;
  const dia = fecha.getDate();
  const mes = fecha.getMonth() + 1;
  const anio = fecha.getFullYear();
  const fechaNegotiation = ` ${dia}-${mes}-${anio}`
  console.log(fechaNegotiation);
  
  res.render('page/buysellNegotiation-body', {user, searchProfile, countNegotiationsBuySell, countMessages, buySell, fechaNegotiation, msg}); 
});

routes.post('/negotiation-body/closed', async(req, res)=>{
  const body = req.body
  const idOrder = req.body.idOrder;
  console.log("estamos en /negotiation-body/closed para editar el campo closedContact")  
  console.log("Este es el body", body);
  const closed = await modelNegotiation.findByIdAndUpdate(idOrder, { closedContact : true } );
  console.log('esto es la modificacion', closed);
  res.json(closed); //esto es la respuesta un objeto, al recibir esto la pagina se refresca y se cierra  todo.
   
});
             
routes.post('/negotiation-body/visible', async(req, res)=>{
  const user = req.session.user;
  const body = req.body
  const idOrder = req.body.idOrder;
  console.log("estamos en /negotiation-body/visible para editar el campo visibleBuy")  
  console.log("Este es el body", body);
  const idContact = await modelNegotiation.findById(idOrder);
  console.log("Esto es idContact", idContact);

  if ( idContact.usernameBuy === user.username ){
    console.log("ha psado por aqui usernameBuy", user.username);
    const updateVisible = await modelNegotiation.findByIdAndUpdate(idOrder, { visibleBuy : false } );
    res.json(updateVisible); //esto es la respuesta un objeto, al recibir esto la pagina se refresca y se cierra  todo.
  }

  if ( idContact.usernameSell === user.username ){
    console.log("ha psado por aqui usernameSell", user.username);
    const updateVisible = await modelNegotiation.findByIdAndUpdate(idOrder, { visibleSell : false } );
    res.json(updateVisible); //esto es la respuesta un objeto, al recibir esto la pagina se refresca y se cierra  todo.
  }
   
});

routes.post('/buysell-body/pay', async(req, res)=>{
  const body = req.body
  const idOrder = req.body.idOrder;  
  console.log("Este es el body", body);
  const pay = await modelBuysell.findByIdAndUpdate(idOrder, {pay : true });
  console.log('esto es la modificacion', pay);
  res.json(pay);
   
});

routes.post('/buysell-body/cancel', async(req, res)=>{
  const body = req.body
  const idOrder = req.body.idOrder;  
  console.log("Este es el body", body);
  const pay = await modelBuysell.findByIdAndUpdate(idOrder, {pay : false, cancel : true });
  console.log('esto es la modificacion', pay);
  res.json(pay); 
});

routes.post('/buysell-body/cancel-calicoment', async(req, res)=>{
  //aqui el comprador califica y deja un comentario a su vendedor.
  const body = req.body
  console.log("Este es el body", body);
  const idOrder = body.idOrder;
  const rating = body.rating;
  const comment = body.comment;
  const calicoment = await modelBuysell.findByIdAndUpdate(idOrder, {ratingSeller : rating , CommentSeller : comment });
  res.json(calicoment);  
});

routes.post('/buysell-body/sellerCancel', async(req, res)=>{
  //aqui el vendedor califica y deja un comentario a su vendedor despues qu ele cancelaron la orden.
  const body = req.body
  console.log("Este es el body", body);
  const idOrder = body.idOrder;
  const rating = body.rating;
  const comment = body.comment;
  const calicoment = await modelBuysell.findByIdAndUpdate(idOrder, {ratingBuy : rating , CommentBuy : comment });
  res.json(calicoment);  
});

//esta ruta es para que el vendedor confirme el pago que sera Yes o No
routes.post('/buysell-body/confirm', async(req, res)=>{
  const body = req.body
  const response = body.confirm;
  const idOrder = body.idOrder;
  const rating = body.rating;
  const Comment = body.comment;
  console.log("Este es el body ---->", body);
  console.log("Este es el idOrder ---->", idOrder);
  console.log("Este es la respuesta del vendedor ---->", response);
  console.log("Esta es la calificacion del vendedor ---->", rating);
  console.log("Este es el comentario del vendedor sobre su comprador ---->", Comment);

  if (response == 'Yes'){
    console.log("la respuesta ha sido satisfactoria y se cierra la orden");
    const confirm = await modelBuysell.findByIdAndUpdate(idOrder, {confirmPay : response, ratingBuy : rating, CommentBuy : Comment });            
    res.json(confirm);
  } else {
    console.log("la respuesta ha sido negativa y se cierra la orden");
    const confirm = await modelBuysell.findByIdAndUpdate(idOrder, {confirmPay : response, ratingBuy : rating, CommentBuy : Comment });
    res.json(confirm);
  }
  

});

routes.post('/buysell-body/buyerTrue', async(req, res)=>{
  const body = req.body
  console.log ("esto es lo que esta llegando al backend", body);
  const idOrder = body.idOrder;
  const rating = body.rating;
  const comment = body.comment;
  console.log("Este es el idOrder ---->", idOrder);
  console.log("Esta es la calificacion del vendedor ---->", rating);
  console.log("Este es el comentario del vendedor sobre su comprador ---->", comment);
  console.log("la respuesta ha sido satisfactoria y se cierra la orden");

  const buyerTrue = await modelBuysell.findByIdAndUpdate(idOrder, { ratingSeller : rating, CommentSeller : comment });            
  res.json(buyerTrue);
});

routes.get('/buysell-list/', async(req, res)=>{
  const user = req.session.user;
  let username, searchProfile; 
  let searchOneBuy, searchTwoBuy, searchOneSell, searchTwoSell, countNegotiationsBuySell;
  const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
  const searchBuy = [];
  const searchSell = [];
  
  if (user){
    username = user.username;
    searchProfile = await modelProfile.find({ indexed : user._id });

    searchOneBuy = await modelBuysell.find({  $and : [{usernameBuy : username},{CommentSeller : 'no_comment'}] });
    if (searchOneBuy){
      //console.log("eres el comprador", searchOneBuy);
      searchBuy.push(...searchOneBuy);
    }
    searchTwoBuy = await modelNegotiation.find({ $and : [{ usernameBuy : username }, { closedContact : false }]} );
    if (searchTwoBuy){
      //console.log("eres el comprador", searchTwoBuy);
      searchBuy.push(...searchTwoBuy);
    }
  
    searchOneSell = await modelBuysell.find({ $and : [{usernameSell : username}, {CommentBuy : 'no_comment'}] });
    if (searchOneSell){
      //console.log("eres el vendedor", searchOneSell);
      searchSell.push(...searchOneSell);
    }  
    searchTwoSell = await modelNegotiation.find({ $and : [{ usernameSell : username }, { closedContact : false }]} );
    if (searchTwoSell){
      //console.log("eres el vendedor", searchTwoSell);
      searchSell.push(...searchTwoSell);
    }

    countNegotiationsBuySell = (searchBuy.length + searchSell.length);

  }
 
  console.log('He llegado al apartado de buySell-list');

  res.render('page/buysell-list', {user, searchProfile, countMessages, countNegotiationsBuySell, searchBuy, searchSell}); 
});

// ruta donde se ingresan los mensajes enviados en el chat de los usuarios en BuySell
routes.post('/buysell-message/', async(req, res)=>{ 
 const bodyWritten = req.body;
 console.log(bodyWritten);
 const {user, written, idDocument, time} = bodyWritten;
 const objectData = {user, written, time}; 
 console.log("Aqui el objectData---->", objectData);                               
 const pusheando = await modelBuysell.findByIdAndUpdate(idDocument, { $push: { written : objectData } });
 console.log("Aqui pusheando ---->",pusheando);
 
 res.json(req.body);//importante esto que no se me olvide.
});

// ruta donde se ingresan los mensajes enviados en el chat de los usuarios en Contact
routes.post('/buysell-negotiation-message/', async(req, res)=>{ 
  const bodyWritten = req.body;
  console.log(bodyWritten);
  const {user, written, idDocument, time} = bodyWritten;
  const objectData = {user, written, time}; 
  console.log("Aqui el objectData---->", objectData);                               
  const pusheando = await modelNegotiation.findByIdAndUpdate(idDocument, { $push: { written : objectData } });
  console.log("Aqui pusheando ---->",pusheando);
  
  res.json(req.body);//importante esto que no se me olvide.
});
 

module.exports = routes;

