// const { ipcRenderer } = require("electron")

function chatInit(){
	ipcRenderer.on('all', (e, message) => {
		if(message.newMsg)
			addMsg(message.newMsg.username, message.newMsg.msg, message.newMsg.color)
	})
	fillMessages(store.get('messages'))

	$('#chatForm button').click(sendMsg)
	$('#chatform input').focus()
	$(document).keyup(function(e){
		if(e.key == 'Enter'){
			$(':focus').siblings('button').first().trigger("click")
		}
	})
}


function fillMessages(messages){
	console.log("messages:")
	console.log(USER.messages)
	$('#messages').empty()
	for (var i = 0; i < messages.length; i++) {
		addMsg(messages[i].username, messages[i].message, messages[i].color)
	}
}
function sendMsg(){
	var msg = $('#chatForm input').val();
	msg = sanitize(msg)
	if(msg.length > 0){
		toServer('newMsg', {username:USER.username, msg:msg, color:USER.color});
		$('#chatForm input').val('')
		if(USER.role == "guide"){
			save({fn:"sendChatMsg", params:[msg,USER.speakChat]})  
			if(USER.speakChat)
				relay({type:"speakText", msg:msg})
		}
	}
	console.log("sending msg")
}
function sendChatMsg(msg, speakChat){
		toServer('newMsg', {username:USER.username, msg:msg, color:USER.color});
		if(USER.speakChat)
			relay({type:"speakText", msg:msg})
}

function addMsg(user, msg, color){
	var colorString = "rgba("+color[0]+","+color[1]+","+color[2]+",0.85)"
	$('#messages').append("<p style='background-color:"+colorString+"'><strong>"+user+": </strong>"+msg+"</p>")
	$('#messages')[0].scrollTop = $('#messages p').last()[0].offsetTop - $('#messages')[0].offsetTop
	if(user == "The Guide"){
  		chrome.runtime.sendMessage({speakText: msg})
	}

}
function toServer(eName, obj={}){
	ipcRenderer.send('socketEvent', {socketEvent: eName, data: obj })
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