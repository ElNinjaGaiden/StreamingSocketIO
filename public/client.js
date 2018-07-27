var socket = io.connect();
var answersFrom = {};
var streamStatusLbl = document.getElementById('stream-status');

function error (err) {
    console.warn('Error', err);
}

window.addEventListener('load', function () {
    socket.emit('client-connected');
});

var pc = createPeerConnection();

pc.onicecandidate = function (evt) {
    console.log('onIceCandidate', evt);
}

pc.oniceconnectionstatechange = function () {
    console.log('onIceConnectionStateChange', pc);
    if(pc.iceConnectionState === 'closed') {
        socket.emit('client-connected');
    }
}

pc.onaddstream = function (obj) {
    console.log('on add stream', obj.stream, pc);
    var output = document.getElementById('output');
    output.srcObject = obj.stream;
    streamStatusLbl.innerHTML = 'Stream in progress';
}

pc.onremovestream = function () {
    console.log('stream removed');
    streamStatusLbl.innerHTML = 'Stream stopped';
}

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