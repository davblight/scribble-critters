//validates that turn is legal, selects AI action, then calculates outcome and updates turn list
function resolveTurn(battle, playerMove) {
    //randomly decide if AI will switch mons
    let randSwitch = Math.floor(Math.random() * 10 + 1);
    //if switch
    if (randSwitch > 8) {
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
            battle.AI.activeMon = switchMons[randMon];
        } else {
            randSwitch = Math.floor(Math.random() * 8 + 1);
        }
    }
    //if not or can't switch
    if (randSwitch <= 8) {

    }

    return battle;
}

function takeTurn(battle, action, subject) {
    //create new turn object
    battle.turns.push({
        turnNumber: "",
        turnText: [],
    });
    battle.turns.turnNumber = battle.turns.length();

    if (action == "fight") {

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
                let actionText = `${battle.player.user.name} sent ${battle.player.activeMon} back to the drawing board!`
                let effectText = `${battle.player.user.name} scribbled ${mon}`
                battle.turns[battle.turns.length() - 1].turnText.push({
                    action: actionText,
                    effect: effectText,
                });
                //set active mon and return new battle
                battle.player.activeMon = mon;
                return resolveTurn(battle, "switch")
            }
        });
        //if looped through all mons without finding match
        throw "cannot switch into imaginary mon"
    } else if (action == "rest") {

    } else {
        throw "action type is invalid"
    }
}

module.exports = {
    takeTurn,
}