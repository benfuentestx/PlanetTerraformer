import * as THREE from 'three';

export class RocketScene {
    constructor(scene, camera, renderer, mainApp) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.mainApp = mainApp;

        this.rocketObjects = [];
        this.isActive = false;
        this.cockpitView = null;
        this.rocket = null;
        this.flames = null;
        this.dialogue = null;
        this.shakeIntensity = 0;
        this.smokeParticles = null;
        this.dustParticles = null;
        this.reentryGlow = null;
        this.planet = null;

        console.log('🚀 Rocket scene initialized');
    }

    start() {
        console.log('🚀 Starting rocket launch sequence...');
        this.isActive = true;

        // Clean up previous scene objects
        this.cleanup();

        // Setup rocket interior (cockpit)
        this.setupCockpit();

        // Setup rocket exterior (for launch view)
        this.setupRocket();

        // Create particle systems and effects
        this.createSmokeParticles();
        this.createDustParticles();
        this.createReentryGlow();
        this.createPlanetForArrival();

        // Hide training montage
        const trainingMontage = document.getElementById('training-montage');
        trainingMontage.style.display = 'none';

        // Show countdown sequence
        this.startCountdown();
    }

    setupCockpit() {
        // Cockpit interior - first person view from pilot seat
        const cockpitGroup = new THREE.Group();

        // Control panel
        const panelGeometry = new THREE.BoxGeometry(3, 0.8, 0.1);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.3,
            metalness: 0.7
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(0, 1.2, -1.5);
        panel.rotation.x = -0.3;
        cockpitGroup.add(panel);
        this.rocketObjects.push(panel);

        // Screens on panel (3 monitors)
        for (let i = 0; i < 3; i++) {
            const screenGeometry = new THREE.PlaneGeometry(0.6, 0.4);
            const screenMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff88
            });
            const screen = new THREE.Mesh(screenGeometry, screenMaterial);
            screen.position.set(-0.8 + i * 0.8, 1.3, -1.4);
            screen.rotation.x = -0.3;
            cockpitGroup.add(screen);
            this.rocketObjects.push(screen);

            // Make screens flicker with data
            screen.userData.flickerSpeed = 2 + Math.random() * 2;
            screen.userData.baseColor = 0x00ff88;
        }

        // Buttons and switches (random colored indicators)
        for (let i = 0; i < 15; i++) {
            const buttonGeometry = new THREE.SphereGeometry(0.03, 8, 8);
            const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff8800];
            const buttonMaterial = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                emissive: colors[Math.floor(Math.random() * colors.length)],
                emissiveIntensity: 0.8
            });
            const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
            button.position.set(
                -1.2 + Math.random() * 2.4,
                1.0 + Math.random() * 0.3,
                -1.4
            );
            cockpitGroup.add(button);
            this.rocketObjects.push(button);
        }

        // Window frame (looking out to space)
        const windowFrameGeometry = new THREE.RingGeometry(0.8, 0.9, 32);
        const windowFrameMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.4,
            metalness: 0.8
        });
        const windowFrame = new THREE.Mesh(windowFrameGeometry, windowFrameMaterial);
        windowFrame.position.set(0, 1.6, -2);
        cockpitGroup.add(windowFrame);
        this.rocketObjects.push(windowFrame);

        // Cockpit walls (curved interior)
        const wallCurve = new THREE.Shape();
        wallCurve.absarc(0, 0, 2, 0, Math.PI, false);
        wallCurve.lineTo(-2, -0.5);
        wallCurve.lineTo(2, -0.5);

        const extrudeSettings = {
            depth: 0.1,
            bevelEnabled: false
        };

        const wallGeometry = new THREE.ExtrudeGeometry(wallCurve, extrudeSettings);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        const walls = new THREE.Mesh(wallGeometry, wallMaterial);
        walls.position.set(0, 1.5, -2);
        walls.rotation.y = Math.PI;
        cockpitGroup.add(walls);
        this.rocketObjects.push(walls);

        // Pilot seat (behind camera)
        const seatGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
        const seatMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.6
        });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 0.8, 0.5);
        cockpitGroup.add(seat);
        this.rocketObjects.push(seat);

        // Add cockpit lighting
        const cockpitLight = new THREE.PointLight(0x00ff88, 1, 10);
        cockpitLight.position.set(0, 2, -1);
        cockpitGroup.add(cockpitLight);
        this.rocketObjects.push(cockpitLight);

        // Add red alert light
        const alertLight = new THREE.PointLight(0xff0000, 0, 10);
        alertLight.position.set(0, 2.2, 0);
        cockpitGroup.add(alertLight);
        this.rocketObjects.push(alertLight);

        // Store alert light for animation
        cockpitGroup.userData.alertLight = alertLight;

        this.scene.add(cockpitGroup);
        this.cockpitView = cockpitGroup;
        this.rocketObjects.push(cockpitGroup);

        // Position camera in cockpit
        this.camera.position.set(0, 1.5, 0);
        this.camera.lookAt(0, 1.5, -2);

        // Make cockpit invisible initially (will fade in)
        cockpitGroup.visible = false;
    }

    setupRocket() {
        // External rocket model (for exterior shots)
        const rocketGroup = new THREE.Group();

        // Launchpad ground
        const launchpadGeometry = new THREE.CylinderGeometry(8, 8, 0.5, 32);
        const launchpadMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.8,
            metalness: 0.2
        });
        const launchpad = new THREE.Mesh(launchpadGeometry, launchpadMaterial);
        launchpad.position.y = -0.5;
        rocketGroup.add(launchpad);

        // Launchpad details (yellow/black stripes)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const stripeGeometry = new THREE.BoxGeometry(0.5, 0.1, 4);
            const stripeMaterial = new THREE.MeshStandardMaterial({
                color: i % 2 === 0 ? 0xffff00 : 0x000000,
                roughness: 0.7
            });
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.set(
                Math.cos(angle) * 6,
                -0.2,
                Math.sin(angle) * 6
            );
            stripe.rotation.y = angle;
            rocketGroup.add(stripe);
        }

        // Main body (cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(1, 1, 10, 32);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.2,
            metalness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 5;
        rocketGroup.add(body);

        // Nose cone
        const noseGeometry = new THREE.ConeGeometry(1, 3, 32);
        const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
        nose.position.y = 11.5;
        rocketGroup.add(nose);

        // NASA logo on side
        const logoGeometry = new THREE.CircleGeometry(0.6, 32);
        const logoMaterial = new THREE.MeshBasicMaterial({
            color: 0x0b3d91,
            side: THREE.DoubleSide
        });
        const logo = new THREE.Mesh(logoGeometry, logoMaterial);
        logo.position.set(1.05, 6, 0);
        logo.rotation.y = Math.PI / 2;
        rocketGroup.add(logo);

        // Red stripes
        for (let i = 0; i < 3; i++) {
            const stripeGeometry = new THREE.CylinderGeometry(1.02, 1.02, 0.3, 32);
            const stripeMaterial = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                roughness: 0.2,
                metalness: 0.7
            });
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.y = 3 + i * 2;
            rocketGroup.add(stripe);
        }

        // Engine bells (4 at bottom)
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const x = Math.cos(angle) * 0.6;
            const z = Math.sin(angle) * 0.6;

            const engineGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 16);
            const engineMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.6,
                metalness: 0.9
            });
            const engine = new THREE.Mesh(engineGeometry, engineMaterial);
            engine.position.set(x, 0.25, z);
            rocketGroup.add(engine);
        }

        // Rocket flames (initially hidden)
        this.createFlames(rocketGroup);

        // Position rocket on launchpad (visible in front of camera)
        rocketGroup.position.set(0, 0, -50);
        rocketGroup.visible = false;

        this.scene.add(rocketGroup);
        this.rocket = rocketGroup;
        this.rocketObjects.push(rocketGroup);
    }

    createFlames(rocketGroup) {
        const flamesGroup = new THREE.Group();

        // Main exhaust flame
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const x = Math.cos(angle) * 0.6;
            const z = Math.sin(angle) * 0.6;

            const flameGeometry = new THREE.ConeGeometry(0.35, 3, 8);
            const flameMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 0.8
            });
            const flame = new THREE.Mesh(flameGeometry, flameMaterial);
            flame.position.set(x, -1, z);
            flame.rotation.x = Math.PI;
            flamesGroup.add(flame);

            // Inner core (brighter)
            const coreGeometry = new THREE.ConeGeometry(0.2, 2, 8);
            const coreMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.9
            });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            core.position.set(x, -0.5, z);
            core.rotation.x = Math.PI;
            flamesGroup.add(core);
        }

        flamesGroup.visible = false;
        rocketGroup.add(flamesGroup);
        this.flames = flamesGroup;

        // Add smoke particles
        this.createSmokeParticles(rocketGroup);
    }

    createSmokeParticles(rocketGroup) {
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = -2 + Math.random() * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

            velocities.push({
                x: (Math.random() - 0.5) * 0.5,
                y: -0.5 - Math.random() * 1,
                z: (Math.random() - 0.5) * 0.5
            });
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x888888,
            size: 0.5,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.smokeParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.smokeParticles.userData.velocities = velocities;
        this.smokeParticles.visible = false;
        rocketGroup.add(this.smokeParticles);
        this.rocketObjects.push(this.smokeParticles);
    }

    createSmokeParticles() {
        // Launch smoke/exhaust particles
        const particleCount = 500;
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        const lifetimes = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 5;
            positions[i * 3 + 1] = -5 + Math.random() * 5;  // Near ground level
            positions[i * 3 + 2] = -50 + (Math.random() - 0.5) * 5;  // Match rocket Z position

            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.5 + 0.3,
                (Math.random() - 0.5) * 0.2
            ));
            lifetimes.push(Math.random() * 2);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 1.5,
            color: 0xff6600,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        particles.userData.velocities = velocities;
        particles.userData.lifetimes = lifetimes;
        particles.visible = false;

        this.scene.add(particles);
        this.smokeParticles = particles;
        this.rocketObjects.push(particles);
    }

    createDustParticles() {
        // Landing dust particles
        const particleCount = 300;
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 8;

            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = Math.sin(angle) * radius;

            velocities.push(new THREE.Vector3(
                Math.cos(angle) * 0.3,
                Math.random() * 0.5 + 0.2,
                Math.sin(angle) * 0.3
            ));
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 0.8,
            color: 0xccaa88,
            transparent: true,
            opacity: 0.5,
            depthWrite: false
        });

        const particles = new THREE.Points(geometry, material);
        particles.userData.velocities = velocities;
        particles.visible = false;

        this.scene.add(particles);
        this.dustParticles = particles;
        this.rocketObjects.push(particles);
    }

    createReentryGlow() {
        // Heat shield glow for atmospheric re-entry
        const glowGeometry = new THREE.SphereGeometry(2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff3300,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.visible = false;

        this.scene.add(glow);
        this.reentryGlow = glow;
        this.rocketObjects.push(glow);
    }

    createPlanetForArrival() {
        // Create the terraformed planet for approach sequence
        const planetGeometry = new THREE.SphereGeometry(15, 64, 64);
        const planetMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc6633,
            roughness: 0.8,
            metalness: 0.2
        });

        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.position.set(0, 0, -500); // Far away initially
        planet.visible = false;

        // Add atmosphere glow
        const atmosphereGeometry = new THREE.SphereGeometry(16, 64, 64);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });

        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        planet.add(atmosphere);

        this.scene.add(planet);
        this.planet = planet;
        this.rocketObjects.push(planet);
    }

    startCountdown() {
        console.log('⏰ Countdown sequence starting...');

        const textOverlay = document.getElementById('narrative-text');
        const fadeOverlay = document.getElementById('fade-overlay');

        // Fade to black first
        fadeOverlay.style.opacity = '1';
        fadeOverlay.classList.remove('transparent');

        const countdown = [
            { time: 1000, text: 'MISSION: TERRAFORM EXPLORATION', duration: 3000 },
            { time: 4000, text: 'DESTINATION: PLANET TERRAFORM', duration: 3000 },
            { time: 7000, text: 'LAUNCH SEQUENCE INITIATED', duration: 3000 },
            { time: 10000, text: 'T-MINUS 10 SECONDS', duration: 2000 },
            { time: 12000, text: '10... 9... 8...', duration: 1000 },
            { time: 13000, text: '7... 6... 5...', duration: 1000 },
            { time: 14000, text: '4... 3... 2...', duration: 1000 },
            { time: 15000, text: '1... IGNITION!', duration: 1000 }
        ];

        countdown.forEach(step => {
            setTimeout(() => {
                textOverlay.textContent = step.text;
                textOverlay.classList.add('show');

                setTimeout(() => {
                    textOverlay.classList.remove('show');
                }, step.duration);
            }, step.time);
        });

        // Start launch at T+16 seconds
        setTimeout(() => {
            this.startLaunch();
        }, 16000);
    }

    startLaunch() {
        console.log('🚀 LIFTOFF!');

        const textOverlay = document.getElementById('narrative-text');
        const fadeOverlay = document.getElementById('fade-overlay');

        // Show rocket from exterior
        this.rocket.visible = true;
        this.flames.visible = true;
        this.smokeParticles.visible = true;

        // Add bright launch lighting
        const launchLight = new THREE.DirectionalLight(0xffffff, 2);
        launchLight.position.set(-10, 20, -20);
        this.scene.add(launchLight);
        this.rocketObjects.push(launchLight);

        // Add orange glow from engines
        const engineGlow = new THREE.PointLight(0xff6600, 5, 30);
        engineGlow.position.copy(this.rocket.position);
        engineGlow.position.y -= 2;
        this.scene.add(engineGlow);
        this.rocketObjects.push(engineGlow);

        // Position camera for good view of rocket (side angle)
        this.camera.position.set(-20, 5, -30);
        this.camera.lookAt(this.rocket.position);

        // Fade from black to show launch
        fadeOverlay.classList.add('transparent');

        // Show launch text
        textOverlay.textContent = 'LIFTOFF!';
        textOverlay.classList.add('show');

        // Change scene background to Earth sky
        if (this.scene.background) {
            this.scene.background = new THREE.Color(0x4a90e2);
        }

        // Animate rocket ascent
        const launchDuration = 8000;
        const startY = 0;  // Start from ground level
        const endY = 150;
        const startTime = Date.now();

        const launchInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / launchDuration;

            if (progress >= 1) {
                clearInterval(launchInterval);
                this.transitionToSpace();
                return;
            }

            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            this.rocket.position.y = startY + (endY - startY) * easeProgress;

            // Add camera shake (more intense at start)
            this.shakeIntensity = 0.8 * (1 - progress * 0.5);

            // Animate flames
            this.flames.children.forEach((flame, index) => {
                const scale = 1 + Math.sin(Date.now() * 0.01 + index) * 0.2;
                flame.scale.y = scale;
            });

            // Follow rocket with camera
            this.camera.lookAt(this.rocket.position);
        }, 16);

        // Hide text after 3 seconds
        setTimeout(() => {
            textOverlay.classList.remove('show');
        }, 3000);
    }

    transitionToSpace() {
        console.log('🌌 Transitioning to space...');

        const textOverlay = document.getElementById('narrative-text');
        const fadeOverlay = document.getElementById('fade-overlay');

        // Show transition text
        textOverlay.textContent = 'Leaving Earth\'s Atmosphere...';
        textOverlay.classList.add('show');

        // Gradually change background from blue to black
        const duration = 5000;
        const startTime = Date.now();
        const startColor = new THREE.Color(0x000510);
        const endColor = new THREE.Color(0x000000);

        const spaceInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                clearInterval(spaceInterval);
                this.scene.background = endColor;

                // Hide smoke particles in space
                if (this.smokeParticles) {
                    this.smokeParticles.visible = false;
                }

                // Start planet approach
                setTimeout(() => {
                    this.approachPlanet();
                }, 2000);
                return;
            }

            // Fade background color
            const currentColor = startColor.clone().lerp(endColor, progress);
            this.scene.background = currentColor;

            // Fade out smoke particles
            if (this.smokeParticles) {
                this.smokeParticles.material.opacity = 0.6 * (1 - progress);
            }

            // Continue rocket ascent
            this.rocket.position.y += 0.5;
        }, 16);

        // Hide text after 4 seconds
        setTimeout(() => {
            textOverlay.classList.remove('show');
        }, 4000);
    }

    approachPlanet() {
        console.log('🌍 Approaching Planet Terraform...');

        const textOverlay = document.getElementById('narrative-text');

        // Show planet in distance
        this.planet.visible = true;

        // Show approach text
        textOverlay.textContent = 'Approaching Planet Terraform...';
        textOverlay.classList.add('show');

        // Animate planet getting closer
        const duration = 8000;
        const startTime = Date.now();
        const startZ = -500;
        const endZ = -100;

        const approachInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                clearInterval(approachInterval);
                this.startReentry();
                return;
            }

            // Move planet closer
            const easeProgress = progress * progress; // Ease in
            this.planet.position.z = startZ + (endZ - startZ) * easeProgress;

            // Rotate planet slowly
            this.planet.rotation.y += 0.001;
        }, 16);

        // Hide text after 4 seconds
        setTimeout(() => {
            textOverlay.classList.remove('show');
        }, 4000);
    }

    startReentry() {
        console.log('🔥 Beginning atmospheric re-entry...');

        const textOverlay = document.getElementById('narrative-text');
        const fadeOverlay = document.getElementById('fade-overlay');

        // Show re-entry text
        textOverlay.textContent = 'Beginning Atmospheric Re-entry...';
        textOverlay.classList.add('show');

        // Show re-entry glow
        this.reentryGlow.visible = true;
        this.reentryGlow.position.copy(this.rocket.position);

        // Increase shake for turbulence
        this.shakeIntensity = 1.5;

        // Animate re-entry
        const duration = 6000;
        const startTime = Date.now();

        const reentryInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                clearInterval(reentryInterval);
                this.startLanding();
                return;
            }

            // Pulsate glow
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            this.reentryGlow.material.opacity = pulse * 0.8;
            this.reentryGlow.position.copy(this.rocket.position);

            // Shake increases then decreases
            const shakeCurve = Math.sin(progress * Math.PI);
            this.shakeIntensity = 1.5 * shakeCurve;

            // Move rocket towards planet
            this.rocket.position.z -= 0.5;
            this.rocket.position.y -= 0.2;
        }, 16);

        // Hide text after 3 seconds
        setTimeout(() => {
            textOverlay.classList.remove('show');
        }, 3000);
    }

    startLanding() {
        console.log('🛬 Landing sequence initiated...');

        const textOverlay = document.getElementById('narrative-text');
        const fadeOverlay = document.getElementById('fade-overlay');

        // Hide re-entry glow
        this.reentryGlow.visible = false;

        // Show landing text
        textOverlay.textContent = 'Landing Sequence Initiated...';
        textOverlay.classList.add('show');

        // Show dust particles
        this.dustParticles.visible = true;

        // Animate landing
        const duration = 5000;
        const startTime = Date.now();
        const startY = this.rocket.position.y;
        const targetY = -10;

        const landingInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                clearInterval(landingInterval);
                this.rocket.position.y = targetY;
                this.shakeIntensity = 0;

                // Final impact
                setTimeout(() => {
                    this.transitionToCockpit();
                }, 1000);
                return;
            }

            // Ease out landing
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            this.rocket.position.y = startY + (targetY - startY) * easeProgress;

            // Gentle shake
            this.shakeIntensity = 0.3 * (1 - progress);
        }, 16);

        // Hide text after 3 seconds
        setTimeout(() => {
            textOverlay.classList.remove('show');
        }, 3000);
    }

    transitionToSpace() {
        console.log('🌌 Entering space...');

        const textOverlay = document.getElementById('narrative-text');
        const fadeOverlay = document.getElementById('fade-overlay');

        // Show space transition text
        textOverlay.textContent = 'Exiting Earth Atmosphere...';
        textOverlay.classList.add('show');

        // Complete transition to black space
        if (this.scene.background) {
            this.scene.background = new THREE.Color(0x000510);
        }

        // Hide smoke particles
        if (this.smokeParticles) {
            this.smokeParticles.visible = false;
        }

        // Continue to cockpit view after 3 seconds
        setTimeout(() => {
            textOverlay.classList.remove('show');
            this.transitionToCockpit();
        }, 3000);
    }

    transitionToCockpit() {
        console.log('🏢 Transitioning to cockpit view...');

        const fadeOverlay = document.getElementById('fade-overlay');
        const textOverlay = document.getElementById('narrative-text');

        // Fade to black
        fadeOverlay.classList.remove('transparent');

        setTimeout(() => {
            // Hide rocket exterior
            this.rocket.visible = false;

            // Show cockpit interior
            this.cockpitView.visible = true;

            // Reset camera to cockpit view
            this.camera.position.set(0, 1.5, 0);
            this.camera.lookAt(0, 1.5, -2);

            // Fade from black
            fadeOverlay.classList.add('transparent');

            // Show mission control dialogue
            this.startMissionDialogue();

        }, 2000);
    }

    startMissionDialogue() {
        console.log('📡 Mission control communication...');

        const textOverlay = document.getElementById('narrative-text');

        // Enable red alert light (initially off)
        if (this.cockpitView.userData.alertLight) {
            this.cockpitView.userData.alertLight.intensity = 0;
        }

        // Create atmospheric entry glow effect
        this.createAtmosphericGlow();

        const dialogue = [
            { time: 1000, text: 'Mission Control: "You are now entering Terraform orbit."', duration: 4000 },
            { time: 5000, text: 'Mission Control: "Beginning descent sequence."', duration: 4000, effect: 'entry' },
            { time: 9000, text: 'Mission Control: "Core stability readings... unstable."', duration: 4000 },
            { time: 13000, text: 'Mission Control: "We\'re losing signal... [STATIC]"', duration: 4000 },
            { time: 17000, text: 'SYSTEM ALERT: COMMUNICATION LOST', duration: 3000, alert: true },
            { time: 20000, text: 'SYSTEM ALERT: EMERGENCY LANDING PROTOCOL', duration: 3000, alert: true },
            { time: 23000, text: 'BRACE FOR IMPACT!', duration: 2000, alert: true }
        ];

        dialogue.forEach(step => {
            setTimeout(() => {
                textOverlay.textContent = step.text;
                textOverlay.classList.add('show');

                if (step.effect === 'entry') {
                    // Show atmospheric entry effects
                    this.startAtmosphericEntry();
                }

                if (step.alert && this.cockpitView.userData.alertLight) {
                    this.cockpitView.userData.alertLight.intensity = 2;
                    this.shakeIntensity = 0.8;
                }

                setTimeout(() => {
                    textOverlay.classList.remove('show');
                }, step.duration);
            }, step.time);
        });

        // Start impact sequence
        setTimeout(() => {
            this.crashLanding();
        }, 25000);
    }

    createAtmosphericGlow() {
        // Create orange atmospheric glow outside cockpit window
        const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide
        });
        this.atmosphericGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.atmosphericGlow.position.set(0, 1.6, -2);

        if (this.cockpitView) {
            this.cockpitView.add(this.atmosphericGlow);
            this.rocketObjects.push(this.atmosphericGlow);
        }
    }

    startAtmosphericEntry() {
        console.log('🔥 Atmospheric entry effects starting...');

        // Animate atmospheric glow
        if (this.atmosphericGlow) {
            const startTime = Date.now();
            const duration = 8000;

            const glowInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;

                if (progress >= 1) {
                    clearInterval(glowInterval);
                    return;
                }

                // Intensify glow during entry
                const intensity = Math.sin(progress * Math.PI) * 0.6;
                this.atmosphericGlow.material.opacity = intensity;

                // Add flickering effect
                const flicker = Math.sin(Date.now() * 0.02) * 0.1;
                this.atmosphericGlow.material.opacity += flicker;

                // Slight shake during entry
                this.shakeIntensity = 0.3 + Math.random() * 0.2;
            }, 16);
        }
    }

    crashLanding() {
        console.log('💥 CRASH LANDING!');

        const fadeOverlay = document.getElementById('fade-overlay');
        const textOverlay = document.getElementById('narrative-text');

        // Maximum shake
        this.shakeIntensity = 2;

        // Flash screen white
        fadeOverlay.style.background = '#ffffff';
        fadeOverlay.classList.remove('transparent');

        setTimeout(() => {
            // Fade to black
            fadeOverlay.style.background = '#000000';
            this.shakeIntensity = 0;

            // Show stranded text
            setTimeout(() => {
                textOverlay.textContent = 'LOCATION: PLANET TERRAFORM\nSTATUS: STRANDED';
                textOverlay.classList.add('show');

                setTimeout(() => {
                    textOverlay.classList.remove('show');

                    // Transition to gameplay
                    setTimeout(() => {
                        this.transitionToGameplay();
                    }, 2000);
                }, 4000);
            }, 2000);
        }, 500);
    }

    transitionToGameplay() {
        console.log('🎮 Starting survival gameplay...');

        const fadeOverlay = document.getElementById('fade-overlay');
        const textOverlay = document.getElementById('narrative-text');

        // Show objective text
        setTimeout(() => {
            textOverlay.textContent = 'OBJECTIVE: Scan atmospheric towers and assess core stability';
            textOverlay.classList.add('show');

            setTimeout(() => {
                textOverlay.classList.remove('show');
            }, 5000);
        }, 3000);

        // Create landing pad ground
        this.createLandingPad();

        // Clean up cockpit view, keep landing environment
        if (this.cockpitView) {
            this.cockpitView.visible = false;
        }

        // Position camera behind crashed ship
        this.camera.position.set(0, 2, 10);
        this.camera.lookAt(0, 1, 0);

        // Fade from black to gameplay
        setTimeout(() => {
            fadeOverlay.classList.add('transparent');
        }, 1000);

        // Show controls container and start game button
        const controls = document.getElementById('controls');
        const startBtn = document.getElementById('start-game-btn');

        if (controls) {
            controls.classList.add('show');
        }

        if (startBtn) {
            startBtn.style.display = 'block';

            // Add click handler
            startBtn.addEventListener('click', () => {
                console.log('🎮 Survival gameplay will begin...');
                textOverlay.textContent = 'SURVIVAL MODE COMING SOON!\n\nYou are stranded on Planet Terraform.\nExplore the terraformed world and survive.';
                textOverlay.classList.add('show');

                setTimeout(() => {
                    textOverlay.classList.remove('show');
                }, 6000);
            });
        }

        // Update scene state
        if (this.mainApp) {
            this.mainApp.currentScene = 'gameplay';
        }

        this.isActive = false;

        console.log('✅ Rocket sequence complete - Ready for gameplay!');
    }

    createLandingPad() {
        // Create a simple landing area
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.9,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.rocketObjects.push(ground);

        // Add crashed rocket in distance
        const crashedRocket = new THREE.Group();
        const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = Math.PI / 6; // Tilted
        body.position.y = 1;
        crashedRocket.add(body);

        crashedRocket.position.set(-5, 0, -3);
        this.scene.add(crashedRocket);
        this.rocketObjects.push(crashedRocket);

        // Add dust particles settling
        this.createDustParticles();

        // Restore planet if it exists
        if (this.mainApp && this.mainApp.planet) {
            this.mainApp.planet.mesh.visible = false; // Hide during landing scene
        }
    }

    createDustParticles() {
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = Math.random() * 3;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;

            velocities.push({
                x: (Math.random() - 0.5) * 0.1,
                y: -0.05 - Math.random() * 0.1,
                z: (Math.random() - 0.5) * 0.1
            });
        }

        const dustGeometry = new THREE.BufferGeometry();
        dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const dustMaterial = new THREE.PointsMaterial({
            color: 0xccaa88,
            size: 0.3,
            transparent: true,
            opacity: 0.5
        });

        this.dustParticles = new THREE.Points(dustGeometry, dustMaterial);
        this.dustParticles.userData.velocities = velocities;
        this.scene.add(this.dustParticles);
        this.rocketObjects.push(this.dustParticles);
    }

    update(deltaTime) {
        if (!this.isActive) return;

        // Camera shake effect
        if (this.shakeIntensity > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity * 0.1;
            this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * 0.1;

            // Decay shake
            this.shakeIntensity *= 0.95;
        }

        // Animate smoke particles
        if (this.smokeParticles && this.smokeParticles.visible) {
            const positions = this.smokeParticles.geometry.attributes.position.array;
            const velocities = this.smokeParticles.userData.velocities;

            for (let i = 0; i < velocities.length; i++) {
                const i3 = i * 3;

                // Update position
                positions[i3] += velocities[i].x;
                positions[i3 + 1] += velocities[i].y;
                positions[i3 + 2] += velocities[i].z;

                // Reset particles that drift too far
                if (positions[i3 + 1] > 50) {
                    positions[i3] = (Math.random() - 0.5) * 5;
                    positions[i3 + 1] = -5 + Math.random() * 5;
                    positions[i3 + 2] = -50 + (Math.random() - 0.5) * 5;
                }
            }

            this.smokeParticles.geometry.attributes.position.needsUpdate = true;
        }

        // Animate dust particles
        if (this.dustParticles && this.dustParticles.visible) {
            const positions = this.dustParticles.geometry.attributes.position.array;
            const velocities = this.dustParticles.userData.velocities;

            for (let i = 0; i < velocities.length; i++) {
                const i3 = i * 3;

                // Update position
                positions[i3] += velocities[i].x;
                positions[i3 + 1] += velocities[i].y;
                positions[i3 + 2] += velocities[i].z;

                // Apply gravity
                velocities[i].y -= 0.01;

                // Reset particles that fall or drift too far
                if (positions[i3 + 1] < -2 || Math.abs(positions[i3]) > 20) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 8;

                    positions[i3] = Math.cos(angle) * radius;
                    positions[i3 + 1] = 0;
                    positions[i3 + 2] = Math.sin(angle) * radius;

                    velocities[i].x = Math.cos(angle) * 0.3;
                    velocities[i].y = Math.random() * 0.5 + 0.2;
                    velocities[i].z = Math.sin(angle) * 0.3;
                }
            }

            this.dustParticles.geometry.attributes.position.needsUpdate = true;
        }

        // Flicker screens in cockpit
        if (this.cockpitView && this.cockpitView.visible) {
            this.cockpitView.children.forEach(child => {
                if (child.userData.flickerSpeed && child.userData.baseColor) {
                    const flicker = Math.sin(Date.now() * 0.001 * child.userData.flickerSpeed) * 0.3 + 0.7;
                    const baseColor = new THREE.Color(child.userData.baseColor);
                    child.material.color.r = baseColor.r * flicker;
                    child.material.color.g = baseColor.g * flicker;
                    child.material.color.b = baseColor.b * flicker;
                }
            });
        }

        // Animate alert light
        if (this.cockpitView && this.cockpitView.userData.alertLight) {
            const light = this.cockpitView.userData.alertLight;
            if (light.intensity > 0) {
                light.intensity = Math.sin(Date.now() * 0.01) * 1 + 1;
            }
        }
    }

    skipToGameplay() {
        console.log('⏩ Skipping rocket sequence to gameplay');

        // Clear all timeouts
        const highestId = setTimeout(() => {});
        for (let i = 0; i < highestId; i++) {
            clearTimeout(i);
        }

        // Go straight to gameplay
        this.transitionToGameplay();
    }

    cleanup() {
        // Remove all rocket scene objects
        this.rocketObjects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            if (obj.parent) {
                obj.parent.remove(obj);
            }
        });

        this.rocketObjects = [];
        this.cockpitView = null;
        this.rocket = null;
        this.flames = null;
    }
}
