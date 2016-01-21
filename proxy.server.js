const http = require("http");
const fs = require("fs");
const path = require("path");
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
	else
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
	else
	if(strData.search("webroot") == 0)
		setWebRoot(strData.replace(/webroot\s*/g, "").trim());
});

function OpenLog(filename, bAppend)
{
	process.log_name = filename || "proxy.server.log.txt";
	process.log_fd = fs.openSync(process.log_name, bAppend ? "a+" : "w+");
	process.log_stream = fs.createWriteStream(null, {"fd":process.log_fd});
}

function setWebRoot(rootPath)
{
	rootPath = path.normalize(path.isAbsolute(rootPath) ? rootPath : util.format("%s\\%s", path.parse(require.main.filename).dir, rootPath));
	process.chdir(rootPath);
}
setWebRoot(args.webroot);

var server = http.createServer(function(request, response)
{
	var urlInfo = url.parse(request.url, true);
	var query = urlInfo.query;

	if((urlInfo.pathname.search("/nyxword/proxy") == 0) && query.uri)
	{
		var info = url.parse(query.uri);
		var clientRequest = http.request(info, function(srvRequest, srvResponse, response)
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
			response.writeHead(500, "Internal Server Error", {"content-type":"text/html", "access-control-allow-origin":"*"});
			response.end(util.format("<!DOCTYPE html><html><body><h1>Status: 500</h1><h2>Internal Server Error: %s</h2></body</html>", error.toString()));
			console.log(util.format("Proxy: Error '%s' from '%s'", error.code, request.url));
		});
		clientRequest.end();
	}
	else
	{
		var filename = path.normalize(process.cwd() + urlInfo.pathname);
		fs.readFile(filename, function(url, err, data)
		{
			if(err)
			{
				response.writeHead(404, "File not found", {"content-type":"text/html"});
				response.end(util.format("<html><body>404 File not found: %s</body></html>", url));
				console.log("Proxy: " + err);
			}
			else
			{
				response.writeHead(200, "OK", {"content-type":"text/html"});
				response.end(data);
				console.log(util.format("Proxy: Returning File: %s", url));
			}
		}.bind(fs, urlInfo.pathname));
	}
}).listen(args.port, function()
{
	process.title = util.format("Proxy: listening on %s", args.port);
	console.log(util.format("Proxy: Started and listening on %s", args.port))
});

