uniform vec3 color;
uniform float outlineThickness;
uniform float strokeDensity;
uniform sampler2D noiseTexture;
uniform float time;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vDepth;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);
    
    // Calculate dot product for rim light effect
    float rimLight = 1.0 - max(dot(N, V), 0.0);
    rimLight = pow(rimLight, 3.0);
    
    // Edge detection for outline
    float edgeStrength = 0.0;
    if (rimLight > (1.0 - outlineThickness)) {
        edgeStrength = 1.0;
    }
    
    // Sample noise texture for stroke effect
    vec2 noiseUv = vUv * strokeDensity + vec2(time * 0.01, 0.0);
    float noise = texture2D(noiseTexture, noiseUv).r;
    
    // Vary color based on depth
    vec3 baseColor = color * (0.8 + 0.2 * (1.0 - vDepth));
    
    // Apply hand-drawn style
    vec3 finalColor = mix(baseColor, vec3(0.0), edgeStrength);
    
    // Add hatching effect with noise
    float hatchingAmount = max(0.0, 0.3 - dot(N, vec3(0.0, 1.0, 0.0)));
    float hatchPattern = step(0.5, fract(noise * 10.0));
    finalColor *= 0.8 + 0.2 * (1.0 - hatchingAmount * hatchPattern);
    
    // Add sketch-like random variations
    float sketchNoise = rand(gl_FragCoord.xy) * 0.05;
    finalColor += vec3(sketchNoise);
    
    gl_FragColor = vec4(finalColor, 1.0);
} 