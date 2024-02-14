"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const users_db_1 = __importDefault(require("@shared/models/user_logins/users_db"));
const authoriseRequest = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            throw "No authorisation header provided";
        }
        const userAPIKey = req.headers.authorization;
        const dbResult = await users_db_1.default.checkAPIKey(userAPIKey);
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