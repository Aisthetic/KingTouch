// We l♥ve Sapuraizu
// Const
const TileWidth = 43; // 43
const TileHeight = 21.5; // 21.5
const MAP_WIDTH = 14;
const MAP_HEIGHT = 20;

// Class
 class MapViewer {
    constructor(Canvas){
        // Vars
        this.Canvas = Canvas;
        this.CELLPOS = [];
        this.Entities = [];
        this.Storage = { Source: { Map: null, Entities: null },
                         Canvas: { Map: this.GetTempCanvas(), Entities: this.GetTempCanvas() }};
        this.Config = { DisplayCellID: false }
    }

    // Init cells
    _InitCells(){
        this.CELLPOS = [];
        let startX = 0, startY = 0, cell = 0;
        for (let a = 0; a < MAP_HEIGHT; a++){
            for (let b = 0; b < MAP_WIDTH; b++) {
                let p = this.GetCoordsFromCellID(cell);
                this.CELLPOS[cell] = {x:startX + b, y:startY + b, X: p.X * TileWidth + (p.Y % 2 == 1 ? TileWidth / 2 : 0), Y: p.Y * TileHeight / 2 };
                cell++;
            }
            startX++;
            for (let b = 0; b < MAP_WIDTH; b++) {
                let p = this.GetCoordsFromCellID(cell);
                this.CELLPOS[cell] = {x:startX + b, y:startY + b, X: p.X * TileWidth + (p.Y % 2 == 1 ? TileWidth / 2 : 0), Y: p.Y * TileHeight / 2 };
                cell++;
            }
            startY--;
        }
    }

    // Init entities
    _InitEntities(EntitiesData){
        this.Entities = [];
        for(var i in EntitiesData) {
            let data = EntitiesData[i];
            if(!this.Entities[data.cell]) this.Entities[data.cell] = [];
            if(data._type == "InteractiveElement") data.color = this.GetColorFromString(data._type + data.elementTypeId)
            else data.color = this.GetColorFromString(data._type)
            this.Entities[data.cell].push(data);
        }
    }

    // Init map construction
    Init(Obstacles, EntitiesData, Los){
        // Set canvas size
        var CContext= this.Canvas.getContext("2d");
        this.Canvas.width = TileWidth * (MAP_WIDTH + 1);
        this.Canvas.height = TileHeight * (MAP_HEIGHT + 1);

        // Start init cells & start map/entities building
        this._InitCells();
        this.SetMap(Obstacles, Los);
        this.SetEntities(EntitiesData);
    }

    // Set map set <Obstacles> and <Los> (Line of sight)
    SetMap(map, Los){
        let _Canvas = this.GetTempCanvas();
        for(var CellID in this.CELLPOS){
            this._DrawTileFromPos(_Canvas, this.CELLPOS[CellID].X, this.CELLPOS[CellID].Y, 0xFFFFFF, 0xBBBBBB); // Affichage de la grille
            var mask = 0 ? 5 : 1;
        		if (map.cells[q].l & mask === 1){
        			this._DrawTileFromPos(_Canvas, this.CELLPOS[CellID].X, this.CELLPOS[CellID].Y, 0xBBBBBB);
        		}
            if(this.Config.DisplayCellID == true) this._DrawTextFromPos(_Canvas, this.CELLPOS[CellID].X, this.CELLPOS[CellID].Y, CellID, "#e74c3c");
        }
        //this.Storage.Source.Map = { Obstacles: Obstacles, Los: Los };
        this.Storage.Canvas.Map = _Canvas;
        this._Bind([_Canvas, this.Storage.Canvas.Entities]);
    }
    UnsetMap(){
        this.Storage.Source.Map = null;
        this.Storage.Canvas.Map = this.GetTempCanvas();
        this._Refresh();
    }

    // Show & Hide CellID on map
    DisplayCellID(){
        this.Config.DisplayCellID = true;
        this.SetMap(this.Storage.Source.Map.Obstacles, this.Storage.Source.Map.Los);
    }
    HideCellID(){
        this.Config.DisplayCellID = false;
        this.SetMap(this.Storage.Source.Map.Obstacles, this.Storage.Source.Map.Los);
    }

    // Set entities
    SetEntities(EntitiesData){
        this._InitEntities(EntitiesData);
        let _Canvas = this.GetTempCanvas();
        for(var CellID in this.CELLPOS){
            if(this.Entities[CellID] && this.Entities[CellID].length){
                if(this.Entities[CellID][0]._type != "InteractiveElement") this._DrawCircleFromPos(_Canvas, this.CELLPOS[CellID].X, this.CELLPOS[CellID].Y, this.Entities[CellID][0].color);
                else this._DrawSquareFromPos(_Canvas, this.CELLPOS[CellID].X, this.CELLPOS[CellID].Y, this.Entities[CellID][0].color);
            }
        }
        this.Storage.Source.Entities = EntitiesData;
        this.Storage.Canvas.Entities = _Canvas;
        this._Bind([this.Storage.Canvas.Map, _Canvas]);
    }
    UnsetEntities(){
        this.Storage.Source.Entities = null;
        this.Storage.Canvas.Entities = this.GetTempCanvas();
        this._Refresh();
    }

    // Clear, Bind and Show map & entities
    _Bind(Maps){
        let Context = this.Canvas.getContext('2d');
        Context.clearRect(0, 0, TileWidth * (MAP_WIDTH+1), TileHeight * (MAP_HEIGHT+1));
        Maps.forEach((Value, Index, Elem) => {
            Context.drawImage(Value, 0, 0);
        })
    }

    // Refresh function if map or entities was removed
    _Refresh(){ this._Bind([this.Storage.Canvas.Map, this.Storage.Canvas.Entities]); }

    // Core function for Drawing rect tile
    _DrawTileFromPos(canvas, x, y, color, borderColor){
        let target = canvas.getContext("2d");
        if(color != undefined) target.fillStyle= "#" + color.toString(16);
        if(borderColor != undefined) {
            target.strokeStyle = "#" + borderColor.toString(16);
            target.lineWidth = .5;
        }
        target.beginPath();
        target.moveTo(x + TileWidth / 2, y + 0);
        target.lineTo(x + TileWidth, y + TileHeight / 2);
        target.lineTo(x + TileWidth / 2, y + TileHeight);
        target.lineTo(x + 0, y + TileHeight / 2);
        target.lineTo(x + TileWidth / 2, y + 0);

        if(color != undefined) target.fill();
        if(borderColor != undefined) target.stroke();
    }

    // Core function for Drawing Circle on tile
    _DrawCircleFromPos(canvas, x, y, color) {
        let target = canvas.getContext("2d");
        if(color != undefined) target.fillStyle= "#" + color.toString(16);
        target.beginPath();
        target.arc(x + TileWidth / 2, y + TileHeight / 2, TileHeight / 3, 0, Math.PI * 2, false);
        target.closePath();
        if(color != undefined) target.fill();
    }

    // Core function for Drawing square on tile
    _DrawSquareFromPos(canvas, x, y, color) {
        let target = canvas.getContext("2d");
        if(color != undefined) target.fillStyle= "#" + color.toString(16);
        target.beginPath();
        target.fillRect(x + TileHeight * .7, y + TileHeight * .2, TileHeight * .6, TileHeight * .6);
        target.closePath();
        if(color != undefined) target.fill();
    }

    // Core function for drawing text on tile
    _DrawTextFromPos(canvas, x, y, _text, _fillStyle){
        let target = canvas.getContext("2d");
        target.font = "10px";
        target.fillStyle = _fillStyle;
        target.fillText(_text, (x+TileWidth/2)-(3*_text.length), (y+TileHeight/2)+(_text.length-1));
    }

    // Get color from string <ElemType> of element
    GetColorFromString(ElemType){
        let i = 0, r = 0, g = 0, b = 0;
        for(i = 0; ElemType && i < ElemType.length; ++i){
            switch(i % 3){
                case 0: r += (ElemType.charCodeAt(i)) * 20; g += (ElemType.charCodeAt(i)) * 10; b += (ElemType.charCodeAt(i)) * 40; break;
                case 1: r += (ElemType.charCodeAt(i)) * 10; g += (ElemType.charCodeAt(i)) * 40; b += (ElemType.charCodeAt(i)) * 20; break;
                case 2: r += (ElemType.charCodeAt(i)) * 40; g += (ElemType.charCodeAt(i)) * 20; b += (ElemType.charCodeAt(i)) * 10; break;
            }
        }
        r = 0xEE - r % 150;
        g = 0xEE - g % 150;
        b = 0xEE - b % 150;
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
    }

    // Get cell coords X/Y on canvas and vice-versa
    GetCoordsFromCellID(CellID){ return { X: CellID % MAP_WIDTH, Y: Math.floor(CellID / MAP_WIDTH) } }
    GetCellIDFromCoords(x, y){ return null; }

    // Build temporary canvas
    GetTempCanvas(){
        let _Canvas = document.createElement('canvas');
        _Canvas.width = TileWidth * (MAP_WIDTH + 1);;
        _Canvas.height = TileWidth * (MAP_HEIGHT + 1);;
        return _Canvas;
    }
}
