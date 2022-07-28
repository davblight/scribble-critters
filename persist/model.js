const mongoose = require('mongoose');

//setup user Schema with email validation
const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
});

const moveSchema = mongoose.Schema({
    name: { type: String, required: true },
    power: { type: String, default: "" },
    staminaCost: { type: String, default: "" },
    monHasStamina: { type: Boolean, default: true },
    type: { type: String, default: "" },
    effect: { type: String, default: "" },
    id: { type: String, required: true },
});

const monSchema = mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    currentHP: { type: String, required: true },
    currentStamina: { type: String, required: true },
    currentAttack: { type: String, required: true },
    currentDefense: { type: String, required: true },
    currentSpeed: { type: String, required: true },
    status: { type: String, default: "" },
    stats: {
        type: {
            hp: { type: String, required: true },
            stamina: { type: String, required: true },
            attack: { type: String, required: true },
            defense: { type: String, required: true },
            speed: { type: String, required: true },
        },
        required: true
    },
    learnedMoves: { type: [moveSchema], required: true, validate: [arrayLimit, 'Number of moves learned exceeds the limit of 3'] },
    learnableMoves: { type: [String], required: true },
    id: { type: String, default: "", required: true },
});

const teama = mongoose.Schema({
    name: { type: String, required: true },
    mons: { type: [monSchema], required: true, validate: [arrayLimit, 'Number of mons exceeds the limit of 3'] },
    activeMon: { type: monSchema, default: {} },
    user: {
        type: {
            name: { type: String, required: true },
            _id: { type: mongoose.Schema.Types.ObjectId, required: true },
        },
        required: true
    },
    isAI: { type: Boolean, default: false },
});

const turnSchema = mongoose.Schema({
    turnNumber: { type: Number, required: true },
    turnText: {
        type: [{
            actionText: { type: String, required: true },
            effectText: { type: String, default: "" },
            resultText: { type: String, default: "" },
            action: { type: String, required: true },
            user: { type: String, required: true },
            mon1: { type: monSchema, required: true },
            mon2: { type: monSchema, default: {} },
        }],
        required: true
    },

});

const battleSchema = mongoose.Schema(
    {
        player: { type: teama, required: true },
        AI: { type: teama, required: true },
        turns: { type: [turnSchema], default: [] },
        finished: { type: Boolean, required: true, default: false },
        winner: { type: String, default: "" },
    },
    {
        timestamps: true,
    }
);

const statSchema = mongoose.Schema({
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    monStats: {
        type: [{
            monName: { type: String, required: true },
            monID: { type: String, required: true },
            monWins: { type: Number, default: 0 },
            monLosses: { type: Number, default: 0 },
        }]
    },
    userID: { type: mongoose.Schema.Types.ObjectId, required: true },
})

function arrayLimit(val) {
    return val.length <= 3;
}

const User = mongoose.model("User", userSchema);
const Team = mongoose.model("Team", teama);
const Battle = mongoose.model("Battle", battleSchema);
const Stat = mongoose.model("Stat", statSchema);

module.exports = {
    User,
    Team,
    Battle,
    Stat,
}