//if (typeof exports == "undefined") {
//    exports = this;
//}

//Client = function () {

//}

var socket = io.connect('http://localhost:8080/');

socket.on('message', function (data) {
    console.log("client a reçu un message : " + JSON.stringify(data));

    if (data.ledUp != undefined) {
        LedUp(data.ledUp);
    } else if (data.ledDown != undefined) {
        LedDown(data.ledDown);
    }
});

function sendControl(controlNumber) {
    switch (controlNumber) {
        case 0:
            //sendRequest("start");
            socket.emit("message", {command:"start"});
            break;
        case 1:
            //sendRequest("stop");
            socket.emit("message", { command: "stop" });
            break;
        case 2:
            //sendRequest("reverse");
            socket.emit("message", { command: "reverse" });
            break;
    }
}

function sendRequest(endURL) {
    const http = new XMLHttpRequest();
    const url = "http://148.60.135.79:8080/" + endURL;

    console.log("http request to " + url);

    http.open("get", url);
    http.send();
    http.onreadystatechange = function (e) {
        console.log(http.responsetext);

    }
}

function switchLedOnOff(nbLed) {
    let elem = document.getElementById("ledState" + nbLed);

    if (elem.classList.contains("on")) {
        elem.classList.remove("on");
        elem.classList.add("off");
    } else {
        elem.classList.remove("off");
        elem.classList.add("on");
    }

    //sendRequest("switchOn/" + nbLed);
}

function LedUp(nbLed) {
    let elem = document.getElementById("ledButton" + nbLed);

    if (elem.classList.contains("down")) {
        elem.classList.remove("down");
        elem.classList.add("up");
    } else {
        console.log("commande LedUp alors que la led " + nbLed + " est déjà allumée");
    }
}

function LedDown(nbLed) {
    let elem = document.getElementById("ledButton" + nbLed);

    if (elem.classList.contains("up")) {
        elem.classList.remove("up");
        elem.classList.add("down");
    } else {
        console.log("commande LedDown alors que la led " + nbLed + " est déjà éteinte");
    }
}