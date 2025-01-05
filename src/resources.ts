// resources.ts
import { ImageSource, Loader, Sprite, SpriteSheet } from "excalibur";
import occluder from "./Assets/occlusion.png"; // replace this
import test from "./Assets/test.png";
import occluder0 from "./Assets/occlusion0.png"; // replace this
import occluder1 from "./Assets/occlusion1.png"; // replace this
import occluder2 from "./Assets/occlusion2.png"; // replace this
import occluder3 from "./Assets/occlusion3.png"; // replace this
import occluder4 from "./Assets/occlusion4.png"; // replace this
import occluder5 from "./Assets/occlusion5.png"; // replace this
import occluder6 from "./Assets/occlusion6.png"; // replace this
import occluder7 from "./Assets/occlusion7.png"; // replace this

export const Resources = {
  occluder: new ImageSource(occluder),
  test: new ImageSource(test),
  occluder0: new ImageSource(occluder0),
  occluder1: new ImageSource(occluder1),
  occluder2: new ImageSource(occluder2),
  occluder3: new ImageSource(occluder3),
  occluder4: new ImageSource(occluder4),
  occluder5: new ImageSource(occluder5),
  occluder6: new ImageSource(occluder6),
  occluder7: new ImageSource(occluder7),
};

export const loader = new Loader();

for (let res of Object.values(Resources)) {
  loader.addResource(res);
}
