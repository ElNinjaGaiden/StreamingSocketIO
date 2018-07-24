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

var pc = new peerConnection({ iceServers: [{ urls: "stun:stun.services.mozilla.com",
    username: "somename",
    credential: "somecredentials" }]
});

pc.onaddstream = function (obj) {
    console.log('on add stream', obj.stream);
    var output = document.getElementById('output');
    output.srcObject = obj.stream;
}

// pc.onremovestream = function () {
//     console.log('stream removed');
// }

function createOffer (id) {
    pc.createOffer(function(offer) {
        pc.setLocalDescription(new sessionDescription(offer), function () {
            socket.emit('make-offer', {
                offer: offer,
                to: id
            });
        }, error);
    }, error);
}

socket.on('offer-made', function (data) {
    pc.setRemoteDescription(new sessionDescription(data.offer), function () {
        pc.createAnswer(function (answer) {
            pc.setLocalDescription(new sessionDescription(answer), function () {
                socket.emit('make-answer', {
                    answer: answer,
                    to: data.socket
                });
            }, error);
        }, error);
    }, error);
});

socket.on('answer-made', function (data) {
    pc.setRemoteDescription(new sessionDescription(data.answer), function () {
        if (!answersFrom[data.socket]) {
            createOffer(data.socket);
            answersFrom[data.socket] = true;
        }
    }, error);
});