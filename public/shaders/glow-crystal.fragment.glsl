uniform vec3 color;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vPosition;

void main() {
    float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.5);
    float glow = pow(rim, 1.5) * 1.2;
    float core = 0.5 + 0.5 * max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    vec3 glowColor = color * (0.7 + 0.6 * rim);
    vec3 finalColor = mix(glowColor, color, core);
    finalColor += color * glow * 1.2;
    float alpha = 0.7 + 0.3 * rim;
    gl_FragColor = vec4(finalColor, alpha);
} 