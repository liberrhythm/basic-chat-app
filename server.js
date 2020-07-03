var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");

// mongodb not really used - ephemeral messaging (for now)
var dbUrl = "mongodb+srv://test:test@cluster0.zfdpz.mongodb.net/User?retryWrites=true&w=majority";
mongoose.connect(dbUrl, (err) => {
    if (err) console.log(err);
    else console.log("connection successful");
});

var User = mongoose.model("User", { name: String, color: String, messages: [] });

User.deleteMany({}, () => {
    console.log("cleared all users");
});

var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

io.on("connection", (socket) => {
    console.log("new user is connected");

    socket.on("disconnect", (user) => {
        socket.broadcast.emit("other disconnect", user);
    });

    socket.on("message", (info) => {
        socket.broadcast.emit("message", info);
    });
});

// enable CORS
app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.post("/messages", async (req, res) => {
    try {
        let username = req.body.name;
        let message = req.body.message;

        const user = await User.findOne({ "name": username });
        user.messages.push({ text: message });

        await user.save();
        res.sendStatus(200);
    } catch (err) {
        res.sendStatus(500);
    }
});

app.post("/users", (req, res) => {
    var user = new User(req.body);
    user.save((err) => {
        if (err) sendStatus(500);
        io.emit("other user", req.body);
        res.sendStatus(200);
    });
});

server.listen(3000, () => {
    console.log("server is running on port", server.address().port);
});