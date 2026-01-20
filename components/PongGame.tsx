import { getSettingsSync } from '@/lib/settings';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, PanResponder, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Tuning Constants ---
const SPEEDS = { SLOW: 2.2, NORMAL: 3.5, FAST: 5.5 };
const SIZES = { SMALL: 10, NORMAL: 16, LARGE: 24 };
const PADDLES = { SHORT: 100, NORMAL: 140, LONG: 200 };

const GAME_HEIGHT = SCREEN_HEIGHT * 0.8;
const AI_PADDLE_Y = 100;
const PLAYER_PADDLE_Y = GAME_HEIGHT - 60;
const MAX_BALL_SPEED = 12;

export type GameMode = 'FIRST_TO_5' | 'TIME_ATTACK';

export interface GameResult {
    playerScore: number;
    aiScore: number;
    mode: GameMode;
    timeSpent?: number;
}

interface PongGameProps {
    mode: GameMode;
    onGameOver: (result: GameResult) => void;
    onPausePress: () => void;
    isExternalPaused: boolean;
}

export const PongGame: React.FC<PongGameProps> = ({ mode, onGameOver, onPausePress, isExternalPaused }) => {
    // Game State
    const [playerScore, setPlayerScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameStarted, setGameStarted] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Tuning State (In-game)
    const [ballSpeedKey, setBallSpeedKey] = useState<keyof typeof SPEEDS>('NORMAL');
    const [ballSizeKey, setBallSizeKey] = useState<keyof typeof SIZES>('NORMAL');
    const [paddleWidthKey, setPaddleWidthKey] = useState<keyof typeof PADDLES>('NORMAL');
    const [tuningVisible, setTuningVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'Ball' | 'Paddles' | 'Physics'>('Ball');

    const ballPos = useRef({ x: SCREEN_WIDTH / 2 - SIZES[ballSizeKey] / 2, y: GAME_HEIGHT / 2 - SIZES[ballSizeKey] / 2 });
    const ballVel = useRef({ x: 0, y: 0 });
    const playerX = useRef((SCREEN_WIDTH - PADDLES[paddleWidthKey]) / 2);
    const aiX = useRef((SCREEN_WIDTH - PADDLES[paddleWidthKey]) / 2);

    const ballRef = useRef<any>(null);
    const playerRef = useRef<any>(null);
    const aiRef = useRef<any>(null);
    const requestRef = useRef<number>(null);

    // Derived values
    const currentBallSize = SIZES[ballSizeKey];
    const currentPaddleWidth = PADDLES[paddleWidthKey];
    const currentBaseSpeed = SPEEDS[ballSpeedKey];

    const triggerHaptic = () => {
        const sets = getSettingsSync();
        if (sets.vibration && Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const updateStyle = (ref: any, style: any) => {
        if (!ref.current) return;
        if (ref.current.setNativeProps) {
            ref.current.setNativeProps({ style });
        } else if (Platform.OS === 'web' && ref.current.style) {
            if (style.left !== undefined) ref.current.style.left = `${style.left}px`;
            if (style.top !== undefined) ref.current.style.top = `${style.top}px`;
            if (style.width !== undefined) ref.current.style.width = `${style.width}px`;
            if (style.height !== undefined) ref.current.style.height = `${style.height}px`;
            if (style.borderRadius !== undefined) ref.current.style.borderRadius = `${style.borderRadius}px`;
            if (style.opacity !== undefined) ref.current.style.opacity = style.opacity;
            if (style.transform !== undefined) ref.current.style.transform = style.transform;
            if (style.backgroundColor !== undefined) ref.current.style.backgroundColor = style.backgroundColor;
        }
    };

    const tuningVisibleRef = useRef(false);

    // Update ref when state changes
    useEffect(() => {
        tuningVisibleRef.current = tuningVisible;
    }, [tuningVisible]);

    const resetBall = useCallback((serveDirection: number) => {
        setIsResetting(true);
        ballVel.current = { x: 0, y: 0 };
        ballPos.current = { x: SCREEN_WIDTH / 2 - currentBallSize / 2, y: GAME_HEIGHT / 2 - currentBallSize / 2 };

        updateStyle(ballRef, {
            left: ballPos.current.x,
            top: ballPos.current.y,
            opacity: 0.5,
            transform: 'scale(1.5)',
            backgroundColor: '#fff'
        });

        setTimeout(() => {
            // We only care if the external app is paused, 
            // the local tuningVisible state shouldn't block the reset flow once triggered
            if (!isExternalPaused) {
                const angle = (Math.random() - 0.5) * 2;
                ballVel.current = {
                    x: angle * currentBaseSpeed,
                    y: serveDirection * currentBaseSpeed
                };
                updateStyle(ballRef, {
                    opacity: 1,
                    transform: 'scale(1)',
                    backgroundColor: serveDirection > 0 ? '#ff00ff' : '#00f3ff'
                });
                setIsResetting(false);
            }
        }, 1000);
    }, [isExternalPaused, currentBallSize, currentBaseSpeed]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
                if (tuningVisibleRef.current) return;
                let newX = gestureState.moveX - currentPaddleWidth / 2;
                if (newX < 0) newX = 0;
                if (newX > SCREEN_WIDTH - currentPaddleWidth) newX = SCREEN_WIDTH - currentPaddleWidth;
                playerX.current = newX;
                updateStyle(playerRef, { left: playerX.current });
            },
        })
    ).current;

    const update = useCallback(() => {
        if (!gameStarted || isExternalPaused || isResetting || tuningVisibleRef.current) {
            requestRef.current = requestAnimationFrame(update);
            return;
        }

        ballPos.current.x += ballVel.current.x;
        ballPos.current.y += ballVel.current.y;

        if (ballPos.current.x <= 0) {
            ballPos.current.x = 0;
            ballVel.current.x *= -1;
            triggerHaptic();
        } else if (ballPos.current.x >= SCREEN_WIDTH - currentBallSize) {
            ballPos.current.x = SCREEN_WIDTH - currentBallSize;
            ballVel.current.x *= -1;
            triggerHaptic();
        }

        const ballCenterX = ballPos.current.x + currentBallSize / 2;

        if (ballVel.current.y > 0 &&
            ballPos.current.y + currentBallSize >= PLAYER_PADDLE_Y &&
            ballPos.current.y + currentBallSize <= PLAYER_PADDLE_Y + 18 &&
            ballCenterX >= playerX.current &&
            ballCenterX <= playerX.current + currentPaddleWidth) {

            ballVel.current.y *= -1.05;
            const hitPoint = (ballCenterX - (playerX.current + currentPaddleWidth / 2)) / (currentPaddleWidth / 2);
            ballVel.current.x = hitPoint * 6;
            ballPos.current.y = PLAYER_PADDLE_Y - currentBallSize;
            triggerHaptic();
            updateStyle(ballRef, { backgroundColor: '#00f3ff' });
        }

        if (ballVel.current.y < 0 &&
            ballPos.current.y <= AI_PADDLE_Y + 18 &&
            ballPos.current.y >= AI_PADDLE_Y &&
            ballCenterX >= aiX.current &&
            ballCenterX <= aiX.current + currentPaddleWidth) {

            ballVel.current.y *= -1.05;
            const hitPoint = (ballCenterX - (aiX.current + currentPaddleWidth / 2)) / (currentPaddleWidth / 2);
            ballVel.current.x = hitPoint * 6;
            ballPos.current.y = AI_PADDLE_Y + 18;
            triggerHaptic();
            updateStyle(ballRef, { backgroundColor: '#ff00ff' });
        }

        if (ballPos.current.y < 0) {
            setPlayerScore(s => s + 1);
            resetBall(1);
        } else if (ballPos.current.y > GAME_HEIGHT) {
            setAiScore(s => s + 1);
            resetBall(-1);
        }

        const aiTarget = ballPos.current.x + currentBallSize / 2 - currentPaddleWidth / 2;
        const aiSpeed = mode === 'TIME_ATTACK' ? 5.2 : 4.0;
        if (Math.abs(aiX.current - aiTarget) > 5) {
            if (aiX.current < aiTarget) aiX.current += aiSpeed;
            else if (aiX.current > aiTarget) aiX.current -= aiSpeed;
        }

        if (aiX.current < 0) aiX.current = 0;
        if (aiX.current > SCREEN_WIDTH - currentPaddleWidth) aiX.current = SCREEN_WIDTH - currentPaddleWidth;

        updateStyle(ballRef, { left: ballPos.current.x, top: ballPos.current.y });
        updateStyle(aiRef, { left: aiX.current });

        requestRef.current = requestAnimationFrame(update);
    }, [gameStarted, isExternalPaused, isResetting, tuningVisible, mode, resetBall, currentBallSize, currentPaddleWidth]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(update);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [update]);

    useEffect(() => {
        if (mode === 'TIME_ATTACK' && gameStarted && !isExternalPaused && !tuningVisible && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [mode, gameStarted, isExternalPaused, tuningVisible, timeLeft]);

    useEffect(() => {
        if (mode === 'FIRST_TO_5' && (playerScore >= 5 || aiScore >= 5)) {
            setGameStarted(false);
            onGameOver({ playerScore, aiScore, mode });
        } else if (mode === 'TIME_ATTACK' && timeLeft <= 0) {
            setGameStarted(false);
            onGameOver({ playerScore, aiScore, mode, timeSpent: 60 });
        }
    }, [playerScore, aiScore, timeLeft, mode]);

    // Handle Tuning Apply
    const applyTuning = () => {
        setTuningVisible(false);
        // Force update visual positions based on new sizes
        updateStyle(ballRef, { width: currentBallSize, height: currentBallSize, borderRadius: currentBallSize / 2 });
        updateStyle(playerRef, { width: currentPaddleWidth });
        updateStyle(aiRef, { width: currentPaddleWidth });

        if (gameStarted) {
            resetBall(-1); // Restart ball with new settings safely
        }
    };

    const ArenaGrid = () => (
        <View style={styles.arenaGrid}>
            {[...Array(8)].map((_, i) => (
                <View key={`v-${i}`} style={[styles.gridLineV, { left: (SCREEN_WIDTH / 8) * i }]} />
            ))}
            <View style={styles.centerLine} />
            <View style={styles.centerCircle} />
        </View>
    );

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            <LinearGradient colors={['#020024', '#1a237e', '#080808']} style={styles.background} />
            <ArenaGrid />

            <View style={styles.topBar}>
                <TouchableOpacity onPress={onPausePress} style={styles.pauseBtn}>
                    <Ionicons name="pause" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.centerInfo}>
                    {mode === 'TIME_ATTACK' && (
                        <Text style={[styles.timer, timeLeft < 10 && styles.lowTime]}>
                            {timeLeft}s
                        </Text>
                    )}
                </View>
                <TouchableOpacity onPress={() => setTuningVisible(true)} style={styles.pauseBtn}>
                    <Ionicons name="options" size={24} color="#00f3ff" />
                </TouchableOpacity>
            </View>

            <View style={styles.hud}>
                <View style={styles.pointsDisplay}>
                    <View style={[styles.pBox, { borderLeftColor: '#ff00ff' }]}>
                        <Text style={styles.pLabel}>AI</Text>
                        <Text style={[styles.pScore, { color: '#ff00ff' }]}>{aiScore}</Text>
                    </View>
                    <View style={[styles.pBox, { borderLeftColor: '#00f3ff', alignItems: 'flex-end' }]}>
                        <Text style={styles.pLabel}>YOU</Text>
                        <Text style={[styles.pScore, { color: '#00f3ff' }]}>{playerScore}</Text>
                    </View>
                </View>
            </View>

            <View ref={aiRef} style={[styles.paddle, styles.aiPaddle, { top: AI_PADDLE_Y, left: aiX.current, width: currentPaddleWidth }]} />
            <View ref={ballRef} style={[styles.ball, { left: ballPos.current.x, top: ballPos.current.y, width: currentBallSize, height: currentBallSize, borderRadius: currentBallSize / 2 }]} />
            <View ref={playerRef} style={[styles.paddle, styles.playerPaddle, { top: PLAYER_PADDLE_Y, left: playerX.current, width: currentPaddleWidth }]} />

            {/* TUNING MODAL (Inspired by Image) */}
            <Modal visible={tuningVisible} transparent animationType="fade">
                <View style={styles.tuningOverlay}>
                    <View style={styles.tuningWindow}>
                        <View style={styles.tuningHeader}>
                            <Text style={styles.tuningTitle}>NEO TUNER</Text>
                            <View style={styles.tuningTabs}>
                                {(['Ball', 'Paddles', 'Physics'] as const).map(tab => (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
                                        onPress={() => setActiveTab(tab)}
                                    >
                                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.tuningBody}>
                            {activeTab === 'Ball' && (
                                <>
                                    <Text style={styles.tuningLabel}>BALL SPEED</Text>
                                    <View style={styles.btnGroup}>
                                        {(Object.keys(SPEEDS) as Array<keyof typeof SPEEDS>).map(k => (
                                            <TouchableOpacity key={k} style={[styles.optBtn, ballSpeedKey === k && styles.activeOpt]} onPress={() => setBallSpeedKey(k)}>
                                                <Text style={[styles.optText, ballSpeedKey === k && styles.activeOptText]}>{k}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={[styles.tuningLabel, { marginTop: 20 }]}>BALL SIZE</Text>
                                    <View style={styles.btnGroup}>
                                        {(Object.keys(SIZES) as Array<keyof typeof SIZES>).map(k => (
                                            <TouchableOpacity key={k} style={[styles.optBtn, ballSizeKey === k && styles.activeOpt]} onPress={() => setBallSizeKey(k)}>
                                                <Text style={[styles.optText, ballSizeKey === k && styles.activeOptText]}>{k}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            {activeTab === 'Paddles' && (
                                <>
                                    <Text style={styles.tuningLabel}>PADDLE LENGTH</Text>
                                    <View style={styles.btnGroup}>
                                        {(Object.keys(PADDLES) as Array<keyof typeof PADDLES>).map(k => (
                                            <TouchableOpacity key={k} style={[styles.optBtn, paddleWidthKey === k && styles.activeOpt]} onPress={() => setPaddleWidthKey(k)}>
                                                <Text style={[styles.optText, paddleWidthKey === k && styles.activeOptText]}>{k}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            {activeTab === 'Physics' && (
                                <View style={styles.centeredInfo}>
                                    <Ionicons name="flash" size={40} color="#00f3ff" />
                                    <Text style={styles.physicsText}>GRAVITY & MOMENTUM{"\n"}OPTIMIZED FOR ARENA</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.tuningFooter}>
                            <TouchableOpacity style={styles.tuningCancel} onPress={() => setTuningVisible(false)}>
                                <Text style={styles.tuningCancelText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.tuningApply} onPress={applyTuning}>
                                <Text style={styles.tuningApplyText}>APPLY & RESUME</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {!gameStarted && (
                <View style={styles.overlay}>
                    <View style={styles.readyBox}>
                        <Text style={styles.readyTitle}>PROTOCOL READY</Text>
                        <TouchableOpacity style={styles.serveBtn} onPress={() => { setGameStarted(true); resetBall(-1); }}>
                            <Text style={styles.serveText}>TAP TO SERVE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
    background: { ...StyleSheet.absoluteFillObject },
    arenaGrid: { ...StyleSheet.absoluteFillObject, opacity: 0.15 },
    gridLineV: { position: 'absolute', width: 2, height: '100%', backgroundColor: 'rgba(0, 243, 255, 0.3)' },
    centerLine: { position: 'absolute', top: GAME_HEIGHT / 2, width: '100%', height: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
    centerCircle: { position: 'absolute', top: GAME_HEIGHT / 2 - 50, left: SCREEN_WIDTH / 2 - 50, width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },

    topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, zIndex: 100 },
    pauseBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    centerInfo: { flex: 1, alignItems: 'center' },
    timer: { color: '#00f3ff', fontSize: 28, fontWeight: '900' },
    lowTime: { color: '#ff4b2b' },

    hud: { width: '100%', paddingHorizontal: 30, marginTop: 20 },
    pointsDisplay: { flexDirection: 'row', justifyContent: 'space-between' },
    pBox: { borderLeftWidth: 4, paddingLeft: 10 },
    pLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '900' },
    pScore: { fontSize: 40, fontWeight: '900' },

    paddle: { position: 'absolute', height: 18, borderRadius: 9 },
    playerPaddle: { backgroundColor: '#00f3ff', shadowColor: '#00f3ff', shadowRadius: 20, shadowOpacity: 0.9, elevation: 10 },
    aiPaddle: { backgroundColor: '#ff00ff', shadowColor: '#ff00ff', shadowRadius: 20, shadowOpacity: 0.9, elevation: 10 },
    ball: { position: 'absolute', backgroundColor: '#fff', shadowColor: '#fff', shadowRadius: 15, shadowOpacity: 1 },

    // Tuning Modal (Image Style)
    tuningOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    tuningWindow: { width: '90%', backgroundColor: '#0c0c14', borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
    tuningHeader: { padding: 25, backgroundColor: 'rgba(255,255,255,0.03)' },
    tuningTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 4, marginBottom: 20 },
    tuningTabs: { flexDirection: 'row', gap: 10 },
    tabBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)' },
    activeTabBtn: { backgroundColor: '#fff' },
    tabText: { color: 'rgba(255,255,255,0.5)', fontWeight: '800', fontSize: 12 },
    activeTabText: { color: '#000' },

    tuningBody: { padding: 25, minHeight: 200 },
    tuningLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900', marginBottom: 12, letterSpacing: 1 },
    btnGroup: { flexDirection: 'row', gap: 10 },
    optBtn: { flex: 1, height: 45, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    activeOpt: { borderColor: '#00f3ff', backgroundColor: 'rgba(0,243,255,0.1)' },
    optText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    activeOptText: { color: '#00f3ff' },

    tuningFooter: { flexDirection: 'row', padding: 20, gap: 15, backgroundColor: 'rgba(0,0,0,0.3)' },
    tuningCancel: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
    tuningCancelText: { color: 'rgba(255,255,255,0.4)', fontWeight: '800' },
    tuningApply: { flex: 2, height: 50, backgroundColor: '#00f3ff', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    tuningApplyText: { color: '#000', fontWeight: '900', letterSpacing: 1 },

    centeredInfo: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    physicsText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 15, fontSize: 12, fontWeight: '700', lineHeight: 20 },

    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 200 },
    readyBox: { alignItems: 'center' },
    readyTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 5, marginBottom: 30 },
    serveBtn: { paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30, backgroundColor: '#00f3ff' },
    serveText: { color: '#000', fontSize: 18, fontWeight: '900' }
});
