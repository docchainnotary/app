// Configuration for STUN/TURN servers
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Add TURN servers here if needed
    ]
};

// Global variables
let peerConnection;
let localStream;
let socket;
let roomId;

// DOM elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const hangupBtn = document.getElementById('hangupBtn');
const roomIdInput = document.getElementById('roomId');
const statusDiv = document.getElementById('status');

// Connect to signaling server
socket = io('https://api.docchainnotary.com:8443'); // Replace with your server URL

// Socket event handlers
socket.on('created', handleRoomCreated);
socket.on('joined', handleRoomJoined);
socket.on('offer', handleOffer);
socket.on('answer', handleAnswer);
socket.on('ice-candidate', handleIceCandidate);
socket.on('disconnected', handlePeerDisconnected);

// Button click handlers
createBtn.onclick = createRoom;
joinBtn.onclick = joinRoom;
hangupBtn.onclick = hangup;

// Initialize local media stream
async function initLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        localVideo.srcObject = localStream;
    } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Error accessing camera/microphone');
    }
}

// Create a new room
async function createRoom() {
    await initLocalStream();
    roomId = roomIdInput.value || Math.random().toString(36).substr(2, 9);
    socket.emit('create', roomId);
    roomIdInput.value = roomId;
    updateStatus('Created room: ' + roomId);
}

// Join an existing room
async function joinRoom() {
    await initLocalStream();
    roomId = roomIdInput.value;
    socket.emit('join', roomId);
    updateStatus('Joining room: ' + roomId);
}

// Handle room creation
function handleRoomCreated() {
    updateStatus('Waiting for peer to join...');
    enableControls(true);
}

// Handle room joined
function handleRoomJoined() {
    createPeerConnection();
    enableControls(true);
    // Create and send offer
    peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
            socket.emit('offer', {
                room: roomId,
                sdp: peerConnection.localDescription
            });
        });
}

// Create RTCPeerConnection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // Add local stream
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    // Handle ICE candidates
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                room: roomId,
                candidate: event.candidate
            });
        }
    };

    // Handle incoming stream
    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
        updateStatus('Connected');
    };
}

// Handle incoming offer
async function handleOffer(offer) {
    if (!peerConnection) {
        createPeerConnection();
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer.sdp));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('answer', {
        room: roomId,
        sdp: peerConnection.localDescription
    });
}

// Handle incoming answer
async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer.sdp));
}

// Handle incoming ICE candidate
function handleIceCandidate(incoming) {
    const candidate = new RTCIceCandidate(incoming.candidate);
    peerConnection.addIceCandidate(candidate);
}

// Handle peer disconnection
function handlePeerDisconnected() {
    updateStatus('Peer disconnected');
    hangup();
}

// Hangup call
function hangup() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    
    enableControls(false);
    updateStatus('Disconnected');
}

// Update status message
function updateStatus(message) {
    statusDiv.textContent = message;
}

// Enable/disable controls
function enableControls(connected) {
    createBtn.disabled = connected;
    joinBtn.disabled = connected;
    hangupBtn.disabled = !connected;
    roomIdInput.disabled = connected;
}

