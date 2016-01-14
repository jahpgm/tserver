const http = require("http");
const url = require("url");
const util = require("util");
const args = require("./args.js");

var server = http.createServer(function(request, response)
{
	if(this._cr)
	{
		this._cr.abort();
		this._cr = null;
	}

	var query = url.parse(request.url, true).query;
	if(query.uri)
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
				console.log("Proxy Returned");
			});
		}.bind(clientRequest, request, response));
		clientRequest.on("socket", function(response, socket, head)
		{
			console.log(util.format("Proxy To: %s", request.url));
		});
		clientRequest.on("error", function(error)
		{
			console.log(util.format("500 Internal Server Error: %s (%s)", error.code, error.errno));
			response.writeHead(500, "Internal Server Error", {"content-type":"text/html", "access-control-allow-origin":"*"});
			response.end(util.format("<!DOCTYPE html><html><body><h1>Status: 500</h1><h2>Internal Server Error: %s</h2></body</html>", error.toString()));
		});
		clientRequest.end();
	}
	else
	{
		console.log("404 Not found: " + request.url + "");
		response.writeHead(404, "Not Found", {"content-type":"text/html", "access-control-allow-origin":"*"});
		response.end(util.format("<!DOCTYPE html><html><body><h1>Status: 404</h1><h2>Resource not found: %s</h2></body</html>", request.url));
	}
}).listen(args.port, function()
{
	process.title = util.format("Proxy server - listening on %s", args.port);
	console.log(util.format("Proxy server listening on http://172.1.0.1:%s/...(localhost/ServerName)", args.port))
});
