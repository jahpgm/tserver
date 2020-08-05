const paths = require("path");

module.exports = {
	resolveUrl:(filePath, srvPath, headers)=>{
		console.log(`Plugin - resolve srvPath: ${srvPath} (${JSON.stringify(headers)})`);
		return filePath;
	},
	preprocessData:(data, headers, filePath, srvPath)=>{
		console.log(`Plugin - preprocessData filePath: ${filePath},  srvPath: ${srvPath}(${JSON.stringify(headers)})`);
		return {data, headers};
	}
};