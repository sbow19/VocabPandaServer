require("dotenv").config();
import UserBuffersDatabase from "@shared/models/user_buffers/user_buffers_db";
import * as appTypes from "@appTypes/appTypes";

class BufferManager {

    //Check whether the user has content in both buffers

    //Add content to buffer, depending on device type.

    /*Flush buffers*/
    //If only one buffer active, then attempt to make changes to front end

    //If both buffers active, then combine both buffers and update each side chronologically

    //Rollback transactions in backend from remaining buffer content and ping both front ends to sync

    //Full database sync with front end

}

export default BufferManager;