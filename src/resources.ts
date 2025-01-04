// resources.ts
import { ImageSource, Loader, Sprite, SpriteSheet } from "excalibur";
import occluder from "./Assets/occlusion.png"; // replace this
import test from "./Assets/test.png";

export const Resources = {
  occluder: new ImageSource(occluder),
  test: new ImageSource(test),
};

export const loader = new Loader();

for (let res of Object.values(Resources)) {
  loader.addResource(res);
}
