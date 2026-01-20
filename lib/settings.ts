import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'pong_settings';

export interface GameSettings {
    vibration: boolean;
    sound: boolean;
}

const defaultSettings: GameSettings = {
    vibration: true,
    sound: true,
};

export const saveSettings = async (settings: GameSettings) => {
    try {
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to save settings', e);
    }
};

export const loadSettings = async (): Promise<GameSettings> => {
    try {
        const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : defaultSettings;
    } catch (e) {
        console.error('Failed to load settings', e);
        return defaultSettings;
    }
};

// Global State simple manager for reactive updates if needed
let currentSettings = defaultSettings;
export const getSettingsSync = () => currentSettings;
export const updateSettingsSync = (s: GameSettings) => { currentSettings = s; };
