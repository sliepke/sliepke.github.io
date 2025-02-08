/*
   the original app ( pages/js-maze ) is made with javascript modules,
   which requires hosting a server. This version is a copy-paste
   of the original but with only one js file so I can display the page
   as a file in my browser without running a server just to demonstrate it.
*/



// ---- mazeBase.js ---- //



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

//export { maze, size, startTile, endTile, resetStart, resetEnd, initCanv, initMaze};
//export { inBounds, renderTile, setAndRender, posToTile};



// ---- mazeAlgorithm.js ---- //



//import * as MBase from './mazeBase.js';
//import {mazeSolvedEvent, mazeCreatedEvent, currentMazeId} from './inputHandler.js';

var narray = [ [-1, 0], [1, 0], [0, -1], [0, 1] ];

function createMaze(timeStep){

    // creating a maze involves setting connections on/off between nodes.
    // nodes on the canvas are displayed as being every other tile

    // nsize is the width/height of the node grid
    let nsize = Math.floor(size / 2);

    // nodes that have been connected to already
    // ( stored as nsize by nsize grid with true/false values )
    let nodesReached = [];

    // connected nodes that have an unconnected neighboor
    // and can therefore be chosen for next random connection
    // nodes in this map are indexed with indexFromPos()
    let nodesRoot = new Map();

    // inBounds() is for pixel grid, this is for node grid
    function nodeInBounds(pos){
        return (pos[0] >= 0 && pos[0] < nsize && pos[1] >= 0 && pos[1] < nsize);
    }

    function indexFromPos(pos){
        return (pos[1] * nsize) + pos[0];
    }

    function posFromIndex(index){
        let x = index % nsize;
        let y = (index - x) / nsize;
        return [x, y];
    }

    // array with true/(false | undefined) values for whether each pair of
    // neighbooring nodes is connected to each other or not
    // indexed with lineIndex()
    let lines = [];

    function lineIndex(pos0, pos1){
        let root = pos0; let end = pos1;
        if (pos1[0] < pos0[0] || pos1[1] < pos0[1]){
            root = pos1; end = pos0;
        }

        if (root[0] < end[0]){
            return root[1] * (nsize - 1) + root[0];
        }

        return (nsize * (nsize - 1)) + (root[1] * nsize) + root[0];
    }

    // returns which tile on maze a line is shown as
    function lineAsTile(pos0, pos1){
        let root = pos0; let end = pos1;
        if (pos1[0] < pos0[0] || pos1[1] < pos0[1]){
            root = pos1; end = pos0;
        }

        let val = [root[0] * 2, root[1] * 2];
        if (root[0] < end[0]){
            val[0] += 1;
        } else{
            val[1] += 1;
        }

        return val;
    }

    function getUnreachedNeighboors(pos){
        let nlist = [];
        for (let ni = 0; ni < 4; ni++){
            let dx = narray[ni][0];
            let dy = narray[ni][1];
            let posd = [pos[0] + dx, pos[1] + dy];

            if ( !nodeInBounds(posd) ){
                continue;
            }

            if (!nodesReached[posd[0]][posd[1]]){
                nlist[nlist.length] = posd;
            }
        }
        return nlist;
    }

    // update whether pos and pos's neighboors are roots
    // every time a connection is made this should be called for both nodes
    function updateIsRoot(posa){
        let posa_i = indexFromPos(posa);
        let posa_hasUnreachedNeighboor = false;

        //console.log("updating " + posa);

        // iterate through posa's neighboors (posb)
        for (let ni = 0; ni < 4; ni++){
            let posb = [posa[0] + narray[ni][0], posa[1] + narray[ni][1]];
            let posb_i = indexFromPos(posb);

            //console.log("\tlooking at " + posb);

            if ( !nodeInBounds(posb) ){
                //console.log("\t\tnot inbounds. skipping");
                continue;
            }

            // if posb is reached, check if it has unreached neighboors
            // and if so, set posb as a root
            if (nodesReached[posb[0]][posb[1]]){
                //console.log("\t\tis reached, checking neighboors:");

                let posb_hasUnreachedNeighboor = false;
                for (let nni = 0; nni < 4; nni++){
                    let posc = [posb[0] + narray[nni][0], posb[1] + narray[nni][1]];

                    //console.log("\t\t\tchecking: " + posc);
                    if ( !nodeInBounds(posc) ){
                        //console.log("\t\t\tnot inbounds, skipping");
                        continue;
                    }
                    if (!nodesReached[posc[0]][posc[1]]){
                        //console.log("\t\t\tis unreached");
                        posb_hasUnreachedNeighboor = true;
                        break;
                    }
                }

                //console.log("\t\thas unreached neighboor: " + posb_hasUnreachedNeighboor);
                if (posb_hasUnreachedNeighboor){
                    nodesRoot.set(posb_i, true);
                } else if (nodesRoot.get(posb_i)){
                    nodesRoot.delete(posb_i);
                    // rootNum--;
                }
            } else{
                //console.log("\t\tisnt reached");
                posa_hasUnreachedNeighboor = true;
            }
        }

        //console.log("\thas unreached neighboor: " + posa_hasUnreachedNeighboor);
        if (nodesReached[posa[0]][posa[1]] && posa_hasUnreachedNeighboor){
            nodesRoot.set(posa_i, true);
        } else if (nodesRoot.get(posa_i)){
            nodesRoot.delete(posa_i);
            // rootNum--;
        }
    }

    // set nodesReached to all false
    for (let x = 0; x < nsize; x++){
        nodesReached[x] = [];
        // nodesRoot[x] = [];
        for (let y = 0; y < nsize; y++){
            nodesReached[x][y] = false;
            // nodesRoot[x][y] = false;
        }
    }

    // set (0, 0) as starting node
    nodesRoot.set(0, true);
    nodesReached[0][0] = true;

    // function to create a random connection
    // between a connected node and an unconnected one
    function nextLine(){
        let rootChoiceIndex = Math.floor( Math.random() * nodesRoot.size );
        let root_iter = nodesRoot[Symbol.iterator]();
        for (let i = 0; i < rootChoiceIndex; i++){
            root_iter.next();
        }
        let rootChoicePosIndex = root_iter.next().value[0];
        let rootChoice = posFromIndex(rootChoicePosIndex);

        let endChoices = getUnreachedNeighboors(rootChoice);
        if (endChoices.length == 0){
            console.log("uh oh");
            return;
        }

        let endChoiceIndex = Math.floor(Math.random() * endChoices.length);
        let endChoice = endChoices[endChoiceIndex];

        //console.log("endChoiceIndex: " + endChoiceIndex);
        //return;

        lines[lineIndex(rootChoice, endChoice)] = true;
        nodesReached[endChoice[0]][endChoice[1]] = true;

        setAndRender(lineAsTile(rootChoice, endChoice), 0);

        updateIsRoot(rootChoice);
        updateIsRoot(endChoice);
    }

    // first set what the walls are in maze
    for (let y = 0; y < size; y++){
        for (let x = 0; x < size; x++){
            if ( (y % 2 == 1) || (x % 2 == 1) ){
                setAndRender([x, y], 1);
            }
        }
    }

    // set start tile to -x-y corner and end tile to +x+y corner
    resetStart([0, 0]);
    resetEnd( [(nsize - 1) * 2, (nsize - 1) * 2] );

    let linesLeft = (nsize ** 2 - 1);

    // if maze ID changes then maze was reset and algorithm aborts
    let thisMazeId = currentMazeId;

    // call nextLine() (nsize ^ 2 - 1) times every timestep
    // ( or without timestep if timeStep is NaN (max speed selected) )

    if (!isNaN(timeStep)){
        let intervalId = setInterval(() => {

            // since using async timeouts, have to check
            // if user reset maze inbetween timeouts
            if (thisMazeId != currentMazeId){
                return;
            }

            nextLine();
            linesLeft--;
            if (linesLeft == 0){
                clearInterval(intervalId);
                mazeCreatedEvent();
            }
        }, timeStep);
    } else{
        while (true){
            nextLine();
            linesLeft--;
            if (linesLeft == 0){
                mazeCreatedEvent();
                break;
            }
        }
    }

}

function solveMaze(timeStep){
    let layers = [ [ [startTile[0], startTile[1], 0] ] ];
    let finalpath = null;
    let isFinished = false;

    // 2d array of maze tiles for keeping
    // track of what tiles have been reached
    let reached = [];
    for (let x = 0; x < size; x++){
        reached[x] = [];
        for (let y = 0; y < size; y++){
            reached[x][y] = false;
        }
    }

    // set starting tile as having been reached
    reached[startTile[0]][startTile[1]] = true;

    function doLayer(){
        let prevLayer = layers[layers.length - 1];
        let nextLayer = [];

        // for every tile at the current layer
        for (let i = 0; i < prevLayer.length; i++){
            let tile = prevLayer[i];

            // go through every neighboor of that tile
            for (let ni = 0; ni < 4; ni++){
                let dx = narray[ni][0];
                let dy = narray[ni][1];

                // neighboor tile
                let dtile = [tile[0] + dx, tile[1] + dy];

                // skip if dtile is out of bounds
                if (!inBounds(dtile)) {
                    continue;
                }

                let mvalue = maze[dtile[0]][dtile[1]];

                // skip if dtile is a wall
                if (mvalue == 1){
                    continue;
                }

                // if dtile is end of maze, return the path taken to it
                if (mvalue == 3){

                    let path = [];
                    let pIndex = i;
                    path[layers.length] = [dtile[0], dtile[1]];

                    for (let pLayer = layers.length - 1; pLayer >= 0; pLayer--){
                        let pTile = layers[pLayer][pIndex];
                        pIndex = pTile[2];
                        path[pLayer] = [pTile[0], pTile[1]];
                    }

                    finalpath = path;
                    isFinished = true;
                    reached[dtile[0]][dtile[1]] = true;
                }

                // if dtile has not been reached, add it to next layer,
                // set it as reached, and show it as being reached in UI
                if (!reached[dtile[0]][dtile[1]]){
                    reached[dtile[0]][dtile[1]] = true;
                    nextLayer[nextLayer.length] = [dtile[0], dtile[1], i];
                    setAndRender(dtile, 4);
                }
            }
        }

        layers[layers.length] = nextLayer;
        if (nextLayer.length == 0){
            isFinished = true;
        }

    }

    let thisMazeId = currentMazeId;

    if (!isNaN(timeStep)){
        let intervalId = setInterval(() => {

            // since using async timeouts, have to check
            // if user reset maze inbetween timeouts
            if (thisMazeId != currentMazeId){
                return;
            }

            doLayer();
            if (isFinished){
                clearInterval(intervalId);
                mazeSolvedEvent(finalpath);
            }
        }, timeStep);
    } else{
        while (true){
            doLayer();
            if (isFinished){
                mazeSolvedEvent(finalpath);
                break;
            }
        }
    }
}

//export {createMaze, solveMaze};



// ---- inputhandler.js ---- //



//import * as MBase from './mazeBase.js';
//import * as MAlgorithm from './mazeAlgorithm.js';


// -- element list -- //

var createButton = document.getElementById('create');
var solveButton = document.getElementById('solve');

var canv = document.getElementById('canvas');
var cx = canv.getContext('2d');

var speedSlider = document.getElementById('speedSlider');
var speedMessage = document.getElementById('speedMessage');
var messageBox = document.getElementById('message-box');

var hiddenDiv = document.getElementById('hidden');
var sizeInput = document.getElementById('size-input');
var sizeWarnMessage = document.getElementById('warning');

initCanv(cx);

// -- -- //

/* possible values for the state variable:
      'waiting'         ready to start either modes

      'prompt create'     user is inputting size value for create mode
      'prompt solve'      user is inputting size value for solve mode

      'create mode 1'   user is creating maze
      'create mode 2'   user created maze, now algorithm is solving

      'solve mode 1'    algorithm is creating maze
      'solve mode 2'    algorithm created maze, now user is solving it
*/
var state = 'waiting';

/* speed is the timestep in ms for each iteration of
   maze solving or creating. If the slider is at maximum,
   then the speed is NaN and the algorithms don't wait at all */
var speed = 100.0;

/* what maze value a click/drag will result in
   changes if 1, 2, or CTRL is held */
var modKeyDown = 0;

// the path of tiles made by user during solve mode 2
// the path input process doesn't allow to make branching paths
var userPath = [];

// array that helps with iterating through a given tile's neighboors
var ng = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// the maze create/solve algorithms with timeouts have to
// check if maze reset in between timeouts.
// if it reset, then the maze id will have incremented.
var currentMazeId = 0;

// handler for a mouse click / drag on canvas
function mazeClick(pos){

    if (size == null){
        return;
    }

    let tilePos = posToTile(pos);
    if (tilePos == null){
        return;
    }

    let tileVal = maze[tilePos[0]][tilePos[1]];

    if (tilePos !== null){
        if (state == 'create mode 1'){
            // if clicked on a start/end tile, set/render previous start/end tile to empty
            if (startTile != null){
                if (tilePos[0] == startTile[0] && tilePos[1] == startTile[1]){
                    resetStart(null);
                }
            }
            if (endTile != undefined){
                if (tilePos[0] == endTile[0] && tilePos[1] == endTile[1]){
                    resetEnd(null);
                }
            }

            // if clicked with 1 or 2 down to set start/end tile, set start/end tile
            // and set/render previous start/end tile to empty
            if (modKeyDown == 2){
                resetStart( [tilePos[0], tilePos[1]] );
            } else if (modKeyDown == 3){
                resetEnd( [tilePos[0], tilePos[1]] );
            }

            setAndRender(tilePos, modKeyDown);
        }
        else if (state == 'solve mode 2'){

            // if click was on a start, end, or wall tile, ignore
            if (tileVal == 1 || tileVal == 2 || tileVal == 3){
                return;
            }

            // if tile clicked is on userPath, ignore
            for (let i = 0; i < userPath.length; i++){
                if (tilePos[0] == userPath[i][0] && tilePos[1] == userPath[i][1]){
                    return;
                }
            }

            // add tile to userPath if it directly connects to it

            // for every tile in userPath (start from the end)
            for (let i = userPath.length - 1; i >= 0; i--){
                let testT = userPath[i];

                // for every neighboor (testN) of that tile (testT)
                for (let j = 0; j < 4; j++){
                    let testN = [testT[0] + ng[j][0], testT[1] + ng[j][1]];

                    // if tilePos and neighboor are equal
                    if (tilePos[0] == testN[0] && tilePos[1] == testN[1]){

                        // replace path after testT with tilePos
                        for (let k = userPath.length - 1; k > i; k--){
                            setAndRender(userPath[k], 0);
                            userPath.pop();
                        }
                        userPath[i + 1] = tilePos;

                        setAndRender(tilePos, 5);

                        // finish solve mode if end was reached
                        tryUserSolve();

                        return;
                    }
                }
            }
        }
    }
}

function startCreate1(size){
    state = 'create mode 1';

    hiddenDiv.style.visibility = 'hidden';
    sizeWarnMessage.textContent = '';
    sizeInput.value = '';
    messageBox.textContent = 'Click / drag on the canvas to create the maze\
        \nHold 1 and click to set start, 2 to set end, and CTRL to erase\
        \n\nWhen finished, press Enter and I will solve your maze';

    initMaze(size);
}

function startCreate2(){
    state = 'create mode 2';

    messageBox.textContent = 'solving maze...';

    solveMaze(speed);
}

function startSolve1(size){
    state = 'solve mode 1';

    messageBox.textContent = 'creating maze...';
    hiddenDiv.style.visibility = 'hidden';
    sizeWarnMessage.textContent = '';
    sizeInput.value = '';

    initMaze(size);
    createMaze(speed);
}


// -- algorithm finish handlers -- //


// event that mazeAlgorithm.solveMaze() calls
// after maze is solved with algorithm
function mazeSolvedEvent(path){
    if (path != null){
        for (let i = 1; i < path.length - 1; i++){
            setAndRender(path[i], 5);
        }
        messageBox.textContent = 'Too easy!';
    } else {
        /* unfortunately I can't use the previous 'you cheated' message,
           since I'm actually showing this program to people. */
        messageBox.textContent = 'it\'s not possible you cheater!';
    }

    state = 'waiting';
}

// event that mazeAlgorithm.createMaze() calls
// after maze is created with algorithm
function mazeCreatedEvent(){
    messageBox.textContent = 'maze created, now solve it!';

    userPath = [[0, 0]];
    state = 'solve mode 2';
}


// checks/handles if user solved maze, which happens if the last
// position of userPath is a neighboor to the end tile.
function tryUserSolve(){
    let lastTile = userPath[userPath.length - 1];
    if (lastTile == undefined || endTile == null){
        return;
    }

    for (let i = 0; i < 4; i++){
        let nTile = [lastTile[0] + ng[i][0], lastTile[1] + ng[i][1]];
        if (nTile[0] == endTile[0] && nTile[1] == endTile[1]){
            state = 'waiting';
            messageBox.textContent = 'You solved the maze good job!';
        }
    }
}


// -- event listeners -- //


createButton.addEventListener('click', () => {
    if (state == 'waiting'){
        state = 'prompting create';
        initMaze(1);
        currentMazeId++;

        hiddenDiv.style.visibility = 'visible';
    } else {
        let conf = confirm('Are you sure you want to reset?');
        if (conf){
            state = 'prompting create';
            initMaze(1);
            currentMazeId++;

            hiddenDiv.style.visibility = 'visible';
        }
    }
});

solveButton.addEventListener('click', () => {
    if (state == 'waiting'){
        state = 'prompting solve';
        initMaze(1);
        currentMazeId++;

        hiddenDiv.style.visibility = 'visible';
    } else {
        let conf = confirm('Are you sure you want to reset?');
        if (conf){
            state = 'prompting solve';
            initMaze(1);
            currentMazeId++;

            hiddenDiv.style.visibility = 'visible';
        }
    }
});

sizeInput.addEventListener('keydown', (event) => {
    if (event.key == 'Enter'){
        let num = parseInt(sizeInput.value);

        if (isNaN(num)){
            sizeWarnMessage.textContent = 'that isn\'t a number';
            return;
        }

        if (num < 10 || num > 100){
            sizeWarnMessage.textContent = 'that isn\'t between 10 and 100';
            return;
        }

        if (state == 'prompting create'){
            startCreate1(num);
        } else if (state == 'prompting solve'){
            startSolve1(num);
        }
    }
});

var mouseIsDown = false;

document.addEventListener('keydown', (event) => {
    switch (event.key){
        case '1':
            modKeyDown = 2;
            break;
        case '2':
            modKeyDown = 3;
            break;
        case 'Control':
            modKeyDown = 0;
            break;
        case 'Enter':
            if (state == 'create mode 1'){
                if (startTile == null || endTile == null){
                    return;
                }
                startCreate2();
            }// else if (state == 'solve mode 2'){
                // startSolve3(); // make startSolve3
            //}
            break;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key == '1' || event.key == '2' || event.key == 'Control'){
        modKeyDown = 1;
    }
});


document.addEventListener('mouseup', () => {
    mouseIsDown = false;
});

canv.addEventListener('mousedown', () => {
    mouseIsDown = true;
    mazeClick( [event.offsetX, event.offsetY] )
});

canv.addEventListener('mousemove', () => {
    if (mouseIsDown){
        mazeClick( [event.offsetX, event.offsetY] );
    }
});

speedSlider.addEventListener('input', (event) => {
    speed = Number(speedSlider.value);
    if (speed == 100){
        speed = NaN;
        speedMessage.textContent = 'max speed';
    } else{
        speed = ((100 - speed) ** 2) * (99 / 1000) + 10;
        let speedStr = speed.toFixed(2);
        speedMessage.textContent = speedStr + ' ms timestep';
    }
});

// export {mazeSolvedEvent, mazeCreatedEvent, currentMazeId}
