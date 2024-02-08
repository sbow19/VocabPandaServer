"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const BodyParser = require("body-parser");
const appRouter = express.Router();
//Authenticate function. API Key sent in authorisation header from mobile device.
const verifyDevice = async (req, res, next) => {
    const headers = req.headers;
    const APIKey = "60c0f2bf-c5b4-11ee-bcbd-28d244107ae3"; //Set dummyt api key value here.
    try {
        const responseObject = await users_db_1.default.checkAPIKey(APIKey);
        if (responseObject.responseMessage === "No match found") {
            //We must send an error message back client 
            res.send("Unable to verify device");
        }
        else if (responseObject.responseMessage === "Match found") {
            //Device verified, we can continue to the next route
            console.log("Device verified");
            next();
        }
    }
    catch (e) {
        res.send("Unable to verify device"); //Send message to client indicating that device verification failed.
    }
};
//Start by checking whether api key provided by user matches one in database.
appRouter.use("/", verifyDevice);
//USer credentials provided in request header
appRouter.get("/", async (req, res) => {
    //Review session cookie. 
    res.send("This the is app page");
});
appRouter.use("/login", require("./api/users.js"));
module.exports = appRouter;
//# sourceMappingURL=main.js.map