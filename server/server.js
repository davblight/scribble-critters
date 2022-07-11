const express = require('express');
const { User } = require("../persist/model");
const setUpAuth = require("./auth");
const setUpSession = require("./session");
const app = express();

app.use(express.json());

//host front end
app.use(express.static(`${__dirname}/../public/`));

setUpSession(app);
setUpAuth(app);

//post method to add new users to the database
app.post("/users", async (req, res) => {
    try {
        let user = await User.create({
            username: req.body.username,
            password: req.body.password,
            role: "admin",
        });
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({
            message: `post request failed to create user`,
            error: err,
        });

    }
});

module.exports = app;
