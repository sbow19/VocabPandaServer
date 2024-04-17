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
//Account middleware
const AccountRouter = express.Router();
AccountRouter.use(express.json());
//Create account
AccountRouter.post("/createaccount", async (req, res) => {
    let userCreds;
    let hashedPassword;
    try {
        const salt = await bycrypt.genSalt();
        hashedPassword = await bycrypt.hash(req.body.password, salt);
        //get deviceid and API key
        const credentials = basicAuth(req);
        //Check if password, username, and password is provided
        if (!credentials || !credentials.name || !credentials.pass) {
            throw "No credentials provided";
        }
        //User creds parsed from http post request... This will be a post message
        userCreds = {
            userName: req.body.userName,
            password: hashedPassword,
            email: req.body.email,
            deviceId: credentials.name,
            apiKey: credentials.pass
        };
    }
    catch (e) {
        res.status(401).send(e);
        return;
    }
    try {
        const dbResponseObject = await users_db_1.default.createNewUser(userCreds); //Add new user to user_logins db
        //Assuming that the user was created and the promise resovled, then we can move onto adding the users details.
        const addUserResponseObject = await user_details_db_1.default.addNewUserDetails(userCreds, dbResponseObject.addMessage); //Create new user returns  user id in .add.message property
        //Send email verification link to email provided by user
        let result = await email_1.default.sendVerificationEmail(req.body.email);
        res.status(200).send({ dbResponseObject, addUserResponseObject });
    }
    catch (e) {
        res.status(500).send(e);
    }
});
//Test email
AccountRouter.get("/createaccount/verify", async (req, res) => {
    console.log("Hello world");
    try {
        console.log(req.query.token);
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
//TODO trigger payment cancellation logic here
AccountRouter.delete("/deleteaccount", async (req, res) => {
    //verify credentials
    try {
        const dbResponseObject = await users_db_1.default.deleteUser({
            userName: req.body.userName,
            password: req.body.password,
            identifierType: "username"
        });
        res.status(200).send(dbResponseObject);
    }
    catch (e) {
        res.status(500).send();
    }
});
//Update password
AccountRouter.put("/updatepassword", async (req, res) => {
    try {
        const salt = await bycrypt.genSalt();
        const hashedPassword = await bycrypt.hash(req.body.newPassword, salt);
        const dbResponseObject = await users_db_1.default.updatePassword({
            userName: req.body.userName,
            password: req.body.password,
            identifierType: "username"
        }, hashedPassword);
        res.status(200).send(dbResponseObject);
    }
    catch (e) {
        res.status(500).send();
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