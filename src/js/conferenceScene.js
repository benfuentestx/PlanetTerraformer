import * as THREE from 'three';

export class ConferenceScene {
    constructor(scene, camera, renderer, mainApp) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.mainApp = mainApp;
        this.isActive = false;
        this.dialogueIndex = 0;
        this.currentSpeaker = null;
        this.characters = [];
        this.roomObjects = [];
        this.isSkipping = false;

        // Dialogue script with positions around table
        this.dialogue = [
            {
                speaker: "Director Harrison",
                text: "Ladies and gentlemen, thank you for joining us. We've just witnessed the successful terraformation of Planet Terraform.",
                voice: "male",
                pitch: 0.8,
                rate: 0.9,
                position: 0, // Center front
                lookAt: new THREE.Vector3(0, 1.5, -4)
            },
            {
                speaker: "Dr. Chen",
                text: "The atmospheric readings are promising. Oxygen levels have stabilized at 21%, temperature is Earth-like, and we're detecting organic compounds.",
                voice: "female",
                pitch: 1.1,
                rate: 1.0,
                position: 1, // Left side
                lookAt: new THREE.Vector3(-3, 1.5, -3)
            },
            {
                speaker: "Commander Rodriguez",
                text: "But we need boots on the ground. Someone has to verify if this planet is truly habitable for human colonization.",
                voice: "male",
                pitch: 1.0,
                rate: 0.95,
                position: 2, // Right side
                lookAt: new THREE.Vector3(3, 1.5, -3)
            },
            {
                speaker: "Dr. Patel",
                text: "The mission will be dangerous. It's a one-way trip until we can establish a stable supply route. We're looking at a minimum 18-month solo deployment.",
                voice: "female",
                pitch: 1.2,
                rate: 0.9,
                position: 3, // Far left
                lookAt: new THREE.Vector3(-4.5, 1.5, -2.5)
            },
            {
                speaker: "Chief Engineer Kowalski",
                text: "We've selected the best candidate. Top marks in survival training, botanical expertise, and engineering. You've been chosen for this mission.",
                voice: "male",
                pitch: 0.9,
                rate: 0.85,
                position: 4, // Far right
                lookAt: new THREE.Vector3(4.5, 1.5, -2.5)
            },
            {
                speaker: "Director Harrison",
                text: "This is humanity's first step toward becoming a multi-planetary species. Are you ready to make history?",
                voice: "male",
                pitch: 0.8,
                rate: 0.9,
                position: 0, // Back to center
                lookAt: new THREE.Vector3(0, 1.5, -4)
            }
        ];

        console.log('🏢 Conference scene initialized');
    }

    async start() {
        console.log('🎬 Starting NASA conference room scene...');
        this.isActive = true;
        if (this.mainApp) this.mainApp.currentScene = 'conference';

        // Setup conference room environment
        this.setupConferenceRoom();

        // Show conference UI (dialogue subtitles at bottom)
        document.getElementById('conference-room').style.display = 'block';
        document.getElementById('conference-room').classList.add('show');

        // Start dialogue sequence
        await this.playDialogue();
    }

    skipToTraining() {
        console.log('⏩ Skipping conference to training...');
        this.isSkipping = true;

        // Stop any ongoing speech
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        // Stop mouth animation
        if (this.mouthInterval) {
            clearInterval(this.mouthInterval);
        }

        // Hide conference room immediately
        const conferenceRoom = document.getElementById('conference-room');
        conferenceRoom.classList.remove('show');
        conferenceRoom.style.display = 'none';

        // Go straight to training montage
        this.startTrainingMontage();
    }

    skipToGameplay() {
        console.log('⏩ Skipping training to gameplay...');

        // Hide training montage immediately
        const montage = document.getElementById('training-montage');
        montage.style.display = 'none';

        // Start gameplay
        this.startGameplay();
    }

    setupConferenceRoom() {
        // Clear any existing scene objects and remove old objects
        this.roomObjects.forEach(obj => this.scene.remove(obj));
        this.roomObjects = [];

        this.scene.background = new THREE.Color(0x3a3a4a);

        // Conference room lighting - bright like real NASA room
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambient);
        this.roomObjects.push(ambient);

        // Ceiling panel lights (like in NASA image) - moved much higher
        for (let x = -6; x <= 6; x += 3) {
            for (let z = -6; z <= 2; z += 3) {
                const panelLight = new THREE.RectAreaLight(0xffffff, 4, 2, 2);
                panelLight.position.set(x, 8, z); // Raised from 5 to 8
                panelLight.lookAt(x, 0, z);
                this.scene.add(panelLight);
                this.roomObjects.push(panelLight);
            }
        }

        // Additional point lights for better illumination
        const mainLight = new THREE.PointLight(0xffffff, 2, 30);
        mainLight.position.set(0, 7, -3);
        this.scene.add(mainLight);
        this.roomObjects.push(mainLight);

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a5568,
            roughness: 0.8,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.roomObjects.push(floor);

        // Conference table (curved oval shape like NASA)
        const tableGeometry = new THREE.CylinderGeometry(3, 3, 0.15, 32);
        const tableMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B6914,
            roughness: 0.2,
            metalness: 0.3
        });
        this.table = new THREE.Mesh(tableGeometry, tableMaterial);
        this.table.position.set(0, 0.95, -3);
        this.table.castShadow = true;
        this.table.receiveShadow = true;
        this.scene.add(this.table);
        this.roomObjects.push(this.table);

        // Wall behind
        const wallGeometry = new THREE.PlaneGeometry(20, 8);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0xc9a961,
            roughness: 0.9
        });
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(0, 4, -8);
        this.scene.add(wall);
        this.roomObjects.push(wall);

        // NASA Logo (circular disc on wall)
        const logoGeometry = new THREE.CircleGeometry(1.2, 64);
        const logoMaterial = new THREE.MeshStandardMaterial({
            color: 0x0B3D91,
            emissive: 0x0B3D91,
            emissiveIntensity: 0.4
        });
        this.logo = new THREE.Mesh(logoGeometry, logoMaterial);
        this.logo.position.set(0, 4.5, -7.95);
        this.scene.add(this.logo);
        this.roomObjects.push(this.logo);

        // White ring around NASA logo
        const ringGeometry = new THREE.RingGeometry(1.2, 1.4, 64);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffff,
            emissiveIntensity: 0.6
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(0, 4.5, -7.94);
        this.scene.add(ring);
        this.roomObjects.push(ring);

        // Monitors on the wall (like in image)
        for (let i = 0; i < 3; i++) {
            const monitorGeometry = new THREE.BoxGeometry(1.8, 1.2, 0.1);
            const monitorMaterial = new THREE.MeshStandardMaterial({
                color: 0x1a1a2e,
                emissive: 0x1a3a5a,
                emissiveIntensity: 0.7
            });
            const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
            monitor.position.set((i - 1) * 2.5, 2.5, -7.9);
            this.scene.add(monitor);
            this.roomObjects.push(monitor);
        }

        // Create 5 characters sitting around table
        this.createCharacters();

        // Position camera as first-person sitting at table
        this.camera.position.set(0, 1.6, 0); // Eye level, sitting at edge of table
        this.camera.lookAt(0, 1.5, -4); // Look at center front initially
    }

    createCharacters() {
        // Character positions around the oval table
        const positions = [
            { x: 0, z: -4, name: "Director Harrison" },      // Center front
            { x: -3, z: -3, name: "Dr. Chen" },              // Left
            { x: 3, z: -3, name: "Commander Rodriguez" },    // Right
            { x: -4.5, z: -2.5, name: "Dr. Patel" },         // Far left
            { x: 4.5, z: -2.5, name: "Chief Engineer Kowalski" } // Far right
        ];

        positions.forEach((pos, index) => {
            const character = this.createCharacter(pos.x, pos.z, pos.name, index);
            this.characters.push(character);
            this.scene.add(character.group);
            this.roomObjects.push(character.group);
        });
    }

    createCharacter(x, z, name, index) {
        const group = new THREE.Group();

        // CHAIR
        // Chair seat
        const seatGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.6);
        const chairMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c3e50,
            roughness: 0.7
        });
        const seat = new THREE.Mesh(seatGeometry, chairMaterial);
        seat.position.y = 0.5;
        group.add(seat);

        // Chair back
        const backGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.1);
        const back = new THREE.Mesh(backGeometry, chairMaterial);
        back.position.set(0, 0.9, -0.25);
        group.add(back);

        // Chair legs (4)
        const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
        const legPositions = [
            [-0.25, 0.25, 0.25],
            [0.25, 0.25, 0.25],
            [-0.25, 0.25, -0.25],
            [0.25, 0.25, -0.25]
        ];
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, chairMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            group.add(leg);
        });

        // CHARACTER
        // Legs (sitting)
        const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8);
        const suitMaterial = new THREE.MeshStandardMaterial({
            color: index % 2 === 0 ? 0x2c3e50 : 0x34495e // Alternating suit colors
        });

        const leftLeg = new THREE.Mesh(legGeo, suitMaterial);
        leftLeg.position.set(-0.15, 0.55, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, suitMaterial);
        rightLeg.position.set(0.15, 0.55, 0);
        group.add(rightLeg);

        // Body (torso) - sitting upright
        const bodyGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.3);
        const body = new THREE.Mesh(bodyGeometry, suitMaterial);
        body.position.y = 1.1;
        group.add(body);

        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);

        const leftArm = new THREE.Mesh(armGeometry, suitMaterial);
        leftArm.position.set(-0.25, 1.0, 0);
        leftArm.rotation.z = Math.PI / 8;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, suitMaterial);
        rightArm.position.set(0.25, 1.0, 0);
        rightArm.rotation.z = -Math.PI / 8;
        group.add(rightArm);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.22, 16, 16);
        const skinTone = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524][index % 5];
        const headMaterial = new THREE.MeshStandardMaterial({
            color: skinTone,
            roughness: 1.0,  // No shininess
            metalness: 0.0   // Not metallic
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.55;
        group.add(head);

        // Hair - different styles for each person
        const hairColor = [0x2c1810, 0x1a0f0a, 0x4a3728, 0x654321, 0x8b7355][index % 5];
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: hairColor,
            roughness: 0.9,
            metalness: 0.0
        });

        // Different hairstyles based on index
        switch(index) {
            case 0: // Director Harrison - Short professional cut
                const hair0 = new THREE.Mesh(
                    new THREE.SphereGeometry(0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
                    hairMaterial
                );
                hair0.position.y = 1.65;
                group.add(hair0);
                break;

            case 1: // Dr. Chen - Bun/updo style
                const hair1Top = new THREE.Mesh(
                    new THREE.SphereGeometry(0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
                    hairMaterial
                );
                hair1Top.position.y = 1.65;
                group.add(hair1Top);

                const bun = new THREE.Mesh(
                    new THREE.SphereGeometry(0.12, 16, 16),
                    hairMaterial
                );
                bun.position.set(0, 1.70, -0.20);
                group.add(bun);
                break;

            case 2: // Commander Rodriguez - Crew cut
                const hair2 = new THREE.Mesh(
                    new THREE.SphereGeometry(0.225, 16, 16, 0, Math.PI * 2, 0, Math.PI / 3),
                    hairMaterial
                );
                hair2.position.y = 1.66;
                group.add(hair2);
                break;

            case 3: // Dr. Patel - Shoulder-length hair
                const hair3Top = new THREE.Mesh(
                    new THREE.SphereGeometry(0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
                    hairMaterial
                );
                hair3Top.position.y = 1.65;
                group.add(hair3Top);

                // Side hair
                const hair3Left = new THREE.Mesh(
                    new THREE.BoxGeometry(0.08, 0.25, 0.15),
                    hairMaterial
                );
                hair3Left.position.set(-0.23, 1.50, 0);
                group.add(hair3Left);

                const hair3Right = new THREE.Mesh(
                    new THREE.BoxGeometry(0.08, 0.25, 0.15),
                    hairMaterial
                );
                hair3Right.position.set(0.23, 1.50, 0);
                group.add(hair3Right);
                break;

            case 4: // Chief Engineer Kowalski - Slicked back
                const hair4 = new THREE.Mesh(
                    new THREE.SphereGeometry(0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.5),
                    hairMaterial
                );
                hair4.position.y = 1.66;
                hair4.rotation.x = -0.2; // Tilted back slightly
                group.add(hair4);
                break;
        }

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.08, 1.6, 0.18);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.08, 1.6, 0.18);
        group.add(rightEye);

        // Mouth (will animate)
        const mouthGeometry = new THREE.PlaneGeometry(0.12, 0.03);
        const mouthMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b0000,
            side: THREE.DoubleSide
        });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 1.48, 0.20);
        group.add(mouth);

        // Position at table
        group.position.set(x, 0, z);

        // Look toward center of table (where YOU are sitting)
        group.lookAt(0, 1.6, 0);

        return {
            group: group,
            head: head,
            mouth: mouth,
            name: name,
            isTalking: false
        };
    }

    async playDialogue() {
        for (let i = 0; i < this.dialogue.length; i++) {
            this.dialogueIndex = i;
            const line = this.dialogue[i];
            const character = this.characters[line.position];

            console.log(`💬 ${line.speaker}: ${line.text}`);

            // Turn camera to look at speaker
            await this.turnCameraToSpeaker(line.lookAt);

            // Update UI
            document.getElementById('speaker-name').textContent = line.speaker;
            document.getElementById('dialogue-text').textContent = line.text;

            // Start mouth animation for this character
            character.isTalking = true;
            this.animateMouth(character, true);

            // Speak the dialogue using Web Speech API
            await this.speak(line.text, line.voice, line.pitch, line.rate);

            // Stop mouth animation
            character.isTalking = false;
            this.animateMouth(character, false);

            // Pause between lines
            await this.wait(500);
        }

        console.log('✅ Conference dialogue complete');

        // Fade out conference room
        await this.wait(1000);
        this.fadeOut();
    }

    turnCameraToSpeaker(lookAtPosition) {
        return new Promise((resolve) => {
            const gsap = window.gsap;
            if (!gsap) {
                this.camera.lookAt(lookAtPosition);
                resolve();
                return;
            }

            // Smooth camera rotation to look at speaker
            const duration = 0.8;
            const targetQuaternion = new THREE.Quaternion();
            const lookAtMatrix = new THREE.Matrix4();

            lookAtMatrix.lookAt(this.camera.position, lookAtPosition, new THREE.Vector3(0, 1, 0));
            targetQuaternion.setFromRotationMatrix(lookAtMatrix);

            gsap.to(this.camera.quaternion, {
                x: targetQuaternion.x,
                y: targetQuaternion.y,
                z: targetQuaternion.z,
                w: targetQuaternion.w,
                duration: duration,
                ease: "power2.out",
                onComplete: resolve
            });
        });
    }

    animateMouth(character, isTalking) {
        if (!character || !character.mouth) return;

        if (isTalking) {
            // Animate mouth opening/closing
            this.mouthInterval = setInterval(() => {
                const scale = 1 + Math.random() * 0.8;
                character.mouth.scale.y = scale;
            }, 100);
        } else {
            // Stop animation and reset mouth
            if (this.mouthInterval) {
                clearInterval(this.mouthInterval);
            }
            character.mouth.scale.y = 1;
        }
    }

    speak(text, voiceType, pitch, rate) {
        return new Promise((resolve) => {
            // Use Web Speech API for human-sounding voices
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);

                // Get available voices
                const voices = speechSynthesis.getVoices();

                // Select voice based on type
                if (voiceType === 'female') {
                    const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria'));
                    if (femaleVoice) utterance.voice = femaleVoice;
                } else {
                    const maleVoice = voices.find(v => v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('David'));
                    if (maleVoice) utterance.voice = maleVoice;
                }

                utterance.pitch = pitch;
                utterance.rate = rate;
                utterance.volume = 1.0;

                utterance.onend = () => {
                    resolve();
                };

                utterance.onerror = () => {
                    console.warn('Speech synthesis error, continuing...');
                    resolve();
                };

                speechSynthesis.speak(utterance);
            } else {
                // Fallback: just wait for reading time
                const readingTime = (text.length / 15) * 1000; // ~15 chars per second
                setTimeout(resolve, readingTime);
            }
        });
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async fadeOut() {
        const conferenceRoom = document.getElementById('conference-room');
        conferenceRoom.classList.remove('show');

        await this.wait(1000);
        conferenceRoom.style.display = 'none';

        // Start training montage
        this.startTrainingMontage();
    }

    async startTrainingMontage() {
        console.log('📚 Starting training montage...');
        if (this.mainApp) this.mainApp.currentScene = 'training';

        const montage = document.getElementById('training-montage');
        const montageText = document.getElementById('montage-text');

        montage.style.display = 'flex';
        montage.style.opacity = '1';

        const messages = [
            "SIX MONTHS LATER...",
            "You trained relentlessly with NASA's best engineers.",
            "Survival protocols. Botanical systems. Emergency procedures.",
            "Every simulation. Every drill. Every sleepless night.",
            "All leading to this moment.",
            "You are ready.",
            "MISSION: TERRAFORM"
        ];

        for (const msg of messages) {
            if (this.isSkipping) break; // Allow skipping during montage

            montageText.textContent = msg;
            montageText.classList.add('show');

            await this.wait(3000);

            montageText.classList.remove('show');
            await this.wait(1000);
        }

        // Fade out montage
        montage.style.opacity = '0';
        await this.wait(2000);
        montage.style.display = 'none';

        console.log('✅ Training montage complete');
        console.log('🚀 Ready to start gameplay...');

        // Start actual gameplay here
        this.startGameplay();
    }

    startGameplay() {
        // This will trigger the actual survival game
        console.log('🎮 GAMEPLAY STARTS HERE');
        if (this.mainApp) this.mainApp.currentScene = 'gameplay';

        // Show temporary message
        const controls = document.getElementById('controls');
        controls.innerHTML = '<button id="start-game-btn">🚀 BEGIN MISSION</button>';
        controls.classList.add('show');

        document.getElementById('start-game-btn').addEventListener('click', () => {
            console.log('🎮 Starting survival gameplay...');
            alert('Survival gameplay will begin here! (Coming soon)');
        });
    }

    update(deltaTime) {
        // Animate NASA logo rotation
        if (this.logo && this.isActive) {
            this.logo.rotation.z += deltaTime * 0.2;
        }
    }
}
