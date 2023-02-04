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
 * ! Code documentation
 * Main functions and variables
 * - Screen canvas:
 *   - maxX, maxY, halfX, halfY
 *   - container (PIXI.Container())
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