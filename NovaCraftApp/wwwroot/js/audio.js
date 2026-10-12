// Procedural Web Audio Sound Engine, Realistic Mining/Break Audio, Independent SE/BGM Channels for NovaCraft
(function(global) {
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.seMuted = false;
            this.bgmMuted = false;
            this.seVolume = 0.5;
            this.bgmVolume = 0.32;
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

        toggleSEMute() {
            this.seMuted = !this.seMuted;
            return this.seMuted;
        }

        toggleBGMMute() {
            this.bgmMuted = !this.bgmMuted;
            if (!this.bgmMuted && !this.bgmPlaying) {
                this.startAmbientBGM();
            }
            return this.bgmMuted;
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
            if (this.seMuted || !this.ctx) return;
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

            gain.gain.setValueAtTime(0.12 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noiseNode.start(now);
        }

        // Realistic Minecraft Tapping / Digging Impact Sound
        playDig(material = 'stone') {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;

            // 1. Tonal transient knock
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            let fStart = 350;
            let fEnd = 160;
            let noiseFreq = 1200;
            let dur = 0.08;

            if (material === 'wood') {
                osc.type = 'triangle';
                fStart = 260;
                fEnd = 130;
                noiseFreq = 900;
            } else if (material === 'stone') {
                osc.type = 'square';
                fStart = 680;
                fEnd = 300;
                noiseFreq = 2400;
            } else if (material === 'grass' || material === 'dirt') {
                osc.type = 'sine';
                fStart = 180;
                fEnd = 80;
                noiseFreq = 650;
            } else if (material === 'sand' || material === 'gravel') {
                osc.type = 'sine';
                fStart = 220;
                fEnd = 110;
                noiseFreq = 850;
            } else {
                osc.type = 'triangle';
            }

            osc.frequency.setValueAtTime(fStart, now);
            osc.frequency.exponentialRampToValueAtTime(fEnd, now + dur);
            oscGain.gain.setValueAtTime(0.25 * this.seVolume, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
            osc.connect(oscGain);
            oscGain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + dur);

            // 2. Texture noise
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createNoiseBuffer(dur);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(noiseFreq, now);
            const nGain = this.ctx.createGain();
            nGain.gain.setValueAtTime(0.22 * this.seVolume, now);
            nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.ctx.destination);
            noise.start(now);
        }

        // Authentic Minecraft Shattering / Break Sound (Heavy crack + crumble)
        playBreak(material = 'stone') {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;

            // Low thud impact
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
            oscGain.gain.setValueAtTime(0.48 * this.seVolume, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(oscGain);
            oscGain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);

            // Crunchy shattering noise
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createNoiseBuffer(0.25);
            const filter = this.ctx.createBiquadFilter();
            filter.type = (material === 'stone' || material === 'glass') ? 'highpass' : 'bandpass';
            const fFreq = (material === 'stone') ? 1600 : (material === 'wood' ? 1100 : 750);
            filter.frequency.setValueAtTime(fFreq, now);
            filter.frequency.exponentialRampToValueAtTime(280, now + 0.25);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.42 * this.seVolume, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);
        }

        playPlace() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(95, now + 0.1);
            gain.gain.setValueAtTime(0.22 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.1);
        }

        playPop() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
            gain.gain.setValueAtTime(0.18 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        }

        playHit() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
            gain.gain.setValueAtTime(0.25 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        }

        playPlayerHurt() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(65, now + 0.2);
            gain.gain.setValueAtTime(0.35 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        }

        playFuse() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createNoiseBuffer(1.4);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(3000, now);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.15 * this.seVolume, now);
            gain.gain.linearRampToValueAtTime(0.35 * this.seVolume, now + 1.2);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
        }

        playExplosion() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 0.8);
            oscGain.gain.setValueAtTime(0.6 * this.seVolume, now);
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
            noiseGain.gain.setValueAtTime(0.55 * this.seVolume, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);
        }

        playLaser() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.2);
            gain.gain.setValueAtTime(0.25 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.2);
        }

        playAstralSlash() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.35);
            gain.gain.setValueAtTime(0.3 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        }

        playWarp() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
            osc.frequency.exponentialRampToValueAtTime(1760, now + 0.5);
            gain.gain.setValueAtTime(0.25 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
        }

        playHeal() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.12 * this.seVolume, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.25);
            });
        }

        playBubble() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450 + Math.random() * 200, now);
            osc.frequency.exponentialRampToValueAtTime(1100 + Math.random() * 300, now + 0.12);
            gain.gain.setValueAtTime(0.12 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        }

        playMobSound(type) {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            if (type === 'pig') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.linearRampToValueAtTime(160, now + 0.18);
                gain.gain.setValueAtTime(0.15 * this.seVolume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (type === 'cow') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(110, now);
                osc.frequency.linearRampToValueAtTime(85, now + 0.55);
                gain.gain.setValueAtTime(0.25 * this.seVolume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.55);
            } else if (type === 'sheep') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.linearRampToValueAtTime(260, now + 0.4);
                gain.gain.setValueAtTime(0.18 * this.seVolume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (type === 'chicken') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(380, now + 0.12);
                gain.gain.setValueAtTime(0.15 * this.seVolume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'zombie') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.linearRampToValueAtTime(60, now + 0.6);
                gain.gain.setValueAtTime(0.2 * this.seVolume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.6);
            }
        }

        // Peaceful Procedural Piano-like Ambient BGM (Runs on independent BGM channel!)
        startAmbientBGM() {
            if (this.bgmPlaying || this.bgmMuted) return;
            this.bgmPlaying = true;
            this.scheduleNextBGMNote();
        }

        scheduleNextBGMNote() {
            if (!this.bgmPlaying || this.bgmMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
            const freq = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)];

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.08 * this.bgmVolume, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 2.5);

            const delay = 1600 + Math.random() * 3200;
            setTimeout(() => this.scheduleNextBGMNote(), delay);
        }
    }

    global.SoundEngine = SoundEngine;
})(window);
