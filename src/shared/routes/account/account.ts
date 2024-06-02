const express = require('express');
import UsersDatabase from "@shared/models/user_logins/users_db"
import UserDetailsDatabase from "@shared/models/user_details/user_details_db";
import VocabPandaEmail from "@shared/misc/verification/email";
import * as appTypes from "@appTypes/appTypes";
import * as apiTypes from "@appTypes/api";
import { Request } from "express";
const bycrypt = require("bcrypt");
const basicAuth = require("basic-auth");
const authoriseRequest = require("@shared/misc/authorisation/authorisation");


//Account middleware

const AccountRouter = express.Router();

AccountRouter.use(express.json());

//Test email
AccountRouter.get("/createaccount/verify", async(req: Request, res: apiTypes.VerifyEmailResponse)=>{

    const verificationToken: string = req.query.token;

    const verificationResponse: apiTypes.BackendOperationResponse = {
        success: false,
        operationType: "verify email",
        errorType: ""
    }

    try{

        if(!req.query.token){

            verificationResponse.errorType = "Invalid token"
            res.status(401).send(verificationResponse);

        } else if (req.query.token){

            await VocabPandaEmail.verifyEmailToken(verificationToken);

            res.status(200).send(verificationResponse);
        }

    }catch(e){

        const operationError = e as appTypes.DBOperation;

        if(operationError.specificErrorCode === "No rows affected"){
            verificationResponse.errorType = "Verification token expired"
        }else{

            verificationResponse.errorType = "Miscellaneous error"
            res.status(401).send(verificationResponse);
        }
    }
    
})

//Authentication

AccountRouter.use(authoriseRequest);


//Create account
AccountRouter.post("/createaccount", async(req: apiTypes.CreateAccountCall, res: apiTypes.CreateAccountResponse)=>{

    let userCreds: apiTypes.APICreateAccount = req.body.accountOperationDetails;
    let hashedPassword;

    //get deviceid and API key
    const credentials = basicAuth(req);

    //Backendoperation Response
    const createAccountResponse: apiTypes.BackendOperationResponse = {
        success: false
    }

    
    try {
        const salt = await bycrypt.genSalt();
        hashedPassword = await bycrypt.hash(userCreds.password, salt);

        //User creds parsed from http post request... This will be a post message
        userCreds.password = hashedPassword;

    } catch (e){

        res.status(401).send(e)
        return

    } 

    try {

        //Add new user to user_logins db. Verification checks undertaken within function.
        const addUserResponse = await UsersDatabase.createNewUser(userCreds, credentials); 

        //Then we can move onto adding the users details.
        await UserDetailsDatabase.addNewUserDetails(userCreds, addUserResponse.resultArray, credentials.name); //Create new user returns  user id in .add.message property
    
    }catch(e){

        if(e.code === "ER_DUP_UNIQUE"){
            createAccountResponse.operationType = "create account";
            createAccountResponse.ErrorType = "User exists";
            res.status(500).send(createAccountResponse);
        } else {

            createAccountResponse.operationType = "create account";
            createAccountResponse.ErrorType = "Miscellaneous error";
            res.status(500).send(createAccountResponse);
        }

        return 
    
    } 

    try{
        //Send email verification link to email provided by user -- If cannot send due to network error, then we don't move to saving the details in the database
        await VocabPandaEmail.sendVerificationEmail(userCreds.email);
        
    }catch(e){

        res.status(500).send(createAccountResponse);

        try{
            await UsersDatabase.deleteUser({
                userId: userCreds.username,
                password: userCreds.password,
                dataType:"account"
            });

        }catch(e){
            //Some error deleting the account details
        }

        return
    }

    createAccountResponse.success = true;
    res.status(200).send(createAccountResponse);
    
});


//TODO trigger payment cancellation logic here
AccountRouter.post("/deleteaccount", async(req: apiTypes.DeleteAccountCall, res: apiTypes.DeleteAccountResponse)=>{

    const userCredentials: apiTypes.APIDeleteAccount = req.body.accountOperationDetails;

    //Backendoperation Response
    const deleteAccountResponse: apiTypes.BackendOperationResponse = {
        success: false,
        operationType: "delete account"
    }

    try{
        await UsersDatabase.deleteUser(userCredentials);
    
        res.status(200).send(deleteAccountResponse);
    } catch(e){
        res.status(500).send(deleteAccountResponse);
    }
});


//Update password
AccountRouter.post("/updatepassword", async(req: apiTypes.UpdatePasswordCall, res:apiTypes.UpdatePasswordResponse)=>{

    const accountDetails = req.body.accountOperationDetails;

    //Backendoperation Response
    const updatePasswordResponse: apiTypes.BackendOperationResponse = {
        success: false,
        operationType: "change password"
    }

    try{

        await UsersDatabase.updatePassword(accountDetails);
        res.status(200).send(updatePasswordResponse);

    } catch(e){

        //Some error updating password
        res.status(500).send(updatePasswordResponse);

    }
});

//Payment

//Upgrade account to premium

// AccountRouter.put("/upgrade", async(req,res)=>{

//     try{

//         if(req.body.upgrade){

//             const dbUpgradeResponseObject = await UserDetailsDatabase.upgradeToPremium(req.body.userName);

//             if(dbUpgradeResponseObject.responseMessage === "Upgrade successful"){
//                 res.status(200).send(dbUpgradeResponseObject);
//             } else if (dbUpgradeResponseObject.responseMessage === "upgrade unsuccessful"){
//                 res.status(500).send(dbUpgradeResponseObject);
//             }
//         } else {
//             throw "error"
//         }

//     }catch(dbUpdateResponseObject){
//         res.status(500).send(dbUpdateResponseObject);
//     }
// })

// //Downgrade account
// AccountRouter.put("/downgrade", async(req,res)=>{

//     try{

//         if(req.body.downgrade){

//             const dbDowngradeResponseObject = await UserDetailsDatabase.downgradeToFree(req.body.userName);

//             if(dbDowngradeResponseObject.responseMessage === "Downgrade successful"){
//                 res.status(200).send(dbDowngradeResponseObject);
//             } else if (dbDowngradeResponseObject.responseMessage === "Downgrade unsuccessful"){
//                 res.status(500).send(dbDowngradeResponseObject);
//             }
//         } else {
//             throw "error"
//         }

//     }catch(dbDowngradeResponseObject){
//         res.status(500).send(dbDowngradeResponseObject);
//     }
// });

//acknowledge
AccountRouter.post("/acknowledgement")

module.exports = AccountRouter;