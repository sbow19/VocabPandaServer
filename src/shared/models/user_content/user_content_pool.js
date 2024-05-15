"use strict";
const mysql = require("mysql2/promise");
//Create connection pool 
const UserContentDBPool = mysql.createPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: "user_content",
    password: process.env.DB_PASSWORD,
    connectionLimit: 10,
    queueLimit: 100
});
module.exports = UserContentDBPool;
//# sourceMappingURL=user_content_pool.js.map