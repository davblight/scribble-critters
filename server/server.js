const express = require('express');
const { User } = require("../persist/model");
const setUpAuth = require("./auth");
const setUpSession = require("./session");
const fs = require("fs");
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
        return;
    }
});

app.get("/mons", async (req, res) => {
    let mons;
    try {
        jsonString = fs.readFileSync(`${__dirname}/../data/scribblemon.json`);
        mons = JSON.parse(jsonString);
        if (!mons) {
            console.log("Oopsies");
            return;
        }
    } catch (err) {
        console.log(err);
        return;
    }
    res.status(200).json(mons);
});

app.get("/mon/:mon_name", async (req, res) => {
    mon_name = req.params.mon_name;
    let mons;
    try {
        jsonString = fs.readFileSync(`${__dirname}/../data/scribblemon.json`);
        mons = JSON.parse(jsonString);
        if (!mons) {
            console.log("Oopsies");
            return;
        }
    } catch (err) {
        console.log(err);
        return;
    }
    res.status(200).json(mons[mon_name]);
});

app.get("/moves", async (req, res) => {
    let moves;
    try {
        jsonString = fs.readFileSync(`${__dirname}/../data/movelist.json`);
        moves = JSON.parse(jsonString);
        if (!moves) {
            console.log("Oopsies");
            return;
        }
    } catch (err) {
        console.log(err);
        return;
    }
    res.status(200).json(moves);
});

app.get("/move/:move_name", async (req, res) => {
    move_name = req.params.move_name;
    let moves;
    try {
        jsonString = fs.readFileSync(`${__dirname}/../data/movelist.json`);
        moves = JSON.parse(jsonString);
        if (!moves) {
            console.log("Oopsies");
            return;
        }
    } catch (err) {
        console.log(err);
        return;
    }
    res.status(200).json(moves[move_name]);
});


module.exports = app;
