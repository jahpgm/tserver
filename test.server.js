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
	(process.log_stream && process.log_stream.write(util.format("%s:%s:%s %s/%s/%s %s\r\n", date.getHours(), date.getMinutes(), date.getSeconds(), date.getMonth() + 1, date.getDate(), date.getFullYear(), strLog)));
	console._log.call(console, strLog);
};
console.reset = function(){process.stdout.write("\33c");};

process.stdin.on("data", function(data)
{
	var strData = data.toString().toLowerCase();
	if(strData.search("cls") == 0)
		console.reset();
	else
	if(strData.search("log") == 0)
		fs.createReadStream(process.log_name).pipe(process.stdout);
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
	{
		var webRoot = strData.replace(/webroot\s*/g, "").trim();
		if(webRoot)
			setWebRoot(webRoot);
		else
			console.log(process.cwd());
	}
});

function OpenLog(logPath, bAppend)
{
	logPath = logPath || "./test.server.log.txt";
	process.log_name = path.normalize(path.isAbsolute(logPath) ? logPath : util.format("%s\\%s", path.parse(require.main.filename).dir, logPath));
	process.log_stream = fs.createWriteStream(process.log_name, {flags: bAppend ? "a+" : "w+"});
	console.log("Server: logging to " + process.log_name);
}

function setWebRoot(rootPath)
{
	rootPath = path.normalize(path.isAbsolute(rootPath) ? rootPath : util.format("%s\\%s", path.parse(require.main.filename).dir, rootPath));
	process.chdir(rootPath);
	console.log(util.format("Server: webroot '%s'", rootPath));
}

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
				console.log(util.format("Server: Finished loading '%s'", srvRequest.url));
			});
		}.bind(clientRequest, request, response));
		clientRequest.on("socket", function(response, socket, head)
		{
			console.log(util.format("Server: Connecting to '%s'", request.url));
		});
		clientRequest.on("error", function(error)
		{
			response.writeHead(500, "Internal Server Error", {"content-type":"text/html", "access-control-allow-origin":"*"});
			response.end(util.format("<!DOCTYPE html><html><body><h1>Status: 500</h1><h2>Internal Server Error: %s</h2></body</html>", error.toString()));
			console.log(util.format("Server: Error '%s' from '%s'", error.code, request.url));
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
				console.log("Server: " + err);
			}
			else
			{
				var strType = "text/plain";
				var fType = filename.substring(filename.lastIndexOf(".")).trim();
				if(fType == ".htm" || fType == ".html")
					strType = "text/html";
				else
				if(fType == ".js")
					strType = "text/javascript";
				else
				if(fType == ".css")
					strType = "text/css";

				response.writeHead(200, "OK", {"content-type":strType});
				response.end(data);
				console.log(util.format("Server: Returning File: %s", url));
			}
		}.bind(fs, urlInfo.pathname));
	}
}).listen(args.port, function()
{
	process.title = util.format("Server: listening on %s", args.port);
	console.log(util.format("Server: listening on %s", args.port))
	OpenLog(null, true);
	setWebRoot(args.webroot);
});
