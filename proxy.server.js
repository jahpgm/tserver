var http = require("http");
var url = require("url");
var server = http.createServer(function(request, response)
{
	this._request = request;
	this._response = response;

	console.log("REQUEST: " + request.url);

	var query = url.parse(request.url, true).query;
	if(query.uri)
	{
		var info = url.parse(query.uri);
		var clientRequest = http.request(info, function(response)
		{
			this._server._response.writeHead(200, "OK", {"content-type":"text/html", "access-control-allow-origin":"*"});
			response.on("data", function(chunk)
			{
				this.req._server._response.write(chunk);
			});
			response.on("end", function()
			{
				this.req._server._response.end();
			});
		});
		clientRequest._server = this;
		clientRequest.end();
	}
	else
	{
		response.writeHead(404, "Not Found", {});
		response.end("<!DOCTYPE html><html><body><h1>Status: 404</h1><h2>Resource not found: " + request.url + "</h2></body</html>");
	}
}).listen("8000");
console.log("PROXY server listening on http://172.1.0.1:8000/...(localhost/ServerName)");
