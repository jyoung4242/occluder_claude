// main.ts
import "./style.css";

import { UI } from "@peasy-lib/peasy-ui";
import { Engine, DisplayMode, ExcaliburGraphicsContextWebGL, ImageSource, ImageWrapping, Loader } from "excalibur";
import { model, template } from "./UI/UI";
import { LightingPostProcessor } from "./Lib/coursePostProcessor";
import { loader } from "./resources";

export let occluder = new ImageSource("occlusion.png", {
  wrapping: ImageWrapping.Repeat,
});

await UI.create(document.body, model, template).attached;

const game = new Engine({
  width: 800, // the width of the canvas
  height: 600, // the height of the canvas
  canvasElementId: "cnv", // the DOM canvas element ID, if you are providing your own
  displayMode: DisplayMode.Fixed, // the display mode
  pixelArt: true,
});
console.log(game.graphicsContext);
await game.start(new Loader([occluder]));

let myPP = new LightingPostProcessor(game.graphicsContext as ExcaliburGraphicsContextWebGL);
game.graphicsContext.addPostProcessor(myPP);
