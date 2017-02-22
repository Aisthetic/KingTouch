var getMapPoint = require("./pathfinding.js").getMapPoint;

/**Returns shape of selected spellLevel...
* @param  {number} source - source Cllid
* @param  {object} spellLevel - level data
*/
exports.getSpellRange = function(source, spell) {
	var coords = getMapPoint(source);

	var rangeCoords;

	if (spell.castInLine && spell.castInDiagonal) {
		rangeCoords = shapeCross(coords.x, coords.y, spell.minRange, spell.range)
			.concat(shapeStar(coords.x, coords.y, spell.minRange, spell.range));
	} else if (spell.castInLine) {
		rangeCoords = shapeCross(coords.x, coords.y, spell.minRange, spell.range);
	} else if (spell.castInDiagonal) {
		rangeCoords = shapeStar(coords.x, coords.y, spell.minRange, spell.range);
	} else {
		rangeCoords = shapeRing(coords.x, coords.y, spell.minRange, spell.range);
	}

	return rangeCoords;
};
/** Returns the range of a ring shaped area.
 *  cell in result range are ordered by distance to the center, ascending.
 *
 * @param {number} x - x coordinate of center
 * @param {number} y - y coordinate of center
 * @param {number} radiusMin - radius of inner limit of ring
 * @param {number} radiusMax - radius of outter limit of ring
 *
 * @return {Array} range - an array of point coordinate.
 */
exports.shapeRing = shapeRing;
function shapeRing(x, y, radiusMin, radiusMax) { //TODO: appears to return duplicates, investigate.
	var range = [];
	if (radiusMin === 0) { range.push([x, y, 0]); }
	for (var radius = radiusMin || 1; radius <= radiusMax; radius++) {
		for (var i = 0; i < radius; i++) {
			var r = radius - i;
			range.push([x + i, y - r, radius]);
			range.push([x + r, y + i, radius]);
			range.push([x - i, y + r, radius]);
			range.push([x - r, y - i, radius]);
		}
	}
	return range;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Returns the range of a cross shaped area.
 *  cell in result range are ordered by distance to the center, ascending.
 *
 * @param {number} x - x coordinate of center
 * @param {number} y - y coordinate of center
 * @param {number} radiusMin - inner radius of area
 * @param {number} radiusMax - outter radius of area
 *
 * @return {number[]} range - an array of point coordinate.
 */
function shapeCross(x, y, radiusMin, radiusMax) {
	var range = [];
	if (radiusMin === 0) { range.push([x, y, 0]); }
	for (var i = radiusMin || 1; i <= radiusMax; i++) {
		range.push([x - i, y, i]);
		range.push([x + i, y, i]);
		range.push([x, y - i, i]);
		range.push([x, y + i, i]);
	}
	return range;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Returns the range of a star shaped area. */
function shapeStar(x, y, radiusMin, radiusMax) {
	var range = [];
	if (radiusMin === 0) { range.push([x, y, 0]); }
	for (var i = radiusMin || 1; i <= radiusMax; i++) {
		range.push([x - i, y - i, i]);
		range.push([x - i, y + i, i]);
		range.push([x + i, y - i, i]);
		range.push([x + i, y + i, i]);
	}
	return range;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Combinaison of shapeCross and shapeStar */
function shapeCrossAndStar(x, y, radiusMin, radiusMax) {
	var range = [];
	if (radiusMin === 0) { range.push([x, y, 0]); }
	for (var i = radiusMin || 1; i <= radiusMax; i++) {
		// cross
		range.push([x - i, y, i]);
		range.push([x + i, y, i]);
		range.push([x, y - i, i]);
		range.push([x, y + i, i]);
		// star
		range.push([x - i, y - i, i]);
		range.push([x - i, y + i, i]);
		range.push([x + i, y - i, i]);
		range.push([x + i, y + i, i]);
	}
	return range;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Returns the range of a square shaped area. */
function shapeSquare(x, y, radiusMin, radiusMax) {
	var range = [];
	if (radiusMin === 0) { range.push([x, y, 0]); }
	for (var radius = radiusMin || 1; radius <= radiusMax; radius++) {
		// segment middles
		range.push([x - radius, y, radius]);
		range.push([x + radius, y, radius]);
		range.push([x, y - radius, radius]);
		range.push([x, y + radius, radius]);
		// segment corners
		range.push([x - radius, y - radius, radius]);
		range.push([x - radius, y + radius, radius]);
		range.push([x + radius, y - radius, radius]);
		range.push([x + radius, y + radius, radius]);
		// segment remaining
		for (var i = 1; i < radius; i++) {
			range.push([x + radius, y + i, radius]);
			range.push([x + radius, y - i, radius]);
			range.push([x - radius, y + i, radius]);
			range.push([x - radius, y - i, radius]);
			range.push([x + i, y + radius, radius]);
			range.push([x - i, y + radius, radius]);
			range.push([x + i, y - radius, radius]);
			range.push([x - i, y - radius, radius]);
		}
	}
	return range;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Return the range of a cone shaped area (effect type 'V') */
function shapeCone(x, y, radiusMin, radiusMax, dirX, dirY) {
	var range = [];
	for (var radius = radiusMin; radius <= radiusMax; radius++) {
		var xx = x + radius * dirX;
		var yy = y + radius * dirY;
		range.push([xx, yy, radius]);
		for (var i = 1; i <= radius; i++) {
			range.push([xx + i * dirY, yy - i * dirX, radius]);
			range.push([xx - i * dirY, yy + i * dirX, radius]);
		}
	}
	return range;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Return the range of a halfcircle shaped area (effect type 'U') */
function shapeHalfcircle(x, y, radiusMin, radiusMax, dirX, dirY) {
	var range = [];
	if (radiusMin === 0) { range.push([x, y, 0]); }
	for (var radius = radiusMin || 1; radius <= radiusMax; radius++) {
		var xx = x - radius * dirX;
		var yy = y - radius * dirY;
		range.push([xx + radius * dirY, yy - radius * dirX, radius]);
		range.push([xx - radius * dirY, yy + radius * dirX, radius]);
	}
	return range;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Returns the range of a four cones shaped area (effect type 'W')
 *  The shape is basicaly a square without the diagonals and central point.
 */
function shapeCones(x, y, radiusMin, radiusMax) {
	var range = [];
	for (var radius = radiusMin || 1; radius <= radiusMax; radius++) {
		// segment middles
		range.push([x - radius, y, radius]);
		range.push([x + radius, y, radius]);
		range.push([x, y - radius, radius]);
		range.push([x, y + radius, radius]);
		// segment remaining
		for (var i = 1; i < radius; i++) {
			range.push([x + radius, y + i, radius]);
			range.push([x + radius, y - i, radius]);
			range.push([x - radius, y + i, radius]);
			range.push([x - radius, y - i, radius]);
			range.push([x + i, y + radius, radius]);
			range.push([x - i, y + radius, radius]);
			range.push([x + i, y - radius, radius]);
			range.push([x - i, y - radius, radius]);
		}
	}
	return range;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Returns the range of a inline segment shaped area. */
function shapeLine(x, y, radiusMin, radiusMax, dirX, dirY) {
	var range = [];
	for (var i = radiusMin; i <= radiusMax; i++) {
		range.push([x + dirX * i, y + dirY * i, i]);
	}
	return range;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Return the range of a circle perimeter area (effect type 'O')
 *  The function is based on shapeRing, replacing the radiusMin by radiusMax.
 */
function shapeCirclePerimeter(x, y, radiusMin, radiusMax) {
	return shapeRing(x, y, radiusMax, radiusMax);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Return the range of a inverted circle area (effect type 'I')
 *  The function is based on shapeRing, going from radiusMax to Infinity.
 *
 *  TODO: Algorithm could be optimized. This one add a lot of invalid cells.
 */
function shapeInvertedCircle(x, y, radiusMin, radiusMax) {
	return shapeRing(x, y, radiusMax, INFINITE_RANGE);
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Return the range of a perpendicular segment shaped area (effect type '-' and 'T') */
function shapePerpendicular(x, y, radiusMin, radiusMax, dirX, dirY) {
	var range = [];
	if (radiusMin === 0) { range.push([x, y, 0]); }
	for (var i = radiusMin || 1; i <= radiusMax; i++) {
		range.push([x + dirY * i, y - dirX * i, i]);
		range.push([x - dirY * i, y + dirX * i, i]);
	}
	return range;
}
