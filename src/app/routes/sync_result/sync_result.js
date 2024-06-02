"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const user_sync_db_1 = __importDefault(require("@shared/models/user_sync/user_sync_db"));
const sync_1 = __importDefault(require("@shared/sync/sync"));
const authoriseRequest = require("@shared/misc/authorisation/authorisation");
const basicAuth = require("basic-auth");
const usersRouter = express.Router();
usersRouter.use(express.json());
//Authorise api request
usersRouter.use(authoriseRequest);
/*
    FE posts results of backend buffer sync result which either fails or succeeds:
    1) If fails: BE sends total sync content to FE and maintains sync flag
    2) If succeeds: BE sends acknowledgement and dropds sync flag (if request if correct)

    FE posts result of total sync
    1) If fails: BE sends acknowledgement and maintains sync flag
    2) if succeeds: BE sends acknowledgement and drops sync flag (if request id correct)
*/
//Syncing local changes
usersRouter.post("/", async (req, res) => {
    const syncResultObject = req.body;
    const { name: deviceId } = basicAuth(req); // device id and API key
    //Set up standard response data containing necessary info
    const backendLocalSyncResult = {
        //Identification of sync process
        requestId: syncResultObject.requestId, //Current sync operation, added to db with flags
        requestIds: [], //Local sync requests processed
        userId: syncResultObject.userId,
        //Meta details
        success: false, //false triggers total sync
        message: "operation unsuccessful",
        syncType: "total sync", //Indicating that backend was processing login sync
        operationType: "sync result",
        //User account details
        userAccountChanges: false, //Changes such as settings, premium status, deletion
        userAccountDetails: {},
        //Local buffer sync
        partialSyncRequired: false,
        syncContent: [], //content added on extension, essentially
        //Where full sync required
        fullSyncRequired: false,
        databaseContents: {}
    };
    //Check first to see if local sync was successful
    try {
        let acknowledgement = {
            requestId: deviceId,
            userId: syncResultObject.userId,
            operationType: "acknowledgement"
        };
        if (syncResultObject.userContentSync.valid) {
            //Local sync was successful
            const syncFlagResult = await user_sync_db_1.default.checkSyncFlags(syncResultObject.userId, [syncResultObject.requestId], deviceId);
            //Check sync flag will throw error if fails.
            res.status(200).send(acknowledgement);
        }
        else if (!syncResultObject.userContentSync.valid && syncResultObject.syncType === "partial sync") {
            //Throw error and start full sync
            backendLocalSyncResult.fullSyncRequired = true;
            throw backendLocalSyncResult;
        }
        else if (!syncResultObject.userContentSync.valid && syncResultObject.syncType === "total sync") {
            //Send acknowledgement and maintain full sync flag. Will send backend content on next cycle.
            res.status(200).send(acknowledgement);
        }
    }
    catch (e) {
        if (e.fullSyncRequired) {
            const prepareFullSyncResponse = await sync_1.default.prepareFullSyncContent(syncResultObject.userId, syncResultObject.requestId, deviceId, syncResultObject.deviceType);
            backendLocalSyncResult.fullSyncRequired = true;
            backendLocalSyncResult.databaseContents = prepareFullSyncResponse.resultArray;
            res.status(500).send(backendLocalSyncResult);
        }
        else {
            //Some error processing sync result 
            res.status(500).send(backendLocalSyncResult);
        }
    }
});
module.exports = usersRouter;
//# sourceMappingURL=sync_result.js.map