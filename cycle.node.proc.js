const EventEmitter = require("events");
const proc = require("child_process");
const util = require("util");
const fs = require("fs");

function CycleNodeProcess()
{
	EventEmitter.call(this);
	this._args = require("./args.js");
	this.startProcess();
	this._fsw = fs.watch(this._args.process, this._onProcFileChange.bind(this));
	console.log(util.format("CycleNodeProcess will recycle '%s' on change to file.", this._args.process));
	process.title = util.format("CycleNodeProcess - Process '%s'", this._args.process);
}
util.inherits(CycleNodeProcess, EventEmitter);
var _p = CycleNodeProcess.prototype;

_p._onProcFileChange = function(event, filename)
{
	this.startProcess();
};

_p._cp = null;
_p.startProcess = function()
{
	if(this._cp)
	{
		this._cp.kill();
	}

	this._cp = proc.fork(this._args.process, this._args.arArgs);
	this._cp.on("exit", (function(code, signal)
	{
		console.dir(arguments);
		console.log(util.format("Process '%s' Killed...restarting...", this._args.process));
	}).bind(this));
}
var cProcess = new CycleNodeProcess();

