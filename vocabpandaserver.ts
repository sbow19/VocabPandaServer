require("dotenv").config();
const uuid = require("uuid")
import "module-alias/register";
import UsersDatabase from "@shared/models/user_logins/users_db";
import RefreshCounter from "@shared/updates/refresh/refresh";
import * as appTypes from "@appTypes/appTypes"

const express = require('express');

//PATH TO SSL CERTICATE AND KEY HERE 

const vocabpandaserver = express();
const PORT = 3000 || process.env.PORT;

//SET CHECKING INTERVALS

setInterval(RefreshCounter.gameRefreshChecker, 60000);

setInterval(RefreshCounter.translationsRefreshChecker, 60000);

setInterval(RefreshCounter.premiumUserChecker, 60000);


vocabpandaserver.use(express.json());

//Generate api_key

vocabpandaserver.post("/generateapikey", async(req, res)=>{

    try{

        //Get database connection

        const dbConnection = await UsersDatabase.getUsersDBConnection();

        dbConnection.mysqlConnection?.beginTransaction(err => {throw err})

        const deviceId = req.body.deviceId;

        const deviceIdSqlQuery = `SELECT * FROM api_keys WHERE device_id = ?;`

        const [queryResult] = await dbConnection.mysqlConnection?.query(deviceIdSqlQuery, deviceId);

        if(queryResult.length === 0){
            
            
            //new API key
            const newAPIKey = uuid.v4();

            const addNewDeviceSqlQuery = `INSERT INTO api_keys VALUES (?, ?, ?);`  //api_key, device_id, user_id

            await dbConnection.mysqlConnection?.query(
                addNewDeviceSqlQuery,
                [
                    newAPIKey,
                    deviceId,
                    null
                ]
            )

            dbConnection.mysqlConnection?.commit()

            res.send("Device id does not exist... generated new api key");

        } else if (queryResult > 0){
            res.send("Device id already exists");
        };

    }catch(e){

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
vocabpandaserver.listen(PORT, ()=>{
    console.log("listening to port 3000...")
});