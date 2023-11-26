class gameObject {
	constructor(x, y, width, height, type, image, speed,) {
		this.x = x;
		this.y = y;
		this.type = type;
		this.image = image;
		this.angle = 0;
		this.speed = speed;
		this.width = width;
		this.height = height;
	}
	particles = [];
	movePointAtAngle(point, angle, distance) {
		angle = angle * (Math.PI / 180);
		return [
			point[0] + (Math.sin(angle) * distance),
			point[1] - (Math.cos(angle) * distance)
		];
	}
}
class ship extends gameObject {
	fcount = 0;
	constructor(w, h, speed, image, maxspeed, x = 0, y = 0) {
		super(x, y, w, h, 'ship', image, speed);
		this.turningSpeed = 0.5;
		this.targetAngle = 0;
		this.currentSpeed = 0;
		this.maxSpeed = maxspeed;
		this.printTrial = false;
	}
	normalizeAngle(angle) {
		while (angle < 0) angle += 360;
		while (angle >= 360) angle -= 360;
		return angle;
	}
	turn(angle) {
		this.targetAngle = angle;
	}
	drawParticles(cx, cy, canvas, scale) {
		canvas.push();
		canvas.fill('red');
		canvas.circle(-cx * scale + canvas.width / 2, -cy * scale + canvas.height / 2, 10);
		canvas.strokeWeight(0);
		this.particles = this.particles.filter((part) => {
			canvas.push();
			part.o--;
			var newcoord = this.movePointAtAngle([part.x, part.y], part.angle, -part.spd);
			part.x = newcoord[0];
			part.y = newcoord[1];
			canvas.fill(canvas.color(0, 0, 255, part.o / 100 * 255));
			canvas.circle((part.x - cx) * scale + canvas.width / 2, (part.y - cy) * scale + canvas.height / 2, part.r * scale);
			canvas.pop();
			return part.o > 0;
		});
		canvas.pop();
	}
	draw(cx, cy, canvas, scale, particles = true, isMe = false) {
		canvas.push();
		canvas.fill('red');
		if (this.printTrial) {
			const trial = this.trial(2400, 10);
			var previous = [canvas.width / 2, canvas.height / 2];
			var i = -1;
			for (const point of trial) {
				i++;
				const current = [(point.x - cx) * scale + canvas.width / 2,
				(point.y - cy) * scale + canvas.height / 2];
				canvas.stroke('red');
				canvas.strokeWeight(5);
				canvas.line(...previous, ...current);
				if (i && !((i + 1) % 39)) {
					canvas.push();
					canvas.translate(current[0], current[1]);
					canvas.rotate(point.angle);
					canvas.canvas.getContext('2d').globalAlpha = 0.8;
					canvas.image(this.image, -this.width * scale / 2, -this.height * scale / 2, this.width * scale, this.height * scale);
					canvas.canvas.getContext('2d').globalAlpha = 1;
					canvas.pop();
				}
				previous = current;
			}
		}
		canvas.pop();
		this.fcount++;
		if (isMe) {
			if (!(this.fcount % 5)) socket.emit('position change', {x: this.x, y: this.y, speed: this.currentSpeed});
			if (this.angle != this.lastTransmittedAngle || !(this.fcount % 20)) {
				this.lastTransmittedAngle = this.angle;
				socket.emit('angle change', this.angle);
			}
		}
		this.drawParticles(cx, cy, canvas, scale);
		if (this.currentSpeed) {
			var newpos = this.movePointAtAngle([this.x, this.y], this.angle, this.currentSpeed);
			[this.x, this.y] = newpos;
			var head = this.movePointAtAngle([this.x, this.y], this.angle, this.height / 2 + 10);
			for (var i = 0; i < 5; i++) {
				if (!particles) break;
				this.particles.push({
					x: head[0], 
					y: head[1], 
					r: 5,
					o: 100, 
					angle: this.angle - Math.random() * 20, 
					spd: 5
				}, {x: head[0], y: head[1], r: 5, o: 100, angle: this.angle + Math.random() * 20, spd: 5});
			}
		}
		this.angle += 360;
		this.angle = this.angle % 360;
		if (this.angle == 360) this.angle = 0;
		if (this.angle != this.targetAngle) {
			var dir = 0;
			const currentAngle = this.angle;
			const target = this.targetAngle;
			if (currentAngle < target) dir = (Math.abs(target - currentAngle) < 180 ? 1 : -1);
			else dir = (Math.abs(target - currentAngle) < 180 ? -1 : 1);
			this.angle += this.turningSpeed * dir;
			if (this.angle < 0) this.angle += 360;
			this.angle = this.angle % 360;
			if (Math.abs(this.angle - this.targetAngle) <= this.turningSpeed) this.angle = this.targetAngle;
		}
		canvas.push();
		canvas.translate((this.x - cx) * scale + canvas.width / 2, (this.y - cy) * scale + canvas.height / 2);
		canvas.rotate(this.angle);
		const shipWidth = this.width * scale;
		const shipHeight = this.height * scale;
		canvas.image(this.image, -shipWidth / 2, -shipHeight / 2, shipWidth, shipHeight);
		canvas.pop();
	}
	change(img) {
		this.image = img;
		this.width = img.width;
		this.height = img.height;
	}
	trial(framesAhead = 90, majorFrames = 2) {
		const trialShip = {
			x: this.x,
			y: this.y,
			speed: this.currentSpeed,
			angle: this.angle,
			targetAngle: this.targetAngle,
			turningSpeed: this.turningSpeed
		};
		const results = [];
		for (var i = 0; i < framesAhead; i++) {
			var dir;
			if (trialShip.angle != trialShip.targetAngle) {
				var dir = 0;
				const currentAngle = trialShip.angle;
				const target = trialShip.targetAngle;
				if (currentAngle < target) dir = (Math.abs(target - currentAngle) < 180 ? 1 : -1);
				else dir = (Math.abs(target - currentAngle) < 180 ? -1 : 1);
				trialShip.angle += trialShip.turningSpeed * dir;
				if (this.angle < 0) trialShip.angle += 360;
				trialShip.angle = trialShip.angle % 360;
				if (Math.abs(trialShip.angle - trialShip.targetAngle) <= trialShip.turningSpeed) trialShip.angle = trialShip.targetAngle;
			}
			var newpos = this.movePointAtAngle([trialShip.x, trialShip.y], trialShip.angle, trialShip.speed);
			[trialShip.x, trialShip.y] = newpos;
			if (!(i % majorFrames)) results.push({...trialShip});
		}
		return results;
	}
}
module.exports = {gameObject, ship};