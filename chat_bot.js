var Bot    = require('ttapi');
var AUTH   = 'auth+live+3f02eacf6814bf0daf2402e786cfd86cda113cc4';
var USERID = '4f11831e590ca243d1002366';
var ROOMID = '4e2291cf14169c714d06c45a';

mods: ["4e5fd1e0a3f7514e0f17966d","4e0b5a92a3f751466c05f6a1","4e1b553e4fe7d0313f058337","4dfd70cd4fe7d0250a03de32","4e039092a3f751791b06f929","4e026d904fe7d0613b01506d","4e2dcae44fe7d015eb006309","4e02a72fa3f751791b02ad48","4e166547a3f751697809115c","4e1b54174fe7d0313f05781e","4e39de11a3f7512558025d88","4e270408a3f751245b007270","4e172b7da3f75169870e893a","4ee7aad8590ca257780002d9","4e932da84fe7d0424409028f","4e9000e74fe7d04235046f2f","4dfb86eea3f7515c5c024bf2"]

var bot = new Bot(AUTH, USERID, ROOMID);

var user_to_follow = '4e932da84fe7d0424409028f';
var currently_following = false;
var fuck_dubstep = true;

/*bot.on('newsong', function (data) { 
		if( fuck_dubstep ) {
			var songName = data.room.metadata.current_song.metadata.song;
			var artist= data.room.metadata.current_song.metadata.artist;
			var genre = "";

			var request = lastfm.request("track.getInfo", {
				track: songName,
				artist: artist,
				handlers: {
					success: function(data) {
						console.log("Success: " + data);
						genre = data.track.toptags.tag[0].name;
						filterDubstep( genre );
					},
					error: function(error) {
						console.log("Error: " + error.message);
					}
				}
			});
		}
});
*/

bot.on('speak', function (data) {

   	// Get the data
   	var name = data.name;
   	var text = data.text;


	if (text.match(/^radio message from HQ/i)) {
		bot.speak('Dance commander, I love you! <3');	
		bot.vote('up');
	}
	
	if (text.match(/^syzbot dance/i)) {
		bot.speak('Okey dokey!');
		bot.vote('up');
	}
	
	if (text.match(/^count/)) {
		bot.speak('One, cat, four, potato.');
	}
		
	// Follow this user
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
			
	// Hop up
	if (text.indexOf("hop up") != -1 && text.indexOf("syzbot") != -1) {
		bot.modifyLaptop('linux');
		bot.speak('Like this?');
		bot.addDj();
		handled_command = true;
	 }
	 
	 // Stop DJing
	if ( text.indexOf("sit") != -1 && text.indexOf("syzbot") != -1 ) {
		bot.speak( 'But how am I ever gonna get a spacesuit?' );	
		bot.remDj ();
		handled_command = true;
	}
	
	// Check whether the given genre is dubstep
	function filterDubstep( genre ) {
		if( genre.indexOf("dubstep") != -1 ) {
			bot.speak("Ew, no dubstep in here. Skip please." );
			sleep(1000);
			bot.vote('down');
		}
	}
	
	
	function sleep(ms) {

		var dt = new Date();
		dt.setTime(dt.getTime() + ms);
		while (new Date().getTime() < dt.getTime());
	}

	/* Add this song to our playlist
	if ( text.indexOf(", I like this song") != -1 && text.indexOf("syzbot") != -1 ) {
		bot.roomInfo(true, function(data) {
			var newSong = room.metadata.current_song._id;
			var newSongName = songName = data.room.metadata.current_song.metadata.song;
			bot.playlistAdd(newSong);
			bot.speak('Wheeee! Now I can play ' + newSongName + ' for you!' );	
		});
		handled_command = true;
	}*/
	
}
/*
bot.roomInfo(true, function(data) { 
	var newSong = data.room.metadata.current_song._id;
	var newSongName = songName = data.room.metadata.current_song.metadata.song;
	bot.playlistAdd(newSong);
}*/

);
