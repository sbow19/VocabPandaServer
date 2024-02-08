"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const user_details_db_1 = __importDefault(require("@shared/models/user_details/user_details_db"));
const bycrypt = require("bcrypt");
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
        //User creds parsed from http post request... This will be a post message
        userCreds = {
            userName: req.body.userName,
            password: hashedPassword,
            email: req.body.email,
        };
    }
    catch (e) {
        res.status(500);
    }
    try {
        const dbResponseObject = await users_db_1.default.createNewUser(userCreds); //Add new user to user_logins db
        if (dbResponseObject.addMessage === "Username or email already exists") {
            res.status(500).send(dbResponseObject);
        }
        else if (dbResponseObject.addMessage === "Unknown error") {
            res.status(500).send(dbResponseObject);
        }
        else {
            const addUserResponseObject = await user_details_db_1.default.addNewUserDetails(userCreds, dbResponseObject.addMessage);
            res.status(200).send({ dbResponseObject, addUserResponseObject });
        }
    }
    catch (e) {
        res.status(500).send(e);
    }
});
//Delete account (this code could be handled on the client side, but woudl rather handle it here);
//TODO trigger payment cancellation logic here
AccountRouter.delete("/deleteaccount", async (req, res) => {
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
module.exports = AccountRouter;
//# sourceMappingURL=account.js.map