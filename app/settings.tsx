import { GameSettings, loadSettings, saveSettings, updateSettingsSync } from '@/lib/settings';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
    const router = useRouter();
    const [settings, setSettings] = useState<GameSettings>({ vibration: true, sound: true });

    useEffect(() => {
        (async () => {
            const s = await loadSettings();
            setSettings(s);
            updateSettingsSync(s);
        })();
    }, []);

    const toggleVibration = async (val: boolean) => {
        const newSettings = { ...settings, vibration: val };
        setSettings(newSettings);
        updateSettingsSync(newSettings);
        await saveSettings(newSettings);
    };

    const toggleSound = async (val: boolean) => {
        const newSettings = { ...settings, sound: val };
        setSettings(newSettings);
        updateSettingsSync(newSettings);
        await saveSettings(newSettings);
    };

    const handleResetData = () => {
        const performReset = async () => {
            try {
                // 1. Reset Settings
                const def = { vibration: true, sound: true };
                setSettings(def);
                updateSettingsSync(def);
                await saveSettings(def);

                // 2. Clear SQL Database
                if (Platform.OS !== 'web') {
                    const db = await SQLite.openDatabaseAsync('pong_scores.db');
                    await db.execAsync('DELETE FROM scores;');
                }

                // 3. Clear LocalStorage (Web scores)
                if (Platform.OS === 'web') {
                    localStorage.removeItem('pong_scores');
                }

                alert('Success: All data and scores have been wiped.');
            } catch (e) {
                alert('Error: Could not reset data.');
            }
        };

        if (Platform.OS === 'web') {
            if (confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
                performReset();
            }
        } else {
            Alert.alert(
                'RESET ALL DATA',
                'This will wipe all scores and reset settings. Continue?',
                [{ text: 'Cancel', style: 'cancel' }, { text: 'RESET', style: 'destructive', onPress: performReset }]
            );
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f0c29', '#302b63', '#24243e']}
                style={styles.background}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#00f3ff" />
                </TouchableOpacity>
                <Text style={styles.title}>SETTINGS</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>GAMEPLAY</Text>
                    <View style={styles.settingItem}>
                        <View style={styles.labelRow}>
                            <Ionicons name="notifications-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.settingLabel}>VIBRATION</Text>
                        </View>
                        <Switch
                            value={settings.vibration}
                            onValueChange={toggleVibration}
                            trackColor={{ false: '#767577', true: '#00f3ff' }}
                            thumbColor={settings.vibration ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                    <View style={styles.settingItem}>
                        <View style={styles.labelRow}>
                            <Ionicons name="volume-medium-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.settingLabel}>SOUND EFFECTS</Text>
                        </View>
                        <Switch
                            value={settings.sound}
                            onValueChange={toggleSound}
                            trackColor={{ false: '#767577', true: '#ff00ff' }}
                            thumbColor={settings.sound ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>HOW TO PLAY</Text>
                    <View style={styles.tutorialBox}>
                        <Text style={styles.tutorialText}>
                            1. Drag the blue paddle horizontally at the bottom.{"\n"}
                            2. Don't let the ball pass your paddle.{"\n"}
                            3. Score by getting the ball past the opponent's paddle.{"\n"}
                            4. First to 5 points (FirstTo5) or beat the clock (TimeAttackX)!
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleResetData}
                >
                    <Text style={styles.resetButtonText}>RESET ALL DATA</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.version}>VERSION 1.2.0 • NEO PONG ARENA</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { ...StyleSheet.absoluteFillObject },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 2 },
    content: { padding: 20 },
    section: { marginBottom: 40 },
    sectionTitle: { color: '#ff00ff', fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 15, textTransform: 'uppercase' },
    settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 18, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    labelRow: { flexDirection: 'row', alignItems: 'center' },
    settingLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
    tutorialBox: { backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: 20, borderRadius: 15, borderLeftWidth: 4, borderLeftColor: '#00f3ff' },
    tutorialText: { color: 'rgba(255, 255, 255, 0.65)', fontSize: 14, lineHeight: 24, fontWeight: '500' },
    resetButton: { marginTop: 10, padding: 18, borderWidth: 1, borderColor: 'rgba(255, 75, 43, 0.3)', backgroundColor: 'rgba(255, 75, 43, 0.05)', borderRadius: 15, alignItems: 'center' },
    resetButtonText: { color: '#ff4b2b', fontWeight: '800', letterSpacing: 1 },
    version: { position: 'absolute', bottom: 40, width: '100%', textAlign: 'center', color: 'rgba(255, 255, 255, 0.15)', fontSize: 10, fontWeight: '700' }
});
