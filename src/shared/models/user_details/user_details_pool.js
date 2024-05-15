"use strict";
const mysql = require("mysql2/promise");
//Create connection pool 
const UserDetailsDBPool = mysql.createPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: "user_details",
    password: process.env.DB_PASSWORD,
    connectionLimit: 10,
    queueLimit: 100
});
module.exports = UserDetailsDBPool;
//# sourceMappingURL=user_details_pool.js.map