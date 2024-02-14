"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const user_details_db_1 = __importDefault(require("@shared/models/user_details/user_details_db"));
const authoriseRequest = require("@shared/misc/authorisation");
const usersRouter = express.Router();
usersRouter.use(express.json());
usersRouter.use(authoriseRequest);
//Login
usersRouter.post("/", async (req, res) => {
    //Replace with req.body
    const userCredentials = {
        userName: req.body.userName,
        password: req.body.password,
        identifierType: req.body.identifierType
    };
    try {
        const dbMatchResponse = await users_db_1.default.loginUser(userCredentials);
        if (dbMatchResponse.matchMessage === "Username or password does not match") {
            res.status(200).send("Your details are incorrect");
        }
        if (dbMatchResponse.matchMessage === "User credentials verified") {
            let dbUpdateResponseObject = await user_details_db_1.default.updateLastLoggedIn(dbMatchResponse.username);
            //Trigger sync middleware procedure
            res.send(dbUpdateResponseObject);
        }
    }
    catch (e) {
        res.send(e);
    }
});
module.exports = usersRouter;
//# sourceMappingURL=users.js.map