//validates that turn is legal, selects AI action, then calculates outcome and updates turn list
function takeTurn(app, battle, action, subject) {
    if (action == "fight") {

    } else if (action == "switch") {
        //loop through team mons and check if player has mon in team to switch to
        battle.player.mons.forEach(mon => {
            if ()
        })
        battle.player.activeMon = 
    } else {
        throw "action type is invalid"
        return;
    }
}

module.exports = {
    takeTurn,
}