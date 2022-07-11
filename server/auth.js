const passport = require('passport');
const LocalStrategy = require('passport-local');
const { User } = require('../persist/model');

//Setup local strategy for auth
passport.use(new LocalStrategy(async (username, password, done) => {
    let user;
    try {
        // try to find user
        user = await User.findOne({ "username": username, "password": password })
        //if user not found
        if (!user) {
            return done(null, false);
        }
        // we succeeded
        return done(null, user)
    } catch (err) {
        // if there was an error looking
        return done(err)
    }
}));

const setUpAuth = function (app) {
    app.use(passport.initialize());
    app.use(passport.authenticate("session"));

    //setup what to store in the session
    passport.serializeUser(function (user, cb) {
        cb(null, {
            id: user._id,
            username: user.username,
            role: user.role,
        });
    });

    //setup what to retrieve from the session
    passport.deserializeUser(function (user, cb) {
        return cb(null, user);
    });

    //setup post session ie trying to login
    app.post("/session", passport.authenticate("local"), (req, res) => {
        res.status(201).json({
            message: "successfully created session",
            user: {
                id: req.user.id,
                username: req.user.username,
                role: req.user.role,
            }
        });
    });

    //setup get session ie checking if you are logged in
    app.get("/session", (req, res) => {
        if (!req.user) {
            res.status(401).json({
                message: "Unauthenticated"
            });
            return;
        }
        res.status(200).json({
            message: "Authenticated",
            user: {
                id: req.user.id,
                username: req.user.username,
                role: req.user.role,
            }
        });
    })
};

module.exports = setUpAuth;