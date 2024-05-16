import UsersDatabase from "@shared/models/user_logins/users_db";

const crypto = require("crypto");
const nodemailer = require("nodemailer");


class VocabPandaEmail {

    static sendVerificationEmail(email: string){

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
                    

                })
                console.log(e, "Error with nodemail connection");
                reject(mailSendError)
            }
        })
    }

    static checkToken(token: string){

        return new Promise(async(resolve, reject)=>{

            try{
                
                let {dbMatchResponseObject, queryResult} = await UsersDatabase.checkEmailVerification(token);

                if(dbMatchResponseObject.responseMessage === "Match found"){

                    await UsersDatabase.deleteEmailVerification(token);

                    await UsersDatabase.updateVerification(queryResult[0].email)

                    resolve(console.log("User verified"));
                }
                
            }catch(e){

                reject("User could not be verified")
            }
        })
    }
}


export default VocabPandaEmail;