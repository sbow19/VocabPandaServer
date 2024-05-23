//This module will sit in front of requests to update the database to manage buffers.

import UserBuffersDatabase from "@shared/models/user_buffers/user_buffers_db";

const manageBuffers = async(req, res, next)=>{

    try{

        const userRequest = req.body;

        if(userRequest.userId){
            //If there is a user id, check no of device types
            const maxDeviceTypes = await UserBuffersDatabase.getNoOfUserDeviceTypes(userRequest.userId);

            if(maxDeviceTypes.customResponse === "2 device types"){
                //Request must be forwarded to buffer processing 

            }else if (maxDeviceTypes.customResponse === "less than 2 device types"){

            }

        }else{
            //Skip middleware if there is no user id, as user has not been created in this instance.
            next();
        }

    }catch(e){

    }


};

module.exports = manageBuffers;