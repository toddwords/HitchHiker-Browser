// const enav = new (require('electron-navigation'))();
const {ipcRenderer} = require('electron')
const Store = require('electron-store')
let store = new Store();
let USER = store.store;
store.onDidAnyChange(()=>{
    USER = store.store
})
const webview = document.querySelector('webview')
webview.addEventListener('console-message', (e) => {
  console.log('Webview:', e.message)
})
webview.addEventListener('did-finish-load', (e) => {
  webview.openDevTools()
  webview.insertCSS(css)
  $('#nav-ctrls-url').val(webview.src)
  console.log(USER.role)
  if(USER.role == "guide")
    console.log(webview.src)
    toServer('newPage', {url:webview.src})
})
ipcRenderer.on('test', (e, data) => {
    console.log(data)
    console.log(e)
    e.returnValue = 'pong'
})
ipcRenderer.on('all', (e,data)=> {
  webview.send('all', data)
  if(data.type == "playSound"){
    console.log(data.src)
    var audio = new Audio(data.src)
    audio.loop = data.loop;
    audioTracks.push(audio)
    audioTracks[audioTracks.length-1].play()
    sendStatus("playing sound")
    return false;
  }
  if(data.type == "stopAudio"){
    for (var i = 0; i < audioTracks.length; i++) {
      audioTracks[i].pause();
    }
    return false
  }
  if(data.type == "deleteRecent"){
    if(audioTracks.length > 0){
      var stopAudio = audioTracks.pop()
      stopAudio.pause()
    }
    return false
  }
})
ipcRenderer.send('marco', 'polo')

//jQuery Events
$('#nav-ctrls-url').keyup(function(e){
  if(e.key == "Enter"){
    var newURL = $('#nav-ctrls-url').val().trim();
        if(newURL.indexOf('http') < 0){newURL = "http://"+newURL}
    if(isURL(newURL))
      webview.loadURL(newURL)
  }
})
$('#nav-ctrls-back').click(()=>{
  webview.goBack()
})
$('#nav-ctrls-forward').click(()=>{
  webview.goForward()
})
$('#nav-ctrls-reload').click(()=>{
  webview.reload()
})
function isURL(str) {
var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
if(!regex .test(str)) {
return false;
} else {
return true;
}
}
function relay(obj){
	ipcRenderer.send('socketEvent', {socketEvent: "guideEvent", data: obj })
}
function sync(){
	store.set(USER);
}
function toServer(eName, obj={}){
	ipcRenderer.send('socketEvent', {socketEvent: eName, data: obj })
}
function sendStatus(status){
    ipcRenderer.send('socketEvent', {socketEvent:"status", data:{msg:status}})
}
let audioTracks = [];
let css = `#chatDiv{
position:fixed;
top:10px;
right:30px;
width:300px;
z-index: 99999;
}
.chatBubble{
width:100%;
border-radius:20px;
background-color: rgba(255,255,0,0.85);
min-height: 50px;
margin-bottom:5px;
border: 2px solid goldenrod;
padding:5px 10px;
}
#inputDiv{
display:none;
position: fixed;
bottom: 50px;
left: 0;
right: 0;
margin:auto;
width: 80%;
max-width: 1000px;
color: orange;
background-color: #444;
border: 3px solid #333;
font-size:20px;
padding:8px 14px;
border-radius: 20px;
z-index:99999;
}
#chatInput {
background-color: #444;
width:90%;
color: orange;
padding: 12px;
border:none;
outline:none;
font-size:24px;
}

.beingEdited {
border: 2px solid red;
border-radius: 4px;
animation-iteration-count: infinite;
animation-direction: alternate;
animation-duration: 0.5s;
animation-name: editing;

}
.mildEditBorder {
border: 2px solid black;
border-radius: 10px;
padding:10px;
}
#drawing-container{
position:absolute;
top:0;
left:0;
z-index:99998;
}

.multiGif {
position:fixed;
top:0;
left:0;
z-index: 99999;
}

.multiMouse {
position:absolute;
z-index: 999999;
width:16px;
}

.animate {
animation-iteration-count: infinite;
animation-direction: alternate;
}
.dance {
animation-duration: 1.5s;
animation-name: dance;
animation-delay:0.25s;
}

.dance2 {
animation-duration: 1.5s;
animation-name: dance2;
animation-delay:0.25s;
}
.fastPulse {
animation-duration: 0.25s;
animation-name: fastPulse;

}
.slowTop {
animation-duration: 20s;
animation-name: slowTop;
}

@keyframes dance {
from {
transform: translate(0px,0px);
}

50% {
  transform: translate(200px,40px)
}

to {
  transform: translate(400px,-200px)
}
}

@keyframes dance2 {
from {
transform: translate(0px,0px);
transform: skewY(0deg);
transform: rotate(0deg);
}

50% {
  transform: translate(40px,120px);
  transform: skewY(30deg);
transform: rotate(40deg);
}

to {
  transform: translate(-40px,240px);
  transform: skewY(120deg);
transform: rotate(270deg);
}
}

@keyframes fastPulse {
from {
transform: scale(1);
}

to {
  transform: scale(1.5);
}
}

@keyframes slowTop {
from {
    transform: translateY(0px);
}

to {
    transform: translateY(-1000px);
}
}

@keyframes editing {
from {
    border: 4px solid red;
}

to {
    border: 4px solid orange;
}
}`