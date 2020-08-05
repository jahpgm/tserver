module.exports = {
	resolveUrl:(url, headers)=>{
		console.log(`resolve url: ${url} (${headers})`);
		return url;
	},
	preprocessData:(data, headers, url)=>{
		console.log(`preprocessData url: ${url} (${headers})`);
		return {data, headers};
	}
};