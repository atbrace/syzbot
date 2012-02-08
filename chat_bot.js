var Bot    = require('ttapi');
var AUTH   = 'auth+live+3f02eacf6814bf0daf2402e786cfd86cda113cc4';
var USERID = '4f11831e590ca243d1002366';
var ROOMID = '4e2291cf14169c714d06c45a';

var bot = new Bot(AUTH, USERID, ROOMID);

var user_to_follow = '4e932da84fe7d0424409028f';
var currently_following = false;

bot.on('speak', function (data) {

   	// Get the data
   	var name = data.name;
   	var text = data.text;

	// Respond to "/hello" command
	if (text.match(/^syzbot/)) {
      		bot.speak('Hi @'+name+', my favorite shape is purple!');
	}
	
	if (text.match(/^[*]radioMessageFromHQ$/)) {
		bot.speak('Dance commander, I love you! <3');	
		bot.vote('up');
	}

	if (text.match(/^count/)) {
		bot.speak('One, cat, four, potato.');
	}
	
	if (text.match(/^[*]dubstep$/)) {
		bot.speak('Ugh, I would have watched Transformers if I wanted to hear Decepticon shit.');	
		bot.vote('down');
	}
});
