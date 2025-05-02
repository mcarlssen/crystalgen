uniform vec3 color;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vPosition;

void main() {
    float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.0);
    float highlight = pow(max(dot(normalize(vNormal), normalize(vec3(0.2, 0.8, 0.5))), 0.0), 8.0);
    float transmission = pow(abs(dot(normalize(vNormal), normalize(vViewDir))), 0.5);
    vec3 rimColor = color * 1.2 + vec3(0.2, 0.2, 0.3) * rim;
    vec3 highlightColor = vec3(1.0, 1.0, 1.0) * highlight * 0.7;
    vec3 transColor = color * 0.7 + vec3(0.3, 0.3, 0.4) * transmission;
    vec3 finalColor = mix(rimColor, transColor, 0.6) + highlightColor;
    float alpha = 0.6 + 0.3 * rim + 0.1 * highlight;
    gl_FragColor = vec4(finalColor, alpha);
} 