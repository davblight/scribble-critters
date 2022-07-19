const fs = require("fs");

function updateMon(battle, teamName) {
    for (let i in battle[teamName].mons) {
        if (battle[teamName].mons[i]._id.toString() == battle[teamName].activeMon._id.toString()) {
            battle[teamName].mons[i] = battle[teamName].activeMon;
        }
    };
    return battle;
}

function rest(battle, teamName) {
    let user;
    if (teamName == "AI") {
        user = "ScribbleBot"
    } else {
        user = battle[teamName].user.name;
    }
    let actionText = `${user} rested their drawing hand!`
    let effectText = ""
    if (battle[teamName].activeMon.currentStamina < battle[teamName].activeMon.stats.stamina) {
        staminaGain = 1
        battle[teamName].activeMon.currentStamina += staminaGain;
        effectText = `${battle[teamName].activeMon.name} restored ${staminaGain} stamina!`
    } else {
        effectText = `${battle[teamName].activeMon.name} already has full stamina! (bug? or feature?)`
    }

    battle.turns[battle.turns.length - 1].turnText.push({
        action: actionText,
        effect: effectText,
    });

    return battle;
}

function fight(battle, attacker, defender, move) {
    attackMon = battle[attacker].activeMon;
    defendMon = battle[defender].activeMon;
    let defense = defendMon.currentDefense;
    let stamina = attackMon.currentStamina;
    let stab = 1;
    if (attackMon.type == move.type) {
        stab = 1.5
    }
    let type = 1;
    let advantage = ["fire", "grass", "water", "fire"];
    for (let i = 0; i < 3; i++) {
        if (attackMon.type == advantage[i] && defendMon.type == advantage[i + 1]) {
            type = 2;
        }
        else if (defendMon.type == advantage[i] && attackMon.type == advantage[i + 1]) {
            type = .5;
        }
    }
    let damage = Math.floor((move.power * attackMon.currentAttack / defense) * stab * type * 4);
    let hp = defendMon.currentHP;
    let remainingHP = hp - damage;
    let resultText = ""
    if (remainingHP <= 0) {
        remainingHP = 0;
        battle[defender].activeMon.status = "dead";
        resultText = `${defendMon.name} was erased!`;
        battle = updateMon(battle, defender);
    }
    battle[defender].activeMon.currentHP = remainingHP;
    battle[attacker].activeMon.currentStamina = (parseInt(stamina) - parseInt(move.staminaCost));
    let hasStam;
    if (parseInt(move.staminaCost) > parseInt(battle[attacker].activeMon.currentStamina)) {
        hasStam = false;
    } else {
        hasStam = true;
    }
    battle[attacker].activeMon.learnedMoves.forEach(learnedMove => {
        if (move.id == learnedMove.id) {
            learnedMove.monHasStamina = hasStam;
        }
    })

    let actionText = `${attackMon.name} used ${move.name}!`
    let effectText = "";
    if (damage > 0) {
        effectText = `${defendMon.name} took ${damage} points of damage!`
    } else {
        effectText = `${attackMon.name} gained the ${move.effect} effect!`
    }

    battle.turns[battle.turns.length - 1].turnText.push({
        action: actionText,
        effect: effectText,
        result: resultText,
    });

    return battle;
}

//validates that turn is legal, selects AI action, then calculates outcome and updates turn list
function resolveTurn(battle, playerAction, playerMove) {
    //randomly decide if AI will switch mons
    let randSwitch = Math.floor((Math.random() * 8) + 1);
    let AIAction = ""
    let AIMove = ""
    //if switch
    if (randSwitch > 7) {
        //loop through mons to see which can be switched to
        let switchMons = [];
        battle.AI.mons.forEach(mon => {
            if (mon._id.toString() != battle.AI.activeMon._id.toString() && mon.status != "dead") {
                switchMons.push(mon);
            }
        });
        //check if their are available mons to switch to
        if (switchMons) {
            //randomly choose which mon to switch too
            let randMon = Math.floor(Math.random() * switchMons.length);
            let actionText = `ScribbleBot sent ${battle.AI.activeMon.name} back to the drawing board!`
            let effectText = `ScribbleBot scribbled ${switchMons[randMon].name} onto the paper!`
            battle.turns[battle.turns.length - 1].turnText.push({
                action: actionText,
                effect: effectText,
            });
            battle.AI.activeMon = switchMons[randMon];
            AIAction = "switch";
        } else {
            randSwitch = 1;
        }
    }

    // if not or can't switch
    if (randSwitch <= 7) {
        //loop through moves to see what is available
        let availableMoves = [];
        battle.AI.activeMon.learnedMoves.forEach(move => {
            if (move.monHasStamina) {
                availableMoves.push(move);
            }
        });
        //if mon has no available moves then rest
        if (!availableMoves) {
            AIAction = "rest";
        } else {
            //if mon has enough stamina select a random available move
            let randMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            AIAction = "fight"
            AIMove = randMove;
        }
    }
    //if AI is fighting
    if (AIAction == "fight") {
        //if player and AI are fighting
        if (playerAction == 'fight') {
            //check which mon is faster and resolve in speed order
            let playerMon = battle.player.activeMon;
            let AIMon = battle.AI.activeMon;
            let tieBreaker = 0

            //if player mon and AI mon are tied for speed
            if (playerMon.currentSpeed == AIMon.currentSpeed) {
                tieBreaker = Math.floor(Math.random() * 2 + 1)
                //if player mon is faster than AI mon or wins tie
            }
            if (playerMon.currentSpeed > AIMon.currentSpeed || tieBreaker == 1) {
                //player mon uses move
                battle = fight(battle, "player", "AI", playerMove);
                //check if AI mon status allows it to move
                if (battle.AI.activeMon.status != "dead") {
                    //AI mon uses move
                    battle = fight(battle, "AI", "player", AIMove);
                }

                //if AI mon is faster than player mon or wins tie
            } else if (playerMon.currentSpeed < AIMon.currentSpeed || tieBreaker == 2) {
                //AI mon uses move
                battle = fight(battle, "AI", "player", AIMove);
                //check if player mon status allows it to move
                if (battle.player.activeMon.status != "dead") {
                    //player mon uses move
                    battle = fight(battle, "player", "AI", playerMove);
                }

            }
            //only AI is fighting
        } else {
            //AI mon uses move
            battle = fight(battle, "AI", "player", AIMove);
        }
        //only player is fighting
    } else if (playerAction == 'fight') {
        //player mon uses move
        battle = fight(battle, "player", "AI", playerMove);
    }
    if (playerAction == 'rest') {
        if (battle.player.activeMon.status != "dead") {
            battle = rest(battle, "player");
        }
    }
    // if AI mon is dead then AI switches
    if (battle.AI.activeMon.status == "dead") {
        //loop through mons to see which can be switched to
        let switchMons = [];
        let monFound = false;
        battle.AI.mons.forEach(mon => {
            if (mon._id.toString() != battle.AI.activeMon._id.toString() && mon.status != "dead") {
                switchMons.push(mon);
                monFound = true;
            }
        });
        //check if their are available mons to switch to
        if (monFound) {
            //randomly choose which mon to switch too
            let randMon = Math.floor(Math.random() * switchMons.length);
            let effectText = `ScribbleBot scribbled ${switchMons[randMon].name} onto the paper!`
            battle.turns[battle.turns.length - 1].turnText.push({
                effect: effectText,
            });
            battle.AI.activeMon = switchMons[randMon];
        } else {
            battle.finished = true;
        }
    }
    //if mon is still alive and resting
    else if (AIAction == "rest") {
        if (battle.AI.activeMon.status != "dead") {
            battle = rest(battle, "AI");
        }
    }

    //end of turn stamina gain
    if (battle.AI.activeMon.status != "dead") {
        if (parseInt(battle.AI.activeMon.currentStamina) < parseInt(battle.AI.activeMon.stats.stamina)) {
            staminaGain = 1
            battle.AI.activeMon.currentStamina = parseInt(battle.AI.activeMon.currentStamina) + staminaGain;
        }
    }
    if (battle.player.activeMon.status != "dead") {
        if (parseInt(battle.player.activeMon.currentStamina) < parseInt(battle.player.activeMon.stats.stamina)) {
            staminaGain = 1
            battle.player.activeMon.currentStamina = parseInt(battle.player.activeMon.currentStamina) + staminaGain;
        }
    }

    return battle;
}

const takeTurn = function (battle, action, subject) {
    //check if player mon is dead and needs to switch
    if (battle.player.activeMon.status == "dead") {
        //make sure player is switching mon
        if (action == 'switch') {
            //loop through team mons and check if player has mon in team to switch to
            let monFound = false;
            battle.player.mons.forEach(mon => {
                if (mon._id == subject) {
                    monFound = true;
                    //check if mon is dead
                    if (mon.status == "dead") {
                        throw "cannot switch into dead mon";
                    }
                    //check if mon is active mon
                    if (subject == battle.player.activeMon._id.toString()) {
                        throw "cannot switch into currently active mon"
                    }
                    //set turn text
                    let actionText = `${battle.player.user.name} scribbled ${mon.name} onto the paper`
                    battle.turns[battle.turns.length - 1].turnText.push({
                        action: actionText,
                    });
                    //set active mon and return new battle
                    battle.player.activeMon = mon;
                    return battle;
                }
            });
            //if looped through all mons without finding match
            if (!monFound) {
                throw "cannot switch into imaginary mon"
            }

        } else {
            //if player is not switching with a dead active mon
            throw "must switch to a live mon before you can do any actions"
        }
    }

    //else create new turn
    else {
        //create new turn object
        battle.turns.push({
            turnNumber: "",
            turnText: [],
        });
        battle.turns[battle.turns.length - 1].turnNumber = battle.turns.length;


        if (action == 'fight') {
            //check if move is in learned moves
            let moveFound = false;
            battle.player.activeMon.learnedMoves.forEach(move => {
                if (move.id == subject) {
                    moveFound = true;
                    //check if mon has stamina for this move
                    if (move.monHasStamina) {
                        battle = resolveTurn(battle, action, move);
                    } else {
                        //if mon does not have enough stamina for this move
                        throw `${battle.player.activeMon.name} is too tired to use this move`
                    }
                }
            });
            //if move is not found in learned moves
            if (!moveFound) {
                throw `${battle.player.activeMon.name} does not know how to ${subject}`;
            }
        } else if (action == 'switch') {
            //loop through team mons and check if player has mon in team to switch to
            let monFound = false;
            battle.player.mons.forEach(mon => {
                if (mon._id == subject) {
                    monFound = true;
                    //check if mon is dead
                    if (mon.status == "dead") {
                        throw "cannot switch into dead mon";
                    }
                    //check if mon is active mon
                    if (subject == battle.player.activeMon._id.toString()) {
                        throw "cannot switch into currently active mon"
                    }
                    //set turn text
                    let actionText = `${battle.player.user.name} sent ${battle.player.activeMon.name} back to the drawing board!`
                    let effectText = `${battle.player.user.name} scribbled ${mon.name} onto the paper`
                    battle.turns[battle.turns.length - 1].turnText.push({
                        action: actionText,
                        effect: effectText,
                    });
                    //set active mon and return new battle
                    battle.player.activeMon = mon;
                    battle = resolveTurn(battle, action, "");
                }
            });
            //if looped through all mons without finding match
            if (!monFound) {
                throw "cannot switch into imaginary mon"
            }
        } else if (action == 'rest') {
            battle = resolveTurn(battle, action, "");
        } else {
            throw "action type is invalid"
        }
    }

    battle = updateMon(battle, "player");
    battle = updateMon(battle, "AI")
    return battle;
}

module.exports = takeTurn;