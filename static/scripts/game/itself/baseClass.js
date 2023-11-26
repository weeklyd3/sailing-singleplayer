var gameInfo = await require('scripts/game/itself/gameInfo.js');
var drawing = await require('scripts/game/itself/drawing.js');
var objects = await require('scripts/game/other-classes/object.js');
class game {
	canvasInfo = {width: null, height: null};
	canvas = null;
	scale = 0.4;
	shipCache = {};
	commands = {};
	constructor(width = 640, height = 480) {
		this.target = [10000, -1000];
		this.canvasInfo.width = width;
		this.canvasInfo.height = height;
		this.gameInfo = new gameInfo(this);
		var s = function(sketch) {
			sketch.setup = function() {
				sketch.createCanvas(width, height);
			}
		}
		var draw = new p5(s, 'pad');
		this.canvas = draw;
		this.canvas.angleMode(this.canvas.DEGREES);
		this.drawing = new drawing(this.canvas, this);
		this.updateLoop();
		this.updateCallbacks = [];
		this.shipimg = draw.loadImage("images/ship.svg");
		this.ship = new objects.ship(75, 320, 0, this.shipimg, 9);
		this.commands.turn = {
			description: 'Turns the ship to a specified heading. Type the heading after the `turn` command.',
			execute: function(interaction) {
				var num = Number(interaction.args);
				if (num != num) return interaction.reply(`invalid number ${interaction.args}`);
				this.ship.turn(num);
				interaction.reply(`turning to ${num} degrees (current heading is ${this.ship.angle} degrees)`);
			}
		}
		this.commands.getpos = {
			description: 'Returns the current position.',
			execute: function(interaction) {
				interaction.reply(`Angle: ${this.ship.angle}\nPosition: [${this.ship.x.toFixed(2)}, ${this.ship.y.toFixed(2)}]`);
			}
		}
		this.commands.trial = {
			description: 'Toggle showing the future path for the next few seconds.',
			execute: function(interaction) {
				this.ship.printTrial = !this.ship.printTrial;
				interaction.reply(`Trial is now ${this.ship.printTrial ? 'en' : 'dis'}abled.`);
			}
		}
	}
	changeShip(fname) {
		this.canvas.loadImage(`images/${fname}.svg`, this.ship.change.bind(this.ship));
	}
	updateLoop(fps = 30) {
		return setInterval(this.updateCanvas.bind(this), fps);
	}
	updateCanvas() {
		if (!this.canvas) return console.log(`canvas not loaded`);
		for (const cb of this.updateCallbacks) cb();
		for (const ship of Object.values(ssi.foreignShips)) {
			if (this.shipCache[ship.id]) continue;
			this.shipCache[ship.id] = new objects.ship(75, 350, 0, this.shipimg, 5, ship.x, ship.y);
			this.shipCache[ship.id].targetAngle = ship.angle;
			this.shipCache[ship.id].angle = ship.angle;
		}
		this.canvas.clear();
		this.drawing.drawBackgroundAndShip();
	}
	execCommand(command) {
		var cmdname = command.split(' ')[0];
		this.log(`exec: ${command}`, 'cmd');
		function commandReply(reply) {
			this.log(reply, 'console');
		}
		if (!this.commands[cmdname]) {
			commandReply.bind(this)(`no such commmand: ${cmdname}`);
			return;
		}
		var execute = this.commands[cmdname].execute;
		execute.bind(this)({reply: commandReply.bind(this), args: command.split(' ').slice(1).join(' ')});
	}
	log(message, internal = 'log') {
		chatReceiver({
			callsign: 'NULL',
			data: message,
			internal: internal
		});
	}
}
module.exports = game;