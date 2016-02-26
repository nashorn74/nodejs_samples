
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1/test');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;
var twitSchema = new Schema({
	id: ObjectId,
	text: String,
	tw_date: String,
	rt_count: String,
	fv_count: String, 
});
var twitModel = mongoose.model('twitter_item', twitSchema);

var twitterAPI = require('node-twitter-api');
var reqTok, reqTokSec, accTok, accTokSec;
var pageMap = {};
var twitter = new twitterAPI({
    consumerKey: 'IBcjHJDivOJpgwamOq7g',
    consumerSecret: 'CR5IuZJ9FtZkQVU6mEf0H1WEit4etvrfzwkJaXb0so',
    callback: '127.0.0.1:3000/getAccessToken'
});



/*pageMap['/getRequestToken'] = function(req, res, urlObj){
  res.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
  twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
    if (error) {
        console.log("Error getting OAuth request token : " + error);
    } else {
      reqTok = requestToken;
      reqTokSec = requestTokenSecret;
      res.write('{');
      res.write('"reqTok":'+JSON.stringify(reqTok));
      res.write('}');
      res.end();
    }
  });
};
pageMap['/getAccessToken'] = function(req, res, urlObj){
  res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
  var oauth_verifier = urlObj.query.oauth_verifier;
  twitter.getAccessToken(reqTok, reqTokSec, oauth_verifier, function(error, accessToken, accessTokenSecret, results) {
    if (error) {
        console.log(error);
    } else {
      accTok = accessToken;
      reqTokSec = accessTokenSecret;
      res.write('<html><head><title>redirect page</title><meta http-equiv="refresh" ');
      res.write('content="1;url=�̵��� �ּ��� URL/test/main.html">');
      res.write('</head><body><p>move to main page</p></body></html>');
      res.end();
    }
  });
};
pageMap['/getUserTimeline'] = function(req, res, urlObj){
  res.writeHead(200, {'Content-Type': 'text/plain;charset=UTF-8'});
  twitter.getTimeline(
      'user_timeline',
      //{screen_name: urlObj.query.screen_name},
      {screen_name: "nashorn74"},
      accTok,
      accTokSec,
      function(error, data) {
    if (error) {
        console.log(error);
    } else {
      console.log('hihi');
      res.write('[');
      var isFirst = true;
      data.forEach(function(item){
        isFirst || res.write(',');
        isFirst && (isFirst=false);
        res.write('{');
        res.write('"text":'+JSON.stringify(item.text));
        res.write(',"tw_date":'+JSON.stringify(item.created_at));
        res.write(',"rt_count":"'+item.retweet_count+'"');
        res.write(',"fv_count":"'+
            (item.retweeted_status?
                item.retweeted_status.favorite_count:'0')+'"');
        res.write('}');
      });
      res.write(']');
      res.end();
    }
  });
};
http.createServer(function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");  // ������ ��û�ϴ� ������� �������� ���� ���
  //res.end('Hello World\n');
  var urlObj = require('url').parse(req.url, true);
  try{
   var page = pageMap[urlObj.pathname];
   if(page){
    page(req, res, urlObj);
   }
  }catch(err){
   console.log(err);
  }
}).listen(3000, '127.0.0.1');
console.log('Server running at http://127.0.0.1:3000/');*/

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//app.get('/', routes.index);
app.get('/users', user.list);
app.get('/', function(req, res){
	
	var twit = mongoose.model('twitter_item', twitSchema);
	//console.log(twit);
	twit.find({}, function (err, docs) {
		//console.log(docs);
		res.render('index.jade', { //locals: {
			title: 'Twitter Timeline',
			items:docs
		//}
		});
	});
	
});

app.get('/update', function (req, res) {
	var messageString = "이것은 Node.js에서 트윗 포스팅 샘플입니다.";
	twitter.statuses("update", {
        status: messageString
    },
    "72047945-wGHP11quXzMWFHcEkAPBZyX2q0wIN4TdCQDjqpZOa",
    "8ptRxIgfPYLFsui6T0Z09LI78Ewu5NkDafWFORZsE",
    function(error, data, response) {
        if (error) {
        	console.log(error);
        } else {
        	console.log('update complete!');
        }
        res.redirect('/');
    });
});


app.get('/timeline', function (req, res) {
	
	twitter.getTimeline(
	      'user_timeline',
	      {screen_name: "nashorn74"},
	      accTok,
	      accTokSec,
	      function(error, data) {
	    if (error) {
	        console.log(error);
	    } else {
	      console.log('Twitter getTimeline...');
	      
	      var result = "";
	      
	      result += '[';
	      var isFirst = true;
	      data.forEach(function(item){
	        //isFirst || res.write(',');
	    	if (!isFirst)
	    		result +=  ',';
	        isFirst && (isFirst=false);
	        result += '{';
	        result += '"text":'+JSON.stringify(item.text);
	        result += ',"tw_date":'+JSON.stringify(item.created_at);
	        result += ',"rt_count":"'+item.retweet_count+'"';
	        result += ',"fv_count":"'+
	            (item.retweeted_status?
	                item.retweeted_status.favorite_count:'0')+'"';
	        result += '}';
	        
	        var twit = new twitModel();
	        twit.text 		= JSON.stringify(item.text);
	        twit.tw_date 	= JSON.stringify(item.created_at);
	        twit.rt_count 	= item.retweet_count;
	        twit.fv_count 	= (item.retweeted_status?item.retweeted_status.favorite_count:'0');
			
	        twit.save(function (err) {
				if (err)
					return handleError(err);
			});
	      });
	      result += ']';
	      
	      console.log(result);
	    }
	  });
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
