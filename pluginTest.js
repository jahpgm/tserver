const paths = require("path");

module.exports = {
	resolveUrl:(srvPath, headers)=>{
		console.log(`Plugin - resolve srvPath: ${srvPath} (${JSON.stringify(headers)})`);
		return srvPath;
	},
	preprocessData:(data, headers, filePath, srvPath, origSrvPath)=>{
		console.log(`Plugin - preprocessData filePath: ${filePath},  srvPath: ${srvPath}(${JSON.stringify(headers)})`);
		return {data, headers};
	}
};