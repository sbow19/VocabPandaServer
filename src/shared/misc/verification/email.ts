import UsersDatabase from "@shared/models/user_logins/users_db";
import * as appTypes from "@appTypes/appTypes";

const crypto = require("crypto");
const nodemailer = require("nodemailer");


class VocabPandaEmail {

    static sendVerificationEmail = (email: string) => {

        const sendEmailResponse: appTypes.APIAccountOperationResponse = {
            message: "operation unsuccessful",
            success: false,
            operationType: "create",
            contentType: "account",
            accountOperation: "create account"
        };

        return new Promise(async(resolve, reject)=>{

            const token = crypto.randomBytes(32).toString('hex');

            try{
                

                const transporter = nodemailer.createTransport({
    
                    service: "gmail",
                    port: 465,
                    secure: true,
                    auth: {
                        user: "zctlsab@gmail.com",
                        pass: "vuix pcmm wqjx ghdj"
                    },
                    connectionTimeout: 10000, // 10 seconds
                    socketTimeout: 15000, // 10 seconds
                    greetingTimeout: 5000, // 10 seconds
                });
            
                const result = await transporter.sendMail({
            
                    from: "Gmail <zctlsab@gmail.com>",
                    to: email,
                    subject: "Testing nodemail",
                    text: `Click on this link to verify your email: http://192.168.1.254:3000/account/createaccount/verify?token=${token}`, //Replace with IP of VPS 
            
                });

                //save token in database if email successfully sent, otherwise we skip.

                await UsersDatabase.saveEmailVerification(token, email);
            
                resolve(console.log("Message sent: " + result.messageId));

            }catch(e){


                const mailSendError = new Error("nodemail", {
                    

                });

                sendEmailResponse.error = mailSendError;
                console.log(e, "Error with nodemail connection");
                reject(sendEmailResponse);
            }
        })
    }

    static checkToken = (token: string): Promise<appTypes.APIAccountOperationResponse> =>{

        return new Promise(async(resolve, reject)=>{

            const checkEmailTokenResponse: appTypes.APIAccountOperationResponse = {
                message: "operation unsuccessful",
                success: false,
                operationType: "create",
                contentType: "account",
                accountOperation: "verify email"
            };

            try{
                
                let dbMatchResponse = await UsersDatabase.checkEmailVerification(token);

                if(dbMatchResponse.match === true){

                    await UsersDatabase.deleteEmailVerification(token);

                    await UsersDatabase.updateVerification(dbMatchResponse.matchTerm[0].email)

                    resolve(console.log("User verified"));
                }
                
            }catch(e){

                checkEmailTokenResponse.error = e; 
                reject(checkEmailTokenResponse); 
            }
        })
    }
}


export default VocabPandaEmail;