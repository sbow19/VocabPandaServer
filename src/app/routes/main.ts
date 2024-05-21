import * as express from "express";
import UsersDatabase from "@shared/models/user_logins/users_db";

const authoriseRequest = require("@shared/misc/authorisation")

const appRouter: express.IRouter = express.Router()

//Authenticate function. API Key sent in authorisation header from mobile device.

//Start by checking whether api key provided by user matches one in database.
appRouter.use(authoriseRequest);

//USer credentials provided in request header
appRouter.get("/", async (req, res)=>{

    res.send("This the is app page")
});

//When user logs into app or extension
appRouter.use("/login", require("./api/users.js"));

//When user updates entries in their project
appRouter.use("/entries", require("./api/user_content.js"));

//When user updates settings
appRouter.use("/settings", require("./api/user_settings.js"));

module.exports = appRouter;