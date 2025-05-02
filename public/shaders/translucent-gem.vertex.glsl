varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vPosition;

void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPosition = worldPosition.xyz;
    vViewDir = normalize(cameraPosition - vPosition);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
} 