var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");

var dbUrl = "mongodb+srv://test:test@cluster0.zfdpz.mongodb.net/Messages?retryWrites=true&w=majority";
mongoose.connect(dbUrl, (err) => {
    if (err) console.log(err);
    else console.log("connection successful");
});

var Message = mongoose.model("Message", { name: String, message: String });
Message.deleteMany({}, () => {
    console.log("cleared all messages");
});

var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

io.on("connection", (socket) => {
    console.log("a user is connected");
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on("message", (msg) => {
        console.log("message: " + msg);
        io.emit("message", msg);
    });
});

// enable CORS
app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get("/messages", (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages);
    });
});

app.post("/messages", (req, res) => {
    var message = new Message(req.body);
    message.save((err) => {
        if (err) sendStatus(500);
        io.emit("message", req.body);
        res.sendStatus(200);
    });
});

server.listen(3000, () => {
    console.log("server is running on port", server.address().port);
});