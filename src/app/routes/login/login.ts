const express = require('express');
import UsersDatabase from '@shared/models/user_logins/users_db';
import UserDetailsDatabase from '@shared/models/user_details/user_details_db';
import * as apiTypes from '@appTypes/api'
import SyncProcess from '@shared/sync/sync';
const authoriseRequest = require("@shared/misc/authorisation/authorisation");
const basicAuth = require("basic-auth");

const usersRouter = express.Router();

usersRouter.use(express.json());

//Authorise api request
usersRouter.use(authoriseRequest);

//Check whether there are any requests in backend buffer// triggers alternative syncing logic if so
/* Login time syncing does not need to occur for login data, as logins on both sides need not be the same */
//usersRouter.user();

//Login
usersRouter.post("/", async(req: apiTypes.LocalSyncRequestCall, res: apiTypes.BackendSyncResultResponse)=>{

    const loginResultObject: apiTypes.LocalSyncRequestWrapper<apiTypes.APIContentCallDetails> = req.body;

    const loginContents: apiTypes.LoginResult = loginResultObject.loginContents;

    const {name: deviceId} = basicAuth(req); // device id and APIK key

    //Set up standard response data containing necessary info
    const backendLocalSyncResult: apiTypes.BackendLocalSyncResult = {
        //Identification of sync process
        requestId: loginResultObject.requestId, //Current sync operation, added to db with flags
        requestIds: [], //Local sync requests processed
        userId: loginResultObject.userId, 

        //Meta details
        success: false, //false triggers total sync
        syncType: "login", //Indicating that backend is processing login sync
        errorType: "",

        //User account details
        userAccountChanges: false, //Changes such as premium status, deletion, and verification status
        userAccountDetails: {},

        //Local buffer sync
        partialSyncRequired: false,
        syncContent: [], //content added on extension, essentially

        //Where full sync required
        fullSyncRequired: false,
        databaseContents: {}
    }


    //Check if user still exists
    try{
        //Check if user has been deleted
        const userExistFlag = await UsersDatabase.userExists(loginResultObject.userId);

        if(!userExistFlag.match){
            //If user no longer exists, then delete flag is sent to frontend removing user
            backendLocalSyncResult.userAccountChanges = true;
            backendLocalSyncResult.userAccountDetails = {
                userDeleted: true
            };

            res.status(500).send(backendLocalSyncResult);
            
        }else if (userExistFlag){
           //Continue
        }

    }catch(e){

        res.status(500).send(backendLocalSyncResult);
        return //End execution
    }

    //Check if user password has changed since
    try{
        await UsersDatabase.isCorrectPassword(loginContents);

    }catch(e){
        
        if(e.specificErrorCode === "No rows affected"){
            
            backendLocalSyncResult.errorType = "Password incorrect"
            res.status(500).send(backendLocalSyncResult)
        }else {

            backendLocalSyncResult.errorType = "Miscellaneous error"
            res.status(500).send(backendLocalSyncResult)
            
        }

        return // End execution

    }

    try{

        //Update backend record of user login
        await UserDetailsDatabase.updateLastLoggedIn(loginResultObject.userId);

    }catch(e){

        //Carry on with code if there is a rejection here. last logged in time is not that
        //important

    }

    //Send user account details
    try{

        const accountDetails = await UsersDatabase.getAccountDetails(loginResultObject.userId);

        backendLocalSyncResult.userAccountDetails = accountDetails.resultArray;

    }catch(e){

        if(e.specificErrorCode === "User not verified"){

            backendLocalSyncResult.errorType = "User not verified"
            res.status(500).send(backendLocalSyncResult);

        }else{

            backendLocalSyncResult.errorType = "Miscellaneous error"
            res.status(500).send(backendLocalSyncResult);

        }

        return
        
    }

    //Process content queues in requests
    try{

        const backendSyncResult = await SyncProcess.syncProcess(loginResultObject, deviceId);

        res.status(200).send(backendSyncResult);
    }catch(e){

        const backendSyncResult = e as apiTypes.BackendLocalSyncResult;

        res.status(500).send(backendSyncResult);

    }
});

module.exports = usersRouter