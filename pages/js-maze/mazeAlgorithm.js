import * as MBase from './mazeBase.js';
import {mazeSolvedEvent, mazeCreatedEvent, currentMazeId} from './inputHandler.js';

var narray = [ [-1, 0], [1, 0], [0, -1], [0, 1] ];

function createMaze(timeStep){

    // creating a maze involves setting connections on/off between nodes.
    // nodes on the canvas are displayed as being every other tile

    // nsize is the width/height of the node grid
    let nsize = Math.floor(MBase.size / 2);

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

    // returns which tile on MBase.maze a line is shown as
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

        MBase.setAndRender(lineAsTile(rootChoice, endChoice), 0);

        updateIsRoot(rootChoice);
        updateIsRoot(endChoice);
    }

    // first set what the walls are in MBase.maze
    for (let y = 0; y < MBase.size; y++){
        for (let x = 0; x < MBase.size; x++){
            if ( (y % 2 == 1) || (x % 2 == 1) ){
                MBase.setAndRender([x, y], 1);
            }
        }
    }

    // set start tile to -x-y corner and end tile to +x+y corner
    MBase.resetStart([0, 0]);
    MBase.resetEnd( [(nsize - 1) * 2, (nsize - 1) * 2] );

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
    let layers = [ [ [MBase.startTile[0], MBase.startTile[1], 0] ] ];
    let finalpath = null;
    let isFinished = false;

    // 2d array of maze tiles for keeping
    // track of what tiles have been reached
    let reached = [];
    for (let x = 0; x < MBase.size; x++){
        reached[x] = [];
        for (let y = 0; y < MBase.size; y++){
            reached[x][y] = false;
        }
    }

    // set starting tile as having been reached
    reached[MBase.startTile[0]][MBase.startTile[1]] = true;

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
                if (!MBase.inBounds(dtile)) {
                    continue;
                }

                let mvalue = MBase.maze[dtile[0]][dtile[1]];

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
                    MBase.setAndRender(dtile, 4);
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

export {createMaze, solveMaze};
