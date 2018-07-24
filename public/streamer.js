var socket = io.connect();
var answersFrom = {};
var peerConnections = {};
var theStream;

var peerConnection = window.RTCPeerConnection ||
                    window.mozRTCPeerConnection ||
                    window.webkitRTCPeerConnection ||
                    window.msRTCPeerConnection;

var sessionDescription = window.RTCSessionDescription ||
                    window.mozRTCSessionDescription ||
                    window.webkitRTCSessionDescription ||
                    window.msRTCSessionDescription;

navigator.getUserMedia  = navigator.getUserMedia ||
navigator.webkitGetUserMedia ||
navigator.mozGetUserMedia ||
navigator.msGetUserMedia;

function error (err) {
    console.warn('Error', err);
}

function startStream () {
    var mediaConstraints = {
        video: true, 
        audio: {
            sampleSize: 8,
            echoCancellation: true
    }};
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
        
        var connections = Object.getOwnPropertyNames(peerConnections);
        for(var i = 0; i< connections.length; i++) {
            var pc = peerConnections[connections[i]];
            pc.removeStream(theStream);
        }

        var tracks = theStream.getTracks();
        for(var i = 0; i < tracks.length; i++) {
            tracks[i].stop && tracks[i].stop();
        }
        theStream = null;
    }

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
    pc.createOffer(function(offer) {
        pc.setLocalDescription(new sessionDescription(offer), function () {
            socket.emit('make-offer', {
                offer: offer,
                to: id
            });

            var localStreams = pc.getLocalStreams();
            if(theStream && !localStreams.length) {
                console.log('Adding stream');
                pc.addStream(theStream);
            }

        }, error);
    }, error);
}

socket.on('connect-clients', offerClients);
socket.on('disconnect-clients', offerClients);

socket.on('answer-made', function (data) {
    var pc = peerConnections[data.socket];
    pc.setRemoteDescription(new sessionDescription(data.answer), function () {
        if (!answersFrom[data.socket]) {
            createOffer(data.socket, pc);
            answersFrom[data.socket] = true;
        }
    }, error);
});

socket.on('add-users', function (data) {
    for (var i = 0; i < data.users.length; i++) {
        var el = document.createElement('div'),
            id = data.users[i];

        el.setAttribute('id', id);
        el.innerHTML = id;
        document.getElementById('users').appendChild(el);

        //Create the peer connection to each user
        var peerConn = new peerConnection({ iceServers: [{ urls: "stun:stun.services.mozilla.com",
            username: "somename",
            credential: "somecredentials" }]
        });

        peerConnections[id] = peerConn;
        createOffer(id, peerConn);
    }
});

socket.on('remove-user', function (id) {
    var div = document.getElementById(id);
    document.getElementById('users').removeChild(div);
    delete peerConnections[id];
});