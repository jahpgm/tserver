var startDate = new Date();
var http = require("http");
var url = require("url");

var server = http.createServer(function(request, response)
{
	response.write("<!DOCTYPE html><html><body>");
	response.write("<h1>" + startDate + "</h1>");
	var urlParts = url.parse(request.url);
	for(var key in urlParts)
		response.write(key + ": " + urlParts[key] + "<br/>");
	response.end("</body></html>");
}).listen("8000");
console.log("PROXY server listening on http://172.1.0.1:8000/...(localhost/ServerName)");
