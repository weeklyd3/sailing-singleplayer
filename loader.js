const BOX_SIZE = 1000;
const MAP_START = [100000, 100000];
const { log } = require('./logger');
const { serialize, deserialize } = require('bson');
const md5 = require('md5');
function getZoneOfCoordinate(x, y) {
	var xzone = Math.floor(x / BOX_SIZE);
	var yzone = Math.floor(y / BOX_SIZE);
	return btoa(xzone + '|' + yzone);
}
function getZoneBounds(x, y) {
	var xzone = Math.floor(x / BOX_SIZE);
	var yzone = Math.floor(y / BOX_SIZE);
	return {
		x: [xzone * BOX_SIZE, xzone * BOX_SIZE + BOX_SIZE],
		y: [yzone * BOX_SIZE, yzone * BOX_SIZE + BOX_SIZE]
	}
}
function cacheObjects(logThis = true) {
	loadCache.clear();
	function internalLog(...args) {
		if (!logThis) return;
		log(...args);
	}
	internalLog('Regenerating cache');
	if (existsSync('cachedObjects')) {
		internalLog('Cache dir exists');
		rmSync('cachedObjects', { recursive: true, force: true });
		internalLog('Deleted', 1);
	}
	internalLog('Writing last modified...');
	mkdirSync('cachedObjects');
	writeFileSync('cachedObjects/LAST_UPDATED', String(Date.now()));
	internalLog('Wrote last modified!', 1);
	internalLog('Reading world.json');
	const world = JSON.parse(readFileSync('world.json'));
	internalLog(`Finished reading it! It has ${world.objects.length} objects.`, 1);
	const zones = new Map();
	var done = 0;
	for (const object of world.objects) {
		var stats = {angle: 0};
		for (const stat in stats) {
			if (!object.hasOwnProperty(stat)) object[stat] = stats[stat];
		}
		internalLog(`Done: ${done}\r`, 1);
		const zoneid = getZoneOfCoordinate(object.x, object.y);
		const bounds = getZoneBounds(object.x, object.y);
		if (!zones.get(zoneid)) zones.set(zoneid, {
			boundX: bounds.x,
			boundY: bounds.y,
			size: BOX_SIZE,
			id: zoneid,
			objects: []
		});
		zones.get(zoneid).objects.push({
			...object,
			id: md5(serialize(object)),
			zone: zoneid
		});
		done++;
	}
	internalLog(`\nProcessed all objects, writing...`, 1);
	mkdirSync('cachedObjects/objects');
	for (const key of zones.keys()) {
		var filename = `cachedObjects/objects/${key}.bin`;
		writeFileSync(filename, serialize(zones.get(key)));
	}
	internalLog('Done', 1);
}
const { 
	existsSync,
	readFileSync,
	statSync,
	writeFileSync,
	rmSync,
	mkdirSync 
} = require('fs');
function shouldInvalidateCache() {
	if (!existsSync('cachedObjects')) return true;
	const cacheCreated = Number(readFileSync('cachedObjects/LAST_UPDATED'));
	const stat = statSync('world.json');
	const lastModified = new Date(stat.mtime);
	const lastModifiedUnix = lastModified.getTime();
	return lastModifiedUnix > cacheCreated;
}
const loadCache = new Map();
function load(zone) {
	if (loadCache.get(zone)) return loadCache.get(zone);
	if (!existsSync(`cachedObjects/objects/${zone}.bin`)) return {id: zone, none: true};
	const parsed = deserialize(readFileSync(`cachedObjects/objects/${zone}.bin`));
	loadCache.set(zone, parsed);
	return parsed;
}
module.exports = {getZoneOfCoordinate, cacheObjects, shouldInvalidateCache, load, cacheObjects};