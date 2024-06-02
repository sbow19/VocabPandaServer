require("dotenv").config();
const cors = require('cors');
const express = require('express');
import * as appTypes from "@appTypes/appTypes";
const authoriseRequest = require("@shared/misc/authorisation/authorisation");
import UserDetailsDatabase from "@shared/models/user_details/user_details_db";

const DeeplAPI = express.Router();

DeeplAPI.use(express.json());

DeeplAPI.use(authoriseRequest);  //Check the device from which api call is made

DeeplAPI.use(cors());

DeeplAPI.post("/", async(req, res)=>{

    const userRequest: appTypes.APITranslateCall = req.body;

    const translationResponse: appTypes.APITranslateResponse = {
        success: false,
        message: "operation unsuccessful"
    }

    try{

        //Need to validate request string here (length);

        if(userRequest.targetText.trim().length < 3){
            throw {
                error: "String must be at least three characters long"
            }
        }

        //Need to check the database to see whether user is allowed to make translation;

        await UserDetailsDatabase.checkTranslationsLeft(userRequest.username); //Promise rejected if no translations left
        

        const translationResult = await fetch(
            "https://api-free.deepl.com/v2/translate", {
                method: "POST",
                headers:{
                    "Authorization": `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
                    "User-Agent": "Chrome/119.0.0.0",
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    "text":[`${userRequest.targetText}`],
                    "source_lang": `${userRequest.targetLanguage}`,
                    "target_lang":`${userRequest.outputLanguage}`
                })
            }
        );

        const {translations} = await translationResult.json();

        if(translations){

            const responseObject = await UserDetailsDatabase.updateTranslationsLeft(userRequest.username);

            translationResponse.success = true;
            translationResponse.translationRefreshTime = responseObject.translationRefreshTime;
            translationResponse.translationsLeft = responseObject.translationsLeft;
            translationResponse.translations = translations;
            translationResponse.message = "operation successful"
            

            res.status(200).send(translationResponse);

        } else {

            throw "error"
        }


    }catch(e){
        console.log(e);
        console.log(e.message)
        translationResponse.error = e
        translationResponse.message = "misc error"
        res.status(500).send(translationResponse);
    }

});


module.exports = DeeplAPI;