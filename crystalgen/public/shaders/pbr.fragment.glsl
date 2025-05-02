uniform vec3 color;
uniform float roughness;
uniform float metalness;
uniform float transmission;
uniform float ior;
uniform float opacity;

uniform samplerCube envMap;

varying vec3 vViewPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

// PBR functions
float ggx(float NdotH, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH2 = NdotH * NdotH;
    
    float nom = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = 3.14159265359 * denom * denom;
    
    return nom / denom;
}

float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    
    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;
    
    return nom / denom;
}

float geometrySmith(float NdotV, float NdotL, float roughness) {
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);
    
    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);
    
    // Calculate reflectance at normal incidence
    vec3 F0 = vec3(0.04); 
    F0 = mix(F0, color, metalness);
    
    // Ambient lighting (approximation)
    vec3 R = reflect(-V, N);
    vec3 ambient = textureCube(envMap, R).rgb * color;
    
    // Calculate light direction (simplification - using view direction)
    vec3 L = normalize(vec3(1.0, 1.0, 1.0));  // Directional light
    vec3 H = normalize(V + L);
    
    // Calculate all the dot products needed
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float NdotH = max(dot(N, H), 0.0);
    float VdotH = max(dot(V, H), 0.0);
    
    // Calculate the Cook-Torrance BRDF
    float NDF = ggx(NdotH, roughness);
    float G = geometrySmith(NdotV, NdotL, roughness);
    vec3 F = fresnelSchlick(VdotH, F0);
    
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metalness;
    
    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * NdotV * NdotL + 0.0001;
    vec3 specular = numerator / denominator;
    
    // Transmission/refraction
    vec3 transmissionColor = vec3(0.0);
    if (transmission > 0.0) {
        float eta = 1.0 / ior;
        vec3 refractedDir = refract(-V, N, eta);
        transmissionColor = textureCube(envMap, refractedDir).rgb * color * transmission;
    }
    
    // Combine direct and indirect lighting
    vec3 directLighting = (kD * color / 3.14159265359 + specular) * NdotL;
    vec3 indirectLighting = ambient * 0.3;
    
    vec3 finalColor = directLighting + indirectLighting + transmissionColor;
    
    // Apply gamma correction
    finalColor = pow(finalColor, vec3(1.0/2.2));
    
    gl_FragColor = vec4(finalColor, opacity);
} 