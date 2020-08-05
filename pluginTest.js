module.exports = {
	resolveUrl:(url, headers)=>{
		console.log(`Plugin - resolve url: ${url} (${JSON.stringify(headers)})`);
		return url;
	},
	preprocessData:(data, headers, url)=>{
		console.log(`Plugin - preprocessData url: ${url}  (${JSON.stringify(headers)})`);
		return {data, headers};
	}
};