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
 * each of the parent bacteria and but its own starting energy also becomes
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
 * Matrix world is the world.  A cell with value 0 is empty.  A cell with
 * value -1 is occupied by a bacterium.  A cell with value greater than
 * zero contains food with the amount of energy indicated by that number.
 * 
 * Food will be randomly created at time intervals - this logic is TBD.
 * 
 * * Genetics description
 * Bacterium's genetics involves two 
 * 
 * ! Code documentation
 * Main functions and variables
 * - Screen canvas:
 *   - maxX, maxY, halfX, halfY
 *   - container (PIXI.Container())
 * - Bacteria - general properties:
 *   - eS - energy usage rate per "frame."
 *   - eM - energy amount that is transfered to a child bacterium.
 *   - eR - energy restored per frame while sleeping.
 * - Bacterium specific properties (not genetic):
 *   - eCurrent - current level of energy.
 *   - mov1u, mov1d, mov1l, mov1r - which direction the bacterium moved 
 *     1 frame ago (up, down, left, right) - indicators.
 *   - mov2_, mov3_, mov4_, mov5_ - as above but 2, 3, 4, 5 frames ago,
 *     and "_" can be u, d, l, r.
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

let world = new Array(100).fill(Array(100).fill(0));
let eM = 50;
let eS = 1;
let eR = 2;

// #endregion
/////////////////////////////////////////////////////////////////////////////////

//#region Bacterium

class Bacterium{
  constructor(startX, startY, startE, startGenes) {
    // Find suitable location for the bacterium
    let successfullyCreated = false;
    if (world[startY][startX] > -1) {
      this.X = startX;1
      this.Y = startY;
      successfullyCreated = true;
    }
    else {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (world[j][i] > -1) {
            this.X = i;
            this.Y = j;
            successfullyCreated = true;
          }
        }
      }
    }
    // Check whether location was found
    if (!successfullyCreated) {
        //TODO kill bacterium that is at startY,startX
    }
    
    this.eCurrent = startE;
    this.mov1u = this.mov1d = this.mov1l = this.mov1r = 0;
    this.mov2u = this.mov2d = this.mov2l = this.mov2r = 0;
    this.mov3u = this.mov3d = this.mov3l = this.mov3r = 0;
    this.mov4u = this.mov4d = this.mov4l = this.mov4r = 0;
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
  }

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


});
//#endregion