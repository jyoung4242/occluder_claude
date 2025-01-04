import * as ex from "excalibur";
import { loader, Resources } from "./resources";
import { occlusionShader } from "./Lib/occlusionshader";

var occluder = new ex.ImageSource("test.png", {
  wrapping: ex.ImageWrapping.Repeat,
});

let shader = occlusionShader;

class LightingPostProcessor implements ex.PostProcessor {
  private _shader: ex.ScreenShader | undefined;
  gctx: ex.ExcaliburGraphicsContextWebGL;
  texture: WebGLTexture;

  constructor(public graphicsContext: ex.ExcaliburGraphicsContextWebGL) {
    this.gctx = graphicsContext;
    this.texture = this.graphicsContext.textureLoader.load(occluder.image, {}, true) as WebGLTexture;
    console.log(occluder);

    console.log(this.texture);
  }

  initialize(gl: WebGL2RenderingContext): void {
    this._shader = new ex.ScreenShader(gl, shader);
  }
  getLayout(): ex.VertexLayout {
    //@ts-expect-error
    return this._shader.getLayout();
  }
  getShader(): ex.Shader {
    //@ts-expect-error
    return this._shader.getShader();
  }
  onUpdate(elapsed: number): void {
    let myShader = this._shader?.getShader();
    if (myShader) {
      this.gctx.textureLoader.load(occluder.image);
      myShader.setTexture(1, this.texture as WebGLTexture);
      myShader.trySetUniformFloatVector("u_texturePosition", new ex.Vector(400.0, 300.0));
      myShader.trySetUniformFloatVector("u_textureSize", new ex.Vector(64.0, 64.0));
      myShader.trySetUniformInt("u_myOcclusionTexture", 1);
      myShader.trySetUniformFloat("uLightIntensity", 0.75);
      myShader.trySetUniformFloatVector("uLightPosition", new ex.Vector(100.0, 100.0));
    }
  }

  /*   onDraw() {
    let myShader = this._shader?.getShader();
    if (myShader) {
      this.gctx.textureLoader.load(occluder.image);
      myShader.setTexture(1, this.texture as WebGLTexture);
      myShader.trySetUniformFloatVector("u_texturePosition", new ex.Vector(100.0, 100.0));
      myShader.trySetUniformFloatVector("u_textureSize", new ex.Vector(64.0, 64.0));
      myShader.trySetUniformInt("u_myTexture", 1);
    }
  } */
}

var game = new ex.Engine({
  width: 600,
  height: 400,
  displayMode: ex.DisplayMode.FitScreenAndFill,
});

var actor = new ex.Actor({
  width: 100,
  height: 100,
  color: ex.Color.Red,
});

game.currentScene.add(actor);

var ctx = game.graphicsContext as ex.ExcaliburGraphicsContextWebGL;
await game.start(loader);

occluder = Resources.occluder;

var myPP = new LightingPostProcessor(game.graphicsContext as ex.ExcaliburGraphicsContextWebGL);
game.graphicsContext.addPostProcessor(myPP);

/* Image Shader
`#version 300 es
  precision highp float;
  
  uniform sampler2D u_image;  // Default texture slot
  uniform sampler2D u_myTexture;  // Slot 2 texture
  
  uniform vec2 u_resolution;
  uniform vec2 u_texturePosition; // Position of the second texture
  uniform vec2 u_textureSize;     // Size of the second texture
  
  in vec2 v_uv;
  out vec4 fragColor;
  
  void main() {
      vec2 pixelCoord = v_uv * u_resolution;
      vec2 adjustedUV = (pixelCoord - u_texturePosition) / u_textureSize;
      
      vec4 defaultColor = texture(u_image, v_uv);
      vec4 secondTexture = texture(u_myTexture, adjustedUV);
      vec4 endColor = mix(defaultColor, secondTexture, secondTexture.a);
      //fragColor = vec4(endColor.rgb * endColor.a, endColor.a);
      
      fragColor = vec4(secondTexture.rgb * secondTexture.a, secondTexture.a);
      
  }
  `; 
  
  */
