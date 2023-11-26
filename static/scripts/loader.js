async function require(url) {
	console.group(`REQUIRE ${url}`);
	var f = await fetch(url);
	var text = await f.text();
	console.log(`loaded URL`);
	var AsyncFunction = (async function() {}).constructor;
	var loader = new AsyncFunction('module', 'require', text);
	var returnValue = {exports: null};
	console.log(`executing loader...`);
	await loader(returnValue, require);
	console.groupEnd();
	return returnValue.exports;
}