//bot requires node.js and the turntable API by alain gilbert
// data.js file in same directory exports data to this file. keeps things tidy, and keeps auth off of github

var Bot    = require('ttapi');
var AUTH   = require('./data.js').auth; //authID of bot from turntable cookie (ctrl+shift+J in chrome)
var USERID = require('./data.js').userid; //userID of bot from turntable cookie (ctrl+shift+J in chrome)
var ROOMID = require('./data.js').roomid; //roomID of bot starting room from room's page source
var repl = require('repl');

var bot = new Bot(AUTH, USERID, ROOMID);

// enables REPL which allows interactive console control over bot
repl.start('> ').context.bot = bot;

var currently_following = false; //follow toggle
var freebie = false; //freebonus toggle
var allowDiscoMode = false; //discomode toggle (shuffles through avatars)
var currentAvatar;
var jbear = 14; //jellybear = master race
var currentRoom = ROOMID; //for bot stalking purposes
var plistlength = undefined;

var mods = require('./data.js').mods; //list of user IDs of IDE mods
var funny = require('./data.js').funny; //list of .gifs that i find hilarious
var userToFollow = require('./data.js').followId; //my userID, so bot can follow me
var responses = require('./data.js').responses; //basic chat responses, when no further input is given
var danceMsgs = require('./data.js').dance; //responses to dance command

var tables = 0; // number of tables flipped

var songName; //name of currently playing song
var genre; //genre of currently playing song
var artist; //artist of currently playing song
var newSong; //ID of currently playing song

var lastfmapi = require('./data.js').lastfmApi;
var lastfmsecret = require('./data.js').lastfmSecret;

var LastFmNode = require('lastfm').LastFmNode;

var lastfm = new LastFmNode({
	api_key: lastfmapi, 
	secret: lastfmsecret
});

var bio;
bot.debug = false;

// when bot is started, will find userToFollow and join their room.
// if userToFollow is not registered to a room, bot will join default ROOMID
bot.on('roomChanged',  function (data) { 
	console.log('syzbot has entered a room.');
	try {
		bot.stalk( userToFollow , function(data) {
			if (data.roomId != currentRoom) {
				console.log('Seeking syz...'); 
				bot.roomRegister(data.roomId);
				currentRoom = data.roomId;
			}
		});
	}
	catch (err) {
		console.log("Couldn't find syz. Going to IDE by default");
		bot.roomRegister(ROOMID);
	}
	
	bot.playlistAll(function(data) { 
		plistlength = data.list.length;
		console.log('I have '+plistlength+' songs in my queue.');
	});

	// log currently playing song info
	songName = data.room.metadata.current_song.metadata.song;
	genre = data.room.metadata.current_song.metadata.genre;
	artist = data.room.metadata.current_song.metadata.artist;
	console.log('>>Song Info: "' + songName + '" by ', artist,'= ' + genre)
});


bot.on('newsong', function (data) { 

	// for every new song, retrieve and store the metadata and log it to console
	songName = data.room.metadata.current_song.metadata.song;
	genre = data.room.metadata.current_song.metadata.genre;
	artist = data.room.metadata.current_song.metadata.artist;
	console.log('>>Song Info: "' + songName + '" by ', artist,'= ' + genre);

	// if freebie votes are on, bot will vote up on each new song
	if (freebie === true) {
		bot.vote('up');
		console.log('auto-awesome');
	}
});

bot.on('speak', function (data) {

	var current_room = data.roomId;
   	var name = data.name;
   	var text = data.text;
	
	// log chat to the console
	console.log(data.name + ": " + data.text);

	if (text.match(/\/tableflip/)) {
		tables++;
		console.log("A table has been flipped. Someone should really fix that.");
	}
	// ELECTRIC SIX UPVOTE
	if (text.match(/^radio message from HQ/i) && (mods.indexOf(data.userid) > -1)) {
		bot.speak('Dance commander, I love you! <3');	
		bot.vote('up');
		console.log('The dance commander told me to vote this up!');
	}
	
	// handle input
	if(data.name == '#EVE') {
		if (text.match(/^syzbot/i) && text.match(/it's your turn!. you have 30 seconds to step up!/i)) {
			bot.addDj();
			console.log("Stepped up to the decks");
		}
	}
	else if(data.name != 'syzbot' && data.name != '#EVE') {
		if (text.match(/syzbot/i)) {
			if (text.match(/engage partymode/i) && (mods.indexOf(data.userid) > -1)) {
				bot.speak('Wooooohoo!');
				bot.bop();
				freebie = true;
				console.log('Freebie mode started.');
			}
			else if (text.match(/stop the party/i) && (mods.indexOf(data.userid) > -1)) {
				bot.speak("Aww, but I was having so much fun =[");	
				freebie = false;
				console.log('Freebie mode stopped.');
			}
			else if (text.match(/grounded/i)) {
				bot.speak("http://i.imgur.com/NdRas.jpg");
			}
			else if (text.match(/print playlist/i)) {
		  		var playlisttext = [];  
	 			bot.playlistAll(function(data) { 
	 			plistlength = data.list.length;
      					for(var i = 0; i < 14; i++) {
        				playlisttext.push(data.list[i].metadata.artist + ' - ' + data.list[i].metadata.song); 
     					}
     	 			console.log('! PLAYLIST > > > > >',playlisttext);
     	 			});
			}
			else if (text.match(/genre/i)) {
				if (genre !== "") {
					bot.speak("This song is " + genre);
				}
				else {
					console.log("Nothing in TT metadata, trying last.fm.");
					var request = lastfm.request("track.getInfo", {
						track: songName,
						artist: artist,
						handlers: {
							success: function(data) {
								console.log("Success: " + data);
								bot.speak("This song is " + data.track.toptags.tag[0].name);
							},
							error: function(error) {
								console.log(error.message);
								bot.speak("Sorry, I wish I could tell you but kids these days don't know how to tag their music.");
							}
						}
					});
				}
			}
			else if (text.match(/restore order/i)) {
				bot.speak("http://i.imgur.com/VpFx7.jpg");
			}
			else if (text.match(/go to/i)) {
				if (data.userid == userToFollow) {
					if (text.match(/IDE/i)) {
						bot.speak("Okey dokey, see you there!");	
						sleep(3000);
						bot.roomRegister(ROOMID);
						console.log("I left this room to go to IDE.");
					}
					if (text.match(/DNGR/i))  {
						bot.speak("Okey dokey, time to hang out with my DNGR friends!");	
						sleep(3000); // wait 3 seconds
						bot.roomRegister('4e1b2a7a14169c1b670063cb'); // sends bot to room with specified ROOMID
						console.log("I left this room to go to DNGR.");
					}
					else if (text.match(/izo/i))	{
						bot.speak("Okay...woofus scares me sometimes though");	
						sleep(3000); // wait 3 seconds
						bot.roomRegister('4e4460f314169c06532bc9c9'); // sends bot to room with specified ROOMID
						console.log("I left this room to go to izotope.");
					}
					else if (text.match(/SMILE/i))	{
						bot.speak("I'm on my way!");	
						sleep(3000); // wait 3 seconds
						bot.roomRegister('4f2a54c40c4cc8075f9e9103'); // sends bot to room with specified ROOMID
						console.log("I left this room to go to SMILE.");
					}
				}
				else {bot.speak("You're not my real dad!")};
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
			else if (text.match(/tables/i)) {
				if (tables == 0) {bot.speak("None...yet.");}
				else if (tables > 1) {bot.speak(tables + " tables have been flipped.");}
				else {bot.speak("One table has been flipped.");}
				
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
			else if (text.match(/sit/i) && (mods.indexOf(data.userid) > -1)) {
				bot.skip();
			}
			else if (text.match(/love/i)) {
				bot.speak("Best friends forever! Consider yourself fanned <3");
				bot.becomeFan(data.userid);
			}
			else if (text.match(/code/i) || text.match(/hood/i)) {
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
			else if (text.match(/disco/i) && data.userid == userToFollow) {
				if(text.match(/start/i)) {
					allowDiscoMode = true;
					var discoTimer= setInterval(function() {
						if( !allowDiscoMode ) {
							clearInterval(discoTimer);
							return;
						}
						if( currentAvatar < 19 ) {
							currentAvatar++;
						} else {
							currentAvatar = 10;
						}
						bot.setAvatar(jbear);
					},600);
				}
				else if (text.match(/stop/i)){
					allowDiscoMode = false;
					bot.setAvatar(5);
				}
			}
			else if ((text.match(/I like this song/i)  || text.match(/steal/i)) && (mods.indexOf(data.userid) > -1)) {
				bot.roomInfo(true, function(data) {
					newSong = data.room.metadata.current_song._id;
					bot.playlistAdd(newSong, plistlength);
					bot.snag();
					plistlength++;
					bot.vote('up');
					bot.speak('Wheeee! Now I can play "' + songName + '" for you!' );
					console.log("I took the currently playing song for my own queue.");
				 });
			}
			else if (text.match(/tell me more/i)) {
				if(text.match(/artist/i)) {
					try {
						var request = lastfm.request("artist.getInfo", {
							artist: artist,
							handlers: {
								success: function(data) {
									bio = data.artist.bio.summary;
									console.log("Success: " + data);
									bot.speak(bio.replace(/\<\>/g, ""));
								},
								error: function(error) {
									console.log("Error: " + error.message);
								}
							}
						});
					}
					catch (err) {
						console.log(err.message);
						bot.speak("Sorry, I didn't catch that. I was thinking about exterminating the human race.");
					}
				}
				else if(text.match(/album/i)) {
					try {
						var request = lastfm.request("track.getInfo", {
							track: songName,
							artist: artist,
							handlers: {
								success: function(data) {
									album = data.track.album.title;
									console.log("Success: " + data);
									bot.speak('This song is from the album "' + album + '"');
								},
								error: function(error) {
									console.log("Error: " + error.message);
									bot.speak("Sorry, I didn't catch that. I was thinking about exterminating the human race.");
								}
							}
						});
					}
					catch (err) {
						console.log(err.message);
						bot.speak("Sorry, I didn't catch that. I was thinking about exterminating the human race.");
					}
				}
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
	
});
