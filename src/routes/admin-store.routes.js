const { Router } = require('express');
const hash = require('object-hash');
const routes = Router()
const modelUser = require('../models/user.js');
const modelProfile = require('../models/profile.js');
const modelMessage = require('../models/messages.js');

const modelArtes = require('../models/artes.js');
const modelAirplane = require('../models/airplane.js');
const modelItems = require('../models/items.js');
const modelAutomotive = require('../models/automotive.js');
const modelRealstate = require('../models/realstate.js');
const modelNautical = require('../models/nautical.js');
const modelService = require('../models/services.js');
const modelAuction = require('../models/auction.js');
const modelRaffle = require('../models/raffle.js');

const modelShoppingCart = require('../models/shoppingCart.js');

const modelStoreRate = require('../models/storeRate.js');
const modelTransportAgent = require('../models/transportAgent.js');
const modelBankUser = require('../models/bankUser.js');

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

// admin-store ---------------------------------------------------------------------v
//iniciado el 23 de diciembre del 2024
routes.get('/admin-store', async(req, res)=>{

    try {
        
        console.log("*********admin-store******** -->");
        const user = req.session.user;
        console.log("este es el usuario propietario -->", user);
        //const countMessages = req.session.countMessages
        //console.log("esto es countMessages -->", countMessages);
        //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
        let searchProfile;
        let sumCount = 0;
        let countMessages;
    
        if (user){
            const userID = user._id;
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.findOne({ indexed : user._id });
            console.log("searchProfile -->", searchProfile);
            
            //hacemos la busqueda de posibles rifa.
            //aqui busco el id del sorteo. 
            const Raffle = await modelRaffle.findOne({ user_id : user._id });
            console.log("raffle ver --->", Raffle);
            //si tiene entonces lo incluyo en los objetos a enviar al front para anexarlo en el contenedor derecho alargado donde esta el Score y el trust 
    

            //aqui vamos a buscar en todas las colecciones para encontrar sus publicaciones y contarlas 
            const countAir = await modelAirplane.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAir; 
            const countArt = await modelArtes.find({ user_id : user._id  }).count();
            sumCount = sumCount + countArt; 
            const countIte = await modelItems.find({ user_id : user._id  }).count();
            sumCount = sumCount + countIte; 
            const countAut = await modelAutomotive.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAut; 
            const countRea = await modelRealstate.find({ user_id : user._id  }).count();
            sumCount = sumCount + countRea; 
            const countNau = await modelNautical.find({ user_id : user._id  }).count();
            sumCount = sumCount + countNau; 
            const countSer = await modelService.find({ user_id : user._id  }).count();
            sumCount = sumCount + countSer;
            const countAuc = await modelAuction.find({ user_id : user._id  }).count();
            sumCount = sumCount + countAuc;
            const countRaf = await modelRaffle.find({ user_id : user._id  }).count();
            sumCount = sumCount + countRaf;
                            
            searchMessages(userID, req) //---> nueva funcion;
               .then( Messages => 
                {
                    countMessages = Messages;
                    console.log('Esto es sumCount contamos los anuncios de este user-->', sumCount);
                    res.render('page/admin-store', { user, searchProfile, countMessages, countNegotiationsBuySell, Raffle, sumCount });
                }  
            ) 


        }   

        

    } catch (error) {
        console.log("Ha habido un error en la carga de admin-store", error);
    }

});



routes.get('/myaccount/segment', async (req, res)=>{
    try {
        
        console.log("*********admin-store******** -->");
        const user = req.session.user;
        console.log("este es el usuario propietario -->", user);
        const countMessages = req.session.countMessages
        console.log("esto es countMessages -->", countMessages);
        //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
        let searchProfile;
    
        if (user){
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.findOne({ indexed : user._id });
            console.log("searchProfile -->", searchProfile);

            res.render('page/segment', { user, searchProfile, countMessages, countNegotiationsBuySell });
        }   

        

    } catch (error) {
        console.log("Ha habido un error en la carga de myaccount/segment", error);
    }
});

routes.get('/myaccount/segment-extraer', async(req, res)=>{

    try {
        const user = req.session.user;    
        //console.log("llegando un post a /myaccount/segment-extraer");


        if (user){
                console.log("Esto es user._id ------>", user._id );
                searchProfile = await modelProfile.findOne({ indexed : user._id });
                //console.log("searchProfile -->", searchProfile);
                const segment = searchProfile.segment;
                console.log("Esto es segment -->", segment);
                res.json(segment)
        }        

    } catch (error) {
        console.log("Ha habido un error en get('myaccount/segment-extraer'), intente luego", error);
    }


});

routes.post('/myaccount/segment', async (req, res)=>{
    const user = req.session.user;    
    //console.log("llegando un post a /myaccount/segment");
    //console.log(req.body);
    let {boxSegment} = req.body;

    let docUpdate;
    console.log("Esto es boxSegment >>", boxSegment);

   if (user){
        //console.log("Esto es user._id ------>", user._id );
        searchProfile = await modelProfile.findOne({ indexed : user._id });
        //console.log("searchProfile para agregar segmentos a este perfil -->", searchProfile);
        const segments = searchProfile.segment; //esto es un array de segmentos del perfil del usuario
        const segmentsLength = segments.length;

        if (segmentsLength <= 13){
            //solo podrán tener 13 segmentos como maximo

            //primero vamos a rectificar que todos los elementos de este array esten formateados sin espacios en blancos
            boxSegment.forEach((ele, i) => {
                boxSegment[i] = ele.trim();
            });
            console.log("Esto es boxSegment ya limpio>>", boxSegment);
            //- **Antes:** `[ 'Seccion de Licores  ', '  farmacia ' ]` -> con esapcios MALO.
            //- **Después:** `[ 'Seccion de Licores', 'farmacia' ]` -> sin espacios BUENO.


            const promises = boxSegment.map(async (ele) => { // Asegúrate de que el callback sea async
                try {
                    docUpdate = await modelProfile.findOneAndUpdate(
                        { indexed: user._id }, // Filtro para encontrar el documento
                        { $addToSet: { 'segment': ele } }, // Añadir al array
                        { new: true } // Devuelve el documento actualizado
                    );
                    console.log('Segmentación añadida exitosamente para:', ele);
                } catch (error) {
                    console.error('Error al actualizar el documento:', error);
                }
            });

            // Espera a que todas las promesas se resuelvan
            Promise.all(promises)
            .then(() => {
                //console.log('Todas las segmentaciones han sido añadidas exitosamente.');
                const reqUpdate = docUpdate.segment
                //console.log("reqUpdate --->", reqUpdate);
                const notaAlert = "Segmento agregado satisfactoriamente.";
                const response = { reqUpdate: reqUpdate, nota : notaAlert, code : 1 };//code 1 => agregado
                res.json(response)
            })
            .catch((error) => {
                //console.error('Error en alguna de las actualizaciones:', error);
                const reqUpdate = segments;//vamos a requerir el actual
                const notaAlert = "Ha ocurrido un error, intente luego.";
                const response = { reqUpdate: reqUpdate, nota : notaAlert, code : -1 };//code -1 => error no agregado
                res.json(response)
            });

        } else {
            console.log("ha llegado al maximo de agregación de segmentos, usted ya posee ---->", segmentsLength)
            const reqUpdate = segments;//vamos a requerir el actual 
            const notaAlert = `Ha superado el limite maximo. Posee ${segmentsLength} segmentos.`;
            const response = { reqUpdate: reqUpdate, nota : notaAlert, code : 0 };//code 0 => supero el limite 
            res.json(response)
        }   

        //code 0 -> no agregado por superar el limite permitido 13 segmentos.
        //code 1 -> agregado al array segmentos.
        //code -1 -> error ocurrido.

        //nota importante
        // **Evitar Consultas Adicionales**:
        //- Si estableces `{ new: true }`, evitas tener que hacer una segunda consulta a la base de datos para obtener el documento actualizado después de la modificación. Esto puede mejorar la eficiencia de tu código y reducir la carga en la base de datos.
        
    } 


});
                          
routes.post('/myaccount/segment-edit', async (req, res)=>{
    const user = req.session.user;
    console.log("----------------edit----------------");    
    console.log("llegando un post a /myaccount/segment-edit");
    console.log("para editar un segmento un segmento");
    console.log(req.body);
    let { segment, newSegment } = req.body;
    let segmetToRemove = segment;
    let newSegmentClean = newSegment.trim(); //aqui me aseguro que no tiene espacios ni adelante ni al final
    let docUpdate;
    console.log(`segmetToRemove --> ${segmetToRemove} newSegmentClean --> ${newSegmentClean}`);

    if (user){
        console.log("Existe un user vamos bien");
        const Id_user = user._id;
        console.log("Id_user ----->", Id_user);

        //paso 1. revisar en todas las colecciones si existe un documento con este segmento.
        // si lo llega a encontrar actualizamos el documento en el campo segment lo pasamos a "All"
        async function searchAndUpdateCollections() {
            try {
                const updates = [
                    modelRaffle.updateMany({ user_id: Id_user, segment: segmetToRemove }, { $set: { segment: newSegmentClean }}),
                    modelAirplane.updateMany({ user_id: Id_user, segment: segmetToRemove }, { $set: { segment: newSegmentClean }}),
                    modelArtes.updateMany({ user_id: Id_user, segment: segmetToRemove }, { $set: { segment: newSegmentClean }}),
                    modelAuction.updateMany({ user_id: Id_user, segment: segmetToRemove }, { $set: { segment: newSegmentClean }}),
                    modelAutomotive.updateMany({ user_id: Id_user, segment: segmetToRemove }, { $set: { segment: newSegmentClean }}),
                    modelItems.updateMany({ user_id: Id_user, segment: segmetToRemove }, { $set: { segment: newSegmentClean }}),
                    modelNautical.updateMany({ user_id: Id_user, segment: segmetToRemove }, { $set: { segment: newSegmentClean }}),
                    modelRealstate.updateMany({ user_id: Id_user, segment: segmetToRemove }, { $set: { segment: newSegmentClean }}),
                ];
        
                await Promise.all(updates);
                // Aquí puedes ejecutar otra tarea cuando todas las actualizaciones se hayan completado.
            } catch (error) {
                console.error("Ocurrió un error al actualizar las colecciones en la function searchAndUpdateCollections()", error);
                // Aquí puedes agregar acciones específicas en caso de error.
            }
        }

        async function updateProfile(){
            try {
                await modelProfile.updateOne(
                    { indexed: Id_user },
                    { $pull: { segment: segmetToRemove } } // Elimina el elemento del array
                );
            
                // Luego, agrega el nuevo segmento
                await modelProfile.updateOne(
                    { indexed: Id_user },
                    { $push: { segment: newSegmentClean } } // Agrega el nuevo elemento al array
                );
          
            }
            catch(error){    
                console.error("Ocurrió un error al eliminar un elemento del array segment de la funcion updateProfile()", error);
            }
        }
        
        searchAndUpdateCollections()
            .then(() => {
                console.log("Hemos ejecutado la funcion searchAndUpdateCollections()")
                updateProfile()
                    .then(()=>{
                        console.log("Hemos ejecutado la funcion updateProfile()")
                        res.json({response : "Edición de segmento exitoso"})
                        //hemos terminado la mision enviar un json para notificar que todo se ha ejecutado satisfactoriamente 
                    })
                    .catch((error)=>{
                        console.log("Ha habido un error en updateProfile()")
                        res.json({response : "Ha ocurrido un error en la edición de un segmento"})
                    })
                
            })
            .catch((error) => {
                console.log("Ha habido un error en searchAndUpdateCollections()")
                res.json({response : "Ha ocurrido un error en la edición de un segmento"})
            });

        //paso 2. eliminar el segmento del profile (los segmentos existen es en el profile de los usuarios)
    }


    //1. **Ejecutar en paralelo**: Cuando pones todas tus consultas en un array y usas `Promise.all`,
    // todas las actualizaciones se ejecutan al mismo tiempo, en lugar de una tras otra. Esto puede mejorar significativamente el tiempo total
    // de ejecución, especialmente si tienes varias consultas a la base de datos.

    //2. **Esperar a que todas se completen**: `await` asegura que la ejecución de la función `searchAndUpdateCollections`
    // se detenga hasta que todas las promesas dentro de `Promise.all` se hayan resuelto (es decir, que todas las actualizaciones se hayan
    // completado). Si alguna de las promesas falla, `Promise.all` rechaza la promesa y lanza un error que puedes manejar en tu bloque `catch`.
});

routes.post('/myaccount/segment-delete', async (req, res)=>{
    const user = req.session.user;    
    console.log("llegando un post a /myaccount/segment-delete");
    console.log("para eliminar un segmento");
    console.log(req.body);
    const { segment } = req.body;
    let segmetToRemove = segment;
    let docUpdate;
    //console.log("Esto es boxSegment >>", boxSegment);

    if (user){
        console.log("Existe un user vamos bien");
        const Id_user = user._id;
        console.log("Id_user ----->", Id_user);

        //paso 1. revisar en todas las colecciones si existe un documento con este segmento.
        // si lo llega a encontrar actualizamos el documento en el campo segment lo pasamos a "All"
        async function searchAndUpdateCollections() {
            try {
                const updates = [
                    modelRaffle.updateMany({ user_id: Id_user, segment: segmetToRemove }, { segment: "All" }),
                    modelAirplane.updateMany({ user_id: Id_user, segment: segmetToRemove }, { segment: "All" }),
                    modelArtes.updateMany({ user_id: Id_user, segment: segmetToRemove }, { segment: "All" }),
                    modelAuction.updateMany({ user_id: Id_user, segment: segmetToRemove }, { segment: "All" }),
                    modelAutomotive.updateMany({ user_id: Id_user, segment: segmetToRemove }, { segment: "All" }),
                    modelItems.updateMany({ user_id: Id_user, segment: segmetToRemove }, { segment: "All" }),
                    modelNautical.updateMany({ user_id: Id_user, segment: segmetToRemove }, { segment: "All" }),
                    modelRealstate.updateMany({ user_id: Id_user, segment: segmetToRemove }, { segment: "All" }),
                ];
        
                await Promise.all(updates);
                // Aquí puedes ejecutar otra tarea cuando todas las actualizaciones se hayan completado.
            } catch (error) {
                console.error("Ocurrió un error al actualizar las colecciones en la function searchAndUpdateCollections()", error);
                // Aquí puedes agregar acciones específicas en caso de error.
            }
        }

        async function updateProfile(){
            try {
                const result = await modelProfile.updateOne(
                    { indexed: Id_user }, // Filtra el documento por su ID
                    { $pull: { segment: segmetToRemove } }) // Elimina el elemento del array
            }
            catch(error){
                console.error("Ocurrió un error al eliminar un elemento del array segment de la funcion updateProfile()", error);
            }
        }
        
        searchAndUpdateCollections()
            .then(() => {
                console.log("Hemos ejecutado la funcion searchAndUpdateCollections()")
                updateProfile()
                    .then(()=>{
                        console.log("Hemos ejecutado la funcion updateProfile()")
                        res.json({response : "Eliminación de segmento exitoso"})
                        //hemos terminado la mision enviar un json para notificar que todo se ha ejecutado satisfactoriamente 
                    })
                    .catch((error)=>{
                        console.log("Ha habido un error en updateProfile()")
                        res.json({response : "Ha ocurrido un error en la eliminación de un segmento"})
                    })
                
            })
            .catch((error) => {
                console.log("Ha habido un error en searchAndUpdateCollections()")
                res.json({response : "Ha ocurrido un error en la eliminación de un segmento"})
            });

        //paso 2. eliminar el segmento del profile (los segmentos existen es en el profile de los usuarios)
    }


    //1. **Ejecutar en paralelo**: Cuando pones todas tus consultas en un array y usas `Promise.all`,
    // todas las actualizaciones se ejecutan al mismo tiempo, en lugar de una tras otra. Esto puede mejorar significativamente el tiempo total
    // de ejecución, especialmente si tienes varias consultas a la base de datos.

    //2. **Esperar a que todas se completen**: `await` asegura que la ejecución de la función `searchAndUpdateCollections`
    // se detenga hasta que todas las promesas dentro de `Promise.all` se hayan resuelto (es decir, que todas las actualizaciones se hayan
    // completado). Si alguna de las promesas falla, `Promise.all` rechaza la promesa y lanza un error que puedes manejar en tu bloque `catch`.
});

routes.post('/myaccount/segment-editGroup', async (req, res)=>{
    console.log("--------------segment-editGroup--------------");
    console.log("Hemos llegado al myaccount/segment-editGroup");
    console.log(req.body);
    const {storeUserIndexed, segmentSelected} = req.body;
           
    searchGlobal = [
                                                
       searchAirplane = await modelAirplane.find({ user_id: storeUserIndexed, segment : segmentSelected}),
       searchArte = await modelArtes.find({ user_id: storeUserIndexed, segment : segmentSelected}),
       searchAuction = await modelAuction.find({ user_id: storeUserIndexed, segment : segmentSelected}),
       searchAutomotive = await modelAutomotive.find({ user_id: storeUserIndexed, segment : segmentSelected}),
       searchItems = await modelItems.find({ user_id: storeUserIndexed, segment : segmentSelected}),
       searchNautical = await modelNautical.find({ user_id: storeUserIndexed, segment : segmentSelected}),
       searchRaffle = await modelRaffle.find({ user_id: storeUserIndexed, segment : segmentSelected}),
       searchRealstate = await modelRealstate.find({ user_id: storeUserIndexed, segment : segmentSelected})

    ]

    Promise.all(searchGlobal)
    .then((results) => {
        // Aplanar el array de resultados
        const response = results.flat(); //flat() aplana un nivel de array
    
        console.log("searchGlobal --->", response);
        console.log('Todas las consultas han sido realizadas de forma simultanea');
        res.json({response});
      
    })
    .catch((error) => {
        console.error('Error en la consulta a la base de datos:', error);
    });

 

});

routes.post('/myaccount/segment-filter', async (req, res)=>{
    console.log("--------------segment-filter--------------");
    console.log("Hemos llegado al /myaccount/segment-filter");
    console.log(req.body);
    const { storeUserIndexed, segmentSelected, filter} = req.body;


    searchGlobal = [

       searchAirplane = await modelAirplane.find({ user_id: storeUserIndexed, segment: segmentSelected, title: { $regex: filter, $options: 'i' }}),
       searchArte = await modelArtes.find({ user_id: storeUserIndexed, segment : segmentSelected, title: { $regex: filter, $options: 'i' }}),
       searchAuction = await modelAuction.find({ user_id: storeUserIndexed, segment : segmentSelected, title: { $regex: filter, $options: 'i' }}),
       searchAutomotive = await modelAutomotive.find({ user_id: storeUserIndexed, segment : segmentSelected, title: { $regex: filter, $options: 'i' }}),
       searchItems = await modelItems.find({ user_id: storeUserIndexed, segment : segmentSelected, title: { $regex: filter, $options: 'i' }}),
       searchNautical = await modelNautical.find({ user_id: storeUserIndexed, segment : segmentSelected, title: { $regex: filter, $options: 'i' }}),
       searchRaffle = await modelRaffle.find({ user_id: storeUserIndexed, segment : segmentSelected, title: { $regex: filter, $options: 'i' }}),
       searchRealstate = await modelRealstate.find({ user_id: storeUserIndexed, segment : segmentSelected, title: { $regex: filter, $options: 'i' }}),

    ]

    Promise.all(searchGlobal)
    .then((results) => {
        // Aplanar el array de resultados
        const response = results.flat(); //flat() aplana un nivel de array
        console.log("searchGlobal --->", response);
        console.log('Todas las consultas han sido realizadas de forma simultanea');
        res.json({response});
      
    })
    .catch((error) => {
        console.error('Error en la consulta a la base de datos:', error);
    });


});

routes.post('/myaccount/segment-changeGroup', async (req, res)=>{
    console.log("------/myaccount/segment-changeGroup---------");
    console.log(req.body);
    const {storeUserId, selected1, selected2, boxCheckedADS } = req.body;
    let Id_user = storeUserId; let newSegment = selected2
    const search = await modelProfile.findById(storeUserId);
    const indexed = search.indexed;
    //console.log("user_id un dato que lo tienen todos los anuncios-->", Id_user);
    console.log("esta es la longitud de boxCheckedADS ----->", boxCheckedADS.length );
    console.log("boxCheckedADS -->", boxCheckedADS);
    //Uso de `forEach` con `async/await`**: El método `forEach` no espera a que las promesas se resuelvan dentro de su callback.
    //Esto puede llevar a que el bloque de código no funcione como esperas. En su lugar, podrías usar un bucle `for...of`, que sí respeta el flujo asíncrono:
    
    async function searchUpdateCollections() {   
        try{   
            for (const ele of boxCheckedADS) {
                const IdAds = ele;   

                
                const updates = [
                    modelRaffle.findByIdAndUpdate(IdAds, { $set: { segment: newSegment } }),
                    modelAirplane.findByIdAndUpdate(IdAds, { $set: { segment: newSegment } }),
                    modelArtes.findByIdAndUpdate(IdAds, { $set: { segment: newSegment } }),
                    modelAuction.findByIdAndUpdate(IdAds, { $set: { segment: newSegment } }),
                    modelAutomotive.findByIdAndUpdate(IdAds, { $set: { segment: newSegment } }),
                    modelItems.findByIdAndUpdate(IdAds, { $set: { segment: newSegment } }),
                    modelNautical.findByIdAndUpdate(IdAds, { $set: { segment: newSegment } }),
                    modelRealstate.findByIdAndUpdate(IdAds, { $set: { segment: newSegment } }),
                ];
           

                await Promise.all(updates);
            }
        } catch (error) {
            console.error("Error al actualizar los anuncios:", error);
            // Manejo adicional del error si es necesario
        }
    }
    
    searchUpdateCollections()
        .then(()=>{
            console.log("Actualización realizada exitosamente.")
            res.json({response : "Actualización realizada exitosamente.", code : 1});
        })
        .catch((err)=>{
            console.log("Ha habido un error en searchUpdateCollections()");
            res.json({response : "Ha ocurrido un error en la actualización ", code : 0});
        })

      
/*     {
        storeUserId: '66abd68eb6d7f5e26757ee01',
        selected1: 'Hoverboard',
        selected2: 'Viveres',
        boxCheckedADS: [ '676ff7b1db087c2495cb3e4f' ]
    }
 */    

    //user_id --->este es el campo uno el dato indexed de todos los anuncios 
    //ahora vamos hacer una busqueda simultanea de todos las colecciones de anuncios en simultaneo y actualiamos.


});

routes.get('/myaccount/transportAgent', async (req, res)=>{
    try {
        
        console.log("********* transportAgent ******** -->");
        const user = req.session.user;
        console.log("este es el usuario propietario -->", user);
        const countMessages = req.session.countMessages
        console.log("esto es countMessages -->", countMessages);
        //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
        let searchProfile;
    
        if (user){
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.findOne({ indexed : user._id });
            console.log("searchProfile -->", searchProfile);

            
            const transportAgent = await modelTransportAgent.findOne( { indexed : user._id, active : true} );
            console.log("transportAgent :", transportAgent );

            res.render('page/transportAgent', { user, searchProfile, transportAgent, countMessages, countNegotiationsBuySell });
        }   


    } catch (error) {
        console.log("Ha habido un error en la carga de transportAgent", error);
    }
    
});

routes.get('/myaccount/bankData', async (req, res)=>{
    try {
        
        console.log("********* bankData ******** -->");
        const user = req.session.user;
        console.log("este es el usuario propietario -->", user);
        const countMessages = req.session.countMessages
        console.log("esto es countMessages -->", countMessages);
        //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
        let searchProfile;
        let jsonPaymentSystem; 
    
        if (user){
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.findOne({ indexed : user._id });
            console.log("searchProfile -->", searchProfile);

            
            const bankData = await modelBankUser.findOne( { indexed : user._id } );
            console.log("bankData :", bankData );

            if (bankData){

                const paymentSystem = bankData.paymentSystem;
                const PaymentSystem = { "paymentSystem": paymentSystem };
                jsonPaymentSystem = JSON.stringify(PaymentSystem);

            } 

      
            res.render('page/bankData', { user, searchProfile, bankData, jsonPaymentSystem, countMessages, countNegotiationsBuySell });
        }   

 
    } catch (error) {
        console.log("Ha habido un error en la carga de Datos Bancarios", error);
    }
});

routes.post('/myaccount/bankData/addFirstMethod', async(req, res)=>{

    console.log(".......... /myaccount/bankData/addFirstMethod ............ ");
    console.log(req.body)
    const {iD, username, methodName, data1, data2, data3, data4} = req.body;
    const box = [data1, data2, data3, data4];
    const idMethod = new Date().getTime(); //aqui creamos el id del methodo de pago, importante para lugeo poder editarlo o eliminarlo
    const objectData = { methodName, idMethod };

    box.forEach((value, i) => {
        if (value !== "") {
            console.log(`valor: ${value} | i: ${i}`);
            objectData[`data${i + 1}`] = value;  // Asignar el valor a una nueva propiedad
        }
    });

   
    console.log("objectData :", objectData);

    const newDataBank = new modelBankUser({ indexed: iD, username, paymentSystem: [objectData] });
    const dataSave = await newDataBank.save()
            .then(()=>{
                const response = { code : "ok", message : "Datos guardados" };
                res.json(response)
            })
            .catch((err)=>{
                const response = { code : "error", message : "Ha ocurrido un error, intente mas tarde" };
                res.json(response)
            })
    

});

routes.post('/myaccount/bankData/addOtherMethod', async(req, res)=>{

    console.log(' ...................... /myaccount/bankData/addOtherMethod ............................ ');
    console.log(req.body);
    const {iD, username, methodName, data1, data2, data3, data4} = req.body;
    const box = [data1, data2, data3, data4];
    const idMethod = new Date().getTime(); //aqui creamos el id del methodo de pago, importante para lugeo poder editarlo o eliminarlo
    const objectData = { methodName, idMethod };

        box.forEach((value, i) => {
        if (value !== "") {
            console.log(`valor: ${value} | i: ${i}`);
            objectData[`data${i + 1}`] = value;  // Asignar el valor a una nueva propiedad
        }
    });

   
    console.log("objectData :", objectData);

    try {
        
        await modelBankUser.findOneAndUpdate({ indexed: iD }, { $push: { 'paymentSystem': objectData } });
        const response = { message: "Datos guardados" };
        // Aquí puedes hacer algo con la respuesta, como devolverla
        res.redirect('/myaccount/bankData');

   } catch (err) {

        const response = { message: "Ha ocurrido un error, intente más tarde" };
        // Maneja el error aquí, como registrar el error o enviarlo de vuelta
        res.redirect('/myaccount/bankData');

    }         

});

routes.post('/myaccount/bankData/deleteMethod', async (req, res)=>{

    console.log(' ...................... /myaccount/bankData/deleteMethod ............................ ');
    console.log(req.body);
    const { iD,  idMethod } = req.body;
    const iDMethod = parseInt(idMethod);
    console.log("iD :", iD);
    console.log("idMethod:", iDMethod);
    console.log("idMethod typeof:", typeof iDMethod);

    try {

        const deleteMethod = await modelBankUser.findOneAndUpdate({ indexed: iD }, { $pull: { paymentSystem: { idMethod: iDMethod } } }, {new : true});
        console.log("deleteMethod :", deleteMethod);
        const response = { message: "Metodo eliminado" };
        // Aquí puedes hacer algo con la respuesta, como devolverla
        setTimeout(() => {
            res.redirect('/myaccount/bankData');
        }, 2000);
        

    } catch (error) {

        const response = { message: "Ha ocurrido un error, intente más tarde" };
        // Maneja el error aquí, como registrar el error o enviarlo de vuelta
        setTimeout(() => {
            res.redirect('/myaccount/bankData');
        }, 2000);

    }

});

routes.post('/myaccount/bankData/editMethod', async(req, res)=>{
    console.log('........... /myaccount/bankData/editMethod ............');
    console.log(req.body);
    const { iD, idMethod, MethodName, Data1, Data2, Data3, Data4 } = req.body;
    const iDMethod = parseInt(idMethod);
    const methodName = MethodName.trim();
    const data1 = Data1.trim();
    const data2 = Data2.trim();
    const data3 = Data3.trim();
    const data4 = Data4.trim();

    const box = [data1, data2, data3, data4];
    const objectData = { iDMethod, methodName };

    box.forEach((value, i) => {
        if (value !== "") {
            console.log(`valor: ${value} | i: ${i}`);
            objectData[`data${i + 1}`] = value;  // Asignar el valor a una nueva propiedad
        }
    });

    console.log("iD :", iD); //este es mi id del user que es el dato que va con el indexed de esta coleccion, asi los conecto
    console.log("iDMethod :", iDMethod); //tengo mi idMethod en una constante se cual es el id del elemento 
    console.log("iDMethod typeof :",  typeof iDMethod); //tengo mi idMethod en una constante se cual es el id del elemento 
    console.log("objectData :", objectData); //ya tengo aqui mi objeto listo para ser incertado 
   
    try {
        //intento ubicar un elemento del array paymentSystem y tomo dicho elemento por uno de sus campos llamado idMethod y luego le asigno un nuevo elemento que ya habia construio previamente.
        
        const updateMethod = await modelBankUser.findOneAndUpdate( { indexed: iD, 'paymentSystem.idMethod': iDMethod }, 
                           { $set: { 'paymentSystem.$': objectData } }, { new: true });

        console.log("updateMethod :", updateMethod); //respuesta null
        const message =  "Metodo actualizado";
        // Aquí puedes hacer algo con la respuesta, como devolverla
        setTimeout(() => {
            res.redirect('/myaccount/bankData');
        }, 2000);
 
    } catch (error) {
        
        const message =  "Ha ocurrido un error, intente mas tarde.";

    }


});


routes.post('/myaccount/uploadDataTransport', async (req, res)=>{

    try{

        console.log('aqui llegamos /myaccount/uploadDataTransport')
        const department = "transportAgent" 
        let imgDelet = 0;
        //console.log("llegando al backend body---->", req.body);
        //console.log("llegando al backend files---->", req.files);

        const user = req.session.user;
        console.log("user : ", user._id);

        const checkAcept = req.body.CheckAcept;
        const selectMedio = req.body.SelectMedio;
        const descripMedio = req.body.DescripMedio;
        const selectColor = req.body.SelectColor;
        const placaMedio = req.body.PlacaMedio;
        const dataTransport = req.files[0];
        
        console.log("checkAcept :", checkAcept ); //true
        console.log("selectMedio :", selectMedio ); //moto
        console.log("descripMedio :", descripMedio ); //zusuki DT 1999
        console.log("selectColor :", selectColor ); //Amarilla
        console.log("placaMedio :", placaMedio ); //GTE234
        console.log("dataTransport :", dataTransport ); // todo el file 
        
        let descripMedioTrim = descripMedio.trim(); //primero quita lo sespacio y 
        let descripMedioCap = descripMedioTrim.charAt(0).toUpperCase() + descripMedioTrim.slice(1); //luego coloca la primera letra en mayuscula y quita lo sposibles espacios
        let placaMedioTrim = placaMedio.trim();
        const element = dataTransport

        let countImgAcept = 0;
        let countSuccess = 0;
        let countFall = 0;
        let boxImg = [];

        const searchData = await modelTransportAgent.findOne({ indexed : user._id});

        if (searchData){

            if (element.size <= 5000000  && element.mimetype.startsWith("image/")){
                                
                countImgAcept ++;
                console.log("countImgAcept ------------------------------------------------------> ", countImgAcept);

                console.log("-------------------Proceso de eliminacion de imagen--------------------------")
                console.log("este usuario ya tiene data creada", searchData);
                const transportationImage = searchData.transportation[0].image
                console.log("transportationImage", transportationImage);
                const public_id = transportationImage[0].public_id;
                console.log("public_id :", public_id);

                const params = {
                    Bucket : bucketName,
                    Key : public_id
                }

                console.log("params --->", params);
                
                s3.deleteObject(params, (err, data)=>{
                    if (err){
                        console.error("Error al eliminar el archivo", err);
                        imgDelet ++ // si no pudo eliminarlo debe seguir las operaciones
                        addImgToBucket()
                    } else {
                        console.log("Archivo eliminado con exito");
                        imgDelet ++ // si archivo eliminado seguir ahora con la subida de la nueva imagen
                        addImgToBucket()
                    }
                });

                console.log("-------------------Fin Proceso de eliminacion de imagen--------------------------")

                function addImgToBucket(){

                    console.log("hemos eliminado la imagen del bucked de Digital Ocean y ahora podemos vovler a subir una nueva imagen y actualizar todo de nuevo");

                    const folder = department; const ident = new Date().getTime(); //178409487478490 ms
                    const pathField = element.path; const extPart = pathField.split("."); //algo.png ["algo", "png"]
                    const ext = extPart[1];
                    
                    console.log("Bucket :", bucketName); console.log("folder :", folder);
                    console.log("patchField :", pathField); console.log("ext", ext);
        
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
        
                                let Data = { medio: selectMedio, descrip: descripMedioCap, color: selectColor, placa: placaMedioTrim, image: boxImg };
                
                                async function createData(){
                                    const transportUpdate =  await modelTransportAgent.updateOne({ indexed: user._id },{ $set: { 'transportation.0': Data } }); 
                                    console.log("transportUpdate --->", transportUpdate)

                                }

                                createData()
                                    .then(()=>{
                                        console.log("Se ha actualizado exitosamente")
                                        res.json( { "code" : "ok", "response" : "Se ha actualizado exitosamente"} );
                                    })
                                    .catch((err)=>{
                                        console.log("ha habido un error en createData()")
                                        res.json( { "code" : "error", "response" : "Ha habido un error, intente luego"} );
                                    })
                                    
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

                }

            } else {
                res.json({ "code" : "error", "response" : "¡Oops! El archivo que intentaste subir supera el tamaño máximo permitido de 5MB o no es del tipo de imagen. Por favor, verifica e intenta nuevamente."}) //un error de carga
            }      

        } else {

            if (element.size <= 5000000  && element.mimetype.startsWith("image/")){
                                
   
                const folder = department; const ident = new Date().getTime(); //178409487478490 ms
                const pathField = element.path; const extPart = pathField.split("."); //algo.png ["algo", "png"]
                const ext = extPart[1];
                
                console.log("Bucket :", bucketName); console.log("folder :", folder);
                console.log("patchField :", pathField); console.log("ext", ext);

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

                            let Data = [{ medio: selectMedio, descrip: descripMedioCap, color: selectColor, placa: placaMedioTrim, image: boxImg }];
            
                                            
                            if (boxImg.length !==0){
        
                                async function createData(){
                                                                                                
                                    const transport =  new modelTransportAgent({ indexed : user._id,  checkAcept : true,  transportation : Data }) 
                                    const transportSave = await transport.save();            
            
                                }  
        
                                createData()
                                    .then(()=>{
                                        console.log(".......... data creada satifastoriamente, ¡Felicidades! ");
                                        //req.session.uploadData = "¡Datos subidos exitosamente!"
                                        res.json({ "code" : "ok",  "response" : "Sus Datos han sido salvados exitosamente, por favor siga adelante con su registro."}) //todo ha salido bien
                                    })
                                    .catch(()=> console.log("Ha habido un error en createData(), intente luego"))
        
                            } else {
                                console.log("No tenemos ninguna imagen asi que debemos enviar un mensaje explicando el caso");
                                //req.session.uploadDataFall = "No se han podido cargar la imagane para este proceso. ¡Imagen max. 5.0 MB!"
                                res.json({ "code" : "error",  "response" : "Error no se ha cargado imagen"}) //un error de carga
                            }
        
                             
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
                res.json({ "code" : "error", "response" : "¡Oops! El archivo que intentaste subir supera el tamaño máximo permitido de 5MB o no es del tipo de imagen. Por favor, verifica e intenta nuevamente."}) //un error de carga
            }  

        }

  
    } catch (error) {
        res.json({ "code" : "error",  "response" : "Error, Ha habido un error intente más tarde."})
    }

});

routes.post('/myaccount/uploadDocuments', async (req, res)=>{

    try {
        
        console.log('aqui llegamos /myaccount/uploadDocuments')
        const department = "transportAgent";
        let boxImg = [];
      
        //console.log("llegando al backend files---->", req.files);
    
        const user = req.session.user;
        console.log("user : ", user._id);
    
        const Files = req.files; //esto es un array de los dos archivos que han subido;

        //const document = req.files[0];
        //const selfie = req.files[1];
        //console.log("document :", document );
        //console.log("selfie :", selfie );

        const searchData = await modelTransportAgent.findOne({ indexed : user._id});

        if (searchData){

            Files.forEach((element)=>{

                if (element.size <= 5000000  && element.mimetype.startsWith("image/")){
                                    
                    function addImgToBucket(){

                        const folder = department; const ident = new Date().getTime(); //178409487478490 ms
                        const pathField = element.path; const extPart = pathField.split("."); //algo.png ["algo", "png"]
                        const ext = extPart[1];
                        
                        console.log("Bucket :", bucketName); console.log("folder :", folder);
                        console.log("patchField :", pathField); console.log("ext", ext);
            
                        uploadToS3 = async function ( bucketName, folder, ident, pathField ){
                        
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
                                    res.json({ "code" : "error", "response" : "¡Oops! Ha habido un error, por favor intenta hacer esta operacion mas tarde"}) //un error de carga
                                } else {
                                    console.log('La imagen fue subida, Exito', data);
                                   
                                    //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                                    let format = ext;
                                    let url = `https://${bucketName}.${endpoint}/${key}`;
                                    let bytes = element.size;
                                    let public_id = key;
                                    
                                    console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id} `);
                                    boxImg.push({url, public_id, bytes, format});
                                    console.log("boxImg.length :", boxImg.length);
                                    console.log("typeof boxImg.length :", typeof boxImg.length);
                            
                                    if (boxImg.length == 2){
                                        //Ya tenemos dos elementos en el array boxImg procedemos a ejecutar la funcion createData();
                                        console.log("Ya boxImg tiene dos elementos, activamos la funcion createData .............")

                                        async function createData(){

                                            //primero se actualiza el perfil.
                                            const updateProfile = await modelProfile.findOneAndUpdate({ indexed : user._id }, { $set: { 'transportAgent.deliveryTransport' : true, 'transportAgent.active' : true }}, {new: true} );

                                            //luego se termina de actualizar el documento del modelTransportAgent
                                            const transportUpdate = await modelTransportAgent.updateOne(
                                                { indexed: user._id }, // Filtra por el usuario
                                                { 
                                                    $push: { 'docImages.images': { $each: boxImg } }, // Agrega las imágenes
                                                    $set: { active: true } // Cambia active a true
                                                }
                                            );
                                            console.log("transportUpdate --->", transportUpdate);
                                        
                                        }

                                        createData()
                                            .then(()=>{
                                                console.log("Se ha actualizado exitosamente")
                                                res.json( { "code" : "ok", "response" : "Se ha actualizado exitosamente"} );
                                            })
                                            .catch((err)=>{
                                                console.log("ha habido un error en createData()")
                                                res.json( { "code" : "error", "response" : "Ha habido un error, intente luego"} );
                                            })

                                    } 

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

                    }

                    addImgToBucket()

                } else {
                    res.json({ "code" : "error", "response" : "¡Oops! El archivo que intentaste subir supera el tamaño máximo permitido de 5MB o no es del tipo de imagen. Por favor, verifica e intenta nuevamente."}) //un error de carga
                }  

            })  

        }      

    } catch (error) {

        res.json({ "code" : "error", "response" : ""}) //un error de carga
    }


});

routes.post('/myaccount/uploadDataTransportEdit', async (req, res)=>{
    console.log('Hemos llegado a : /myaccount/uploadDataTransportEdit')
    console.log("body :", req.body);
    console.log("files :", req.files);
    const department = "transportAgent";
    const { SelectMedio, DescripMedio, SelectColor, PlacaMedio } = req.body;
    let descripMedioTrim = DescripMedio.trim(); //primero quita lo sespacio y 
    let descripMedioCap = descripMedioTrim.charAt(0).toUpperCase() + descripMedioTrim.slice(1); //luego coloca la primera letra en mayuscula y quita lo sposibles espacios
    let placaMedio = PlacaMedio.trim();

    console.log('descripMedioCap :', descripMedioCap);
    console.log('placaMedio :', placaMedio);

    const Files = req.files; //esto es un array donde esta la imagen 
    console.log('Files :', Files);
    const element = Files[0]; // esto es el objeto propiamente de la imagen 
    //console.log('element :', element);
    let boxImg = [];

    const user = req.session.user;
    console.log("user : ", user._id);

    const searchData = await modelTransportAgent.findOne({ indexed : user._id});

    if (searchData){

        if(Files.length !==0){

            if (element.size <= 5000000 && element.mimetype.startsWith("image/")){
                                
                console.log("imagen aceptada ------------------------------------------------------>");
                console.log("-------------------Proceso de eliminacion de imagen------------------->");

                const transportationImage = searchData.transportation[0].image
                console.log("transportationImage", transportationImage);
                const public_id = transportationImage[0].public_id;
                console.log("public_id :", public_id);

                const params = {
                    Bucket : bucketName,
                    Key : public_id
                }

                console.log("params --->", params);
                
                s3.deleteObject(params, (err, data)=>{
                    if (err){
                        console.error("Error al eliminar el archivo", err);
                        addImgToBucket()
                    } else {
                        console.log("Archivo eliminado con exito");
                        addImgToBucket()
                    }
                });

                console.log("-------------------Fin Proceso de eliminacion de imagen--------------------------")

                function addImgToBucket(){

                    console.log("hemos eliminado la imagen del bucked de Digital Ocean y ahora podemos vovler a subir una nueva imagen y actualizar todo de nuevo");

                    const folder = department; const ident = new Date().getTime(); //178409487478490 ms
                    const pathField = element.path; const extPart = pathField.split("."); //algo.png ["algo", "png"]
                    const ext = extPart[1];
                    
                    console.log("Bucket :", bucketName); console.log("folder :", folder);
                    console.log("patchField :", pathField); console.log("ext", ext);
        
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
                        
                            } else {
                                console.log('La imagen fue subida, Exito', data);
                                
                                //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                                let format = ext;
                                let url = `https://${bucketName}.${endpoint}/${key}`;
                                let bytes = element.size;
                                let public_id = key;
                                
                                console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id} `);
                                boxImg.push( {url, public_id, bytes, format} );
                                
                                let Data = { medio: SelectMedio, descrip: descripMedioCap, color: SelectColor, placa: placaMedio, image: boxImg };
                               
                                async function updateData(){
                                    const transportUpdate =  await modelTransportAgent.updateOne({ indexed: user._id },{ $set: { 'transportation.0': Data } }); 
                                    console.log("transportUpdate --->", transportUpdate)

                                }

                                updateData()
                                    .then(()=>{
                                        console.log("Se ha actualizado exitosamente")
                                        res.json( { "code" : "ok", "response" : "Actualización exitosa."} );
                                    })
                                    .catch((err)=>{
                                        console.log("ha habido un error en updateData()")
                                        res.json( { "code" : "error", "response" : "Ha habido un error, intente luego."} );
                                    })
                                    
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

                }

            } else {
                //console.log("Esta condicion no deberia de aplicar ya que esta restringida desde el fronted");
                res.json({ "code" : "problem", "response" : "El archivo que intentaste subir supera el tamaño máximo permitido de 5MB o no es del tipo de imagen. Por favor, verifica e intenta nuevamente."})
            } 

        } else {

            console.log("Este es una actualizacion sin imagen.");

             async function updateData(){
                const transportUpdate =  await modelTransportAgent.updateOne({ indexed: user._id },{ $set: 
                                                                { 'transportation.0.medio': SelectMedio, 
                                                                  'transportation.0.descrip': descripMedioCap,
                                                                  'transportation.0.color': SelectColor,
                                                                  'transportation.0.placa': placaMedio
                                                                 } });

            //'transportation es un array que tiene un objeto y de esta forma podemos acceder y cambiar su valor
            //notacion de punto 'transportation.indice.campo': valorDeCampo,

                console.log("transportUpdate --->", transportUpdate)

            }

            updateData()
                .then(()=>{
                    console.log("Se ha actualizado exitosamente")
                    res.json( { "code" : "ok", "response" : "Actualización exitosa."} );
                })
                .catch((err)=>{
                    console.log("ha habido un error en updateData()")
                    res.json( { "code" : "error", "response" : "Ha habido un error, intente luego."} );
                })
               

        }   
        
    }      

});

routes.post('/myaccount/uploadDocumentEdit', async(req, res)=>{

    try {
        
        console.log('aqui llegamos /myaccount/uploadDocumentEdit')
        const department = "transportAgent";
              
        //console.log("llegando al backend files---->", req.files);
    
        const user = req.session.user;
        console.log("user : ", user._id);
    
        const Files = req.files; //esto es un array con un archivo donde esta el selfie;

        const element = req.files[0];
        console.log("element :", element );

        const searchData = await modelTransportAgent.findOne({ indexed : user._id});

        if (searchData){

            if (element.size <= 5000000  && element.mimetype.startsWith("image/")){

                console.log("imagen aceptada ------------------------------------------------------>");
                console.log("-------------------Proceso de eliminacion de imagen------------------->");

                const docImage = searchData.docImages.images[0]
                console.log("docImage", docImage);
                const public_id = docImage.public_id;
                console.log("public_id :", public_id);

                const params = {
                    Bucket : bucketName,
                    Key : public_id
                }

                console.log("params --->", params);
                
                s3.deleteObject(params, (err, data)=>{
                    if (err){
                        console.error("Error al eliminar el archivo", err);
                        addImgToBucket()
                    } else {
                        console.log("Archivo eliminado con exito");
                        addImgToBucket()
                    }
                });

                console.log("-------------------Fin Proceso de eliminacion de imagen--------------------------")

                function addImgToBucket(){

                    console.log("hemos eliminado la imagen del bucked de Digital Ocean y ahora podemos vovler a subir una nueva imagen y actualizar todo de nuevo");

                    const folder = department; const ident = new Date().getTime(); //178409487478490 ms
                    const pathField = element.path; const extPart = pathField.split("."); //algo.png ["algo", "png"]
                    const ext = extPart[1];
                    
                    console.log("Bucket :", bucketName); console.log("folder :", folder);
                    console.log("patchField :", pathField); console.log("ext", ext);
        
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
                        
                            } else {
                                console.log('La imagen fue subida, Exito', data);
                                
                                //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                                let format = ext;
                                let url = `https://${bucketName}.${endpoint}/${key}`;
                                let bytes = element.size;
                                let public_id = key;
                                
                                console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id} `);
                                const Data = {url, public_id, bytes, format};
        
                                                
                                async function updateData(){
                                    const documenttUpdate =  await modelTransportAgent.updateOne({ indexed: user._id },{ $set: { 'docImages.images.0': Data } }); 
                                    console.log("documenttUpdate --->", documenttUpdate);

                                }

                                updateData()
                                    .then(()=>{
                                        console.log("Se ha actualizado exitosamente")
                                        res.json( { "code" : "ok", "response" : "Actualización exitosa."} );
                                    })
                                    .catch((err)=>{
                                        console.log("ha habido un error en updateData()")
                                        res.json( { "code" : "error", "response" : "Ha habido un error, intente luego."} );
                                    })
                                    
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

                }

            } else {
                //console.log("Esta condicion no deberia de aplicar ya que esta restringida desde el fronted");
                res.json({ "code" : "problem", "response" : "El archivo que intentaste subir supera el tamaño máximo permitido de 5MB o no es del tipo de imagen. Por favor, verifica e intenta nuevamente."}) //un error de carga
            }  

        }      

    } catch (error) {

        res.json({ "code" : "error", "response" : ""}) //un error de carga
    }

})

routes.post('/myaccount/uploadSelfieEdit', async(req, res)=>{

    try {
        
        console.log('aqui llegamos /myaccount/uploadSelfieEdit')
        const department = "transportAgent";
              
        //console.log("llegando al backend files---->", req.files);
    
        const user = req.session.user;
        console.log("user : ", user._id);
    
        const Files = req.files; //esto es un array con un archivo donde esta el selfie;

        const element = req.files[0];
        console.log("element :", element );

        const searchData = await modelTransportAgent.findOne({ indexed : user._id});

        if (searchData){

            if (element.size <= 5000000  && element.mimetype.startsWith("image/")){

                console.log("imagen aceptada ------------------------------------------------------>");
                console.log("-------------------Proceso de eliminacion de imagen------------------->");

                const docImage = searchData.docImages.images[1]
                console.log("docImage", docImage);
                const public_id = docImage.public_id;
                console.log("public_id :", public_id);

                const params = {
                    Bucket : bucketName,
                    Key : public_id
                }

                console.log("params --->", params);
                
                s3.deleteObject(params, (err, data)=>{
                    if (err){
                        console.error("Error al eliminar el archivo", err);
                        addImgToBucket()
                    } else {
                        console.log("Archivo eliminado con exito");
                        addImgToBucket()
                    }
                });

                console.log("-------------------Fin Proceso de eliminacion de imagen--------------------------")

                function addImgToBucket(){

                    console.log("hemos eliminado la imagen del bucked de Digital Ocean y ahora podemos vovler a subir una nueva imagen y actualizar todo de nuevo");

                    const folder = department; const ident = new Date().getTime(); //178409487478490 ms
                    const pathField = element.path; const extPart = pathField.split("."); //algo.png ["algo", "png"]
                    const ext = extPart[1];
                    
                    console.log("Bucket :", bucketName); console.log("folder :", folder);
                    console.log("patchField :", pathField); console.log("ext", ext);
        
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
                        
                            } else {
                                console.log('La imagen fue subida, Exito', data);
                                
                                //variables bucketName & endPoint esta declaradas arriba en las primeras lineas de este archivo.                        
                                let format = ext;
                                let url = `https://${bucketName}.${endpoint}/${key}`;
                                let bytes = element.size;
                                let public_id = key;
                                
                                console.log(`format : ${format}, url : ${url}, bytes ${bytes}, Public_Id : ${public_id} `);
                                const Data = {url, public_id, bytes, format};
        
                                                
                                async function updateData(){
                                    const documenttUpdate =  await modelTransportAgent.updateOne({ indexed: user._id },{ $set: { 'docImages.images.1': Data } }); 
                                    console.log("documenttUpdate --->", documenttUpdate);

                                }

                                updateData()
                                    .then(()=>{
                                        console.log("Se ha actualizado exitosamente")
                                        res.json( { "code" : "ok", "response" : "Actualización exitosa."} );
                                    })
                                    .catch((err)=>{
                                        console.log("ha habido un error en updateData()")
                                        res.json( { "code" : "error", "response" : "Ha habido un error, intente luego."} );
                                    })
                                    
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

                }

            } else {
                //console.log("Esta condicion no deberia de aplicar ya que esta restringida desde el fronted");
                res.json({ "code" : "error", "response" : "El archivo que intentaste subir supera el tamaño máximo permitido de 5MB o no es del tipo de imagen. Por favor, verifica e intenta nuevamente."}) //un error de carga
            }  

        }      

    } catch (error) {

        res.json({ "code" : "error", "response" : ""}) //un error de carga
    }

});

routes.post('/myaccount/transportAgent/active', async(req, res)=>{

    try {

        console.log("Hemos llegado a /myaccount/transportAgent/active");
        console.log("body :", req.body );
        const {indexed, selectedValue} = req.body;
        //indexed: '67e41975df0e3da5fc348fbc',
        //selectedValue: 'false'
        console.log("selectedValue.................... :", selectedValue );
        console.log("selectedValue typeof .................... :", typeof selectedValue );

        if ( selectedValue === "false" ){                           
            const updateProfile = await modelProfile.findOneAndUpdate( {indexed:indexed}, { $set: { 'transportAgent.active' : false } }, {new:true});
            console.log("updateProfile", updateProfile);
            const response = { code: "ok", message: "Se ha desactivado su cuenta como agente de transporte."};
            res.json(response);
        } else {
            const updateProfile = await modelProfile.findOneAndUpdate( {indexed:indexed}, { $set: { 'transportAgent.active' : true } }, {new:true});
            console.log("updateProfile", updateProfile);
            const response = { code: "ok", message: "Se ha activado su cuenta como agente de transporte."};
            res.json(response);
        }

        // transportAgent : { deliveryTransport : false, active: false }


    } catch (error) {
        const response = { code: "err", message: "Ha habido un error. Intente más tarde."};
        res.json(response);
    }
   

});

//esta ruta cancela la cuenta como agente de transporte
routes.post('/myaccount/transportAgent/cancelAccount', async(req, res)=>{

    try {

        console.log("Hemos llegado a /myaccount/transportAgent/cancelAccount");
        console.log("body :", req.body );
        const {indexed, selectedValue} = req.body;
        //indexed: '67e41975df0e3da5fc348fbc'
        //selectedValue: 'true'

        if ( selectedValue === "true" ){
            //Primero debemos eliminar todo los datos de agente de transporte de este usuario.
            const searchTransportAgent = await modelTransportAgent.findOne({indexed : indexed});
            console.log("searchTransportAgent : ", searchTransportAgent);
            const docImages = searchTransportAgent.docImages.images; //esto es un array de dos elementos, esto debemos eliminar.
            const transportation = searchTransportAgent.transportation; //no es necesario eliminar esta imagen. es la del vehiculo. No hay costo alguno en dejarla y nos ahorramos tiempo de computo del servidor
            console.log('docImages :', docImages);
            //console.log('transportation :', transportation);

            //docImages es un arreglo
            deleteImagesAndDocument(docImages);

            async function deleteImagesAndDocument(docImages) {
                const deletePromises = docImages.map(async (image) => {
                    console.log("image.public_id :  ", image.public_id);
                    const public_id = image.public_id;
                    console.log("Este es el public_id a eliminar: ", public_id); //transportAgent/1748103562662.jpg
                    return deleteMedias(public_id);
                });

                try {
                    // Espera a que todas las imágenes sean eliminadas
                    await Promise.all(deletePromises);
                    console.log("Todas las imágenes han sido eliminadas con éxito..................................");

                    // Ahora puedes llamar a la función para eliminar el documento
                    console.log("Ahora ya que se han eliminado las imaganes procedemos a eliminar el documento.");

                    await deletedataDB()
                        .then(()=>{
                            const response = { code: "ok", message: "Su cuenta como agente de transporte se ha desvinculado."};
                            console.log("Su cuenta como agente de transporte se ha desvinculado.");
                            res.json(response);
                        })
                        .catch((e)=>{
                            const response = { code: "err", message: "ha habido un problema inténtalo más tarde."};
                            console.log("ha habido un problema inténtalo más tarde.");
                            res.json(response);
                        })

                } catch (error) {
                    console.error("Error al eliminar las imágenes:", error);
                }
            

                async function deleteMedias(public_id) {
                    console.log("Esta imagen se va a eliminar :", public_id)
                    //const public_id = transportAgent/1748103562662.jpg
                    const params = {
                        Bucket: bucketName,
                        Key: public_id
                    };

                    return new Promise((resolve, reject) => {
                        s3.deleteObject(params, (err, data) => {
                            if (err) {
                                console.error("Error al eliminar el archivo --->", err);
                                reject(err);
                            } else {
                                console.log("Media eliminada con éxito --->", data);
                                resolve(data);
                            }
                        });
                    });
                }

                //funcion para eliminar el documento.
                async function deletedataDB(){
                    //aqui cambiamos el status del usuario desvinculando su perfil del agente de transporte
                    console.log("Aqui cambiamos el status del usuario desvinculando su perfil del agente de transporte.....................")
                    const updateProfile = await modelProfile.findOneAndUpdate({indexed}, { $set: { 'transportAgent.deliveryTransport' : false, 'transportAgent.active' : false  }}, {new: true} );
                    console.log("Ya hemos actualizado el profile updateProfile :", updateProfile);
                    //aqui eliminamos el documento 
                    await modelTransportAgent.findOneAndDelete({indexed});
                    console.log("Proceso terminado.....................")
                    console.log("eliminanos el documento....................")
                }

            }
        
        } 

        // transportAgent : { deliveryTransport : false, active: false }


    } catch (error) {
        const response = { code: "err", message: "Ha habido un error. Intente más tarde."};
        res.json(response);
    }
   

})

//---------------------------InfoBliss--------------------------------

routes.get('/infobliss/:user_id', async(req, res)=>{
   
    try {
       
        console.log("*********infoBliss******** -->");
        const user = req.session.user;
        const userID = user._id;
        console.log("este es el usuario propietario que esta logeado -->", userID);

        //ahora vamos a obtener el user_id del parametro para hacer una comparacion y de esta forma asegurar que solo el propietario esta accediendo a esta parte.
        const userIDParam = req.params.user_id;
        console.log("este es el usuario propietario que esta logeado -->", userIDParam);

        //este es el usuario propietario que esta logeado --> 66ac0281a3afb22ac770d5f2
        //este es el usuario propietario que esta logeado --> 66ac0281a3afb22ac770d5f2

        if (userID === userIDParam){
            //comprobamos que el usuario logeado es el mismo dueño de la tienda -POR SEGURIDAD-

            const countMessages = req.session.countMessages
            console.log("esto es countMessages -->", countMessages);
            //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
            //aqui obtengo la cantidad de negotiationsBuySell
            const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
            console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
   
            let searchProfile;
       
            if (user){
                //console.log("Esto es user._id ------>", user._id );
                searchProfile = await modelProfile.findOne({ indexed : user._id });
                console.log("searchProfile -->", searchProfile);


                res.render('page/infobliss', { user, searchProfile, countMessages, countNegotiationsBuySell });
               
               
            }  

        }
       

    } catch (error) {
        console.log("Ha habido un error en la carga de /infobliss/:user_id", error);
    }
                     
});

routes.post('/infobliss/setupInfo', async(req, res)=>{
    try{
        console.log("LLegando a /infobliss/setupInfo");
        const user = req.session.user;
        const userId = user._id;
        const { policy, faq, survey, map } = req.body;

        console.log("-------------------------------------------------Control de Botones info---------------------------------------------------------");
        console.log( `policy: ${policy}  faq: ${faq}  survey: ${survey}  map:${map}` ); 

        

        const reqSchemeSurvey = await modelProfile.findOne( {indexed : userId } );
        const Scheme =  reqSchemeSurvey.infobliss.survey.scheme;

        console.log("----------------------------consulta-----------------------------------");
        console.log( `Scheme: ${Scheme}` );
        console.log( `Scheme.length: ${Scheme.length}` );  

        if (Scheme.length !== 0){

            console.log("Existe un Scheme ----------------");

            const updatesProfile = await modelProfile.updateOne(
                { indexed: userId },
                { $set: { 'infobliss.policy.show': policy,
                            'infobliss.faq.show': faq,
                            'infobliss.survey.show': survey,
                            'infobliss.map.show' : map
                        } }
            );

            res.json(updatesProfile);

        } else {

            console.log("No Existe un Scheme ----------------"); 

            const updatesProfile = await modelProfile.updateOne(
                { indexed: userId },
                { $set: { 'infobliss.policy.show': policy,
                            'infobliss.faq.show': faq,
                            'infobliss.survey.show': false,
                            'infobliss.map.show' : map
                        } }
            );

            res.json(updatesProfile);

        }


       
    } catch (error) {
        res.json({ response : "Ha ocurrido un error en /infobliss/setupInfo"});
    }
})

routes.post('/infobliss/policyData', async(req, res)=>{
    try{
        console.log("LLegando a /infobliss/policyData");
        const { userId, data } = req.body;
        const searchProfile = await modelProfile.findOne({indexed : userId});
                            
        if (searchProfile){

            
                if (searchProfile.infobliss.policy.data.length !== 0 ){
                    //existe informacion en data, debemos reemplazar

                    const updatesProfile = await modelProfile.updateOne(
                        { indexed: userId },
                        { $set: { 'infobliss.policy.data': [data] } },
                        { new : true } //opcion para devolver documento actualizado
                    );
            
                    res.json(updatesProfile);


                } else {

                    //No existe informacion en data, debemos hacer un push
                    const updatesProfile = await modelProfile.updateOne(
                        { indexed: userId },
                        { $push: { 'infobliss.policy.data': data } },
                        { new : true } //opcion para devolver documento actualizado
                    );
            
                    res.json(updatesProfile);

                }


        } else {
            res.json({ response : "No se ha encontrado su perfil" });
        }

    } catch (error) {
        res.json({ response : "Ha ocurrido un error en /infobliss/policyData"});
    }
});

routes.post('/infobliss/faqData', async(req, res)=>{
    //aqui se crea el esquema de la subasta. el esquema es las preguntas y sus posibles respuestas, solo se permite una encuesta, pero es funcional ya que permite tener varias preguntas.
    try{
        console.log("LLegando a /infobliss/faqData");
        const { userId, data } = req.body;

        console.log("data ----------------------", data);

        const searchProfile = await modelProfile.findOne({indexed : userId});
                            
        if (searchProfile){


                if (searchProfile.infobliss.faq.data.length !== 0 ){
                    //existe informacion en data, debemos reemplazar

                    const updatesProfile = await modelProfile.updateOne(
                        { indexed: userId },
                        { $set: { 'infobliss.faq.data': [data] } },
                        { new : true } //opcion para devolver documento actualizado
                    );
            
                    res.json(updatesProfile);


                } else {
                    //No existe informacion en data, debemos hacer un push
                    const updatesProfile = await modelProfile.updateOne(
                        { indexed: userId },
                        { $push: { 'infobliss.faq.data': data } },
                        { new : true } //opcion para devolver documento actualizado
                    );
            
                    res.json(updatesProfile);

                }   


        } else {
            res.json({ response : "No se ha encontrado su perfil" });
        }


    } catch (error) {
        res.json({ response : "Ha ocurrido un error en /infobliss/faqData"});
    }
});

routes.post('/infobliss/createScheme/survey', async(req, res)=>{
    try{
        console.log("LLegando a /infobliss/createScheme/survey");
        const { userId, surveyTitle, surveyId, surveyData } = req.body;
       
        const date = new Date();
        const dia = date.getDate(); const mes = date.getMonth() + 1; const anio = date.getFullYear();
        const surveyTime = `${dia}-${mes}-${anio}`;
       

        const data = {
            surveyId,
            surveyTitle,
            surveyData,
            surveyTime
        }

        const searchSurvey = await modelProfile.findOne(
            { indexed: userId },{ 'infobliss.survey' : 1 }
        );

        console.log("searchSurvey ->", searchSurvey);
        const scheme = searchSurvey.infobliss.survey.scheme;
        console.log("scheme ->", scheme);
        console.log("scheme.length ->", scheme.length);

        //scheme.length -> 2
        if (scheme.length === 0){

            console.log("data ->", data);
       
            const updatesProfile = await modelProfile.updateOne(
                { indexed: userId },
                { $set: { 'infobliss.survey.scheme': data } },
                { new : true } //opcion para devolver documento actualizado
            );
   
            res.json({ code: 1, response : "Encuesta creada satisfactoriamente"});

        } else {

            res.json({ code: 2, response : "Ya tienes una encuesta activa. Solo se permite una."});
        }

 
       
    } catch (error) {
        res.json({ code: 0, response : "Ha ocurrido un error al crear la encuesta, intente más tarde"});
    }
});

routes.post('/infobliss/deleteScheme/survey', async(req, res)=>{
    //aqui eliminamos el esquema de la subasta. solo se permite una. y al eliminarla no se elimina el historial de esta.
    try{
        console.log("LLegando a /infobliss/deleteScheme/survey");
        const { userId, codeSurvey } = req.body;
           
        const CodeSurvey = parseInt(codeSurvey);

        const searchScheme = await modelProfile.findOne(
            { indexed: userId },{ 'infobliss.survey.scheme' : 1 }
        );

        console.log("searchScheme ->", searchScheme);
       
        const surveyId = searchScheme.infobliss.survey.scheme.surveyId;
        console.log("surveyId ->", surveyId);
        console.log("CodeSurvey ->", CodeSurvey);
       
        if (surveyId === CodeSurvey){
            console.log("Hemos encontrado la subasta a eliminar y vamos a eliminarla");

            const updatesProfile = await modelProfile.updateOne(
                { indexed: userId },
                { $set: { 'infobliss.survey.scheme': [], 'infobliss.survey.show': false } }, //vaciamos el array y quitamos el boton de se encuesta.
                { new : true } //opcion para devolver documento actualizado
            );

            res.json({ code: 1, response : "Encuesta eliminada satisfactoriamente"});

        } else {
            console.log("Encuesta No encontrada.");
            res.json({ code: 2, response : "Encuesta no encontrada"});
        }
       
       
    } catch (error) {
        res.json({ code: 0, response : "Ha ocurrido un error al eliminar la encuesta, intente más tarde"});
    }
});


// ---------------- pay shooping cart ---------------------

// /payShoppingCart ---------------------------------------------------------------------v
//iniciado el 31 de Agosto del 2025
routes.get('/payShoppingCart', async(req, res)=>{

    try {
        
        console.log("*********/payShoppingCart******** -->");
        const user = req.session.user;
        console.log("este es el usuario propietario -->", user);
        const countMessages = req.session.countMessages
        console.log("esto es countMessages -->", countMessages);
        //const receive  = req.query.paginate; //aqui capturo la solicitud de paginacion deseada.
        //aqui obtengo la cantidad de negotiationsBuySell
        const countNegotiationsBuySell = req.session.countNegotiationsBuySell;
        console.log(":::: Esto es la cantidad de negotiationsBuySell ::::", countNegotiationsBuySell);
  
        let searchProfile;
        let sumCount = 0;
    
        if (user){
            //console.log("Esto es user._id ------>", user._id );
            searchProfile = await modelProfile.findOne({ indexed : user._id });
            console.log("searchProfile -->", searchProfile);

            
            //aqui vamos a buscar todos los carritos pendinte por pagar que tiene este usuario
            const shoppingCartforPay = await modelShoppingCart.find({ $and : [{ customerId: user._id }, { CommentSeller: "no_comment" } ]  });
            sumCount = shoppingCartforPay.length; //aqui tomamos la cantidad de carritos pendientes
                                                     
            console.log("shoppingCartforPay.......................... ", shoppingCartforPay);             
            console.log('Esto es sumCount contamos todos los carritos por consolidar-->', sumCount);
            res.render('page/payShoppingCart', { user, searchProfile, countMessages, countNegotiationsBuySell, shoppingCartforPay, sumCount });
        }   

        

    } catch (error) {
        console.log("Ha habido un error en la carga de /payShoppingCart", error);
    }

});

routes.post('/payShoppingCart/bankStore', async(req, res)=>{

    try {
        console.log("............./payShoppingCart/bankStore............")
        console.log("req.body :", req.body);
        //{ IDCart: '68b48402382931d238242cb2' }
        const {IDCart} = req.body;

        const searchSeller = await modelShoppingCart.findById(IDCart);
        const sellerId = searchSeller.sellerId;
        console.log("sellerId :", sellerId); //sellerId : 67e2fe3c34c69a33c17f7b0e

        const searchBankStore = await modelBankUser.findOne( {indexed: sellerId} );
        console.log("searchBankStore :", searchBankStore);
        
        res.json({ "searchBankStore" : searchBankStore });


    } catch (error) {
        console.log("ha habido un error en /payShoppingCart/bankStore", error);
    }

});

async function searchMessages(userID, req){
    console.log("estamos dentro de la funcion global de actualizar la cantidad de messages.......")
    //primer paso ubicar todos los mensajes que tenga el usuario logeado y que el campo answer diga waiting.
    const searchBoxMessageInbox = [];
    let searchMessageInbox;
    let countMessagesInbox;
    let countMessagesOutbox;
    let totalMessages;
    let countMessages;

    const searchMessageInbox0 = await modelMessage.find( { $and: [{ toCreatedArticleId : userID },{answer: "waiting"}, { typeNote: { $ne: "availability-noti" } } ] } );
    const searchMessageInbox1 = await modelMessage.find( { $and: [{ userId : userID }, { typeNote : "availability-noti" }, {answer: "waiting"} ] } );
    
    searchBoxMessageInbox.push(...searchMessageInbox0, ...searchMessageInbox1);
    searchBoxMessageInbox.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); //aqui ordenamos de menor a mayor por fecha
    searchMessageInbox = searchBoxMessageInbox; 
    //console.log("Estos son todos los mensajes que tiene este usuario en Inbox --->", searchMessageInbox);
    
    countMessagesInbox = searchMessageInbox.length;

    console.log("vamos por aqui en la funcion searchMessages ...........")
    //console.log('esta es la cantidad de mensajes que tiene este usario en inbox--->', countMessagesInbox)

    const searchMessageOutbox = await modelMessage.find( { $and: [{userId : userID },{view: false},{ typeNote: { $ne: "availability-noti" } } ] } ).sort({ createdAt: 1 }); // 1 para orden ascendente, -1 para descendente;
    const searchMessageOutboxAlert = await modelMessage.find( { $and: [{userId : userID },{view: false},{ typeNote: { $ne: "availability-noti" }}, { answer: { $ne: "waiting" } } ] } );
    countMessagesOutbox = searchMessageOutboxAlert.length;


    //console.log('esta es la cantidad de mensajes que tiene este usario en Outbox--->', countMessagesOutbox)

    totalMessages = (countMessagesInbox + countMessagesOutbox);
    console.log("este es la totalidad de los mensajes en inbox y en outbox ----->", totalMessages)
    //aqui tenemos la sumatoria de mensajes en Inbox y Outbox
    console.log("Este es el fin delp proceso de la la funcion searchMessages");

    req.session.countMessages = totalMessages
    countMessages = totalMessages
    return countMessages;

    
}

module.exports = routes;

