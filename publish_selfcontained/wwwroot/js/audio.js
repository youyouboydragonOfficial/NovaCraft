// Authentic Minecraft C418-Style Warm Piano BGM & Zero-Noise Acoustic Sound Engine for NovaCraft
(function(global) {
    // C418 "Sweden" / "Wet Hands" inspired warm piano chord & melody sequence (in Hz)
    // Each step: { chord: [freq...], melody: [ { f, delay, dur }... ], wait: ms }
    const PIANO_SCORE = [
        // Measure 1: Fmaj7 (Warm, nostalgic opening)
        {
            chord: [174.61, 220.00, 261.63, 329.63], // F3, A3, C4, E4
            melody: [
                { f: 440.00, delay: 0.0, dur: 1.8 }, // A4
                { f: 523.25, delay: 0.9, dur: 1.8 }, // C5
                { f: 659.25, delay: 1.8, dur: 2.2 }  // E5
            ],
            wait: 3400
        },
        // Measure 2: Cmaj7
        {
            chord: [130.81, 196.00, 246.94, 329.63], // C3, G3, B3, E4
            melody: [
                { f: 587.33, delay: 0.0, dur: 1.6 }, // D5
                { f: 523.25, delay: 0.9, dur: 1.6 }, // C5
                { f: 392.00, delay: 1.8, dur: 2.4 }  // G4
            ],
            wait: 3400
        },
        // Measure 3: Dm7
        {
            chord: [146.83, 220.00, 261.63, 349.23], // D3, A3, C4, F4
            melody: [
                { f: 440.00, delay: 0.0, dur: 1.6 }, // A4
                { f: 523.25, delay: 0.9, dur: 1.6 }, // C5
                { f: 587.33, delay: 1.8, dur: 2.2 }  // D5
            ],
            wait: 3400
        },
        // Measure 4: Am7
        {
            chord: [110.00, 164.81, 220.00, 261.63], // A2, E3, A3, C4
            melody: [
                { f: 523.25, delay: 0.0, dur: 1.8 }, // C5
                { f: 440.00, delay: 1.1, dur: 2.5 }  // A4
            ],
            wait: 3600
        },
        // Measure 5: Bbmaj7 (Emotional lift)
        {
            chord: [116.54, 174.61, 220.00, 293.66], // Bb2, F3, A3, D4
            melody: [
                { f: 587.33, delay: 0.0, dur: 1.4 }, // D5
                { f: 659.25, delay: 0.8, dur: 1.4 }, // E5
                { f: 698.46, delay: 1.6, dur: 2.2 }  // F5
            ],
            wait: 3400
        },
        // Measure 6: Fmaj7 / C
        {
            chord: [130.81, 174.61, 220.00, 329.63], // C3, F3, A3, E4
            melody: [
                { f: 659.25, delay: 0.0, dur: 1.4 }, // E5
                { f: 523.25, delay: 0.9, dur: 1.6 }, // C5
                { f: 440.00, delay: 1.8, dur: 2.2 }  // A4
            ],
            wait: 3400
        },
        // Measure 7: G6 -> Cmaj9 (Peaceful resolution)
        {
            chord: [196.00, 246.94, 293.66, 329.63], // G3, B3, D4, E4
            melody: [
                { f: 392.00, delay: 0.0, dur: 1.8 }, // G4
                { f: 329.63, delay: 1.2, dur: 2.6 }  // E4
            ],
            wait: 4000
        },
        // Measure 8: Cmaj7 warm rest
        {
            chord: [130.81, 196.00, 261.63, 329.63], // C3, G3, C4, E4
            melody: [
                { f: 293.66, delay: 0.4, dur: 3.0 }  // D4
            ],
            wait: 4200
        }
    ];

    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.seMuted = false;
            this.bgmMuted = false;
            this.seVolume = 0.42;
            this.bgmVolume = 0.55;
            this.bgmPlaying = false;
            this.bgmStepIndex = 0;
            this.bgmTimer = null;
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
            if (this.bgmMuted) {
                if (this.bgmTimer) {
                    clearTimeout(this.bgmTimer);
                    this.bgmTimer = null;
                }
                this.bgmPlaying = false;
            } else if (!this.bgmPlaying) {
                this.startAmbientBGM();
            }
            return this.bgmMuted;
        }

        // Smooth brown-noise buffer (deep low-frequency rumble only for explosions, NEVER harsh static!)
        createSoftRumbleBuffer(duration = 0.4) {
            if (!this.ctx) return null;
            const bufferSize = Math.floor(this.ctx.sampleRate * duration);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = buffer.getChannelData(0);
            let lastOut = 0.0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.0;
            }
            return buffer;
        }

        // Warm Felt-Piano Note Synthesizer (C418 style)
        playPianoNote(freq, startTime, duration = 2.4, velocity = 0.14) {
            if (!this.ctx || this.bgmMuted) return;

            // Fundamental warm sine + soft 2nd harmonic triangle through a warm felt lowpass filter
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(freq, startTime);

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(freq, startTime);

            // Felt piano lowpass filter: starts slightly bright on hammer strike, then softens warmly
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(Math.min(1800, freq * 3.2), startTime);
            filter.frequency.exponentialRampToValueAtTime(Math.max(280, freq * 1.4), startTime + duration * 0.7);

            const osc2Gain = this.ctx.createGain();
            osc2Gain.gain.setValueAtTime(0.22, startTime);

            const peakGain = Math.max(0.002, velocity * this.bgmVolume);
            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.045); // Soft felt hammer attack
            gain.gain.exponentialRampToValueAtTime(peakGain * 0.45, startTime + 0.45);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            osc1.connect(filter);
            osc2.connect(osc2Gain);
            osc2Gain.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc1.start(startTime);
            osc2.start(startTime);
            osc1.stop(startTime + duration + 0.05);
            osc2.stop(startTime + duration + 0.05);
        }

        // Zero-Noise Acoustic Footstep (Clean, soft, muffled thud)
        playStep(material = 'grass') {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            let fStart = 125;
            let fEnd = 48;
            if (material === 'stone' || material === 'metal') {
                osc.type = 'triangle';
                fStart = 185;
                fEnd = 75;
            } else if (material === 'wood') {
                osc.type = 'triangle';
                fStart = 155;
                fEnd = 62;
            } else if (material === 'sand' || material === 'snow') {
                fStart = 105;
                fEnd = 42;
            }

            // Slight natural pitch variation per step
            const pitchVar = 0.94 + Math.random() * 0.12;
            osc.frequency.setValueAtTime(fStart * pitchVar, now);
            osc.frequency.exponentialRampToValueAtTime(fEnd * pitchVar, now + 0.055);

            gain.gain.setValueAtTime(0.09 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        }

        // Clean Acoustic Mining / Digging Tap (No white noise!)
        playDig(material = 'stone') {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(950, now);

            let fStart = 240;
            let fEnd = 90;
            if (material === 'stone' || material === 'metal') {
                osc.type = 'triangle';
                fStart = 360;
                fEnd = 140;
            } else if (material === 'wood') {
                osc.type = 'triangle';
                fStart = 220;
                fEnd = 95;
            } else {
                osc.type = 'sine';
                fStart = 170;
                fEnd = 65;
            }

            const pVar = 0.95 + Math.random() * 0.1;
            osc.frequency.setValueAtTime(fStart * pVar, now);
            osc.frequency.exponentialRampToValueAtTime(fEnd * pVar, now + 0.065);

            gain.gain.setValueAtTime(0.18 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.07);
        }

        // Clean Block Break Sound (Two-tone woody/stony pop + low thud, zero static!)
        playBreak(material = 'stone') {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;

            const freqs = (material === 'stone' || material === 'metal') ? [310, 210, 120] : [220, 155, 85];
            freqs.forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                const t = now + idx * 0.028;
                osc.frequency.setValueAtTime(f, t);
                osc.frequency.exponentialRampToValueAtTime(f * 0.45, t + 0.09);

                gain.gain.setValueAtTime(0.24 * this.seVolume, t);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.095);
            });
        }

        playPlace() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(190, now);
            osc.frequency.exponentialRampToValueAtTime(280, now + 0.04);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);
            gain.gain.setValueAtTime(0.22 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.095);
        }

        playPop() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(840, now + 0.065);
            gain.gain.setValueAtTime(0.18 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.07);
        }

        // Flint and Steel metallic click spark!
        playFlintAndSteel() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            [880, 1320].forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                const t = now + idx * 0.025;
                osc.frequency.setValueAtTime(f, t);
                osc.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.045);
                gain.gain.setValueAtTime(0.22 * this.seVolume, t);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.055);
            });
        }

        // Bow shoot twang
        playBowShoot() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.09);
            gain.gain.setValueAtTime(0.22 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        }

        playHit() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(75, now + 0.10);
            gain.gain.setValueAtTime(0.25 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.11);
        }

        playFireExtinguish() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, now);
            filter.Q.setValueAtTime(3.0, now);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.25 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
        }

        playEndPortalOpen() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            // Deep resonant void drone + celestial harmonic chime
            [55, 110, 165, 330].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = (idx === 0) ? 'sawtooth' : 'sine';
                osc.frequency.setValueAtTime(freq, now);
                osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 2.5);
                gain.gain.setValueAtTime((0.15 / (idx + 1)) * this.seVolume, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + 2.9);
            });
        }

        playDragonRoar() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            filter.type = 'lowpass';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 1.2);
            filter.frequency.setValueAtTime(450, now);
            filter.frequency.exponentialRampToValueAtTime(120, now + 1.2);

            gain.gain.setValueAtTime(0.35 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 1.35);
        }

        playPlayerHurt() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.16);
            gain.gain.setValueAtTime(0.28 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.17);
        }

        playFuse() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(980, now + 0.45);
            gain.gain.setValueAtTime(0.14 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.46);
        }

        playExplosion() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;

            // Deep sub-bass boom
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(22, now + 0.65);
            oscGain.gain.setValueAtTime(0.65 * this.seVolume, now);
            oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
            osc.connect(oscGain);
            oscGain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.66);

            // Warm lowpass rumble
            const rumble = this.ctx.createBufferSource();
            rumble.buffer = this.createSoftRumbleBuffer(0.65);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(360, now);
            filter.frequency.exponentialRampToValueAtTime(80, now + 0.65);
            const rGain = this.ctx.createGain();
            rGain.gain.setValueAtTime(0.45 * this.seVolume, now);
            rGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
            rumble.connect(filter);
            filter.connect(rGain);
            rGain.connect(this.ctx.destination);
            rumble.start(now);
        }

        playLaser() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(260, now + 0.16);
            gain.gain.setValueAtTime(0.20 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.17);
        }

        playAstralSlash() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.25);
            gain.gain.setValueAtTime(0.22 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.26);
        }

        playWarp() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            [330, 440, 659.25, 880].forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                const t = now + idx * 0.06;
                osc.frequency.setValueAtTime(f, t);
                gain.gain.setValueAtTime(0.16 * this.seVolume, t);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.30);
            });
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
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.26);
            });
        }

        playBubble() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450 + Math.random() * 150, now);
            osc.frequency.exponentialRampToValueAtTime(900 + Math.random() * 200, now + 0.10);
            gain.gain.setValueAtTime(0.10 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.11);
        }

        playFireExtinguish() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, now);
            filter.Q.setValueAtTime(3.0, now);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.25 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
        }

        playEndPortalOpen() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            // Deep resonant void drone + celestial harmonic chime
            [55, 110, 165, 330].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = (idx === 0) ? 'sawtooth' : 'sine';
                osc.frequency.setValueAtTime(freq, now);
                osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 2.5);
                gain.gain.setValueAtTime((0.15 / (idx + 1)) * this.seVolume, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + 2.9);
            });
        }

        playDragonRoar() {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            filter.type = 'lowpass';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 1.2);
            filter.frequency.setValueAtTime(450, now);
            filter.frequency.exponentialRampToValueAtTime(120, now + 1.2);

            gain.gain.setValueAtTime(0.35 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 1.35);
        }

        // Gentle, non-harsh mob sounds
        playMobSound(type) {
            if (this.seMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(550, now);
            osc.type = 'triangle';

            let fStart = 180, fEnd = 130, dur = 0.22;
            if (type === 'pig') {
                fStart = 210; fEnd = 155; dur = 0.14;
            } else if (type === 'cow') {
                fStart = 115; fEnd = 92; dur = 0.38;
            } else if (type === 'sheep') {
                fStart = 260; fEnd = 220; dur = 0.26;
            } else if (type === 'chicken') {
                osc.type = 'sine';
                fStart = 520; fEnd = 390; dur = 0.10;
            } else if (type === 'zombie') {
                fStart = 95; fEnd = 72; dur = 0.35;
            } else if (type === 'skeleton') {
                fStart = 340; fEnd = 210; dur = 0.12;
            } else if (type === 'warden') {
                fStart = 68; fEnd = 45; dur = 0.55;
            } else if (type === 'ender_dragon') {
                this.playDragonRoar();
                return;
            } else {
                fStart = 160; fEnd = 110; dur = 0.15;
            }

            osc.frequency.setValueAtTime(fStart, now);
            osc.frequency.linearRampToValueAtTime(fEnd, now + dur);
            gain.gain.setValueAtTime(0.09 * this.seVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + dur + 0.02);
        }

        // ★ Authentic C418-style Peaceful Piano BGM ("Sweden" / "Wet Hands")
        startAmbientBGM() {
            if (this.bgmPlaying || this.bgmMuted) return;
            this.init();
            this.bgmPlaying = true;
            this.scheduleNextBGMNote();
        }

        scheduleNextBGMNote() {
            if (!this.bgmPlaying || this.bgmMuted || !this.ctx) return;
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            const now = this.ctx.currentTime + 0.05;
            const step = PIANO_SCORE[this.bgmStepIndex % PIANO_SCORE.length];
            this.bgmStepIndex++;

            // 1. Play warm arpeggiated piano chord
            step.chord.forEach((freq, idx) => {
                this.playPianoNote(freq, now + idx * 0.08, 3.2, 0.09);
            });

            // 2. Play expressive top melody notes
            step.melody.forEach(note => {
                this.playPianoNote(note.f, now + note.delay, note.dur, 0.16);
            });

            if (this.bgmTimer) clearTimeout(this.bgmTimer);
            this.bgmTimer = setTimeout(() => this.scheduleNextBGMNote(), step.wait);
        }
    }

    global.SoundEngine = SoundEngine;
})(window);
