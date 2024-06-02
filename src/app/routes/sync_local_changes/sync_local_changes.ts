const express = require('express');
import * as appTypes from '@appTypes/appTypes'
import SyncProcess from '@shared/sync/sync';
import * as apiTypes from '@appTypes/api'
const authoriseRequest = require("@shared/misc/authorisation");
const basicAuth = require("basic-auth");

const usersRouter = express.Router();

usersRouter.use(express.json());

//Authorise api request
usersRouter.use(authoriseRequest);

//Check whether there are any requests in backend buffer// triggers alternative syncing logic if so
/* Login time syncing does not need to occur for login data, as logins on both sides need not be the same */
//usersRouter.user();

//Syncing local changes
usersRouter.post("/", async(req: apiTypes.LocalSyncRequestCall, res: apiTypes.BackendSyncResultResponse)=>{

    const syncRequestObject: apiTypes.LocalSyncRequestWrapper<apiTypes.SyncBufferUserContent> = req.body;
    
    const {name: deviceId} = basicAuth(req); // device id and API key

     //Set up standard response data containing necessary info
     const backendLocalSyncResponse: apiTypes.BackendLocalSyncResult = {
        //Identification of sync process
        requestId: syncRequestObject.requestId, //Current sync operation, added to db with flags
        requestIds: [], //Local sync requests processed
        userId: syncRequestObject.userId, 

        //Meta details
        success: false, //false triggers total sync
        message: "operation unsuccessful",
        syncType: "local changes", //Indicating that backend was processing local changes

        //User account details
        userAccountChanges: false, //Changes such as settings, premium status, deletion
        userAccountDetails: {},

        //Local buffer sync
        partialSyncRequired: false,
        syncContent: [], //content added on extension, essentially

        //Where full sync required
        fullSyncRequired: false,
        databaseContents: {}
    }

    //Process sync content
    try{

        const backendSyncResult = await SyncProcess.syncProcess(syncRequestObject, deviceId);

        res.status(200).send(backendSyncResult);
    }catch(e){

        const backendSyncResult = e as apiTypes.BackendLocalSyncResult;

        res.status(500).send(backendSyncResult);

    }



});

module.exports = usersRouter