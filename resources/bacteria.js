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
 *   -----------------------------------------   >  x3
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
 *   - mov1u, mov1d, mov1l, mov1r - which direction the bacterium moved 
 *     1 frame ago (up, down, left, right) - indicators.
 *   - mov2_, mov3_, mov4_, mov5_ - as above but 2, 3, 4, 5 frames ago,
 *     and "_" can be u, d, l, r.
 * - Bacterium specific properties (not genetic):
 *   - eCurrent - current level of energy.
 * - Bacterium specific properties (genetics):
 *   - eMultiplyLevel - energy required to multiply.
 *   - x1 in [0,1]
 *   - x2 in [0,1]
 *   - x3 in [0,1]
 *   - xDNd in [0,1]; D in {U,D,L,R}, N in [1..5], d in {U,D,L,R}
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