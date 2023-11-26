const socket = io();
const ssi = {};
ssi.foreignShips = {};
socket.on('id-reveal', (id) => {
	console.log('got id!');
	ssi['id'] = id.id;
	ssi['callsign'] = id.callsign;
});
socket.on('ship get', (ships) => {
	console.log('other ships loaded!');
	ssi.foreignShips = ships;
})
socket.on('ship join', (ship) => {
	ssi.foreignShips[ship.id] = ship;
});
function chatReceiver(interaction) {
	console.log(interaction);
	const msg = document.createElement('div');
	msg.style.whiteSpace = 'pre-wrap';
	const whoDidIt = document.createElement('strong');
	if (interaction.internal) {
		interaction.callsign = ssi.callsign;
		interaction.callsign += ` [${interaction.internal}]`;
	}
	whoDidIt.textContent = interaction.callsign + ':';
	whoDidIt.innerHTML += '&nbsp;';
	msg.appendChild(whoDidIt);
	msg.appendChild(document.createTextNode(interaction.data));
	if (interaction.sentTo != undefined) {
		var sentTo = document.createElement('small');
		sentTo.style.display = 'block';
		sentTo.style.color = 'darkgray';
		sentTo.textContent = `sent to ${interaction.sentTo} other players`;
		msg.appendChild(sentTo);
	}
	if (interaction.locationData) {
		var ldata = document.createElement('small');
		ldata.style.display = 'block';
		ldata.textContent = `Last known position: [${interaction.locationData.x.toFixed(2)}, ${interaction.locationData.y.toFixed(2)}], angle: ${interaction.locationData.angle}`;
		msg.appendChild(ldata);
	}
	if (interaction.isCall) msg.style.color = 'red';
	if (interaction.internal) msg.style.color = 'blue';
	document.querySelector('.chat .container').appendChild(msg);
}
socket.on('chat message', chatReceiver);
socket.on('ship change', (interaction) => {
	console.log(`position change for id ${interaction.id}`);
	if (typeof currentGame == 'undefined') return;
	ssi.foreignShips[interaction.id] = {...ssi.foreignShips[interaction.id], ...interaction.ship};
	const toChange = currentGame.shipCache[interaction.id];
	if (!toChange) return console.log('thaas strange');
	toChange.x = interaction.ship.x;
	toChange.y = interaction.ship.y;
	toChange.currentSpeed = interaction.ship.currentSpeed;
})
socket.on('angle change', (interaction) => {
	if (typeof currentGame == 'undefined') return;
	ssi.foreignShips[interaction.id].angle = interaction.angle;
	currentGame.shipCache[interaction.id].targetAngle = interaction.angle;
	currentGame.shipCache[interaction.id].angle = interaction.angle;
})
socket.emit('ship request');