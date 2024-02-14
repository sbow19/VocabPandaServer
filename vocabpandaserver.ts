require("dotenv").config();
import "module-alias/register";
const authoriseRequest = require("@shared/misc/authorisation")

const express = require('express');

//PATH TO SSL CERTICATE AND KEY HERE 

const vocabpandaserver = express();
const PORT = 3000 || process.env.PORT;

//Verify device 
vocabpandaserver.use(authoriseRequest); 

//Redirect to main website routing
vocabpandaserver.use('/', require("./src/website/routes/main.js"));

//Redirect to account management handlers API  
vocabpandaserver.use('/account', require("./src/shared/routes/account/account.js"));

//Redirect to app specific API handlers
vocabpandaserver.use('/app', require("./src/app/routes/main.js"));

//REdirect to Deepl translation API code

//Initiate server 
vocabpandaserver.listen(PORT, ()=>{
    console.log("listening to port 3000...")
});