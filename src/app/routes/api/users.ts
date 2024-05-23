const {v4: uuidv4 } = require('uuid');
const express = require('express');
import UsersDatabase from '@shared/models/user_logins/users_db';
import UserDetailsDatabase from '@shared/models/user_details/user_details_db';
import * as appTypes from '@appTypes/appTypes'
import UserBuffersDatabase from '@shared/models/user_buffers/user_buffers_db';
const authoriseRequest = require("@shared/misc/authorisation");
const basicAuth = require("basic-auth");

const usersRouter = express.Router();

usersRouter.use(express.json());

//Authorise api request
usersRouter.use(authoriseRequest);

//Check whether there are any requests in backend buffer// triggers alternative syncing logic if so
/* Login time syncing does not need to occur for login data, as logins on both sides need not be the same */
//usersRouter.user();

//Login
usersRouter.post("/", async(req, res)=>{

    

    const loginResultObject: appTypes.APILoginResult = req.body.loginResultObject;

    const syncObject: appTypes.APIPostLoginSetUp = {

        userSettings: {},
        userPremiumStatus: false,
        userDeleted: false,
        userContent: [],
        userId: loginResultObject.userId
    }

    try{
        //Check if user has been deleted
        const userExistFlag = await UsersDatabase.userExists(loginResultObject.userId);

        if(!userExistFlag.match){
            //If user no longer exists, then delete flag is sent to frontend removing user
            syncObject.userDeleted = {
                valid: true,
                userId: loginResultObject.userId
            };
            res.status(200).send(syncObject);
        }

    }catch(e){

        res.status(500).send("Backend error");
    }

    //Check whether login was successful locally. Otherwise, we need to conduct login here.
    if(loginResultObject.loginSuccess){

        try{

            //Update backend record of user login
            const dbUpdateResponse = await UserDetailsDatabase.updateLastLoggedIn(loginResultObject.username);

            //Fetch syncing update object from the backend
            syncObject.userSettings = await UserDetailsDatabase.getUserSettings(loginResultObject.userId);

            syncObject.userPremiumStatus = await UserDetailsDatabase.checkPremiumStatus(loginResultObject.userId);

            syncObject.userContent = await UserBuffersDatabase.fetchBufferContent(loginResultObject.deviceType, loginResultObject.userId);

            res.status(200).send(syncObject); 

        }catch(e){

            res.status(500).send(e)

        }
        
    } 
    
    // else if(!loginResultObject.loginSuccess){
    //     //Possibly deprecated... Only fires if login was unsuccessful locally...

    //     try{
    //         const dbMatchResponse = await UsersDatabase.loginUser(userCredentials);
            
    //         if(dbMatchResponse.matchMessage === "Username or password does not match"){
    //             res.status(200).send("Your details are incorrect")
    //         }
    //         if(dbMatchResponse.matchMessage === "User credentials verified"){
    
    //             let dbUpdateResponseObject = await UserDetailsDatabase.updateLastLoggedIn(dbMatchResponse.username)
                
    //             //Fetch syncing update object from the backend
    //             syncObject.userSettings = await UserDetailsDatabase.getUserSettings(loginResultObject.userId);

    //             syncObject.userPremiumStatus = await UserDetailsDatabase.checkPremiumStatus(loginResultObject.userId);

    //             syncObject.userContent = await UserBuffersDatabase.fetchBufferContent(loginResultObject.userId);
    //             res.status(200).send(dbUpdateResponseObject)
    
    //         }
    
    //     }catch(e){
    
    //         res.status(500).send(e)

    //     }

    }

    
});





module.exports = usersRouter