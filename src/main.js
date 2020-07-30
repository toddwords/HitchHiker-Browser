const { app, BrowserWindow, ipcMain, protocol  } = require('electron');
const path = require('path');
const io = require('socket.io-client')
const axios = require('axios')
const Store = require('electron-store')
// import { protocol } from "electron";


// store.set("foo", "bar")
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}
let win;
let popup;
let dashboard;
const createWindow = () => {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: 'src/inject/inject.js',
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
      webviewTag: true
    }
  });
  popup = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
    }
  })
  // ses.loadExtension('HitchHiker')
  // and load the index.html of the app.
  win.loadFile('src/index.html');
  popup.loadFile('src/browser_action/index.html')
  // Open the DevTools.
  win.webContents.openDevTools();
  setTimeout(function(){store.set('foo', 'notbar')},5000);
  bindMessagingEvents();

      	
  };
app.commandLine.appendSwitch("autoplay-policy=no-user-gesture-required");
app.commandLine.appendSwitch("allow-file-access-from-files");
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = request.url.replace('file:///', '');
    callback(pathname);
  });
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

var USER;

let socket;
const store = new Store();
console.log(store.store)
if(!store.has("id")){
  store.set({"id":new Date().getTime(), "performances": {"First Performance":{"urlList":[], "actions":[]}}, counter:-1, currentPerformance:"First Performance", "username":false },function(){console.log("initialized")})
}
store.set({"room":false, "role":false, counter:-1, "color":[Math.floor(Math.random() * 180)+75,Math.floor(Math.random() * 180)+75,Math.floor(Math.random() * 180)+75],messages:[], performanceTab: false, scrollSync:false, speakChat:false, isRecording:false})
USER = store.store;
store.onDidAnyChange(function(){
  USER = store.store;
})


// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//     //make sure this is the active tab
//     console.log(changeInfo)
//     if(USER.role == "guide" && tab.url.indexOf('http') >= 0 && changeInfo.url && tabId == USER.performanceTab){
//       socket.emit('newPage', {url:tab.url})
//       tab.title = "[HitchHiker] "+tab.title;
//     }
//     if(tab.url.indexOf('http') >= 0 && changeInfo.status == 'complete' && tab.active){
//       console.log(chrome.runtime.getURL('src/user_created/'+USER.room+'.js'))
//       chrome.tabs.executeScript(USER.performanceTab,{file:'src/user_created/'+USER.room+'.js'})
//     }
// });

// chrome.tabs.onRemoved.addListener(function(tabId,removeInfo){
//   if(tabId == USER.performanceTab){
//     createNewPerformanceTab();
//   }
// })


// //DEV SERVER
// // var socket = io('https://hitchhiker.glitch.me')
// //PRODUCTION SERVER
// // var socket = io('http://hitchhiker.us-east-2.elasticbeanstalk.com')

connectToServer();
function connectToServer(){
  axios.get("https://raw.githubusercontent.com/toddwords/HitchHiker/master/currentServer.txt")
    .then(response => {
      let serverURL = response.data
      socket = io(serverURL)
      console.log(serverURL)
      bindSocketEvents()
    })
}
  // socket = io("https://hitchhiker-server.herokuapp.com/")

  // socket.on('connect_error', function(){
  //     console.log("connection error, switching to backup server")
  //     socket = io('https://hitchhiker.glitch.me')
  // })


function bindMessagingEvents(){
  ipcMain.on('test', (e, data) => {
    console.log(data)
  })
  ipcMain.on('marco', (e, data) => {
    console.log(data)
  })
  ipcMain.on('marco-webview', (e, data) => {
    console.log(data + "-webview")
  })
  ipcMain.handle('getStoreValue', (event, key) => {
    return store.get(key);
  });
  ipcMain.handle('getStore', (event, key) => {
    return store.store;
  });
  ipcMain.on('socketEvent', (e,message) =>{
      socket.emit(message.socketEvent, message.data)
  })

  ipcMain.on('roomJoined', (e, message) =>{
    onJoinRoom()
  })
  ipcMain.on('reconnect', (e, message) =>{
    socket.disconnect(true)
    connectToServer()
  })
  ipcMain.on('newPageClient', (e, message) =>{
    updatePage(message.newPageClient)
  })
  ipcMain.on('makeDashboard',(e,message) => {
    makeDashboardWindow();
  })
}
function bindSocketEvents(){

  socket.on('connect', () => {console.log("connected")})
  socket.on('reconnect', () => {
    if(USER.room){
      socket.emit("joinRoom", {room:room, username:USER.username, role:USER.role})
    }
  })

  socket.on('guideEvent', function(data){
    
    
    if(data.type == "speakText"){
      speakText(data.msg)
    }
    toWebview(data)
    console.log(data)
  })
  socket.on('toClient', function(data){
    sendAll(data)
  })
  socket.on('status', function(data){
    console.log("status received")
    sendAll(data)
  })
  socket.on('newPage', function(data){
  	updatePage(data.url)
  })
  socket.on('newMsg', function(data){
  	addMsg(data.username, data.msg, data.color)
    //speakText(data.msg)
    sendAll({newMsg:data})
    // if(USER.performanceTab)
    //   chrome.tabs.sendMessage(USER.performanceTab, {newMsg: data});

  })
  socket.on('changeText', function(data){
  	console.log('message received')
  	changeText(data.newText)
  	speakText(data.newText)
  })
  socket.on('becomeGuide', function(data){
    USER.role = "guide"
    sync()
    console.log("i am a guide now")
    sendAll({restartAsGuide:true})
  })
  socket.on("becomeAudience", function(){
      USER.role = "audience"
      sync()
      console.log("i am audience now")
      sendAll({restartAsAudience:true})
  })  
  socket.on('disconnect', function(reason){
    sendAll({disconnected:true})
    console.log(reason)
  })
}

function sendAll(data, channel="all"){
  popup.webContents.send(channel, data)
  win.webContents.send(channel,data)
  if(dashboard && dashboard.webContents){dashboard.webContents.send(channel,data)}
}
function toWebview(data, channel="all"){
  win.webContents.send(channel, data)
}
//functions
function changeText(str){
	toWebview({changeText: str})
}

function newPage(newURL){

    updatePage(newURL)

}
function updatePage(newURL){
  // chrome.tabs.update(USER.performanceTab, {url:newURL, active:true}, function(tab){
  //     tab.title = "[HitchHiker] "+tab.title;
  //     socket.emit("status", {msg:"currently on "+tab.url})  
  // })
  toWebview({newURL:newURL})
  var data = {username:"server",msg:"Going to " + newURL,color:[127,127,127]}
  addMsg(data.username, data.msg, data.color)
  sendAll({newMsg: data})
}

function addMsg(user, msg, color){
  let messages = store.get('messages')
	messages.push({username:user, message:msg, color:color})
  store.set('messages',messages)
}

function speakText(text){
  //TODO: add in speaktext  
  //chrome.tts.speak(text, {voiceName: "Google UK English Male", rate: 0.75})
}

 function openNewWindow(newUrl, left, top, time){
  var newTimeout = setTimeout(function(){
    if(newUrl.slice(0,4) != "http"){newUrl = "http://"+newUrl}
    chrome.windows.create({ url: newUrl, left:left, top:top, width:500, height:400 });
  }, time * 1000)
  timeouts.push(newTimeout)
}

function onJoinRoom(){
  console.log('joining room')
  if(store.get('role') == "guide"){
    makeDashboardWindow();
  }
  else
    socket.emit("getCurrentPage")
}
function makeDashboardWindow(){
  dashboard = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
    }
  })
  dashboard.loadFile("src/dashboard/index.html")
}
function sync(){
  store.set(USER)
}