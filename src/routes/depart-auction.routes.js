const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelAuction = require('../models/auction.js');
const modelBuySell = require('../models/buySell.js');
const modelInvoice = require('../models/invoice.js');

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

            
             
routes.get('/department/create/auctions', async(req,res)=>{
    let countImpagos = 0;
    const boxImpagos = [];
    let searchProfile, Auctions, Contacts, BuySell;
    let Images = null;
    let Sound = null;
    let Video;
    let Spreading, Time, restMilis;
   
    const user = req.session.user; // datos del usuario
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const titleSelect = req.session.titleSelect; //datos del titulo seleccionado
    const TitleSelect = await modelAuction.findById(titleSelect)

    const uploadPublication = req.session.uploadPublication; //mensaje de subida de publicacion.
    const updatePublication = req.session.updatePublication; //mensaje de actualizacion de publicacion.
    const deletePublication = req.session.deletePublication; //mensaje de eliminacion de publicacion
    const biddingRemovalProhited = req.session.biddingRemovalProhited //NO es posible eliminar una Subasta Activa.; 

    const uploadFall = req.session.uploadFall; //mensaje de que no se ha subida la publicacion por no contar con una imagen aceptada por el sistema.
    const audioUploaded = req.session.audioUploaded; //mensaje de subida exitosa de audio .
    const audioNoUploaded = req.session.audioNoUploaded; //mensaje de No subida de audio.
    const uploadVideo = req.session.videoUploaded; //mensaje de video subido exitosamente;
    const uploadVideoFall = req.session.videoNoUploaded; //mensaje de error no se ha subido por superar el peso establecido.
    const uploadVideoDone = req.session.uploadVideoDone; //mensaje de que ya existe un video cargado para este anuncio.
    const videoDelete = req.session.videoDelete; //mensaje de video eliminado exitosamente. ¡Listo para subir uno nuevo y sorprender a todos!
    const catchError = req.session.catcherro; // 'Ha ocurrido un error, intente en unos minutos';
    delete req.session.uploadPublication;
    delete req.session.updatePublication;
    delete req.session.deletePublication;
    delete req.session.biddingRemovalProhited;
    delete req.session.uploadFall;
    delete req.session.audioUploaded;
    delete req.session.audioNoUploaded;
    delete req.session.videoUploaded;
    delete req.session.videoNoUploaded;
    delete req.session.uploadVideoDone;
    delete req.session.videoDelete;
    delete req.session.catcherro;

    if (user){
        searchProfile = await modelProfile.find({indexed : user._id});
        Auctions = await modelAuction.find({ user_id : user._id });

        console.log("Esto es Auctions : ", Auctions);

        //:::: Este bloque es para conocer el estado de impagos del usuario ::::
        Contacts = await modelInvoice.find( {$and : [{indexed: user._id}, {payCommission : false}]} );
        //console.log('Esto es Contacts ---->', Contacts);
        BuySell = await modelBuySell.find( {$and : [{ usernameSell : user.username }, { confirmPay: 'Yes' }, {CommentSeller : {$ne : 'no_comment' }},{ payCommission : false} ] } );
        //console.log('Esto es BuySell ---->', BuySell);
    
        boxImpagos.push( ...Contacts, ...BuySell );
        //console.log("Esto es boxImpagos ::::::>", boxImpagos);
        countImpagos = boxImpagos.length;
    
        //console.log("Esto es la cantidad de impagos que posee el usuario --->", countImpagos);
        //::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        
        //console.log("Este es el id del ususario : ",user._id);
        //console.log("Data de los items publicados por el usuario :",Items);
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
                    const updateSpread = await modelAuction.findByIdAndUpdate(IDTitle, { $set: { "spread.spreading" :  false, "spread.time" : null } })
                }

                functionUpdateSapread()
                    .then(()=>{
                        Spreading === true;
                       
                    })
                    .catch((error)=>{
                        //console.log("Ha ocurrido un error, intente luego.", error);
                        res.redirect('/department/create/auctions');
                    })
                
            }
        } 
        
        res.render('page/depart-auction' , {user, searchProfile, Spreading, Time, countImpagos, Auctions, TitleSelect, Images, Video, uploadPublication, updatePublication, deletePublication, uploadFall, uploadVideo, uploadVideoFall, uploadVideoDone, videoDelete, catchError, countMessages, countNegotiationsBuySell, audioUploaded, audioNoUploaded, biddingRemovalProhited });

    } else {
        res.render('page/depart-auction' , {user, searchProfile, Spreading, Time, countImpagos, Auctions, TitleSelect, Images, Video, uploadPublication, updatePublication, deletePublication, uploadFall, uploadVideo, uploadVideoFall, uploadVideoDone, videoDelete, catchError, countMessages, countNegotiationsBuySell, audioUploaded, audioNoUploaded, biddingRemovalProhited });
    }
    
});

//este es la ruta del selector de la vista principal
routes.post('/department/create/auctions/selector', (req,res)=>{
    //console.log(req.body)
    const { titulo } = req.body;
    req.session.titleSelect = titulo;
    console.log("Titulo enviado a creates/auctions :",req.session.titleSelect);
    res.redirect('/department/create/auctions');
});

//esta es la ruta para crear un anuncio con try-catch
routes.post('/department/create/auctions', async(req,res)=>{
    const boxImg = [];
    let AuctionDate, AuctionDateClose;
    const user = req.session.user
    console.log(user.username)
    const username = user.username; //aqui tengo el username
    const department = 'auctions';   
    
        
    try{
        const searchProfile = await modelProfile.find({ indexed : user._id}) //aqui extraemos el documento del perfil de este usaurio
        console.log("Este es el perfil del usuario que desea subir una publicacion ---->", searchProfile)
        console.log("Aqui el estado --->",searchProfile[0].states)
        const state = searchProfile[0].states
        const { title, category, sub_category, state_use, tecnicalDescription, auctionDate, biddingTime, price } = req.body
        const currentYear = new Date().getFullYear();
        let anio; 

        const BiddingTime = parseInt(biddingTime);
        console.log("&&&&&&&& :::: Esto es auctionDate :::: %%%%%%", auctionDate);
        //auctionDate es la fecha y hora que coloca el anunciante para activar su subasta.
        console.log("El dato es de tipo : ", typeof auctionDate);

        let Dates = new Date(auctionDate);
    
        console.log(":::: Esto es Dates ::::", Dates);

        const dia = Dates.getDate();
        const mes = Dates.getMonth()+1;
        const Year = Dates.getFullYear();
        //si el anfitrion se equivoca y pone un año menor el sistema entiende que se ha equivocado y corrige colocando el año en curso.
         if (Year < currentYear){
            anio = currentYear;
         } else {
            anio = Year;
         }
        const hora = Dates.getHours();
        const minu = Dates.getMinutes(); 

        if (minu <= 9){
            AuctionDate = `${dia}-${mes}-${anio} ${hora}:0${minu}`
        } else {
            AuctionDate = `${dia}-${mes}-${anio} ${hora}:${minu}`
        }
        
        //AuctionDate = es la fecha y hora en la que se activa la subasta
        //AuctionDateClose = es la fecha y hora en la que se cierra la subasta. ((falta));
        
        console.log("Esto es AuctionDate --->", AuctionDate)

        // :::: requiero tener datos actuales de fecha y saber si estamos en el ultimo dia del mes
        let ultimoDia = new Date(Dates.getFullYear(), Dates.getMonth() + 1, 0);
        let DiaFinal = ultimoDia.getDate(); //aqui saco el ultimo dia de este mes.
        console.log(":::::*** ultimoDia ***:::::", ultimoDia);
        console.log(":::::*** DiaFinal ***:::::", DiaFinal);
        console.log("*****************************************")
        // ::::-----------------------------------------------------------------------------::::
        // :::: ahora sumo el BiddingTime para darle el valor al atributo auctionDateClose; ::::

        const closeHours = (hora + BiddingTime);
        console.log("···· Esto es hora :", hora);
        console.log("···· Esto es biddingTime :", BiddingTime);
        console.log("···· Esto es closeHours :", closeHours);
        //                   10  +    6    =   16
        //                   20  +    6    =   26
        if (closeHours > 23){            
            const rectificarHoraDia = (closeHours - 24);
            if (dia === DiaFinal){
                console.log("estamos en el dia final del mes, hay un problema se suma (1) al mes y se coloca el primer dia con el excedente de la hora");
                if (mes !== 12){ //cualquier mes que no sea el mes diciembre;
                    const newHour = rectificarHoraDia; 
                    const newMes = mes + 1;
                    if (minu <= 9){
                        AuctionDateClose = `1-${newMes}-${anio} ${newHour}:0${minu}` //perfecto 
                    } else {
                        AuctionDateClose = `1-${newMes}-${anio} ${newHour}:${minu}` //perfecto 
                    }
                      
                } else { //estamos en diciembre
                    const newHour = rectificarHoraDia; 
                    const newAnio = anio + 1;
                    if (minu <= 9){
                        AuctionDateClose = `1-1-${newAnio} ${newHour}:0${minu}` //perfecto
                    } else {
                        AuctionDateClose = `1-1-${newAnio} ${newHour}:${minu}` //perfecto
                    }
                } 

            } else {
                console.log("no estamos en el mismo dia del dia final, no hay problema solo se suma el dia porque la hora se ha corrido al dia siguiente");
                const newHour = rectificarHoraDia;
                const newDay = dia + 1;
                if (minu <= 9){
                    AuctionDateClose = `${newDay}-${mes}-${anio} ${newHour}:0${minu}`//perfecto
                } else {
                    AuctionDateClose = `${newDay}-${mes}-${anio} ${newHour}:${minu}`//perfecto
                }
            }
            //tengo que saber si estamos en el ultimo dia del mes.
            
        } else {
        
            if (minu <=9){
                AuctionDateClose = `${dia}-${mes}-${anio} ${closeHours}:0${minu}`
            } else {
                AuctionDateClose = `${dia}-${mes}-${anio} ${closeHours}:${minu}`
            }
            
        }
        

        let countFall = 0;
        let countSuccess = 0;
        let countImgAcept = 0;
        let uploadToS3;


        if (req.files.length !== 0) {
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
                        
                        uploadToS3 = async function (bucketName, folder, ident, pathField ){
                        
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

                                    async function deleteEleUpload(){
                                        //console.log("este es el path que tiene que ser eliminado:", element.path)
                                        fs.unlink(element.path)
                                    }
                                    
                                    deleteEleUpload();

                                        
                                }
                                
                            });
                                        

                        }

                        // invocamos la funcion uploadToS3 para subir las imaganes
                        uploadToS3(bucketName, folder, ident, pathField)
                            .then(() => {
                                console.log("Imagen subida al servidor digitalocean SPACES");
                            })
                            .catch((err) => {
                                console.log("Ha habido un error al subir las fotos:", err);
                            });                        


                    } else {
                        console.log("Archivos no subidos por ser muy pesados o no ser de tipo image")
                        await fs.unlink(element.path) // element es el archivo img y el .path tiene la direccion el metodo unlink del objet fs elimina el archivo de donde esta. 
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

                    const Auctions =  new modelAuction({ title, category, sub_category, state_use, tecnicalDescription, auctionDate : AuctionDate, biddingTime, auctionDateClose : AuctionDateClose, images : boxImg, price, user_id : user._id, username, state_province : state }) 
                    const AuctionsSave = await Auctions.save()
                    //console.log(AuctionsSave);
                    
                    req.session.uploadPublication = "¡Su publicación se ha subido exitosamente!"
                    res.redirect('/department/create/auctions'); //todo ha salido bien
                }
 

            } else {
                console.log("ha sobrepasado la cantidad de imagenes, puede subir un maximo de 3 imagenes");
                res.redirect('/department/create/auctions');
            }
        } else {
            req.session.uploadFall = "¡Su publicación no se pudo crear, requiere de al menos una (1) imagen!"
            res.redirect('/department/create/auctions');
        }
     
    } catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/auctions');
    }        

});

//ruta para eliminar un objeto "anuncio" con try-catch
routes.post('/department/create/auctions/delete', async(req, res)=>{
    let boxMedia = [];
    let countFall = 0;
    let countSuccess = 0;
    console.log("este es el id a deletear: ", req.body);
    const valor = req.body.titleToDelete
    console.log( "aqui en una variable", valor);

    try{
        if (valor !== 'no_data') {
            const resultBD = await modelAuction.findById(valor)
            console.log("Here this body for delete :", resultBD);
            if (resultBD.active !== true){

                const imagesToDelete = resultBD.images;
                const soundToDelete = resultBD.sound
                const videoToDelete = resultBD.video;
    
                //console.log("Here all array to the images :", imagesToDelete);
                //console.log("Here all array to the sound :", soundToDelete);
                //console.log("Here all array to the video :", videoToDelete);
    
                //abajo en este if else fusiono tres arreglos images, video y sound en boxMedia para usar solo un for.
                if ( videoToDelete.length !=0 && soundToDelete.length !=0 ){
                    boxMedia = [...imagesToDelete, ...videoToDelete, ...soundToDelete];
                    countMedia = boxMedia.length;
                } else if ( videoToDelete.length !=0 && soundToDelete.length ==0 ){
                    boxMedia = [...imagesToDelete, ...videoToDelete ];
                    countMedia = boxMedia.length;
                } else if ( videoToDelete.length ==0 && soundToDelete.length ==0 ){
                    boxMedia = [...imagesToDelete];
                    countMedia = boxMedia.length;
                }

                //console.log("Esto es boxMedia", boxMedia);
                //console.log("Esto es countMedia", countMedia);

                for (let i = 0; i < boxMedia.length; i++) {
                    const public_id = boxMedia[i].public_id;
                    
                    console.log("este es el public_id a eliminar : ", public_id);

                    async function deleteMedias(public_id){

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
                                console.log("Media eliminada con exito --->", data);
                            }
                        })  
                            
                    }

                    deleteMedias(public_id)
                        
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
                    const deletingDoc = await modelAuction.findByIdAndDelete(valor);
    
                    req.session.deletePublication = "Publicación eliminada"
                    res.redirect('/department/create/auctions')
                }            
    

            } else {
                req.session.biddingRemovalProhited = "NO es posible eliminar una Subasta Activa.";
            }

        } 
    
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos';
        res.redirect('/department/create/auctions');
    }   

});

//ruta para eliminar una (1) foto con try-catch
routes.get('/department/create/auctions/del/auctions/:id', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect 
    const { id } = req.params;
    const public_id = "auctions/"+id;
    //console.log("este es el publicId a eliminar  ------>", public_id)
    //const public_id => "auctions/1720566117383.jpg
    //encontrar la imagen en la DB
    try{
        const result = await modelAuction.findById(TitleSelect);
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
                                const resultBD = await modelAuction.updateOne({ _id: TitleSelect},{ $pull: {"images":{"public_id": element.public_id }}} )
                                console.log("Aqui el resultado esperado ---->",resultBD)
                            }
                        
                        }
                
                        

                    }

                    deleteDB()
                        .then(()=>{
                            res.redirect('/department/create/auctions');
                        })
                        .catch((err)=>{
                            console.log("Ha ocurrido un error, intente mas tarde.", err);
                            res.redirect('/department/create/auctions');
                        })

                }
            });  
    
            

        } else {
            res.redirect('/department/create/auctions');
            console.log("No puedes eliminar todas las fotos.");
        }
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/auctions');
    }

});
            
//ruta para agregar una (1) foto adelante con try-catch
routes.post('/department/create/auctions/add/first/auctions', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const department = 'auctions';
    const element = req.files[0];
    const boxImg = [];
    //console.log(TitleSelect);
    //console.log(element); //aqui tenemos la imagen que el usuario esta subiendo
    //console.log("estamos en el backend /department/create/auctions/add/first/auctions");

    try{
        const searchAuctions = await modelAuction.findById(TitleSelect);
        //console.log("Esto es searchAuctions.images.length ---->",searchAuctions.images.length )

        if (searchAuctions.images.length < 12){
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
                                                                            
                            const updateImg = await modelAuction.findByIdAndUpdate(TitleSelect, { $push :{images : { $each: [box], $position : 0} } });
                                                         
                        }
     
                        saveDB()
                            .then(()=>{
                                console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                                res.redirect('/department/create/auctions');
                            })
                            .catch((err)=>{
                                console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                res.redirect('/department/create/auctions');
                            })

                    }
                    
                }); 
                
                
            } else {
                console.log("Archivos no subidos por ser muy pesados o no ser de tipo image")
                res.redirect('/department/create/auctions');
            
            }
        } else {
            console.log("ya has superado el maximo permitido de subida de imagen.");
            res.redirect('/department/create/auctions');
        };
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/auctions');
    }    
       
});

//ruta para agregar una (1) foto atras con try-catch            
routes.post('/department/create/auctions/add/last/auctions', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const department = 'auctions';
    const element = req.files[0];
    const boxImg = [];
    //console.log(TitleSelect);
    //console.log(element); //aqui tenemos la imagen que el usuario esta subiendo
    //console.log("estamos en el backend /department/create/auctions/add/last/auctions");

    try{
        const searchAuctions = await modelAuction.findById(TitleSelect);

        if (searchAuctions.images.length < 12){
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

                            const updateImg = await modelAuction.findByIdAndUpdate(TitleSelect, { $push : {images : box } });
                                                                                                            
                        }

                                
                        saveDB()
                            .then(()=>{
                                console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                                res.redirect('/department/create/auctions'); 
                            })
                            .catch((err)=>{
                                console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                res.redirect('/department/create/auctions'); 
                            })

                    }
                    
                });
                       

            } else {
                console.log("Archivos no subidos por ser muy pesados o no ser de tipo image")
                res.redirect('/department/create/auctions');
            
            }
        } else {
            console.log("ya has superado el maximo permitido de subida de imagen.");
            res.redirect('/department/create/auctions');
        };
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/auctions');
    }    

});

//ruta para agregar (1) video con try-catch
routes.post('/department/create/auctions/add/video', async(req, res)=>{
    const boxVideo = [];
    const department = 'auctions';
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const element = req.files[0];
    //console.log("Esto es TitleSelect", TitleSelect);
    //console.log("::::::: **** Esto es video ----->", element);
    
    try{
        const search = await modelAuction.findById(TitleSelect);
    
        //console.log("search", search);
        if(search.video.length == 0){

            //50000000 bit = 50 MB para video. sufiente para asegurar 3 minutos de video.
            if (element.size <= 50000000  && element.mimetype.startsWith("video/")){

                //console.log("un video aqui aceptado----->", element)
            
                const folder = department;const ident = new Date().getTime();
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
                        res.redirect('/department/create/auctions');
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
                                
                            const updateDB = await modelAuction.findByIdAndUpdate(TitleSelect, { $push : {video : box } });
                            console.log("Esto es updateDB ---->",updateDB);
                            req.session.videoUploaded = "Video subido exitosamente."

                            res.redirect('/department/create/auctions');

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
                req.session.videoNoUploaded = "Video No subido por exceder su peso o no ser de tipo 'video'"
                res.redirect('/department/create/auctions');
            
            } 

        } else {
            //ya tiene un video no puede cargar mas videos.
            req.session.uploadVideoDone = '¡Ya su anuncio tiene un video cargado!';
            res.redirect('/department/create/auctions');
        }
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/auctions');
    }    
       
});

//ruta para eliminar un (1) video con try-catch          
routes.get('/department/create/auctions/del/video/auctions/:id', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect 
    const { id } = req.params;
    const public_id = "auctions/"+id; //folder: 'auctions'  debe haber una igualdad entre ambos valores. 
    //console.log("Eliminando un video");
    //console.log("este es el public_id a eliminar ------>", public_id);

    //encontrar la imagen en la DB
    try{
        const result = await modelAuction.findById(TitleSelect);
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
                            const resultBD = await modelAuction.updateOne({ _id: TitleSelect},{ $pull: {"video":{"public_id": element.public_id }}} )
                            console.log("Aqui el resultado esperado ---->",resultBD)
                        }

                    }
                }    

                deleteDB()
                    .then(()=>{
                        req.session.videoDelete = 'Video eliminado exitosamente.'; 
                        res.redirect('/department/create/auctions');
                    })
                    .catch((err)=>{
                        console.log("Ha habido un error, intente mas tarde.", err);
                    })
                

            }
        });
    

    } catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/auctions');
    }

});

//ruta para agregar un (1) audio con try-catch   
routes.post('/department/create/auctions/add/sound', async(req, res)=>{
    const boxSound = [];
    const department = 'auctions';
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const element = req.files[0];
    console.log("Esto es TitleSelect", TitleSelect);
    console.log("Esto es element", element);

    try{
        //10000000 bit = 10 MB para sonidos. sufiente para asegurar 4 minutos de explicacion breve
        if (element.size <= 10000000  && element.mimetype.startsWith("audio/")){

            console.log("un audio aqui aceptado----->", element)
          
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
                    console.error("Error al subir un audio", err);
                    req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
                    res.redirect('/department/create/auctions');
                } else {
                    console.log("Audio subido con exito", data);
    
                    //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.
                    let format = ext;
                    let url = `https://${bucketName}.${endpoint}/${key}`;
                    let bytes = element.size;
                    let public_id = key;
                    
                    console.log(`url : ${url} Public_Id : ${public_id} `)
                    boxSound.push( {url, public_id} );

                    const box = boxSound[0]; 
                    //console.log("Esto es box -------->", box);

                      
                    async function saveDB(){

                        //console.log("este es el path que tiene que ser eliminado:", element.path)
                        await fs.unlink(element.path) 
                            
                        const updateAuction = await modelAuction.findByIdAndUpdate(TitleSelect, { $push : {sound : box } });
                        console.log("Esto es updateAuction ---->",updateAuction);
                        req.session.audioUploaded = "Audio subido exitosamente."
            
                        res.redirect('/department/create/auctions');

                    }

                    saveDB()
                        .then(()=>{
                            console.log("Se ha guardado en la base de datos. Audio Subido y Guardado en la DB");
                        })
                        .catch((err)=>{
                            console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                        })


                }
            });
                    

        } else {
            console.log("Archivos no subidos por ser muy pesados o no ser de tipo sonido")
            //aqui falta que borre tambien los archivos en uppload
            await fs.unlink(element.path) // element es el archivo de sonido y el .path tiene la direccion el metodo unlink del objet fs elimina el archivo de donde esta. 
            req.session.audioNoUploaded = "Audio No subido por exceder su peso."
            res.redirect('/department/create/auctions');
        }
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/auctions');
    }

});

//ruta para eliminar un (1) audio con try-catch
routes.get('/department/create/auctions/del/sound/:id', async(req, res)=>{
    console.log("Estamos en la direccion /department/create/auctions/del/sound/:id");
    console.log("Aqui lo que se quiere es eliminar el sound de cloudinary y de la base de datos");
    const idAuction = req.params.id;

    try{
        const searchAuction = await modelAuction.findById(idAuction);
        console.log("Esto es searchAuctions ---->", searchAuction);
        const public_id = searchAuction.sound[0].public_id;
        console.log("Esto es public_id", public_id);
        
        //ya sabemos cual es del public_id ahora vamos a eliminarlo de cloudinary
        const resultDelete = await cloudinary.uploader.destroy(public_id);
        console.log("ya he eliminado la imagen de Cloudinary", resultDelete);

        //Ahora toca eliminar el atributo sound del la DB.
        const deletSound = await modelAuction.findByIdAndUpdate(idAuction, {sound : []});
        console.log("Ya he eliinado de la DB", deletSound);
        res.redirect('/department/create/auctions');
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/auctions');
    }    

});

routes.get('/department/create/auctions/searh-edit', async(req, res)=>{
    const user = req.session.user;
    const data = await modelAuction.find({user_id : user._id});
    res.json({data});
});
 
 routes.post('/department/create/auctions/edit', async(req, res)=>{
     let AuctionDate, AuctionDateClose;       
     const {titleToEdit, title, category, sub_category, state_use, tecnicalDescription, generalMessage, auctionDate, biddingTime, price} = req.body
     const result = await modelAuction.findById(titleToEdit)
     const BiddingTime = parseInt(biddingTime);
     const currentYear = new Date().getFullYear();
     let anio;
     let Dates = new Date(auctionDate);
  
     console.log("::::: Esto es Dates :::::", Dates);

     const dia = Dates.getDate();
     const mes = Dates.getMonth()+1;
     const Year = Dates.getFullYear();
    //si el anfitrion se equivoca y pone un año menor el sistema entiende que se ha equivocado y corrige colocando el año en curso.
     if (Year < currentYear){
        anio = currentYear;
     } else {
        anio = Year;
     }
     const hora = Dates.getHours();
     const minu = Dates.getMinutes(); 
    
     console.log("Esto es hora", hora);
     console.log("Esto es minu", minu);

     if (minu <= 9){
        AuctionDate = `${dia}-${mes}-${anio} ${hora}:0${minu}`
     } else {
        AuctionDate = `${dia}-${mes}-${anio} ${hora}:${minu}`
     }
        
    
     console.log("Esto es AuctionDate --->", AuctionDate)

     // :::: requiero tener datos actuales de fecha y saber si estamos en el ultimo dia del mes
     let ultimoDia = new Date(Dates.getFullYear(), Dates.getMonth() + 1, 0);
     let DiaFinal = ultimoDia.getDate(); //aqui saco el ultimo dia de este mes.
     console.log(":::::*** ultimoDia ***:::::", ultimoDia);
     console.log(":::::*** DiaFinal ***:::::", DiaFinal);
     console.log("*****************************************")
     // ::::-----------------------------------------------------------------------------::::
     // :::: ahora sumo el BiddingTime para darle el valor al atributo auctionDateClose; ::::
 
     const closeHours = (hora + BiddingTime);
     console.log("···· Esto es hora :", hora);
     console.log("···· Esto es biddingTime :", BiddingTime);
     console.log("···· Esto es closeHours :", closeHours);
     //                   10  +    6    =   16
     //                   20  +    6    =   26
    if (closeHours > 23){            
         const rectificarHoraDia = (closeHours - 24);
        if (dia === DiaFinal){
             console.log("estamos en el dia final del mes, hay un problema se suma (1) al mes y se coloca el primer dia con el excedente de la hora");
            if (mes !== 12){ //cualquier mes que no sea el mes diciembre;
                 const newHour = rectificarHoraDia; 
                 const newMes = mes + 1;
                 if (minu <= 9){
                    AuctionDateClose = `1-${newMes}-${anio} ${newHour}:0${minu}` //perfecto   
                 } else {
                    AuctionDateClose = `1-${newMes}-${anio} ${newHour}:${minu}` //perfecto   
                 }
                 
            } else { //estamos en diciembre
                 const newHour = rectificarHoraDia; 
                 const newAnio = anio + 1;
                 if (minu <= 9){
                    AuctionDateClose = `1-1-${newAnio} ${newHour}:0${minu}` //perfecto
                 } else {
                    AuctionDateClose = `1-1-${newAnio} ${newHour}:${minu}` //perfecto
                 }
                 
            } 
 
        } else {
             console.log("no estamos en el mismo dia del dia final, no hay problema solo se suma el dia porque la hora se ha corrido al dia siguiente");
             const newHour = rectificarHoraDia;
             const newDay = dia + 1;
             if (minu <= 9){
                AuctionDateClose = `${newDay}-${mes}-${anio} ${newHour}:0${minu}`//perfecto
             } else {
                AuctionDateClose = `${newDay}-${mes}-${anio} ${newHour}:${minu}`//perfecto
             }
            
         }
         //tengo que saber si estamos en el ultimo dia del mes.
         
    } else {
        
        if (minu <= 9){
            AuctionDateClose = `${dia}-${mes}-${anio} ${closeHours}:0${minu}`
        } else {
            AuctionDateClose = `${dia}-${mes}-${anio} ${closeHours}:${minu}`
        }
         
    }
 
         
     if (result) {
         const updates = await modelAuction.findByIdAndUpdate(titleToEdit, { title, category, sub_category, state_use, tecnicalDescription, generalMessage, auctionDate : AuctionDate, biddingTime, auctionDateClose : AuctionDateClose, price });
         req.session.updatePublication = "Su publicacion ha sido actualizado satisfactoriamente"
     } else {
         console.log("no existe nada")
     }
     res.redirect('/department/create/auctions');
});

routes.post('/department/create/auctions/edit-images', async(req, res)=>{
    const order = req.body.Order
    console.log(order)
    res.redirect('/department/create/auctions');
});
          

//Este es el scrip que ejecuta una accion cada minuto
cron.schedule('*/1 * * * *', async () => {
    console.log('************* Node-Cron **************');
    console.log('inicio de script automatico cada minuto');
    console.log('revisando las fechas de apertura y cierre de las subastas');
    const dtNow = new Date();
    let TNow; //significa Time Now el codigo de ahora en fecha

    const diaNow = dtNow.getDate();
    const mesNow = dtNow.getMonth() +1;
    const yearNow = dtNow.getFullYear();
    const horaNow = dtNow.getHours();
    const minuNow = dtNow.getMinutes();

    //este codigo es creado con la fecha y hora actual
    if (minuNow <= 9){
        TNow = `${diaNow}${mesNow}${yearNow}T${horaNow}:0${minuNow}`; //esto es un codigo creaado con fecha y hora
    } else {
        TNow = `${diaNow}${mesNow}${yearNow}T${horaNow}:${minuNow}`; //esto es un codigo creaado con fecha y hora
    } 
    
      
    const result = await modelAuction.find().count();
    console.log("La cantidad de Subastas es", result );
    
    const searchAuctions = await modelAuction.find();

    //console.log("Esto es searchAuctions ----->", searchAuctions);
    // si existe algo en la coleccion entonces vamos con el forEach()

    if (searchAuctions.length !== 0){

        searchAuctions.forEach((ele, i)=>{
            const n = (i + 1);
            const titleOfAuction = ele._id;
            const title = ele.title;
            const department = ele.department;
            const tecnicalDescription = ele.tecnicalDescription;
            const usernameSell = ele.username;
            const auctionDate = ele.auctionDate;
            const auctionDateClose = ele.auctionDateClose;
            const participants = ele.participants;
            const image = ele.images[0].url;
                                
            //console.log("title-->", title);
            //console.log("auctionDate-->", auctionDate);
            //console.log("auctionDateClose--->", auctionDateClose);

            const dtStart = auctionDate.split(" ");
            const dtClose = auctionDateClose.split(" ");
            
            const dtStartFecha = dtStart[0];
            const dtStartHora = dtStart[1];

            const dtCloseFecha = dtClose[0];
            const dtCloseHora = dtClose[1];
            
            const fechaStart = dtStartFecha.split("-");
            const horaStart = dtStartHora.split(":");

            let diaSt = fechaStart[0]; let mesSt = fechaStart[1]; let anioSt = fechaStart[2];
            let horaSt = horaStart[0]; let minuSt = horaStart[1];
            let TStart = `${diaSt}${mesSt}${anioSt}T${horaSt}:${minuSt}`;


            const fechaClose = dtCloseFecha.split("-");
            const horaClose = dtCloseHora.split(":");
            
            let diaCl = fechaClose[0]; let mesCl = fechaClose[1]; let anioCl = fechaClose[2];
            let horaCl = horaClose[0]; let minuCl = horaClose[1];
            let TClose = `${diaCl}${mesCl}${anioCl}T${horaCl}:${minuCl}`;
       
            console.log("------------  Subastas  ---------");
            console.log("Escucha de Incio de Subasta");
            console.log(":::: TNow === TStart ::::");
            console.log(`:::: ${TNow} === ${TStart} ::::`);
            console.log("_________________________________");
            
            // el objetivo es verificar la fecha actual con la fecha de inicio de la subasta que seria el codigo T actual con el con el codigo T de inicio.
            if ( TNow === TStart ){

                update();
    
                async function update(){
                    const updates = await modelAuction.findByIdAndUpdate(titleOfAuction, { active : true });
                }

            }
            
            //_______ condicion para el auctionDateClose _______
            //aqui al cerrar la subasta se procede a crear el buySell para tener todos los datos necesarios
            //si por alguna razon no se cerrara la susbasta, existira una herramienta administrativa que ejecutaria este proceso.
            
            console.log("Escucha de Cierre de Subasta");
            console.log(":::: TNow === TClose ::::");
            console.log(`:::: ${TNow} === ${TClose} ::::`);
            console.log("_________________________________");
            if (TNow === TClose){
                console.log("***** Iniciando Proceso de cierre de Subasta *****")
                console.log(":::: TNow === TClose :::: Cierre");
                console.log(`:::: ${TNow} === ${TClose} ::::`);
      
                //debo averiguar si existe en esta subasta participantes 
                if (participants.length !== 0){
                    console.log("Existen participantes entonces debo obtener el ultimo existente, que es el ganador de la subasta");
                    const participantWin = participants[participants.length - 1];
                    console.log("Este es el ganador de la susbasta :", participantWin);
                    const usernameBuy = participantWin.bidUser;
                    const bidAmount = participantWin.bidAmountF;
                    let emailSell, emailBuy, titleX;

                        // -- Inicio de bloques de funciones basadas en promesas que se 
                        // -- ejecutaran en orden de invocacion.

                    //Busqueda de correos del vendedor y del comprador    
                    async function searchEmails(){
                        console.log("Estamos en searchEmails()");
                        const emailSELL = await modelUser.find({username : usernameSell}, {_id:0, email: 1});
                        const emailBUY = await modelUser.find({username : usernameBuy}, {_id: 0, email: 1});

                        emailSell = emailSELL[0].email;
                        emailBuy = emailBUY[0].email;
                        console.log(`emailSell > ${emailSell}  emailBuy > ${emailBuy}`);
                        console.log("searchEmails(+)");
                    }

                    //Envia los datos necesarios para construir el nuevo documento en buySell
                    async function createBuySellAuction(){
                        console.log("Esto es funcion createBuysellAuction()");
                        const searchIndexed = await modelProfile.find( { username : usernameSell } );
                        const indexed = searchIndexed[0].indexed;

                        let valueCommission = 0;
                        const search = await modelAuction.findById(titleOfAuction);
                        //console.log("Este es el resultado de la busqueda de la coleccion Auction, aqui el objeto--->", search);
                            
                        const {title, tecnicalDescription, price} = search; //esto se llama destructurin todo en una misma linea.
                        titleX = title; //aqui lo que hago es darle el valor de la costante title a la variable titleX que esta afuera y que requiero para poder crear mi correo.
                        const image = search.images[0].url;
                        //console.log("image ---->", image);

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

                                        valueCommission = (bidAmount * 0.03);
                                        let commission = valueCommission.toFixed(2); 
                                        
                                        const BuySell = new modelBuySell({ usernameSell : usernameSell, indexed,  usernameBuy: usernameBuy, department : department, title : title, title_id: titleOfAuction, tecnicalDescription, image : dImage, price : bidAmount, commission : commission });
                                        const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
                                        //console.log('Aqui BuySell ---->', BuySell);
                                        console.log("createBuysellAuction(+)")

                                    }
                                    
                            })
                            .catch((err)=>{
                                console.log("ha habido un error en la compra de items", err);
                            })        

/*                         const resultUpload = await cloudinary.uploader.upload( image, {folder: 'firstImgBuySell'});
                        //console.log("Aqui resultUpload ----->", resultUpload);
                        const {public_id, url} = resultUpload; //aqui obtengo los datos de la nueva foto guardada por siempre;
                        const dImage = {public_id, url}; //aqui el objeto con los datos de la foto para ser agregado directamente dentro del array.
                        //ya con todos los datos necesarios se procede a guardarlo en la coleccion modelBuysell.
                                    
                        valueCommission = (bidAmount * 0.03);
                        let commission = valueCommission.toFixed(2); 
                        
                        const BuySell = new modelBuySell({ usernameSell : usernameSell, indexed,  usernameBuy: usernameBuy, department : department, title : title, title_id: titleOfAuction, tecnicalDescription, image : dImage, price : bidAmount, commission : commission });
                        const buySell = await BuySell.save(); //aqui guardo en la base de datos este documento en la coleccion modelBuysell
                        //console.log('Aqui BuySell ---->', BuySell);

                        console.log("createBuysellAuction(+)") */
                        
                    }

                    //Creacion y envio de correo a (vendedor)    
                    async function sendEmailSell(){
                   
                        const message = "Cierre de Subasta."
                        const contentHtml = `
                        <h2 style="color: black"> Felicidades su Subasta tiene al mejor Comprador. </h2>
                        <ul> 
                            <li> cuenta : ${emailSell} </li> 
                            <li> asunto : ${message} </li>
                        <ul>
                        <h2> Cierre de Subasta ${titleX}. </h2>
                        <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y vaya al apartado de negociación, donde le estará esperando su comprador. </p>
                        `

                        //enviar correo
                        //(SMTP)-> Simple Mail Transfer Protocol --> es el protocolo con que los servidores se comunican a traves de correos.
                        const emailMessage = {
                            from: "Blissenet<sistemve@blissenet.com>", //remitente
                            to: emailSell,
                            subject: "🎊 Cierre de Subasta - Blissenet", //objeto
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

                    //Creacion y envio de correo a (comprador)  
                    async function sendEmailBuy(){
                             
                        const message = "Cierre de Subasta."
                        const contentHtml = `
                        <h2 style="color: black"> Felicidades has sido ganador en una Subasta. </h2>
                        <ul> 
                            <li> cuenta : ${emailBuy} </li> 
                            <li> asunto : ${message} </li>
                        <ul>
                        <h2> Has comprado ${titleX} </h2>
                        <p> <b> Estimado usuario, </b> Entre a su cuenta en Blissenet.com y vaya al apartado de negociación, donde le estará esperando su vendedor y anfitrión. </p>
                        `

                        const emailMessage = {
                            from: "Blissenet<sistemve@blissenet.com>", //remitente
                            to: emailBuy,
                            subject: "🎊 Cierre de Subasta - Blissenet", //objeto
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

                    //Ya hemos creado la instancia de compra-venta ambas partes tienen ya su negociacion activa y lista para ser cerrada;
                    //El proceso que sigue es eliminar el documento de auction de la base de datos;
                    
                    async function deletAuction(){
                        console.log("Esto es funcion deletAuction()");
                        await modelAuction.findByIdAndDelete(titleOfAuction)
                        console.log("deletAuction(+)")
                    }


                    searchEmails()
                        .then(()=>{
                            createBuySellAuction()
                                .then(()=>{
                                    sendEmailSell()
                                        .then(()=>{
                                            sendEmailBuy()
                                                .then(()=>{
                                                    deletAuction()
                                                        .then(()=>{
                                                            console.log("Proceso de Cierre de Subasta OK");
                                                            console.log(`Subasta ${title} ha cerrado exitosamente`);
                                                        })
                                                        .catch((error)=>{
                                                            console.log("Ha habido un error deletAuction()", error);
                                                        })
                                                })
                                                .catch((error)=>{
                                                    console.log("Ha habido un error sendEmailBuy()", error);
                                                })

                                        })
                                        .catch((error)=>{
                                            console.log("Ha ocurrido un error sendEmailSell()", error);
                                        })

                                })
                                .catch((error)=>{
                                    console.log("Ha ocurrido un error createBuySellAuction()", error);
                                })

                        })
                        .catch((error)=>{
                            console.log("Ha habido un error searchEmails()", error);
                        })        
                    

                } else {
                    console.log("no hay participantes entonces, solo se procede a limpiar los atributos de fechas, active = false y se pasa a pausado = true")
                    
                   
                    async function desactivar(){
                        await modelAuction.findByIdAndUpdate(titleOfAuction, { paused : true, active : false, auctionDate : " ", auctionDateClose : " " });
                    }

                    desactivar()
                        .then(()=>{
                            console.log("NO hubo participastes por lo tanto se actualizo los datos de esta subasta para que pueda ser nuevamente progrmada por su anunciante");
                        })
                        .catch((error)=>{
                            console.log("Ha ocurrido un error, ¡ATENCIO ADMINISTRACION!", error);
                        })

    
                }
                      
            } 
            
             
        }); //find el forEach();
               
    }
    console.log("*     End Process CRONO-AUCTION      *");    
    console.log("**************************************");

      
});

module.exports = routes;

