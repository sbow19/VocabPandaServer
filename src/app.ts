import mysql from "mysql2/promise"; 
require('dotenv').config()

const connection = await mysql.createConnection({

    host: process.env.DB_HOST,
    user: process.env.DB_HOST,
    database: 'user_logins',
    password: process.env.DB_PASSWORD

})