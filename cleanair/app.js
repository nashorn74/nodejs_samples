
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var request = require('request');
var Iconv1 = require('iconv').Iconv;
var cheerio = require('cheerio');
var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1/test');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;
var cleanairInfoSchema = new Schema({
	id: ObjectId,
	area: String,
	pm10: String,
	pm25: String,
	grade: String,
	material: String,
	date: String
});
var cleanairInfoModel = mongoose.model('cleaninfo', cleanairInfoSchema);

request({uri:'http://cleanair.seoul.go.kr/air_city.htm?method=measure', encoding:'binary'},
		function(err, res, body) {
			var strContents = new Buffer(body, 'binary');
			var iconv = new Iconv1('euc-kr', 'UTF8');
			strContents = iconv.convert(strContents).toString();
			//console.log(strContents);
	
			var $ = cheerio.load(strContents);
			console.log('\n<'+$('.ft_point1', '.graph_h4').text()+'>');
			
			$('tbody tr', '.tbl2').each(function() {
				var strArea = $(this).find("td").eq(0).html().replace(/\s+/, "");
				strArea = strArea.replace(/(\r\n|\n|\r)/gm, "");
				strArea = strArea.replace(/\s+/, "");
				//console.log(strArea);
				
				var strVal10 = $(this).find("td").eq(1).html().replace(/\s+/, "");
                strVal10 = strVal10.replace(/(\r\n|\n|\r)/gm, "");
                strVal10 = strVal10.replace(/\s+/, "");

                var strVal2_5 = $(this).find("td").eq(2).html().replace(/\s+/, "");
                strVal2_5 = strVal2_5.replace(/(\r\n|\n|\r)/gm, "");
                strVal2_5 = strVal2_5.replace(/\s+/, "");

                var strStatus = $(this).find("td").eq(7).html().replace(/\s+/, "");
                strStatus = strStatus.replace(/(\r\n|\n|\r)/gm, "");
                strStatus = strStatus.replace(/\s+/, "");

                var strDeterminationFactor = $(this).find("td").eq(8).html().replace(/\s+/, "");
                strDeterminationFactor = strDeterminationFactor.replace(/(\r\n|\n|\r)/gm, "");
                strDeterminationFactor = strDeterminationFactor.replace(/\s+/, "");


                var strVal9 = $(this).find("td").eq(9).html().replace(/\s+/, "");
                strVal9 = strVal9.replace(/(\r\n|\n|\r)/gm, "");
                strVal9 = strVal9.replace(/\s+/, "");
                strVal9 = strVal9.replace("</sub>", "");
                strVal9 = strVal9.replace("<sub>2", "²");

                console.log('-' + strArea + ': PM10=' +
                    strVal10+ ' / PM2.5=' +strVal2_5 + ' / ' +
                    strStatus+ ' / ' + '결정물질:'+
                    strVal9 +' ['+strDeterminationFactor +']');
                
                var cleanairInfo = new cleanairInfoModel();
                cleanairInfo.area = strArea;
                cleanairInfo.pm10 = strVal10;
                cleanairInfo.pm25 = strVal2_5;
                cleanairInfo.grade = strStatus;
                cleanairInfo.material = strVal9;
                cleanairInfo.date = getToday();
                cleanairInfo.save(function (err) {
    				if (err)
    					return handleError(err);
    				/*var chatLog_ = mongoose.model('chatLog', chatLogSchema);
    				chatLog_.find({}, function (err, logs) {
    					socket.emit("socket_evt_logs", JSON.stringify(logs));
    					socket.broadcast.emit("socket_evt_logs", JSON.stringify(logs));
    				});*/
    			});
			});
		});

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
app.get('/', function(req, res){
	
	var cleanairInfo = mongoose.model('cleaninfo', cleanairInfoSchema);
	cleanairInfo.find({}, function (err, docs) {
		//console.log(docs);
		res.render('index.jade', { //locals: {
			title: 'Clean Air Information',
			contents:docs
		//}
		});
	});
	
});

app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

function getToday() {
	var date = new Date();
	return date.getFullYear()+'.'+(date.getMonth()+1)+'.'+
		date.getDate()+' '+date.getHours()+':'+
		date.getMinutes()+':'+date.getSeconds();
}
