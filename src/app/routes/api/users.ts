const {v4: uuidv4 } = require('uuid');
const express = require('express');
import UsersDatabase from '@shared/models/user_logins/users_db';
import UserDetailsDatabase from '@shared/models/user_details/user_details_db';
import * as appTypes from '@appTypes/appTypes'
const authoriseRequest = require("@shared/misc/authorisation");
const basicAuth = require("basic-auth");

const usersRouter = express.Router();

usersRouter.use(express.json());
usersRouter.use(authoriseRequest);

//Login
usersRouter.post("/", async(req, res)=>{

    const loginResultObject: appTypes.APILoginUser = req.body.loginResultObject;

    //Check whether login was successful locally. Otherwise, we need to conduct login here.
    if(loginResultObject.loginSuccess){
        
        try{

            const dbUpdateResponseObject = await UserDetailsDatabase.updateLastLoggedIn(loginResultObject.username)
            //Trigger sync middleware procedure
            res.status(200).send(dbUpdateResponseObject)


        }catch(e){

            res.status(500).send("Backend error");
        }
        
    } else if(!loginResultObject.loginSuccess){

        try{
            const dbMatchResponse = await UsersDatabase.loginUser(userCredentials);
            
            if(dbMatchResponse.matchMessage === "Username or password does not match"){
                res.status(200).send("Your details are incorrect")
            }
            if(dbMatchResponse.matchMessage === "User credentials verified"){
    
                let dbUpdateResponseObject = await UserDetailsDatabase.updateLastLoggedIn(dbMatchResponse.username)
                //Trigger sync middleware procedure
                res.send(dbUpdateResponseObject)
    
            }
    
        }catch(e){
    
            res.status(500).send(e)

        }

    }

    
});





module.exports = usersRouter