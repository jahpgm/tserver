# tserver README

Simple Node.js http server...just used for lightweight development purposes.

## Install/Run
* Global - npm install -g pgmjah-tserverw ill install as a global node program.  To run: tserver config.json
* Local - npm install pgmjah-tserver. To run node test.server.js config.json

***Note: If you run tserver without a config file, the server will use the current working directory (cwd) as the app root, and listen on port 8000.***

## Config
You can use a '.env' file (optional) to set the default environment values (process.env) for all the server's configuration properties:
```javascript
TSERVER_PORT=8000
TSERVER_LOG=false
TSERVER_SILENT=false
TSERVER_PLUGINS=["./somePlugin.js"]
TSERVER_PATH_TOKENS={TOKEN:"some/dir/to/replace"}
TSERVER_PLUGINS=["./pluginTest.js"]
TSERVER_WEBROOT_ALIAS=some_alias
TSERVER_WEBROOT_DIR=C:/dev/tserver
TSERVER_WEBAPP_MAPS=[{"alias":"some_alias", "dir":"actual/dir"}]
```

You can also specify a config file to override any settings in the environment:
```javascript
{
	"server":
	{
		"port":8000,
		"log":false,
		"silent":false,
		"plugins":[
			'path/to/plugin/plugin.js'
		],
		"pathTokens":{
			"TOKEN":"C:/path/for/token"
		}
	},
	"webApp":
	{
		"webRoot":{"alias":"some_root_name", "dir":"some/dir"},
		"maps":
		[
			{"alias":"map_dir", "dir":"C:/some_dir/some_dir/dir_to_map"}
			{"alias":"token_dir", "dir":"{TOKEN}/some_dir/dir_to_map"}
		]
	}
	
}
```
* server - global settings for the server.
	* log - write all server requests to 'test.server.log.txt'.
	* silent - don't log information to the console.
	* plugins - an array of paths to the plugin files you want loaded.
		* plugin - an exported object with functions:
			* resolveUrl(filePath, srvPath, headers) - can inspect the requested path, and return a different path (redirect).
			* preprocessData(data, headers, filePath, srvPath) - can return an object with {data, headers}, which will be returned in the response.
		* pathTokens - an object with keys you can use in a mapped path, or a plugin path (surrounded by {}), that will be replaced when processed.
* webApp - information about how to configure the server for the app.
* port - the port for the server to listen on for the app (default 8000).
* webRoot - object with the web app's root directory (above which you can't navigate).
	* alias - the name of the root you want to use in the url (default "/").
	* dir - the physical directory mapped to the alias (default current working directory).
* maps - Optional array of objects to map url aliases to physical directories.
	* alias - the name of directory you want to use in the url.
	* dir - the physical directory mapped to the alias.

## Commands
* cls - Clear the screen.
* clog - Clear the current log file.
* log - pipe the current log file to the screen.

## Changelog

* 1.0.30 - Fixed ping issue.

* 1.0.29 - Added url '/tserver/ping' to test if server is running.

* 1.0.28 - Updated packaging.

* 1.0.27 - Updated packaging.

* 1.0.26 - Added support for .env file so default config variables can be set outside of the config file.

* 1.0.25 - Changed plugin 'preprocessData' to take an object with various paths.  Also, plugin path's can also use the pathTokens.

* 1.0.24 - More work on plugins.

* 1.0.23 - More work on plugins.

* 1.0.22 - Added plugins.

* 1.0.21 - Added svg mime type.

* 1.0.20 - Show ip address and port on startup so we know where, and what we're listening on.

* 1.0.19 - Fixed deprecated octal in logReset.

* 1.0.18 - Added config option for settings.silent to stop logging to console.  Also exported TestServer so it can be run from other modules.

* 1.0.17 - Better startup information about config file, mappings, etc.

* 1.0.16 - Fixed mapped directory resolution when mapped value was actually part of the endpoint of the url.

* 1.0.15 - Added better default config handling...if you don't supply various values, I'll overlay defaults on top.
