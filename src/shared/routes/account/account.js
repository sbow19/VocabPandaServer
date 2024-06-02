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
const authoriseRequest = require("@shared/misc/authorisation/authorisation");
//Account middleware
const AccountRouter = express.Router();
AccountRouter.use(express.json());
//Test email
AccountRouter.get("/createaccount/verify", async (req, res) => {
    const verificationToken = req.query.token;
    const verificationResponse = {
        success: false,
        operationType: "verify email",
        errorType: ""
    };
    try {
        if (!req.query.token) {
            verificationResponse.errorType = "Invalid token";
            res.status(401).send(verificationResponse);
        }
        else if (req.query.token) {
            await email_1.default.verifyEmailToken(verificationToken);
            res.status(200).send(verificationResponse);
        }
    }
    catch (e) {
        const operationError = e;
        if (operationError.specificErrorCode === "No rows affected") {
            verificationResponse.errorType = "Verification token expired";
        }
        else {
            verificationResponse.errorType = "Miscellaneous error";
            res.status(401).send(verificationResponse);
        }
    }
});
//Authentication
AccountRouter.use(authoriseRequest);
//Create account
AccountRouter.post("/createaccount", async (req, res) => {
    let userCreds = req.body.accountOperationDetails;
    let hashedPassword;
    //get deviceid and API key
    const credentials = basicAuth(req);
    //Backendoperation Response
    const createAccountResponse = {
        success: false
    };
    try {
        const salt = await bycrypt.genSalt();
        hashedPassword = await bycrypt.hash(userCreds.password, salt);
        //User creds parsed from http post request... This will be a post message
        userCreds.password = hashedPassword;
    }
    catch (e) {
        res.status(401).send(e);
        return;
    }
    try {
        //Add new user to user_logins db. Verification checks undertaken within function.
        const addUserResponse = await users_db_1.default.createNewUser(userCreds, credentials);
        //Then we can move onto adding the users details.
        await user_details_db_1.default.addNewUserDetails(userCreds, addUserResponse.resultArray, credentials.name); //Create new user returns  user id in .add.message property
    }
    catch (e) {
        if (e.code === "ER_DUP_UNIQUE") {
            createAccountResponse.operationType = "create account";
            createAccountResponse.ErrorType = "User exists";
            res.status(500).send(createAccountResponse);
        }
        else {
            createAccountResponse.operationType = "create account";
            createAccountResponse.ErrorType = "Miscellaneous error";
            res.status(500).send(createAccountResponse);
        }
        return;
    }
    try {
        //Send email verification link to email provided by user -- If cannot send due to network error, then we don't move to saving the details in the database
        await email_1.default.sendVerificationEmail(userCreds.email);
    }
    catch (e) {
        res.status(500).send(createAccountResponse);
        try {
            await users_db_1.default.deleteUser({
                userId: userCreds.username,
                password: userCreds.password,
                dataType: "account"
            });
        }
        catch (e) {
            //Some error deleting the account details
        }
        return;
    }
    createAccountResponse.success = true;
    res.status(200).send(createAccountResponse);
});
//TODO trigger payment cancellation logic here
AccountRouter.post("/deleteaccount", async (req, res) => {
    const userCredentials = req.body.accountOperationDetails;
    //Backendoperation Response
    const deleteAccountResponse = {
        success: false,
        operationType: "delete account"
    };
    try {
        await users_db_1.default.deleteUser(userCredentials);
        res.status(200).send(deleteAccountResponse);
    }
    catch (e) {
        res.status(500).send(deleteAccountResponse);
    }
});
//Update password
AccountRouter.post("/updatepassword", async (req, res) => {
    const accountDetails = req.body.accountOperationDetails;
    //Backendoperation Response
    const updatePasswordResponse = {
        success: false,
        operationType: "change password"
    };
    try {
        await users_db_1.default.updatePassword(accountDetails);
        res.status(200).send(updatePasswordResponse);
    }
    catch (e) {
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
AccountRouter.post("/acknowledgement");
module.exports = AccountRouter;
//# sourceMappingURL=account.js.map