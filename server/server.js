const express = require('express');
const { User, Team, Battle } = require("../persist/model");
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
app.post("/teams", async (req, res) => {
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
    //Check if team limit reached
    let userTeams;
    try {
        userTeams = await Team.find({ "user._id": req.user.id });
        if (userTeams) {
            if (userTeams.length == 3) {
                res.status(403).json({ message: `Max number of created teams reached` });
                return;
            }
            if (userTeams.length > 3) {
                res.status(403).json({ message: `Max number of created teams already exceeded...wait how did you do that?` });
                return;
            }
        }
    } catch {
        res.status(500).json({
            message: `get request failed to get user teams`,
            error: err,
        });
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
            if (!monList[monId].learnableMoves.includes(moveId)) {
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
    //create new team
    try {
        let team = await Team.create({
            name: req.body.name,
            mons: mons,
            activeMon: "",
            user: {
                name: req.user.username,
                _id: req.user.id
            },
            isAI: req.body.isAI,
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

//Get a list of all teams bound to the user requesting
app.get("/user/teams", async (req, res) => {
    let userTeams;
    try {
        userTeams = await Team.find({ "user._id": req.user.id });
        if (!userTeams) {
            res.status(404).json({ message: `User teams not found` });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `get request failed to get user teams`,
            error: err,
        });
        return;
    }
    res.status(200).json(userTeams);
});

//Get a team by id
app.get("/team/:id", async (req, res) => {
    let userTeam;
    try {
        userTeam = await Team.findById(req.params.id);
        if (!userTeams) {
            res.status(404).json({ message: `Team not found` });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `get request failed to get user teams`,
            error: err,
        });
        return;
    }
    res.status(200).json(userTeam);
});

//Get all teams
app.get("/teams", async (req, res) => {
    let teams;
    try {
        teams = await Team.find();
    } catch (err) {
        res.status(500).json({
            message: `get request failed to get teams`,
            error: err,
        });
        return;
    }
    res.status(200).json(teams);
});

//  *Create a new battle Session*
// {
//     playerTeamId: "",
//     AITeamId: ""
// }
app.post("/battles/AI", async (req, res) => {
    //check auth
    if (!req.user) {
        res.status(401).json({
            message: "Unauthenticated"
        });
        return;
    }
    //get player team
    let playerTeam;
    try {
        playerTeam = await Team.findById(req.body.playerTeamId);
        if (!playerTeam) {
            res.status(404).json({ message: `User team ${req.body.playerTeamId} not found` });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `get request failed to get user team`,
            error: err,
        });
        return;
    }
    //check if player owns team
    if (playerTeam.user._id != req.user.id) {
        res.status(403).json({
            message: `you are not authorized to use this team`
        });
        return;
    }
    //get AI team
    let AITeam;
    try {
        AITeam = await Team.findById(req.body.AITeamId);
        if (!AITeam) {
            res.status(404).json({ message: `AI team ${req.body.AITeamId} not found` });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `get request failed to get AI team`,
            error: err,
        });
        return;
    }
    //check if AI owns team
    if (!AITeam.isAI) {
        res.status(403).json({
            message: `You must play against an AI Team`
        });
        return;
    }
    try {
        let battle = await Battle.create({
            player: playerTeam,
            AI: AITeam,
            turns: [],
            finished: false,
        });
        res.status(201).json(battle);
    } catch (err) {
        res.status(500).json({
            message: `post request failed to create battle session`,
            error: err,
        });
        return;
    }
});


module.exports = app;
