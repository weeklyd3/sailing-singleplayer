const colors = require('colors');
const logColors = [
	['INFO', 0],
	[' OK ', 'green'],
	['WARN', 'yellow'],
	['ERR!', 'red']
];
function log(message, level = 'INFO') {
	if (logColors[level]) level = logColors[level];
	else {
		var found = false;
		for (const le of logColors) {
			if (le[0].trim().toLowerCase() == level.toLowerCase()) {
				found = true;
				level = le;
				break;
			}
		}
		if (!found) {
			log(`Bad log level ${level}`, 'WARN');
			level = logColors[0];
		}
	}
	const output = `[ ${level[0]} ] ${message}`;
	console.log(level[1] ? output[level[1]] : output);
}
module.exports = {log, logColors};