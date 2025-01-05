export let occlusionShader = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform vec2 uLightPosition;
uniform float uLightIntensity;
uniform float uLightFalloff;

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

// Convert from pixel coordinates to UV space
vec2 pixelToUV(vec2 pixel) {
    return pixel / u_resolution;
}

// Convert from UV space to pixel coordinates
vec2 uvToPixel(vec2 uv) {
    return uv * u_resolution;
}

float calculateShadow(vec2 point, Occluder occluder) {
    vec2 lightToPoint = point - uLightPosition;
    float rayLength = length(lightToPoint);
    vec2 rayDir = normalize(lightToPoint);
    
    float shadow = 1.0;
    const int MAX_STEPS = 64;  // Increased for better accuracy
    float stepSize = 1.0;      // Fixed step size in pixels
    
    vec2 currentPos = uLightPosition;
    float distanceTraveled = 0.0;
    
    // Continue marching until we reach the end point
    while(distanceTraveled < rayLength) {
        // Check if the current position intersects with occluder bounds
        vec2 relativePos = currentPos - occluder.position;
        vec2 normalizedPos = relativePos / occluder.size;
        
        // If we're inside the occluder bounds
        if (normalizedPos.x >= 0.0 && normalizedPos.x <= 1.0 && 
            normalizedPos.y >= 0.0 && normalizedPos.y <= 1.0) {
            
            vec4 occlusionSample = texture(u_myOcclusionTexture, normalizedPos);
            
            // If we hit an occluder, cast shadow along the remaining ray
            if (occlusionSample.r < 0.5) {
                shadow = 0.0;
                break;
            }
        }
        
        // March forward along the ray
        currentPos += rayDir * stepSize;
        distanceTraveled = length(currentPos - uLightPosition);
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
    float falloff = 1.0 / (1.0 + distance * uLightFalloff); // Adjusted falloff factor for better visibility
    
    // Combine lighting with shadow and intensity
    vec3 lightColor = vec3(1.0); // White light - could be made into a uniform for colored lights
    vec3 ambientLight = lightColor * AMBIENT_INTENSITY;
    vec3 directLight = lightColor * falloff * shadow * uLightIntensity;


   // Add the lights together, ensuring we don't exceed 1.0
    vec3 finalColor = min(directLight + ambientLight, vec3(1.0));
    
    fragColor = vec4(finalColor, 1.0);
}
`;

/*
// Calculate shadow based on occluder
float calculateShadow(vec2 point, Occluder occluder) {
    vec2 lightToPoint = point - uLightPosition;
    float rayLength = length(lightToPoint);
    vec2 rayDir = lightToPoint / rayLength;
    
    float shadow = 1.0;
    const int MAX_STEPS = 32;
    float stepSize = rayLength / float(MAX_STEPS);

    vec2 currentPos = uLightPosition;
    float remainingDistance = rayLength;
    
    
    for(int i = 0; i < MAX_STEPS&& length(currentPos - uLightPosition) < rayLength; i++) {
        // First convert to local space relative to the occluder texture
        vec2 relativePos = currentPos - occluder.position;

        // Then normalize to UV coordinates within the texture's bounds
        vec2 sampleUV = relativePos / occluder.size;
        
        // Sample the occlusion texture
        // Check if we're within the bounds of the occluder texture
        if (sampleUV.x >= 0.0 && sampleUV.x <= 1.0 && 
            sampleUV.y >= 0.0 && sampleUV.y <= 1.0) {
            
            vec4 occlusionSample = texture(u_myOcclusionTexture, sampleUV);
            
            if (occlusionSample.r < 0.5) {
                shadow = 0.0;
                break;
            }
        }
        
        currentPos += rayDir * stepSize;
             
    }
    
    return shadow;
}

*/
