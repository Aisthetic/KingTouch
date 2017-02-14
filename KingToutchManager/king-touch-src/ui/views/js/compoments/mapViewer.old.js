var MapHeight = 20;
var MapWidth = 14;
var CommonCellHeight = 43;
var CommonCellWidth = 86;
var CellsCount = 560;
var Cells = {};

function DrawMap(canvas,mapData){
	var context = canvas.getContext('2d');
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.canvas.width  = $(".tab-pages").width();
	context.canvas.height = $(".tab-pages").height();
	var drawedHeight = context.canvas.height-(context.canvas.height/20)*2;
	BuildMap(context.canvas.width,drawedHeight,mapData);

	for(var c in Cells){
		var cell = Cells[c];
		if(cell.mov){
			context.fillStyle = 'darkgray';			
		}
		else if(cell.los){
			context.fillStyle = 'black';			
		}
		else{
			context.fillStyle="#dadada";
		}

		context.beginPath();
		var paddingTop = cell.Points.down.y-cell.Points.top.y;
		context.moveTo(cell.Points.top.x, cell.Points.top.y+paddingTop);
		context.lineTo(cell.Points.right.x, cell.Points.right.y+paddingTop);
		context.lineTo(cell.Points.down.x, cell.Points.down.y+paddingTop);
		context.lineTo(cell.Points.left.x, cell.Points.left.y+paddingTop);
		context.closePath();
		context.fill();
	}
}

function BuildMap(Width,Height,mapData)
{
	for(var q = 0;q<CellsCount;q++){
		Cells[q] ={los:false};
		var mask = 0 ? 5 : 1;
		if (mapData.cells[q].l & mask === 1){
			Cells[q].mov=true;
		}
		else{
			Cells[q].mov=false;
		}
	}
	var cellId = 0;
	var cellWidth = GetMaxScaling(Width,Height);
	var cellHeight = Math.ceil(cellWidth/2);

	var offsetX = (Width - ((MapWidth + 0.5) * cellWidth))/2;
	var offsetY = (Height - ((MapHeight + 0.5) * cellHeight))/2;

	var midCellHeight = cellHeight/2;
	var midCellWidth = cellWidth/2;

	for (var y = 0; y < 2*MapHeight; y++)
	{
		if (y%2 === 0)
			for (var x = 0; x < MapWidth; x++)
			{
				var left = {x:offsetX + x*cellWidth,y: offsetY + y*midCellHeight + midCellHeight};
				var top = {x:offsetX + x*cellWidth + midCellWidth,y: offsetY + y*midCellHeight};
				var right = {x:offsetX + x*cellWidth + cellWidth,y: offsetY + y*midCellHeight + midCellHeight};
				var down = {x:offsetX + x*cellWidth + midCellWidth,y: offsetY + y*midCellHeight + cellHeight};
				Cells[cellId++].Points = {left, top, right, down};
			}
		else
			for (var x = 0; x < MapWidth; x++)
			{
				var left = {x:offsetX + x*cellWidth + midCellWidth, y:offsetY + y*midCellHeight + midCellHeight};
				var top = {x:offsetX + x*cellWidth + cellWidth, y:offsetY + y*midCellHeight};
				var right = {x:offsetX + x*cellWidth + cellWidth + midCellWidth,y: offsetY + y*midCellHeight + midCellHeight};
				var down = {x:offsetX + x*cellWidth + cellWidth,y: offsetY + y*midCellHeight + cellHeight};
				Cells[cellId++].Points = {left, top, right, down};
			}
	}
	RealCellHeight = cellHeight;
	RealCellWidth = cellWidth;
}

function GetMaxScaling(Width,Height)
{
	var cellWidth = Width/(MapWidth + 1);
	var cellHeight = Height/(MapHeight + 1);
	cellWidth = Math.min(cellHeight*2, cellWidth);
	return cellWidth;
}