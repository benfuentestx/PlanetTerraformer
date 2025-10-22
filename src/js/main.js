import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Planet } from './planet.js';
import { Animation } from './animation.js';
import { UI } from './ui.js';
import { AudioSystem } from './audio.js';
import { ConferenceScene } from './conferenceScene.js';

class PlanetTerraformer {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.clock = new THREE.Clock();
        this.isPlaying = false;
        this.orbitEnabled = false;
        this.currentScene = 'loading'; // loading, cinematic, conference, training, gameplay

        console.log('🌍 Planet Terraformer initializing...');

        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupScene();
        this.setupLights();
        this.setupPostProcessing();
        this.createStarfield();

        // Initialize systems
        this.planet = new Planet(this.scene);
        this.audioSystem = new AudioSystem();
        this.conferenceScene = new ConferenceScene(this.scene, this.camera, this.renderer, this);
        this.animation = new Animation(this.camera, this.planet, this.audioSystem, this.conferenceScene);
        this.ui = new UI(this.animation);

        this.setupControls();
        this.setupEventListeners();

        this.animate();

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('controls').classList.add('show');
            console.log('✅ Initialization complete');
        }, 1500);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.physicallyCorrectLights = true;
        this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 20);
        this.camera.lookAt(0, 0, 0);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000510);
        this.scene.fog = new THREE.FogExp2(0x000510, 0.001);
    }

    setupLights() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambient);

        // Sunlight (directional)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.sunLight.position.set(10, 5, 10);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 50;
        this.scene.add(this.sunLight);

        // Rim light for depth
        const rimLight = new THREE.DirectionalLight(0x0088ff, 0.3);
        rimLight.position.set(-10, 0, -10);
        this.scene.add(rimLight);
    }

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);

        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Bloom pass
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2,  // strength
            0.6,  // radius
            0.4   // threshold
        );
        this.composer.addPass(this.bloomPass);

        // Film grain pass
        const filmPass = new FilmPass(0.15, 0.5, 2048, false);
        this.composer.addPass(filmPass);
    }

    createStarfield() {
        const starCount = 5000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            // Random positions in a sphere
            const radius = 100 + Math.random() * 400;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);

            // Random star colors (white to blue-white)
            const color = new THREE.Color();
            color.setHSL(0.6 + Math.random() * 0.1, 0.3, 0.7 + Math.random() * 0.3);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }

        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 8;
        this.controls.maxDistance = 30;
        this.controls.enabled = false; // Disabled during cinematic
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());

        // Play button
        document.getElementById('play-btn').addEventListener('click', () => {
            this.startCinematic();
        });

        // Replay button
        document.getElementById('replay-btn').addEventListener('click', () => {
            this.animation.restart();
        });

        // Orbit/Explore button
        document.getElementById('orbit-btn').addEventListener('click', () => {
            this.toggleOrbitMode();
        });

        // Fast Forward button
        document.getElementById('fast-forward-btn').addEventListener('click', () => {
            this.fastForward();
        });
    }

    fastForward() {
        console.log(`⏩ Fast forwarding from scene: ${this.currentScene}`);

        switch(this.currentScene) {
            case 'loading':
                // Skip to cinematic started
                console.log('⏩ Skipping loading, starting cinematic');
                this.startCinematic();
                break;

            case 'cinematic':
                // Skip cinematic, go to conference
                console.log('⏩ Skipping cinematic, going to conference');
                if (this.animation && this.animation.timeline) {
                    this.animation.timeline.pause();
                }
                this.currentScene = 'conference';
                setTimeout(() => {
                    if (this.conferenceScene) {
                        this.conferenceScene.start();
                    }
                }, 500);
                break;

            case 'conference':
                // Skip conference, go to training
                console.log('⏩ Skipping conference, going to training');
                if (this.conferenceScene) {
                    this.conferenceScene.skipToTraining();
                }
                this.currentScene = 'training';
                break;

            case 'training':
                // Skip training, go to gameplay
                console.log('⏩ Skipping training, going to gameplay');
                if (this.conferenceScene) {
                    this.conferenceScene.skipToGameplay();
                }
                this.currentScene = 'gameplay';
                break;

            case 'gameplay':
                console.log('⏩ Already at gameplay');
                break;

            default:
                console.log('⏩ Unknown scene, cannot skip');
        }
    }

    startCinematic() {
        console.log('🎬 Starting cinematic sequence...');
        this.currentScene = 'cinematic';
        document.getElementById('play-btn').style.display = 'none';

        // Fade from black
        const fadeOverlay = document.getElementById('fade-overlay');
        setTimeout(() => {
            fadeOverlay.classList.add('transparent');
        }, 100);

        this.animation.play();
        this.audioSystem.playAmbient();
    }

    toggleOrbitMode() {
        this.orbitEnabled = !this.orbitEnabled;
        this.controls.enabled = this.orbitEnabled;

        const btn = document.getElementById('orbit-btn');
        // When orbit is enabled, show option to return to cinematic
        // When orbit is disabled, show option to explore
        btn.textContent = this.orbitEnabled ? '🎬 RETURN TO CINEMATIC' : '🌍 EXPLORE';

        if (this.orbitEnabled) {
            // Pause any camera animations to allow orbit control
            this.animation.pause();
        } else {
            // Return to cinematic view
            this.animation.resetCamera();
        }

        console.log(`${this.orbitEnabled ? '✅ Orbit mode ENABLED - You can now drag to rotate the camera' : '🎬 Orbit mode DISABLED - Returning to cinematic view'}`);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    update(deltaTime) {
        // Rotate starfield slowly for parallax
        if (this.stars) {
            this.stars.rotation.y += deltaTime * 0.01;
        }

        // Update planet
        if (this.planet) {
            this.planet.update(deltaTime);
        }

        // Update animation timeline
        if (this.animation) {
            this.animation.update(deltaTime);
        }

        // Update conference scene if active
        if (this.conferenceScene) {
            this.conferenceScene.update(deltaTime);
        }

        // Update controls if in orbit mode
        if (this.controls && this.controls.enabled) {
            this.controls.update();
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);

        // Render with post-processing
        this.composer.render();
    }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Launching Planet Terraformer...');
    new PlanetTerraformer();
});
