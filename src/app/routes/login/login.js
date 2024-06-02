"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const user_details_db_1 = __importDefault(require("@shared/models/user_details/user_details_db"));
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
//Login
usersRouter.post("/", async (req, res) => {
    const loginResultObject = req.body;
    const loginContents = loginResultObject.loginContents;
    const { name: deviceId } = basicAuth(req); // device id and APIK key
    //Set up standard response data containing necessary info
    const backendLocalSyncResult = {
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
    };
    //Check if user still exists
    try {
        //Check if user has been deleted
        const userExistFlag = await users_db_1.default.userExists(loginResultObject.userId);
        if (!userExistFlag.match) {
            //If user no longer exists, then delete flag is sent to frontend removing user
            backendLocalSyncResult.userAccountChanges = true;
            backendLocalSyncResult.userAccountDetails = {
                userDeleted: true
            };
            res.status(500).send(backendLocalSyncResult);
        }
        else if (userExistFlag) {
            //Continue
        }
    }
    catch (e) {
        res.status(500).send(backendLocalSyncResult);
        return; //End execution
    }
    //Check if user password has changed since
    try {
        await users_db_1.default.isCorrectPassword(loginContents);
    }
    catch (e) {
        if (e.specificErrorCode === "No rows affected") {
            backendLocalSyncResult.errorType = "Password incorrect";
            res.status(500).send(backendLocalSyncResult);
        }
        else {
            backendLocalSyncResult.errorType = "Miscellaneous error";
            res.status(500).send(backendLocalSyncResult);
        }
        return; // End execution
    }
    try {
        //Update backend record of user login
        await user_details_db_1.default.updateLastLoggedIn(loginResultObject.userId);
    }
    catch (e) {
        //Carry on with code if there is a rejection here. last logged in time is not that
        //important
    }
    //Send user account details
    try {
        const accountDetails = await users_db_1.default.getAccountDetails(loginResultObject.userId);
        backendLocalSyncResult.userAccountDetails = accountDetails.resultArray;
    }
    catch (e) {
        if (e.specificErrorCode === "User not verified") {
            backendLocalSyncResult.errorType = "User not verified";
            res.status(500).send(backendLocalSyncResult);
        }
        else {
            backendLocalSyncResult.errorType = "Miscellaneous error";
            res.status(500).send(backendLocalSyncResult);
        }
        return;
    }
    //Process content queues in requests
    try {
        const backendSyncResult = await sync_1.default.syncProcess(loginResultObject, deviceId);
        res.status(200).send(backendSyncResult);
    }
    catch (e) {
        const backendSyncResult = e;
        res.status(500).send(backendSyncResult);
    }
});
module.exports = usersRouter;
//# sourceMappingURL=login.js.map