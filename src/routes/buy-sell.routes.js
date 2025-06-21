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
const modelTransportAgent = require('../models/transportAgent.js');
const modelBankUser = require('../models/bankUser.js');
const user = require('../models/user.js');

//este Token es la KEY del bot de Telegram
const Token =  process.env.Token_Bot;

const cloudinary = require('cloudinary').v2;//esto no tendrá cambio

cloudinary.config({
  cloud_name : process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret : process.env.API_SECRET,
  secure: true
})

const axios = require('axios');
const fs = require('fs-extra');
const {S3} = require('aws-sdk');

const endpoint = 'nyc3.digitaloceanspaces.com';
const bucketName = 'bucket-blissve';

const s3 = new S3({
    endpoint,
    region : 'us-east-1',
    credentials : {
        accessKeyId : process.env.ACCESS_KEY,
        secretAccessKey : process.env.SECRET_KEY
    }
});


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
routes.post('/buysell/direct', async(req, res)=>{
  //modo compra directa, compras que no son son de carrito, todas son gratis
  try {
    
        const user = req.session.user;
        const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell
      
        console.log('He llegado al apartado de buysell/direct ....................................');
        
        const { vendedor, comprador, depart, idProduct, countRequest, unitPrice, delivery } = req.body;
        let chatId, usernameBuy, usernameSell, indexedSell, indexedBuy, fechaNegotiation, codeDate, image, total, deliveryType;
        let emailSell, emailBuy;
        let titleArticle; //esta variable se declara afuera para luego usar en la funcion de envio de Telegrama. 
        
        console.log("idProduct :", idProduct) // primer dato.
        console.log("user._id :", user._id) // segundo dato.
        
        const searchBuySell = await modelBuysell.findOne({ title_id : idProduct, indexedBuy : user._id, closeOperationBuy : false } );
        
        console.log("searchBuySell :", searchBuySell); 

        if (searchBuySell){

            const id = searchBuySell._id;
            console.log("ya el documento existe debemos rediriguir");
            res.redirect(`/buysell-body/${id}`);

        } else {

              console.log("el documento NO existe");
          
              //creamos el dato total 
              total = (unitPrice * countRequest).toFixed(2); 


              console.log("vendedor, comprador, depart, idProduct, countRequest, unitPrice");
              console.log(vendedor, comprador, depart, idProduct, countRequest, unitPrice);

              let userBuy = comprador //aqui el username del comprador ------------"Visitante comprador esto es el id"
              let userSell = vendedor //aqui el username del vendedor --------"Anunciante vendedor esto es el id"
              indexedSell = vendedor;
              indexedBuy = comprador;
           

              //esto lo usare para el envio del telegrama.
              const searchSell = await modelUser.findById( userSell, { _id: 0, "blissBot.chatId" : 1, username : 1 });
              chatId = searchSell.blissBot.chatId; //este es el chatId del user.
              usernameSell = searchSell.username; //el username del vendedor.

              const searchBuy = await modelUser.findById( userBuy );
              usernameBuy = searchBuy.username; //el username del comprador.
    
      
              const fecha =  new Date();
              const dia = fecha.getDate();
              const mes = fecha.getMonth() + 1;
              const anio = fecha.getFullYear();
              fechaNegotiation = `${dia}-${mes}-${anio}`
              console.log(fechaNegotiation);

              codeDate = `${dia}${mes}${anio}`;

              //tenemos que descubir la ubicacion del vendedor y del comprador.
              //Datos requeridos: country, state, city ----------------------------
              const sellLocation = await modelProfile.findOne({indexed : userSell}); 
              const sell_city = sellLocation.city;
              const sell_state = sellLocation.state;
              const sell_country = sellLocation.country;

              const buyLocation = await modelProfile.findOne({indexed : userBuy});
              const buy_city = buyLocation.city;
              const buy_state = buyLocation.state;
              const buy_country = buyLocation.country; 


              if ( sell_state == buy_state && sell_country == buy_country ){

                deliveryType = "Envio Local" 
              
              } else if ( sell_state != buy_state && sell_country == buy_country ) {

                deliveryType = "Envio Interurbano" 

              } else if ( sell_country != buy_country ) {
              
                deliveryType = "Envio Internacional" 

              }


            //Objetivo de esta funcion es buscar los correos de ambas partes
            async function searchData(){

              //aqui obtengo los email de ambas partes
              const emailSELL = await modelUser.findById( userSell, {_id: 0, email : 1}); //aqui solo recupero el correo del vendedor;
              const emailBUY = await modelUser.findById( userBuy, {_id: 0, email : 1}); //aqui solo recupero el correo del comprador;

              //console.log("emailSell ->", emailSell); console.log("emailBuy ->", emailBuy);
              emailSell = emailSELL.email //scorpinosred@gmail.com
              emailBuy = emailBUY.email //onixbastardo@gmail.com

              console.log(`emailSell : ${emailSell}  emailBuy : ${emailBuy}`);
              console.log("vamos bien hemos capturado los correos usando los id que es mas rapido.");

            }

            searchData()
                .then(()=>{
                    departEject()
                })
                .catch((error)=>{
                  console.log("Ha ocurrido un error en searchData()", error);
                })

        }    
        //-------------------------------------------------------------------
             
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



      async function departEject(){
        //console.log("Esto es buyselle--------------->", buyselle)
        //Tambien se guarda una imagen inicial de la negociacion que es la que se mustra en la sala de negociacion
      
          if (depart == 'arts') {
        
            let dImage;
            const search = await modelArtes.findById(idProduct);
            //console.log("Este es el resultado de la busqueda de la coleccion arts, aqui el objeto--->", search);
            
            const {title, tecnicalDescription, price, count} = search; //esto se llama destructurin todo en una misma linea.
            image = search.images[0].url;
            //console.log("image ---->", image);
            titleArticle = title; // titleArticle es una variable que tendremos afuera para luego poder usarla en la funcion de envio de Telegrama

            let response;
            async function downloadImgToUpload(){
              response = await axios.get(image, { responseType: 'arraybuffer', maxContentLength: Infinity });
              //console.log("response ---->", response); //un espaguitero grande
            }


            downloadImgToUpload()
            .then(()=>{
                    const epoch = new Date().getTime();
                    const folder = 'firstImgBuySell';
                    const pathField = image; const extPart = pathField.split(".");
                    const ext = extPart[4]; console.log("ext------->", ext)
                    //console.log("imagen descargada", response.data); -->response.data  , es la imagen desscargada en formato binario y almacenada en un array buffer, esto es como si alguien hubiera subido una foto al servidor solo que no la guardamos solo se usa para enviar al buckets Spaces;

                    const key = `${folder}/${epoch}.${ext}`;
                    console.log("key -->", key);
                                     
                    const params = { 
                      Bucket : bucketName,
                      Key : key,
                      Body : response.data,
                      ACL : 'public-read' 
                    };
                            
                    s3.putObject(params, function(err, data){
                    
                      if (err){
                          console.log('Error al subir un archivo', err);
                      } else {
                          console.log('La imagen fue subida, Exitooooooooooooooo', data);
                                  
                          let url = `https://${bucketName}.${endpoint}/${key}`;    
                          let public_id = key;
                          dImage = {public_id, url};
                          saveDB()
                      }
                      
                    }); 

                    async function saveDB(){
            
                      let msgFormat = []; //array vacio 
                      const searchProfile = await modelProfile.find({ indexed : user._id });   
                      const BuySell = new modelBuysell({ usernameBuy, usernameSell, indexedSell, indexedBuy, department : depart, title, title_id : idProduct, fechaNegotiation, tecnicalDescription, image : dImage, price, countRequest, count, total, deliveryType });
                      console.log("BuySell .......................... :", BuySell);
                      const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
                      //console.log('Aqui BuySell ---->', BuySell);
                      
                      mailSell(emailSell, title);
                      mailBuy(emailBuy, title);
            
                      //esta consulta es necesaria para poder ofrecer los diferente metodos de pagos ofrecido por el vendedor.
                      const bankData = await modelBankUser.findOne( { indexed : indexedSell } );

                      console.log("Ahora es hora de renderizar la pagina. mientras sigue el proceso de envios de correos")
                      //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
                      res.render('page/buysell-body', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell, msgFormat, codeDate, bankData });

                      console.log("Esto es chatId :", chatId);
                      
                      if (chatId){
                        //aqui activamos las funciones para los vendedores que tengan chatId "blissbot"
                          
                        blissBotNoti()
                          .then(()=>{
                            console.log("Compra ejecutada satisfactoriamente");
                          })
                          .catch((error)=>{
                            console.log("Ha ocurrido un error en blissBotNoti()", error);
                          })

                      } 

                    } 


            })
            .catch((err)=>{
              console.log("ha habido un error en la compra de arte", err);
            })
                  
            
          }

          if (depart == 'items') {
          
            let dImage;
            const search = await modelItems.findById(idProduct);
            //console.log("Este es el resultado de la busqueda de la coleccion items, aqui el objeto--->", search);

              const { title, tecnicalDescription, price, count } = search; //esto se llama destructurin todo en una misma linea

              image = search.images[0].url;
              //console.log("image ---->", image);
              titleArticle = title; // titleArticle es una variable que tendremos afuera para luego poder usarla en la funcion de envio de Telegrama


              let response;
              async function downloadImgToUpload(){
                response = await axios.get(image, { responseType: 'arraybuffer', maxContentLength: Infinity });
                //console.log("response ---->", response); //un espaguitero grande
              }

              downloadImgToUpload()
                .then(()=>{
                        const epoch = new Date().getTime();
                        const folder = 'firstImgBuySell';
                        const pathField = image; const extPart = pathField.split(".");
                        const ext = extPart[4]; console.log("ext------->", ext)
                        //console.log("imagen descargada", response.data); -->response.data  , es la imagen desscargada en formato binario y almacenada en un array buffer, esto es como si alguien hubiera subido una foto al servidor solo que no la guardamos solo se usa para enviar al buckets Spaces;

                        const key = `${folder}/${epoch}.${ext}`;
                        console.log("key -->", key);
                                               
                        const params = { 
                          Bucket : bucketName,
                          Key : key,
                          Body : response.data,
                          ACL : 'public-read' 
                        };
                                
                        s3.putObject(params, function(err, data){
                        
                          if (err){
                              console.log('Error al subir un archivo', err);
                          } else {
                              console.log('La imagen fue subida, Exitooooooooooooooo', data);
                                      
                              let url = `https://${bucketName}.${endpoint}/${key}`;    
                              let public_id = key;
                              dImage = {public_id, url};
                              console.log("dImage :", dImage);
                              saveDB()
                          }
                          
                        }); 
                      

                        async function saveDB(){

                            console.log("Estamos dentro de la funcion saveDB");
                            console.log("Esto es dImage :", dImage);
                            console.log("ver estoooooooo importante------------------------------------------------->");
                            console.log("chatId, usernameBuy, usernameSell, indexedSell, indexedBuy, fechaNegotiation");
                            console.log(chatId, usernameBuy, usernameSell, indexedSell, indexedBuy, fechaNegotiation);
                            let msgFormat = []; //array vacio 
                            const searchProfile = await modelProfile.find({ indexed : user._id });   
                            const BuySell = new modelBuysell({ usernameBuy, usernameSell, indexedSell, indexedBuy, department : depart, title, title_id : idProduct, fechaNegotiation, tecnicalDescription, image : dImage, price, countRequest, count, total, deliveryType });
                            console.log("BuySell .......................... :", BuySell);
                            const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
                        
                            mailSell(emailSell, title);
                            mailBuy(emailBuy, title);

                            
                            //esta consulta es necesaria para poder ofrecer los diferente metodos de pagos ofrecido por el vendedor.
                            const bankData = await modelBankUser.findOne( { indexed : indexedSell } );

                            console.log("Ahora es hora de renderizar la pagina. mientras sigue el proceso de envios de correos")
                            //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
                            res.render('page/buysell-body', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell, msgFormat, codeDate, bankData });

                            console.log("Esto es chatId :", chatId);
                            
                            if (chatId){
                              //aqui activamos las funciones para los vendedores que tengan chatId "blissbot"
                                
                              blissBotNoti()
                                .then(()=>{
                                  console.log("Compra ejecutada satisfactoriamente");
                                })
                                .catch((error)=>{
                                  console.log("Ha ocurrido un error en blissBotNoti()", error);
                                })

                            }  

                        }

  
                        
                })
                .catch((err)=>{
                  console.log("ha habido un error en la compra de items", err);
                  //ha habido un error en la compra de items ReferenceError: chatId is not defined
                })

           

          }
        
          if (depart == 'airplanes' ) {

            const search = await modelAirplane.findById(idProduct);
            //console.log("Este es el resultado de la busqueda de la coleccion airplane, aqui el objeto--->", search);
            
            const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
            image = search.images[0].url;
            //console.log("image ---->", image);
            titleArticle = title; // titleArticle es una variable que tendremos afuera para luego poder usarla en la funcion de envio de Telegrama

            let response;
            async function downloadImgToUpload(){
              response = await axios.get(image, { responseType: 'arraybuffer', maxContentLength: Infinity });
              //console.log("response ---->", response); //un espaguitero grande
            }

            downloadImgToUpload()
            .then(()=>{
                    const epoch = new Date().getTime();
                    const folder = 'firstImgBuySell';
                    const pathField = image; const extPart = pathField.split(".");
                    const ext = extPart[4]; console.log("ext------->", ext)
                    //console.log("imagen descargada", response.data); -->response.data  , es la imagen desscargada en formato binario y almacenada en un array buffer, esto es como si alguien hubiera subido una foto al servidor solo que no la guardamos solo se usa para enviar al buckets Spaces;

                    const key = `${folder}/${epoch}.${ext}`;
                    console.log("key -->", key);
                    let dImage;
                    
                    const params = { 
                      Bucket : bucketName,
                      Key : key,
                      Body : response.data,
                      ACL : 'public-read' 
                    };
                            
                    s3.putObject(params, function(err, data){
                    
                      if (err){
                          console.log('Error al subir un archivo', err);
                      } else {
                          console.log('La imagen fue subida, Exitooooooooooooooo', data);
                                  
                          let url = `https://${bucketName}.${endpoint}/${key}`;    
                          let public_id = key;
                          dImage = {public_id, url};
                          saveDB()
                      }
                      
                    }); 
                  

                    async function saveDB(){
                      
                      const BuySell = new modelNegotiation({ usernameBuy : userBuy, usernameSell : userSell, department : depart, title, title_id : idProduct, tecnicalDescription, image : dImage, price });
                      const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
                      //console.log('Aqui BuySell ---->', BuySell);
          
                      mailSellContact(emailSell, title);
                      mailBuyContact(emailBuy, title);
          
                      //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
                      res.render('page/buysell-one', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell }); 
                    }
                    
            })
            .catch((err)=>{
              console.log("ha habido un error en la compra de airplanes", err);
            })
                  

          }

          if ( depart == 'automotive' ) {

            const search = await modelAutomotive.findById(idProduct);
            //console.log("Este es el resultado de la busqueda de la coleccion arts, aqui el objeto--->", search);
            
            const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
            image = search.images[0].url;
            //console.log("image ---->", image);
            titleArticle = title; // titleArticle es una variable que tendremos afuera para luego poder usarla en la funcion de envio de Telegrama

            let response;
            async function downloadImgToUpload(){
              response = await axios.get(image, { responseType: 'arraybuffer', maxContentLength: Infinity });
              //console.log("response ---->", response); //un espaguitero grande
            }

            downloadImgToUpload()
            .then(()=>{
                    const epoch = new Date().getTime();
                    const folder = 'firstImgBuySell';
                    const pathField = image; const extPart = pathField.split(".");
                    const ext = extPart[4]; console.log("ext------->", ext)
                    //console.log("imagen descargada", response.data); -->response.data  , es la imagen desscargada en formato binario y almacenada en un array buffer, esto es como si alguien hubiera subido una foto al servidor solo que no la guardamos solo se usa para enviar al buckets Spaces;

                    const key = `${folder}/${epoch}.${ext}`;
                    console.log("key -->", key);
                    let dImage;
                    
                    const params = { 
                      Bucket : bucketName,
                      Key : key,
                      Body : response.data,
                      ACL : 'public-read' 
                    };
                            
                    s3.putObject(params, function(err, data){
                    
                      if (err){
                          console.log('Error al subir un archivo', err);
                      } else {
                          console.log('La imagen fue subida, Exitooooooooooooooo', data);
                                  
                          let url = `https://${bucketName}.${endpoint}/${key}`;    
                          let public_id = key;
                          dImage = {public_id, url};
                          saveDB()
                      }
                      
                    }); 
                  

                    async function saveDB(){
                      
                      const BuySell = new modelNegotiation({ usernameBuy : userBuy, usernameSell : userSell, department : depart, title, title_id : idProduct, tecnicalDescription, image : dImage, price });
                      const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
                      //console.log('Aqui BuySell ---->', BuySell);
          
                      mailSellContact(emailSell, title);
                      mailBuyContact(emailBuy, title);
          
                      //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
                      res.render('page/buysell-one', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell }); 
                    }
                    
            })
            .catch((err)=>{
              console.log("ha habido un error en la compra de automotive", err);
            })
                  

          }

          if ( depart ==  'realstate' ) {

            const search = await modelRealstate.findById(idProduct);
            //console.log("Este es el resultado de la busqueda de la coleccion arts, aqui el objeto--->", search);
            
            const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
            image = search.images[0].url;
            //console.log("image ---->", image);
            titleArticle = title; // titleArticle es una variable que tendremos afuera para luego poder usarla en la funcion de envio de Telegrama

            let response;
            async function downloadImgToUpload(){
              response = await axios.get(image, { responseType: 'arraybuffer', maxContentLength: Infinity });
              //console.log("response ---->", response); //un espaguitero grande
            }

            downloadImgToUpload()
            .then(()=>{
                    const epoch = new Date().getTime();
                    const folder = 'firstImgBuySell';
                    const pathField = image; const extPart = pathField.split(".");
                    const ext = extPart[4]; console.log("ext------->", ext)
                    //console.log("imagen descargada", response.data); -->response.data  , es la imagen desscargada en formato binario y almacenada en un array buffer, esto es como si alguien hubiera subido una foto al servidor solo que no la guardamos solo se usa para enviar al buckets Spaces;

                    const key = `${folder}/${epoch}.${ext}`;
                    console.log("key -->", key);
                    let dImage;
                    
                    const params = { 
                      Bucket : bucketName,
                      Key : key,
                      Body : response.data,
                      ACL : 'public-read' 
                    };
                            
                    s3.putObject(params, function(err, data){
                    
                      if (err){
                          console.log('Error al subir un archivo', err);
                      } else {
                          console.log('La imagen fue subida, Exitooooooooooooooo', data);
                                  
                          let url = `https://${bucketName}.${endpoint}/${key}`;    
                          let public_id = key;
                          dImage = {public_id, url};
                          saveDB()
                      }
                      
                    }); 
                  

                    async function saveDB(){
                      
                      const BuySell = new modelNegotiation({ usernameBuy : userBuy, usernameSell : userSell, department : depart, title, title_id : idProduct, tecnicalDescription, image : dImage, price });
                      const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
                      //console.log('Aqui BuySell ---->', BuySell);
          
                      mailSellContact(emailSell, title);
                      mailBuyContact(emailBuy, title);
          
                      //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
                      res.render('page/buysell-one', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell }); 
                    }
                    
            })
            .catch((err)=>{
              console.log("ha habido un error en la compra de automotive", err);
            })
            
          }

          if ( depart == 'nautical' ) {

            const search = await modelNautical.findById(idProduct);
            //console.log("Este es el resultado de la busqueda de la coleccion arts, aqui el objeto--->", search);
            
            const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
            image = search.images[0].url;
            //console.log("image ---->", image);
            titleArticle = title; // titleArticle es una variable que tendremos afuera para luego poder usarla en la funcion de envio de Telegrama

            let response;
            async function downloadImgToUpload(){
              response = await axios.get(image, { responseType: 'arraybuffer', maxContentLength: Infinity });
              //console.log("response ---->", response); //un espaguitero grande
            }

            downloadImgToUpload()
            .then(()=>{
                    const epoch = new Date().getTime();
                    const folder = 'firstImgBuySell';
                    const pathField = image; const extPart = pathField.split(".");
                    const ext = extPart[4]; console.log("ext------->", ext)
                    //console.log("imagen descargada", response.data); -->response.data  , es la imagen desscargada en formato binario y almacenada en un array buffer, esto es como si alguien hubiera subido una foto al servidor solo que no la guardamos solo se usa para enviar al buckets Spaces;

                    const key = `${folder}/${epoch}.${ext}`;
                    console.log("key -->", key);
                    let dImage;
                    
                    const params = { 
                      Bucket : bucketName,
                      Key : key,
                      Body : response.data,
                      ACL : 'public-read' 
                    };
                            
                    s3.putObject(params, function(err, data){
                    
                      if (err){
                          console.log('Error al subir un archivo', err);
                      } else {
                          console.log('La imagen fue subida, Exitooooooooooooooo', data);
                                  
                          let url = `https://${bucketName}.${endpoint}/${key}`;    
                          let public_id = key;
                          dImage = {public_id, url};
                          saveDB()
                      }
                      
                    }); 
                  

                    async function saveDB(){
                      
                      const BuySell = new modelNegotiation({ usernameBuy : userBuy, usernameSell : userSell, department : depart, title, title_id : idProduct, tecnicalDescription, image : dImage, price });
                      const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
                      //console.log('Aqui BuySell ---->', BuySell);
          
                      mailSellContact(emailSell, title);
                      mailBuyContact(emailBuy, title);
          
                      //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
                      res.render('page/buysell-one', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell }); 
                    }
                    
            })
            .catch((err)=>{
              console.log("ha habido un error en la compra de nautical", err);
            })

/*             const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgBuySell'});
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
           */
          }

          if ( depart == 'service' ) {

            const search = await modelService.findById(idProduct);
            //console.log("Este es el resultado de la busqueda de la coleccion arts, aqui el objeto--->", search);
            
            const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
            image = search.images[0].url;
            //console.log("image ---->", image);
            titleArticle = title; // titleArticle es una variable que tendremos afuera para luego poder usarla en la funcion de envio de Telegrama

            let response;
            async function downloadImgToUpload(){
              response = await axios.get(image, { responseType: 'arraybuffer', maxContentLength: Infinity });
              //console.log("response ---->", response); //un espaguitero grande
            }

            downloadImgToUpload()
            .then(()=>{
                    const epoch = new Date().getTime();
                    const folder = 'firstImgBuySell';
                    const pathField = image; const extPart = pathField.split(".");
                    const ext = extPart[4]; console.log("ext------->", ext)
                    //console.log("imagen descargada", response.data); -->response.data  , es la imagen desscargada en formato binario y almacenada en un array buffer, esto es como si alguien hubiera subido una foto al servidor solo que no la guardamos solo se usa para enviar al buckets Spaces;

                    const key = `${folder}/${epoch}.${ext}`;
                    console.log("key -->", key);
                    let dImage;
                    
                    const params = { 
                      Bucket : bucketName,
                      Key : key,
                      Body : response.data,
                      ACL : 'public-read' 
                    };
                            
                    s3.putObject(params, function(err, data){
                    
                      if (err){
                          console.log('Error al subir un archivo', err);
                      } else {
                          console.log('La imagen fue subida, Exitooooooooooooooo', data);
                                  
                          let url = `https://${bucketName}.${endpoint}/${key}`;    
                          let public_id = key;
                          dImage = {public_id, url};
                          saveDB()
                      }
                      
                    }); 
                  

                    async function saveDB(){
                      
                      const BuySell = new modelNegotiation({ usernameBuy : userBuy, usernameSell : userSell, department : depart, title, title_id : idProduct, tecnicalDescription, image : dImage, price });
                      const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
                      //console.log('Aqui BuySell ---->', BuySell);
          
                      mailSellContact(emailSell, title);
                      mailBuyContact(emailBuy, title);
          
                      //la mision de este paso es crear un documento en la coleccion buysell con los datos obtenidos previamente.
                      res.render('page/buysell-one', {user, searchProfile, countMessages, countNegotiationsBuySell, buySell }); 
                    }
                    
            })
            .catch((err)=>{
              console.log("ha habido un error en la compra de service", err);
            })
          
          }

          //:::::::: Nota Importante de Auction :::::::::
          //aqui dependiendo del departamento se forma una nueva coleccion que puede ser negotiation o buySell
          //no aparece auction porque esta se forma de manera automatico por el node-cron en la route depart-auction.routes.js
          //despues de tener la colleccion buySell y negotiation, se procede ha crear el invoice del buySell cuando el vendedor valida su pago para los departamentos :
          //'items', 'arts', 'auctions'; mientras que para el resto de los departamentos la invoice se crea acto seguido de crearse el anuncio.
          // buySell y negotiation se usan para el historial y para poder luego gestionar en el casi del buySell la invoice.
          //la invoice es el ultimo producto realizado
    
      }

      async function blissBotNoti(){ //esta funcon es para enviar un Telegrama al vendedor. debe ser avisado de inmediato.
          console.log("Estamos dentro de la funcion blissBotNoti() ---------------------------->");
          const Message = `Notificación de Blissenet.com: Sell\n\n¡Felicidades! Tienes una venta pendiente de tu artículo "${titleArticle}".  Sin dilaciones anda y atiende a tu comprador, y recuerda pedirle te califique al terminar su compra.`;
          console.log("titleArticle --->", titleArticle);
          console.log("image --->", image);
          console.log("chatId --->", chatId);          

          axios.post(`https://api.telegram.org/bot${Token}/sendPhoto`, {
              chat_id: chatId,
              photo: image,
              caption: Message
          })
          .then(response => {
              console.log('--------------------------- BlissBot----------------------------');
              console.log('Mensaje enviado con éxito:', response.data);
          })
          .catch(error => {
              console.log('--------------------------- BlissBot----------------------------');
              console.error('Error al enviar el mensaje:', error.response.data);
          });
  
      }
       



  console.log("vamos muy bien .........................................................")  
  } catch (error) {
    console.log("Ha habido un error, intente luego");
    res.redirect('/');
  }      

});


//esta ruta es la que presenta toda la informacion en buysell-body
routes.get('/buysell-body/:id', async(req, res)=>{
  const user = req.session.user;
  console.log("Esto es user----->", user._id);
  const countMessages = req.session.countMessages;
  const searchProfile = await modelProfile.find({ indexed : user._id });
        
  //aqui obtengo la cantidad de negotiationsBuySell
  const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
  console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);

  console.log('He llegado al apartado de buy&sell-body');
  console.log("Este es el parametro ----> ", req.params);
  const buySellId = req.params.id;

  const buySell =  await modelBuysell.findById(buySellId);
  const msg = buySell.written.reverse(); // aqui se revierte el array written para que el front el forEach() pueda recorrerlo en sentido inverso.
  const indexedSell = buySell.indexedSell; // este es el id user
  const bankData = await modelBankUser.findOne( { indexed : indexedSell } );

  // Función para escapar caracteres especiales
  function escapeHtml(text) {
      return text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;")
  }

  // Formatear cada mensaje antes de enviarlo
  const msgFormat = msg.map(ele => ({
      ...ele,written: escapeHtml(ele.written) // Aplica ambas funciones aquí
  }));

  console.log("buySell, Que hay aqui? --->", buySell);
  console.log("msgFormat, Que hay aqui? --->", msgFormat);
  const fecha =  buySell.createdAt;
  const dia = fecha.getDate();
  const mes = fecha.getMonth() + 1;
  const anio = fecha.getFullYear();
  const fechaNegotiation = ` ${dia}-${mes}-${anio}`
  console.log("fechaNegotiation :", fechaNegotiation);

  //fecha actual
  const diaNow = new Date().getDate();
  const mesNow = new Date().getMonth() + 1;
  const anioNow = new Date().getFullYear();
  const codeDate = `${diaNow}${mesNow}${anioNow}`;
  console.log("codeDate :", codeDate);

  
  res.render('page/buysell-body', {user, searchProfile, countNegotiationsBuySell, countMessages, buySell, fechaNegotiation, msgFormat, codeDate, bankData}); 

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
  
  res.render('page/buysellNegotiation-body', {user, searchProfile, countNegotiationsBuySell, countMessages, buySell, fechaNegotiation, msg }); 
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

routes.post('/buysell-body/confirm', async(req, res)=>{

  try {
    
    const body = req.body;
    console.log("/buysell-body/confirm");
    console.log("Esto es body", body);
    const {iD, newrequest} = req.body
    // iD: '683ca1ceb33e70c09546fb42', newrequest: '1'
    //debemos restar en la base de datos el count del producto items

    //en buySell esta el dato title_id que es el id de artculo 
    // y el departamento en el dato department
    const searchBuySell = await modelBuysell.findById(iD);
    const depart = searchBuySell.department;
    const idProduct  = searchBuySell.title_id;
    const unitPrice = searchBuySell.price

    console.log("depart ----------", depart);
    console.log("idProduct-----------", idProduct);

    
      if (depart == "items"){

          const verifyExist = await modelItems.findById(idProduct, {count : 1});
          const countExist = verifyExist.count;
          console.log("countExist :", countExist);
          console.log("countExist tipo de dato :", typeof countExist);

          //creamos el dato total 
          const total = (unitPrice * newrequest).toFixed(2); 

             //     3             3
          if (newrequest == countExist ){
              //son iguales no ha habido niguna otra oferta 
              await modelItems.findByIdAndUpdate(idProduct, { $inc: { count: -newrequest, sales: newrequest } }, { new : true });//restamos el count.
              await modelBuysell.findByIdAndUpdate(iD, { $set: { countRequest : newrequest, total, step : 1 }}); //actualizamos la cantidad requerida por el compradory cambiamos el valor de confirmBuy
              const response = { "code" : "ok" , "message" : "Confirmación realizada con exito." }
              res.json(response);
             //         2             3
          } else if (newrequest <= countExist) {
              console.log("El usuario ha cambiado la cantidad y existe el inventaerio");
              //ha habido un cambio en el inventario pero la cantidad solicitada es menor o igual que la requerida.
              await modelItems.findByIdAndUpdate(idProduct, { $inc: { count: -newrequest, sales: newrequest } }, { new : true });//restamos el count
              await modelBuysell.findByIdAndUpdate(iD, { $set: { countRequest : newrequest, total, step : 1 }}, {new:true}); //actualizamos la cantidad requerida por el compradory cambiamos el valor de confirmBuy
              const response = { "code" : "ok" , "message" : "Confirmación realizada con exito." }
              res.json(response);
              //           3                2             1 
          } else if ( countExist > 0 && newrequest > countExist ){
              const response = { "code" : "err" , "message" : "La cantidad deseada supera la disponibilidad en inventario, intente con menos." }
              res.json(response);

          } else if ( countExist == 0 ){
              const response = { "code" : "err" , "message" : "Este articulo ha quedado sin existencia. Cancele la orden" }
              res.json(response);
          }

      
      } else if (depart == "arts"){


          const verifyExist = await modelArtes.findById(idProduct, {count : 1});
          const countExist = verifyExist.count;
          console.log("countExist :", countExist);
          console.log("countExist tipo de dato :", typeof countExist);

          //creamos el dato total 
          const total = (unitPrice * newrequest).toFixed(2); 

          //voy por aqui.
          if (newrequest == countExist ){
              //son iguales no ha habido niguna otra oferta 
              await modelArtes.findByIdAndUpdate(idProduct, { $inc: { count: -newrequest, sales: newrequest } }, { new : true });//restamos el count.
              await modelBuysell.findByIdAndUpdate(iD, { $set: { countRequest : newrequest, total, step : 1 }}); //actualizamos la cantidad requerida por el compradory cambiamos el valor de confirmBuy
              const response = { "code" : "ok" , "message" : "Confirmación realizada con exito." }
              res.json(response);
             //         2             3
          } else if (newrequest <= countExist) {
              console.log("El usuario ha cambiado la cantidad y existe el inventaerio");
              //ha habido un cambio en el inventario pero la cantidad solicitada es menor o igual que la requerida.
              await modelArtes.findByIdAndUpdate(idProduct, { $inc: { count: -newrequest, sales: newrequest } }, { new : true });//restamos el count
              await modelBuysell.findByIdAndUpdate(iD, { $set: { countRequest : newrequest, total, step : 1 }}, {new:true}); //actualizamos la cantidad requerida por el compradory cambiamos el valor de confirmBuy
              const response = { "code" : "ok" , "message" : "Confirmación realizada con exito." }
              res.json(response);
              //           3                2             1 
          } else if ( countExist > 0 && newrequest > countExist ){
              const response = { "code" : "err" , "message" : "La cantidad deseada supera la disponibilidad en inventario, intente con menos." }
              res.json(response);

          } else if ( countExist == 0 ){
              const response = { "code" : "err" , "message" : "Este articulo ha quedado sin existencia. Cancele la orden" }
              res.json(response);
          }


      }
      
  } catch (error) {
      const resolve = { code : "err", response : "Ha ocurrido un error. Intente mas tarde" }
      res.json(resolve);
  }

});

routes.post('/buysell-body/deliveryPolicy', async(req, res)=>{

  try {
    
    const body = req.body;
    console.log("/buysell-body/deliveryPolicy");
    console.log("Esto es body", body);               
    const {iD, indexedBuy, indexedSell, deliveryType, deliveryDetails} = req.body

    //deliveryDetails: 'undefined'
    console.log("deliveryType --->", deliveryType);
    console.log("deliveryDetails --->", deliveryDetails);

    //en buySell esta el dato title_id que es el id de articulo 
    // y el departamento en el dato department
    const searchBuySell = await modelBuysell.findById(iD);

    if (deliveryType === "Envio Local"){
      //debemos gestionar todo lo concerniente a una entrega local. 
      //condionamos la solicitud del comprador
      if (deliveryDetails === "D01"){
         // D01 Retirar Personalmente en la tienda.
         // se guarda en la base de datos buySell. sin ninguna otra operacion adicional   
        await modelBuysell.findByIdAndUpdate(iD, { deliveryDetails, step : 2 }, {new: true});

        const response = { code : "ok", message : "opción tomada exitosamente." };
        res.json(response)

      } else if (deliveryDetails === "D02"){
         // D02 Retirar Personalmente en algun lugar acordado.
         // se guarda en la base de datos buySell. sin ninguna otra operacion adicional  
        await modelBuysell.findByIdAndUpdate(iD, { deliveryDetails, step : 2 }, {new: true});

        const response = { code : "ok", message : "opción tomada exitosamente." };
        res.json(response)

      } else if (deliveryDetails === "D03"){
        // D03 Reciba su pedido en la puerta de su casa. (Solicitar Delivery).
        // Se debe activar la funcion de ubicacion para detectar a todos los deliveries que estan al rededor del vendedor y luego se guarda en la base de datos buySell.   
        
        const searchSell = await modelProfile.findOne({indexed : indexedSell});
        const geolocation = searchSell.geolocation;// esto es un objeto {lon y lat}
        console.log("geolocation : ", geolocation); //{ lon: -62.736074', lat: '8.2871893' }

        // Convertir las coordenadas a un formato adecuado para la consulta
        const longitude = parseFloat(geolocation.lon);
        const latitude = parseFloat(geolocation.lat);
        console.log("longitude :", longitude); //longitude : -62.736074
        console.log("latitude :", latitude); //latitude : 8.2871893

        const distanciaEnMetros = 6000
        const searchDelivery = await modelProfile.find({
          locations: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [longitude, latitude]
              },
              $maxDistance: distanciaEnMetros
            }
          }
        });
    
        console.log("searchDelivery cerca de 6 kilometros a la redonda........:", searchDelivery);// arroja un array vacio

        await modelBuysell.findByIdAndUpdate(iD, { deliveryDetails, step : 2 }, {new: true});
       
        //ahora enviamos el arreglo searchDelivery al socket.
        //socket.emit('result:delivery', { 'obje' : searchDelivery });

        const response = { code : "ok", message : "opción tomada exitosamente.", data : searchDelivery };
        res.json(response)

      }


    } else if (deliveryType === "Envio Interurbano"){


    } else if (deliveryType === "Envio Internacional"){


    }

    searchLocalSell = await modelUser.findById(indexedSell);
    searchLocalBuy = await modelUser.findById(indexedBuy); 
      
    // D01 Retirar Personalmente en la tienda. 
    // D02 Retirar Personalmente en algun lugar acordado.
    // D03 Reciba su pedido en la puerta de su casa. (Solicitar Delivery).

  } catch (error) {
      const resolve = { code : "err", response : "Ha ocurrido un error. Intente mas tarde" }
      res.json(resolve);
  }

});

routes.post('/buysell-body/payRegister', async(req, res)=>{
  //nuevo
  console.log(".............. buysell-body/payRegister ................");
  console.log("req.body :", req.body);
  const { iD, methodSelected, referValue } = req.body;
  let boxImg = [];

  console.log("iD :", iD);
  console.log("methodSelected :", methodSelected);
  console.log("referValue :", referValue);

  console.log("req.files :", req.files);
  const file = req.files;
  const voucher = file[0];

  if (file.length !== 0){

    if (voucher.size <= 5000000  && voucher.mimetype.startsWith("image/")){

        const folder = "voucher"; const ident = new Date().getTime();
        const pathField = voucher.path; const extPart = pathField.split(".");
        const ext = extPart[1];
                    
        //console.log("Bucket :", bucketName); console.log("folder :", folder);
        //console.log("pathField :", pathField); console.log("ext", ext);

        const fileContent = fs.readFileSync(pathField);
        const key = `${folder}/${ident}.${ext}`;
        console.log("key -->", key);

        const params = { 
            Bucket : bucketName,
            Key : key,
            Body : fileContent,
            ACL : 'public-read' 
        };

        s3.putObject(params, function(err, data){
        
            if (err){
                console.log('Error al subir un archivo', err);
            } else {
                console.log('La imagen fue subida, Exito', data);
                
                //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                let format = ext;
                let url = `https://${bucketName}.${endpoint}/${key}`;
                let bytes = voucher.size;
                let public_id = key;
                
                //console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id} `);
                boxImg.push( {url, public_id, bytes, format} );            

                async function saveDB(){
                    //console.log("este es el path que tiene que ser eliminado:", vouche.path)
                    await fs.unlink(voucher.path) 
                    
                    //console.log("Esto es boxImg -------->", boxImg);
                    const box = boxImg[0]; 

                    if (referValue){

                        console.log("Esto es box -------->", box);
                        console.log("method : ", methodSelected );
                        console.log("refer : ", referValue );

                        await modelBuysell.findByIdAndUpdate(iD, { methodSelected, referPay: referValue, voucherImage: box,  step : 3 }, {new: true});
                          
                    } else {

                        console.log("Esto es box -------->", box);
                        console.log("method : ", methodSelected );

                        await modelBuysell.findByIdAndUpdate(iD, { methodSelected, voucherImage: box,  step : 3 }, {new: true});
                          
                    }
                            
                }

                saveDB()
                    .then(()=>{
                        const response = { code : "ok",  message : "Pago registrado exitosamente. Ya el vendedor tiene todo la información de tu compra." };
                        res.json(response)
                    })
                    .catch((err)=>{
                        const response = { code : "error",  message : "Ha ocurrido un error, Intente en unos minutos proseguir con el registro." };
                        res.json(response);
                    })

            }
            
        });

    }  

  } else {
     //no hay imagen de voucher

      if (referValue){

          console.log("method : ", methodSelected );
          console.log("refer : ", referValue );

          async function saveDB() {
              await modelBuysell.findByIdAndUpdate(iD, { methodSelected, referPay: referValue, step : 3 }, {new: true});
          }

        
          saveDB()
          .then(()=>{
              const response = { code : "ok",  message : "Pago registrado exitosamente. Ya el vendedor tiene todo la información de tu compra." };
              res.json(response)
          })
          .catch((err)=>{
              const response = { code : "error",  message : "Ha ocurrido un error, Intente en unos minutos proseguir con el registro." };
              res.json(response);
          })
            
      } else {

          console.log("method : ", methodSelected );
 
          async function saveDB() {
              await modelBuysell.findByIdAndUpdate(iD, { methodSelected, step : 3 }, {new: true});
          }

        
          saveDB()
          .then(()=>{
              const response = { code : "ok",  message : "Pago registrado exitosamente. Ya el vendedor tiene todo la información de tu compra." };
              res.json(response)
          })
          .catch((err)=>{
              const response = { code : "error",  message : "Ha ocurrido un error, Intente en unos minutos proseguir con el registro." };
              res.json(response);
          })
            
      }




  }

                  

                  
  //aqui ahora procesamos la imagen para ser subida al bucked de y luego ser guardado en el documento buySell
  //await modelBuysell.findByIdAndUpdate(iD, { confirmPay : "yes", methodSelected, referPay: referValue, step : 3 }, {new: true});
  
  //ahora enviamos el arreglo searchDelivery al socket.
  //socket.emit('result:payRegister', { 'message' : "payRegistered" });

  //const response = { code : "ok", message : "Pago registrado exitosamente" };
  //res.json(response)
  
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

//aqui es donde el comprador califica el intercambio.
routes.post('/buysell-body/buyerTrue', async(req, res)=>{

  try {
      console.log(" ................... /buysell-body/buyerTrue ..................... ");
      const body = req.body
      console.log ("esto es lo que esta llegando al backend", body);
      const { idOrder, rating, comment } = req.body;

      console.log("Este es el idOrder ---->", idOrder);
      console.log("Esta es la calificacion del vendedor ---->", rating);
      console.log("Este es el comentario del vendedor sobre su comprador ---->", comment);
      
      async function buyerRating(){
        await modelBuysell.findByIdAndUpdate(idOrder, { ratingSeller : rating, CommentSeller : comment }, {new:true});            
      }
      
      buyerRating()
        .then(()=>{
          const response = { code: "ok", message: "Calificación y comentario recibido." };
          res.json(response);
        })
        .catch((err)=>{
          const response = { code: "error", message: "Ha habido un problema, intente nuevamente en unos segundos." };
          res.json(response);
        })     
      

  } catch (error) {

      const response = { code: "error", message: "Ha habido un error, intenta nuevamente enviar tu calificación" };

  }  

});

//aqui es donde el vendedor califica el intercambio 
routes.post('/buysell-body/sellTrue', async(req, res)=>{

  try {
      console.log(" ................... /buysell-body/sellTrue ..................... ");
      const body = req.body
      console.log ("esto es lo que esta llegando al backend", body);
      const { idOrder, rating, comment } = req.body;

      console.log("Este es el idOrder ---->", idOrder);
      console.log("Esta es la calificacion del comprador ---->", rating);
      console.log("Este es el comentario del comprador sobre su vendedor ---->", comment);
     
      async function buyerRating(){
        await modelBuysell.findByIdAndUpdate(idOrder, { ratingBuy : rating, CommentBuy : comment }, {new:true});            
      }
      
      buyerRating()
        .then(()=>{
          const response = { code: "ok", message: "Calificación y comentario recibido." };
          res.json(response);
        })
        .catch((err)=>{
          const response = { code: "error", message: "Ha habido un problema, intente nuevamente en unos segundos." };
          res.json(response);
        })     


  } catch (error) {

      const response = { code: "error", message: "Ha habido un error, intenta nuevamente enviar tu calificación" };

  }  

});



routes.post('/buysell-body/closeOperation', async(req, res)=>{

  try {
      console.log(" ................... /buysell-body/closeOperation ..................... ");
      const { idOrder, indexedSell, indexedBuy } = req.body;

      console.log("Este es el idOrder ---->", idOrder);
      console.log("Este es el indexedSell ---->", indexedSell);
      console.log("Este es el indexedBuy ---->", indexedBuy);

      if (indexedSell){
        console.log("el vendedor esta cerrando la sala");

        async function closeOperation(){
          await modelBuysell.findByIdAndUpdate(idOrder, { $set: { closeOperationSeller : true }  }, {new:true});            
        }

        closeOperation()
          .then(()=>{
            const response = { code: "ok", message: "Ha cerrado exitosamente la sala, Esta venta quedará registrada en Historiales." };
            res.json(response);
          })
          .catch((err)=>{
            const response = { code: "error", message: "Ha habido un problema, intente nuevamente en unos segundos." };
            res.json(response);
          })



      } else {

          console.log("el comprador esta cerrando la sala");

          async function closeOperation(){
            await modelBuysell.findByIdAndUpdate(idOrder, { $set: { closeOperationBuy : true }  }, {new:true});            
          }

          closeOperation()
            .then(()=>{
              const response = { code: "ok", message: "Ha cerrado exitosamente la sala, Esta venta quedará registrada en Historiales." };
              res.json(response);
            })
            .catch((err)=>{
              const response = { code: "error", message: "Ha habido un problema, intente nuevamente en unos segundos." };
              res.json(response);
            }) 
            

      }




  } catch (error) {

      const response = { code: "error", message: "Ha habido un error, intenta nuevamente enviar tu calificación" };

  }  

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

    searchOneBuy = await modelBuysell.find({  $and : [{usernameBuy : username},{ closeOperationBuy : false }] });
    if (searchOneBuy){
      //console.log("eres el comprador", searchOneBuy);
      searchBuy.push(...searchOneBuy);
    }
    searchTwoBuy = await modelNegotiation.find({ $and : [{ usernameBuy : username },{ closedContact : false }]} );
    if (searchTwoBuy){
      //console.log("eres el comprador", searchTwoBuy);
      searchBuy.push(...searchTwoBuy);
    }
  
    searchOneSell = await modelBuysell.find({ $and : [{usernameSell : username},{ closeOperationSeller : false }] });
    if (searchOneSell){
      //console.log("eres el vendedor", searchOneSell);
      searchSell.push(...searchOneSell);
    }  
    searchTwoSell = await modelNegotiation.find({ $and : [{ usernameSell : username },{ closedContact : false }]} );
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
 console.log("bodyWritten ...>", bodyWritten);

 //user, written, date, codeDate, time, idDocument ......datos que recibo
 const { user, written, date, codeDate, time, idDocument } = bodyWritten;
 const objectData = {user, written, time, date, codeDate, idDocument}; 
 console.log("Aqui el objectData---->", objectData);                               
 const pusheando = await modelBuysell.findByIdAndUpdate(idDocument, { $push: { written : objectData } }, { new: true });
 console.log("Aqui pusheando ---->",pusheando);
 
 res.json(objectData);//importante esto que no se me olvide.
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

