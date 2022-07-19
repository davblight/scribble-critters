const { Battle } = require("../persist/model");

async function compareTime() {
    let currentTime = new Date().getTime();
    let battles;
    try {
        battles = await Battle.find();
        if (!battles) {
            return;
        }
    } catch (err) {
        console.log(err);
        return;
    }
    let found = false;
    for (let i in battles) {
        editTime = battles[i].updatedAt.getTime();
        let deletedBattle;
        if ((currentTime - editTime > 300000 && battles[i].finished) || (currentTime - editTime > 900000)) {
            found = true;
            try {
                deletedBattle = await Battle.findByIdAndDelete(battles[i]._id);
                if (!deletedBattle) {
                    console.log("could not find battle when trying to close");
                }
                else {
                }
            } catch (err) {
                console.log(err);
            }
        }
    };
    if (!found) {
    }
}

let autoDelete = function (checkTime) {
    setInterval(compareTime, checkTime);
}

module.exports = {
    autoDelete,
} 