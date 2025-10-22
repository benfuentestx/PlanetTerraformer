export class AudioSystem {
    constructor() {
        this.context = null;
        this.initialized = false;
        this.drones = [];

        console.log('🔊 Audio system ready');
    }

    init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('✅ Audio context initialized');
        } catch (e) {
            console.warn('Audio API not supported');
        }
    }

    playAmbient() {
        this.init();
        if (!this.context) return;

        // Low frequency drone (sci-fi atmosphere)
        this.createDrone(60, 0.03);
        this.createDrone(120, 0.02);
        this.createDrone(180, 0.015);

        console.log('🎵 Ambient soundscape playing');
    }

    createDrone(frequency, volume) {
        if (!this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.value = frequency;

        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 1;

        gainNode.gain.value = 0;
        gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + 3);

        oscillator.start();

        // Add LFO for movement
        const lfo = this.context.createOscillator();
        const lfoGain = this.context.createGain();

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        lfo.frequency.value = 0.2;
        lfoGain.gain.value = 50;
        lfo.start();

        this.drones.push({ oscillator, gainNode, filter, lfo });
    }

    playTransformation() {
        if (!this.context) return;

        // Rising hum during terraforming
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.setValueAtTime(100, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 4);

        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 4);

        oscillator.start();
        oscillator.stop(this.context.currentTime + 4);
    }

    stopAll() {
        this.drones.forEach(drone => {
            drone.oscillator.stop();
            drone.lfo.stop();
        });
        this.drones = [];
    }
}
