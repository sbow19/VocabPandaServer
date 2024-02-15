"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const user_content_db_1 = __importDefault(require("@shared/models/user_content/user_content_db"));
const authoriseRequest = require("@shared/misc/authorisation");
const usersContentRouter = express.Router();
usersContentRouter.use(express.json());
usersContentRouter.use(authoriseRequest);
usersContentRouter.post("/newproject", async (req, res) => {
    try {
        const newProjectDetails = req.body.newProject;
        const addProjectResponse = await user_content_db_1.default.addNewProject(newProjectDetails, req.body.userName);
        res.status(200).send(addProjectResponse);
    }
    catch (e) {
        res.send(e);
    }
});
usersContentRouter.delete("/deleteproject", async (req, res) => {
    try {
        const deleteProjectResponse = await user_content_db_1.default.deleteProject(req.body.projectName, req.body.userName);
        res.status(200).send(deleteProjectResponse);
    }
    catch (e) {
        res.send(e);
    }
});
usersContentRouter.post("/addentry", async (req, res) => {
    try {
        const addEntryResponse = await user_content_db_1.default.addNewEntry(req.body.newEntryDetails, req.body.userName);
        res.status(200).send(addEntryResponse);
    }
    catch (e) {
        res.send(e);
    }
});
usersContentRouter.put("/updateentry", async (req, res) => {
    try {
        const updateEntryResponse = await user_content_db_1.default.updateEntry(req.body.updateDetails, req.body.entryId);
        res.status(200).send(updateEntryResponse);
    }
    catch (e) {
        res.send(e);
    }
});
usersContentRouter.delete("/deleteentry", async (req, res) => {
    try {
        const deleteEntryResponse = await user_content_db_1.default.deleteEntry(req.body.entryId);
        res.status(200).send(deleteEntryResponse);
    }
    catch (e) {
        res.send(e);
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
usersContentRouter.delete("/deletetag", async (req, res) => {
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