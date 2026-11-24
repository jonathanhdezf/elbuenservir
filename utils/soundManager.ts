
/**
 * Sound Manager Model - Centralized Logic for UI Audio
 * Categorizes sounds by section and action type.
 */

import { AdminSection } from '../types';

export type AudioAction = 'confirm' | 'alert' | 'notification' | 'error' | 'navigation' | 'click' | 'recycle' | 'popup';

const BASE = (import.meta as any).env?.BASE_URL || '/';

const SOUNDS = {
    // Navigation (Stays as is, requested by user)
    navigation: `${BASE}sonidos/navigation.mp3`,

    // Section-specific confirmation sounds
    confirm_kds: `${BASE}sonidos/confirm_kds.mp3`, // CAMPANA PERSONALIZADA (Boxing Bell)
    confirm_dds: `${BASE}sonidos/confirm-dds.mp3`, // Engine-like blip
    confirm_local_dispatch: `${BASE}sonidos/confirm-local.mp3`, // High-pitch chime
    confirm_tpv: `${BASE}sonidos/confirm-tpv.mp3`, // Register sound-ish
    confirm_generic: `${BASE}sonidos/confirm-generic.mp3`,

    // Alerts for new items
    alert: 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3',
    notification: `${BASE}sonidos/confirm-local.mp3`,
    alert_kds: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Tech Alert
    alert_dds: 'https://assets.mixkit.co/active_storage/sfx/2580/2580-preview.mp3', // Digital notice
    alert_local: 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3', // Notification

    // System
    error: `${BASE}sonidos/error.wav`,
    click: `${BASE}sonidos/click.mp3`,
    recycle: `${BASE}sonidos/confirm-recycle.mp3`,
};

class SoundManager {
    private static instance: SoundManager;
    private audioRefs: Record<string, HTMLAudioElement> = {};
    private audioCtx: AudioContext | null = null;
    private lastPlayed: number = 0;
    private lastPopupPlayed: number = 0;
    private readonly COOLDOWN = 350;

    private constructor() {
        this.preload();
        this.setupAudioUnlock();
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private getAudioContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.audioCtx) {
            const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (Ctx) {
                try {
                    this.audioCtx = new Ctx();
                } catch {
                    return null;
                }
            }
        }
        return this.audioCtx;
    }

    private setupAudioUnlock() {
        if (typeof window === 'undefined') return;
        const unlock = () => {
            const ctx = this.getAudioContext();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch(() => { });
            }
        };
        window.addEventListener('pointerdown', unlock, { passive: true });
        window.addEventListener('touchstart', unlock, { passive: true });
        window.addEventListener('keydown', unlock, { passive: true });
    }

    private preload() {
        Object.entries(SOUNDS).forEach(([key, url]) => {
            const audio = new Audio(url);
            audio.preload = 'auto';
            audio.volume = 0.20;
            this.audioRefs[key] = audio;
        });
    }

    private playSynthesizedPopup(onBlocked?: () => void) {
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const triggerNotes = () => {
            const now = ctx.currentTime;
            const master = ctx.createGain();
            master.gain.setValueAtTime(0.65, now);
            master.connect(ctx.destination);

            // 1. Instant tactile bubble "pop" at t = 0ms (unmistakable pop-up opening)
            const popOsc = ctx.createOscillator();
            const popGain = ctx.createGain();
            popOsc.type = 'sine';
            popOsc.frequency.setValueAtTime(320, now);
            popOsc.frequency.exponentialRampToValueAtTime(920, now + 0.055);
            popGain.gain.setValueAtTime(0.001, now);
            popGain.gain.linearRampToValueAtTime(0.42, now + 0.006);
            popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
            popOsc.connect(popGain);
            popGain.connect(master);
            popOsc.start(now);
            popOsc.stop(now + 0.08);

            // 2. Cheerful two-note ascending pop-up chime (G5 -> C6 + E6 shimmer)
            const notes = [
                { freq: 783.99, start: 0.04, dur: 0.16, peak: 0.26, type: 'triangle' as OscillatorType },
                { freq: 1046.50, start: 0.105, dur: 0.28, peak: 0.30, type: 'sine' as OscillatorType },
                { freq: 1318.51, start: 0.145, dur: 0.26, peak: 0.14, type: 'sine' as OscillatorType }
            ];

            notes.forEach(({ freq, start, dur, peak, type }) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, now + start);

                gain.gain.setValueAtTime(0.001, now + start);
                gain.gain.linearRampToValueAtTime(peak, now + start + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

                osc.connect(gain);
                gain.connect(master);
                osc.start(now + start);
                osc.stop(now + start + dur + 0.01);
            });
        };

        if (ctx.state === 'suspended') {
            ctx.resume()
                .then(() => {
                    if (ctx.state === 'running') {
                        triggerNotes();
                    } else if (onBlocked) {
                        onBlocked();
                    }
                })
                .catch(() => {
                    if (onBlocked) onBlocked();
                });
            return;
        }

        triggerNotes();
    }

    public playPopup(onBlocked?: () => void) {
        const now = Date.now();
        if (now - this.lastPopupPlayed < 400) return;
        this.lastPopupPlayed = now;

        this.playSynthesizedPopup(onBlocked);
    }

    public play(action: AudioAction, section?: AdminSection) {
        if (action === 'popup') {
            this.playPopup();
            return;
        }

        const now = Date.now();
        if (now - this.lastPlayed < this.COOLDOWN) return;

        let soundKey = action as string;

        // Resolve specific sound for confirmation by section
        if (action === 'confirm' && section) {
            const specificKey = `confirm_${section}`;
            if (SOUNDS[specificKey as keyof typeof SOUNDS]) {
                soundKey = specificKey;
            } else {
                soundKey = 'confirm_generic';
            }
        }

        // Map alerts to section
        if (action === 'alert' && section) {
            const alertKey = `alert_${section}`;
            if (SOUNDS[alertKey as keyof typeof SOUNDS]) {
                soundKey = alertKey;
            }
        }

        const audio = this.audioRefs[soundKey];
        if (audio) {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
            this.lastPlayed = now;
            audio.play().catch(() => { });
        }
    }
}

export const soundManager = SoundManager.getInstance();
