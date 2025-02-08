var cx = null;

var size = null;

/* 2d array of maze tile values
   values for a given tile can be:
     0 : empty
     1 : wall
     2 : start tile
     3 : end tile
     4 : highlighted 1 (for showing maze solving process)
     5 : highlighted 2 (for showing solution path)
*/
var maze = [];

var startTile = null;
var endTile = null;

function resetStart(pos){
    if (startTile != null){
        setAndRender(startTile, 0);
    }
    startTile = pos;
    if (startTile != null){
        setAndRender(startTile, 2);
    }
}

function resetEnd(pos){
    if (endTile != null){
        setAndRender(endTile, 0);
    }
    endTile = pos;
    if (endTile != null){
        setAndRender(endTile, 3);
    }
}

function initCanv(canvCx){
    cx = canvCx;
}

// init is used to make maze for the first time or to reset it
function initMaze(sizeA){
    size = sizeA;

    startTile = null;
    endTile = null;

    maze = [];
    for (let x = 0; x < size; x++){
        maze[x] = [];
        for (let y = 0; y < size; y++){
            maze[x][y] = 0;
            renderTile([x, y]);
        }
    }
}

function inBounds(pos){
    return (pos[0] >= 0 && pos[0] < size && pos[1] >= 0 && pos[1] < size);
}

function renderTile(pos){
    let px = Math.floor(pos[0] * 500 / size);
    let py = Math.floor(pos[1] * 500 / size);
    let tileSize = 500 / size;

    // set the fill color based on what the maze value is
    switch ( maze[pos[0]][pos[1]] ){
        case 0:
            cx.fillStyle = 'white'; break;
        case 1:
            cx.fillStyle = 'black'; break;
        case 2:
            cx.fillStyle = 'green'; break;
        case 3:
            cx.fillStyle = 'red'; break;
        case 4:
            cx.fillStyle = '#b0d0b0'; break;
        case 5:
            cx.fillStyle = 'blue'; break;
    }

    // then fill it, either full rect or small rect based on maze value
    switch ( maze[pos[0]][pos[1]] ) {
        case 0: case 1: case 4:
            cx.fillRect(px, py, tileSize, tileSize);
            break;
        case 2: case 3:
            cx.clearRect(px, py, tileSize, tileSize);
            cx.fillRect(px + tileSize / 6, py + tileSize / 6, 2 * tileSize / 3, 2 * tileSize / 3);
            break;
        case 5:
            cx.clearRect(px, py, tileSize, tileSize);
            cx.fillRect(px + tileSize / 3, py + tileSize / 3, tileSize / 3, tileSize / 3);
            break;
    }
}

function setAndRender(pos, val){
    maze[pos[0]][pos[1]] = val;
    renderTile(pos);
}

function setLine(pos0, pos1, time){ console.log('setLine incomplete'); }

// translates pixel coords on canvas to tile coords of maze
// returns null if out of bounds
function posToTile(pos){
    let tileX = Math.floor(pos[0] * size / 500);
    let tileY = Math.floor(pos[1] * size / 500);
    if (tileX < 0 || tileX >= size || tileY < 0 || tileY >= size){
        return null;
    }
    return [tileX, tileY];
}

export { maze, size, startTile, endTile, resetStart, resetEnd, initCanv, initMaze};
export { inBounds, renderTile, setAndRender, posToTile};
