(function()
{
	var util = require("util");
	var args = process.argv.slice(2);
	var strArgs = "";
	while(args.length)
	{
		var arg = args.pop().split(":");
		strArgs += util.format("\"%s\":\"%s\"%s", arg[0], arg[1], args.length ? "," : "");
	}
	module.exports = JSON.parse(util.format("{%s}", strArgs));
	module.exports.arArgs = process.argv.slice(2);
})()
