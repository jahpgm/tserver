const http = require("http");
const url = require("url");
const util = require("util");
const args = require("./args.js");
const fs = require("fs");

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
	{
		console.log(util.format("Proxy: 404 Not found - %s", request.url));
		response.writeHead(404, "Not Found", {"content-type":"text/html", "access-control-allow-origin":"*"});
		response.end(util.format("<!DOCTYPE html><html><body><h1>Status: 404</h1><h2>Resource not found: %s</h2></body</html>", request.url));
	}
}).listen(args.port, function()
{
	process.title = util.format("Proxy: listening on %s", args.port);
	console.log(util.format("Proxy: listening on %s", args.port))
});
