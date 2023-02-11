//#region Documentation

/**
 * *Dev Notes
 * 2023-02-04
 * Initiated project
 * 
 * Better Comments reference
 * * Important
 * ! Red
 * ? question
 * TODO orange
 * @param blue
 * 
 * ! Project description
 * Simulate simple bacteria.  Bacteria multiply when they have enough energy.
 * But it takes two bacteria to create a child bacterium (regardles 
 * of whether that is biologically true in the real world :) ).
 * They need to eat and rest.  We will code our bacteria with a simple naive
 * logic that dictates what a bacterium is supposed to do next based on its 
 * current status.  Current status includes the following properties:
 * - Energy level (0-100).
 * - Matter level (0-100).
 * Bacteria can do one of three actions at any given time:
 * - Scavenge action.
 * - Sleep action.
 * - Multiply
 * When bacteria scavenges, it moves around the screen searching for food.  
 * When it sleeps, it processes food turning it into energy.  Energy is req-
 * uired to multiply and to scavenge.  Multiplying uses up M amount of energy
 * while scavenging uses up energy at rate S.  Bacteria can multiply only
 * while they are in scavenge mode.  Two bacteria that are ready to multiply
 * and that are in scavenge mode will multiply when they come across one 
 * another (neighboring cells;  each cell has eight neighbors).  
 * When two bacteria multiply, another bacterium is immediately created 
 * using genetic algorithm.  The new bacterium received eM energy from 
 * each of the parent bacteria but its own starting energy also becomes
 * eM.
 * 
 * * Bacterium's life algorithm
 * Ready to multiply IFF:
 *   eCurrent > eMultiplyLevel
 * 
 * Perform sleep action IFF:
 *     (eCurrent * x1 + eMultiplyLevel * x2)
 *   ----------------------------------------- * 100  >  x3
 *   (2 * eCurrent * x1 * eMultiplyLevel * x2) 
 * 
 * Otherwise, scavenge.
 * 
 * * Scavenging rules (motion rules)
 * Movement is encoded using variables movND where N is a number indicating
 * how many frames ago and D is a character indicating direction.  For ex-
 * ample, mov1u==1 means that 1 frame ago, the bacterium moved up
 * (and in this example, mov1d, mov1l, mov1r all must be 0).
 * 
 * Next move formula:
 * Calculate movU, movD, movL, movR and select the direction
 * that has the highest score.
 * 
 * movU = Sum(movNd * xUNd, for each N and d)
 * movD = Sum(movNd * xDNd, for each N and d)
 * ...
 * 
 * If the destination cell is occupied by another bacterium,
 * this bacterium will not move and move history will be recorded 
 * as a no-move.  If the destination cell is empty or contains  food,
 * this bacterium will move and consume any available food.
 * 
 * * World logic
 * Two world matrices are used:
 * - world - general map of what is where.
 * - bacteria - map of bacteria locations.  Each cell stores a bacteria
 *   object (or is empty).
 * 
 * More about the world matrix:
 * Matrix world is the world.  A cell with value 0 is empty.  A cell with
 * value -1 is occupied by a bacterium.  A cell with value greater than
 * zero contains food with the amount of energy indicated by that number.
 * 
 * Food will be randomly created at time intervals - this logic is TBD.
 * 
 * * Turn description
 * Every main loop iteration is a turn in the game.  Actions are executed
 * in the following order:
 * 1. For each bacterium:
 *   1.1. If readyToMultiply, check if there are neighbors who are also
 *        ready.  If so, multiply and update both bacteria's energies.
 * *2. Scan the map and up all food sources by a point.
 * *3. Generate new food sources.
 * 4. For each bacterium:
 *   4.1. Perform movement and eat. Together to simplify management
 *        of the world matrix - otherwise would need to have separate
 *        matrices or dimension for energy and for bacteria.
 * 
 * * Directions
 * Up is smaller values of y.
 * Down is larger values of y.
 * 
 * ! Code documentation
 * Main functions and variables
 * - Screen canvas:
 *   - maxX, maxY, halfX, halfY
 *   - container (PIXI.Container())
 * 
 * - Bacteria - general properties:
 *   - eS - energy usage rate per "frame."
 *   - eM - energy amount that is transfered to a child bacterium.
 *   - eR - energy restored per frame while sleeping.
 * 
 * - Bacterium specific properties (not genetic):
 *   - eCurrent - current level of energy.
 *   - readyToMultiply 0/1 indicator if ready to multiply
 *   - mov1u, mov1d, mov1l, mov1r - which direction the bacterium moved 
 *     1 frame ago (up, down, left, right) - indicators.
 *   - mov2_, mov3_, mov4_, mov5_ - as above but 2, 3, 4, 5 frames ago,
 *     and "_" can be u, d, l, r.
 *   - action in {'sleep','move'}
 *   - X, Y - current position.
 * 
 * - Bacterium specific properties (genetics):
 *   - eMultiplyLevel in [0..100] - energy required to multiply.
 *   - x1 in [0,100]
 *   - x2 in [0,100]
 *   - x3 in [0,100]
 *   - xDNd in [0,100]; D in {U,D,L,R}, N in [1..5], d in {U,D,L,R}
 */

//#endregion

/////////////////////////////////////////////////////////////////////////////////
//#region Helper functions
/**
 * *Poisson Distribution
 * 
 * https://stackoverflow.com/questions/1241555/algorithm-to-generate-poisson-and-binomial-random-numbers
 */

 function randPoisson(lambda) {
  let L = Math.exp(-lambda);
  let p = 1.0;
  let k = 0;

  do {
      k++;
      p *= Math.random();
  } while (p > L);
  return k - 1;
}

function indexOfMax(arr) {
  if (arr.length === 0) {
      return -1;
  }

  var max = arr[0];
  var maxIndex = 0;

  for (var i = 1; i < arr.length; i++) {
      if (arr[i] > max) {
          maxIndex = i;
          max = arr[i];
      }
  }

  return maxIndex;
}

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region PixiJs setup
/**
 * * PixiJS setup.
 */

const app = new PIXI.Application({
  autoResize: true,
  resolution: devicePixelRatio,
  backgroundColor: 0x3d3b49
});
document.querySelector('#frame').appendChild(app.view);

let maxX = app.screen.width;
let maxY = app.screen.height;
let halfX = maxX/2.;
let halfY = maxY/2.;

// Resize function window
function resize() {

  // Get the p
  const parent = app.view.parentNode;

  // Listen for window resize events
  window.addEventListener('resize', resize);

  // Resize the renderer
  app.renderer.resize(parent.clientWidth, parent.clientHeight);

  // You can use the 'screen' property as the renderer visible
  // area, this is more useful than view.width/height because
  // it handles resolution
  //rect.position.set(app.screen.width, app.screen.height);
  maxX = app.screen.width;
  maxY = app.screen.height;
  halfX = maxX/2.;
  halfY = maxY/2.;

}

resize();

let container = new PIXI.Container();

// #endregion
/////////////////////////////////////////////////////////////////////////////////
//#region Branding
/**
 * *Branding
 */
const style = new PIXI.TextStyle({
  fontFamily: 'Courier New',
  fontSize: 36,
  //fontStyle: 'italic',
  //fontWeight: 'bold',
  //fill: ['#ffffff', '#00ff99'], // gradient
  fill: '#33ff00',
  //stroke: '#4a1850',
  strokeThickness: 0,
  //dropShadow: true,
  //dropShadowColor: '#000000',
  //dropShadowBlur: 4,
  //dropShadowAngle: Math.PI / 6,
  //dropShadowDistance: 6,
  //wordWrap: true,
  //wordWrapWidth: 440,
  lineJoin: 'round',
});

const logo = new PIXI.Text('0xhwatmos', style);
logo.x = 10;
logo.y = 10;
logo.interactive = true;
logo.on('pointerdown', (event) => { console.log('clicked!'); });

app.stage.addChild(logo);

// #endregion
/////////////////////////////////////////////////////////////////////////////////

//#region Setup
/**
 * *Setup
 */

let maxWorldX = 100;
let maxWorldY = 100;
let world = new Array(maxWorldY).fill(Array(maxWorldX).fill(0));
let bacteria = new Array(maxWorldY).fill(Array(maxWorldX));
for (let i=0; i<maxWorldY; i++) {
  for (let j=0; j<maxWorldX; j++) {
    bacteria[i][j] = [];
  }
}
let eM = 50;
let eS = 1;
let eR = 2;

// #endregion
/////////////////////////////////////////////////////////////////////////////////

//#region Bacterium

class Bacterium{
  constructor(startX, startY, startE, startGenes) {
    // Find suitable location for the bacterium
    // If no suitable location is found, kill the bacterium that
    // already exists at the start location.
    let successfullyCreated = false;
    if (world[startY][startX] > -1) {
      this.X = startX;
      this.Y = startY;
      successfullyCreated = true;
    }
    else {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          newY = startY + i;
          newY = (newY>=100) ? newY-100 : newY;
          newY = (newY<0) ? newY+100 : newY;
          newX = startX + j;
          newX = (newX>=100) ? newX-100 : newX;
          newX = (newX<0) ? newX+100 : newX;
          if (world[newY][newX] > -1) {
            this.Y = newY;
            this.X = newX;
            world[this.Y][this.X] = -1;
            successfullyCreated = true;
          }
        }
      }
    }
    // Check whether location was found
    if (!successfullyCreated) {
      // Kill this bacteria and the one that already exists at the calculated
      // start location.  However, need to start with the other bacteria
      // to avoid destroying reference to it if this is killed first
      bacteria[startY][startX][0].kill(time,timeDelta);
      this.kill(time,timeDelta);
    }

    // Genetics:
    this.genes = startGenes;
    // Decipher genes:
    this.x1 = this.genes[0];
    this.x2 = this.genes[1];
    this.x3 = this.genes[2]; 
    this.eMultiplyLevel = this.genes[3];
    //
    this.xU1u = this.genes[4];
    this.xU1r = this.genes[5];
    this.xU1d = this.genes[6];
    this.xU1l = this.genes[7];
    
    this.xR1u = this.genes[8];
    this.xR1r = this.genes[9];
    this.xR1d = this.genes[10];
    this.xR1l = this.genes[11];

    this.xD1u = this.genes[12];
    this.xD1r = this.genes[13];
    this.xD1d = this.genes[14];
    this.xD1l = this.genes[15];

    this.xL1u = this.genes[16];
    this.xL1r = this.genes[17];
    this.xL1d = this.genes[18];
    this.xL1l = this.genes[19];
    //
    this.xU2u = this.genes[20];
    this.xU2r = this.genes[21];
    this.xU2d = this.genes[22];
    this.xU2l = this.genes[23];
    
    this.xR2u = this.genes[24];
    this.xR2r = this.genes[25];
    this.xR2d = this.genes[26];
    this.xR2l = this.genes[27];

    this.xD2u = this.genes[28];
    this.xD2r = this.genes[29];
    this.xD2d = this.genes[30];
    this.xD2l = this.genes[31];

    this.xL2u = this.genes[32];
    this.xL2r = this.genes[33];
    this.xL2d = this.genes[34];
    this.xL2l = this.genes[35];
    //
    this.xU3u = this.genes[36];
    this.xU3r = this.genes[37];
    this.xU3d = this.genes[38];
    this.xU3l = this.genes[39];
    
    this.xR3u = this.genes[40];
    this.xR3r = this.genes[41];
    this.xR3d = this.genes[42];
    this.xR3l = this.genes[43];

    this.xD3u = this.genes[44];
    this.xD3r = this.genes[45];
    this.xD3d = this.genes[46];
    this.xD3l = this.genes[47];

    this.xL3u = this.genes[48];
    this.xL3r = this.genes[49];
    this.xL3d = this.genes[50];
    this.xL3l = this.genes[51];
    //
    this.xU4u = this.genes[52];
    this.xU4r = this.genes[53];
    this.xU4d = this.genes[54];
    this.xU4l = this.genes[55];
    
    this.xR4u = this.genes[56];
    this.xR4r = this.genes[57];
    this.xR4d = this.genes[58];
    this.xR4l = this.genes[59];

    this.xD4u = this.genes[60];
    this.xD4r = this.genes[61];
    this.xD4d = this.genes[62];
    this.xD4l = this.genes[63];

    this.xL4u = this.genes[64];
    this.xL4r = this.genes[65];
    this.xL4d = this.genes[66];
    this.xL4l = this.genes[67];
    //
    this.xU5u = this.genes[68];
    this.xU5r = this.genes[69];
    this.xU5d = this.genes[70];
    this.xU5l = this.genes[71];
    
    this.xR5u = this.genes[72];
    this.xR5r = this.genes[73];
    this.xR5d = this.genes[74];
    this.xR5l = this.genes[75];

    this.xD5u = this.genes[76];
    this.xD5r = this.genes[77];
    this.xD5d = this.genes[78];
    this.xD5l = this.genes[79];

    this.xL5u = this.genes[80];
    this.xL5r = this.genes[81];
    this.xL5d = this.genes[82];
    this.xL5l = this.genes[83];
    // Non-genetic properties
    this.action = 'sleep';
    this.eCurrent = startE;
    this.readyToMultiply = this.eCurrent >= this.eMultiplyLevel;
    this.mov1u = this.mov1d = this.mov1l = this.mov1r = 0;
    this.mov2u = this.mov2d = this.mov2l = this.mov2r = 0;
    this.mov3u = this.mov3d = this.mov3l = this.mov3r = 0;
    this.mov4u = this.mov4d = this.mov4l = this.mov4r = 0;
    this.mov5u = this.mov5d = this.mov5l = this.mov5r = 0;

    this.decideAction = function(time, timeDelta) {
      this.readyToMultiply = this.eCurrent >= this.eMultiplyLevel;
      let decisionScore = (this.eCurrent * this.x1 + this.eMultiplyLevel * this.x2)
          decisionScore = decisionScore/(2*this.eCurrent*this.eMultiplyLevel*this.x2)
          decisionScore = decisionScore*100;
      if (decisionScore > this.x3) {
        this.action = 'sleep';
      } else {
        this.action = 'move';
      }
      this.performAction(time,timeDelta);
    }

    this.performAction = function(time, timeDelta) {
      if (this.action == 'sleep') {
        this.sleep(time,timeDelta) 
      } else if (this.action == 'move') {
        this.move(time,timeDelta)
      }
    }

    this.sleep = function(time, timeDelta) {
      this.eCurrent +=  eR;
    }

    this.move = function(time,timeDelta) {
      // Calculate direction scores
      let scoreU = scoreR = scoreD = scoreL = 0;
      scoreU = 0 +
               this.mov1u * this.xU1u +
               this.mov1r * this.xU1R +
               this.mov1d * this.xU1D +
               this.mov1l * this.xU1L +

               this.mov2u * this.xU2u +
               this.mov2r * this.xU2R +
               this.mov2d * this.xU2D +
               this.mov2l * this.xU2L +

               this.mov3u * this.xU3u +
               this.mov3r * this.xU3R +
               this.mov3d * this.xU3D +
               this.mov3l * this.xU3L +

               this.mov4u * this.xU4u +
               this.mov4r * this.xU4R +
               this.mov4d * this.xU4D +
               this.mov4l * this.xU4L +

               this.mov5u * this.xU5u +
               this.mov5r * this.xU5R +
               this.mov5d * this.xU5D +
               this.mov5l * this.xU5L;
      scoreR = 0 +
               this.mov1u * this.xR1u +
               this.mov1r * this.xR1R +
               this.mov1d * this.xR1D +
               this.mov1l * this.xR1L +

               this.mov2u * this.xR2u +
               this.mov2r * this.xR2R +
               this.mov2d * this.xR2D +
               this.mov2l * this.xR2L +

               this.mov3u * this.xR3u +
               this.mov3r * this.xR3R +
               this.mov3d * this.xR3D +
               this.mov3l * this.xR3L +

               this.mov4u * this.xR4u +
               this.mov4r * this.xR4R +
               this.mov4d * this.xR4D +
               this.mov4l * this.xR4L +

               this.mov5u * this.xR5u +
               this.mov5r * this.xR5R +
               this.mov5d * this.xR5D +
               this.mov5l * this.xR5L;
      scoreD = 0 +
               this.mov1u * this.xD1u +
               this.mov1r * this.xD1R +
               this.mov1d * this.xD1D +
               this.mov1l * this.xD1L +

               this.mov2u * this.xD2u +
               this.mov2r * this.xD2R +
               this.mov2d * this.xD2D +
               this.mov2l * this.xD2L +

               this.mov3u * this.xD3u +
               this.mov3r * this.xD3R +
               this.mov3d * this.xD3D +
               this.mov3l * this.xD3L +

               this.mov4u * this.xD4u +
               this.mov4r * this.xD4R +
               this.mov4d * this.xD4D +
               this.mov4l * this.xD4L +

               this.mov5u * this.xD5u +
               this.mov5r * this.xD5R +
               this.mov5d * this.xD5D +
               this.mov5l * this.xD5L;
      scoreL = 0 +
               this.mov1u * this.xL1u +
               this.mov1r * this.xL1R +
               this.mov1d * this.xL1D +
               this.mov1l * this.xL1L +

               this.mov2u * this.xL2u +
               this.mov2r * this.xL2R +
               this.mov2d * this.xL2D +
               this.mov2l * this.xL2L +

               this.mov3u * this.xL3u +
               this.mov3r * this.xL3R +
               this.mov3d * this.xL3D +
               this.mov3l * this.xL3L +

               this.mov4u * this.xL4u +
               this.mov4r * this.xL4R +
               this.mov4d * this.xL4D +
               this.mov4l * this.xL4L +

               this.mov5u * this.xL5u +
               this.mov5r * this.xL5R +
               this.mov5d * this.xL5D +
               this.mov5l * this.xL5L;
      maxScore = Math.max(scoreU,scoreR,scoreD,scoreL);
      // Select direction
      nextIsU=nextIsR=nextIsD=nextIsL=0;
      switch (maxScore) {
        case scoreU: nextIsU = 1;
        case scoreR: nextIsR = 1;
        case scoreD: nextIsD = 1;
        case scoreL: nextIsL = 1;
      }
      // This will eliminate movement if opposing directions' scores are the same
      // (They cancel out)
      xDelta = nextIsR - nextIsL;
      yDelta = nextIsD - nextIsU;
      // Destination cells:
      xDestination = this.X;
      yDestination = this.Y;
      if (this.X + xDelta >= 100) {
        xDestination = this.X + xDelta - 100;
      } else if (this.X + xDelta < 0 ) {
        xDestination = this.X + xDelta + 100;
      }
      if (this.Y + yDelta >= 100) {
        yDestination = this.Y + yDelta - 100;
      } else if (this.Y + yDelta < 0 ) {
        yDestination = this.Y + yDelta + 100;
      }
      // Move if possible
      prevX = this.X;
      prevY = this.Y;
      if (world[yDestination][xDestination] >= 0) {
        this.X = xDestination;
        this.Y = yDestination;
        bacteria[this.X][this.Y].push(bacteria[prevY][prevX].splice(0,1)[0]);
      }
      // Update move history - will update even if the move was blocked
      this.updateMoveHistory(nextIsU,nextIsR,nextIsD,nextIsL,time,timeDelta);
      // Reduce energy due to movement
      this.eCurrent -= eS;
      if (this.eCurrent<=0) {
        this.kill();
      }
      // Eat if possible
      this.eat(time,timeDelta);
      // Update my location on the map:
      world[prevY][trevX] = 0;
      world[this.X][this.Y] = -1;
    }

    this.updateMoveHistory = function(u,r,d,l,time,timeDelta) {
      this.mov5u = this.mov4u;
      this.mov5r = this.mov4r;
      this.mov5d = this.mov4d;
      this.mov5l = this.mov4l;

      this.mov4u = this.mov3u;
      this.mov4r = this.mov3r;
      this.mov4d = this.mov3d;
      this.mov4l = this.mov3l;

      this.mov3u = this.mov2u;
      this.mov3r = this.mov2r;
      this.mov3d = this.mov2d;
      this.mov3l = this.mov2l;

      this.mov2u = this.mov1u;
      this.mov2r = this.mov1r;
      this.mov2d = this.mov1d;
      this.mov2l = this.mov1l;

      this.mov1u = u;
      this.mov1r = r;
      this.mov1d = d;
      this.mov1l = l;
    }

    this.eat = function(time,timeDelta) {
      this.eCurrent += world[this.Y][this.X]
      world[this.Y][this.X] = 0
    }

    this.kill = function(time,timeDelta) {
      world[this.Y][this.X] = 0; // update the world
      bacteria[this.Y][this.X].splice(0,1); // kill reference to this bacterium and
      // other bacteria here (may happen when this bacterium was just born from
      // a multiplication process.)
      this.destroy(); // distroy this object
    }

  }

}

// #endregion
/////////////////////////////////////////////////////////////////////////////////

//#region Other Logic

function geneticAlgorithm(genes1,genes2) {
  // For now, just return first parent's genes
  return genes1;
}

// #endregion
/////////////////////////////////////////////////////////////////////////////////

//#region Game loop

app.stage.addChild(container);
/**
 * *Game Loop
 */

// Add a ticker callback to move the sprites
let elapsed = 0.0;
app.ticker.add((delta) => {
    elapsed += delta;

    // Multiply bacteria
    for (let i=0; i < maxWorldY; i++) { // map y
      for (let j = 0; j < maxWorldX; j++) { // map x
        // Scan surroundings to see if there are neighbors
        // but only if there is a bacterium HERE and if it is ready to multiply
        if (world[i][j]==-1) {
          if (bacteria[i][j].readyToMultiply && bacteria[i][j].action=='move') {
            for (let ii=-1;ii<=1;ii++) {
              // Calculate neighbor Y by considering edges of the map
              tempNeighborY = i + ii;
              neighborY = (tempNeighborY >= maxWorldY) ? tempNeighborY - 100 : tempNeighborY;
              neighborY = (neighborY < 0) ? neighborY + 100 : neighborY;
              for (let jj=-1;jj<=1;jj++) {
                // Calculate neighbor X by considering edges of the map
                tempNeighborX = j + jj;
                neighborX = (tempNeighborX >= maxWorldX) ? tempNeighborX - 100 : tempNeighborX;
                neighborX = (neighborX < 0) ? neighborX + 100 : neighborX;
                
                // Check for a neighbor and multiply
                if (world[neighborY][neighborX] == -1){
                  if (bacteria[neighborY][neighborX].readyToMultiply && bacteria[neighborY][neighborX].action=='move') {
                    // Reduce energies of the parents
                    bacteria[i][j].eCurrent -= eM;
                    bacteria[neighborY][neighborX].eCurrent -= eM;
                    // Combine genes
                    genes1 = bacteria[i][j].genes;
                    genes2 = bacteria[neighborY][neighborX].genes;
                    newGenes = geneticAlgorithm(genes1,genes2)
                    // Create new bacterium
                    bacteria[i][j].push(new Bacterium(j,i,eM,newGenes))
                  }
                }
              }
            }
          }
        }
      }
    }

    // Perform bacteria movement
    for (let i=0; i < maxWorldY; i++) {
      for (let j = 0; j < maxWorldX; j++) {
        if (world[i][j] == -1) {
          bacteria[i][j].move(elapsed,delta);
        }
      }
    }

});
//#endregion