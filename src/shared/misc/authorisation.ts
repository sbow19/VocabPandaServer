import UsersDatabase from "@shared/models/user_logins/users_db";

const authoriseRequest = async(req, res, next)=>{

    try{

        if(!req.headers.authorization){
            throw "No authorisation header provided"
        }
        const userAPIKey = req.headers.authorization;

        const dbResult = await UsersDatabase.checkAPIKey(userAPIKey);
        
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