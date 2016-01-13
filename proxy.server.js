var http = require("http");
var url = require("url");
var util = require("util");
var args = require("./args.js");

var server = http.createServer(function(request, response)
{
	var query = url.parse(request.url, true).query;
	if(query.uri)
	{
		console.log(util.format("Proxy To: %s", request.url));
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
				console.log("Proxy Returned");
			});
		}.bind(clientRequest, request, response));
		clientRequest.end();
	}
	else
	{
		console.log("404 Not found: " + request.url + "");
		response.writeHead(404, "Not Found", {});
		response.end("<!DOCTYPE html><html><body><h1>Status: 404</h1><h2>Resource not found: " + request.url + "</h2></body</html>");
	}
}).listen(args.port);
console.log(util.format("PROXY server listening on http://172.1.0.1:%s/...(localhost/ServerName)", args.port));

