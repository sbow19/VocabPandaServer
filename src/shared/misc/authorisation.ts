import UsersDatabase from "@shared/models/user_logins/users_db";
const basicAuth = require("basic-auth");

const authoriseRequest = async(req, res, next)=>{

    try{

        const credentials = basicAuth(req);
        console.log(credentials)

        if (!credentials || !credentials.name || !credentials.pass) {
            res.status(401).send('Authentication required');
            return;
        }

        const dbResult = await UsersDatabase.checkCredentials(credentials);
        
        if(dbResult.responseMessage === "No match found"){
            throw dbResult;
        } else if(dbResult.responseMessage === "Match found"){
            next(); 
        }
    }catch(e){

        return res.status(401).send(e);

    }
}

module.exports = authoriseRequest;