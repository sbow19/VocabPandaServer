"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const user_details_db_1 = __importDefault(require("@shared/models/user_details/user_details_db"));
const email_1 = __importDefault(require("@shared/misc/verification/email"));
const bycrypt = require("bcrypt");
const basicAuth = require("basic-auth");
const authoriseRequest = require("@shared/misc/authorisation");
//Account middleware
const AccountRouter = express.Router();
AccountRouter.use(express.json());
//Test email
AccountRouter.get("/createaccount/verify", async (req, res) => {
    try {
        if (!req.query.token) {
            res.status(401).send("Invalid verification token provided or token expired");
        }
        else if (req.query.token) {
            const result = await email_1.default.checkToken(req.query.token);
            res.status(200).send("Account verified");
        }
    }
    catch (e) {
        res.status(401).send(e);
    }
});
//Authentication
AccountRouter.use(authoriseRequest);
//Create account
AccountRouter.post("/createaccount", async (req, res) => {
    let userCreds = req.body;
    let deviceCreds = {};
    let hashedPassword;
    //get deviceid and API key
    const credentials = basicAuth(req);
    deviceCreds = credentials;
    try {
        const salt = await bycrypt.genSalt();
        hashedPassword = await bycrypt.hash(req.body.password, salt);
        //User creds parsed from http post request... This will be a post message
        userCreds = {
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email
        };
    }
    catch (e) {
        res.status(401).send(e);
        return;
    }
    try {
        const addUserResponse = await users_db_1.default.createNewUser(userCreds, deviceCreds); //Add new user to user_logins db. Verification checks undertaken within function.
        if (!addUserResponse.success) {
            throw addUserResponse;
        }
        ;
        //Then we can move onto adding the users details.
        await user_details_db_1.default.addNewUserDetails(userCreds, addUserResponse.userId); //Create new user returns  user id in .add.message property
        //Send email verification link to email provided by user -- If cannot send due to network error, then we don't move to saving the details in the database
        await email_1.default.sendVerificationEmail(req.body.email);
        //Configure API response object 
        res.status(200).send(addUserResponse);
    }
    catch (e) {
        if (e.customResponse === "user exists") {
            res.status(500).send(e);
        }
        else {
            //If some other error apart from user existing
            res.status(500).send(e);
            try {
                const deleteResponseObject = await users_db_1.default.deleteUser({
                    userId: userCreds.username,
                    password: req.body.password,
                });
                console.log(deleteResponseObject);
            }
            catch (e) {
                console.log(e, "Create account operation");
            }
        }
    }
});
//TODO trigger payment cancellation logic here
AccountRouter.post("/deleteaccount", async (req, res) => {
    //verify credentials
    try {
        const userCredentials = req.body;
        const accountDeletionResponse = await users_db_1.default.deleteUser(userCredentials);
        res.status(200).send(accountDeletionResponse);
    }
    catch (accountDeletionResponse) {
        res.status(500).send(accountDeletionResponse);
    }
});
//Update password
AccountRouter.post("/updatepassword", async (req, res) => {
    const accountDetails = req.body;
    try {
        const dbResponseObject = await users_db_1.default.updatePassword(accountDetails);
        res.status(200).send(dbResponseObject);
    }
    catch (dbResponseObject) {
        res.status(500).send(dbResponseObject);
    }
});
//Payment
//Upgrade account to premium
AccountRouter.put("/upgrade", async (req, res) => {
    try {
        if (req.body.upgrade) {
            const dbUpgradeResponseObject = await user_details_db_1.default.upgradeToPremium(req.body.userName);
            if (dbUpgradeResponseObject.responseMessage === "Upgrade successful") {
                res.status(200).send(dbUpgradeResponseObject);
            }
            else if (dbUpgradeResponseObject.responseMessage === "upgrade unsuccessful") {
                res.status(500).send(dbUpgradeResponseObject);
            }
        }
        else {
            throw "error";
        }
    }
    catch (dbUpdateResponseObject) {
        res.status(500).send(dbUpdateResponseObject);
    }
});
//Downgrade account
AccountRouter.put("/downgrade", async (req, res) => {
    try {
        if (req.body.downgrade) {
            const dbDowngradeResponseObject = await user_details_db_1.default.downgradeToFree(req.body.userName);
            if (dbDowngradeResponseObject.responseMessage === "Downgrade successful") {
                res.status(200).send(dbDowngradeResponseObject);
            }
            else if (dbDowngradeResponseObject.responseMessage === "Downgrade unsuccessful") {
                res.status(500).send(dbDowngradeResponseObject);
            }
        }
        else {
            throw "error";
        }
    }
    catch (dbDowngradeResponseObject) {
        res.status(500).send(dbDowngradeResponseObject);
    }
});
module.exports = AccountRouter;
//# sourceMappingURL=account.js.map