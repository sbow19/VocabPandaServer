"use strict";
const express = require("express");
const siteRouter = express.Router();
siteRouter.get("", (req, res) => {
    res.send("This is the website router");
});
module.exports = siteRouter;
//# sourceMappingURL=main.js.map