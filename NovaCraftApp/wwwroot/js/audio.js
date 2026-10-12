// Procedural Web Audio Sound Engine and Ambient Music for NovaCraft
(function(global) {
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.muted = false;
            this.masterVolume = 0.4;
            this.bgmPlaying = false;
            this.jetpackOsc = null;
        }

        init() {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        createNoiseBuffer(duration = 0.2) {
            if (!this.ctx) return null;
            const bufferSize = Math.floor(this.ctx.sampleRate * duration);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            return buffer;
        }

        playStep(material = 'grass') {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            const noiseNode = this.ctx.createBufferSource();
            noiseNode.buffer = this.createNoiseBuffer(0.08);

            switch (material) {
                case 'grass':
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(600, now);
                    break;
                case 'stone':
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(1400, now);
                    break;
                case 'wood':
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(900, now);
                    break;
                case 'sand':
                case 'gravel':
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(450, now);
                    break;
                default:
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(700, now);
            }

            gain.gain.setValueAtTime(0.12 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noiseNode.start(now);
        }

        playDig(material = 'stone') {
            if (this.muted || !this.ctx) return;
            this.playStep(material);
        }

        playBreak(material = 'stone') {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            
            // Low thud + crunchy noise
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
            oscGain.gain.setValueAtTime(0.3 * this.masterVolume, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(oscGain);
            oscGain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);

            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createNoiseBuffer(0.18);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1000, now);
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.25 * this.masterVolume, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);
        }

        playPlace() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
            gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        }

        playPop() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
            gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        }

        playHit() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
            gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        }

        playPlayerHurt() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
            gain.gain.setValueAtTime(0.4 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        }

        playFuse() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createNoiseBuffer(1.4);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(3000, now);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
            gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, now + 1.2);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
        }

        playExplosion() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            // Massive deep boom + crunchy lowpass noise
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 0.8);
            oscGain.gain.setValueAtTime(0.6 * this.masterVolume, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc.connect(oscGain);
            oscGain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.8);

            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createNoiseBuffer(0.9);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.exponentialRampToValueAtTime(200, now + 0.9);
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.55 * this.masterVolume, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);
        }

        // ★ Custom: Laser Drill
        playLaser() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.2);
            gain.gain.setValueAtTime(0.25 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        }

        // ★ Custom: Astral Blade shockwave
        playAstralSlash() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.35);
            gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        }

        // ★ Custom: Waygate Teleport
        playWarp() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.4);
            gain.gain.setValueAtTime(0.35 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        }

        // ★ Custom: Healing
        playHeal() {
            if (this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, High C
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.12 * this.masterVolume, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.25);
            });
        }

        // Peaceful Procedural Piano-like Ambient BGM
        startAmbientBGM() {
            if (this.bgmPlaying || this.muted) return;
            this.bgmPlaying = true;
            this.scheduleNextBGMNote();
        }

        scheduleNextBGMNote() {
            if (!this.bgmPlaying || this.muted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // C D E G A C D E
            const freq = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)];

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            // Soft warm attack & slow gentle decay
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 2.5);

            // Interval between notes (random 1.5s to 4.5s)
            const delay = 1500 + Math.random() * 3000;
            setTimeout(() => this.scheduleNextBGMNote(), delay);
        }
    }

    global.SoundEngine = SoundEngine;
})(window);
