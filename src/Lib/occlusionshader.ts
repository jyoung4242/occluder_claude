export let occlusionShader = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 uLightPosition;
uniform float uLightIntensity;

uniform vec2 u_texturePosition; // Position of the second texture
uniform vec2 u_textureSize;     // Size of the second texture

const float EPSILON = 0.001; // Global EPSILON in UV space
const float AMBIENT_INTENSITY = 0.2; // Adjust this value to control ambient light level

uniform sampler2D u_image;  // Default texture slot
uniform sampler2D u_myOcclusionTexture;  // Slot 2 texture

// Structure to represent an occluder
struct Occluder {
    vec2 position;
    vec2 size;
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
        // Convert currentPos from pixel coordinates to UV coordinates for texture sampling
        vec2 sampleUV = currentPos / u_resolution;
        
        // Sample the occlusion texture
        vec4 occlusionSample = texture(u_myOcclusionTexture, sampleUV);
        
        // Check if we hit an occluder (black pixel)
        // Using the red channel, but could use average of RGB if needed
        if (occlusionSample.r < 0.5) {  // Threshold at 0.5 between black and white
            shadow = 0.0;
            break;
        }
        
        // March along the ray
        float marchDist = min(2.0, remainingDistance); // Fixed step size
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
    
    // Define an occluder
    Occluder occluder;
    occluder.position = u_texturePosition;  // Center of screen
    occluder.size = u_textureSize;     // Size in pixels
           
    // Calculate shadow
    float shadow = calculateShadow(pixelCoord, occluder);
    
    // Calculate light falloff
    float distance = length(pixelCoord - uLightPosition);
    float falloff = 1.0 / (1.0 + distance * 0.003); // Adjusted falloff factor for better visibility
    
    // Combine lighting with shadow and intensity
    vec3 lightColor = vec3(1.0); // White light - could be made into a uniform for colored lights
    vec3 ambientLight = lightColor * AMBIENT_INTENSITY;
    vec3 directLight = lightColor * falloff * shadow * uLightIntensity;


   // Add the lights together, ensuring we don't exceed 1.0
    vec3 finalColor = min(directLight + ambientLight, vec3(1.0));
    
    fragColor = vec4(finalColor, 1.0);
}
`;
