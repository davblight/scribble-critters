const express = require('express');
const { User, Team, Battle } = require("../persist/model");
const setUpAuth = require("./auth");
const setUpSession = require("./session");
const takeTurn = require("./turn");
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
            role: "user",
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
    if (req.body.mons.length == 0 || !req.body.mons) {
        res.status(403).json({
            message: "Your team is empty?"
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
        monObj.currentHP = monObj.stats.hp * 12;
        monObj.currentStamina = monObj.stats.stamina;
        monObj.currentAttack = monObj.stats.attack;
        monObj.currentDefense = monObj.stats.defense;
        monObj.currentSpeed = monObj.stats.speed;
        monObj.learnedMoves = moves;

        mons.push(monObj);
    }
    let isAI = false;
    if (req.user.role == "admin" && req.body.isAI) {
        isAI = req.body.isAI;
    }
    //create new team
    try {
        let team = await Team.create({
            name: req.body.name,
            mons: mons,
            activeMon: mons[0],
            user: {
                name: req.user.username,
                _id: req.user.id
            },
            isAI: isAI,
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

//Edits an existing team
// name:
// mons: [
//     {
//         name:,
//         id:,
//         learnedMoves: [""],
//     }
// ]
app.put("/team/:id", async (req, res) => {
    //check auth
    if (!req.user) {
        res.status(401).json({
            message: "Unauthenticated"
        });
        return;
    }
    //get team to edit
    let oldTeam;
    try {
        oldTeam = await Team.findById(req.params.id);
        if (!oldTeam) {
            res.status(404).json({ message: `team not found` });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `put request failed when finding team`,
            error: err,
        });
        return;
    }
    //check if user is authed to edit this team
    if (req.user.id != oldTeam.user._id) {
        res.status(403).json({ message: `you are not authorized to edit this team` });
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
    if (req.body.mons.length == 0 || !req.body.mons) {
        res.status(403).json({
            message: "Your team is empty?"
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
        monObj.currentHP = monObj.stats.hp * 12;
        monObj.currentStamina = monObj.stats.stamina;
        monObj.currentAttack = monObj.stats.attack;
        monObj.currentDefense = monObj.stats.defense;
        monObj.currentSpeed = monObj.stats.speed;
        monObj.learnedMoves = moves;

        mons.push(monObj);
    }
    let isAI = false;
    if (req.user.role == "admin" && req.body.isAI) {
        isAI = req.body.isAI;
    }

    //edit team
    try {
        let team = await Team.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                mons: mons,
                activeMon: mons[0],
                user: {
                    name: req.user.username,
                    _id: req.user.id
                },
                isAI: isAI,
            },
            { new: true, }
        );
        res.status(200).json(team);
    } catch (err) {
        res.status(500).json({
            message: `put request failed to edit team`,
            error: err,
        });
        return;
    }
});

//Delete existing team
app.delete("/team/:id", async (req, res) => {
    //check auth
    if (!req.user) {
        res.status(401).json({
            message: "Unauthenticated"
        });
        return;
    }
    //get team to edit
    let team;
    try {
        team = await Team.findById(req.params.id);
        if (!team) {
            res.status(404).json({ message: `team not found` });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `delete request failed when finding team`,
            error: err,
        });
        return;
    }
    //check if user is authed to edit this team
    if (req.user.id != team.user._id) {
        res.status(403).json({ message: `you are not authorized to delete this team` });
        return;
    }
    let deletedTeam;
    try {
        deletedTeam = await Team.findByIdAndDelete(req.params.id);
        if (!deletedTeam) {
            res.status(404).json({ message: `team not found to delete` });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `delete request failed when deleting team`,
            error: err,
        });
        return;
    }
    res.status(200).json(deletedTeam);
});

//Get a list of all teams bound to the user requesting
app.get("/user/teams", async (req, res) => {
    let userTeams;
    try {
        userTeams = await Team.find({ "user._id": req.user.id }, ["-activeMon", "-isAI", "-user"]);
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
    let teams = [];
    userTeams.forEach(team => {
        let formattedTeam = {};
        mons = [];
        team.mons.forEach(mon => {
            let newMon = {}
            let moves = [];
            mon.learnedMoves.forEach(move => {
                moves.push(move.id);
            });
            newMon = {
                name: mon.name,
                id: mon.id,
                learnedMoves: moves,
            }
            mons.push(newMon);
        });
        formattedTeam = {
            name: team.name,
            mons: mons,
        };
        teams.push(formattedTeam);
    })
    res.status(200).json(teams);
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
    //create team
    playerTeam.activeMon = playerTeam.mons[0];
    AITeam.activeMon = AITeam.mons[0];
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

app.get("/battles/AI/:id", async (req, res) => {
    //check auth
    if (!req.user) {
        res.status(401).json({
            message: "Unauthenticated"
        });
        return;
    }
    let battle;
    try {
        battle = await Battle.findById(req.params.id);
        if (!battle) {
            res.status(404).json({ message: `Battle not found` });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `get request failed to retrieve battle session`,
            error: err,
        });
        return;
    }
    res.status(200).json(battle);
});

app.get("/battles", async (req, res) => {
    //check auth
    if (!req.user) {
        res.status(401).json({
            message: "Unauthenticated"
        });
        return;
    }
    let battles;
    try {
        battles = await Battle.find();
        if (!battles) {
            res.status(404).json({ message: `Battles not found` });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `get request failed to retrieve battle sessions`,
            error: err,
        });
        return;
    }
    res.status(200).json(battles);
});

//returns a list of battles that involve the user
app.get("/user/battles", async (req, res) => {
    //check auth
    if (!req.user) {
        res.status(401).json({
            message: "Unauthenticated"
        });
        return;
    }
    //get list of battles
    let battles;
    try {
        battles = await Battle.find();
        if (!battles) {
            res.status(404).json({ message: `Battles not found` });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `get request failed to retrieve battle sessions`,
            error: err,
        });
        return;
    }
    //create array of battles that involve the user
    let userBattles = [];
    battles.forEach(battle => {
        if (battle.player.user._id == req.user.id) {
            userBattles.push(battle);
        }
    });
    //return user battles
    res.status(200).json(userBattles);
});

//Perform an action in the battle and return updated state
// {
//     action: "", (fight / switch / rest)
//     subject: "", (moveId / switchMonId / "")

// }
app.put("/battles/AI/:id", async (req, res) => {
    //check auth
    if (!req.user) {
        res.status(401).json({
            message: "Unauthenticated"
        });
        return;
    }
    //get battle
    let battle;
    try {
        battle = await Battle.findById(req.params.id);
        if (!battle) {
            res.status(404).json({ message: `Battle not found` });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `put request failed to retrieve battle session`,
            error: err,
        });
        return;
    }
    //check if battle is finished
    if (battle.finished) {
        res.status(403).json({
            message: `The battle is over! Why are you still here? Go home!`
        });
        return;
    }
    //check if player owns team
    if (battle.player.user._id != req.user.id) {
        res.status(403).json({
            message: `you are not authorized to participate in this battle`
        });
        return;
    }
    //check if forfeit
    if (req.body.action == "forfeit") {
        battle.finished = true;
        try {
            newBattle = await Battle.findByIdAndUpdate(req.params.id, battle, { new: true });
            if (!newBattle) {
                res.status(404).json({ message: `Battle not found when trying to forfeit` });
                return;
            }
        } catch (err) {
            res.status(500).json({
                message: `put request failed to forfeit battle session`,
                error: err,
            });
            return;
        }
        res.status(200).json(newBattle);
        return;
    }
    //attempt to take a turn and return updated battle state
    try {
        updatedBattle = takeTurn(battle, req.body.action, req.body.subject);
    } catch (err) {
        res.status(403).json({ message: "something went wrong", error: err });
        return;
    }
    //put updated battle state
    try {
        newBattle = await Battle.findByIdAndUpdate(req.params.id, updatedBattle, { new: true });
        if (!newBattle) {
            res.status(404).json({ message: `Battle not found when trying to update` });
            return;
        }
    } catch (err) {
        res.status(500).json({
            message: `put request failed to update battle session`,
            error: err,
        });
        return;
    }
    res.status(200).json(newBattle);
});


module.exports = app;
