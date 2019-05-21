const knx = require('knx');
const express = require('express');
var app = express();
const path = require('path');
//const WebSocket = require('ws');
//const ws = new WebSocket('ws://http://148.60.135.79:8080/');
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

server.listen(8080);

// -------------------- SOCKET.IO ----------------------------

var clients = [];

io.on('connection', function (socket) {
    //socket.emit('news', { hello: 'world' });

    socket.on('disconnect', function (data) {
        console.log("Client disconnected : " + socket.id + " Il y a " + clients.length + " utilisateurs connectés.");
        for (let i = 0; i < clients.length; i++) {
            if (clients[i].id === socket.id) {
                clients.splice(i, 1);
            }
        }
    });

    socket.on('message', (data) => {
        console.log("readMessage : " + data.command);
        readMessage(data);
    });

    clients.push(socket);
    console.log("Nouvelle connexion. Il y a " + clients.length + " utilisateurs connectés.");
});

function broadcast(msg) {
    console.log("broadcast " + msg);
    for (let i = 0; i < clients.length; i++) {
        clients[i].emit("message", msg);
    }
}

// ------------------- FIN SOCKET.IO ----------------------------------

function readMessage(data) {
    //var msg = JSON.parse(data);
    switch (data.command) {
        case "start":
            startChenillard();
            break;
        case "stop":
            chenillardStop = !chenillardStop;
            break;
        case "reverse":
            isReverse = isReverse ? false : true;
            break;
    }
}

//Static assets
app.use(express.static(path.join(__dirname, 'public')));

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

//Modules
//const clientModule = require("./client.js");

//Gestion template
const pug = require('pug');
const compiledFunction = pug.compileFile('views/controlPanel.pug');
app.set("view engine", "pug");

// sets port 8080 to default or unless otherwise specified in the environment
app.set('port', process.env.PORT || 8080);


// ------------------ KNX ----------------------------------------------------

var isKnxConnected = true;
var isChenillardStarted = false;
var chenillardSpeed = 1000;
var chenillardStop = false;
var isReverse = false;
var chenillardCounter = 0;
var chenillardPath = [1, 1, 1, 1];

var connection = knx.Connection({
    handlers: {
        connected: function () {
            console.log('Connected to knx !');
            switchAll(0);
            isKnxConnected = true;
        },
        event: function (evt, src, dest, value) {
            console.log("%s **** KNX EVENT: %j, src: %j, dest: %j, value: %j",
                new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                evt, src, dest, value);
        },
        error: function (connStatus) {
            console.log("**** ERROR: %j", connStatus);
        }
    }
});

app.get("/", (req, res) => {
    res.render('controlPanel.pug', { connectionState: "non connecté", chenillardState: "arrêté"});
});

//app.get("/start", (req, res) => {
//    startChenillard();
//    res.json({ chenillardState: "started", speed: chenillardSpeed });
//});

//app.get("/stop", (req, res) => {
//    chenillardStop = true;
//    console.log("chenillard stoppé");
//    res.json({ chenillardState: "stopped", speed: chenillardSpeed });
//});

//app.get("/reverse", (req, res) => {
//    isReverse = true;
//    res.json({ chenillardState: "reversed", speed: chenillardSpeed });
//});

//app.get("/switchOn/:ledId", (req, res) => {
//    let nbLed = req.params.ledId;
    
//});

//app.listen(app.get('port'), () => {
//    console.log("Server listening on port " + app.get('port'));
//});                                                   

async function startChenillard() {
    if (isKnxConnected) {

        chenillardStop = false;
        isChenillardStarted = true;

        while (!chenillardStop) {
            ledUp(chenillardCounter);
            await wait(chenillardSpeed);
            if (!chenillardStop) {
                ledDown(chenillardCounter);
                isReverse ? chenillardCounter-- : chenillardCounter++;
                chenillardCounter > 3 ? chenillardCounter = 0 : chenillardCounter = chenillardCounter;
                chenillardCounter < 0 ? chenillardCounter = 3 : chenillardCounter = chenillardCounter;
            }
        }

    } else {
        console.log("La connexion KNX n'est pas établie.");
    }
}

function wait(time) {
    return new Promise(resolve => {
        setTimeout(function () {
            resolve("wait");
            console.log("nouveau tick d'horloge");
        }, 2000);
    }).catch(err => {
        console.log("Erreur promise : " + err);
    });
}

function ledUp(nbLed) {
    if (isKnxConnected && connection != null) {
        //let elem = document.getElementById("ledButton" + nbLed);
        //elem.classList.remove("down");
        //elem.classList.add("up");
        broadcast({ ledUp: nbLed });
        connection.write("0/1/" + nbLed, 1);
    }
}

function ledDown(nbLed) {
    if (isKnxConnected && connection != null) {
        //let elem = document.getElementById("ledButton" + nbLed);
        //elem.classList.remove("up");
        //elem.classList.add("down");
        broadcast({ ledDown: nbLed });
        connection.write("0/1/" + nbLed, 0);
    }
}

function switchAll(value) {
    if (isKnxConnected && connection != null) {
        for (i = 0; i < 4; i++) {
            connection.write("0/1/" + i, value);
        }
    }                  
}