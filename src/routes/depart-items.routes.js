const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelItems = require('../models/items.js');
const modelBuySell = require('../models/buySell.js');
const modelInvoice = require('../models/invoice.js');

const cloudinary = require('cloudinary').v2;
const fs = require('fs-extra');


cloudinary.config({
    cloud_name : process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret : process.env.API_SECRET,
    secure: true
})
            

routes.get('/department/create/items', async(req,res)=>{
    let countImpagos = 0;
    const boxImpagos = [];
    let searchProfile, Items, Contacts, BuySell;
    let Images = null;
    let Video;
    let Spreading, Time, restMilis;

    const user = req.session.user; // datos del usuario
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const titleSelect = req.session.titleSelect; //datos del titulo seleccionado
    const TitleSelect = await modelItems.findById(titleSelect)

    const uploadPublication = req.session.uploadPublication; //mensaje de subida de publicacion.
    const updatePublication = req.session.updatePublication; //mensaje de actualizacion de publicacion.
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
        searchProfile = await modelProfile.find({indexed : user._id});
        Items = await modelItems.find({ user_id : user._id });
        
        //:::: Este bloque es para conocer el estado de impagos del usuario ::::
        Contacts = await modelInvoice.find( {$and : [{indexed: user._id}, {payCommission : false}]} );
        //console.log('Esto es Contacts ---->', Contacts);
        BuySell = await modelBuySell.find( {$and : [{ usernameSell : user.username }, { confirmPay: 'Yes' }, {CommentSeller : {$ne : 'no_comment' }},{ payCommission : false} ] } );
        //console.log('Esto es BuySell ---->', BuySell);
    
        boxImpagos.push( ...Contacts, ...BuySell );
        console.log("Esto es boxImpagos ::::::>", boxImpagos);
        countImpagos = boxImpagos.length;
    
        console.log("Esto es la cantidad de impagos que posee el usuario --->", countImpagos);
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
                    const updateSpread = await modelItems.findByIdAndUpdate(IDTitle, { $set: { "spread.spreading" :  false, "spread.time" : null } })
                }
        
                functionUpdateSapread()
                    .then(()=>{
                        Spreading === true;
                       
                    })
                    .catch((error)=>{
                        //console.log("Ha ocurrido un error, intente luego.", error);
                        res.redirect('/department/create/items');
                    })
                
            }
        } 
        
        
        res.render('page/depart-items' , {user, searchProfile, Spreading, Time, countImpagos, Items, TitleSelect, Images, Video, uploadPublication, updatePublication, deletePublication, uploadFall, uploadVideo, uploadVideoFall, uploadVideoDone, videoDelete, catchError, countMessages, countNegotiationsBuySell});

    } else {
        res.render('page/depart-items' , {user, searchProfile, Spreading, Time, countImpagos, Items, TitleSelect, Images, Video, uploadPublication, updatePublication, deletePublication, uploadFall, uploadVideo, uploadVideoFall, uploadVideoDone, videoDelete, catchError, countMessages, countNegotiationsBuySell});
    }
    
});

//este es la ruta del selector de la vista principal
routes.post('/department/create/items/selector', (req,res)=>{
    //console.log(req.body)
    const { titulo } = req.body;
    req.session.titleSelect = titulo;
    console.log("Titulo enviado a creates/items :",req.session.titleSelect);
    res.redirect('/department/create/items');
});

//esta es la ruta para crear un anuncio con try-catch
routes.post('/department/create/items', async(req,res)=>{
    const boxImg = [];
    const user = req.session.user
    console.log(user.username)
    const username = user.username; //aqui tengo el username
     
    console.log("imagenes : ", req.files.length)
    console.log('________search of state__________')

    try{
        const searchProfile = await modelProfile.find({ indexed : user._id}) //aqui extraemos el documento del perfil de este usaurio
        console.log("Este es el perfil del usuario que desea subir una publicacion ---->", searchProfile)
        console.log("Aqui el estado --->",searchProfile[0].states)
        const state = searchProfile[0].states
        const { title, category, sub_category, state_use, tecnicalDescription, generalMessage, price } = req.body

        let countFall = 0;
        let countSuccess = 0;

   
        if (req.files.length !== 0) {
            if (req.files.length <= 3) {
                
                for (let i = 0; i < req.files.length; i++) {
                    const element = req.files[i];
                   
                    if (element.size <= 2000000  && element.mimetype.startsWith("image/")){
                        //console.log("una imagen aqui aceptada----->", element)
                        const result = await cloudinary.uploader.upload(element.path, {folder: 'items'});
                        //console.log(result);
                        const { url, public_id, bytes, format } = result
                        //console.log(`url : ${url} Public_Id : ${public_id} `)
                        boxImg.push( {url, public_id, bytes, format} );
                
                        //console.log("este es el path que tiene que ser eliminado:", element.path)
                        await fs.unlink(element.path) 
                        //console.log("Esta imagen se guardarà")
                        countSuccess ++;  
                    }
                   
                    else {
                       console.log("Archivos no subidos por ser muy pesados o no ser de tipo image");
                       await fs.unlink(element.path); // element es el archivo de img y el .path tiene la direccion el metodo unlink del objet fs elimina el archivo de donde esta. 
                       countFall ++;
                    }
                }

                if (countSuccess !== 0){

                    createItems()
                        .then(()=>{
                            req.session.uploadPublication = "¡Su publicación se ha subido exitosamente!"
                            res.redirect('/department/create/items'); //todo ha salido bien
                        })
                        .catch((error)=>{
                            req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
                            res.redirect('/department/create/items');
                        })

                } else {
                    req.session.uploadFall = "¡Su publicación no se pudo crear, requiere de al menos una (1) imagen!"
                    res.redirect('/department/create/items'); //no ha podido crear la publicacion.
                }

                async function createItems(){
                    const Items =  new modelItems({ title, category, sub_category, state_use, tecnicalDescription, generalMessage, images : boxImg, price, user_id : user._id, username, state_province : state }) 
                    const ItemsSave = await Items.save()
                    console.log("Nuevo anuncio de Items creado");
                    //console.log(ItemsSave);
                }
                

            } else {
                console.log("ha sobrepasado la cantidad de imagenes, puede subir un maximo de 3 imagenes");
                res.redirect('/department/create/items');
            }
        } else {
            req.session.uploadFall = "¡Su publicación no se pudo crear, requiere de al menos una (1) imagen!"
            res.redirect('/department/create/items'); //no ha podido crear la publicacion.
        }
    } catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/items');
    }
    
});

//ruta para eliminar un objeto "anuncio" con try-catch
routes.post('/department/create/items/delete', async(req, res)=>{
    
    console.log("este es el id a deletear: ", req.body);
    const valor = req.body.titleToDelete
    console.log( "aqui en una variable", valor);

    try{
        if (valor !== 'no_data') {
            const resultBD = await modelItems.findById(valor)
            console.log("Here this body for delete :", resultBD);
            const imagesToDelete = resultBD.images;
            console.log("Here all array to the images :", imagesToDelete);


            /* Aqui elimino las fotos de cloudinary */
            for (let i = 0; i < imagesToDelete.length; i++) {
                const element = imagesToDelete[i];
                console.log("este es el public_id a eliminar : ",element.public_id);
                const resultCludinary = await cloudinary.uploader.destroy(element.public_id)        
            }

            const deletingDoc = await modelItems.findByIdAndDelete(valor);
            req.session.deletePublication = "Publicación eliminada"
        } 
        res.redirect('/department/create/items');
    } catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/items');
    }
        
});

//ruta para eliminar una (1) foto con try-catch
routes.get('/department/create/items/del/items/:id', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect 
    const { id } = req.params;
    const publicIdToDelete = "items/"+id;
   
    console.log("este es el titulo que se desea modificar o ver - image", TitleSelect)

    try{
        //encontrar la imagen en la DB
        const result = await modelItems.findById(TitleSelect);
        console.log("este es el documento es cuestion ---->",result);
        console.log("Aqui el public_ id que se quiere eliminar ---->", publicIdToDelete)

        if (result.images.length > 1){
            const resultDelete = await cloudinary.uploader.destroy(publicIdToDelete);
            console.log("ya he eliminado la imagen de Cloudinary", resultDelete);

            const Images = result.images;
            for (let i = 0; i < Images.length; i++) {
             const element = Images[i];
             console.log("Aqui todos los public_id ----->", element.public_id)
             if (element.public_id == publicIdToDelete){
                const resultBD = await modelItems.updateOne({ _id: TitleSelect},{ $pull: {"images":{"public_id": element.public_id }}} )
                console.log("Aqui el resultado esperado ---->",resultBD)
                }
        
            }
  
            res.redirect('/department/create/items');

        } else {
            res.redirect('/department/create/items');
            console.log("No puedes eliminar todas las fotos.");
        }
    } catch (error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/items');
    }    

});

//ruta para agregar una (1) foto adelante con try-catch
routes.post('/department/create/items/add/first/items', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const element = req.files[0];
    const boxImg = [];
    console.log(TitleSelect);
    console.log(element); //aqui tenemos la imagen que el usuario esta subiendo
    console.log("estamos en el backend /department/create/artes/add/first/artes");

    try{
        const searchItems = await modelItems.findById(TitleSelect);
        //console.log("Esto es searchItems.images.length ---->",searchItems.images.length )
        if (searchItems.images.length < 10){
            if (element.size <= 2000000  && element.mimetype.startsWith("image/")){
                console.log("una imagen aqui aceptada----->", element)
                const result = await cloudinary.uploader.upload(element.path, {folder: 'items'});
                //console.log(result);
                const { url, public_id, bytes, format } = result
                //const sorting = i;
                console.log(`url : ${url} Public_Id : ${public_id} `)
                boxImg.push( {url, public_id, bytes, format} );
                //console.log("este es el path que tiene que ser eliminado:", element.path)
                await fs.unlink(element.path) 
                console.log("Esta imagen se guardará")
                //console.log("Esto es boxImg -------->", boxImg);
                const box = boxImg[0]; 
                console.log("Esto es box -------->", box);
                                                                
                const updateImg = await modelItems.findByIdAndUpdate(TitleSelect, { $push :{images : { $each: [box], $position : 0} } });
                console.log("Esto es updateImg ---->",updateImg);
                res.redirect('/department/create/items');
                
            } else {
                console.log("Archivos no subidos por ser muy pesados o no ser de tipo image")
                res.redirect('/department/create/items');
            
            }
        } else {
            console.log("ya has superado el maximo permitido de subida de imagen.");
            res.redirect('/department/create/items');
        };
    } catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/items');
    }     
       
});

//ruta para agregar una (1) foto atras con try-catch            
routes.post('/department/create/items/add/last/items', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const element = req.files[0];
    const boxImg = [];
    console.log(TitleSelect);
    console.log(element); //aqui tenemos la imagen que el usuario esta subiendo
    console.log("estamos en el backend /department/create/items/add/last/items");

    try{
        const searchItems = await modelItems.findById(TitleSelect);
        if (searchItems.images.length < 10){

            if (element.size <= 2000000  && element.mimetype.startsWith("image/")){
                console.log("una imagen aqui aceptada----->", element)
                const result = await cloudinary.uploader.upload(element.path, {folder: 'items'});
                //console.log(result);
                const { url, public_id, bytes, format } = result
                //const sorting = i;
                console.log(`url : ${url} Public_Id : ${public_id} `)
                boxImg.push( {url, public_id, bytes, format} );
                //console.log("este es el path que tiene que ser eliminado:", element.path)
                await fs.unlink(element.path) 
                console.log("Esta imagen se guardará")
                //console.log("Esto es boxImg -------->", boxImg);
                const box = boxImg[0]; 
                console.log("Esto es box -------->", box);
                                                                
                const updateImg = await modelItems.findByIdAndUpdate(TitleSelect, { $push : {images : box } });
                console.log("Esto es updateImg ---->",updateImg);
                res.redirect('/department/create/items');        

            } else {
                console.log("Archivos no subidos por ser muy pesados o no ser de tipo image")
                res.redirect('/department/create/items');
            
            }
        } else {
            console.log("ya has superado el maximo permitido de subida de imagen.");
            res.redirect('/department/create/items');
        };
    } catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/items');
    }    
    

});     

//ruta para agregar (1) video con try-catch
routes.post('/department/create/items/add/video', async(req, res)=>{
    const boxVideo = [];
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const element = req.files[0];
    console.log("Esto es TitleSelect", TitleSelect);
    console.log("::::::: **** Esto es video ----->", element);

    try{
        const search = await modelItems.findById(TitleSelect);
        
        //console.log("search", search);
        if(search.video.length == 0){

            //20000000 bit = 20 MB para video. sufiente para asegurar 2 minutos de video.
            if (element.size <= 20000000  && element.mimetype.startsWith("video/")){

                console.log("un video aqui aceptado----->", element);
            
                const result = await cloudinary.uploader.upload(element.path, {resource_type: 'video', folder: 'items'});
                console.log("esto es result", result);

                console.log("Todo salio chevere");
                console.log("Aqui la respuesta de cloudinary del sonido enviado ----->",result);
                const { url, public_id, bytes, format } = result
                console.log(`url : ${url} Public_Id : ${public_id} `)
                boxVideo.push( {url, public_id, bytes, format} );
                
                //console.log("este es el path que tiene que ser eliminado:", element.path)
                await fs.unlink(element.path) 
                console.log("Este video se guardará")
                console.log("Esto es boxVideo -------->", boxVideo);
                const box = boxVideo[0]; 
                console.log("Esto es box -------->", box);
                                                                        
                const updateItem = await modelItems.findByIdAndUpdate(TitleSelect, { $push : {video : box } });
                console.log("Esto es updateAuction ---->",updateItem);
                req.session.videoUploaded = "Video subido exitosamente."

                res.redirect('/department/create/items');        

            } else {
                console.log("Archivos no subidos por ser muy pesados o no ser de tipo video")
                //aqui falta que borre tambien los archivos en uppload
                await fs.unlink(element.path) // element es el archivo de sonido y el .path tiene la direccion el metodo unlink del objet fs elimina el archivo de donde esta. 
                req.session.videoNoUploaded = "Video No subido por exceder su peso, o no ser un archivo de tipo video"
                res.redirect('/department/create/items');
            
            } 

        } else {
            //ya tiene un video no puede cargar mas videos.
            req.session.uploadVideoDone = '¡Ya su anuncio tiene un video cargado!';
            res.redirect('/department/create/items');

        }

    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/items');
    }
       
 
});

//ruta para eliminar un (1) video con try-catch           
routes.get('/department/create/items/del/video/items/:id', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect 
    const { id } = req.params;
    const publicIdToDelete = "items/"+id; //folder: 'items'  debe haber una igualdad entre ambos valores. 
    console.log("Eliminando un video");
    console.log("este es el publicId a eliminar publicIdToDelete ------>", publicIdToDelete);

    //encontrar la imagen en la DB
    try{
        const result = await modelItems.findById(TitleSelect);
        console.log("este es el documento es cuestion ---->",result);
        console.log("Aqui el public_ id que se quiere eliminar ---->", publicIdToDelete);
    
        const resultDelete = await cloudinary.uploader.destroy(publicIdToDelete);
        console.log("ya he eliminado el video de Cloudinary", resultDelete);
    
        const Video = result.video;
            for (let i = 0; i < Video.length; i++) {
                const element = Video[i];
                console.log("Aqui todos los public_id ----->", element.public_id);
                if (element.public_id == publicIdToDelete){
                    const resultBD = await modelItems.updateOne({ _id: TitleSelect},{ $pull: {"video":{"public_id": element.public_id }}} );
                    console.log("Aqui el resultado esperado ---->",resultBD);
                }
            }
        req.session.videoDelete = 'Video eliminado exitosamente.'; 
      
        res.redirect('/department/create/items');
    } catch (error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/items');
    }

   

});

routes.get('/department/create/items/searh-edit', async(req, res)=>{
    const user = req.session.user;
    const data = await modelItems.find({user_id : user._id});
    res.json({data});
});
 
 routes.post('/department/create/items/edit', async(req, res)=>{
    
    
     const {titleToEdit, title, category, sub_category, state_use, tecnicalDescription, generalMessage, price} = req.body
     const result = await modelItems.findById(titleToEdit)
         
     if (result) {
         const updates = await modelItems.findByIdAndUpdate(titleToEdit, { title, category, sub_category, state_use, tecnicalDescription, generalMessage, price })
         req.session.updatePublication = "Su publicacion ha sido actualizado satisfactoriamente"
     } else {
         console.log("no existe nada")
     }
     res.redirect('/department/create/items');
});

routes.post('/department/create/items/edit-images', async(req, res)=>{
    const order = req.body.Order
    console.log(order)
    res.redirect('/department/create/items');
});


module.exports = routes;

