const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    host: '/',
    path: '/myapp',
    port: '9000'
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    initConnection(stream)
}).catch(err => {
    console.log(err, "video not found - taking just audio")
    navigator.mediaDevices.getUserMedia({
        audio: true
    }).then(stream => {
        initConnection(stream)
    })
})

socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    console.log("user is calling")
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
        console.log("client answered")
    })
    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
    console.log(peers)
}

function addVideoStream(video, stream) {
    console.log(video)
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
        video.muted = true
    })
    videoGrid.append(video)
}

function initConnection(stream){
    addVideoStream(myVideo, stream)
    myPeer.on('call', call => {
        console.log("calling")
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })
    socket.on('user-connected', userId => {
        console.log("user is connected")
        connectToNewUser(userId, stream)
    })
}
