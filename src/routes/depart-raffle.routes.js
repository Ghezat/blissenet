const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');//esta siempre serà la misma.
const modelProfile = require('../models/profile.js'); 
const modelRaffle = require('../models/raffle.js');//esto es lo que define que colleccion usarà
const modelRaffleHistory = require('../models/raffleHistory.js');
const modelBuySell = require('../models/buySell.js');
const modelInvoice = require('../models/invoice.js');

const modelMessages = require('../models/messages.js');

const nodemailer = require('nodemailer');
const cron = require('node-cron');

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

           
routes.get('/department/create/raffle', async(req,res)=>{
    let countImpagos = 0;
    const boxImpagos = [];
    let searchProfile, Raffle, Contacts, BuySell;
    let Images = null;
    let Video;
    let Spreading, Time, restMilis;
   
    const user = req.session.user; // datos del usuario
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const titleSelect = req.session.titleSelect; //datos del titulo seleccionado
    const TitleSelect = await modelRaffle.findById(titleSelect)
   
    const uploadPublication = req.session.uploadPublication; //mensaje de subida de publicacion.
    const updatePublication =  req.session.updatePublication; //mensaje de actualizacion de publicacion.
    const deletePublication = req.session.deletePublication; //mensaje de eliminacion de publicacion
    const deleteNoPublication = req.session.deleteNoPublication; //mensaje Imposible eliminar publicacion
    const uploadFall = req.session.uploadFall; //mensaje de que no se ha subida la publicacion por no contar con una imagen aceptada por el sistema.
    const uploadVideo = req.session.videoUploaded; //mensaje de video subido exitosamente;
    const uploadVideoFall = req.session.videoNoUploaded; //mensaje de error no se ha subido por superar el peso establecido.
    const uploadVideoDone = req.session.uploadVideoDone; //mensaje de que ya existe un video cargado para este anuncio.
    const videoDelete = req.session.videoDelete; //mensaje de video eliminado exitosamente. ¡Listo para subir uno nuevo y sorprender a todos!
    const catchError = req.session.catcherro; // 'Ha ocurrido un error, intente en unos minutos';
    const pendingRaffle = req.session.pendingRaffle // 'Tiene un sorteo activo aun. ¡ Solo se permite un (1) Sorteo a la vez !'
    const numTicketFall = req.session.numTicketFall   // 'El sorteo debe tener un rango entre 50 y 1000 Tickets.';
    
    
    delete req.session.uploadPublication;
    delete req.session.updatePublication;
    delete req.session.deletePublication;
    delete req.session.deleteNoPublication;
    delete req.session.uploadFall;
    delete req.session.videoUploaded;
    delete req.session.videoNoUploaded;
    delete req.session.uploadVideoDone;
    delete req.session.videoDelete;
    delete req.session.catcherro;
    delete req.session.pendingRaffle;
    delete req.session.numTicketFall;

    if (user) {
        //searchProfile = await modelProfile.find({indexed : user._id}); viejo
        searchProfile = await modelProfile.findOne({indexed : user._id});
        Raffle = await modelRaffle.find({ user_id : user._id });

        //:::: Este bloque es para conocer el estado de impagos del usuario ::::
        Contacts = await modelInvoice.find( {$and : [{indexed: user._id}, {payCommission : false}]} );
        //console.log('Esto es Contacts ---->', Contacts);
        BuySell = await modelBuySell.find( {$and : [{ usernameSell : user.username }, { confirmPay: 'Yes' }, {CommentSeller : {$ne : 'no_comment' }},{ payCommission : false} ] } );
        //console.log('Esto es BuySell ---->', BuySell);

        boxImpagos.push( ...Contacts, ...BuySell );
        //console.log("Esto es boxImpagos ::::::>", boxImpagos);
        countImpagos = boxImpagos.length;
    
        console.log("Esto es la cantidad de impagos que posee el usuario --->", countImpagos);
        //::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

        //console.log("Este es el id del ususario : ",user._id);
        //console.log("Data de los artes publicados por el usuario :",Artes);
    }
    
    //console.log("el titulo elegido es titleSelect :", TitleSelect)
   
    if (TitleSelect) {

        const date = new Date(); //fecha actual del servidor;
        //console.log("TitleSelect -->", TitleSelect) //esto es le objeto completo del articulo
        IDTitle = TitleSelect._id;
        Images = TitleSelect.images
        Video = TitleSelect.video;
        Spreading = TitleSelect.spread.spreading;  //false or true;
        Time = TitleSelect.spread.time;

        if (Time !== null ){
            restMilis = ( date - Time );
            //console.log("********** V E R **********");
            //console.log("La cantidad de milisegundos son -->", restMilis);

            let dias = 14;

            let twoWeek = 86400000 * dias;
            if (restMilis > twoWeek){

                //console.log("Ha pasado 14 dias y se procedera a inciar la funcion de resetar los valores por defecto para que el anuncio pueda ser nuevamente Difundido")
                async function functionUpdateSapread(){
                    const updateSpread = await modelRaffle.findByIdAndUpdate(IDTitle, { $set: { "spread.spreading" :  false, "spread.time" : null } })
                }

                functionUpdateSapread()
                    .then(()=>{
                        Spreading === true;
                       
                    })
                    .catch((error)=>{
                        //console.log("Ha ocurrido un error, intente luego.", error);
                        res.redirect('/department/create/raffle');
                    })
                
            }
        } 
        
        res.render('page/depart-raffle' , {user, searchProfile, Spreading, Time, countImpagos, Raffle, TitleSelect, Images, Video, uploadPublication, updatePublication, deletePublication, deleteNoPublication, uploadFall, uploadVideo, uploadVideoFall, uploadVideoDone, videoDelete, catchError, pendingRaffle, numTicketFall, countMessages, countNegotiationsBuySell });

    } else {
        res.render('page/depart-raffle' , {user, searchProfile, Spreading, Time, countImpagos, Raffle, TitleSelect, Images, Video, uploadPublication, updatePublication, deletePublication, deleteNoPublication, uploadFall, uploadVideo, uploadVideoFall, uploadVideoDone, videoDelete, catchError, pendingRaffle, numTicketFall, countMessages, countNegotiationsBuySell });
    }
    
});

//este es la ruta del selector de la vista principal
routes.post('/department/create/raffle/selector', (req,res)=>{
    //console.log(req.body)
    const { titulo } = req.body;
    req.session.titleSelect = titulo;
    console.log("Titulo enviado a creates/raffle :",req.session.titleSelect);
    res.redirect('/department/create/raffle');
});
             
//esta es la ruta para crear un anuncio de sorteo con try-catch
routes.post('/department/create/raffle', async(req,res)=>{
    const boxImg = [];
    const BOXTickets = [];
    const boxPrizesObject = [];
    const user = req.session.user
    console.log(user.username)
    const username = user.username; //aqui tengo el username 
    const department = 'raffle';
    const stateRaffle = await modelRaffle.find({username});
    console.log("stateRaffle", stateRaffle);

    //esto es si el usuario posee otro sorteo activo
    if (stateRaffle.length === 0){

        try{
            const searchProfile = await modelProfile.find({ indexed : user._id}) //aqui extraemos el documento del perfil de este usaurio
            console.log("Este es el perfil del usuario que desea subir una publicacion ---->", searchProfile)
            console.log("Aqui el estado --->",searchProfile[0].state)
            const state = searchProfile[0].state;
            const country = searchProfile[0].country;
            const countryCode = searchProfile[0].countryCode;

            const { title, category, tecnicalDescription, price, numTickets, fundRaising, raffleClosingPolicy, numberOfPrizes, Prizes1, Prizes2, Prizes3, Prizes4, Prizes5, dateEnd, segment } = req.body;
            const Prizes = [Prizes1, Prizes2, Prizes3, Prizes4, Prizes5];


            function transformarTitle(title) {
                return title
                    .normalize("NFD") // Elimina acentos
                    .replace(/[\u0300-\u036f]/g, "") // Elimina caracteres de acento
                    .toLowerCase() // Convierte a minúsculas
                    .replace(/\s+/g, '-') // Reemplaza espacios por guiones
                    .replace(/[^\w\-]+/g, '') // Elimina caracteres no alfanuméricos excepto guiones
                    .replace(/\-\-+/g, '-') // Reemplaza múltiples guiones por uno solo
                    .trim(); // Elimina guiones al inicio y al final
            }
            
            const titleURL = transformarTitle(title);
            //console.log(titleURL); // "hoverboard-blue-tooth-250w"            

            
            if ( numTickets >= 50 && numTickets <=1000 ){

                let dateStart;
                const date = new Date();
                let dia = date.getDate(); let mes = date.getMonth() + 1; let ani = date.getFullYear();
                let hora = date.getHours(); let minu = date.getMinutes();
                
                                
                if (minu <= 9){
                    dateStart = `${dia}-${mes}-${ani} ${hora}:0${minu}` 
                } else {
                    dateStart = `${dia}-${mes}-${ani} ${hora}:${minu}` 
                }
                    
                //getUTCDate ---> asigna la fecha exacta donde este el usuario. 
                console.log("dateStart : ", dateStart);
                console.log("dateEnd : ", dateEnd);
    
                let parseNumTickets = parseInt(numTickets);
                let parsePrizes = parseInt(numberOfPrizes);
    
                
                for (let i = 1; i < parseNumTickets + 1; i++) {
                    let ticket = { "No" : i, "Contestan" : "", "No_Serial" : "", "Date" : "", "Take" : false, "Ref" : "", "Verified" : false };
                    BOXTickets.push(ticket);
                }
    
                console.log("BOXTickets: ", BOXTickets)
                console.log("parseNumTickets", parseNumTickets );
                console.log("parsePrizes", parsePrizes);
    
                for (let i = 0; i < Prizes.length ; i++) {
                let ele = Prizes[i];
                    if (ele !== undefined){
                        let obje = { Prize : ele, winTicket : null, winUser : null, rate : null };
                        boxPrizesObject.push(obje); 
                    }
                }
    
                console.log("boxPrizesObject", boxPrizesObject);
    

                let countFall = 0;
                let countSuccess = 0;
                let countImgAcept = 0;
                let uploadToS3;

    
                if (req.files.length != 0) {
                    if (req.files.length <= 3) {
                        
                        for (let i = 0; i < req.files.length; i++) {
                            const element = req.files[i];
                        
                            if (element.size <= 2000000  && element.mimetype.startsWith("image/")){
                    
                                countImgAcept ++;
                                console.log("countImgAcept ------------------------------------------------------> ", countImgAcept);
        
                                const folder = department; const ident = new Date().getTime();
                                const pathField = element.path; const extPart = pathField.split(".");
                                const ext = extPart[1];
                                
                                //console.log("Bucket :", bucketName); console.log("folder :", folder);
                                //console.log("patchField :", pathField); console.log("ext", ext);

                                //bucketName, folder, ident, pathField --> Estos eran los prarametros que tenia
                                uploadToS3 = async function (){
                                    
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
                                            countFall ++;
                                        } else {
                                            console.log('La imagen fue subida, Exito', data);
                                            
                                            //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                                            let format = ext;
                                            let url = `https://${bucketName}.${endpoint}/${key}`;
                                            let bytes = element.size;
                                            let public_id = key;
                                            
                                            console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id} `);
                                            boxImg.push( {url, public_id, bytes, format} ); 
                                            
                                            countSuccess ++;
                                            console.log( "countSuccess :", countSuccess );
                                                
                                        }
                                        
                                    });
                                                
        
                                }
        
                                // invocamos la funcion uploadToS3 para subir las imagenes
                                uploadToS3()
                                    .then(() => {
                                        console.log("Imagen subida al servidor digitalocean SPACES");
                                    })
                                    .catch((err) => {
                                        console.log("Ha habido un error al subir las fotos:", err);
                                    });
        

                            } else {
                                console.log("Archivos no subidos por ser muy pesados o no ser de tipo image");
                                await fs.unlink(element.path); // element es el archivo de img y el .path tiene la direccion el metodo unlink del objet fs elimina el archivo de donde esta. 
                            }

                        }
                       
                        setInterval(reviewUpload, 2000);

                        function reviewUpload(){

                            if (countImgAcept === (countSuccess + countFall)) {
                                countImgAcept ++; //aseguramos con esto detener la funcion reviewUpload
                                clearInterval(reviewUpload); //detenemos la evaluacion
                                createAD();
                            }

                        }         
                        
                        async function createAD(){

                            const Raffle =  new modelRaffle({ title, titleURL, category, tecnicalDescription, price, numTickets : parseNumTickets, fundRaising, raffleClosingPolicy, numberOfPrizes : parsePrizes, PrizesObject : boxPrizesObject, images : boxImg, user_id : user._id, username, country, countryCode, state_province : state, boxTickets : BOXTickets , dateStart, dateEnd, CloseDate : dateEnd, segment }); 
                            const RaffleSave = await Raffle.save();
                            //console.log(RaffleSave);                    

                            req.session.uploadPublication = "¡Su publicación se ha subido exitosamente!"
                            res.redirect('/department/create/raffle'); //todo ha salido bien
                            
                        }                 


                    } else {
                        console.log("ha sobrepasado la cantidad de imagenes, puede subir un maximo de 3 imagenes");
                        res.redirect('/department/create/raffle');
                    }

                } else {
                    console.log("debe subir al menos una (1) imagen");
                    res.redirect('/department/create/raffle');
                }

                
            } else {

                req.session.numTicketFall = 'El sorteo debe tener un rango entre 50 y 1000 Tickets.';
                res.redirect('/department/create/raffle');
                
            }

          
        } catch(error){
            req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
            res.redirect('/department/create/raffle');     
        }

    } else {
        req.session.pendingRaffle = "¡Todavia tienes un sorteo activo! Recuerda que solo puedes tener un Sorteo (1) a la vez.";
        res.redirect('/department/create/raffle');
    }
 
    
});

//ruta para eliminar un objeto "anuncio" con try-catch
routes.post('/department/create/raffle/delete', async(req, res)=>{
   
    try{
        let boxMedia = [];
        //let countFall = 0;
        //let countSuccess = 0; 
        let countMedia = 0;     
        console.log("este es el id a deletear: ", req.body);
        const valor = req.body.titleToDelete
        console.log( "aqui en una variable", valor);

   
        if (valor !== 'no_data' ) {
            const resultBD = await modelRaffle.findById(valor)

            console.log("Ver este dato para ver si se puede eliminar");
            const boxTickets = resultBD.boxTickets;
            const PrizesObject = resultBD.PrizesObject
            let countTicket = 0;
            let countRate = 0;
            

            //console.log("boxTickets", boxTickets);
            //console.log("esto se puede ver ???")
            //console.log("PrizesObject", PrizesObject);

            boxTickets.forEach( ticket => {
                if (ticket.Take === true){
                    countTicket = countTicket + 1;
                }
            });

            PrizesObject.forEach( elePrize => {
                //console.log(elePrize.rate)
                if ( elePrize.rate === null ){
                    countRate = countRate + 1;
                }
            });


            if (countTicket == 0){
                console.log("Se puede Eliminar")
                console.log("countDel -->", countTicket)
                console.log("Here this body for delete :", resultBD);
             
                const imagesToDelete = resultBD.images;
                const videoToDelete = resultBD.video;

                //console.log("Here all array to the images :", imagesToDelete);
                //console.log("Here all array to the video :", videoToDelete);

                //abajo en este if else fusiono ambos arreglos images y video en boxMedia para usar solo un for.
                if (videoToDelete.length !=0){
                    boxMedia = [...imagesToDelete, ...videoToDelete];
                    countMedia = boxMedia.length;         
                } else {
                    boxMedia = [...imagesToDelete];
                    countMedia = boxMedia.length;
                }

                //console.log("Esto es boxMedia", boxMedia);
                //console.log("Esto es countMedia", countMedia);

                for (let i = 0; i < boxMedia.length; i++) {
                    const public_id = boxMedia[i].public_id;
                    
                    //console.log("este es el public_id a eliminar : ", public_id);
                    deleteMedias(public_id)

                    async function deleteMedias(public_id){

                        const params = {
                            Bucket : bucketName,
                            Key : public_id
                        }
                        s3.deleteObject(params, (err, data)=>{
                            if (err){
                                console.error("Error al eliminar el archivo --->", err);
                            } else {
                                console.log("Media eliminada con exito --->", data);
                            }
                        })  
                            
                    }
                        
                } 
                //al terminar de correr el for de destructor procedemos a eliminar el documento de la DB.

                setTimeout(async() => {
                    console.log("Se ha activado el deleteDB(), revisar si se han eliminado todas las medias")
                        try {
                            await deleteDB()
                        } catch (error) {
                            console.log("Este es el error que sale cuando se elimina el documento en la DB", error)
                        }
                    
                }, 4000); 

                async function deleteDB(){
                    const deletingDoc = await modelRaffle.findByIdAndDelete(valor);

                    req.session.deletePublication = "Publicación eliminada"
                    res.redirect('/department/create/nautical')
                }   

            } else {
                console.log("countDel -->", countTicket)
                console.log("countRate -->", countRate)
                if (countRate === 0){
                    console.log("Se puede Eliminar")
                    //console.log("Here this body for delete :", resultBD);
                    const imagesToDelete = resultBD.images;
                    const videoToDelete = resultBD.video;

                    //console.log("Here all array to the images :", imagesToDelete);
                    //console.log("Here all array to the video :", videoToDelete);

                    //abajo en este if else fusiono ambos arreglos images y video en boxMedia para usar solo un for.
                    if (videoToDelete.length !=0){
                        boxMedia = [...imagesToDelete, ...videoToDelete];
                        countMedia = boxMedia.length;         
                    } else {
                        boxMedia = [...imagesToDelete];
                        countMedia = boxMedia.length;
                    }

                    //console.log("Esto es boxMedia", boxMedia);
                    //console.log("Esto es countMedia", countMedia);

                    for (let i = 0; i < boxMedia.length; i++) {
                        const public_id = boxMedia[i].public_id;
                        
                        console.log("este es el public_id a eliminar : ", public_id);
                        deleteMedias(public_id)

                        async function deleteMedias(public_id){

                            const params = {
                                Bucket : bucketName,
                                Key : public_id
                            }
                            s3.deleteObject(params, (err, data)=>{
                                if (err){
                                    console.error("Error al eliminar el archivo --->", err);
                                } else {
                                    console.log("Media eliminada con exito --->", data);
                                }
                            })  
                                
                        }
                            
                    } 
                    //al terminar de correr el for de destructor procedemos a eliminar el documento de la DB.

                    setTimeout(async() => {
                        console.log("Se ha activado el deleteDB(), revisar si se han eliminado todas las medias")
                            try {
                                await deleteDB()
                            } catch (error) {
                                console.log("Este es el error que sale cuando se elimina el documento en la DB", error)
                            }
                        
                    }, 4000); 

                    async function deleteDB(){
                        const deletingDoc = await modelRaffle.findByIdAndDelete(valor);

                        req.session.deletePublication = "Publicación eliminada";
                        res.redirect('/department/create/raffle');
                    }   
        
                    
                    
                } else {
                    console.log("No se puede Eliminar")
                    req.session.deleteNoPublication = "Imposible Eliminar Publicación"
                    res.redirect('/department/create/raffle') 
                }
               
            }

        } 
        
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/raffle');
    }    

});

//ruta para eliminar una (1) foto con try-catch
routes.get('/department/create/raffle/del/raffle/:id', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect 
    const { id } = req.params;
    const public_id = "raffle/"+id;
    //console.log("este es el publicId a eliminar  ------>", public_id)
    //const public_id => "raffle/1720566117383.jpg
    //encontrar la imagen en la DB        
    try{
        const result = await modelRaffle.findById(TitleSelect);
        //console.log("este es el documento es cuestion ---->",result);
        
        if (result.images.length > 1){

            const params = {
                Bucket : bucketName,
                Key : public_id
            }
            s3.deleteObject(params, (err, data)=>{
                if (err){
                    console.error("Error al eliminar el archivo", err);
                } else {
                    console.error("Archivo eliminado con exito", data);


                    async function deleteDB(){

                        const Images = result.images;
                        for (let i = 0; i < Images.length; i++) {
                            const element = Images[i];
                            console.log("Aqui todos los public_id ----->", element.public_id)
                            if (element.public_id == public_id){
                                const resultBD = await modelRaffle.updateOne({ _id: TitleSelect},{ $pull: {"images":{"public_id": element.public_id }}} )
                                console.log("Aqui el resultado esperado ---->",resultBD)
                            }
                        
                        }
                
                        

                    }

                    deleteDB()
                        .then(()=>{
                            res.redirect('/department/create/raffle');
                        })
                        .catch((err)=>{
                            console.log("Ha ocurrido un error, intente mas tarde.", err);
                            res.redirect('/department/create/raffle');
                        })

                }
            });
            

        } else {
            res.redirect('/department/create/raffle')
            console.log("No puedes eliminar todas las fotos.")
        }
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/raffle')
    }

});

//ruta para agregar una (1) foto adelante con try-catch
routes.post('/department/create/raffle/add/first/raffle', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const department = 'raffle';
    const element = req.files[0];
    const boxImg = [];
    //console.log(TitleSelect);
    //console.log(element); //aqui tenemos la imagen que el usuario esta subiendo
    //console.log("estamos en el backend /department/create/raffle/add/first/raffle");

    try{
        const searchRaffle = await modelRaffle.findById(TitleSelect);
        //console.log("Esto es searchArte.images.length ---->",searchArte.images.length )

        if (searchRaffle.images.length < 12){
            if (element.size <= 2000000  && element.mimetype.startsWith("image/")){

                //console.log("una imagen aqui aceptada----->", element)

                const folder = department; const ident = new Date().getTime();
                const pathField = element.path; const extPart = pathField.split(".");
                const ext = extPart[1];
                            
                //console.log("Bucket :", bucketName); console.log("folder :", folder);
                // console.log("pathField :", pathField); console.log("ext", ext);

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
                        let bytes = element.size;
                        let public_id = key;
                        
                        //console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id} `);
                        boxImg.push( {url, public_id, bytes, format} );            

                        async function saveDB(){
                            //console.log("este es el path que tiene que ser eliminado:", element.path)
                            await fs.unlink(element.path) 
                            
                            //console.log("Esto es boxImg -------->", boxImg);
                            const box = boxImg[0]; 
                            //console.log("Esto es box -------->", box);
                                                                            
                            const updateImg = await modelRaffle.findByIdAndUpdate(TitleSelect, { $push :{images : { $each: [box], $position : 0} } });
                                                         
                        }
     
                        saveDB()
                            .then(()=>{
                                console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                                res.redirect('/department/create/raffle');
                            })
                            .catch((err)=>{
                                console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                res.redirect('/department/create/raffle');
                            })

                    }
                    
                }); 

                
            } else {
                console.log("Archivos no subidos por ser muy pesados o no ser de tipo image")
                res.redirect('/department/create/raffle');
            
            }
        } else {
            console.log("ya has superado el maximo permitido de subida de imagen.");
            res.redirect('/department/create/raffle');
        }
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/raffle');
    }    

});

//ruta para agregar una (1) foto atras con try-catch           
routes.post('/department/create/raffle/add/last/raffle', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const department = 'raffle';
    const element = req.files[0];
    const boxImg = [];
    //console.log(TitleSelect);
    //console.log(element); //aqui tenemos la imagen que el usuario esta subiendo
    //console.log("estamos en el backend /department/create/raffle/add/last/raffle");

    try{
        const searchRaffle = await modelRaffle.findById(TitleSelect);
        if (searchRaffle.images.length < 12){

            if (element.size <= 2000000  && element.mimetype.startsWith("image/")){
                
                //console.log("una imagen aqui aceptada----->", element)

                const folder = department; const ident = new Date().getTime();
                const pathField = element.path; const extPart = pathField.split(".");
                const ext = extPart[1];
                
                //console.log("Bucket :", bucketName);console.log("folder :", folder);
                //console.log("patchField :", pathField);console.log("ext", ext);
            
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
                        let bytes = element.size;
                        let public_id = key;
                        
                        //console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id} `);
                        boxImg.push( {url, public_id, bytes, format} );            

                        async function saveDB(){
                            //console.log("este es el path que tiene que ser eliminado:", element.path)
                            await fs.unlink(element.path) 
                            
                            //console.log("Esto es boxImg -------->", boxImg);
                            const box = boxImg[0]; 
                            //console.log("Esto es box -------->", box);

                            const updateImg = await modelRaffle.findByIdAndUpdate(TitleSelect, { $push : {images : box } });
                                                                                                            
                        }

                                
                        saveDB()
                            .then(()=>{
                                console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                                res.redirect('/department/create/raffle')  
                            })
                            .catch((err)=>{
                                console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                res.redirect('/department/create/raffle') 
                            })

                    }
                    
                });
                        

            } else {
            console.log("Archivos no subidos por ser muy pesados o no ser de tipo image")
            res.redirect('/department/create/raffle')
            
            }
        } else {
            console.log("ya has superado el maximo permitido de subida de imagen.");
            res.redirect('/department/create/raffle');
        }
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/raffle');
    }    

}); 

//ruta para agregar (1) video con try-catch
routes.post('/department/create/raffle/add/video', async(req, res)=>{
    const boxVideo = [];
    const department = 'raffle';
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const element = req.files[0];
    //console.log("Esto es TitleSelect", TitleSelect);
    //console.log("::::::: **** Esto es video ----->", element);

    try{
        const search = await modelRaffle.findById(TitleSelect);
        
        //console.log("search", search);
        if(search.video.length == 0){

            //50000000 bit = 50 MB para video. sufiente para asegurar 3 minutos de video.
            if (element.size <= 50000000  && element.mimetype.startsWith("video/")){

                //console.log("un video aqui aceptado----->", element)
            
                const folder = department; const ident = new Date().getTime();
                const pathField = element.path; const extPart = pathField.split(".");
                const ext = extPart[1];

                //const fileContent = fs.readFileSync(pathField);
                const fileContent = fs.createReadStream(pathField);
                const key = `${folder}/${ident}.${ext}`;
                
                const params = {
                    Bucket : bucketName,
                    Key : key,
                    Body : fileContent,
                    ACL : 'public-read'
                }

                s3.upload(params, (err, data)=>{
                    if (err){
                        console.error("Error al subir un video", err);
                        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
                        res.redirect('/department/create/raffle');
                    } else {
                        console.log("Video subido con exito", data);
        
                        //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.
                        let format = ext;
                        let url = `https://${bucketName}.${endpoint}/${key}`;
                        let bytes = element.size;
                        let public_id = key;
                        
                        console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id} `);    
                        boxVideo.push( {url, public_id, bytes, format} );
                        //console.log("Esto es boxVideo -------->", boxVideo);

                        const box = boxVideo[0]; 
                        //console.log("Esto es box -------->", box);

                          
                        async function saveDB(){

                            //console.log("este es el path que tiene que ser eliminado:", element.path)
                            await fs.unlink(element.path) 
                                
                            const updateDB = await modelRaffle.findByIdAndUpdate(TitleSelect, { $push : {video : box } });
                            console.log("Esto es updateDB ---->",updateDB);
                            req.session.videoUploaded = "Video subido exitosamente."

                            res.redirect('/department/create/raffle');

                        }

                        saveDB()
                            .then(()=>{
                                console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                            })
                            .catch((err)=>{
                                console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                            })


                    }
                });
                

            } else {
                console.log("Archivos no subidos por ser muy pesados o no ser de tipo video")
                //aqui falta que borre tambien los archivos en uppload
                await fs.unlink(element.path) // element es el archivo de sonido y el .path tiene la direccion el metodo unlink del objet fs elimina el archivo de donde esta. 
                req.session.videoNoUploaded = "Video No subido por exceder su peso."
                res.redirect('/department/create/raffle');
            
            } 

        } else {
            //ya tiene un video no puede cargar mas videos.
            req.session.uploadVideoDone = '¡Ya su anuncio tiene un video cargado!';
            res.redirect('/department/create/raffle');

        }
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/raffle');
    }    
 
});

//ruta para eliminar un (1) video con try-catch            
routes.get('/department/create/artes/del/video/artes/:id', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect 
    const { id } = req.params;
    const public_id = "raffle/"+id; //folder: 'raffle'  debe haber una igualdad entre ambos valores. 
    //console.log("Eliminando un video");
    //console.log("este es el public_id a eliminar ------>", public_id);

    //encontrar la imagen en la DB
    try{     
        const result = await modelRaffle.findById(TitleSelect);
        //console.log("este es el documento es cuestion ---->",result);
    
        const params = {
            Bucket : bucketName,
            Key : public_id
        }
        s3.deleteObject(params, (err, data)=>{
            if (err){
                console.error("Error al eliminar el archivo", err);
            } else {
                console.error("Archivo eliminado con exito", data);

                async function deleteDB(){
                    const Video = result.video;
                    for (let i = 0; i < Video.length; i++) {
                        const element = Video[i];
                        console.log("Aqui todos los public_id ----->", element.public_id)
                        if (element.public_id == public_id){
                            const resultBD = await modelRaffle.updateOne({ _id: TitleSelect},{ $pull: {"video":{"public_id": element.public_id }}} )
                            console.log("Aqui el resultado esperado ---->",resultBD)
                        }

                    }
                }    

                deleteDB()
                    .then(()=>{
                        req.session.videoDelete = 'Video eliminado exitosamente.'; 
                        res.redirect('/department/create/raffle');
                    })
                    .catch((err)=>{
                        console.log("Ha habido un error, intente mas tarde.", err);
                    })
                

            }
        });
     
        
    } catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/raffle');
    }
    
});
           
routes.get('/department/create/raffle/searh-edit', async(req, res)=>{
   const user = req.session.user;
   const data = await modelRaffle.find({user_id : user._id});
   res.json({data});
});
         
routes.post('/department/create/raffle/edit', async(req, res)=>{
   
   
    const {titleToEdit, title, tecnicalDescription} = req.body

    function transformarTitle(title) {
        return title
            .normalize("NFD") // Elimina acentos
            .replace(/[\u0300-\u036f]/g, "") // Elimina caracteres de acento
            .toLowerCase() // Convierte a minúsculas
            .replace(/\s+/g, '-') // Reemplaza espacios por guiones
            .replace(/[^\w\-]+/g, '') // Elimina caracteres no alfanuméricos excepto guiones
            .replace(/\-\-+/g, '-') // Reemplaza múltiples guiones por uno solo
            .trim(); // Elimina guiones al inicio y al final
    }
    
    const titleURL = transformarTitle(title);

    const result = await modelRaffle.findById(titleToEdit)
        
    if (result) {
        const updates = await modelRaffle.findByIdAndUpdate(titleToEdit, {title, titleURL, tecnicalDescription})
        req.session.updatePublication = "Su publicacion ha sido actualizado satisfactoriamente"
    } else {
        console.log("no existe nada")
    }
    res.redirect('/department/create/raffle');
});


cron.schedule('*/1 * * * *', async() => {
    //este cron ejecuta tareas de verificacion y ejecucion de sorteo Pago y Gratis por igual
    console.log('************ Raffle ************')
    console.log('Escuchando cada minuto si hay sorteos por ejecutar de tipo byDate');   
    const searchRaffleByDate = await modelRaffle.find({ raffleClosingPolicy : 'byDate', allTicketsTake: false });
    console.log("////// searchRaffleByDate longitud : ", searchRaffleByDate.length )
    //console.log("searchRaffleByDate ---->", searchRaffleByDate); //esto es un array de objetos "rifas por byDate"
    //console.log("searchRaffleByDate.CloseDate ---->", searchRaffleByDate.CloseDate)
    const dtNow = new Date();
    let dateNow;
    let dateNowData; //este es la fecha que requiere el message
    let ticketRandom = [];
    let updatePrizesObject; // esta variable se actualiza cuando la funcion messagesForWin() es ejecutada
    // es un objeto que posee el numero ganador y el username a quien pertenece el ticket. este objeto ya actualizado lo usaremos en una funcion 
    // llamada createAndSendEmails()

    const diaNow = dtNow.getDate();
    const mesNow = dtNow.getMonth() +1;
    const yearNow = dtNow.getFullYear();
    const horaNow = dtNow.getHours();
    const minuNow = dtNow.getMinutes();

    //este codigo es creado con la fecha y hora actual y es el codigo que se compara con el cierre 
    dateNow = `${diaNow}${mesNow}${yearNow}T${horaNow}:${minuNow}`; //esto es un codigo creaado con fecha y hora
    

    if (minuNow <= 9){
        dateNowData = `${diaNow}-${mesNow}-${yearNow} ${horaNow}:0${minuNow}`;
    } else {
        dateNowData = `${diaNow}-${mesNow}-${yearNow} ${horaNow}:${minuNow}`;
    }
   
    if (searchRaffleByDate.length !== 0  ){
        
            for (let i = 0; i < searchRaffleByDate.length; i++) {
                const Id = searchRaffleByDate[i]._id;
                const depart = searchRaffleByDate[i].department; //aqui el departamento. 
                const title = searchRaffleByDate[i].title; //aqui tengo el title
                const urlImageArticle = searchRaffleByDate[i].images[0].url;
                const category = searchRaffleByDate[i].category; //Pago o Gratis
                const policy = searchRaffleByDate[i].raffleClosingPolicy; //politica de celebracion
                const price = searchRaffleByDate[i].price //precio del ticket
                const dateStart = searchRaffleByDate[i].dateStart; //aqui la fecha de creacion del sorteo ya formateada.
                const UserName = searchRaffleByDate[i].username; //anfitrion
                const anfitrion_id = searchRaffleByDate[i].user_id; //id del anfitrion
                const boxTickets = searchRaffleByDate[i].boxTickets;
                const CloseDate = searchRaffleByDate[i].CloseDate;
                const cantPrizes = searchRaffleByDate[i].numberOfPrizes;
                const cantTicket = searchRaffleByDate[i].numTickets; 

                const CD = new Date(CloseDate);
                let diaCD = CD.getDate();
                let mesCD = CD.getMonth() +1;
                let anioCD = CD.getFullYear();
                let horaCD = CD.getHours();
                let minuCD = CD.getMinutes();

                const DateCloseRaffle = `${diaCD}${mesCD}${anioCD}T${horaCD}:${minuCD}`
                
                console.log("************ Validando codigos Date ******************");
                console.log("************ Raffle byDate ******************");
                console.log("dateNow = DateCloseRaffle");
                console.log(dateNow + " = " + DateCloseRaffle);
                console.log(dateNow  ==  DateCloseRaffle);
            

                if (dateNow  ==  DateCloseRaffle){

                    //aqui debemos crear una condicion con el boxTickets si ningun tiket a sido tomado (Take)
                    //entonces no se ejecuta ninguna celebracion y queda este anuncio en pausa para que el 
                    //anfitrion pueda volver ha admisnitralo.
                    let tiketTakeCount = 0;

                    for (let i = 0; i < boxTickets.length; i++) {
                        const ticketTake = boxTickets[i].Take;
                        
                        if (ticketTake === true){
                            tiketTakeCount ++;
                        } 
                        
                    }

                    if (tiketTakeCount !==0 ){

                                                
                        //asigno true al campo allTicketsTrue
                        const updateRaffle = await modelRaffle.findByIdAndUpdate(Id, { $set: { allTicketsTake : true }} );
                        //genero los numeros ganadores sin repetirse (winTicket)
                        //cantPrizes (esta variable esta la cantidad de numeros que se deben generar)
                        while (ticketRandom.length < cantPrizes){
                            let randomNumber = Math.trunc(Math.random() * cantTicket);
                            if ( randomNumber !== 0 ){
                                
                                if (!ticketRandom.includes(randomNumber)){
                                    ticketRandom.push(randomNumber);
                                }

                            }
                        }
                        console.log("::::::::::::::Aqui los numeros random:::::::::::::");
                        console.log('ticketRandom', ticketRandom);
                        //PrizesObject arreglo que posee los objetos que deben ser actualizados con los numeros en el campo winTicket 
            

                        async function TicketWin(){

                            for (let i = 0; i < ticketRandom.length; i++) {
                                    let ticketWin = ticketRandom[i];

                                    const updateWinTicket = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                        [`PrizesObject.${i}.winTicket`] : ticketWin
                                    }});
                            
                            }
                        }
                        
                        async function fContestan(){

                            for (let u = 0; u < ticketRandom.length; u++) {
                                    const ticketWin = ticketRandom[u];// aqui estaran los numeros ganadores ejemplo 4, 7, 9
                                    for (let x = 0; x < boxTickets.length; x++) {
                                        const ele = boxTickets[x].No; //1,2,3,4,5,6,7,8,9,...... hasta el ultimo
                                        const Contestan = boxTickets[x].Contestan; //aqui iran pasando todos los username que participaron
                                        const Verified = boxTickets[x].Verified; //si esta false es porque no ha sido verificado coono ticket pagado en el caso de sorteos "pagos"
                                    

                                        if (category == "Gratis"){

                                            if (ele == ticketWin  && Verified === true){
                                                
                                                const updateWinTicket = await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                                
                                                    [`PrizesObject.${u}.winUser`] : Contestan
                                    
                                                }});

                                            } else if (ele == ticketWin && Verified === false) {
                                                console.log(":::: Si Encontrado pero No Verificado ::::");
                                                console.log("Aqui meto el *-Anfitrion-* dentro de winUser")
                                                console.log("_______________________");

                                                await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                                
                                                    [`PrizesObject.${u}.winUser`] : UserName
                                    
                                                }});
                                                
                                            }

                                        } else {
                                                //ele = No            Verified = 4
                                            if (ele == ticketWin && Verified === true){
                                                console.log("::::Si Encontrado y Verificado ::::");
                                                console.log("Aqui meto el ganador *-Contestan-* dentro de winUser")
                                                console.log("_______________________");

                                                await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                                
                                                    [`PrizesObject.${u}.winUser`] : Contestan
                                    
                                                }}); 
                                                

                                            } else if (ele == ticketWin && Verified === false) {
                                                console.log(":::: Si Encontrado pero No Verificado ::::");
                                                console.log("Aqui meto el *-Anfitrion-* dentro de winUser")
                                                console.log("_______________________");

                                                await modelRaffle.findByIdAndUpdate(Id, { $set: {
                                                
                                                    [`PrizesObject.${u}.winUser`] : UserName
                                    
                                                }});
                                                
                                            }
                                        }    
                                
                                    }
                            
                            }

                        }

                        async function messagesForWin(){

                            const newRaffle = await modelRaffle.findById(Id);
                            updatePrizesObject = newRaffle.PrizesObject
                            console.log("Esto es updatePrizesObject -----------> mirar esto, se actualizo", updatePrizesObject);
                            for (let n = 0; n < updatePrizesObject.length; n++) {
                                const winUser = updatePrizesObject[n].winUser; //user ganador
                                console.log("winUser --->", winUser);
                                try{
                                    const resultUser = await modelUser.find({ username : winUser}); //hago una busqueda para ubicar el Id del user
                                    const winId = resultUser[0]._id; //Id del user ganador.
                                    console.log("VER ESTO");
                                    console.log("------------------------------------");
                                    console.log("winUser --->", winUser);
                                    console.log("resultUser esto es la busqueda debemos recibir un objeto de la coleccion user--->", resultUser);
                                    console.log("Esto es winId", winId);
                                                                                                                                                                                                                                                                                                    
                                    const newMessage = new modelMessages({times : dateNowData, titleArticle : title, urlImageArticle, userId : anfitrion_id, username : UserName , question : "Felicidades ha sido ganador de un Sorteo. ¡Vaya al sorteo reclame su premio y califique!", depart, productId : Id, toCreatedArticleId : winId, ownerStore : winUser  });
                                    console.log("newMessage :", newMessage);
                                    const saveMessage = await newMessage.save();
                                } catch(error){
                                    console.error('Ha ocurrido un error', error);
                                }    
                                
                            }

                        }

                        async function emailsWinTicket(){
                            //updatePrizesObject y title estan afuera y tengo acceso a estos datos.
                            console.log("emailsWinTicket() -> ejecutandose"); 
                            console.log("updatePrizesObject ->", updatePrizesObject);
                            for (let i = 0; i < updatePrizesObject.length; i++) {
                                const winUser = updatePrizesObject[i].winUser; //user ganador
                                console.log("winUser --->", winUser )

                                const resultUser = await modelUser.find({ username : winUser}); //hago una busqueda para ubicar el Id del user
                                const winEmail = resultUser[0].email; //Id del user ganador.

                                // con el email y el titulo arriba disponible, se procede a crear el correo y a enviarlo.
                                const message = "Celebración de Sorteo."
                                const contentHtml = `
                                <h2 style="color: black"> Felicidades has sido ganador en un Sorteo. </h2>
                                <ul style="color: black"> 
                                    <li> cuenta : ${winEmail} </li> 
                                    <li> asunto : ${message} </li>
                                <ul>
                                <h2 style="color: black"> Ganaste Sorteo de ${title}. </h2>
                                <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y vaya al sorteo. Reclame su premio y califique. </p>
                                `

                                const emailMessage = {
                                    from: "Blissenet<sistemve@blissenet.com>", //remitente
                                    to: winEmail,
                                    subject: "🎊 Celebración de Sorteo - Blissenet", //objeto
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

                        }

                        async function emailAnfitrion(){
                            console.log("emailAnfitrion() -> ejecutandose"); 

                            const resultUser = await modelUser.find({ username : UserName}); //hago una busqueda para ubicar el Id del user
                            const anfitrionMail = resultUser[0].email; //Id del user ganador.

                            console.log(`anfitrionMail : ${anfitrionMail} | title: ${title}`); 

                            const message = "Celebración de Sorteo."
                            const contentHtml = `
                            <h2 style="color: black"> Felicidades su Sorteo se ha celebrado. </h2>
                            <ul style="color: black"> 
                                <li> cuenta : ${anfitrionMail} </li> 
                                <li> asunto : ${message} </li>
                            <ul>
                            <h2 style="color: black"> Celebración de Sorteo  ${title}. </h2>
                            <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y atienda con esmero a los dichosos ganadores, para que estos le califiquen de forma positiva. </p>
                            `

                            const emailMessage = {
                                from: "Blissenet<sistemve@blissenet.com>", //remitente
                                to: anfitrionMail,
                                subject: "🎊 Celebración de Sorteo - Blissenet", //objeto
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
                                    console.log("Email enviado al anfitrion")
                                }
                            }) 
                        }
                        
                        async function invoiceDone(){
                            //aqui creamos la factura del sorteo.
                            // category > Gratis or Pago
                            if (category === "Pago"){
                                let commission = 8;
                                let tecnicalDescription = 'Esto es un Sorteo de Tickets Pago';
                                const Invoice = new modelInvoice({ usernameSell : UserName, indexed : anfitrion_id, department : depart, title, title_id : Id,  tecnicalDescription, price, commission });
                                const InvoiceSave = await Invoice.save();
                            } else {
                                let commission = 6;
                                let tecnicalDescription = 'Esto es un Sorteo de Tickets Gratis';
                                const Invoice = new modelInvoice({ usernameSell : UserName, indexed : anfitrion_id, department : depart, title, title_id : Id,  tecnicalDescription, price, commission });
                                const InvoiceSave = await Invoice.save();
                            }
                        }

                        async function raffleHistory(){
                            //aqui guardamos la data del raffle history
                            const raffle = await modelRaffle.findById(Id);
                            const PrizesObject =  raffle.PrizesObject;
                            const image = raffle.images[0].url;
                            //console.log("image ---->", image);

                            let response;
                            async function downloadImgToUpload(){
                                response = await axios.get(image, { responseType: 'arraybuffer', maxContentLength: Infinity });
                                //console.log("response ---->", response); //un espaguitero grande
                            }

                            downloadImgToUpload()
                                .then(()=>{
                                        const epoch = new Date().getTime();
                                        const folder = 'firstImgRaffleHistory';
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

                                                async function saveDB(){ 
                                                    const history = new modelRaffleHistory({ category, anfitrion : UserName, anfitrion_id, title_id : Id , title, price, numTickets: cantTicket, PrizesObject, dateStart, image: dImage });
                                                    //(anfitrion, anfitrion_id, category, title_id, title, image, price, numTickets, PrizesObject, dateStart)
                                                    const historySave = await history.save(); //data salvada.
                                                }

                                                saveDB() //invocar funcion 
                                                    .then(()=>{
                                                        console.log('se guardo el historial del sorteo OK')
                                                    })
                                                    .catch((err)=>{
                                                        console.log("XXXXXXXXXXXXXXXXXXXXXXX ERROR XXXXXXXXXXXXXXXXXXXXXXXX");
                                                        console.log('XXXX  ha habido un error al guardar el historial XXXX', err);
                                                    })
                                            }
                                        
                                        });
                                        

                                        
                                })
                                .catch((err)=>{
                                    console.log("ha habido un error en la descarga de la imagen raffle", err);
                                })  


/*                             const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgRaffleHistory'});
                            //console.log("Aqui resultUpload ----->", resultUpload);
                            const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
                            const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.
                            //
                
                            const history = new modelRaffleHistory({ category, anfitrion : UserName, anfitrion_id, title_id : Id , title, price, numTickets: cantTicket, PrizesObject, dateStart, image: dImage });
                            //(anfitrion, anfitrion_id, category, title_id, title, image, price, numTickets, PrizesObject, dateStart)
                            const historySave = await history.save(); //data salvada.  */
                        }
                    
                        TicketWin() //:::invocacion de la primera Funcion TicketWin
                            .then(()=>{
                                //todos los elementos de PrizesObject en el campo winTicket deben tener su numero ganador y no null.
                                fContestan() //:::invocacion segundo funcion 
                                    .then(()=>{
                                        messagesForWin() //invocacion de envio de mensajes a todos los participantes Ganadores.
                                            .then(()=>{
                                                emailsWinTicket()
                                                    .then(()=>{
                                                        emailAnfitrion()
                                                            .then(()=>{
                                                                invoiceDone() //aqui invoco el ultimo proceso, la creacion de la factura del Sorteo.
                                                                    .then(()=>{
                                                                        raffleHistory()
                                                                            .then(()=>{
                                                                                console.log("Cadena de funciones ejecutada satisfactoriamente en raffle by date");
                                                                            })
                                                                            .catch((error)=> {
                                                                                console.log("Ha ocurrido un error en raffleHistory()", error);
                                                                            })
                                                                    })
                                                                    .catch((error)=> {
                                                                        console.log("Ha ocurrido un error en invoiceDone()", error);
                                                                    })
                                                            })
                                                            .catch((error)=>{
                                                                console.log("Ha ocurrido un error en emailAnfitrion()", error);
                                                            })

                                                    })
                                                    .catch((error)=>{
                                                        console.log("Ha ocurrido un error en emailsWinTicket()", error);
                                                    })

                                            })
                                            .catch((error)=> {
                                                console.log("Ha ocurrido un error en messagesForWin()", error);
                                            })
                                    })
                                    .catch((error)=> {
                                        console.log("Ha ocurrido un error en fContestan()", error);
                                    })
                                
                            })
                            .catch((error)=> {
                                console.log("Ha ocurrido un error en TicketWin()", error);
                            })
                        


                    } else {
                        
                        let countFall = 0;
                        let countSuccess = 0; 
                        let countMedia = 0;  

                        //funcion para enviar un correo al anfitrion de que su sorteo fue eliminado 
                        async function emailAnfitrion(){
                            console.log("emailAnfitrion() -> ejecutandose"); 

                            const resultUser = await modelUser.find({ username : UserName}); //hago una busqueda para ubicar el Id del user
                            const anfitrionMail = resultUser[0].email; //Id del user ganador.

                            console.log(`anfitrionMail : ${anfitrionMail} | title: ${title}`); 

                            const message = "Sorteo Eliminado."
                            const contentHtml = `
                            <h2 style="color: black"> Su sorteo "${title}" no tuvo participación. </h2>
                            <ul style="color: black"> 
                                <li> cuenta : ${anfitrionMail} </li> 
                                <li> asunto : ${message} </li>
                            <ul>
                            <h2 style="color: black"> Sorteo Eliminado por falta de participación. ${title} </h2>
                            <p> <b> Estimado usuario, </b>Por motivos que desconocemos su sorteo no ha tenido ninguna participación, le aconsejamos haga un nuevo sorteo y prepare una nueva campaña para asegurar una real participación. Busque ayuda de personas que ya hayan realizado campañas de sorteo.</p>
                            <p> <b> Vuelve a intentarlo con un mayor tiempo,</b> te esperamos con tu nuevo sorteo en Blissenet.com. </p>
                            `

                            const emailMessage = {
                                from: "Blissenet<sistemve@blissenet.com>", //remitente
                                to: anfitrionMail,
                                subject: "Sorteo Eliminado - Blissenet", //objeto
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
                                    console.log("Email enviado al anfitrion")
                                }
                            }) 
                        }

                        //funcion que envia un alert a su mensajeria
                        async function sendMessage(){

                            let endRaffleTime, Note;
                            const dateNow = new Date();
                            let dia = dateNow.getDate(); let mes = dateNow.getMonth() +1; let anio = dateNow.getFullYear();
                            let hora = dateNow.getHours(); let minu = dateNow.getMinutes();
                        
                            if (minu <=9){
                                endRaffleTime = `${dia}-${mes}-${anio} ${hora}:0${minu}`
                            } else {
                                endRaffleTime = `${dia}-${mes}-${anio} ${hora}:${minu}`
                            }

                            Note = `Su Sorteo de Titulo ${title} ha sido eliminado por no tener niguna participación`; 

                            //enviar mensaje al usuario al que se le ha eliminado su anuncio por no tener participación.
                            const newMessage = new modelMessages( { typeNote: "notes", times: endRaffleTime, username : "admin", question : Note, toCreatedArticleId: anfitrion_id,  ownerStore: UserName, depart: depart, titleArticle: title, productId : Id } );
                            const saveMessage = await newMessage.save();

                        }    

                        //al no ser tomado ningun ticket este de cierte forma queda intacto y en pausa. para que el anfitrion administre este sorteo.                         
                        async function deleteRaffle(){

                            const RaffleByDate = await modelRaffle.findById(Id);

                            const imagesToDelete = RaffleByDate.images;
                            const videoToDelete = RaffleByDate.video;

                            if (videoToDelete.length !==0){
                                boxMedia = [...imagesToDelete, ...videoToDelete];
                                countMedia = boxMedia.length;         
                            } else {
                                boxMedia = [...imagesToDelete];
                                countMedia = boxMedia.length;
                            }

                            //meter en un array fotos y video
                            console.log("Here array to the boxMedia :", boxMedia); 
                          
                            for (let i = 0; i < boxMedia.length; i++) {
                                const public_id = boxMedia[i].public_id;
                                
                                const params = {
                                    Bucket : bucketName,
                                    Key : public_id
                                }
                                s3.deleteObject(params, (err, data)=>{
                                    if (err){
                                        countFall ++;
                                        console.error("Error al eliminar el archivo --->", err);
                                    } else {
                                        countSuccess ++;
                                        console.log("Media eliminada con exito --->");
                                    }
                                }) 

                            }    

                            setInterval(reviewDelet, 3000);

                            function reviewDelet(){
            
                                if (countMedia === (countSuccess + countFall)) {
                                    
                                    countMedia ++; //aseguramos con esto detener la funcion reviewUpload
                                    clearInterval(reviewDelet); //detenemos la evaluacion
                                    deleteDB()
            
                                }
                            }   
            
                            async function deleteDB(){
                                const deletingDoc = await modelRaffle.findByIdAndDelete(Id);                          
                            } 
                
                            deleteDB()
                                .then(()=>{
                                  console.log("Raffle eliminado satisfactoriamente, OK");
                                })
                                .catch((err)=>{
                                    console.log("Ha ocurrido un error, intente mas tarde.", err);
                                   
                                })
                    
       
                        }
                
                            

                        emailAnfitrion()
                            .then(()=>{
                                sendMessage()
                                    .then(()=>{
                                        deleteRaffle()
                                            .then(()=>{
                                                console.log("Sorteo eliminado por no tener participación");
                                            })
                                            .catch((error)=>{
                                                console.log("Ha habido un error deleteRaffle()", error);
                                            })
                                    })
                                    .catch((error)=>{
                                        console.log("Ha habido un error sendMessage()", error);
                                    })

                            })
                            .catch((error)=>{
                                console.log("Ha habido un error emailAnfitrion()", error);
                            })

                    }
                    
                        
                }   
            }

    }   
    
});


module.exports = routes