const mysql = require("mysql2/promise");

//Create connection pool 

const UserDBPool = mysql.createPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: "user_logins",
    password: process.env.DB_PASSWORD,
    connectionLimit: 50,
    queueLimit: 100

});

module.exports = UserDBPool;