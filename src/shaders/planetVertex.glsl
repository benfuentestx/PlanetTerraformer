varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

uniform float displacementScale;
uniform sampler2D displacementMap;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    // Apply displacement
    vec3 newPosition = position;
    float displacement = texture2D(displacementMap, uv).r;
    newPosition += normal * displacement * displacementScale;

    vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
