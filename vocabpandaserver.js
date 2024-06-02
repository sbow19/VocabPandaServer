"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const uuid = require("uuid");
require("module-alias/register");
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const cron_1 = __importDefault(require("@shared/cron/cron"));
const express_1 = __importDefault(require("express"));
const cors = require('cors');
// //PATH TO SSL CERTIFICATE AND KEY HERE 
// const options = {
//     key: fs.readFileSync("C:\\Users\\lenovo\\Desktop\\Dev\\projects\\VP\\https\\dev_ssl\\server.key"),
//     cert: fs.readFileSync("C:\\Users\\lenovo\\Desktop\\Dev\\projects\\VP\\https\\dev_ssl\\server.cert")
//   };
const vocabpandaserver = (0, express_1.default)();
vocabpandaserver.use(cors());
const PORT = 3000 || process.env.PORT;
//SET CHECKING INTERVALS - CRON JOBS
cron_1.default.runCronJobs();
vocabpandaserver.use(express_1.default.json());
//Generate device api_key
vocabpandaserver.post("/generateapikey", async (req, res) => {
    const generateAPIKeyResponse = {
        success: false,
        operationType: "API Key",
        APIKey: ""
    };
    try {
        const generateAPIKeyRequest = req.body;
        //Get database connection
        const dbConnection = await users_db_1.default.getUsersDBConnection();
        await dbConnection.mysqlConnection?.beginTransaction();
        const deviceIdSqlQuery = `SELECT * FROM api_keys WHERE device_id = ?;`;
        const [queryResult,] = await dbConnection.mysqlConnection?.query(deviceIdSqlQuery, generateAPIKeyRequest.deviceId);
        if (queryResult.length === 0) {
            //new API key
            const newAPIKey = uuid.v4();
            const addNewDeviceSqlQuery = `INSERT INTO api_keys VALUES (?, ?, ?, ?, ?, ?);`; //api_key, device_id, user_id, public_key, private_key, device_type
            await dbConnection.mysqlConnection?.query(addNewDeviceSqlQuery, [
                newAPIKey,
                generateAPIKeyRequest.deviceId,
                null,
                null,
                null,
                generateAPIKeyRequest.deviceType
            ]);
            dbConnection.mysqlConnection?.commit();
            generateAPIKeyResponse.APIKey = newAPIKey;
            generateAPIKeyResponse.success = true;
            res.status(200).send(generateAPIKeyResponse);
        }
        else if (queryResult.length > 0) {
            generateAPIKeyResponse.APIKey = queryResult[0].api_key;
            res.status(200).send(generateAPIKeyResponse);
        }
        ;
    }
    catch (e) {
        console.log(e);
        //Error occurs while handling request. 
        res.status(500).send(generateAPIKeyResponse);
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
vocabpandaserver.listen(PORT, () => {
    console.log("Now listening on port 3000...");
});
//Initiate server 
// https.createServer(options, vocabpandaserver).listen(PORT, ()=>{
//     console.log("listening to port 3000...")
// });
// // // Redirect HTTP to HTTPS
// import * as http from 'http';
// http.createServer((req, res) => {
//   res.writeHead(301, { "Location": `https://${req.headers.host}${req.url}` });
//   res.end();
// }).listen(80, () => {
//   console.log('HTTP server running on port 80 and redirecting to HTTPS on port 3000');
// });
//# sourceMappingURL=vocabpandaserver.js.map