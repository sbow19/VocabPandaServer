const express = require('express');
import * as appTypes from "@appTypes/appTypes";
const authoriseRequest = require("@shared/misc/authorisation");
import UsersContentDatabase from "@shared/models/user_content/user_content_db";

const DeeplAPI = express.router();

DeeplAPI.use(express.json());

DeeplAPI.use(authoriseRequest);  //Check the device from which api call is made

DeeplAPI.post("/", async(req, res)=>{

    const username = req.body.userName;
    const userRequest: appTypes.userRequest = req.body.userRequest

    //Need to validate request string here (length);

    //Need to check the database to see whether user is allowed to make translation;




})


module.exports = DeeplAPI;