"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const uuid = require("uuid");
require("module-alias/register");
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const express = require('express');
//PATH TO SSL CERTICATE AND KEY HERE 
const vocabpandaserver = express();
const PORT = 3000 || process.env.PORT;
vocabpandaserver.use(express.json());
//Generate api_key
vocabpandaserver.post("/generateapikey", async (req, res) => {
    try {
        //Get database connection
        const dbConnection = await users_db_1.default.getUsersDBConnection();
        const deviceId = req.body.deviceId;
        const deviceIdSqlQuery = `SELECT * FROM api_keys WHERE device_id = ?;`;
        const [queryResult] = await dbConnection.mysqlConnection?.query(deviceIdSqlQuery, deviceId);
        if (queryResult.length === 0) {
            res.send("Device id does not exist... generating new api key");
            //new API key
            const newAPIKey = uuid.v4();
            const addNewDeviceSqlQuery = `INSERT INTO api_keys VALUES (?, ?);`; //api_key, device_id
            await dbConnection.mysqlConnection?.query(addNewDeviceSqlQuery, [
                newAPIKey,
                deviceId
            ]);
        }
        else if (queryResult > 0) {
            res.send("Device id already exists");
        }
        ;
    }
    catch (e) {
        res.status(500).send(e);
    }
});
//Redirect to main website routing
vocabpandaserver.use('/', require("./src/website/routes/main.js"));
//Redirect to account management handlers API  
vocabpandaserver.use('/account', require("./src/shared/routes/account/account.js"));
//Redirect to app specific API handlers
vocabpandaserver.use('/app', require("./src/app/routes/main.js"));
//Redirect to Deepl API
//Initiate server 
vocabpandaserver.listen(PORT, () => {
    console.log("listening to port 3000...");
});
//# sourceMappingURL=vocabpandaserver.js.map