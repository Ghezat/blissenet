
const io = require('./server.js');
//console.log("Esto es io desde socket :", io);


io.on('connection', (socket)=>{
   
    console.log("||| Se ha connectado :", socket.id );

    socket.on('messaje:prueba', (data)=>{
        console.log("&&&&&&& ····", data);
    })
   
    socket.on('creacion:Note', (data)=>{
        console.log("::::: Aqui llega la actualizacion de la nota, para ser enviada a todos los sockets ::::");
        io.emit('refresh:note', data);
    });

    //socket.emit('delete:Note', { 'obje' : jsonx });
    socket.on('delete:Note', (data)=>{
        console.log("::::: Aqui llega la actualizacion de la nota, para ser enviada a todos los sockets ::::");
        io.emit('refresh:note', data);
    });

});


