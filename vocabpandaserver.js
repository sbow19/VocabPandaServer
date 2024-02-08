"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
require("module-alias/register");
const express = require('express');
//PATH TO SSL CERTICATE AND KEY HERE 
//AUTHORIZEFD API KEYS 
const vocabpandaserver = express();
const PORT = 3000 || process.env.PORT;
//Redirect to main website routing
vocabpandaserver.use('/', require("./src/website/routes/main.js"));
//Redirect to account management handlers API  
vocabpandaserver.use('/account', require("./src/shared/routes/account/account.js"));
//Redirect to app specific API handlers
vocabpandaserver.use('/app', require("./src/app/routes/main.js"));
//Initiate server 
vocabpandaserver.listen(PORT, () => {
    console.log("listening to port 3000...");
});
//# sourceMappingURL=vocabpandaserver.js.map