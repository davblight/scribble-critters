const session = require("express-session");

const setUpSessionStore = function (app) {
    app.use(session({
        secret: "scribblemon4life",
        resave: false,
        saveUninitualized: false,
    }))
}

module.exports = setUpSessionStore;