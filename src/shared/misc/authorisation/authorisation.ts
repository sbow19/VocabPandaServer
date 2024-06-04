import UsersDatabase from "@shared/models/user_logins/users_db";
import { Response, Request, NextFunction } from "express";
import * as appTypes from "@appTypes/appTypes"
import * as apiTypes from "@appTypes/api"
const basicAuth = require("basic-auth");
import { BasicAuthResult } from "basic-auth";

const authoriseRequest = async(req: Request, res: Response, next: NextFunction)=>{

    const authenticationOperation: apiTypes.BackendOperationResponse = {
        requestId: req.body.requestId,
        success: false,
        operationType: "Authentication",
        errorType: "Device not authorised"

    }

    try{

        // console.log(req)
        const credentials: BasicAuthResult = basicAuth(req);

        if (!credentials || !credentials.name || !credentials.pass) {
            res.status(401).send('Authentication required');
            return;
        }

        await UsersDatabase.areCredentialsCorrect(credentials);
        
        next();

    }catch(e){

        const DBOperation = e as appTypes.DBOperation;

        if(DBOperation.specificErrorCode === "No rows affected"){

            //User not authorised
            return res.status(401).send(authenticationOperation);

        }else {
            authenticationOperation.errorType = "Miscellaneous error"
            return res.status(401).send(authenticationOperation);
        }

       

    }
}

module.exports = authoriseRequest;