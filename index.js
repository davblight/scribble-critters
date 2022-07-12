const app = require("./server/server");
const { connect, onConnect } = require("./persist/connect");

// put in env vars
require('dotenv').config();
// const buf = Buffer.from(env)
// const config = dotenv.parse(buf)
//set up port number
const port = process.env.SCRIBBLE_PORT || 4000;

onConnect(() => {
    app.listen(port, () => {
        console.log(`serving on port ${port}`);
    });
})

try {
    connect(process.env.SCRIBBLE_USER, process.env.SCRIBBLE_PASSWORD);
} catch (err) {
    console.log(err);
    throw "couldnt start"
}