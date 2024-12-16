
const io = require('./server.js');
//console.log("Esto es io desde socket :", io);


io.on('connection', (socket)=>{
   
    console.log("||| Se ha connectado :", socket.id );

    //Esto es el esquema de como funciona el socket un emisor(emit) y un receptor escucha(on)
    //socket.emit('messaje:prueba', "Esto es un mensaje de prueba GREGORIOM");
    
    //socket.on('messaje:prueba', (data)=>{
    //    console.log("&&&&&&& ····", data);
    //})
   
    
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
});


