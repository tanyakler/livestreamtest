// We need to import the CSS so that webpack will load it.
// The MiniCssExtractPlugin is used to separate it out into
// its own CSS file.
import css from "../css/app.scss";

// webpack automatically bundles all modules in your
// entry points. Those entry points can be configured
// in "webpack.config.js".
//
// Import deps with the dep name or local files with a relative path, for example:
//
//     import {Socket} from "phoenix"
//     import socket from "./socket"
//
import "phoenix_html";

import channel from './socket';

const connectButton = document.getElementById('connect');
const callButton = document.getElementById('call');
const disconnectButton = document.getElementById('disconnect');

const remoteVideo = document.getElementById('remote-stream');
const localVideo = document.getElementById('local-stream');
const remoteStream = new MediaStream();

const reportError = where => error => {
  console.error(where, error)
}

function log() {
  console.log(...arguments)
}

function setVideoStream(videoElement, stream) {
  videoElement.srcObject = stream;
}

function unsetVideoStream(videoElement) {
  if (videoElement.srcObject) {
    videoElement.srcObject.getTracks().forEach(track => track.stop())
  }
  videoElement.removeAttribute('src');
  videoElement.removeAttribute('srcObject');
}

async function connect() {
  connectButton.disabled = true;
  disconnectButton.disabled = false;
  callButton.disabled = false;
  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  setVideoStream(localVideo, localStream);
}

function disconnect() {
  connectButton.disabled = false;
    disconnectButton.disabled = true;
    callButton.disabled = true;
    unsetVideoStream(localVideo);
    unsetVideoStream(remoteVideo);
    peerConnection.close();
    peerConnection = null;
    remoteStream = new MediaStream();
    setVideoStream(remoteVideo, remoteStream);
    pushPeerMessage('disconnect', {});
  }

async function connect() {
  // ...
  peerConnection = createPeerConnection(localStream);
}
// ...
function createPeerConnection(stream) {
  let pc = new RTCPeerConnection({
    iceServers: [
      // Information about ICE servers - Use your own!
      {
        urls: 'stun:stun.stunprotocol.org',
      },
    ],
  });
  pc.ontrack = handleOnTrack;
  pc.onicecandidate = handleOnIceCandidate;
  stream.getTracks().forEach(track => pc.addTrack(track));
  return pc;
}

function pushPeerMessage(type, content) {
  channel.push('peer-message', {
    body: JSON.stringify({
      type,
      content
    }),
  });
}

async function call() {
  let offer = await peerConnection.createOffer();
  peerConnection.setLocalDescription(offer);
  channel.push('peer-message', {
    body: JSON.stringify({
      'type': 'video-offer',
      'content': offer
    }),
  });
  pushPeerMessage('video-offer', offer);
}

function handleOnTrack(event) {
  log(event);
}

function handleIceCandidate(event) {
  if (!!event.candidate) {
    pushPeerMessage('ice-candidate', event.candidate);
  }
}
function receiveRemote(offer) {
  let remoteDescription = new RTCSessionDescription(offer);
  peerConnection.setRemoteDescription(remoteDescription);
}

async function answerCall(offer) {
  receiveRemote(offer);
  let answer = await peerConnection.createAnswer();
  peerConnection
    .setLocalDescription(answer)
    .then(() =>
      pushPeerMessage('video-answer', peerConnection.localDescription)
    );
}

function handleOnTrack(event) {
  remoteStream.addTrack(event.track);
}

setVideoStream(remoteVideo, remoteStream);

let peerConnection;

disconnect.disabled = true;
call.disabled = true;
connectButton.onclick = connect;
callButton.onclick = call;
disconnectButton.onclick = disconnect;
channel.on('peer-message', payload => {
  const message = JSON.parse(payload.body);
  switch (message.type) {
    case 'video-offer':
      log('offered: ', message.content);
      answerCall(message.content);
      break;
    case 'video-answer':
      log('answered: ', message.content);
      receiveRemote(message.content);
      break;
    case 'ice-candidate':
      log('candidate: ', message.content);
      let candidate = new RTCIceCandidate(message.content);
      peerConnection.addIceCandidate(candidate).catch(reportError);
      break;
    case 'disconnect':
      disconnect();
      break;
    default:
      reportError('unhandled message type')(message.type);
  }
});
