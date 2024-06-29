const mongoose = require('mongoose');
const uri = process.env.DB

mongoose.connect(uri)
    .then( db => console.log("database is conected to", uri))
    .catch( e => console.error(e));

module.exports = mongoose;