const express = require('express');
const app = express();
const loader = require('./loader');
const fs = require('fs');
if (loader.shouldInvalidateCache()) loader.cacheObjects();
app.use(express.static('./static'));
const { log } = require('./logger');
fs.watchFile('world.json', () => {
	loader.cacheObjects();
});
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/static/index.html');
});
objectInfoBundle = '';
const objectTypes = JSON.parse(fs.readFileSync('objectTypes.json'));
for (const k in objectTypes) {
	var defaultType = {
		tileMode: 'stretch',
		image: k + '.svg',
	};
	for (const tk in defaultType) {
		if (!objectTypes[k].hasOwnProperty(tk)) objectTypes[k][tk] = defaultType[tk];
	}
	const contents = fs.readFileSync(`static/images/objects/${objectTypes[k].image}`);
	objectTypes[k].imageData = `data:image/svg+xml;base64,${encodeURIComponent(btoa(contents))}`;
}
objectInfoBundle = `const objectData = ${JSON.stringify(objectTypes, null, 4)}`;
app.get('/objectBundle.js', function(req, res) {
	var output = `// Generated to have all starting objects.\nvar startingObjects = `;
	const result = [];
	const areas = [];
	for (var i = -3; i < 4; i++) {
		for (var j = -3; j < 4; j++) {
			const zoneId = btoa(i + '|' + j);
			var r = loader.load(zoneId);
			areas.push(btoa(i + '|' + j));
			if (r.none) continue;
			result.push(...r.objects);
		}
	}
	output += JSON.stringify(result, null, 4) + ';\n';
	output += `var loadedAreas = `;
	output += JSON.stringify(areas, null, 4) + ';\n';
	output += objectInfoBundle + ';\n';
	output += `module.exports = {loadedAreas, startingObjects, objectData}`;
	res.type('.js');
	res.send(output);
})
app.get('/objects/:coord', function(req, res) {
  res.type('json');
  const obj = {};
  obj.query = req.params.coord;
  res.send(JSON.stringify(obj));
})

const { Server } = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = new Server(server);
const ships = {};
const shipSockets = {};
var currentId = 1;
function randomLetter() {
	return 'ASDFGHJKLZXCVBNMQWERTYUIOP'[Math.floor(Math.random() * 26)];
}
io.on('connection', (socket) => {
	var shipid = String(Math.round(Date.now() / 1000) % 10000000) + String(currentId++ % 10000);
	ships[shipid] = {x: 0, y: 0, angle: 0, particles: [], callsign: randomLetter() + randomLetter() + randomLetter(), id: shipid, speed: 0};
	shipSockets[shipid] = socket;
	socket.emit('id-reveal', {id: shipid, callsign: ships[shipid].callsign});
	log(`${ships[shipid].callsign} #${shipid} joined`);
	socket.on('angle change', (newang) => {
		ships[shipid].angle = newang;
	})
	socket.on('objects load', (zones) => {
		if (!zones.length) return;
		const result = [];
		for (const z of zones) result.push(loader.load(z));
		log(`Loaded ${result.length} zones:`, 1);
		log(zones, 1);
		socket.emit('objects load', result);
	})
	socket.on('disconnect', () => {
		log(`${ships[shipid].callsign} #${shipid} left`);
		delete ships[shipid];
	});
});

// listen for requests :)
const listener = server.listen(4000, function() {
  log('Your app is listening on port ' + listener.address().port, 1);
});