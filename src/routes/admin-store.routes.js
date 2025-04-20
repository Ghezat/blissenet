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

const modelStoreRate = require('../models/storeRate.js');

// admin-store ---------------------------------------------------------------------v
//iniciado el 23 de diciembre del 2024
routes.get('/admin-store', async(req, res)=>{

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

            //hacemos la busqueda de posibles rifa.
            //aqui busco el id del sorteo. 
            const Raffle = await modelRaffle.findOne({ user_id : user._id });
            console.log("raffle ver --->", Raffle);
            //si tiene entonces lo incluyo en los objetos a enviar al front para anexarlo en el contenedor derecho alargado donde esta el Score y el trust 
    
            res.render('page/admin-store', { user, searchProfile, countMessages, countNegotiationsBuySell, Raffle });
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



module.exports = routes;