var Bot    = require('ttapi');
var AUTH   = 'auth+live+3f02eacf6814bf0daf2402e786cfd86cda113cc4';
var USERID = '4f11831e590ca243d1002366';
var ROOMID = '4e2291cf14169c714d06c45a';
var repl = require('repl');

mods = ["4e5fd1e0a3f7514e0f17966d","4e0b5a92a3f751466c05f6a1","4e1b553e4fe7d0313f058337","4dfd70cd4fe7d0250a03de32",
		"4e039092a3f751791b06f929","4e026d904fe7d0613b01506d","4e2dcae44fe7d015eb006309","4e02a72fa3f751791b02ad48",
		"4e166547a3f751697809115c","4e1b54174fe7d0313f05781e","4e39de11a3f7512558025d88","4e270408a3f751245b007270",
		"4e172b7da3f75169870e893a","4ee7aad8590ca257780002d9","4e932da84fe7d0424409028f","4e9000e74fe7d04235046f2f",
		"4dfb86eea3f7515c5c024bf2"];

var bot = new Bot(AUTH, USERID, ROOMID);

// enables REPL which allows interactive console control over bot
repl.start('> ').context.bot = bot;

var user_to_follow = '4e932da84fe7d0424409028f';
var currently_following = false;
var freebie = false;

var responses = ["soup?", "I'm not your buddy, guy.", "/monocle", "You think this is a game?", "Hi, can we be friends?"];
	
var danceMsgs = ["Okey dokey!", "/me shakes his moneymaker", "Get down on it!"];


bot.on('newsong', function (data) { 

	// for every new song, retrieve and store the metadata for console logging and genre 
	var songName = data.room.metadata.current_song.metadata.song;
	var genre = data.room.metadata.current_song.metadata.genre;
	var artist = data.room.metadata.current_song.metadata.artist;

	// log song info to the console
	console.log('Song Info: "' + songName + '" by ', artist,'= ' + genre)

	// if freebie votes are on, bot will vote up on each new song
	if (freebie === true) {
		bot.vote('up');
		console.log('auto-awesome');
	}
	
	/*// detects if current song is dubstep from metadata. if so, asks to skip and then lames.
	if( genre.text.match(/dubstep/i)) {
			bot.speak("Ew, no dubstep in here. Skip please.");
			sleep(1000);
			bot.vote('down');
			console.log('Someone played dubstep, so I lamed them.');
	}*/
});

bot.on('speak', function (data) {

   	var name = data.name;
   	var text = data.text;

	// ELECTRIC SIX UPVOTE
	if (text.match(/^radio message from HQ/i) && (mods.indexOf(data.userid) > -1)) {
		bot.speak('Dance commander, I love you! <3');	
		bot.vote('up');
		console.log('The dance commander told me to vote this up!');
	}
	
	if (data.text.match(/syzbot/i)) {
		if (data.text.match(/engage partymode/i) && (mods.indexOf(data.userid) > -1)) {
			bot.speak('Wooooohoo!');	
			freebie = true;
			console.log('Freebie mode started.');
		}
		else if (data.text.match(/stop the party/i) && (mods.indexOf(data.userid) > -1)) {
			bot.speak("Aww, but I was having so much fun =[");	
			freebie = false;
			console.log('Freebie mode stopped.');
		}
		else if (data.text.match(/go to IDE/i) && (mods.indexOf(data.userid) > -1)) {
			bot.speak("Okey dokey, see you there!");	
			sleep(3000);
			bot.roomRegister('4e2291cf14169c714d06c45a');
		}
		else if (data.text.match(/go to DNGR/i) && (mods.indexOf(data.userid) > -1)) {
			bot.speak("Okey dokey, time to hang out with my DNGR friends!");	
			sleep(3000);
			bot.roomRegister('4e1b2a7a14169c1b670063cb');
		}
		else if (data.text.match(/dance/i)) {
			bot.speak('Okey dokey!');
			bot.vote('up');
			console.log('Someone thinks I should be dancing, I guess I can do that.');
		}
		else if (data.text.match(/who made/i)) {
			bot.speak("Wow, and they call me stupid. Read the name!");
		}
		else if (data.text.match(/hop up/i) && (mods.indexOf(data.userid) > -1)) {
			bot.modifyLaptop('linux'); //sets the laptop the bot uses to linux. this value should never change for any reason.
			bot.speak('Like this?');
			bot.addDj();
			console.log('I hopped up to the decks, I hope they like my music.');
		}
		else if (data.text.match(/sit/i) && (mods.indexOf(data.userid) > -1)) {
			bot.speak( 'But how am I ever gonna get a spacesuit?' );	
			bot.remDj ();
			console.log('I stepped down from the decks. I guess I still am not very good at this.');
		}
		else if (data.text.match(/show me the code/i)) {
			bot.speak("https://github.com/atbrace/syzbot/blob/master/chat_bot.js");
		}
		else if (text.indexOf(", I like this song") != -1 && text.indexOf("syzbot") != -1 && (mods.indexOf(data.userid) > -1)) {
			bot.roomInfo(true, function(data) {
				var newSong = data.room.metadata.current_song._id;
				var newSongName = songName = data.room.metadata.current_song.metadata.song;
				bot.playlistAdd(newSong);
				bot.snag();
				bot.vote('up');
				bot.speak('Wheeee! Now I can play "' + newSongName + '" for you!' );
				console.log('I took the currently playing song for my own queue.');
			 });
		}
		else {
			var message = responses[Math.floor(Math.random() * responses.length)];
			bot.speak(message);
		}
	}
	
/*		
	// Follow this user VERY EXPERIMENTAL, PROBABLY AKA CERTAINLY DOES NOT WORK
	if ( data.userid == user_to_follow && text.indexOf("follow me") != -1 && text.indexOf("syzbot") != -1 ) {
		bot.speak("Yes sir, let's go!" );
		currently_following = true;

		var followTimer= setInterval( function() {				
			bot.stalk( user_to_follow, function(data) {
				if( data.roomId != current_room ) {
					changeRooms( bot, data.roomId );
					current_room = data.roomId;
					clearInterval(followTimer);
					currently_following = false;
				}
			}); // end bot stalk	
		},2000);
		handled_command = true;
	}
*/

	function sleep(ms) {
		var dt = new Date();
		dt.setTime(dt.getTime() + ms);
		while (new Date().getTime() < dt.getTime());
	}

});
