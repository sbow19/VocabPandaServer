import * as express from "express";

const authoriseRequest = require("@shared/misc/authorisation/authorisation");

const appRouter: express.IRouter = express.Router()

//Authenticate function. API Key sent in authorisation header from mobile device.

//Start by checking whether api key provided by user matches one in database.
appRouter.use(authoriseRequest);

//USer credentials provided in request header
appRouter.get("/", async (req, res)=>{

    res.send("This the is app page")
});

//When user logs into app or extension
appRouter.use("/login", require("./login/login.js"));

//When user updates settings
appRouter.use("/settings", require("./settings/user_settings.js"));

//Local changes from the front end
appRouter.use("/synclocalchanges", require("./sync_local_changes/sync_local_changes.js"))

//Sync results sent from the front end
appRouter.use("/syncresult", require("./sync_result/sync_result.js"))

//Acknowledgements sent from the app frontend
// appRouter.use("/acknowledgement", require("./acknowledgement/acknowledgement.js"))



module.exports = appRouter;