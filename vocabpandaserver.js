"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const uuid = require("uuid");
require("module-alias/register");
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const cron_1 = __importDefault(require("@shared/updates/cron"));
const express = require('express');
const cors = require('cors');
//PATH TO SSL CERTIFICATE AND KEY HERE 
const vocabpandaserver = express();
vocabpandaserver.use(cors());
const PORT = 3000 || process.env.PORT;
//SET CHECKING INTERVALS - CRON JOBS
cron_1.default.runCronJobs();
vocabpandaserver.use(express.json());
//Generate device api_key
vocabpandaserver.post("/generateapikey", async (req, res) => {
    try {
        console.log(req);
        //Get database connection
        const dbConnection = await users_db_1.default.getUsersDBConnection(); //Implement some kind of db pooling under the hood
        dbConnection.mysqlConnection?.beginTransaction(err => { throw err; });
        const deviceId = req.body.deviceId;
        const deviceIdSqlQuery = `SELECT * FROM api_keys WHERE device_id = ?;`;
        const [queryResult] = await dbConnection.mysqlConnection?.query(deviceIdSqlQuery, deviceId);
        if (queryResult.length === 0) {
            //new API key
            const newAPIKey = uuid.v4();
            const addNewDeviceSqlQuery = `INSERT INTO api_keys VALUES (?, ?, ?, ?, ?);`; //api_key, device_id, user_id, public_key, private_key
            await dbConnection.mysqlConnection?.query(addNewDeviceSqlQuery, [
                newAPIKey,
                deviceId,
                null,
                null,
                null
            ]);
            dbConnection.mysqlConnection?.commit();
            res.status(200).send({
                message: "Device id does not exist... generated new api key",
                APIKey: newAPIKey
            });
        }
        else if (queryResult.length > 0) {
            res.status(200).send({
                message: "Device id already exists.",
                APIKey: queryResult[0].api_key
            });
        }
        ;
    }
    catch (e) {
        console.log(e);
        //Error occurs while handling request. 
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
vocabpandaserver.use('/translate', require("./src/shared/deeplAPI/deeplAPI.js"));
//Initiate server 
vocabpandaserver.listen(PORT, () => {
    console.log("listening to port 3000...");
});
//# sourceMappingURL=vocabpandaserver.js.map