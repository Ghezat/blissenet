const express = require('express');
const SocketIO = require('socket.io'); //setting socket.io

const session = require('express-session');
var methodOverride = require('method-override');
const morgan = require('morgan');
const multer = require('multer');
const ejs = require('ejs')
const path = require('path')

//initailization
const app = express()


//setting
app.set('port', process.env.PORT || 2020);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//middleware

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended : false }));

app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: (24 * 60 * 60 * 1000) * 90, // 90 días de tiempo de duracion del login
        //httpOnly: true, // No accesible desde JavaScript
        //secure: true // Solo se envía por HTTPS
    }
}));

//**maxAge**: Especifica la duración de la cookie en milisegundos. En tu caso, `24 * 60 * 60 * 1000` es el cálculo para un día (24 horas), donde multiplicas 24 horas por 60 minutos por 60 segundos y luego por 1000 para convertir a milisegundos.
 
app.use(methodOverride('_method'));
const storage =  multer.diskStorage({
    destination: path.join(__dirname, 'public/uploads'),
    filename: (req, file, cb) =>{
        cb(null, new Date().getTime() + path.extname(file.originalname));
    }
});
app.use(multer({storage}).array('fileImg', 10000));
//todos los elementos html como file deben tener en su atributo name un valor "fileImg"
//name = "fileImg"

//routes
app.use(require('./routes/index.routes.js'));

app.use(require('./routes/depart-airplane.routes.js'));
app.use(require('./routes/depart-artes.routes.js'));
app.use(require('./routes/depart-items.routes.js'));
app.use(require('./routes/depart-automotive.routes.js'));
app.use(require('./routes/depart-realstate.routes.js'));
app.use(require('./routes/depart-nautical.routes.js'));
app.use(require('./routes/depart-services.routes.js'));
app.use(require('./routes/depart-auction.routes.js'));
app.use(require('./routes/depart-raffle.routes.js'));

app.use(require('./routes/view-store.routes.js'));
app.use(require('./routes/view-artes.routes.js'));
app.use(require('./routes/view-airplanes.routes.js'));
app.use(require('./routes/view-items.routes.js'));
app.use(require('./routes/view-automotive.routes.js'));
app.use(require('./routes/view-realstate.routes.js'));
app.use(require('./routes/view-nautical.routes.js'));
app.use(require('./routes/view-services.routes.js'));
app.use(require('./routes/view-auction.routes.js'));
app.use(require('./routes/view-raffle.routes.js'));


app.use(require('./routes/view-general-product.routes.js'));

app.use(require('./routes/favorite.routes.js'));
app.use(require('./routes/follow.routes.js'));
app.use(require('./routes/followme.routes.js'));
app.use(require('./routes/my-tickets.routes.js'));

app.use(require('./routes/manage.routes.js'));
app.use(require('./routes/messages.routes.js'));
app.use(require('./routes/account.routes.js'));
app.use(require('./routes/admin-store.routes.js'));
app.use(require('./routes/my-ads.routes.js'));
app.use(require('./routes/buy-sell.routes.js'));
app.use(require('./routes/history.routes.js'));
app.use(require('./routes/my-invoices.routes.js'));
app.use(require('./routes/record.routes.js'));
app.use(require('./routes/datesUsers.routes.js'));
app.use(require('./routes/country.routes.js'));
app.use(require('./routes/footer.routes.js'));


app.use(require('./routes/admin.routes.js'));


//static file
app.use(express.static(path.join(__dirname,'public/')));
app.use(express.static(path.join(__dirname)));


//manejador de error 404
app.all('*', (req, res)=>{
    res.status(404)
    res.render('partials/error404')
});

//listen server
//he colocado este script dentro de la constante Server para guardar el servidor ya iniciado y escuchando
const Server = app.listen(app.get('port'), ()=>{
    console.log('server on port', app.get('port'));
    console.log(__dirname)
})


//websocket.io
//aqui paso como parametro el servidor ya iniciado, debe ser asi y guardo en la constante io

const io = SocketIO(Server);
module.exports = io;

 
/* ******MULTER****** 
caso 1:  subida de una (1) imagen 

app.use(multer({storage}).single('fileImg');

caso 2: subida de varias imagenes 

app.use(multer({storage}).array('fileImg', 10));

caso 3: filtrar por peso

app.use(multer({storage, limits: { fileSize: 200000, files: 4 } }).array('fileImg'));
 */

