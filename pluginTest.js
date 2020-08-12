const paths = require("path");

module.exports = {
	resolveUrl:(srvPath, headers)=>{
		console.log(`Plugin - resolve srvPath: ${srvPath} (${JSON.stringify(headers)})`);
		return srvPath;
	},
	preprocessData:(data, headers, paths)=>{
		console.log(`Plugin - preprocessData Paths: ${JSON.stringify(paths)} (${JSON.stringify(headers)})`);
		return {data, headers};
	}
};