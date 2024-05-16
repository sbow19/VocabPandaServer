const {v4: uuidv4 } = require('uuid');
const express = require('express');
import UsersContentDatabase from '@shared/models/user_content/user_content_db'; 
import * as appTypes from '@appTypes/appTypes'
const authoriseRequest = require("@shared/misc/authorisation");

const usersContentRouter = express.Router();

usersContentRouter.use(express.json());
usersContentRouter.use(authoriseRequest);

usersContentRouter.post("/newproject", async(req, res)=>{

    
    try{

        const newProjectDetails: appTypes.NewProjectDetails = req.body.newProject;

        const addProjectResponse = await UsersContentDatabase.addNewProject(newProjectDetails, req.body.userName);

        res.status(200).send(addProjectResponse);

    }catch(e){

        res.send(e);

    }
})

usersContentRouter.delete("/deleteproject", async(req, res)=>{

    
    try{

        const deleteProjectResponse = await UsersContentDatabase.deleteProject(req.body.projectName, req.body.userName);

        res.status(200).send(deleteProjectResponse)
    }catch(e){

        res.send(e);

    }
})

usersContentRouter.post("/addentry", async(req, res)=>{

    try{

        const APIEntryObject: appTypes.EntryDetails = req.body

        const addEntryResponse = await UsersContentDatabase.addNewEntry(
            APIEntryObject
        );

        res.status(200).send(addEntryResponse);

    }catch(addEntryResponse){
        res.status(500).send(addEntryResponse);
    }

})

usersContentRouter.post("/updateentry", async(req, res)=>{

    try{

        const EntryObject: appTypes.EntryDetails = req.body

        const updateEntryResponse = await UsersContentDatabase.updateEntry(
            EntryObject
        );

        res.status(200).send(updateEntryResponse);

    }catch(e){
        res.send(e);
    }

})


usersContentRouter.post("/deleteentry", async(req, res)=>{

    try{

        const deleteEntryResponse = await UsersContentDatabase.deleteEntry(
            req.body.entryId
        );

        res.status(200).send(deleteEntryResponse);

    }catch(e){
        res.send(e);
    }

})

usersContentRouter.post("/addtag", async(req, res)=>{

    try{

        const addTagResponse = await UsersContentDatabase.addTag(
            req.body.newTag,
            req.body.userName
        );

        res.status(200).send(addTagResponse);

    }catch(e){
        res.send(e);
    }

})

usersContentRouter.post("/deletetag", async(req, res)=>{

    try{

        const deleteTagResponse = await UsersContentDatabase.deleteTag(
            req.body.tagId
        );

        res.status(200).send(deleteTagResponse);

    }catch(e){
        res.send(e);
    }

})

module.exports = usersContentRouter;