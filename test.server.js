const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");
const util = require("util");
const readline = require("readline");
const args = require("./args.js");

function TestServer(webroot, port)
{
	http.Server.call(this);
	process.stdin.on("data", this._handleInput.bind(this));

	this.on("request", this._onRequest.bind(this));
	this._openLog(args.log_file, true);
	this.listen(port, this._onListening.bind(this));
	this.setWebRoot(webroot);
}
util.inherits(TestServer, http.Server);
var _p = TestServer.prototype;

TestServer.CONTENT_TYPES =
{
	".txt":"text/plain",
	".htm":"text/html",
	".html":"text/html",
	".js":"text/javascript",
	".css":"text/css",
	".png":"image/png",
	".jpeg":"image/jpeg",
	".gif":"image/gif"
};
TestServer.getContentType = function(filePath){return (TestServer.CONTENT_TYPES[filePath.substring(filePath.lastIndexOf(".")).trim()] || TestServer.CONTENT_TYPES[".txt"]);};

_p._onListening = function()
{
	this.log(util.format("Server: ***** Listening on port %s *****", args.port))
	process.title = util.format("Server: listening on port %s", args.port);
};

_p.setWebRoot = function(rootPath)
{
	//The previous way of resolving the root path didn't work on UNIX...had to change to path.resolve.
	rootPath = path.normalize(path.isAbsolute(rootPath) ? rootPath : path.resolve(rootPath));
	process.chdir(rootPath);
	this.log(util.format("Server: webroot '%s'", rootPath));
};

_p._logName = "";
_p._logStream = null;
_p._openLog = function(logPath, bAppend)
{
	logPath = logPath || ".\\test.server.log.txt";
	this._logName = path.normalize(path.isAbsolute(logPath) ? logPath : util.format("%s\\%s", path.parse(require.main.filename).dir, logPath));
	this._logStream = fs.createWriteStream(this._logName, {flags: bAppend ? "a+" : "w+"});
	this.log("Server: logging to " + this._logName);
};

_p.log = function(strLog, bNoWrite)
{
	if(!bNoWrite)
	{
		var date = new Date();
		(this._logStream && this._logStream.write(util.format("%s:%s:%s %s/%s/%s %s\r\n", date.getHours(), date.getMinutes(), date.getSeconds(), date.getMonth() + 1, date.getDate(), date.getFullYear(), strLog)));
	}
	console.log(strLog);
};
_p.logReset = function(){process.stdout.write("\33c");};

_p._handleInput = function(data)
{
	var strData = data.toString().toLowerCase();
	if(strData.search("cls") == 0)
		this.logReset();
	else
	if(strData.search("log") == 0)
	{
		this.log(util.format("========== START %s ==========", path.parse(this._logName).name), true);
		fs.createReadStream(this._logName).pipe(process.stdout);
	}
	else
	if(strData.search("clog") == 0)
	{
		var self = this;
		var rl = readline.createInterface({input:process.stdin, output:process.stdout});
		rl._classname = "readline";
		rl.question("Are you sure you want to clear the log file (Y/N)?", function(answer)
		{
			answer = answer.toLowerCase();
			if(answer == "y" || answer == "yes")
				this._openLog(process.filename, false);
			rl.close(); //supposed to do the resume below...doesn't seem to.	
			rl.resume();//see above.
		}.bind(this));
	}
	else
	if(strData.search("webroot") == 0)
	{
		var webRoot = strData.replace(/webroot\s*/g, "").trim();
		if(webRoot)
			setWebRoot(webRoot);
		else
			this.log(process.cwd());
	}
};

_p._onRequest = function(request, response)
{
	var urlInfo = url.parse(request.url, true);
	var query = urlInfo.query;

	if((urlInfo.pathname.search("/proxy/load") == 0) && query.uri)
		this.loadProxy(query.uri, request, response);
	else
		this.loadPage(urlInfo.pathname, request, response);
};

_p.loadProxy = function(proxyUrl, srvRequest, srvResponse)
{
	var self = this;
	var proxyInfo = url.parse(proxyUrl);
	var clientRequest = https.request(proxyInfo, function(response)
	{
		srvResponse.writeHead(200, "OK", {"content-type":"text/html", "access-control-allow-origin":"*"});
		response.on("data", function(chunk)
		{
			srvResponse.write(chunk);
		});
		response.on("end", function()
		{
			srvResponse.end();
			self.log(util.format("Server: Returning Proxy '%s'", srvRequest.url));
		});
	});
	clientRequest.on("error", function(error)
	{
		srvResponse.writeHead(500, "Internal Server Error", {"content-type":"text/html", "access-control-allow-origin":"*"});
		srvResponse.end(util.format("<!DOCTYPE html><html><body><h1>Status: 500</h1><h2>Internal Server Error: %s</h2></body</html>", error.toString()));
		self.log(util.format("Server: Error '%s' from '%s'", error.code, proxyUrl));
	});
	clientRequest.end();
};

_p.loadPage = function(srvPath, srvRequest, srvResponse)
{
	var filePath = path.normalize(process.cwd() + srvPath);
	this.log("Server: Requesting File: " + srvPath);
	fs.readFile(filePath, function(srvPath, srvRequest, srvResponse, err, data)
	{
		if(err)
		{
			srvResponse.writeHead(404, "File not found", {"content-type":"text/html"});
			srvResponse.end(util.format("<html><body>404 File not found: %s</body></html>", srvPath));
			this.log("Server: " + err);
		}
		else
		{
			srvResponse.writeHead(200, "OK", {"content-type":TestServer.getContentType(srvPath)});
			srvResponse.end(data);
			this.log(util.format("Server: Returning File: %s", filePath));
		}
	}.bind(this, srvPath, srvRequest, srvResponse));
}; 

//Create the instance of the TestServer.
var ts = new TestServer(args.webroot, args.port);
