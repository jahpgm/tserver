var http = require("http");
var url = require("url");
var proc = require("child_process");
var util = require("util");

function CycleNodeProc(port, server)
{
	http.Server.call(this, this._onRequest);
	this.listen(Number(port));
	console.log("CycleNodeProc running on http://localhost:%s -> will cycle '%s'", port, server);

	this._server = server;
	this.startServer();
}
util.inherits(CycleNodeProc, http.Server);
var _p = CycleNodeProc.prototype;

_p._cp = null;
_p._onRequest = function(request, response)
{
	if(request.url == "/cycle")
	{
		this._request = request;
		this._response = response;

		response.setHeader("content-type", "text/html");
		response.write("Cycling '" + this._server + "' at: " + (new Date()).toString() + "<p>");
		if(this._cp)
			this._cp.kill();
	}
};

this._server = null;
_p.startServer = function()
{
	this._cp = proc.fork(this._server);
	this._cp._parent = this;
	this._cp.on("exit", function(code, signal){this._parent.startServer.call(this._parent);});

	if(this._response)
		this._response.end(String.format("Start Process {0}", this._cp.pid));
};

/****
	UTILITY FUNCTIONS AND MAIN
****/
function writeln(stream, str)
{
	var args = Array.prototype.slice.call(arguments, 1); 
	stream.write("<div>" + String.format.apply(null, args) + "</div>");
}
if(!String.format) {
  String.format = function(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) { 
	  return typeof args[number] != 'undefined'
        ? args[number] 
        : match
      ;
    });
  };
}
(function main(args)
{
	if(require.main === module)
	{
		var strArgs = "";
		while(args.length)
		{
			var arg = args.pop().split(":");
			strArgs += String.format("\"{0}\":\"{1}\"{2}", arg[0], arg[1], args.length ? "," : "");
		}
		var oArgs = JSON.parse(String.format("{{0}}", strArgs));
		var cServer = new CycleNodeProc(oArgs.port, oArgs.server);
	}
})(process.argv.slice(2));

