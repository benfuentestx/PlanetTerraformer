varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

uniform sampler2D barrenTexture;
uniform sampler2D fertileTexture;
uniform sampler2D normalMap;
uniform float mixValue; // 0.0 = barren, 1.0 = fertile
uniform float time;
uniform vec3 sunDirection;
uniform float emissionIntensity;

void main() {
    // Sample both textures
    vec3 barrenColor = texture2D(barrenTexture, vUv).rgb;
    vec3 fertileColor = texture2D(fertileTexture, vUv).rgb;

    // Blend between barren and fertile based on mixValue
    vec3 baseColor = mix(barrenColor, fertileColor, mixValue);

    // Normal mapping
    vec3 normalTex = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
    vec3 normal = normalize(vNormal + normalTex * 0.3);

    // Lighting
    vec3 lightDir = normalize(sunDirection);
    float diff = max(dot(normal, lightDir), 0.0);

    // Ambient
    vec3 ambient = baseColor * 0.3;

    // Diffuse
    vec3 diffuse = baseColor * diff * 0.7;

    // Specular (water reflection on fertile planet)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = vec3(spec) * mixValue * 0.5; // Only on fertile

    // Emission glow during transformation
    vec3 emissionColor = vec3(0.0, 1.0, 0.5); // Green glow
    float pulse = sin(time * 2.0 + vPosition.y * 5.0) * 0.5 + 0.5;
    vec3 emission = emissionColor * pulse * emissionIntensity * (1.0 - mixValue);

    // Combine
    vec3 finalColor = ambient + diffuse + specular + emission;

    gl_FragColor = vec4(finalColor, 1.0);
}
