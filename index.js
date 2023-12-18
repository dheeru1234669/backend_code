const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require("express-fileupload");

const corsOptions ={
    origin:'*', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}


//.ENV
require('dotenv').config({path: './configuration.env'});

// create express app
const app = express();

//cors
app.use(cors(corsOptions));

// setup the server port
const port = process.env.SERVERPORT;

app.use(fileUpload({limits: { fileSize: 50 * 1024 * 1024 },}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('uploads'))

// parse request data content type application/x-www-form-rulencoded
//app.use(bodyParser.urlencoded({extended: tru}));

// parse request data content type application/json
//app.use(bodyParser.json());

app.use("/api", require("./routes/api"));


// listen to the port
app.listen(port, ()=>{
    console.log(`Express is running at port ${port}`);
});
