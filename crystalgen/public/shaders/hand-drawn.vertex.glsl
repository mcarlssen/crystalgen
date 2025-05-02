varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vDepth;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    // Calculate normalized depth for outline effect
    vec4 projPosition = projectionMatrix * mvPosition;
    vDepth = projPosition.z / projPosition.w;
    
    gl_Position = projPosition;
} 