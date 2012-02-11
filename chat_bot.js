// data.js file exports data to this file. keeps things tidy, and keeps auth off of github

var Bot    = require('ttapi');
var AUTH   = require('./data.js').auth;
var USERID = '4f11831e590ca243d1002366';
var ROOMID = '4e2291cf14169c714d06c45a';
var repl = require('repl');

var bot = new Bot(AUTH, USERID, ROOMID);

// enables REPL which allows interactive console control over bot
repl.start('> ').context.bot = bot;

var currently_following = false;
var freebie = false;
var allow_disco_mode = false;
var current_avatar = 5; 

var mods = require('./data.js').mods;
var funny = require('./data.js').funny;
var user_to_follow = require('./data.js').followId;
var responses = require('./data.js').responses;
var danceMsgs = require('./data.js').dance;

var songName; //name of currently playing song
var genre; //genre of currently playing song
var artist; //artist of currently playing song
var newSong; //ID of currently playing song

bot.on('newsong', function (data) { 

	// for every new song, retrieve and store the metadata for console logging and genre 
	songName = data.room.metadata.current_song.metadata.song;
	genre = data.room.metadata.current_song.metadata.genre;
	artist = data.room.metadata.current_song.metadata.artist;

	// log song info to the console
	console.log('Song Info: "' + songName + '" by ', artist,'= ' + genre)

	// if freebie votes are on, bot will vote up on each new song
	if (freebie === true) {
		bot.vote('up');
		console.log('auto-awesome');
	}

	/*// detects if current song is dubstep from metadata. if so, asks to skip and then lames.
	if(xxxxxxxxx)) {
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
	
	// handle input
	
	if(data.name == '#EVE') {
		if (text.match(/it's your turn!. you have 30 seconds to step up!/i)) {
				bot.addDj();
				console.log("Stepped up to the decks");
		}
	}
	else if(data.name != 'syzbot' && data.name != '#EVE') {
		if (text.match(/syzbot/i)) {
			if (text.match(/engage partymode/i) && (mods.indexOf(data.userid) > -1)) {
				bot.speak('Wooooohoo!');	
				freebie = true;
				console.log('Freebie mode started.');
			}
			else if (text.match(/stop the party/i) && (mods.indexOf(data.userid) > -1)) {
				bot.speak("Aww, but I was having so much fun =[");	
				freebie = false;
				console.log('Freebie mode stopped.');
			}
			else if (text.match(/go to IDE/i) && data.userid == user_to_follow) {
				bot.speak("Okey dokey, see you there!");	
				sleep(3000);
				bot.roomRegister('4e2291cf14169c714d06c45a');
				console.log("I left this room to go to IDE.");
			}
			else if (text.match(/go to DNGR/i) && data.userid == user_to_follow) {
				bot.speak("Okey dokey, time to hang out with my DNGR friends!");	
				sleep(3000); // wait 3 seconds
				bot.roomRegister('4e1b2a7a14169c1b670063cb'); // sends bot to room with specified ROOMID
				console.log("I left this room to go to DNGR.");
			}
			else if (text.match(/dance/i)) {
				var response = danceMsgs[Math.floor(Math.random() * danceMsgs.length)]; // pull random response from danceMsgs array
				bot.speak(response);
				bot.vote('up');
				console.log('Someone thinks I should be dancing, I guess I can do that.');
			}
			else if (text.match(/who made/i)) {
				bot.speak("Wow, and they call me stupid. Read the name!");
			}
			else if (text.match(/hop up/i) && (mods.indexOf(data.userid) > -1)) {
				bot.modifyLaptop('linux'); //sets the laptop the bot uses to linux. this value should never change for any reason.
				bot.speak("Like this?");
				bot.addDj();
				console.log("I hopped up to the decks, I hope they like my music.");
			}
			else if (text.match(/sit/i) && (mods.indexOf(data.userid) > -1)) {
				bot.speak("But how am I ever gonna get a spacesuit?");	
				bot.remDj ();
				console.log("I stepped down from the decks.");
			}
			else if (text.match(/show me the code/i)) {
				bot.speak("Boom, sucka: https://github.com/atbrace/syzbot/blob/master/chat_bot.js");
			}
			else if (text.match(/do your thang/i) && (mods.indexOf(data.userid) > -1)) {
				bot.speak("*addme");
				console.log("Added myself to the DJ queue");
			}
			else if (text.match(/make me laugh/i)) {
				var funnyMessage = funny[Math.floor(Math.random() * funny.length)];
				bot.speak(funnyMessage);
			}
			else if (text.match(/untappd/i)) {
				bot.speak('http://untappd.com/user/syz');
			}
			else if (text.match(/disco/i) && data.userid == user_to_follow) {
				if(text.match(/start/i)) {
					allow_disco_mode = true;
					var discoTimer= setInterval(function() {
						if( !allow_disco_mode ) {
							clearInterval(discoTimer);
							return;
						}
						if( current_avatar < 9 ) {
							current_avatar++;
						} else {
							current_avatar = 0;
						}
						bot.setAvatar(current_avatar);
					},700);
				}
				else if (text.match(/stop/i)){
					allow_disco_mode = false;
					bot.setAvatar(5);
				}
			}
			else if (text.match(/I like this song/i) && (mods.indexOf(data.userid) > -1)) {
				bot.roomInfo(true, function(data) {
					newSong = data.room.metadata.current_song._id;
					bot.playlistAdd(newSong);
					bot.snag();
					bot.vote('up');
					bot.speak('Wheeee! Now I can play "' + songName + '" for you!' );
					console.log("I took the currently playing song for my own queue.");
				 });
			}
			else {
				var message = responses[Math.floor(Math.random() * responses.length)];
				bot.speak(message);
			}
		}
	}
	function sleep(ms) {
		var dt = new Date();
		dt.setTime(dt.getTime() + ms);
		while (new Date().getTime() < dt.getTime());
	}
/*		
	// Follow this user VERY EXPERIMENTAL, PROBABLY AKA CERTAINLY DOES NOT WORK
	if ( data.userid == user_to_follow && text.indexOf("follow me") != -1 && text.indexOf("syzbot") != -1 ) {
		bot.speak("Yes sir, let's go!" );
		currently_following = true;

		var followTimer= setInterval( function() {				
			bot.stalk( user_to_follow, function(data) {
				if( data.roomId != current_room ) {
					bot.roomRegister(data.roomId );
					current_room = data.roomId;
					clearInterval(followTimer);
					currently_following = false;
				}
			}); // end bot stalk	
		},2000);
		handled_command = true;
	}
*/

});
