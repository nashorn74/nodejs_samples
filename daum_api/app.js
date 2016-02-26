
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var Iconv1 = require('iconv').Iconv;
var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1/test');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;
var itemSchema = new Schema({
	id: ObjectId,
	title: String,
	publish_date: String,
	shoppingmall_count: String,
	maker: String, 
	link: String,
	shoppingmall: String,
	review_count: String,
	brand: String,
	product_type: String,
	price_max: String,
	price_group: String,
	price_min: String,
	docid: String,
	description: String,
	category_name: String,
	image_url: String
});
var itemModel = mongoose.model('shopping_item', itemSchema);

//http://apis.daum.net/shopping/search?q=wii&apikey=DAUM_SHOP_DEMO_APIKEY&output=json
var apikey = "0f5683b5e130c6c0c2a26deb86e501dbc262bf28";
var query = "wii";

var options = {
	host: 'apis.daum.net',
	port: 80,
	path: '/shopping/search?q='+query+'&apikey='+apikey+'&output=json'
};

http.get(options, function(res) {
	var body = "";
	res.addListener('data', function(chunk) {
		console.log("response...");
		body += chunk;
	});
	res.addListener('end', function() {
		console.log("end...");
		
		//console.log(body);
		
		var obj = JSON.parse(body);
		//console.log(obj.channel.item[0]);
		
		for (itemName in obj.channel.item)
		{
			//console.log(obj.channel.item[itemName]);
			
			var item = new itemModel();
			item.title 					= obj.channel.item[itemName].title;
			item.publish_date 			= obj.channel.item[itemName].publish_date;
			item.shoppingmall_count 	= obj.channel.item[itemName].shoppingmall_count;
			item.maker 					= obj.channel.item[itemName].maker;
			item.link 					= obj.channel.item[itemName].link;
			item.shoppingmall 			= obj.channel.item[itemName].shoppingmall;
			item.review_count			= obj.channel.item[itemName].review_count;
			item.brand					= obj.channel.item[itemName].brand;
			item.product_type			= obj.channel.item[itemName].product_type;
			item.price_max				= obj.channel.item[itemName].price_max;
			item.price_group			= obj.channel.item[itemName].price_group;
			item.price_min				= obj.channel.item[itemName].price_min;
			item.docid					= obj.channel.item[itemName].docid; 
			item.description			= obj.channel.item[itemName].description;
			item.category_name			= obj.channel.item[itemName].category_name;
			item.image_url				= obj.channel.item[itemName].image_url;
			
			item.save(function (err) {
				if (err)
					return handleError(err);
			});
		}
	});
}).on('error', function(e) {
	console.log("Got error: "+e.message);
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
	
	var item = mongoose.model('shopping_item', itemSchema);
	item.find({}, function (err, docs) {
		//console.log(docs);
		res.render('index.jade', { //locals: {
			title: 'Daum Shopping Open API',
			items:docs
		//}
		});
	});
	
});

app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
