class drawing {
	constructor(canvas, game) {
		this.canvas = canvas;
		this.game = game;
		this.fcount = 0;
	}
	movePointAtAngle(point, angle, distance) {
		angle = angle * (Math.PI / 180);
		return [
			point[0] + (Math.sin(angle) * distance),
			point[1] - (Math.cos(angle) * distance)
		];
	}
	normalizeAngle(angle) {
		if (angle < 0) {
			while (angle < 0) angle += 360;
		}
		return angle % 360;
	}
	shortcuts() {
		this.fcount++;
		if (this.canvas.keyIsDown(37)) this.game.ship.turn(this.game.ship.angle - this.game.ship.turningSpeed);
		if (this.canvas.keyIsDown(39)) this.game.ship.turn(this.game.ship.angle + this.game.ship.turningSpeed);
		var speedChange = 0;
		if (this.canvas.keyIsDown(38)) speedChange = 1;
		if (this.canvas.keyIsDown(40)) speedChange = -3;
		if (this.canvas.keyIsDown(61)) this.game.scale *= 1.01;
		if (this.canvas.keyIsDown(173)) this.game.scale *= 0.99;
		this.game.ship.currentSpeed += speedChange * 0.1;
		if (this.game.ship.currentSpeed < 0) this.game.ship.currentSpeed = 0;
		if (this.game.ship.currentSpeed > this.game.ship.maxSpeed) this.game.ship.currentSpeed = this.game.ship.maxSpeed;

		if (!(this.fcount % 90)) this.game.gameInfo.loadAndUnload(this.game.gameInfo.toZone(this.game.ship.x, this.game.ship.y));
	}
	drawBackgroundAndShip() {
		this.shortcuts();
		var skyblue = [135, 206, 235];
		var blue = [0, 255, 255];
		var changeBlue = 1 - Math.abs(this.game.ship.y) / 40000;
		if (changeBlue < 0.1) changeBlue = 0.1;
		this.canvas.fill([135 * changeBlue, 206 + 49 * changeBlue, 255 - 20 * changeBlue]);
		this.canvas.rect(0, 0, this.canvas.width, this.canvas.height);
		this.canvas.textAlign('left', 'top');
		this.canvas.fill('black');
		this.canvas.text(`[${this.game.ship.x.toFixed(2)}, ${this.game.ship.y.toFixed(2)}]\nSpeed: ${this.game.ship.currentSpeed}\n${ssi.id ? `${ssi.callsign} #${ssi.id}` : ''}`, 0, 0);
		this.drawObjects();
		for (const f of Object.values(this.game.shipCache)) f.draw(this.game.ship.x, this.game.ship.y, this.canvas, this.game.scale, false);
		if (this.game.ship) this.game.ship.draw(this.game.ship.x, this.game.ship.y, this.canvas, this.game.scale, true, true);
	}
	drawObjects() {
		for (const object of this.game.gameInfo.objects) {
			this.drawObject(this.game.ship.x, this.game.ship.y, object);
		}
	}
	drawObject(cx, cy, object) {
		var scale = this.game.scale;
		var canvas = this.canvas;
		canvas.push();
		canvas.translate(
			(object.x + object.width / 2 - cx) * scale + canvas.width / 2,
			(object.y + object.height / 2 - cy) * scale + canvas.height / 2
		);
		canvas.rotate(object.angle);
		var image = this.game.gameInfo.objectData[object.type].image;
		if (!image) return;
		canvas.image(image, -object.width / 2 * scale, -object.height / 2 * scale, object.width * scale, object.height * scale);
		canvas.pop();
	}
}
module.exports = drawing;