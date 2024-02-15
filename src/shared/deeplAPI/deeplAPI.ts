require("dotenv").config();
const cors = require('cors');
const express = require('express');
import * as appTypes from "@appTypes/appTypes";
const authoriseRequest = require("@shared/misc/authorisation");
import UserDetailsDatabase from "@shared/models/user_details/user_details_db";

const DeeplAPI = express.Router();

DeeplAPI.use(express.json());

DeeplAPI.use(authoriseRequest);  //Check the device from which api call is made

DeeplAPI.use(cors());

DeeplAPI.post("/", async(req, res)=>{

    const username = req.body.userName;
    const userRequest: appTypes.userRequest = req.body.userRequest

    try{

        //Need to validate request string here (length);

        if(userRequest.target_text.trim().length < 3){
            throw {
                error: "String must be at least three characters long"
            }
        }

        //Need to check the database to see whether user is allowed to make translation;

        await UserDetailsDatabase.checkTranslationsLeft(username); //Promise rejected if no translations left
        

        const translationResult = await fetch(
            "https://api-free.deepl.com/v2/translate", {
                method: "POST",
                headers:{
                    "Authorization": `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
                    "User-Agent": "Chrome/119.0.0.0",
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    "text":[`${userRequest.target_text}`],
                    "source_lang": `${userRequest.target_text_lang}`,
                    "target_lang":`${userRequest.output_lang}`
                })
            }
        )


        const {translations} = await translationResult.json();


        if(translations){

            const translationsLeft = await UserDetailsDatabase.updateTranslationsLeft(username);
            

            res.status(200).json(
                {
                    translations, 
                    translationsLeft: translationsLeft
                }
            );

        } else {

            throw "error"
        }


    }catch(e){
        res.status(500).send(e);
    }

});


module.exports = DeeplAPI;