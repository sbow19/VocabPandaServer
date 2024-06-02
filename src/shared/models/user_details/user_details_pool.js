"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
//Create connection pool 
const UserDetailsDBPool = promise_1.default.createPool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: "user_details",
    password: process.env.DB_PASSWORD,
    connectionLimit: 10,
    queueLimit: 100
});
module.exports = UserDetailsDBPool;
//# sourceMappingURL=user_details_pool.js.map