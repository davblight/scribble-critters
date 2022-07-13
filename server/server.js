const express = require('express');
const { User, Team } = require("../persist/model");
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

//returns a list of all existing mons
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

//returns the mon named in the params
app.get("/mon/:mon_name", async (req, res) => {
    let mon_name = req.params.mon_name;
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

//returns a list of all existing moves
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

//returns the move named in the params
app.get("/move/:move_name", async (req, res) => {
    let move_name = req.params.move_name;
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

//creates a new team
// name:
// mons: [
//     {
//         name:,
//         id:,
//         learnedMoves: [""],
//     }
// ]
app.post("/team", async (req, res) => {
    //check auth
    if (!req.user) {
        res.status(401).json({
            message: "Unauthenticated"
        });
        return;
    }
    //retrieve list of moves
    let moveList;
    try {
        jsonString = fs.readFileSync(`${__dirname}/../data/movelist.json`);
        moveList = JSON.parse(jsonString);
        if (!moveList) {
            console.log("Oopsies finding movelist");
            return;
        }
    } catch (err) {
        console.log(err);
        return;
    }
    //retrieve list of mons
    let monList;
    try {
        jsonString = fs.readFileSync(`${__dirname}/../data/scribblemon.json`);
        monList = JSON.parse(jsonString);
        if (!monList) {
            console.log("Oopsies finding monList");
            return;
        }
    } catch (err) {
        console.log(err);
        return;
    }
    //check if number of mons is correct
    if (req.body.mons.length > 3) {
        res.status(403).json({
            message: "Too many mons"
        });
        return;
    }
    //populate mons array with mons stats and move stats
    //loop through the mons sent in request
    let mons = [];
    for (let i in req.body.mons) {
        let mon = req.body.mons[i];
        let monId = req.body.mons[i].id;
        let moves = [];
        //loop through moves in mon, and push move data
        //from moveList to an array
        for (let j in mon.learnedMoves) {
            moveId = mon.learnedMoves[j];

            //check if number of moves is correct
            if (req.body.mons.length > 3) {
                res.status(403).json({
                    message: `Your ${monId} has more than 3 moves`
                });
                return;
            }
            //check if mon can know this move
            if (monList[monId].learnableMoves.includes(moveId)) {
                //throw unauthorized if illegal move found
                res.status(403).json({
                    message: `Your ${monId} contained move not in it's moveset`
                });
                return;
            }
            //if legal push to learned moves
            moves.push(moveList[moveId]);
        }
        //create temp mon object to push to mon list
        let monObj = monList[monId];
        monObj.name = req.body.mons[i].name;
        monObj.currentHP = monObj.stats.hp;
        monObj.currentStamina = monObj.stats.stamina;
        monObj.currentAttack = monObj.stats.attack;
        monObj.currentDefense = monObj.stats.defense;
        monObj.currentSpeed = monObj.stats.speed;
        monObj.learnedMoves = moves;

        mons.push(monObj);
    }
    try {
        let team = await Team.create({
            name: req.body.name,
            mons: mons,
            activeMon: "",
            user: {
                name: req.user.username,
                _id: req.user.id
            },
            isAI: false,
        });
        res.status(201).json(team);
    } catch (err) {
        res.status(500).json({
            message: `post request failed to create team`,
            error: err,
        });
        return;
    }
});


module.exports = app;
