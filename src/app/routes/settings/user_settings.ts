import * as appTypes from '@appTypes/appTypes';
import UserDetailsDatabase from '@shared/models/user_details/user_details_db';
const authoriseRequest = require("@shared/misc/authorisation");
const express = require('express');

const usersSettingsRouter = express.Router();


usersSettingsRouter.use(express.json());
usersSettingsRouter.use(authoriseRequest);

usersSettingsRouter.post("/update", async(req, res)=>{

    
    try{

        const userSettings: appTypes.UserSettings = req.body;

        const updateUserSettingsResponse = await UserDetailsDatabase.updateUserSettings(userSettings);

        res.status(200).send(updateUserSettingsResponse);

    }catch(updateUserSettingsResponse){

        res.status(500).send(updateUserSettingsResponse);

    }
});


module.exports = usersSettingsRouter;