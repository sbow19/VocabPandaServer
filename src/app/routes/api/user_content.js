"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const user_content_db_1 = __importDefault(require("@shared/models/user_content/user_content_db"));
const authoriseRequest = require("@shared/misc/authorisation");
const usersContentRouter = express.Router();
usersContentRouter.use(express.json());
usersContentRouter.use(authoriseRequest);
usersContentRouter.post("/newproject", async (req, res) => {
    try {
        const newProjectDetails = req.body;
        const addProjectResponse = await user_content_db_1.default.addNewProject(newProjectDetails);
        res.status(200).send(addProjectResponse);
    }
    catch (addProjectResponse) {
        res.status(500).send(addProjectResponse);
    }
});
usersContentRouter.post("/deleteproject", async (req, res) => {
    try {
        const deleteProjectDetails = req.body;
        const deleteProjectResponse = await user_content_db_1.default.deleteProject(deleteProjectDetails);
        res.status(200).send(deleteProjectResponse);
    }
    catch (deleteProjectResponse) {
        res.status(500).send(deleteProjectResponse);
    }
});
usersContentRouter.post("/addentry", async (req, res) => {
    try {
        const APIEntryObject = req.body;
        const addEntryResponse = await user_content_db_1.default.addNewEntry(APIEntryObject);
        res.status(200).send(addEntryResponse);
    }
    catch (addEntryResponse) {
        res.status(500).send(addEntryResponse);
    }
});
usersContentRouter.post("/updateentry", async (req, res) => {
    try {
        const EntryObject = req.body;
        const updateEntryResponse = await user_content_db_1.default.updateEntry(EntryObject);
        res.status(200).send(updateEntryResponse);
    }
    catch (updateEntryResponse) {
        res.status(500).send(updateEntryResponse);
    }
});
usersContentRouter.post("/deleteentry", async (req, res) => {
    try {
        const { entryId } = req.body;
        const deleteEntryResponse = await user_content_db_1.default.deleteEntry(entryId);
        res.status(200).send(deleteEntryResponse);
    }
    catch (deleteEntryResponse) {
        res.status(500).send(deleteEntryResponse);
    }
});
usersContentRouter.post("/addtag", async (req, res) => {
    try {
        const addTagResponse = await user_content_db_1.default.addTag(req.body.newTag, req.body.userName);
        res.status(200).send(addTagResponse);
    }
    catch (e) {
        res.send(e);
    }
});
usersContentRouter.post("/deletetag", async (req, res) => {
    try {
        const deleteTagResponse = await user_content_db_1.default.deleteTag(req.body.tagId);
        res.status(200).send(deleteTagResponse);
    }
    catch (e) {
        res.send(e);
    }
});
module.exports = usersContentRouter;
//# sourceMappingURL=user_content.js.map