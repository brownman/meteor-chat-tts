Users = new Meteor.Collection('users');

Messages = new Meteor.Collection('messages');
ChatStream = new Meteor.Stream('chat');

const SEND_TO_ALL_ID = '_all_';
function get_time(){
var today=new Date();
var h=today.getHours();
var m=today.getMinutes();
var s=today.getSeconds();
// add a zero in front of numbers<10
m=checkTime(m);
s=checkTime(s);

var clock1=h+":"+m+":"+s;
return clock1
}
function checkTime(i)
{
if (i<10)
  {
  i="0" + i;
  }
return i;
}

var me = function() {
	return Session.get('me');
};

var user = function() {
  return me() ? Users.findOne(me().id) : null;
};

Template.join.show = function() {
  return !user();
};

Template.join.users = function() {
	return Users.find();
};

Template.join.events({
	'click button#join': function() {
		var name = $('#lobby input#name').val().trim();
if (name != '') {
		Meteor.call('joinRoom', name, function(error, userId) {
			console.log('My id is: ' + userId);
			Session.set('me', { id: userId, name: name });
			ChatStream.emit('join', name);

			GoofedTTS.speak('Welcome ' + name);
		});
        }
else{
alert('invalid name');
}

	}
});
Template.messages.messages = function () {
  return Messages.find({}, { sort: { createdAt: -1 }});

  /*
   *return Messages.find({}, { sort: { createdAt: -1 }},  limit: 20);
   */
}
Template.dashboard.show = function() {
	return user();
};
Template.messages.show = function() {
	return user();
};

Template.dashboard.users = function() {
	return Users.find({_id: { $ne: me().id }});
};

Template.dashboard.me = function() {
	return me();
}

Template.dashboard.events({


 'keydown #dashboard input#message' : function (event) {
    if (event.which == 13) { // 13 is the enter key event


  

		var message = $('#dashboard input#message').val().trim();
	//	var receivers = UI.getReceivers() || SEND_TO_ALL_ID;
//		console.log('[Sending message] to: [' + receivers + ']; message: ' + message);

		if (message.length) {
          var  obj1={
          message: message,
          name: me().name,
          createdAt: new Date()
        };
          console.log(obj1);
         
           Messages.insert(obj1);
           console.log(Messages);
  
           

		//  ChatStream.emit('message', { from: me().name, to: receivers, message: message });
document.getElementById('message').value = '';
        message.value = '';
		}

  }
    },
'click button#send': function() {


		var message = $('#dashboard input#message').val().trim();
		var receivers = UI.getReceivers() || SEND_TO_ALL_ID;
		console.log('[Sending message] to: [' + receivers + ']; message: ' + message);

	
           



	if (message.length) {

		  ChatStream.emit('message', { from: me().name, to: receivers, message: message });

message='-----' + message
          var  obj1={
          message: message,
          name: me().name,
          createdAt: new Date()
        };
         
           Messages.insert(obj1);
document.getElementById('message').value = '';
        message.value = '';
  
		}
}


});

Template.dashboard.rendered = function() {
	UI.synchonizeAllSelected(false);
};

ChatStream.on('message', function(msgObj) {
	if (msgObj.to == SEND_TO_ALL_ID || $.inArray(me().id, msgObj.to) != -1) {
		var message = msgObj.from + ' says: ' + msgObj.message;
		console.log('[Message received] ' + message);
		GoofedTTS.speak(message);
	}
});

ChatStream.on('join', function(name) {
	console.log('[Person joined] ' + name);
	GoofedTTS.speak(name + ' has entered the room');
});

Meteor.startup(function () {
  // send keep alives so the server knows when I leave the room
  Meteor.setInterval(function() {
    if (Meteor.status().connected) {
      Meteor.call('keepalive', me().id);
    }
  }, 20 * 1000);
});
