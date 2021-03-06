var socket = io.connect();
var answersFrom = {};
var peerConnections = {};
var theStream;

navigator.getUserMedia  = navigator.getUserMedia ||
navigator.webkitGetUserMedia ||
navigator.mozGetUserMedia ||
navigator.msGetUserMedia;

window.addEventListener('load', function () {
    socket.emit('streamer-connected');
});

function error (err) {
    console.warn('Error', err);
}

function startStream () {
    var mediaConstraints = {
        video: true, 
        audio: {
            sampleSize: 8,
            echoCancellation: true
        }
    };
    navigator.getUserMedia(mediaConstraints, function (stream) {
        var input = document.getElementById('input');
        input.srcObject = stream;
        theStream = stream;

        var connections = Object.getOwnPropertyNames(peerConnections);
        for(var i = 0; i< connections.length; i++) {
            var pc = peerConnections[connections[i]];
            pc.addStream(stream);
        }

        socket.emit('stream-ready');
    }, error);
}

function stopStream () {
    var input = document.getElementById('input');
    input.pause();
    input.currentTime = 0;

    if(theStream) {
        //Remove the stream from each peer connection
        var connections = Object.getOwnPropertyNames(peerConnections);
        for(var i = 0; i< connections.length; i++) {
            var pc = peerConnections[connections[i]];
            pc.removeStream(theStream);
        }

        //Stop all the local tracks of the stream
        var tracks = theStream.getTracks();
        for(var i = 0; i < tracks.length; i++) {
            tracks[i].stop && tracks[i].stop();
        }
        //"Clear" the local stream var
        theStream = null;
    }
    //Emit a socket event to start to send "offers" to connected clients
    socket.emit('stop-stream');
}

var startStreamBtn = document.getElementById('start-stream');
startStreamBtn && startStreamBtn.addEventListener('click', startStream);

var stopStreamBtn = document.getElementById('stop-stream');
stopStreamBtn && stopStreamBtn.addEventListener('click', stopStream);

function offerClients (data) {
    for(var i = 0; i < data.clients.length; i++) {
        var clientId = data.clients[i];
        var peerConn = peerConnections[clientId];
        createOffer(clientId, peerConn);
    }
}

function createOffer (id, pc) {
    pc.createOffer()
    .then(function (offer) {
        return pc.setLocalDescription(new sessionDescription(offer));
    })
    .then(function () {
        socket.emit('make-offer', {
            //pc.localDescription holds the "offer" info
            offer: pc.localDescription,
            to: id
        });
    })
    .catch(error);
}

socket.on('connect-clients', offerClients);
socket.on('disconnect-clients', offerClients);

socket.on('answer-made', function (data) {
    var pc = peerConnections[data.socket];
    pc.setRemoteDescription(new sessionDescription(data.answer))
    .then(function () {
        if (!answersFrom[data.socket]) {
            createOffer(data.socket, pc);
            answersFrom[data.socket] = true;
        }
    })
    .catch(error);
});

socket.on('add-users', function (data) {
    var users = data.users;
    for (var i = 0; i < users.length; i++) {
        var el = document.createElement('div'),
            id = users[i];

        el.setAttribute('id', id);
        el.innerHTML = id;
        document.getElementById('users').appendChild(el);

        //Create the peer connection to each user
        //var peerConn = new peerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        var peerConn = createPeerConnection();

        //Save the peer connection with the given client locally
        peerConnections[id] = peerConn;

        //Chech if the stream has been started before the given user gets connected 
        if(theStream) {

            //Attach the stream (if it has been started)
            peerConn.addStream(theStream);

            //Create the offer to connect to the client
            createOffer(id, peerConn);
        }
    }
});

socket.on('remove-user', function (id) {
    var div = document.getElementById(id);
    var pc = peerConnections[id];
    div && document.getElementById('users').removeChild(div);
    theStream && pc && pc.removeStream(theStream);
    pc && pc.close();
    delete peerConnections[id];
});