"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const basicAuth = require("basic-auth");
const authoriseRequest = async (req, res, next) => {
    const authenticationOperation = {
        requestId: req.body.requestId,
        success: false,
        operationType: "Authentication",
        errorType: "Device not authorised"
    };
    try {
        // console.log(req)
        const credentials = basicAuth(req);
        if (!credentials || !credentials.name || !credentials.pass) {
            res.status(401).send('Authentication required');
            return;
        }
        await users_db_1.default.areCredentialsCorrect(credentials);
        next();
    }
    catch (e) {
        const DBOperation = e;
        if (DBOperation.specificErrorCode === "No rows affected") {
            //User not authorised
            return res.status(401).send(authenticationOperation);
        }
        else {
            authenticationOperation.errorType = "Miscellaneous error";
            return res.status(401).send(authenticationOperation);
        }
    }
};
module.exports = authoriseRequest;
//# sourceMappingURL=authorisation.js.map