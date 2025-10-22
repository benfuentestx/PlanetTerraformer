import * as THREE from 'three';

export class Planet {
    constructor(scene) {
        this.scene = scene;
        this.clock = new THREE.Clock();

        this.createPlanet();
        this.createAtmosphere();
        this.createClouds();
        this.createTerraformParticles();
    }

    async createPlanet() {
        const geometry = new THREE.SphereGeometry(5, 128, 128);

        // Load shader files
        const vertexShader = await fetch('./src/shaders/planetVertex.glsl').then(r => r.text());
        const fragmentShader = await fetch('./src/shaders/planetFragment.glsl').then(r => r.text());

        // Create procedural textures
        const barrenTexture = this.createBarrenTexture();
        const fertileTexture = this.createFertileTexture();
        const normalMap = this.createNormalMap();
        const displacementMap = this.createDisplacementMap();

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                barrenTexture: { value: barrenTexture },
                fertileTexture: { value: fertileTexture },
                normalMap: { value: normalMap },
                displacementMap: { value: displacementMap },
                mixValue: { value: 0.0 }, // Start barren
                time: { value: 0 },
                sunDirection: { value: new THREE.Vector3(1, 0.5, 1).normalize() },
                emissionIntensity: { value: 0.0 },
                displacementScale: { value: 0.2 }
            }
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
    }

    async createAtmosphere() {
        const geometry = new THREE.SphereGeometry(5.3, 64, 64);

        const vertexShader = await fetch('./src/shaders/atmosphereVertex.glsl').then(r => r.text());
        const fragmentShader = await fetch('./src/shaders/atmosphereFragment.glsl').then(r => r.text());

        this.atmosphereMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                atmosphereColor: { value: new THREE.Color(0x666666) }, // Start gray
                intensity: { value: 0.3 }
            },
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });

        this.atmosphere = new THREE.Mesh(geometry, this.atmosphereMaterial);
        this.scene.add(this.atmosphere);
    }

    createClouds() {
        const geometry = new THREE.SphereGeometry(5.15, 64, 64);
        const material = new THREE.MeshStandardMaterial({
            map: this.createCloudTexture(),
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });

        this.clouds = new THREE.Mesh(geometry, material);
        this.scene.add(this.clouds);
    }

    createTerraformParticles() {
        const count = 500;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = 5.2 + Math.random() * 0.5;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            const color = new THREE.Color(0x00ff88);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() * 0.1 + 0.05;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    // Procedural texture generators
    createBarrenTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Barren rocky texture
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const noise = Math.random() * 30;
                const gray = 80 + noise;
                const r = gray + Math.random() * 40;
                const g = gray - 20;
                const b = gray - 40;
                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createFertileTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Green and blue (vegetation and water)
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const isWater = Math.random() > 0.6;
                if (isWater) {
                    const blue = 100 + Math.random() * 100;
                    ctx.fillStyle = `rgb(20, 50, ${blue})`;
                } else {
                    const green = 80 + Math.random() * 80;
                    ctx.fillStyle = `rgb(20, ${green}, 30)`;
                }
                ctx.fillRect(x, y, 1, 1);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createNormalMap() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#8080ff';
        ctx.fillRect(0, 0, size, size);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    createDisplacementMap() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const value = Math.random() * 255;
                ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    createCloudTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(255, 255, 255, 0)';
        ctx.fillRect(0, 0, size, size);

        // Random cloud patches
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = 20 + Math.random() * 40;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    update(deltaTime) {
        const elapsed = this.clock.getElapsedTime();

        // Update shader uniforms
        if (this.material) {
            this.material.uniforms.time.value = elapsed;
        }

        // Rotate planet slowly
        if (this.mesh) {
            this.mesh.rotation.y += deltaTime * 0.05;
        }

        // Counter-rotate clouds slightly
        if (this.clouds) {
            this.clouds.rotation.y += deltaTime * 0.07;
        }

        // Rotate particles
        if (this.particles) {
            this.particles.rotation.y -= deltaTime * 0.1;
        }
    }
}
