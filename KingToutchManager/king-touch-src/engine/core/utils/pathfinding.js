function getMapPoint(cellId) {
	var row = cellId % 14 - ~~(cellId / 28);
	var x = row + 19;
	var y = row + ~~(cellId / 14);
	return { x: x, y: y };
}
exports.getMapPoint=getMapPoint;
exports.getCellId=getCellId;
var mapPointToCellId = {};
function constructMapPoints() {
	for (var cellId = 0; cellId < 560; cellId++) {
		var coord = getMapPoint(cellId);
		mapPointToCellId[coord.x + '_' + coord.y] = cellId;
	}
}
function getCellId(x, y) {
	var cellId = mapPointToCellId[x + '_' + y];
	return cellId;
}
constructMapPoints();

var OCCUPIED_CELL_WEIGHT = 10;

// Corresponds to 11 * 43 / 40 = 11.825
// Where 11 is the elevation tolerance in the original dofus game
// Where 40 is the height of a cell in the original dofus game (with respect to DataMapProvider.as file)
// Where 43 is the height of a cell in our dofus version
var ELEVATION_TOLERANCE = 11.825;

var WIDTH  = 33 + 2;
var HEIGHT = 34 + 2;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function CellPathData(i, j) {
	this.i = i;
	this.j = j;

	this.floor = -1;
	this.zone  = -1;
	this.speed =  1;

	this.weight = 0;
	this.candidateRef = null;
}

// Initialization of the grid
var grid = [];
for (var i = 0; i < WIDTH; i += 1) {
	var row = [];
	for (var j = 0; j < HEIGHT; j += 1) {
		row[j] = new CellPathData(i, j);
	}
	grid[i] = row;
}

// Whether the current map is using the old movement system
// In the old system cell heights are disregarded
var oldMovementSystem;
var firstCellZone;

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function updateCellPath(cell, cellPath) {
	if ((cell !== undefined) && (cell.l & 1)) {
		cellPath.floor = cell.f || 0;
		cellPath.zone  = cell.z || 0;
		cellPath.speed = 1 + (cell.s || 0) / 10;

		if (cellPath.zone !== firstCellZone) {
			oldMovementSystem = false;
		}
	} else {
		cellPath.floor = -1;
		cellPath.zone  = -1;
	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
exports.fillPathGrid = function (map) {
	// TODO: add whether a map uses the old system onto the map data
	// when it is generated on the server side
	// oldMovementSystem = map.usesOldMovementSystem;
	firstCellZone = map.cells[0].z || 0;
	oldMovementSystem = true;

	for (var i = 0; i < WIDTH; i += 1) {
		var row = grid[i];
		for (var j = 0; j < HEIGHT; j += 1) {
			var cellId = getCellId(i - 1, j - 1);
			var cellPath = row[j];
			var cell = map.cells[cellId];
			updateCellPath(cell, cellPath);
		}
	}
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**  Update a single cell's path data - used for removable obstacle like in map 67371008 (Rogue's temple) */
exports.updateCellPath = function (cellId, cell) {
	var cellCoordinate = mapPoint.getMapPointFromCellId(cellId);
	var cellPath = grid[cellCoordinate.x + 1][cellCoordinate.y + 1];
	updateCellPath(cell, cellPath);
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function CellPath(i, j, w, d, path) {
	this.i = i; // position i in the grid
	this.j = j; // position j in the grid
	this.w = w; // weight of the path
	this.d = d; // remaining distance to destination

	// positions previously taken in the path
	this.path = path;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function areCommunicating(c1, c2) {
	// Cells are compatible only if they either have the same floor height...
	if (c1.floor === c2.floor) {
		// Same height
		return true;
	}

	// ... or the same zone, different from 0
	// ... or a zone of 0 and a floor difference smaller than ELEVATION_TOLERANCE
	if (c1.zone === c2.zone) {
		return oldMovementSystem || (c1.zone !== 0) || (Math.abs(c1.floor - c2.floor) <= ELEVATION_TOLERANCE);
	}

	return false;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function canMoveDiagonallyTo(c1, c2, c3, c4) {
	// Can move between c1 and c2 diagonally only if c1 and c2 are compatible and if c1 is compatible either with c3 or c4
	return areCommunicating(c1, c2) && (areCommunicating(c1, c3) || areCommunicating(c1, c4));
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function addCandidate(c, w, di, dj, candidates, path) {
	var i = c.i;
	var j = c.j;

	// The total weight of the candidate is the weight of previous path
	// plus its weight (calculated based on occupancy and speed factor)
	var distanceToDestination = Math.sqrt((di - i) * (di - i) + (dj - j) * (dj - j));
	w = w / c.speed + c.weight;

	if (c.candidateRef === null) {
		var candidateRef = new CellPath(i, j, path.w + w, distanceToDestination, path);
		candidates.push(candidateRef);
		c.candidateRef = candidateRef;
	} else {
		var currentWeight = c.candidateRef.w;
		var newWeight = path.w + w;
		if (newWeight < currentWeight) {
			c.candidateRef.w = newWeight;
			c.candidateRef.path = path;
		}
	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
function addCandidates(path, di, dj, candidates, allowDiagonals) {
	var i = path.i;
	var j = path.j;
	var c = grid[i][j];


	// Searching whether adjacent cells can be candidates to lengthen the path

	// Adjacent cells
	var c01 = grid[i - 1][j];
	var c10 = grid[i][j - 1];
	var c12 = grid[i][j + 1];
	var c21 = grid[i + 1][j];

	// weight of path in straight line = 1
	var weightStraight = 1;

	if (areCommunicating(c, c01)) { addCandidate(c01, weightStraight, di, dj, candidates, path); }
	if (areCommunicating(c, c21)) { addCandidate(c21, weightStraight, di, dj, candidates, path); }
	if (areCommunicating(c, c10)) { addCandidate(c10, weightStraight, di, dj, candidates, path); }
	if (areCommunicating(c, c12)) { addCandidate(c12, weightStraight, di, dj, candidates, path); }


	// Searching whether diagonally adjacent cells can be candidates to lengthen the path

	// Diagonally adjacent cells
	var c00 = grid[i - 1][j - 1];
	var c02 = grid[i - 1][j + 1];
	var c20 = grid[i + 1][j - 1];
	var c22 = grid[i + 1][j + 1];

	// weight of path in diagonal = Math.sqrt(2)
	var weightDiagonal = Math.sqrt(2);

	if (allowDiagonals) {
		if (canMoveDiagonallyTo(c, c00, c01, c10)) { addCandidate(c00, weightDiagonal, di, dj, candidates, path); }
		if (canMoveDiagonallyTo(c, c20, c21, c10)) { addCandidate(c20, weightDiagonal, di, dj, candidates, path); }
		if (canMoveDiagonallyTo(c, c02, c01, c12)) { addCandidate(c02, weightDiagonal, di, dj, candidates, path); }
		if (canMoveDiagonallyTo(c, c22, c21, c12)) { addCandidate(c22, weightDiagonal, di, dj, candidates, path); }
	}
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * @method module:pathFinder.getPath
 * @desc Finds the optimal path between 2 points on the map
 *
 * @param {number} source - cellId of source path
 * @param {number} target - cellId of target path
 * @param {Object} occupiedCells - An object containing the cells that are occupied
 * @param {Boolean} [allowDiagonals] - Can path contain diagonal movements. Default is true.
 *
 * @return {Array} An array of cellId for the optimal path to destination or the path
 * that gets closer to destination if none.
 *
 */
exports.getPath = function (source, target, occupiedCells, allowDiagonals, stopNextToTarget) {
	var c, candidate;

	allowDiagonals = allowDiagonals === undefined ? true : !!allowDiagonals;

	var srcPos = getMapPoint(source); // source index
	var dstPos = getMapPoint(target); // destination index

	var si = srcPos.x + 1; // source i
	var sj = srcPos.y + 1; // source j

	var srcCell = grid[si][sj];
	if (srcCell.zone === -1) {
		// Searching for accessible cell around source
		var bestFit       = null;
		var bestDist      = Infinity;
		var bestFloorDiff = Infinity;
		for (var i = -1; i <= 1; i += 1) {
			for (var j = -1; j <= 1; j += 1) {
				if (i === 0 && j === 0) {
					continue;
				}

				var cell = grid[si + i][sj + j];
				if (cell.zone === -1) {
					continue;
				}

				var floorDiff = Math.abs(cell.f - srcCell.f);
				var dist      = Math.abs(i) + Math.abs(j);
				if (bestFit === null || floorDiff < bestFloorDiff || (floorDiff <= bestFloorDiff && dist < bestDist)) {
					bestFit       = cell;
					bestDist      = dist;
					bestFloorDiff = floorDiff;
				}
			}
		}

		if (bestFit !== null) {
			return [source, getCellId(bestFit.i - 1, bestFit.j - 1)];
		}

		console.error(new Error('[pathFinder.getPath] Player is stuck in ' + si + '/' + sj));
		return [source];
	}

	var di = dstPos.x + 1; // destination i
	var dj = dstPos.y + 1; // destination j

	// marking cells as occupied
	var cellPos, cellId;
	for (cellId in occupiedCells) {
		cellPos = getMapPoint(cellId);
		grid[cellPos.x + 1][cellPos.y + 1].weight += OCCUPIED_CELL_WEIGHT;
	}

	var candidates = [];
	var selections = [];

	// First cell in the path
	var distSrcDst = Math.sqrt((si - di) * (si - di) + (sj - dj) * (sj - dj));
	var selection = new CellPath(si, sj, 0, distSrcDst, null);

	// Adding cells to path until destination has been reached
	var reachingPath = null;
	var closestPath = selection;
	while (selection.i !== di || selection.j !== dj) {
		addCandidates(selection, di, dj, candidates, allowDiagonals);

		// Looking for candidate with the smallest additional length to path
		// in O(number of candidates)
		var n = candidates.length;
		if (n === 0) {
			// No possible path
			// returning the closest path to destination
			selection = closestPath;
			break;
		}

		var minPotentialWeight = Infinity;
		var selectionIndex = 0;
		for (c = 0; c < n; c += 1) {
			candidate = candidates[c];
			if (candidate.w + candidate.d < minPotentialWeight) {
				selection = candidate;
				minPotentialWeight = candidate.w + candidate.d;
				selectionIndex = c;
			}
		}

		selections.push(selection);
		candidates.splice(selectionIndex, 1);

		// If stopNextToTarget
		// then when reaching a distance of less than Math.sqrt(2) the destination is considered as reached
		// (the threshold has to be bigger than sqrt(2) but smaller than 2, to be safe we use the value 1.5)
		if (selection.d === 0 || (stopNextToTarget && selection.d < 1.5)) {
			// Selected path reached destination
			if (reachingPath === null || selection.w < reachingPath.w) {
				reachingPath = selection;
				closestPath  = selection;

				// Clearing candidates dominated by current solution to speed up the algorithm
				var trimmedCandidates = [];
				for (c = 0; c < candidates.length; c += 1) {
					candidate = candidates[c];
					if (candidate.w + candidate.d < reachingPath.w) {
						trimmedCandidates.push(candidate);
					} else {
						grid[candidate.i][candidate.j].candidateRef = null;
					}
				}
				candidates = trimmedCandidates;
			}
		} else {
			if (selection.d < closestPath.d) {
				// 'selection' is the new closest path to destination
				closestPath = selection;
			}
		}
	}

	// Removing candidate reference in each cell in selections and active candidates
	for (c = 0; c < candidates.length; c += 1) {
		candidate = candidates[c];
		grid[candidate.i][candidate.j].candidateRef = null;
	}

	for (var s = 0; s < selections.length; s += 1) {
		selection = selections[s];
		grid[selection.i][selection.j].candidateRef = null;
	}

	// Marking cells as unoccupied
	for (cellId in occupiedCells) {
		cellPos = getMapPoint(cellId);
		grid[cellPos.x + 1][cellPos.y + 1].weight -= OCCUPIED_CELL_WEIGHT;
	}

	var shortestPath = [];
	while (closestPath !== null) {
		shortestPath.unshift(getCellId(closestPath.i - 1, closestPath.j - 1));
		closestPath = closestPath.path;
	}

	return shortestPath;
};


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Return adjacent accessible cells
 *
 * @param {Number}  i
 * @param {Number}  j
 */
exports.getAccessibleCells = function (i, j) {
	i += 1;
	j += 1;
	var c = grid[i][j];

	// Adjacent cells
	var c01 = grid[i - 1][j];
	var c10 = grid[i][j - 1];
	var c12 = grid[i][j + 1];
	var c21 = grid[i + 1][j];

	var accessibleCells = [];
	if (areCommunicating(c, c01)) { accessibleCells.push({ i: c01.i - 1, j: c01.j - 1 }); }
	if (areCommunicating(c, c21)) { accessibleCells.push({ i: c21.i - 1, j: c21.j - 1 }); }
	if (areCommunicating(c, c10)) { accessibleCells.push({ i: c10.i - 1, j: c10.j - 1 }); }
	if (areCommunicating(c, c12)) { accessibleCells.push({ i: c12.i - 1, j: c12.j - 1 }); }

	return accessibleCells;
};

//███████████████████████████████████████████████████████████████████████████████████████████████
//█████████████████████████████████████████▄░█████▄████████████████▄░▄▄▄▀██████████▀█████▄░██████
//█▄░▀▄▄▀██▀▄▄▄▄▀█▄░▀▄▄▄█▄░▀▄▀▀▄▀█▀▄▄▄▄▀████░███▄▄░███░▄▄░▄█▀▄▄▄▄▀██░███░█▀▄▄▄▄▀██▄░▄▄▄███░▀▄▄▀██
//██░███░██░████░██░██████░██░██░█▀▄▄▄▄░████░█████░████▀▄███░▄▄▄▄▄██░▄▄▄██▀▄▄▄▄░███░██████░███░██
//█▀░▀█▀░▀█▄▀▀▀▀▄█▀░▀▀▀██▀░▀█░▀█░█▄▀▀▀▄░▀█▀▀░▀▀█▀▀░▀▀█░▀▀▀░█▄▀▀▀▀▀█▀░▀████▄▀▀▀▄░▀██▄▀▀▀▄█▀░▀█▀░▀█
//███████████████████████████████████████████████████████████████████████████████████████████████
/**
 * checkPath - check if path is valid
 *
 * @param  {number[]}      path - Atouin path. Each number in the array is a cellId (a number in the range [0..559])
 * @return {boolean}            - function return true if all cellId are consecutive.
 */
function checkPath(path) {
	if (!Array.isArray(path) || path.length < 2) { return false; }
	var previous = getMapPoint(path[0]);
	for (var i = 1, len = path.length; i < len; i += 1) {
		var cellId = path[i];
		var coord = getMapPoint(cellId);
		if (Math.abs(previous.x - coord.x) > 1) { return false; }
		if (Math.abs(previous.y - coord.y) > 1) { return false; }
		previous = coord;
	}
	return true;
}


//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/**
 * expandPath - expand path if there is hole in it (used for monsters movements)
 *
 * @param {number[]} path - array of cellId
 *
 * @return {Array} an array of cellId.
 */
function expandPath(path) {
	if (!Array.isArray(path)) { return []; }
	if (path.length < 2) { return path; }
	var resultPath = [];
	resultPath.push(path[0]);
	var previous = getMapPoint(path[0]);
	for (var i = 1, len = path.length; i < len; i += 1) {
		var cellId = path[i];
		var coord = getMapPoint(cellId);
		var incrX, incrY;
		// TODO: diagonal case ?
		if (Math.abs(coord.x - previous.x) > 1) {
			incrX = (coord.x > previous.x) ? 1 : -1;
			previous.x += incrX;
			while (previous.x !== coord.x) {
				resultPath.push(getCellId(previous.x, previous.y));
				previous.x += incrX;
			}
		}
		if (Math.abs(coord.y - previous.y) > 1) {
			incrY = (coord.y > previous.y) ? 1 : -1;
			previous.y += incrY;
			while (previous.y !== coord.y) {
				resultPath.push(getCellId(previous.x, previous.y));
				previous.y += incrY;
			}
		}
		previous = coord;
		resultPath.push(cellId);
	}
	return resultPath;
}

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** Convert a path from pathfinder to a compress version when sending movement request:
 *  - encode direction in upper bits of each step
 *  - remove consecutive steps with same direction
 *
 * @param  {number[]} path - an array of cellIds
 * @return {number[]} compressed path
 */
exports.compressPath = function (path) {
	var compressedPath = [];
	var prevCellId     = path[0];
	var prevDirection  = -1;

	var prevX;
	var prevY;

	for (var i = 0; i < path.length; i++) {
		var cellId = path[i];

		var direction;
		var coord = getMapPoint(cellId);

		// get direction
		if (i === 0) {
			direction = -1;
		} else {
			if (coord.y === prevY) {
				// move horizontaly
				direction = coord.x > prevX ? 7 : 3;
			} else if (coord.x === prevX) {
				// move verticaly
				direction = coord.y > prevY ? 1 : 5;
			} else {
				// move in diagonal
				if (coord.x > prevX) {
					direction = coord.y > prevY ? 0 : 6;
				} else {
					direction = coord.y > prevY ? 2 : 4;
				}
			}
		}

		if (direction !== prevDirection) {
			compressedPath.push(prevCellId + (direction << 12));
			prevDirection = direction;
		}

		prevCellId = cellId;
		prevX = coord.x;
		prevY = coord.y;
	}

	compressedPath.push(prevCellId + (prevDirection << 12));

	return compressedPath;
};

//▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
/** @method module:pathFinder.normalizePath */
exports.normalizePath = function (path) {
	if (checkPath(path)) { return path; }
	return expandPath(path);
};


//████████████████████████████████████████████████████
//██▄░██████████████████▄░▄▄▄▀██████████▀█████▄░██████
//███░███▀▄▄▄▄▀█▀▄▄▄▀░▄██░███░█▀▄▄▄▄▀██▄░▄▄▄███░▀▄▄▀██
//███░███░████░█░████░███░▄▄▄██▀▄▄▄▄░███░██████░███░██
//█▀▀░▀▀█▄▀▀▀▀▄█▄▀▀▀▄░██▀░▀████▄▀▀▀▄░▀██▄▀▀▀▄█▀░▀█▀░▀█
//███████████████▀▀▀▀▄████████████████████████████████
/**
 * @method module:pathFinder.logPath
 * @desc debug function : output an ascii representation of the map in the console
 *
 * @param  {number[]} path - Atouin path. Each number in the array is a cellId (a number in the range [0..559])
 * @return {string}        - Representation of the path on an Atouin Map
 */
exports.logPath = function (path) {
	path = path || [];
	// construct matrix from map
	var grid = [];
	var x, y;
	for (x = 0; x < 33; x += 1) {
		grid.push([]);
		for (y = 0; y < 34; y += 1) {
			if (getCellId(x, y) === undefined) {
				grid[x][y] = '    ';
			} else {
				grid[x][y] = '[  ]';
			}
		}
	}
	for (var i = 0, len = path.length; i < len; i += 1) {
		var cellId = path[i];
		var coord = getMapPoint(cellId);
		var b = (i < 10) ? '0' : '';
		grid[coord.x][coord.y] = '[' + b + i + ']';
	}
	var text = '';
	for (y = 0; y < 34; y += 1) {
		for (x = 0; x < 33; x += 1) {
			text += grid[x][y];
		}
		text += '\n';
	}
	return text;
};

