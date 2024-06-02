"use strict";
const mysql = require("mysql2/promise");
//Create connection pool 
const UserSyncDBPool = mysql.createPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: "user_sync",
    password: process.env.DB_PASSWORD,
    connectionLimit: 10,
    queueLimit: 100
});
module.exports = UserSyncDBPool;
//# sourceMappingURL=user_sync_pool.js.map