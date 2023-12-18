const mysql = require('mysql');




require('dotenv').config({path: './configuration.env'});
// require('dotenv').config();
//process.env

//create mysql connection

const dbConn = mysql.createConnection({
    host: process.env.HOST, 
    port: process.env.PORT,
    user: 'rms_usr',
    password: 'KGntMdb1qDf',
    database: process.env.DATABASE
});

dbConn.connect(function(error){
    if(error)
    {
        console.error('error connecting:' + error.stack);
        process.exit(1);
    } 
    else{
        console.log('Database Connected Successfully!!!!');

    }
 
});

module.exports = dbConn;
