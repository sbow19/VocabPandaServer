"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_details_db_1 = __importDefault(require("@shared/models/user_details/user_details_db"));
const authoriseRequest = require("@shared/misc/authorisation");
const express = require('express');
const usersSettingsRouter = express.Router();
usersSettingsRouter.use(express.json());
usersSettingsRouter.use(authoriseRequest);
usersSettingsRouter.post("/update", async (req, res) => {
    try {
        const userSettings = req.body;
        const updateUserSettingsResponse = await user_details_db_1.default.updateUserSettings(userSettings);
        res.status(200).send(updateUserSettingsResponse);
    }
    catch (updateUserSettingsResponse) {
        res.status(500).send(updateUserSettingsResponse);
    }
});
module.exports = usersSettingsRouter;
//# sourceMappingURL=user_settings.js.map