const mongoose = require('mongoose');
const db = mongoose.connection;

//connect to mongodb
async function connect(user, pass) {
    const connectionString = `mongodb+srv://${user}:${pass}@cluster0.ixjzc.mongodb.net/?retryWrites=true&w=majority`
    try {
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } catch (err) {
        console.log("error connecting to mongoose", err);
    }
}

//open mongo connection
function onConnect(callback) {
    db.once("open", () => {
        console.log("mongo connection open")
        callback();
    })
}

module.exports = {
    connect,
    onConnect,
}