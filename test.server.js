#!/usr/bin/env node
//copyright (c) 2019 pgmjah. All rights reserved.

const os = require("os");
const http = require("http");
const https = require("https");
const fs = require("fs");
const paths = require("path");
const urls = require("url");
const util = require("util");
const readline = require("readline");
const nodeEnv = require('dotenv').config();
const args = require("./args.js");
const childProc = require("child_process");
function TestServer(cfgFilename)
{
	http.Server.call(this);

	cfgFilename = cfgFilename || "";
	try
	{
		var cfgFile = fs.readFileSync(paths.resolve(process.cwd(), cfgFilename));
		this._config = JSON.parse(cfgFile);
		this._config.filename = cfgFilename;
	}
	catch(ex)
	{
		console.log(cfgFilename ? `Server: error parsing config file: ${cfgFilename} (${ex.message})` : `Server: No config specified.`)
	}

	//Make sure config file has all defaults.
	this._config = TestServer.extend(
	{
		"server":
		{
			"port":eval(process.env.TSERVER_PORT) || 8000,
			"log": eval(process.env.TSERVER_LOG) || false,
			"silent":eval(process.env.TSERVER_SILENT) || false,
			"plugins":eval(process.env.TSERVER_PLUGINS) || [],
			"pathTokens":eval(process.env.TSERVER_PATH_TOKENS) || {}
		},
		"webApp":
		{
			"webRoot":{"alias":process.env.TSERVER_WEBROOT_ALIAS || "", "dir":process.env.TSERVER_WEBROOT_DIR || process.cwd()},
			"maps":eval(process.env.TSERVER_WEBAPP_MAPS) || []
		}
		
	}, this._config);

	//load the plugins.
	this._config.server.plugins = this._config.server.plugins.map((plugin)=>{
		for(var token in this._config.server.pathTokens){
			plugin = plugin.replace(`{${token}}`, `${this._config.server.pathTokens[token]}`)
		}
		return require(plugin);
	})

	//Do the rest of the startup...
	process.stdin.on("data", this._handleInput.bind(this));
	this.on("request", this._onRequest.bind(this));
	this._openLog(args.log_file, true);
	this.listen(this._config.server.port, this._onListening.bind(this));
	this.on("close", this._onServerClosed.bind(this));
}
util.inherits(TestServer, http.Server);
var _p = TestServer.prototype;

TestServer.CONTENT_TYPES =
{
	".gz":"application/x-gzip",
	".txt":"text/plain",
	".xml":"text/xml",
	".htm":"text/html",
	".html":"text/html",
	".js":"text/javascript",
	".css":"text/css",
	".png":"image/png",
	".jpeg":"image/jpeg",
	".gif":"image/gif",
	".svg":"image/svg+xml",
	".woff":"font/woff",
	".woff2":"font/woff2",
	".ttf":"font/truetype",
	".json":'application/json'
};
TestServer.getContentType = function(filePath){return (TestServer.CONTENT_TYPES[filePath.substring(filePath.lastIndexOf(".")).trim()] || TestServer.CONTENT_TYPES[".txt"]);};
TestServer.fileExists = function(filepath)
{
	let fStat = null;
	try
	{
		fStat = fs.statSync(filepath);
	}
	catch(ex)
	{
	}
	return fStat;
}
TestServer.extend = function extend()
{
	var arObjects = Array.from(arguments);
	var oRet = arObjects.shift();
	while(arObjects.length)
	{
		var oSrc = arObjects.shift();
		for(var key in oSrc)
		{
			var member = oSrc[key];
			if(oSrc.hasOwnProperty(key))
				oRet[key] = ((member instanceof Object) && (typeof(member) != "function") && !(member instanceof Array)) ? TestServer.extend({}, oRet[key], member) : member;
		}
	}
	return oRet;
};


_p._onListening = function()
{
	let address = this.address();
	let webRoot = this._config.webApp.webRoot;
	let maps = this._config.webApp.maps;
	this.log(util.format("Server: Config File: %s", this._config.filename || "Internal Default"));
	this.log(util.format("Server: WebRoot - alias: '/%s', dir: %s", webRoot.alias, webRoot.dir));
	for(var i = 0; i < maps.length; ++i)
	{
		var map = maps[i];
		this.log(util.format("Server: Map - %s => %s", map.alias, map.dir));
	}
	this.log(util.format("Server: ***** Listening at %s on port %s *****", getLocalIPAddress(), address.port))
	process.title = util.format("TestServer: listening on port %s", address.port);
};
_p._onServerClosed = function()
{
	this.log(util.format("Server: ***** CLOSED *****"));
};

_p._logName = "";
_p._logStream = null;
_p._openLog = function(logPath, bAppend)
{
	if(this._config.server.log)
	{	
		logPath = logPath || ".\\test.server.log.txt";
		this._logName = paths.normalize(paths.isAbsolute(logPath) ? logPath : util.format("%s\\%s", paths.parse(require.main.filename).dir, logPath));
		this._logStream = fs.createWriteStream(this._logName, {flags: bAppend ? "a+" : "w+"});
		this.log("Server: logging to " + this._logName);
	}
};

_p.log = function(strLog, bNoWrite)
{
	if(!bNoWrite && !this._config.server.silent)
	{
		var date = new Date();
		(this._logStream && this._logStream.write(util.format("%s:%s:%s %s/%s/%s %s\r\n", date.getHours(), date.getMinutes(), date.getSeconds(), date.getMonth() + 1, date.getDate(), date.getFullYear(), strLog)));
		console.log(strLog);
	}
};
_p.logReset = function(){process.stdout.write("0o33c");};

_p._handleInput = function(data)
{
	var strData = data.toString().toLowerCase();
	if(strData.search("cls") == 0)
		this.logReset();
	else
	if(strData.search("log") == 0)
	{
		this.log(util.format("========== START %s ==========", paths.parse(this._logName).name), true);
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
			this.setWebRoot(webRoot);
		else
			this.log(process.cwd());
	}
};

_p._onRequest = function(request, response)
{
	var urlInfo = urls.parse(request.url, true);
	var query = urlInfo.query;

	if(urlInfo.pathname.search("/tserver/ping") == 0){
		this.log(`Server: pinged From: ${request.socket.localAddress} on Port: ${request.socket.localPort} (${new Date()})`)
		response.writeHead(200, "OK", {"content-type":TestServer.getContentType('.json'), "Access-Control-Allow-Origin":"*"});
		response.end(JSON.stringify({status:'running', ip:getLocalIPAddress(), port:this._config.server.port}));
	}
	else if((urlInfo.pathname.search("/proxy/load") == 0) && query.uri)
		this.loadProxy(query.uri, request, response);
	else
		this.loadPage(urlInfo.pathname, request, response);
};

_p.loadProxy = function(proxyUrl, srvRequest, srvResponse)
{
	var self = this;
	var proxyInfo = urls.parse(proxyUrl);
	var clientRequest = https.request(proxyInfo, function(response)
	{
		srvResponse.writeHead(200, "OK", {"content-type":"text/html", "Access-Control-Allow-Origin":"*"});
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
		srvResponse.writeHead(500, "Internal Server Error", {"content-type":"text/html", "Access-Control-Allow-Origin":"*"});
		srvResponse.end(util.format("<!DOCTYPE html><html><body><h1>Status: 500</h1><h2>Internal Server Error: %s</h2></body</html>", error.toString()));
		self.log(util.format("Server: Error '%s' from '%s'", error.code, proxyUrl));
	});
	clientRequest.end();
};

_p.loadPage = function(srvPath, srvRequest, srvResponse)
{
	let origSrvPath = srvPath = srvPath.replace(/\\/g, "/");
	
	//set the headers for the content type.
	let headers = {"content-type":TestServer.getContentType(srvPath), "Access-Control-Allow-Origin":"*"};
	var mapped = false;
	var filePath = "";

	//let the plugins process the requested file path.
	this._config.server.plugins.map((plugin)=>{
		srvPath = plugin.resolveUrl ? plugin.resolveUrl(srvPath, headers) : srvPath;
	});

	//resolve the maps, and also the pathTokens.
	this._config.webApp.maps.map((mapEntry)=>
	{
		var regEx = new RegExp( this._config.webApp.webRoot.alias ? `^/${this._config.webApp.webRoot.alias}/${mapEntry.alias}/` : `/${mapEntry.alias}/`);
		if(regEx.test(srvPath))
		{
			filePath = srvPath.replace(regEx, `${mapEntry.dir}/`);
			for(var token in this._config.server.pathTokens){
				filePath = filePath.replace(`{${token}}`, `${this._config.server.pathTokens[token]}`)
			}
			mapped = true;
		}
	})

	if(!mapped)
		filePath = srvPath.replace(`/${this._config.webApp.webRoot.alias}`, `${this._config.webApp.webRoot.dir}/`);


	this.log("Server: Requesting File: " + srvPath);

	//see if there's a gzip file to return instead of raw file.
	let gzFilePath = `${filePath}.gz`;
	if(TestServer.fileExists(gzFilePath))
	{
		headers["Content-Encoding"] = "gzip";//add gzip header.
		filePath = gzFilePath;
	}

	//get the file and return it!
	fs.readFile(filePath, function(filePath, srvRequest, srvResponse, err, data)
	{
		if(err)
		{
			srvResponse.writeHead(404, "File not found", {"content-type":"text/html"});
			srvResponse.end(util.format("<html><body>404 File not found: %s</body></html>", srvPath));
			this.log("Server: " + err);
		}
		else
		{
			//let the plugins process the file contents (data).
			this._config.server.plugins.map((plugin)=>{
				const retInfo = plugin.preprocessData ? plugin.preprocessData(data, headers, {webRoot:this._config.webApp.webRoot, filePath, srvPath, origSrvPath}) : {data, headers};
				data = retInfo.data;
				headers = retInfo.headers;
			});

			srvResponse.writeHead(200, "OK", headers);
			srvResponse.end(data);
			this.log(util.format("Server: Returning File: %s", filePath));
		}
	}.bind(this, filePath, srvRequest, srvResponse));
}; 

function getLocalIPAddress()
{
	var ifaces = os.networkInterfaces();
	var ipAddress = "";
	Object.keys(ifaces).forEach((ifname) => {
		/*not sure why the following 2 lines are here...I'm sure I had a reason at some point.*/
		// if(ifname !== 'Ethernet 2')
		// 	return;
		ifaces[ifname].forEach((iface) => {
			if ('IPv4' === iface.family && iface.internal === false) {
				ipAddress = iface.address;
			}
		});
	});
	return ipAddress;
}

//Create the instance of the TestServer if running standalone.
if(!module.parent)
	var ts = new TestServer(process.argv[2]);

module.exports = {TestServer};