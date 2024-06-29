const { Router } = require('express');
const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelNautical = require('../models/nautical.js');
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



routes.get('/department/create/nautical', async(req,res)=>{
    let countImpagos = 0;
    const boxImpagos = [];
    let searchProfile, Nautical, Contacts, BuySell;
    let Images = null;
    let Video;
    let Spreading, Time, restMilis;
   
    const user = req.session.user; // datos del usuario
    const countMessages = req.session.countMessages //aqui obtengo la cantidad de mensajes;
    const countNegotiationsBuySell = req.session.countNegotiationsBuySell; //aqui obtengo la cantidad de negotiationsBuySell

    const titleSelect = req.session.titleSelect; //datos del titulo seleccionado
    const TitleSelect = await modelNautical.findById(titleSelect)
        
    const uploadPublication = req.session.uploadPublication; //mensaje de subida de publicacion.
    const updatePublication =  req.session.updatePublication; //mensaje de actualizacion de publicacion.
    const deletePublication = req.session.deletePublication; //mensaje de eliminacion de publicacion
    const uploadFall = req.session.uploadFall; //mensaje de que no se ha subida la publicacion por no contar con una imagen aceptada por el sistema.    const uploadVideo = req.session.videoUploaded; //mensaje de video subido exitosamente;
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
        Nautical = await modelNautical.find({ user_id : user._id });

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
        //console.log("Data de los nauticos creados por el usuario :",Nautical);
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
                    const updateSpread = await modelNautical.findByIdAndUpdate(IDTitle, { $set: { "spread.spreading" :  false, "spread.time" : null } })
                }

                functionUpdateSapread()
                    .then(()=>{
                        Spreading === true;
                       
                    })
                    .catch((error)=>{
                        //console.log("Ha ocurrido un error, intente luego.", error);
                        res.redirect('/department/create/nautical');
                    })
                
            }
        } 
        
        res.render('page/depart-nautical' , {user, searchProfile, Spreading, Time, countImpagos, Nautical, TitleSelect, Images, Video, uploadPublication, updatePublication, deletePublication, uploadFall, uploadVideo, uploadVideoFall, uploadVideoDone, videoDelete, catchError, countMessages, countNegotiationsBuySell });

    } else {
        res.render('page/depart-nautical' , {user, searchProfile, Spreading, Time, countImpagos, Nautical, TitleSelect, Images, Video, uploadPublication, updatePublication, deletePublication, uploadFall, uploadVideo, uploadVideoFall, uploadVideoDone, videoDelete, catchError, countMessages, countNegotiationsBuySell });
    }

    
});

//este es la ruta del selector de la vista principal
routes.post('/department/create/nautical/selector', (req,res)=>{
    //console.log(req.body)
    const { titulo } = req.body;
    req.session.titleSelect = titulo;
    //console.log(req.session.titleSelect);
    res.redirect('/department/create/nautical');
});

//esta ruta es para crear un anuncio con try-catch
routes.post('/department/create/nautical', async(req,res, next)=>{
    const boxImg = [];
    const user = req.session.user
    console.log(user.username)
    const username = user.username; //aqui tengo el username; 

    const department = 'nautical'; 
    const commission = 8; //esto es un precio tasado a dolares luego se convertira en la moneda de curso legal.  

    console.log("imagenes : ", req.files.length)
    console.log('________search of state__________')

    try{
        const searchProfile = await modelProfile.find({ indexed : user._id}) //aqui extraemos el documento del perfil de este usaurio
        console.log("Este es el perfil del usuario que desea subir una publicacion ---->", searchProfile)
        console.log("Aqui el estado --->",searchProfile[0].states)
        const state = searchProfile[0].states
        const { title, category, sub_category, construcDate, length, tecnicalDescription, generalMessage, price } = req.body
        //console.log("**********")
        //console.log(req.files)
        
        //let nume = req.files.upload.length
        //console.log("aqui el dato :", nume);

        let countFall = 0;
        let countSuccess = 0;

            if (req.files.length !== 0) {
                if (req.files.length <= 3) {
                    
                    for (let i = 0; i < req.files.length; i++) {
                        const element = req.files[i];
                    
                        if (element.size <= 2000000  && element.mimetype.startsWith("image/")){
                        
                            //console.log("elemento admitido :",  element)
                            const result = await cloudinary.uploader.upload(element.path, {folder: 'nautical'});
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

                        createNautical()
                            .then(()=>{
                                req.session.uploadPublication = "¡Su publicación se ha subido exitosamente!"
                                res.redirect('/department/create/nautical'); //todo ha salido bien
                            })
                            .catch((error)=>{
                                req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
                                res.redirect('/department/create/nautical');
                            })


                    } else {
                        req.session.uploadFall = "¡Su publicación no se pudo crear, requiere de al menos una (1) imagen!"
                        res.redirect('/department/create/nautical'); //no ha podido crear la publicacion.
                    }

                    async function createNautical(){

                        const Nautical =  new modelNautical({ title, category, sub_category, construcDate, length, tecnicalDescription, generalMessage, images : boxImg, price, user_id : user._id, username, state_province : state  }); 
                        const NauticalSave = await Nautical.save()
                        //console.log(NauticalSave);

                        const title_id = NauticalSave._id;

                        //ya ha sido creado y guardado todo lo referente al anuncio ahora procedemos a crear y guardar la invoice.
                        const Invoice = new modelInvoice({ usernameSell : username, indexed : user._id, department, title, title_id, price, commission });
                        const InvoiceSave = await Invoice.save();
                        console.log("Nuevo anuncio de Items creado");

                    }
                        
                } else {
                    console.log("ha sobrepasado la cantidad de imagenes, puede subir un maximo de 3 imagenes");
                    res.redirect('/department/create/nautical');
                }
                
            } else {
                req.session.uploadFall = "¡Su publicación no se pudo crear, requiere de al menos una (1) imagen!"
                res.redirect('/department/create/nautical'); //no ha podido crear la publicacion.
            }

    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/nautical');
    }        

})
    
//ruta para eliminar un objeto "anuncio" con try-catch
routes.post('/department/create/nautical/delete', async(req, res)=>{
    
    console.log("este es el id a deletear: ", req.body);
    const valor = req.body.titleToDelete
    console.log( "aqui en una variable", valor);

    try{
        if (valor !== 'no_data') {
            const resultBD = await modelNautical.findById(valor)
            console.log("Here this body for delete :", resultBD);
            const imagesToDelete = resultBD.images;
            console.log("Here all array to the images :", imagesToDelete);


            /* Aqui elimino las fotos de cloudinary */
            for (let i = 0; i < imagesToDelete.length; i++) {
                const element = imagesToDelete[i];
                console.log("este es el public_id a eliminar : ",element.public_id);
                const resultCludinary = await cloudinary.uploader.destroy(element.public_id)        
            }

            const deletingDoc = await modelNautical.findByIdAndDelete(valor);
            req.session.deletePublication = "Publicación eliminada"
        } 
        res.redirect('/department/create/nautical')
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/nautical');
    }

});

//ruta para eliminar una (1) foto con try-catch
routes.get('/department/create/nautical/del/nautical/:id', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect 
    const { id } = req.params;
    const publicIdToDelete = "nautical/"+id;
    console.log("este es el publicId a eliminar publicIdToDelete ------>", publicIdToDelete)
   
    try{
        //encontrar la imagen en la DB
        const result = await modelNautical.findById(TitleSelect);
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
                    const resultBD = await modelNautical.updateOne({ _id: TitleSelect},{ $pull: {"images":{"public_id": element.public_id }}} )
                    console.log("Aqui el resultado esperado ---->",resultBD)
                }
            
            }
    
            res.redirect('/department/create/nautical');

        } else {
            res.redirect('/department/create/nautical');
            console.log("No puedes eliminar todas las fotos.");
        }
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/nautical');
    }    
   
});

//ruta para agregar una (1) foto adelante con try-catch
routes.post('/department/create/nautical/add/first/nautical', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const element = req.files[0];
    const boxImg = [];
    console.log(TitleSelect);
    console.log(element); //aqui tenemos la imagen que el usuario esta subiendo
    console.log("estamos en el backend /department/create/nautical/add/first/nautical");

    try{
        const searchNauti = await modelNautical.findById(TitleSelect);
        //console.log("Esto es searchItems.images.length ---->",searchItems.images.length )
        if (searchNauti.images.length < 10){
            if (element.size <= 2000000  && element.mimetype.startsWith("image/")){
                console.log("una imagen aqui aceptada----->", element)
                const result = await cloudinary.uploader.upload(element.path, {folder: 'nautical'});
                //console.log(result);
                const { url, public_id, bytes, format } = result
                //console.log(`url : ${url} Public_Id : ${public_id} `)
                boxImg.push( {url, public_id, bytes, format} );

                //console.log("este es el path que tiene que ser eliminado:", element.path)
                await fs.unlink(element.path) 
                console.log("Esta imagen se guardará")
                //console.log("Esto es boxImg -------->", boxImg);
                const box = boxImg[0]; 
                console.log("Esto es box -------->", box);
                                                                
                const updateImg = await modelNautical.findByIdAndUpdate(TitleSelect, { $push :{images : { $each: [box], $position : 0} } });
                console.log("Esto es updateImg ---->",updateImg);
                res.redirect('/department/create/nautical');
                
            } else {
                console.log("Archivos no subidos por ser muy pesados o no ser de tipo image")
                res.redirect('/department/create/nautical');
            
            }
        } else {
            console.log("ya has superado el maximo permitido de subida de imagen.");
            res.redirect('/department/create/nautical');
        };
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/nautical');
    }    
       

});

//ruta para agregar una (1) foto atras con try-catch         
routes.post('/department/create/nautical/add/last/nautical', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const element = req.files[0];
    const boxImg = [];
    console.log(TitleSelect);
    console.log(element); //aqui tenemos la imagen que el usuario esta subiendo
    console.log("estamos en el backend /department/create/nautical/add/last/nautical");

    try{
        const searchNauti = await modelNautical.findById(TitleSelect);
        if (searchNauti.images.length < 10){

            if (element.size <= 2000000  && element.mimetype.startsWith("image/")){
                console.log("una imagen aqui aceptada----->", element)
                const result = await cloudinary.uploader.upload(element.path, {folder: 'nautical'});
                //console.log(result);
                const { url, public_id, bytes, format } = result
                //console.log(`url : ${url} Public_Id : ${public_id} `)
                boxImg.push( {url, public_id, bytes, format} );

                //console.log("este es el path que tiene que ser eliminado:", element.path)
                await fs.unlink(element.path) 
                console.log("Esta imagen se guardará")
                //console.log("Esto es boxImg -------->", boxImg);
                const box = boxImg[0]; 
                console.log("Esto es box -------->", box);
                                                                
                const updateImg = await modelNautical.findByIdAndUpdate(TitleSelect, { $push : {images : box } });
                console.log("Esto es updateImg ---->",updateImg);
                res.redirect('/department/create/nautical');        

            } else {
                console.log("Archivos no subidos por ser muy pesados o no ser de tipo image")
                res.redirect('/department/create/nautical');
            
            }
        } else {
            console.log("ya has superado el maximo permitido de subida de imagen.");
            res.redirect('/department/create/nautical');
        };
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/nautical');
    }     
    

});

//ruta para agregar (1) video con try-catch
routes.post('/department/create/nautical/add/video', async(req, res)=>{
    const boxVideo = [];
    const TitleSelect =  req.session.titleSelect; //aqui tenemos el id del articulo.
    const element = req.files[0];
    console.log("Esto es TitleSelect", TitleSelect);
    console.log("::::::: **** Esto es video ----->", element);

    try{
        const search = await modelNautical.findById(TitleSelect);
        
        //console.log("search", search);
        if(search.video.length == 0){

            //20000000 bit = 20 MB para video. sufiente para asegurar 1 minutos de video.
            if (element.size <= 20000000  && element.mimetype.startsWith("video/")){

                console.log("un video aqui aceptado----->", element);
            
                const result = await cloudinary.uploader.upload(element.path, {resource_type: 'video', folder: 'nautical'});
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
                                                                        
                const updateArte = await modelNautical.findByIdAndUpdate(TitleSelect, { $push : {video : box } });
                console.log("Esto es updateAuction ---->",updateArte);
                req.session.videoUploaded = "Video subido exitosamente."

                res.redirect('/department/create/nautical');        

            } else {
                console.log("Archivos no subidos por ser muy pesados o no ser de tipo video")
                //aqui falta que borre tambien los archivos en uppload
                await fs.unlink(element.path) // element es el archivo de sonido y el .path tiene la direccion el metodo unlink del objet fs elimina el archivo de donde esta. 
                req.session.videoNoUploaded = "Video No subido por exceder su peso."
                res.redirect('/department/create/nautical');
            
            } 

        } else {
            //ya tiene un video no puede cargar mas videos.
            req.session.uploadVideoDone = '¡Ya su anuncio tiene un video cargado!';
            res.redirect('/department/create/nautical');
        }
    }catch(error){
        req.session.catcherro = 'Ha ocurrido un error, intente en unos minutos.';
        res.redirect('/department/create/nautical');
    }     
       
 
});

//ruta para eliminar un (1) video con try-catch          
routes.get('/department/create/nautical/del/video/nautical/:id', async(req, res)=>{
    const TitleSelect =  req.session.titleSelect 
    const { id } = req.params;
    const publicIdToDelete = "nautical/"+id; //folder: 'nautical'  debe haber una igualdad entre ambos valores. 
    console.log("Eliminando un video");
    console.log("este es el publicId a eliminar publicIdToDelete ------>", publicIdToDelete);

    //encontrar la imagen en la DB
    try{

        const result = await modelNautical.findById(TitleSelect);
        console.log("este es el documento es cuestion ---->",result);
        console.log("Aqui el public_ id que se quiere eliminar ---->", publicIdToDelete);

        const resultDelete = await cloudinary.uploader.destroy(publicIdToDelete);
        console.log("ya he eliminado el video de Cloudinary", resultDelete);

        const Video = result.video;
        for (let i = 0; i < Video.length; i++) {
            const element = Video[i];
            console.log("Aqui todos los public_id ----->", element.public_id)
            if (element.public_id == publicIdToDelete){
                const resultBD = await modelNautical.updateOne({ _id: TitleSelect},{ $pull: {"video":{"public_id": element.public_id }}} )
                console.log("Aqui el resultado esperado ---->",resultBD)
            }
        }
        req.session.videoDelete = 'Video eliminado exitosamente.'; 
  
        res.redirect('/department/create/nautical');

    } catch (error){
        console.log('ha ocurrido un error, intentelo nuevamente en unos minutos', error);
        res.redirect('/department/create/nautical');
    }
    
   

});

routes.get('/department/create/nautical/searh-edit', async(req, res)=>{
   const user = req.session.user;
   const data = await modelNautical.find({user_id : user._id});
   res.json({data});
});

routes.post('/department/create/nautical/edit', async(req, res)=>{
   
   
    const {titleToEdit, title, category, sub_category, construcDate, length, tecnicalDescription, generalMessage, price} = req.body
    const result = await modelNautical.findById(titleToEdit)
        
    if (result) {
        const updates = await modelNautical.findByIdAndUpdate(titleToEdit, { title, category, sub_category, construcDate, length, tecnicalDescription, generalMessage, price });
        req.session.updatePublication = "Su publicacion ha sido actualizado satisfactoriamente"
    } else {
        console.log("no existe nada")
    }
    res.redirect('/department/create/nautical');
});

 routes.post('/department/create/nautical/edit-images', async(req, res)=>{
    const order = req.body.Order
    console.log(order)
    res.redirect('/department/create/nautical');
});


module.exports = routes