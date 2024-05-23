const mysql = require("mysql2/promise");

//Create connection pool 

const UserBuffersDBPool = mysql.createPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: "user_buffers",
    password: process.env.DB_PASSWORD,
    connectionLimit: 10,
    queueLimit: 100

});

module.exports = UserBuffersDBPool;