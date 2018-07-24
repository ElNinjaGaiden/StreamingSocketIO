var peerConnection = window.RTCPeerConnection ||
                    window.mozRTCPeerConnection ||
                    window.webkitRTCPeerConnection ||
                    window.msRTCPeerConnection;

var sessionDescription = window.RTCSessionDescription ||
                    window.mozRTCSessionDescription ||
                    window.webkitRTCSessionDescription ||
                    window.msRTCSessionDescription;

function createPeerConnection () {
    var pc = new peerConnection(
        { 
            iceServers: [
                { 
                    //urls: 'stun:stun.l.google.com:19302' 
                    url: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                }
            ] 
        }
    );
    return pc;
}