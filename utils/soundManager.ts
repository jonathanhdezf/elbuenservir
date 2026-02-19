
/**
 * Sound Manager Model - Centralized Logic for UI Audio
 * Categorizes sounds by section and action type.
 */

export type AudioAction = 'confirm' | 'alert' | 'notification' | 'error' | 'navigation' | 'click';
export type AdminSection = 'dashboard' | 'orders' | 'menu' | 'customers' | 'staff' | 'configuration' | 'kds' | 'dds' | 'local_dispatch' | 'driver_panel' | 'reports' | 'tpv';

const SOUNDS = {
    // Navigation (Stays as is, requested by user)
    navigation: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',

    // Section-specific confirmation sounds
    confirm_kds: '/sonidos/confirm_kds.mp3', // CAMPANA PERSONALIZADA (Boxing Bell)
    confirm_dds: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3', // Engine-like blip
    confirm_local: 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3', // High-pitch chime
    confirm_tpv: 'https://assets.mixkit.co/active_storage/sfx/2575/2575-preview.mp3', // Register sound-ish
    confirm_generic: 'https://pixabay.com/es/sound-effects/pel%C3%ADculas-y-efectos-especiales-descent-whoosh-long-cinematic-sound-effect-405921/',

    // Alerts for new items
    alert_kds: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Tech Alert
    alert_dds: 'https://assets.mixkit.co/active_storage/sfx/2580/2580-preview.mp3', // Digital notice
    alert_local: 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3', // Notification

    // System
    error: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
};

class SoundManager {
    private static instance: SoundManager;
    private audioRefs: Record<string, HTMLAudioElement> = {};
    private lastPlayed: number = 0;
    private readonly COOLDOWN = 350;

    private constructor() {
        this.preload();
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private preload() {
        Object.entries(SOUNDS).forEach(([key, url]) => {
            const audio = new Audio(url);
            audio.preload = 'auto';
            audio.volume = 0.12;
            this.audioRefs[key] = audio;
        });
    }

    public play(action: AudioAction, section?: AdminSection) {
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
