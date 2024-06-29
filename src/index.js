const dotenv = require('dotenv').config();
require('./server');
require('./database');
require('./socket');
//require('./socketHandler');  


//migrar el sistema CommonJS ES& module "Futuro"

/* import dotenv from 'dotenv';
import './server.js';
import './database.js';
import './socket.js';

dotenv.config(); */