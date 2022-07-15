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
        effectText = `${battle[teamName].activeMon} restored ${staminaGain} stamina!`
    } else {
        effectText = `${battle[teamName].activeMon} already has full stamina! (bug? or feature?)`
    }

    battle.turns[battle.turns.length() - 1].turnText.push({
        action: actionText,
        effect: effectText,
    })
    return battle;
}

function fight(battle, attacker, defender, move) {
    return battle;
}

//validates that turn is legal, selects AI action, then calculates outcome and updates turn list
function resolveTurn(battle, playerAction, playerMove) {
    //randomly decide if AI will switch mons
    let randSwitch = Math.floor(Math.random() * 8 + 1);
    let AIAction = ""
    let AIMove = ""
    //if switch
    if (randSwitch > 6) {
        //loop through mons to see which can be switched to
        let switchMons = [];
        battle.AI.mons.forEach(mon => {
            if (mon != battle.AI.activeMon && mon.status != "dead") {
                switchMons.push(mon);
            }
        });
        //check if their are available mons to switch to
        if (switchMons) {
            //randomly choose which mon to switch too
            let randMon = Math.floor(Math.random() * switchMons.length());
            let actionText = `ScribbleBot sent ${battle.AI.activeMon.name} back to the drawing board!`
            let effectText = `ScribbleBot scribbled ${switchMons[randMon].name} onto the paper!`
            battle.turns[battle.turns.length() - 1].turnText.push({
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
    if (randSwitch <= 6) {
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
            let randMove = availableMoves[Math.floor(Math.random() * availableMoves.length())];
            AIAction = "fight"
            AIMove = randMove.id;
        }
    }
    //if AI is fighting
    if (AIAction == "fight") {
        //if player and AI are fighting
        if (playerAction == "fight") {
            //check which mon is faster and resolve in speed order
            let playerMon = battle.player.activeMon;
            let AIMon = battle.AI.activeMon;
            let tieBreaker = 0

            //if player mon and AI mon are tied for speed
            if (playerMon.currentSpeed == AIMon.currentSpeed) {
                tieBreaker = Math.floor(Math.random() * 2 + 1)
                //if player mon is faster than AI mon or wins tie
            } else if (playerMon.currentSpeed > AIMon.currentSpeed || tieBreaker == 1) {
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
            //check if player mon status allows it to move
            if (battle.player.activeMon.status != "dead") {
                //player mon uses move
                battle = fight(battle, "player", "AI", playerMove);
            }

        }
        //only player is fighting
    } else if (playerAction == "fight") {
        //player mon uses move
        battle = fight(battle, "player", "AI", playerMove);
        //check if AI mon status allows it to move
        if (battle.AI.activeMon.status != "dead") {
            //AI mon uses move
            battle = fight(battle, "AI", "player", AIMove);
        }
    }
    if (playerAction == "rest") {
        battle = rest(battle, "player");
    }
    if (AIAction == "rest") {
        battle = rest(battle, "AI");
    }

    return battle;
}

function takeTurn(battle, action, subject) {
    //check if player mon is dead and needs to switch
    if (battle.player.activeMon.status == "dead") {
        //make sure player is switching mon
        if (action == "switch") {
            //loop through team mons and check if player has mon in team to switch to
            battle.player.mons.forEach(mon => {
                if (mon._id == subject) {
                    //check if mon is dead
                    if (mon.status == "dead") {
                        throw "cannot switch into dead mon";
                    }
                    //check if mon is active mon
                    if (mon == battle.player.activeMon) {
                        throw "cannot switch into currently active mon"
                    }
                    //set turn text
                    let actionText = `${battle.player.user.name} scribbled ${mon.name} onto the paper`
                    battle.turns[battle.turns.length() - 1].turnText.push({
                        action: actionText,
                    });
                    //set active mon and return new battle
                    battle.player.activeMon = mon;
                    return resolveTurn(battle, action, "")
                }
            });
            //if looped through all mons without finding match
            throw "cannot switch into imaginary mon"
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
        battle.turns.turnNumber = battle.turns.length();


        if (action == "fight") {
            //check if move is in learned moves
            battle.player.activeMon.learnedMoves.forEach(move => {
                if (move.id == subject) {
                    //check if mon has stamina for this move
                    if (move.monHasStamina) {
                        return resolveTurn(battle, action, subject);
                    } else {
                        //if mon does not have enough stamina for this move
                        throw `${battle.player.activeMon.name} is too tired to use this move`
                    }
                }
            });
            //if move is not found in learned moves
            throw `${battle.player.activeMon.name} does not know how to ${subject}`;
        } else if (action == "switch") {
            //loop through team mons and check if player has mon in team to switch to
            battle.player.mons.forEach(mon => {
                if (mon._id == subject) {
                    //check if mon is dead
                    if (mon.status == "dead") {
                        throw "cannot switch into dead mon";
                    }
                    //check if mon is active mon
                    if (mon == battle.player.activeMon) {
                        throw "cannot switch into currently active mon"
                    }
                    //set turn text
                    let actionText = `${battle.player.user.name} sent ${battle.player.activeMon.name} back to the drawing board!`
                    let effectText = `${battle.player.user.name} scribbled ${mon.name} onto the paper`
                    battle.turns[battle.turns.length() - 1].turnText.push({
                        action: actionText,
                        effect: effectText,
                    });
                    //set active mon and return new battle
                    battle.player.activeMon = mon;
                    return resolveTurn(battle, action, "")
                }
            });
            //if looped through all mons without finding match
            throw "cannot switch into imaginary mon"
        } else if (action == "rest") {
            return resolveTurn(battle, action, "");
        } else {
            throw "action type is invalid"
        }
    }
}

module.exports = {
    takeTurn,
}