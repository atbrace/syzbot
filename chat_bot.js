// bot requires node.js + turntable.fm API by alain gilbert
// last.fm interaction requires a last.fm API key and lastfm node module
// mongoDB obviously requires mongoDB and the mongoDB node module 
// data.js file in same directory as bot exports data to this file. keeps things tidy, and keeps auth off of github

var Bot    = require('ttapi');
var AUTH   = require('./data.js').auth; //authID of bot from turntable cookie (ctrl+shift+J in chrome)
var USERID = require('./data.js').userid; //userID of bot from turntable cookie (ctrl+shift+J in chrome)
var ROOMID = require('./data.js').roomid; //roomID of bot starting room from room's page source
var repl = require('repl');
var mongo = require('mongodb');

var bot = new Bot(AUTH, USERID, ROOMID);

// enables REPL which allows interactive console control over bot
repl.start('> ').context.bot = bot;

var currentlyFollowing = false; //follow toggle
var allowDiscoMode = false; //discomode toggle (shuffles through avatars)
var currentAvatar = 14;
var jbear = 14; //jellybear = master race
var currentRoom = ROOMID; //for bot stalking purposes
var plistlength = undefined;

var mods = require('./data.js').mods; //list of user IDs of IDE mods
var funny = require('./data.js').funny; //list of .gifs that i find hilarious
var userToFollow = require('./data.js').followId; //my userID, so bot can follow me
var responses = require('./data.js').responses; //basic chat responses, when no further input is given
var danceMsgs = require('./data.js').dance; //responses to dance command

var tables = 0; // number of tables flipped
var userList = { }; // list of all users in room
var djList = { }; // list of DJs on decks
var pmSender; // userID of person who sent a PM to bot
var snags = 0; // number of heartfarts per song

var songName; //name of currently playing song
var genre; //genre of currently playing song
var artist; //artist of currently playing song
var newSong; //ID of currently playing song
var albumName; //name of album
var albumDate; //date album was released
var bio; // bio of artist

var lastfmapi = require('./data.js').lastfmApi;
var lastfmsecret = require('./data.js').lastfmSecret;

var LastFmNode = require('lastfm').LastFmNode;

var lastfm = new LastFmNode({
	api_key: lastfmapi, 
	secret: lastfmsecret
});

bot.debug = false;

// when bot is started, will find userToFollow and join their room.
// if userToFollow is not registered to a room, bot will join default ROOMID
bot.on('roomChanged',  function (data) {
	snags = 0;
	userList = { };
	console.log('syzbot has entered ' + data.room.name_lower);
	if (currentlyFollowing === true) {
			bot.stalk( userToFollow , function(data) {
				if (data.roomId != currentRoom) {
					if (data.roomId === undefined) {
						console.log('no syz');
					}
					else { 
						console.log( 'Going to syz' ); 
						bot.roomRegister(data.roomId);
						currentRoom = data.roomId;
					}
				}
			});
	}
	var users = data.users;
	for (var i=0; i<users.length; i++) {
		var user = users[i];
		user.lastActivity = new Date();
		userList[user.userid] = user;
	}
	
	bot.playlistAll(function(data) { 
		plistlength = data.list.length;
		console.log('I have '+plistlength+' songs in my queue.\n-----------------------------');
	});

	// log currently playing song info
	songName = data.room.metadata.current_song.metadata.song;
	genre = data.room.metadata.current_song.metadata.genre;
	artist = data.room.metadata.current_song.metadata.artist;
	console.log('>>SONG INFO: "' + songName + '" by ', artist,'= ' + genre)
});


bot.on('newsong', function (data) {
	console.log(snags + " users stole the last song for their queue.");
	snags = 0;
	
	// for every new song, retrieve and store the metadata and log it to console
	songName = data.room.metadata.current_song.metadata.song;
	genre = data.room.metadata.current_song.metadata.genre;
	artist = data.room.metadata.current_song.metadata.artist;
	console.log('>>SONG INFO: "' + songName + '" by ', artist,' = ' + genre);
});

bot.on('registered', function (data) {
	var user = data.user[0];
	user.lastActivity = new Date();
	userList[user.userid] = user;
	console.log(user.name + " has entered the room.");
	if (user.name == "elektrofried") {bot.speak("<3 elektrofried <3");}
});

bot.on('deregistered', function (data) {
	var user = data.user[0]; 
	if (user.userid == userToFollow && currentlyFollowing === true) {
		setTimeout(function () {
			bot.stalk( userToFollow, function(data) {
				console.log( '...looking for daddy');
				if (data.roomId != currentRoom) {
					if (data.roomId === undefined) {
						console.log('no syz, staying here');
					} 
					else {					
						console.log( 'Following syz' ); 
						bot.roomRegister(data.roomId);
						currentRoom = data.roomId;
					}
				}
			});
		},1000 *20);
	}
	console.log(user.name + " left the room.");
	delete userList[user.userid];
});

/*bot.on('update_votes', function (data) {
   var votelog = data.room.metadata.votelog;
   for (var i=0; i<votelog.length; i++) {
      var userid = votelog[i][0];
      userList[userid].lastActivity = new Date();
   }
});*/

bot.on('add_dj', function (data) {
   var user = data.user[0];
   userList[user.userid].lastActivity = new Date();
   djList
});

bot.on('rem_dj', function (data) {
   var user = data.user[0];
   userList[user.userid].lastActivity = new Date();
});

bot.on('snagged', function (data) {
   var userid = data.userid;
   userList[userid].lastActivity = new Date();
   snags++;
});

bot.on('pmmed', function (data) {
	pmSender = data.senderid;
	if ((data.text.match(/printlist/i)) && (mods.indexOf(pmSender) > -1)) {
		var playlisttext = [];  
		bot.playlistAll(function(data) { 
			plistlength = data.list.length;
				for(var i = 1; i < 11; i++) {
					playlisttext.push(i + ". " + data.list[i].metadata.artist + ' - ' + data.list[i].metadata.song + "\n"); 
				}
			bot.pm("! PLAYLIST > > > > >" + playlisttext, pmSender);
		});
	}
	else if (data.text.match(/help/i)) {
		if(mods.indexOf(pmSender) > -1) {
			bot.pm("Just say my name plus any of these keywords: genre, make me laugh, tables, tell me more artist, "
			+ "do your thang, hop up, sit, steal", pmSender);
		}
		else {
			bot.pm("Just say my name plus any of these keywords: genre, make me laugh, tables, tell me more artist", pmSender);
		}
	}
});

bot.on('speak', function (data) {

	// refresh user's AFK timer
	userList[data.userid].lastActivity = new Date();

	var currentRoom = data.roomId;
	var name = data.name;
	var text = data.text;
	var speakerId = data.userid
	
	// log chat to the console
	console.log(data.name + " (" + speakerId + "): " + data.text);
	
	// handle input
	if(data.name == '#JARVIS') {
		if (text.match(/^syzbot/i) && text.match(/your turn/i)) {
			bot.addDj();
			console.log("Stepped up to the decks");
		}
	}
	else if((data.name != 'syzbot') && (data.name != '#WEEBO') && (data.name != '#JARVIS')) {
		if (text.match(/\bbro\b/)) {
			bot.speak("BRO");
		}
		else if (text.match(/\/tableflip/)) {
			tables++;
			console.log("A table has been flipped. Someone should really fix that.");
		}
		else if (text.match(/^radio message from HQ/i) && (mods.indexOf(speakerId) > -1)) {
			bot.speak('Dance commander, I love you! <3');	
			bot.vote('up');
			console.log('The dance commander told me to vote this up!');
		}
		else if (text.match(/good boy/i)) {
			bot.speak(":D");
		}
		else if (text.match(/dubstep/i) && (text.match(/play/i) || text.match(/cool/i) || text.match(/ok/i) || text.match(/like/i) || text.match(/allowed/i))) {
			bot.speak("Sorry bro, no dubstep in here. Please read the room rules.");
		}
		else if (text.match(/syzbot/i)) {
			if (text.match(/grounded/i)) {
				bot.speak("http://i.imgur.com/NdRas.jpg");
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
			/*else if (text.match(/dance/i)) {
				var response = danceMsgs[Math.floor(Math.random() * danceMsgs.length)]; // pull random response from danceMsgs array
				bot.speak(response);
				bot.vote('up');
				console.log('Someone thinks I should be dancing, I guess I can do that.');
			}*/
			else if (text.match(/who made/i)) {
				bot.speak("Wow, and they call me stupid. Read the name!");
			}
			else if (text.match(/tables/i)) {
				if (tables == 0) {bot.speak("None...yet.");}
				else if (tables > 1) {bot.speak(tables + " tables have been flipped.");}
				else {bot.speak("One table has been flipped.");}
				
			}
			else if (text.match(/follow me/i) && (speakerId == userToFollow)) {
				console.log("syz wants me to follow him");
				currentlyFollowing === true;
			}
			else if (text.match(/hop up/i) && (mods.indexOf(speakerId) > -1)) {
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
			else if (text.match(/skip/i) && (mods.indexOf(speakerId) > -1)) {
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
			else if (text.match(/disco/i) && speakerId == userToFollow) {
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
			else if ((text.match(/I like this song/i)  || text.match(/steal/i)) && (mods.indexOf(speakerId) > -1)) {
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
			else if (text.match(/tell me/i)) {
				if(text.match(/artist/i)) {
					try {
						var request = lastfm.request("artist.getInfo", {
							artist: artist,
							handlers: {
								success: function(data) {
									bio = data.artist.bio.summary;
									console.log("Success: " + data);
									bot.pm(strip_tags(bio), speakerId);
									bot.speak("Sent a PM to you");
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
						var nameRequest = lastfm.request("track.getInfo", {
							track: songName,
							artist: artist,
							handlers: {
								success: function(data) {
									albumName = data.track.album.title;
									console.log("Album Name Success: " + data);
								},
								error: function(error) {
									console.log("Album Name Error: " + error.message);
									albumName = "";
									bot.speak("Sorry, I didn't catch that. I was thinking about exterminating the human race.");
								}
							}
						});
						var dateRequest = lastfm.request("album.getInfo", {
							album: albumName,
							artist: artist,
							autocorrect: 1,
							handlers: {
								success: function(data) {
									albumDate = data.album.releasedate;
									console.log("Album Date Success: " + data);
									if (albumName != "") {
										console.log('This song is from the album "' + albumName + '", released ' + albumDate);
									}
									else {
										bot.speak("Sorry, I didn't catch that. I was thinking about exterminating the human race.");
									}
								},
								error: function(error) {
									console.log("Album Date Error: " + error.message);
									if (albumName = "") {
										bot.speak("Sorry, I didn't catch that. I was thinking about exterminating the human race.");
									}
									else {
										console.log('This song is from the album "' + albumName + '"');
									}
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
	
	function strip_tags (input, allowed) {
		allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
		var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
			commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
		return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
			return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
		});
	}
});
