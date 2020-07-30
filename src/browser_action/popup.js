const {ipcRenderer} = require('electron')
const Store = require('electron-store')
let store = new Store();
let USER = store.store;
store.onDidAnyChange(()=>{USER=store.store})
console.log(USER)
init()

ipcRenderer.on('all', (e, message)=>{
	if(message.rooms && USER.role == "audience" && !USER.room){
		//showRooms(message.rooms)
	}
	if(message.users){
		// showUsers(message.users)
	}
	if(message.error){
		showError(message.error)
	}
	if(message.joinRoomSuccess){
		joinRoom(message.room)
		console.log(message.room + " joined")
	}
	if(message.disconnected){
		// reset()
		console.log("disconnected")
	}
	if(message.restartAsGuide){
		USER.role = "guide";
		sync()
		init()
	}
	if(message.restartAsAudience){
		USER.role = "audience";
		sync()
		$('#guideTools').fadeOut()
		init()
	}
})

//event handlers





//on startup
function init(){
	// $('#mainDiv,#reset').hide()
	// $('#currentRoom').html("")
	$('#reset').click(reset)
	if(!store.get("username")){
		let username = "electron" + store.get('id').toString();
		// let username = prompt("What username would you like to go by?")
		username = sanitize(username)
		store.set('username', username)
		toServer('newMsg', {username:username, msg:"has joined lobby", color:USER.color});
	}
	$('#chat').load("../modules/chat.html",function(){
		chatInit()
	})
	//check for current performance
	if(!store.get('room')){
		$.ajax({
	        url: "http://hitchhiker.glitch.me/currentRoom.txt",
	        success: function(data){
	        	if(data.length > 0){
	        		$('#roomMessage').html(data)
	        	}	$('#roomMessage room').click(function(){
	        					attemptJoinRoom($(this).text())
	        					store.set('role', "audience") 
								store.set('messages', [])
								sync()
	        	})
	        }
    	});
		$('#guide,#audience').fadeIn()
		$('#audience').click(function(){
			//for private rooms
			//TODO add prompt
			// let roomToJoin = prompt("what is the name of the room you'd like to join?")
			let roomToJoin = 'electronTest'
			roomToJoin = roomToJoin.toLowerCase()
			console.log(roomToJoin)
			store.set('role', "audience") 
			store.set('messages', [])
			sync()
			attemptJoinRoom(roomToJoin)
			//
			
			//for public rooms
			// $('#audience,#guide').hide()
			// toServer('getRooms')
			
		})
		$('#guide').click(function(){
			store.set('role', "guide") 
			store.set('messages', [])
			var newRoom = 'electronTest'
			newRoom = newRoom.toLowerCase()
			console.log(newRoom)
			attemptJoinRoom(newRoom)
		})
	} 
	else {
		afterJoinRoom();
	}

	


}

function showRooms(rooms){
	console.log("showing rooms")
	if($('#roomList').length < 1)
		$('#roomManagement').append("<select id='roomList'></select>")
	$('#roomList').empty().append("<option>Choose an available room:</option>")
	for(var i in rooms){
		console.log(rooms[i].sockets)
		if(!(i in rooms[i].sockets) && i !== 'null' && i !== "lobby")
			$('#roomList').append("<option>"+i+"</option>")
	}
	$('#roomList').change(function(){
		if(this.selectedIndex > 0){
			//audience joins room
			attemptJoinRoom(this.options[this.selectedIndex].value)
		}
	})
}

function showUsers(users){
	for (var i = 0; i < users.length; i++) {
		console.log(users[i])
	}
}

function attemptJoinRoom(room){
	toServer("joinRoom", {room:room, username:USER.username, role:USER.role})
	
}

function joinRoom(room){
	$('#audience,#guide').hide()
	$('#roomList').fadeOut()
	$('#roomMessage').text("")
	store.set('room',room);
	toServer("status", {msg:USER.username +" has joined"})
	afterJoinRoom()
	ipcRenderer.send('roomJoined', true)
}

function showGuideTools(){
	$('#guideTools').fadeIn()
	
	$('#actions').load("../modules/guideActions.html",function(){
		bindGuideActions();
	})

}



function afterJoinRoom(){

	if(store.get('role') == "guide"){showGuideTools()}
	$('#currentRoom').html("<strong>Currently <em>"+store.get('role')+"</em> in <em>"+store.get('room')+"</em>")
	$('#mainDiv').fadeIn()
	$('#reset').text("Leave Room")

	
}


function showError(error){
	$('#errorMsg').text(error).fadeIn(400,function(){
		setTimeout(function(){$('#errorMsg').fadeOut()},3000)
	})
}


function toServer(eName, obj={}){
	ipcRenderer.send('socketEvent', {socketEvent: eName, data: obj })
}




function reset(){
	if(!store.has('role')){ipcRenderer.send('reconnect', true)}
	else {
		store.set({role:false, room:false})
		toServer("leaveRoom", store.store)
		location.reload()
	}
}

function sync(){
	store.set(USER)
}

function relay(obj){
	ipcRenderer.send('socketEvent', {socketEvent: "guideEvent", data: obj })
}

function sanitize(string) {
  const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
  };
  const reg = /[&<>]/ig;
  return string.replace(reg, (match)=>(map[match]));
}