const http = require("http");
const fs = require("fs");
const url = require("url");
const util = require("util");
const readline = require("readline");
const args = require("./args.js");

console._log = console.log;
console.log = function(strLog)
{
	var date = new Date();
	(process.log_stream && process.log_stream.write(util.format("%s:%s:%s %s/%s/%s %s\n", date.getHours(), date.getMinutes(), date.getSeconds(), date.getMonth() + 1, date.getDate(), date.getFullYear(), strLog)));
	console._log.call(console, strLog);
};
console.reset = function(){process.stdout.write("\33c");};

process.stdin.on("data", function(data)
{
	var strData = data.toString();
	if(strData.search("cls") == 0)
		console.reset();
	else
	if(strData.search("log") == 0)
	{
		fs.open(process.log_name, "a+", function(err, fd)
		{	
			var strLog = "";
			var rs = fs.createReadStream(null, {"fd":fd, "encoding":"utf8"})
				.on("data", function(data){strLog += data;})
				.on("end", function(){process.stdout.write(strLog);});
		});
	}
	if(strData.search("clog") == 0)
	{
		var rl = readline.createInterface({input:process.stdin, output:process.stdout});
		rl.question("Are you sure you want to clear the log file (Y/N)?", function(answer)
		{
			answer = answer.toLowerCase();
			if(answer == "y" || answer == "yes")
				OpenLog(process.filename, false);
			this.close(); //supposed to do the resume below...doesn't seem to.	
			this.resume();//see above.
		}.bind(rl));
	}
});

function OpenLog(filename, bAppend)
{
	process.log_name = filename || "proxy.server.log.txt";
	process.log_fd = fs.openSync(process.log_name, bAppend ? "a+" : "w+");
	process.log_stream = fs.createWriteStream(null, {"fd":process.log_fd});
}
OpenLog(args.logfile, true);

var server = http.createServer(function(request, response)
{
	if(this._cr)
	{
		this._cr.abort();
		this._cr = null;
	}

	var urlInfo = url.parse(request.url, true);
	var query = urlInfo.query;
	if((urlInfo.pathname.search("/proxy") == 0) && query.uri)
	{
		var info = url.parse(query.uri);
		var clientRequest = this._cr = http.request(info, function(srvRequest, srvResponse, response)
		{
			srvResponse.writeHead(200, "OK", {"content-type":"text/html", "access-control-allow-origin":"*"});
			response.on("data", function(chunk)
			{
				srvResponse.write(chunk);
			});
			response.on("end", function()
			{
				srvResponse.end();
				console.log(util.format("Proxy: Finished loading '%s'", srvRequest.url));
			});
		}.bind(clientRequest, request, response));
		clientRequest.on("socket", function(response, socket, head)
		{
			console.log(util.format("Proxy: Connecting to '%s'", request.url));
		});
		clientRequest.on("error", function(error)
		{
			console.log(util.format("Proxy: Error '%s' from '%s'", error.code, request.url));
			response.writeHead(500, "Internal Server Error", {"content-type":"text/html", "access-control-allow-origin":"*"});
			response.end(util.format("<!DOCTYPE html><html><body><h1>Status: 500</h1><h2>Internal Server Error: %s</h2></body</html>", error.toString()));
		});
		clientRequest.end();
	}
	else		
	if(urlInfo.pathname.search("/nyxword.htm") == 0)
	{
		console.log(util.format("Proxy: UNDER CONSTRUCTION Reading File '%s'", request.url));
		response.writeHead(200, "OK", {"content-type":"text/html"});
		response.end("<html><body><h1>Serving Files...Under Construction</h1></body></html>");
	}
	else
	if(urlInfo.pathname.search("/nancy") == 0)
	{
		response.writeHead(200, "OK", {"content-type":"text/html"});
		response.end("<html><body><h1>Nancy...that shit aint available!</h1></body></html>");
	}
	else
	{
		console.log(util.format("Proxy: 404 Not found - %s", request.url));
		response.writeHead(404, "Not Found", {"content-type":"text/html", "access-control-allow-origin":"*"});
		response.end(util.format("<!DOCTYPE html><html><body><h1>Status: 404</h1><h2>Resource not found: %s</h2></body</html>", request.url));
	}
}).listen(args.port, function()
{
	process.title = util.format("Proxy: listening on %s", args.port);
	console.log(util.format("Proxy: Started and listening on %s", args.port))
});

