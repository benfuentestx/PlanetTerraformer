import * as THREE from 'three';

// GSAP will be loaded via importmap, so we'll use it globally
const gsap = window.gsap || { timeline: () => ({ to: () => {}, call: () => {}, pause: () => {}, restart: () => {} }) };

export class Animation {
    constructor(camera, planet, audioSystem, conferenceScene) {
        this.camera = camera;
        this.planet = planet;
        this.audioSystem = audioSystem;
        this.conferenceScene = conferenceScene;
        this.timeline = null;
        this.isPlaying = false;
        this.currentProgress = 0;

        console.log('🎬 Animation system ready');
    }

    play() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.createTimeline();
        this.timeline.play();

        console.log('▶️ Playing cinematic timeline');
    }

    createTimeline() {
        // Create GSAP timeline
        this.timeline = gsap.timeline({
            onUpdate: () => {
                this.updateProgress();
            },
            onComplete: () => {
                this.onComplete();
            }
        });

        const cam = this.camera;
        const planet = this.planet;

        // ==========================================
        // SEQUENCE 1: INTRO (0-5s)
        // ==========================================
        this.timeline
            // Start far away
            .call(() => {
                this.showText("The planet was once lifeless...");
                cam.position.set(0, 3, 25);
                cam.lookAt(0, 0, 0);
            })
            // Dolly in slowly
            .to(cam.position, {
                z: 18,
                duration: 5,
                ease: "power2.inOut"
            }, 0);

        // ==========================================
        // SEQUENCE 2: DISCOVERY (5-10s)
        // ==========================================
        this.timeline
            .call(() => {
                this.showText("A barren rock, drifting in the void.");
            }, null, 5)
            .to(cam.position, {
                y: 1,
                z: 15,
                duration: 5,
                ease: "power1.inOut"
            }, 5);

        // ==========================================
        // SEQUENCE 3: TRANSFORMATION BEGINS (10-18s)
        // ==========================================
        this.timeline
            .call(() => {
                this.showText("Until we began the terraformation.");
                // Start emission glow
                if (planet.material) {
                    gsap.to(planet.material.uniforms.emissionIntensity, {
                        value: 0.5,
                        duration: 2
                    });
                }
                // Show particles
                if (planet.particles) {
                    gsap.to(planet.particles.material, {
                        opacity: 0.8,
                        duration: 2
                    });
                }
            }, null, 10)
            // Orbit around the planet
            .to(cam.position, {
                x: 12,
                y: 2,
                z: 8,
                duration: 8,
                ease: "power2.inOut",
                onUpdate: () => {
                    cam.lookAt(0, 0, 0);
                }
            }, 10);

        // ==========================================
        // SEQUENCE 4: GREENING (18-28s)
        // ==========================================
        this.timeline
            .call(() => {
                this.showText("Life took root.");
                // Begin planet transformation
                if (planet.material) {
                    gsap.to(planet.material.uniforms.mixValue, {
                        value: 0.5,
                        duration: 8,
                        ease: "power1.in"
                    });
                }
                // Atmosphere turns blue
                if (planet.atmosphereMaterial) {
                    gsap.to(planet.atmosphereMaterial.uniforms.atmosphereColor.value, {
                        r: 0.3,
                        g: 0.5,
                        b: 1.0,
                        duration: 6
                    });
                    gsap.to(planet.atmosphereMaterial.uniforms.intensity, {
                        value: 1.0,
                        duration: 6
                    });
                }
                // Clouds appear
                if (planet.clouds) {
                    gsap.to(planet.clouds.material, {
                        opacity: 0.3,
                        duration: 5
                    });
                }
            }, null, 18)
            .to(cam.position, {
                x: -10,
                y: 3,
                z: 10,
                duration: 10,
                ease: "sine.inOut",
                onUpdate: () => {
                    cam.lookAt(0, 0, 0);
                }
            }, 18);

        // ==========================================
        // SEQUENCE 5: FLOURISHING (28-38s)
        // ==========================================
        this.timeline
            .call(() => {
                this.showText("Hope returned.");
                // Complete transformation
                if (planet.material) {
                    gsap.to(planet.material.uniforms.mixValue, {
                        value: 1.0,
                        duration: 8
                    });
                    gsap.to(planet.material.uniforms.emissionIntensity, {
                        value: 0,
                        duration: 4
                    });
                }
                // Fade particles
                if (planet.particles) {
                    gsap.to(planet.particles.material, {
                        opacity: 0,
                        duration: 4
                    });
                }
            }, null, 28)
            .to(cam.position, {
                x: 0,
                y: 5,
                z: 12,
                duration: 10,
                ease: "power2.out",
                onUpdate: () => {
                    cam.lookAt(0, 0, 0);
                }
            }, 28);

        // ==========================================
        // SEQUENCE 6: FINALE (38-45s)
        // ==========================================
        this.timeline
            .call(() => {
                this.showText("A world reborn.");
            }, null, 38)
            .to(cam.position, {
                y: 8,
                z: 15,
                duration: 5,
                ease: "power1.inOut",
                onUpdate: () => {
                    cam.lookAt(0, 0, 0);
                }
            }, 38)
            .call(() => {
                this.showText("Planet Restored.");
            }, null, 43);

        // Total duration: ~45 seconds
    }

    showText(text) {
        const textElement = document.getElementById('narrative-text');
        textElement.classList.remove('show');

        setTimeout(() => {
            textElement.textContent = text;
            textElement.classList.add('show');
        }, 500);

        // Hide after 4 seconds
        setTimeout(() => {
            textElement.classList.remove('show');
        }, 4500);
    }

    updateProgress() {
        const progress = this.timeline.progress() * 100;
        document.getElementById('progress-bar').style.width = progress + '%';
    }

    onComplete() {
        console.log('✅ Cinematic complete');
        this.isPlaying = false;

        // Kill all GSAP animations on camera to prevent interference with orbit controls
        if (this.timeline) {
            this.timeline.pause();
        }
        gsap.killTweensOf(this.camera.position);
        gsap.killTweensOf(this.camera.rotation);

        // Hide cinematic controls
        document.getElementById('controls').classList.remove('show');

        // Clear narrative text
        this.showText("");

        // Start conference room scene
        setTimeout(() => {
            if (this.conferenceScene) {
                this.conferenceScene.start();
            }
        }, 2000);
    }

    restart() {
        console.log('🔄 Restarting cinematic');

        // Reset progress
        document.getElementById('progress-bar').style.width = '0%';

        // Hide controls
        document.getElementById('replay-btn').style.display = 'none';
        document.getElementById('orbit-btn').style.display = 'none';

        // Reset planet state
        if (this.planet.material) {
            this.planet.material.uniforms.mixValue.value = 0;
            this.planet.material.uniforms.emissionIntensity.value = 0;
        }
        if (this.planet.atmosphereMaterial) {
            this.planet.atmosphereMaterial.uniforms.atmosphereColor.value = new THREE.Color(0x666666);
            this.planet.atmosphereMaterial.uniforms.intensity.value = 0.3;
        }
        if (this.planet.clouds) {
            this.planet.clouds.material.opacity = 0;
        }
        if (this.planet.particles) {
            this.planet.particles.material.opacity = 0;
        }

        // Restart timeline
        this.isPlaying = true;
        this.timeline.restart();
    }

    resetCamera() {
        // Kill any existing camera tweens first
        gsap.killTweensOf(this.camera.position);

        gsap.to(this.camera.position, {
            x: 0,
            y: 5,
            z: 15,
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                this.camera.lookAt(0, 0, 0);
            }
        });
    }

    pause() {
        // Pause timeline and kill all camera animations for orbit control
        if (this.timeline) {
            this.timeline.pause();
        }
        gsap.killTweensOf(this.camera.position);
        gsap.killTweensOf(this.camera.rotation);
        console.log('⏸️ Animation paused for orbit mode');
    }

    resume() {
        // Resume timeline if it was playing
        if (this.timeline && this.isPlaying) {
            this.timeline.resume();
            console.log('▶️ Animation resumed');
        }
    }

    update(deltaTime) {
        // Update can be used for manual timeline control if needed
    }
}
