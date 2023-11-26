const bundle = await require('../objectBundle.js');
class gameInfo {
	constructor(game) {
		this.game = game;
		this.paused = false;
		this.objects = [];
		this.loadedZones = [];
		this.loadingZones = [];
		this.objects = bundle.startingObjects;
		this.loadedZones = bundle.loadedAreas;
		this.objectData = bundle.objectData;
		socket.on('objects load', this.gotObjects.bind(this));
		setTimeout(this.loadObjectImages.bind(this), 1);
	}
	loadObjectImages() {
		console.log(this.game);
		for (const o in this.objectData) {
			var imgurl = this.objectData[o].imageData;
			this.objectData[o].image = this.game.canvas.loadImage(imgurl);
		}
	}
	gotObjects(objects) {
		for (const pkg of objects) {
			if (this.loadingZones.indexOf(pkg.id) != -1) {
				this.loadingZones.splice(this.loadingZones.indexOf(pkg.id), 1);
			}
			this.loadedZones.push(pkg.id);
			if (pkg.none) continue;
			this.objects.push(...pkg.objects);
		}
	}
	toZone(x, y) {
		var components = [
			Math.floor(x / 1000),
			Math.floor(y / 1000)
		];
		return btoa(components.join('|'));
	}
	loadAndUnload(currentZone) {
		const zoneInfo = this.parseZone(currentZone);
		const unloadZones = [];
		this.objects = this.objects.filter((o) => {
			if (unloadZones.indexOf(o.zone) != -1) return false;
			if (this.loadedZones.indexOf(o.zone) == -1) this.loadedZones.push(o.zone);
			const zone = this.parseZone(o.zone);
			const xdiff = Math.abs(zone[0] - zoneInfo[0]);
			const ydiff = Math.abs(zone[1] - zoneInfo[1]);
			const UNLOAD_RADIUS = 4;
			if (xdiff > UNLOAD_RADIUS || ydiff > UNLOAD_RADIUS) {
				unloadZones.push(o.zone);
				return false;
			}
			return true;
		});
		for (const z of unloadZones) {
			if (this.loadedZones.indexOf(z) != -1) {
				this.loadedZones.splice(this.loadedZones.indexOf(z), 1);
			}
		}
		const zonesToCheckLoading = [];
		for (var i = -3; i < 4; i++) {
			for (var j = -3; j < 4; j++) {
				var newZone = [
					zoneInfo[0] * 1000 + i * 1000,
					zoneInfo[1] * 1000 + j * 1000
				];
				zonesToCheckLoading.push(newZone);
			}
		}
		const toLoad = [];
		for (const z of zonesToCheckLoading) {
			if ([
				...this.loadedZones,
				...this.loadingZones
			].indexOf(this.toZone(...z)) === -1) {
				toLoad.push(this.toZone(...z));
			}
		}
		this.loadZones(...toLoad);
	}
	loadZones(...z) {
		this.loadingZones.push(...z);
		socket.emit('objects load', z);
	}
	parseZone(zoneString) {
		const zoneInfo = atob(zoneString).split('|');
		return [Number(zoneInfo[0]), Number(zoneInfo[1])];
	}
}
module.exports = gameInfo;