varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 atmosphereColor;
uniform float intensity;

void main() {
    // Fresnel effect for atmospheric glow
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 3.0);

    // Atmospheric color
    vec3 color = atmosphereColor * fresnel * intensity;

    // Alpha based on fresnel
    float alpha = fresnel * intensity;

    gl_FragColor = vec4(color, alpha);
}
