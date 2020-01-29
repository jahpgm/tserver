# tserver README

Simple Node.js http server...just used for lightweight development purposes.

## Arguments
* -webroot The directory that acts as the root of the web app.
* -port The port number you want the server to listen on.

## Config
Will be adding a config file soon so you don't have to pass command line arguments.
```javascript
{
	"serverConfig":
	{
	},
	"webApp":
	{
		"port":8000,
		"webRoot":{"alias":"web_root", "dir":"C:/dev"},
		"maps":
		[
			{"alias":"mappedDir", "dir":"C:/some_dir/some_dir/dir_to_mapp"}
		]
	}
	
}
```
* serverConfig - reserved for future use.
* webApp - information about how to configure the server for the app.
* port - the port for the server to listen on for the app.
* webRoot - object with the web app's root directory (above which you can't navigate).
* maps - Optional array of objects to map url aliases to physical directories.

## Commands
* cls - Clear the screen.
* clog - Clear the current log file.
* log - pipe the current log file to the screen.

