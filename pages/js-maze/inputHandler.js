import * as MBase from './mazeBase.js';
import * as MAlgorithm from './mazeAlgorithm.js';


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

MBase.initCanv(cx);

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
var speed = 1000.0;

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

    if (MBase.size == null){
        return;
    }

    let tilePos = MBase.posToTile(pos);
    if (tilePos == null){
        return;
    }

    let tileVal = MBase.maze[tilePos[0]][tilePos[1]];

    if (tilePos !== null){
        if (state == 'create mode 1'){
            // if clicked on a start/end tile, set/render previous start/end tile to empty
            if (MBase.startTile != null){
                if (tilePos[0] == MBase.startTile[0] && tilePos[1] == MBase.startTile[1]){
                    MBase.resetStart(null);
                }
            }
            if (MBase.endTile != undefined){
                if (tilePos[0] == MBase.endTile[0] && tilePos[1] == MBase.endTile[1]){
                    MBase.resetEnd(null);
                }
            }

            // if clicked with 1 or 2 down to set start/end tile, set start/end tile
            // and set/render previous start/end tile to empty
            if (modKeyDown == 2){
                MBase.resetStart( [tilePos[0], tilePos[1]] );
            } else if (modKeyDown == 3){
                MBase.resetEnd( [tilePos[0], tilePos[1]] );
            }

            MBase.setAndRender(tilePos, modKeyDown);
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
                            MBase.setAndRender(userPath[k], 0);
                            userPath.pop();
                        }
                        userPath[i + 1] = tilePos;

                        MBase.setAndRender(tilePos, 5);

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
                            \nHold 1 and click to set start\
                            \nHold 2 and click to set end\
                            \nHold CTRL and click to erase';

    MBase.initMaze(size);
}

function startCreate2(){
    state = 'create mode 2';

    messageBox.textContent = 'solving maze...';

    MAlgorithm.solveMaze(speed);
}

function startSolve1(size){
    state = 'solve mode 1';

    messageBox.textContent = 'creating maze...';
    hiddenDiv.style.visibility = 'hidden';
    sizeWarnMessage.textContent = '';
    sizeInput.value = '';

    MBase.initMaze(size);
    MAlgorithm.createMaze(speed);
}


// -- algorithm finish handlers -- //


// event that mazeAlgorithm.solveMaze() calls
// after maze is solved with algorithm
function mazeSolvedEvent(path){
    if (path != null){
        for (let i = 1; i < path.length - 1; i++){
            MBase.setAndRender(path[i], 5);
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
    if (lastTile == undefined || MBase.endTile == null){
        return;
    }

    for (let i = 0; i < 4; i++){
        let nTile = [lastTile[0] + ng[i][0], lastTile[1] + ng[i][1]];
        if (nTile[0] == MBase.endTile[0] && nTile[1] == MBase.endTile[1]){
            state = 'waiting';
            messageBox.textContent = 'You solved the maze!! YAY!!';
        }
    }
}


// -- event listeners -- //


createButton.addEventListener('click', () => {
    if (state == 'waiting'){
        state = 'prompting create';
        MBase.initMaze(1);
        currentMazeId++;

        hiddenDiv.style.visibility = 'visible';
    } else {
        let conf = confirm('Are you sure you want to reset?');
        if (conf){
            state = 'prompting create';
            MBase.initMaze(1);
            currentMazeId++;

            hiddenDiv.style.visibility = 'visible';
        }
    }
});

solveButton.addEventListener('click', () => {
    if (state == 'waiting'){
        state = 'prompting solve';
        MBase.initMaze(1);
        currentMazeId++;

        hiddenDiv.style.visibility = 'visible';
    } else {
        let conf = confirm('Are you sure you want to reset?');
        if (conf){
            state = 'prompting solve';
            MBase.initMaze(1);
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
                if (MBase.startTile == null || MBase.endTile == null){
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

export {mazeSolvedEvent, mazeCreatedEvent, currentMazeId}
