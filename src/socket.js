
const io = require('./server.js');
//console.log("Esto es io desde socket :", io);


io.on('connection', (socket)=>{
   
    console.log("||| Se ha connectado :", socket.id );

    //Esto es el esquema de como funciona el socket un emisor(emit) y un receptor escucha(on)
    //socket.emit('messaje:prueba', "Esto es un mensaje de prueba GREGORIOM");
    
    //socket.on('messaje:prueba', (data)=>{
    //    console.log("&&&&&&& ····", data);
    //})

    //socket.emit('creacion:MsgBuysell', { 'obje' : jsonx }); Esto es el data del msg que llega del jsonx.
    //esto es para tener comunicacion en el chat en tiempo real
    socket.on('creacion:MsgBuysell', (data)=>{
        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxx  Sockect  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
        console.log("::::: Aqui llega el mensaje de buysell, para ser enviada a todos los sockets ::::");
        console.log("---->creacion:MsgBuysell");
        io.emit('refresh:MsgBuysell', data);
    });
   
    //socket.emit('result:delivery', { 'obje' : data });
    //Esto envia en tiempo real el objeto que posee todas las busquedas de todos los deliveries que estan a una distancia proxima al vendedor que posse el paquete de envio
    socket.on('result:delivery', (data)=>{
        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxx  Sockect  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
        console.log("::::: Aqui llega el mensaje de deliveries, para ser enviada a todos los sockets ::::");
        io.emit('refresh:delivery', data);
    });

    //socket.emit('creacion:Note', { 'obje' : jsonx });
    socket.on('creacion:Note', (data)=>{
        console.log("::::: Aqui llega la actualizacion de la nota, para ser enviada a todos los sockets ::::");
        console.log("---->creacion:Note");
        io.emit('refresh:note', data);
    });

    //socket.emit('delete:Note', { 'obje' : jsonx });
    socket.on('delete:Note', (data)=>{
        console.log("::::: Aqui llega la actualizacion de la nota, para ser enviada a todos los sockets ::::");
        console.log("---->delete:Note");
        io.emit('refresh:note', data);
    });


    //socket.emit('creacion:Bid', { 'obje' : participantsSort });
    socket.on('creacion:Bid', (data)=>{
        console.log("::::: Aqui llega la actualizacion del Bid, para ser enviada a todos los sockets ::::");
        console.log("---->creacion:Bid");
        io.emit('refresh:bid', data);
    });

    //socket.emit('error:Bid', { 'obje' : participantsSort });
    socket.on('error:Bid', (data)=>{
        console.log("::::: Aqui llega un error de Bid, para ser enviada solo al sockets que lo emitio ::::");
        console.log("---->error:Bid");
        socket.emit('refresh:bid', data);
    });

 

});


