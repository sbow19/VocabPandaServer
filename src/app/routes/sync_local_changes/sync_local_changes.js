"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const sync_1 = __importDefault(require("@shared/sync/sync"));
const authoriseRequest = require("@shared/misc/authorisation/authorisation");
const basicAuth = require("basic-auth");
const usersRouter = express.Router();
usersRouter.use(express.json());
//Authorise api request
usersRouter.use(authoriseRequest);
//Check whether there are any requests in backend buffer// triggers alternative syncing logic if so
/* Login time syncing does not need to occur for login data, as logins on both sides need not be the same */
//usersRouter.user();
//Syncing local changes
usersRouter.post("/", async (req, res) => {
    const syncRequestObject = req.body;
    const { name: deviceId } = basicAuth(req); // device id and API key
    //Set up standard response data containing necessary info
    const backendLocalSyncResponse = {
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
    };
    //Process sync content
    try {
        const backendSyncResult = await sync_1.default.syncProcess(syncRequestObject, deviceId);
        res.status(200).send(backendSyncResult);
    }
    catch (e) {
        const backendSyncResult = e;
        res.status(500).send(backendSyncResult);
    }
});
module.exports = usersRouter;
//# sourceMappingURL=sync_local_changes.js.map