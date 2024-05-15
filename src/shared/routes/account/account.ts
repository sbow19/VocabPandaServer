const express = require('express');
import UsersDatabase from "@shared/models/user_logins/users_db"
import UserDetailsDatabase from "@shared/models/user_details/user_details_db";
import VocabPandaEmail from "@shared/misc/verification/email";
import * as appTypes from "@appTypes/appTypes";
const bycrypt = require("bcrypt");
const basicAuth = require("basic-auth");
const authoriseRequest = require("@shared/misc/authorisation");


//Account middleware

const AccountRouter = express.Router();

AccountRouter.use(express.json());

//Test email
AccountRouter.get("/createaccount/verify", async(req, res)=>{

    try{

        if(!req.query.token){
            res.status(401).send("Invalid verification token provided or token expired");
        } else if (req.query.token){

            const result = await VocabPandaEmail.checkToken(req.query.token);

            res.status(200).send("Account verified")
        }

    }catch(e){

        res.status(401).send(e)

    }
    
})

//Authentication

AccountRouter.use(authoriseRequest);


//Create account
AccountRouter.post("/createaccount", async(req, res)=>{

    let userCreds: appTypes.UserCredentials;
    let hashedPassword;

    //get deviceid and API key
    const credentials = basicAuth(req);

    const APIKey = credentials.pass;

    console.log(req.body)


    const APIResponseObject: appTypes.DBAddResponseObject<appTypes.DBAddResponseConfig> = {

        addMessage: "",
        responseMessage: "Add unsuccessful",
        userId: ""
    }
    
    try {
        const salt = await bycrypt.genSalt();
        hashedPassword = await bycrypt.hash(req.body.password, salt);

        //User creds parsed from http post request... This will be a post message
        userCreds = {
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email
        }

    } catch (e){

        res.status(401).send(e)
        return

    } 

    try {

        const dbAddUserResponseObject = await UsersDatabase.createNewUser(userCreds); //Add new user to user_logins db. Verification checks undertaken within function.

        if (dbAddUserResponseObject.responseMessage === "New user could not be added"){

            const addNewUserError = new Error("New user could not be added.", {
                cause: dbAddUserResponseObject.addMessage
            });

            throw addNewUserError;
        };

        //Send email verification link to email provided by user -- If cannot send due to network error, then we don't move to saving the details in the database

        await VocabPandaEmail.sendVerificationEmail(req.body.email);

        //Then we can move onto adding the users details.

        await UserDetailsDatabase.addNewUserDetails(userCreds, dbAddUserResponseObject.addMessage); //Create new user returns  user id in .add.message property

        //Configure API response object 

        APIResponseObject.addMessage = "User added successfully!";
        APIResponseObject.responseMessage = "Add successful";
        APIResponseObject.userId = dbAddUserResponseObject.addMessage;

        console.log(APIResponseObject);

        res.status(200).send(APIResponseObject);
    
    } catch(e){

        APIResponseObject.addMessage = e;
        APIResponseObject.responseMessage = "Add unsuccessful"

        //Error object sent to front end 
        res.status(200).send(APIResponseObject);
    }
    
});




//TODO trigger payment cancellation logic here

AccountRouter.delete("/deleteaccount", async(req, res)=>{

    //verify credentials

    try{
        const dbResponseObject =  await UsersDatabase.deleteUser({
            userName: req.body.userName,
            password: req.body.password,
            identifierType: "username"
        });
    
        res.status(200).send(dbResponseObject);
    } catch(e){
        res.status(500).send();
    }
});


//Update password

AccountRouter.put("/updatepassword", async(req, res)=>{

    try{
        const salt = await bycrypt.genSalt();
        const hashedPassword = await bycrypt.hash(req.body.newPassword, salt);

        const dbResponseObject =  await UsersDatabase.updatePassword({
            userName: req.body.userName,
            password: req.body.password,
            identifierType: "username"
        },
        hashedPassword);
    
        res.status(200).send(dbResponseObject);
    } catch(e){
        res.status(500).send();
    }
});

//Payment

//Upgrade account to premium

AccountRouter.put("/upgrade", async(req,res)=>{

    try{

        if(req.body.upgrade){

            const dbUpgradeResponseObject = await UserDetailsDatabase.upgradeToPremium(req.body.userName);

            if(dbUpgradeResponseObject.responseMessage === "Upgrade successful"){
                res.status(200).send(dbUpgradeResponseObject);
            } else if (dbUpgradeResponseObject.responseMessage === "upgrade unsuccessful"){
                res.status(500).send(dbUpgradeResponseObject);
            }
        } else {
            throw "error"
        }

    }catch(dbUpdateResponseObject){
        res.status(500).send(dbUpdateResponseObject);
    }
})

//Downgrade account

AccountRouter.put("/downgrade", async(req,res)=>{

    try{

        if(req.body.downgrade){

            const dbDowngradeResponseObject = await UserDetailsDatabase.downgradeToFree(req.body.userName);

            if(dbDowngradeResponseObject.responseMessage === "Downgrade successful"){
                res.status(200).send(dbDowngradeResponseObject);
            } else if (dbDowngradeResponseObject.responseMessage === "Downgrade unsuccessful"){
                res.status(500).send(dbDowngradeResponseObject);
            }
        } else {
            throw "error"
        }

    }catch(dbDowngradeResponseObject){
        res.status(500).send(dbDowngradeResponseObject);
    }
})

module.exports = AccountRouter;