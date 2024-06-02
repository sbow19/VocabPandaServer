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
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const authoriseRequest = require("@shared/misc/authorisation/authorisation");
const appRouter = express.Router();
//Authenticate function. API Key sent in authorisation header from mobile device.
//Start by checking whether api key provided by user matches one in database.
appRouter.use(authoriseRequest);
//USer credentials provided in request header
appRouter.get("/", async (req, res) => {
    res.send("This the is app page");
});
//When user logs into app or extension
appRouter.use("/login", require("./login/login.js"));
//When user updates settings
appRouter.use("/settings", require("./settings/user_settings.js"));
//Local changes from the front end
appRouter.use("/synclocalchanges", require("./sync_local_changes/sync_local_changes.js"));
//Sync results sent from the front end
appRouter.use("/syncresult", require("./sync_result/sync_result.js"));
//Acknowledgements sent from the app frontend
// appRouter.use("/acknowledgement", require("./acknowledgement/acknowledgement.js"))
module.exports = appRouter;
//# sourceMappingURL=main.js.map