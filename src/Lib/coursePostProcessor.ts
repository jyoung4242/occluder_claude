import { ExcaliburGraphicsContextWebGL, ImageSource, ImageWrapping, PostProcessor, ScreenShader, Vector } from "excalibur";
import { Resources } from "../resources";
import { occluder } from "../oldmain";

let shader = `#version 300 es
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
    fragColor = vec4(endColor.rgb * endColor.a, endColor.a);
    
    fragColor = vec4(secondTexture.rgb * secondTexture.a, secondTexture.a);
    
}
`;

export class LightingPostProcessor implements PostProcessor {
  private _shader: ScreenShader | undefined;
  gctx: ExcaliburGraphicsContextWebGL;
  texture: WebGLTexture;

  constructor(public graphicsContext: ExcaliburGraphicsContextWebGL) {
    this.gctx = graphicsContext;
    this.texture = this.graphicsContext.textureLoader.load(
      occluder.image,
      { wrapping: { x: ImageWrapping.Repeat, y: ImageWrapping.Repeat } },
      true
    ) as WebGLTexture;
    console.log(Resources.test);

    console.log(this.texture);
  }

  initialize(gl: WebGL2RenderingContext): void {
    this._shader = new ScreenShader(gl, shader);
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
      myShader.setTexture(1, this.texture as WebGLTexture);
      myShader.trySetUniformInt("u_myTexture", 1);
      myShader.trySetUniformFloatVector("u_texturePosition", new Vector(100.0, 100.0));
      myShader.trySetUniformFloatVector("u_textureSize", new Vector(400.0, 100.0));
    }
  }
}

/*
occluder shader

#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform vec2 uLightPosition;
uniform float uLightIntensity;

const float EPSILON = 0.001; // Global EPSILON in UV space

// Structure to represent an occluder
struct Occluder {
    vec2 position;
    vec2 size;
    float radius;
};

// SDF for a rounded rectangle occluder
float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Calculate shadow based on occluder
float calculateShadow(vec2 point, Occluder occluder) {
    vec2 lightToPoint = point - uLightPosition;
    float rayLength = length(lightToPoint);
    vec2 rayDir = lightToPoint / rayLength;
    
    float shadow = 1.0;
    
    const int MAX_STEPS = 32;
    
    vec2 currentPos = uLightPosition;
    float remainingDistance = rayLength;
    
    for(int i = 0; i < MAX_STEPS && remainingDistance > EPSILON; i++) {
        float dist = sdRoundedBox(
            currentPos - occluder.position,
            occluder.size * 0.5,
            occluder.radius
        );
        
        float distUV = dist / length(u_resolution);
        
        if (distUV < EPSILON) {
            shadow = 0.0;
            break;
        }
        
        float marchDist = min(dist, remainingDistance);
        currentPos += rayDir * marchDist;
        remainingDistance -= marchDist;
    }
    
    return shadow;
}

void main() {
    vec2 pixelCoord = v_uv * u_resolution;
    
    // Define an occluder
    Occluder occluder;
    occluder.position = u_resolution * 0.5;  // Center of screen
    occluder.size = vec2(100.0, 100.0);     // Size in pixels
    occluder.radius = 10.0;
    
    // Calculate shadow
    float shadow = calculateShadow(pixelCoord, occluder);
    
    // Calculate light falloff
    float distance = length(pixelCoord - uLightPosition);
    float falloff = 1.0 / (1.0 + distance * 0.003); // Adjusted falloff factor for better visibility
    
    // Combine lighting with shadow and intensity
    vec3 lightColor = vec3(1.0); // White light - could be made into a uniform for colored lights
    vec3 finalColor = lightColor * falloff * shadow * uLightIntensity;
    
    fragColor = vec4(finalColor, 1.0);
}


*/

/* function _loadImageSource(image: ImageSource, gcTx: ExcaliburGraphicsContext) {
  const imageElement = image.image;
  const maybeFiltering = imageElement.getAttribute(ImageSourceAttributeConstants.Filtering);
  const filtering = maybeFiltering ? parseImageFiltering(maybeFiltering) : undefined;
  const wrapX = parseImageWrapping(imageElement.getAttribute(ImageSourceAttributeConstants.WrappingX) as any);
  const wrapY = parseImageWrapping(imageElement.getAttribute(ImageSourceAttributeConstants.WrappingY) as any);

  const force = imageElement.getAttribute("forceUpload") === "true" ? true : false;
  const texture = gcTx.textureLoader.load(
    imageElement,
    {
      filtering,
      wrapping: { x: wrapX, y: wrapY },
    },
    force
  );
  // remove force attribute after upload
  imageElement.removeAttribute("forceUpload");
  if (!this._textures.has(image)) {
    this._textures.set(image, texture!);
  }

  return texture;
} */

/*
  #version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution; // The texture resolution for scaling


in vec2 v_uv;        // Texture coordinates
out vec4 fragColor;

void main() {
    vec2 texelSize = 1.0 / u_resolution;

    // Current pixel value
    float center = texture(u_texture, v_uv).r;

    // Sample neighbors to detect edges
    float left   = texture(u_texture, v_uv + vec2(-texelSize.x, 0)).r;
    float right  = texture(u_texture, v_uv + vec2(texelSize.x, 0)).r;
    float up     = texture(u_texture, v_uv + vec2(0, texelSize.y)).r;
    float down   = texture(u_texture, v_uv + vec2(0, -texelSize.y)).r;

    // Compute gradients (approximation of distance direction)
    vec2 gradient = vec2(right - left, up - down);

    // Signed distance approximation (directional gradient length)
    float distance = length(gradient);

    // Create SDF effect: distance to edge (scale as needed)
    float sdf = 1.0 - smoothstep(0.0, 1.0, distance * 5.0);

    // Output SDF as grayscale
    fragColor = vec4(vec3(sdf), 1.0);
}
  */

/*
//occlusion shader
#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform vec2 uLightPosition;
uniform float uLightIntensity;

uniform sampler2D u_image;
uniform sampler2D u_occluder;  


const float EPSILON = 0.001; // Global EPSILON in UV space
const float AMBIENT_INTENSITY = 0.1; // Adjust this value to control ambient light level

// Structure to represent an occluder
struct Occluder {
    vec2 position;
    vec2 size;
    float radius;
};

// SDF for a rounded rectangle occluder
float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Calculate shadow based on occluder
float calculateShadow(vec2 point) {
    vec2 lightToPoint = point - uLightPosition;
    float rayLength = length(lightToPoint);
    vec2 rayDir = lightToPoint / rayLength;
    
    float shadow = 1.0;
    
    const int MAX_STEPS = 32;
    
    vec2 currentPos = uLightPosition;
    float remainingDistance = rayLength;
    
    for(int i = 0; i < MAX_STEPS && remainingDistance > EPSILON; i++) {
        // Convert currentPos from pixel coordinates to UV coordinates for texture sampling
        vec2 sampleUV = currentPos / u_resolution;
        
        // Sample the occlusion texture from channel 0
        vec4 occlusionSample = texture(u_occluder, sampleUV);
        
        // Check if we hit an occluder (black pixel)
        if (occlusionSample.r < 0.5) {  // Using red channel
            shadow = 0.0;
            break;
        }
        
        // March along the ray
        float marchDist = min(2.0, remainingDistance);
        currentPos += rayDir * marchDist;
        remainingDistance -= marchDist;
        
        // Check if we're outside the texture bounds
        if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
            break;
        }
    }
    
    return shadow;
}

void main() {
    vec2 pixelCoord = v_uv * u_resolution;
    
    // Calculate shadow
    float shadow = calculateShadow(pixelCoord);
    

    // Calculate light falloff
    float distance = length(pixelCoord - uLightPosition);
    float falloff = 1.0 / (1.0 + distance * 0.003);
    
    // Combine direct lighting with ambient
    vec3 lightColor = vec3(1.0);
    vec3 directLight = lightColor * falloff * shadow * uLightIntensity;
    vec3 ambientLight = lightColor * AMBIENT_INTENSITY;
    
     // Using clamp instead of min
    vec3 finalColor = clamp(directLight + ambientLight, 0.0, 1.0);
    vec3 shadervec = vec3(shadow);
    fragColor = vec4(shadervec, 1.0);
     vec2 sampleUV = uLightPosition / u_resolution;
     vec4 occlusionSample = texture(u_occluder, uLightPosition / u_resolution);
    fragColor = occlusionSample;
}


*/
