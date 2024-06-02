"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const basicAuth = require("basic-auth");
const authoriseRequest = async (req, res, next) => {
    try {
        // console.log(req)
        const credentials = basicAuth(req);
        if (!credentials || !credentials.name || !credentials.pass) {
            res.status(401).send('Authentication required');
            return;
        }
        const dbResult = await users_db_1.default.checkCredentials(credentials);
        if (dbResult.responseMessage === "No match found") {
            throw dbResult;
        }
        else if (dbResult.responseMessage === "Match found") {
            next();
        }
    }
    catch (e) {
        return res.status(401).send(e);
    }
};
module.exports = authoriseRequest;
//# sourceMappingURL=authorisation.js.map