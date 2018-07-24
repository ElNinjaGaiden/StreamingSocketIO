var socket = io.connect();
var answersFrom = {};

var peerConnection = window.RTCPeerConnection ||
                    window.mozRTCPeerConnection ||
                    window.webkitRTCPeerConnection ||
                    window.msRTCPeerConnection;

var sessionDescription = window.RTCSessionDescription ||
                        window.mozRTCSessionDescription ||
                        window.webkitRTCSessionDescription ||
                        window.msRTCSessionDescription;

function error (err) {
    console.warn('Error', err);
}

window.addEventListener('load', function () {
    socket.emit('client-connected');
});

var pc = new peerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

pc.onicecandidate = function (evt) {
    console.log('onIceCandidate', evt);
}

pc.oniceconnectionstatechange = function () {
    console.log('onIceConnectionStateChange', pc);
}

pc.onaddstream = function (obj) {
    console.log('on add stream', obj.stream, pc);
    var output = document.getElementById('output');
    output.srcObject = obj.stream;
}

// pc.onremovestream = function () {
//     console.log('stream removed');
// }

function createOffer (id) {
    pc.createOffer()
    .then(function (offer) {
        return pc.setLocalDescription(new sessionDescription(offer));
    })
    .then(function () {
        socket.emit('make-offer', {
            offer: offer,
            to: id
        });
    })
    .catch(error);
}

socket.on('offer-made', function (data) {
    pc.setRemoteDescription(new sessionDescription(data.offer))
    .then(function () {
        return pc.createAnswer();
    })
    .then(function (answer) {
        return pc.setLocalDescription(new sessionDescription(answer));
    })
    .then(function () {
        socket.emit('make-answer', {
            //pc.localDescription holds the "answer" info
            answer: pc.localDescription,
            to: data.socket
        });
    })
    .catch(error);
});

socket.on('answer-made', function (data) {
    pc.setRemoteDescription(new sessionDescription(data.answer))
    .then(function () {
        if (!answersFrom[data.socket]) {
            createOffer(data.socket);
            answersFrom[data.socket] = true;
        }
    })
    .catch(error);
});