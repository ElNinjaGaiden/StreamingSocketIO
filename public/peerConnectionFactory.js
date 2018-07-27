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
                // {
                //     urls: 'stun:stun.services.mozilla.com'
                // }, 
                // {
                //     urls: 'stun:stun.l.google.com:19302'
                // }, 
                {
                    urls        : 'turn:numb.viagenie.ca',
                    credential  : 'W3bRTCs3rv3r',
                    username    : 'chinopb@gmail.com'
                }
            ]
        }
    );
    return pc;
}