require("dotenv").config();
const uuid = require("uuid");
import "module-alias/register";
import UsersDatabase from "@shared/models/user_logins/users_db";

import * as appTypes from "@appTypes/appTypes";
import CronClass from "@shared/updates/cron";

import express from 'express';
const cors = require('cors');


// //PATH TO SSL CERTIFICATE AND KEY HERE 
// const options = {
//     key: fs.readFileSync("C:\\Users\\lenovo\\Desktop\\Dev\\projects\\VP\\https\\dev_ssl\\server.key"),
//     cert: fs.readFileSync("C:\\Users\\lenovo\\Desktop\\Dev\\projects\\VP\\https\\dev_ssl\\server.cert")
//   };

const vocabpandaserver = express();
vocabpandaserver.use(cors());
const PORT = 3000 || process.env.PORT;

//SET CHECKING INTERVALS - CRON JOBS

CronClass.runCronJobs();

vocabpandaserver.use(express.json());

//Generate device api_key

vocabpandaserver.post("/generateapikey", async(req, res)=>{

    try{

        console.log(req)

        //Get database connection

        const dbConnection = await UsersDatabase.getUsersDBConnection(); //Implement some kind of db pooling under the hood

        dbConnection.mysqlConnection?.beginTransaction(err => {throw err})

        const deviceId = req.body.deviceId;

        const deviceIdSqlQuery = `SELECT * FROM api_keys WHERE device_id = ?;`

        const [queryResult] = await dbConnection.mysqlConnection?.query(deviceIdSqlQuery, deviceId);

        if(queryResult.length === 0){
            
            //new API key
            const newAPIKey = uuid.v4();
            
            const addNewDeviceSqlQuery = `INSERT INTO api_keys VALUES (?, ?, ?, ?, ?);`  //api_key, device_id, user_id, public_key, private_key

            await dbConnection.mysqlConnection?.query(
                addNewDeviceSqlQuery,
                [
                    newAPIKey,
                    deviceId,
                    null,
                    null,
                    null
                ]
            );

            dbConnection.mysqlConnection?.commit()

            res.status(200).send({
                message: "Device id does not exist... generated new api key",
                APIKey: newAPIKey
            }
            );

        } else if (queryResult.length > 0){

            res.status(200).send({
                message: "Device id already exists.",
                APIKey: queryResult[0].api_key 
            });

            
        };

    }catch(e){

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


vocabpandaserver.listen(PORT, ()=>{
    console.log("Now listening on port 3000...")
})

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