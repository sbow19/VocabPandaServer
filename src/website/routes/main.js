"use strict";
const express = require("express");
const siteRouter = express.Router();
siteRouter.get("/", (req, res) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Express HTML Response</title>
        </head>
        <body>
            <h1>Hello, Express!</h1>
            <p>This is an HTML response from an Express server.</p>
        </body>
        </html>
    `;
    res.send(htmlContent);
});
module.exports = siteRouter;
//# sourceMappingURL=main.js.map