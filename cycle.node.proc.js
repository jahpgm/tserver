const EventEmitter = require("events");
const proc = require("child_process");
const util = require("util");
const fs = require("fs");

function CycleNodeProcess()
{
	EventEmitter.call(this);
	this._args = require("./args.js");
	this._fsw = fs.watch(this._args.process, this.startProcess.bind(this));
	console.log(util.format("Cycle: Listening to '%s'", this._args.process));
	process.title = util.format("CycleNodeProcess - Process '%s'", this._args);
	this.startProcess(this._args.arArgs);
}
util.inherits(CycleNodeProcess, EventEmitter);
var _p = CycleNodeProcess.prototype;

_p._cp = null;
_p.startProcess = function(args, event, filename)
{
	if(this._cp)
		this._cp.kill();

	console.log(util.format("Cycle: Starting '%s'", this._args.process));
	this._cp = proc.fork(this._args.process, process.argv.slice(2));
	this._cp.on("exit", function(cp, code, signal)
	{
		console.log(util.format("Cycle: Killed '%s'", this._args.process));
	}.bind(this, this._cp));
	return this._cp
}
var cProcess = new CycleNodeProcess();

