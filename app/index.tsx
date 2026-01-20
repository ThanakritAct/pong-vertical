import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MenuScreen() {
    const router = useRouter();
    const [showModeSelect, setShowModeSelect] = useState(false);
    const [playerName, setPlayerName] = useState('PLAYER 1');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
        }).start();
    }, []);

    // background Grid Pattern component
    const GridBackground = () => (
        <View style={StyleSheet.absoluteFill}>
            {[...Array(20)].map((_, i) => (
                <View key={`v-${i}`} style={[styles.gridLineV, { left: (SCREEN_WIDTH / 10) * i }]} />
            ))}
            {[...Array(40)].map((_, i) => (
                <View key={`h-${i}`} style={[styles.gridLineH, { top: (SCREEN_HEIGHT / 20) * i }]} />
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#020024', '#090979', '#00d4ff']}
                style={styles.background}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <GridBackground />

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                <View style={styles.titleWrapper}>
                    <Text style={styles.glowTitle}>NEO PONG</Text>
                    <Text style={styles.subtitle}>THE VERTICAL ARENA</Text>
                </View>

                <View style={styles.menuItems}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.mainButton}
                        onPress={() => setShowModeSelect(true)}
                    >
                        <LinearGradient
                            colors={['#00f3ff', '#0072ff']}
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.buttonText}>START BATTLE</Text>
                            <Ionicons name="play" size={20} color="#000" />
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={[styles.glassButton, { marginRight: 15 }]}
                            onPress={() => router.push('/history')}
                        >
                            <Ionicons name="trophy" size={22} color="#fff" style={{ marginBottom: 5 }} />
                            <Text style={styles.glassButtonText}>RANKS</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.glassButton}
                            onPress={() => router.push('/settings')}
                        >
                            <Ionicons name="settings" size={22} color="#fff" style={{ marginBottom: 5 }} />
                            <Text style={styles.glassButtonText}>EDIT</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>COE64-233 • COMPUTER ENGINEERING</Text>
                </View>
            </Animated.View>

            {/* MODE SELECTION MODAL */}
            <Modal visible={showModeSelect} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.modalInner}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>IDENTIFY & CHOOSE</Text>
                                <TouchableOpacity onPress={() => setShowModeSelect(false)}>
                                    <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.3)" />
                                </TouchableOpacity>
                            </View>

                            {/* Name Input Before Battle */}
                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>PLAYER INITIALS / NAME</Text>
                                <TextInput
                                    style={styles.nameInput}
                                    value={playerName}
                                    onChangeText={setPlayerName}
                                    placeholder="ENTER NAME..."
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    maxLength={15}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.modeCard}
                                onPress={() => {
                                    setShowModeSelect(false);
                                    router.push({
                                        pathname: '/game',
                                        params: { mode: 'FIRST_TO_5', name: playerName || 'PLAYER 1' }
                                    });
                                }}
                            >
                                <View style={[styles.modeIcon, { backgroundColor: '#00f3ff' }]}>
                                    <Text style={styles.modeIconText}>5</Text>
                                </View>
                                <View>
                                    <Text style={styles.modeName}>FIRST TO 5</Text>
                                    <Text style={styles.modeDescription}>Perfect for tactical duels.</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modeCard}
                                onPress={() => {
                                    setShowModeSelect(false);
                                    router.push({
                                        pathname: '/game',
                                        params: { mode: 'TIME_ATTACK', name: playerName || 'PLAYER 1' }
                                    });
                                }}
                            >
                                <View style={[styles.modeIcon, { backgroundColor: '#ff00ff' }]}>
                                    <Ionicons name="timer" size={24} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.modeName}>TIME ATTACK X</Text>
                                    <Text style={styles.modeDescription}>Maximum speed. 60s overload.</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020024' },
    background: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
    gridLineV: { position: 'absolute', width: 1, height: '100%', backgroundColor: 'rgba(0, 243, 255, 0.05)' },
    gridLineH: { position: 'absolute', width: '100%', height: 1, backgroundColor: 'rgba(0, 243, 255, 0.05)' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    titleWrapper: { alignItems: 'center', marginBottom: 80 },
    glowTitle: { fontSize: 80, fontWeight: '900', color: '#fff', letterSpacing: 8, textShadowColor: '#00f3ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30 },
    subtitle: { fontSize: 16, color: '#ff00ff', letterSpacing: 8, fontWeight: '800', marginTop: -5, textTransform: 'uppercase', opacity: 0.8 },
    menuItems: { width: '100%', gap: 20 },
    mainButton: { width: '100%', height: 75, borderRadius: 20, overflow: 'hidden', elevation: 15, shadowColor: '#00f3ff', shadowRadius: 20, shadowOpacity: 0.5 },
    buttonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15 },
    buttonText: { color: '#000', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
    row: { flexDirection: 'row', width: '100%' },
    glassButton: { flex: 1, height: 100, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
    glassButtonText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
    footer: { position: 'absolute', bottom: 40, alignItems: 'center' },
    footerText: { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { padding: 15 },
    modalInner: { borderRadius: 30, padding: 30, borderWidth: 1, borderColor: 'rgba(0,243,255,0.3)' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    modalTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 3 },
    modeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modeIcon: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    modeIconText: { color: '#000', fontSize: 24, fontWeight: 'bold' },
    modeName: { color: '#fff', fontSize: 18, fontWeight: '900' },
    modeDescription: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 },

    // Name Input Styling
    inputSection: { marginBottom: 25, backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    inputLabel: { color: '#00f3ff', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 10, opacity: 0.8 },
    nameInput: { color: '#fff', fontSize: 20, fontWeight: '900', paddingVertical: 5, letterSpacing: 2 }
});


