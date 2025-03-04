const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelAutomotive = require('../models/automotive.js');
const modelBuySell = require('../models/buySell.js');
const modelInvoice = require('../models/invoice.js');


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

//referenciado en la sección "requerir" en la parte superior de su archivo. Si está utilizando 'v2' en la
// declaración require, no vuelva a utilizar 'v2' al llamar a los métodos API. En su lugar, utilice
// 'cloudinary.api.usage(...)' sin volver a especificar 'v2'.

routes.get('/department/create/automotive', async(req,res)=>{
    let countImpagos = 0;
    const boxImpagos = [];
    let searchProfile, Automotive, Contacts, BuySell;
    let Images = null;
    let Video;
    let Spreading, Time, restMilis;
   
    const user = req.session.user; // datos del usuario
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const titleSelect = req.session.titleSelect; //datos del titulo seleccionado
    const TitleSelect = await modelAutomotive.findById(titleSelect)
    
    const uploadPublication = req.session.uploadPublication; //mensaje de subida de publicacion.
    const updatePublication =  req.session.updatePublication; //mensaje de actualizacion de publicacion.
    const deletePublication = req.session.deletePublication; //mensaje de eliminacion de publicacion
    const uploadFall = req.session.uploadFall; //mensaje de que no se ha subida la publicacion por no contar con una imagen aceptada por el sistema.
    const uploadVideo = req.session.videoUploaded; //mensaje de video subido exitosamente;
    const uploadVideoFall = req.session.videoNoUploaded; //mensaje de error no se ha subido por superar el peso establecido.
    const uploadVideoDone = req.session.uploadVideoDone; //mensaje de que ya existe un video cargado para este anuncio.
    const videoDelete = req.session.videoDelete; //mensaje de video eliminado exitosamente. ¡Listo para subir uno nuevo y sorprender a todos!
    const catchError = req.session.catcherro; // 'Ha ocurrido un error, intente en unos minutos';
    delete req.session.uploadPublication;
    delete req.session.updatePublication;
    delete req.session.deletePublication;
    delete req.session.uploadFall;
    delete req.session.videoUploaded;
    delete req.session.videoNoUploaded;
    delete req.session.uploadVideoDone;
    delete req.session.videoDelete;
    delete req.session.catcherro;
    
    if (user){
        //searchProfile = await modelProfile.find({indexed : user._id}); viejo
        searchProfile = await modelProfile.findOne({indexed : user._id});
        Automotive = await modelAutomotive.find({ user_id : user._id });
    
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
        //console.log("Data de los automotores creados por el usuario :",Automotive);
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
                    const updateSpread = await modelAutomotive.findByIdAndUpdate(IDTitle, { $set: { "spread.spreading" :  false, "spread.time" : null } })
                }

                functionUpdateSapread()
                    .then(()=>{
                        Spreading === true;
                       
                    })
                    .catch((error)=>{
                        //console.log("Ha ocurrido un error, intente luego.", error);
                        res.redirect('/department/create/automotive');
                    })
                
            }
        }
      
        res.render('page/depart-automotive' , {user, searchProfile, Spreading, Time, countImpagos, Automotive, TitleSelect, Images, Video, uploadPublication, updatePublication, deletePublication, uploadFall, uploadVideo, uploadVideoFall, uploadVideoDone, videoDelete, catchError, countMessages, countNegotiationsBuySell });
    
    } else {
        res.render('page/depart-automotive' , {user, searchProfile, Spreading, Time, countImpagos, Automotive, TitleSelect, Images, Video, uploadPublication, updatePublication, deletePublication, uploadFall, uploadVideo, uploadVideoFall, uploadVideoDone, videoDelete, catchError, countMessages, countNegotiationsBuySell });
    }  


    
});

//este es la ruta del selector de la vista principal
routes.post('/department/create/automotive/selector', (req,res)=>{
    //console.log(req.body)
    const { titulo } = req.body;
    req.session.titleSelect = titulo;
    //console.log(req.session.titleSelect);
    res.redirect('/department/create/automotive');
});

//esta es la ruta para crear un anuncio con try-catch
routes.post('/department/create/automotive', async(req,res, next)=>{
    
    try{
        const boxImg = [];
        const user = req.session.user
        console.log(user.username)
        const username = user.username; //aqui tengo el username;
        const department = 'automotive'; 
        const commission = 6; //esto es un precio tasado a dolares luego se convertira en la moneda de curso legal.  

        const searchProfile = await modelProfile.find({ indexed : user._id}) //aqui extraemos el documento del perfil de este usaurio
        console.log("Este es el perfil del usuario que desea subir una publicacion ---->", searchProfile)
        console.log("Aqui el estado --->",searchProfile[0].states)
        const state = searchProfile[0].states
        const { title, category, sub_category, model, construcDate, kilometros, tecnicalDescription, generalMessage, price, segment } = req.body
    

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

                    const Automotive =  new modelAutomotive({ title, titleURL, category, sub_category, model, construcDate, kilometros, tecnicalDescription, generalMessage, images : boxImg, price, user_id : user._id, username, state_province : state, segment  }); 
                    const AutomotiveSave = await Automotive.save()
                    //console.log(AutomotiveSave);

                    const title_id = AutomotiveSave._id;

                    //ya ha sido creado y guardado todo lo referente al anuncio ahora procedemos a crear y guardar la invoice.
                    const Invoice = new modelInvoice({ usernameSell : username, indexed : user._id, department, title, title_id, price, commission });
                    const InvoiceSave = await Invoice.save();
                    
                    req.session.uploadPublication = "¡Su publicación se ha subido exitosamente!"
                    res.redirect('/department/create/automotive'); //todo ha salido bien
                }
            
                
            } else {
                console.log("ha sobrepasado la cantidad de imagenes, puede subir un maximo de 3 imagenes");
                res.redirect('/department/create/automotive');
            }
        } else {
            req.session.uploadFall = "¡Su publicación no se pudo crear, requiere de al menos una (1) imagen!"
            res.redirect('/department/create/automotive');
        }
    
    } catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/automotive');
    }    
    

    
});

//ruta para eliminar un objeto "anuncio" con try-catch
routes.post('/department/create/automotive/delete', async(req, res)=>{

    try{
        let boxMedia = [];
        //let countFall = 0;
        //let countSuccess = 0;
        console.log("este es el id a deletear: ", req.body);
        const valor = req.body.titleToDelete
        console.log( "aqui en una variable", valor);


        if (valor !== 'no_data') {
            const resultBD = await modelAutomotive.findById(valor)
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
                
                console.log("este es el public_id a eliminar : ", public_id);

                deleteMedias(public_id)

                async function deleteMedias(public_id){

                    const params = {
                        Bucket : bucketName,
                        Key : public_id
                    }
                    s3.deleteObject(params, (err, data)=>{
                        if (err){
                            //countFall ++;
                            console.error("Error al eliminar el archivo --->", err);
                        } else {
                            //countSuccess ++;
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
                const deletingDoc = await modelAutomotive.findByIdAndDelete(valor);

                req.session.deletePublication = "Publicación eliminada"
                res.redirect('/department/create/automotive');
            } 


        } 
             
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/automotive');
    }
        

});

//ruta para eliminar una (1) foto con try-catch
routes.get('/department/create/automotive/del/automotive/:id', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect 
    const { id } = req.params;
    const public_id = "automotive/"+id;
    //console.log("este es el public_id a eliminar  ------>", public_id)
    //const public_id => "automotive/1720566117383.jpg    
    //encontrar la imagen en la DB
    try {     
        const result = await modelAutomotive.findById(TitleSelect);
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
                                const resultBD = await modelAutomotive.updateOne({ _id: TitleSelect},{ $pull: {"images":{"public_id": element.public_id }}} )
                                console.log("Aqui el resultado esperado ---->",resultBD)
                            }
                        
                        }
                
                        

                    }

                    deleteDB()
                        .then(()=>{
                            res.redirect('/department/create/automotive');
                        })
                        .catch((err)=>{
                            console.log("Ha ocurrido un error, intente mas tarde.", err);
                        })

                }
            });            

            
        } else {
            res.redirect('/department/create/automotive');
            console.log("No puedes eliminar todas las fotos.");
        }
   
    }catch (error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/automotive');
    }
        
    
});

//ruta para agregar una (1) foto adelante con try-catch
routes.post('/department/create/automotive/add/first/automotive', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const department = 'automotive';
    const element = req.files[0];
    const boxImg = [];
    //console.log(TitleSelect);
    //console.log(element); //aqui tenemos la imagen que el usuario esta subiendo
    //console.log("estamos en el backend /department/create/artes/add/first/artes");

    try{
        const searchAuto = await modelAutomotive.findById(TitleSelect);
        //console.log("Esto es searchItems.images.length ---->",searchItems.images.length )

        if (searchAuto.images.length < 12){
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
                                                                            
                            const updateImg = await modelAutomotive.findByIdAndUpdate(TitleSelect, { $push :{images : { $each: [box], $position : 0} } });
                                                         
                        }
     
                        saveDB()
                            .then(()=>{
                                console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                                res.redirect('/department/create/automotive');
                            })
                            .catch((err)=>{
                                console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                res.redirect('/department/create/automotive');
                            })

                    }
                    
                });
                            

            } else {
                console.log("Archivos no subidos por ser muy pesados o no ser de tipo image")
                res.redirect('/department/create/automotive');
            
            }
        } else {
            console.log("ya has superado el maximo permitido de subida de imagen.");
            res.redirect('/department/create/automotive');
        }

    } catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/automotive');
    }

});

//ruta para agregar una (1) foto atras con try-catch            
routes.post('/department/create/automotive/add/last/automotive', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const department = 'automotive';
    const element = req.files[0];
    const boxImg = [];
    //console.log(TitleSelect);
    //console.log(element); //aqui tenemos la imagen que el usuario esta subiendo
    //console.log("estamos en el backend /department/create/items/add/last/items");

    try{
        const searchAuto = await modelAutomotive.findById(TitleSelect);
   
        if (searchAuto.images.length < 12){
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

                            const updateImg = await modelAutomotive.findByIdAndUpdate(TitleSelect, { $push : {images : box } });
                                                                                                            
                        }

                                
                        saveDB()
                            .then(()=>{
                                console.log("Se ha guardado en la base de datos. Video Subido y Guardado en la DB");
                                res.redirect('/department/create/automotive');
                            })
                            .catch((err)=>{
                                console.log("Ha habido un error en el proceso de guardar en la Base de Datos");
                                res.redirect('/department/create/automotive');
                            })

                    }
                    
                });
                               

            } else {
                console.log("Archivos no subidos por ser muy pesados o no ser de tipo image")
                res.redirect('/department/create/automotive');
            
            }
        } else {
            console.log("ya has superado el maximo permitido de subida de imagen.");
            res.redirect('/department/create/automotive');
        };
    } catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/automotive');
    }    
    

});     

//ruta para agregar (1) video. con try-catch
routes.post('/department/create/automotive/add/video', async(req, res)=>{
    const boxVideo = [];
    const department = 'automotive';
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const element = req.files[0];
    //console.log("Esto es TitleSelect", TitleSelect);
    //console.log("::::::: **** Esto es video ----->", element);

    try{
        const search = await modelAutomotive.findById(TitleSelect);
    
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
                        res.redirect('/department/create/automotive');
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
                                
                            const updateDB = await modelAutomotive.findByIdAndUpdate(TitleSelect, { $push : {video : box } });
                            console.log("Esto es updateDB ---->",updateDB);
                            req.session.videoUploaded = "Video subido exitosamente."

                            res.redirect('/department/create/automotive');

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
                res.redirect('/department/create/automotive');
            
            } 

        } else {
            //ya tiene un video no puede cargar mas videos.
            req.session.uploadVideoDone = '¡Ya su anuncio tiene un video cargado!';
            res.redirect('/department/create/automotive');

        }
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/automotive');
    }    
        
});

//ruta para eliminar un (1) video con try-catch             
routes.get('/department/create/automotive/del/video/automotive/:id', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect 
    const { id } = req.params;
    const public_id = "automotive/"+id; //folder: 'automotive'  debe haber una igualdad entre ambos valores. 
    //console.log("Eliminando un video");
    //console.log("este es el public_id a eliminar ------>", public_id);

    //encontrar la imagen en la DB
    try{
        const result = await modelAutomotive.findById(TitleSelect);
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
                            const resultBD = await modelAutomotive.updateOne({ _id: TitleSelect},{ $pull: {"video":{"public_id": element.public_id }}} )
                            console.log("Aqui el resultado esperado ---->",resultBD)
                        }

                    }
                }    

                deleteDB()
                    .then(()=>{
                        req.session.videoDelete = 'Video eliminado exitosamente.'; 
                        res.redirect('/department/create/automotive');
                    })
                    .catch((err)=>{
                        console.log("Ha habido un error, intente mas tarde.", err);
                    })
                

            }
        });
    

    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/automotive');
    }

});

routes.get('/department/create/automotive/searh-edit', async(req, res)=>{
   const user = req.session.user;
   const data = await modelAutomotive.find({user_id : user._id});
   res.json({data});
})

routes.post('/department/create/automotive/edit', async(req, res)=>{
   
   
    const {titleToEdit, title, category, sub_category, model, construcDate, kilometros, tecnicalDescription, generalMessage, price} = req.body
    
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

    const result = await modelAutomotive.findById(titleToEdit)
        
    if (result) {
        const updates = await modelAutomotive.findByIdAndUpdate(titleToEdit, { title, titleURL, category, sub_category, model, construcDate, kilometros, tecnicalDescription, generalMessage, price });
        req.session.updatePublication = "Su publicacion ha sido actualizado satisfactoriamente"
    } else {
        console.log("no existe nada")
    }
    res.redirect('/department/create/automotive');
});

 routes.post('/department/create/automotive/edit-images', async(req, res)=>{
    const order = req.body.Order
    console.log(order)
    res.redirect('/department/create/automotive');
});


module.exports = routes