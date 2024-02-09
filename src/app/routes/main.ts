import * as express from "express";
import UsersDatabase from "@shared/models/user_logins/users_db";

const appRouter: express.IRouter = express.Router()

//Authenticate function. API Key sent in authorisation header from mobile device.

const verifyDevice = async(req, res, next)=>{

    const headers = req.headers;

    const APIKey = "60c0f2bf-c5b4-11ee-bcbd-28d244107ae3"
    ; //Set dummyt api key value here.

    try{

        const responseObject = await UsersDatabase.checkAPIKey(APIKey);

        if(responseObject.responseMessage === "No match found"){
            //We must send an error message back client 
            res.send("Unable to verify device");

        } else if (responseObject.responseMessage === "Match found"){

            //Device verified, we can continue to the next route
            console.log("Device verified")
            next()

        }


    } catch(e){

        res.send("Unable to verify device")  //Send message to client indicating that device verification failed.
    }
    
}

//Start by checking whether api key provided by user matches one in database.
appRouter.use("/", verifyDevice);

//USer credentials provided in request header
appRouter.get("/", async (req, res)=>{

    //Review session cookie. 
    

    res.send("This the is app page")
});

appRouter.use("/login", require("./api/users.js"));

appRouter.use("/entries", require("./api/user_content.js"));

module.exports = appRouter;