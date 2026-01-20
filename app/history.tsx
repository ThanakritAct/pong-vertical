import { getTopScores, ScoreEntry } from '@/lib/db';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HistoryScreen() {
    const router = useRouter();
    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadScores();
    }, []);

    const loadScores = async () => {
        setLoading(true);
        const data = await getTopScores(20);
        setScores(data);
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#020024', '#090979', '#000000']}
                style={styles.background}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#00f3ff" />
                </TouchableOpacity>
                <View style={styles.headerTitleBox}>
                    <Text style={styles.headerTitle}>HALL OF FAME</Text>
                    <View style={styles.neonBar} />
                </View>
                <TouchableOpacity
                    onPress={() => alert('Data Synced with Cyber-Grid')}
                    style={styles.backBtn}
                >
                    <Ionicons name="refresh" size={22} color="#ff00ff" />
                </TouchableOpacity>
            </View>

            {/* Performance Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{scores.length}</Text>
                    <Text style={styles.statLabel}>BATTLES</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#00f3ff' }]}>
                        {scores.filter(s => s.score >= 5).length}
                    </Text>
                    <Text style={styles.statLabel}>WINS</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#ff4b2b' }]}>
                        {scores.filter(s => s.score < 5).length}
                    </Text>
                    <Text style={styles.statLabel}>LOSSES</Text>
                </View>
            </View>

            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#00f3ff" />
                    </View>
                ) : scores.length === 0 ? (
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>NO DATA FOUND IN PROTOCOL.</Text>
                    </View>
                ) : (
                    scores.map((item, index) => {
                        const isWin = item.score >= 5; // In FirstTo5, 5 means victory
                        return (
                            <View key={item.id || index} style={styles.scoreRow}>
                                <View style={[styles.rankBadge, index < 3 && styles.topRankBadge]}>
                                    <Text style={[styles.rankNum, index < 3 && styles.topRankText]}>{index + 1}</Text>
                                </View>

                                <View style={styles.playerInfo}>
                                    <Text style={styles.playerName}>{item.name.toUpperCase() || 'PLAYER'}</Text>
                                    <Text style={styles.playerDate}>{new Date(item.date).toLocaleDateString()}</Text>
                                </View>

                                <View style={styles.scoreInfo}>
                                    <View style={[styles.resultBadge, { backgroundColor: isWin ? 'rgba(0, 243, 255, 0.1)' : 'rgba(255, 75, 43, 0.1)' }]}>
                                        <Text style={[styles.resultText, { color: isWin ? '#00f3ff' : '#ff4b2b' }]}>
                                            {isWin ? 'WIN' : 'LOSS'}
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.scoreText, index === 0 && styles.firstScore]}>{item.score}</Text>
                                        <Text style={styles.scoreUnit}>PTS</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)', '#000']} style={styles.footer}>
                <TouchableOpacity
                    style={styles.rebootBtn}
                    onPress={() => router.replace('/')}
                >
                    <LinearGradient
                        colors={['#ff00ff', '#8e2de2']}
                        style={styles.rebootGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.rebootText}>BACK TO MENU</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    background: { ...StyleSheet.absoluteFillObject },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 },
    backBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitleBox: { alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 4 },
    neonBar: { width: 40, height: 3, backgroundColor: '#00f3ff', marginTop: 5, borderRadius: 2, shadowColor: '#00f3ff', shadowRadius: 10, shadowOpacity: 1 },

    // Stats Bar
    statsBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20, padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'space-between', alignItems: 'center' },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
    statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
    statDivider: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.1)' },

    list: { flex: 1 },
    listContent: { padding: 20, paddingBottom: 150 },
    center: { marginTop: 100, alignItems: 'center' },
    emptyText: { color: 'rgba(255,255,255,0.3)', fontWeight: '800', letterSpacing: 2 },

    scoreRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    rankBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
    topRankBadge: { backgroundColor: '#00f3ff' },
    rankNum: { color: 'rgba(255,255,255,0.5)', fontWeight: '900' },
    topRankText: { color: '#000' },

    playerInfo: { flex: 1 },
    playerName: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    playerDate: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4, fontWeight: '600' },

    scoreInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    resultBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    resultText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

    scoreText: { color: '#fff', fontSize: 28, fontWeight: '900' },
    firstScore: { color: '#ff00ff', textShadowColor: '#ff00ff', textShadowRadius: 15 },
    scoreUnit: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '900' },

    footer: { position: 'absolute', bottom: 0, width: '100%', height: 160, justifyContent: 'center', padding: 25 },
    rebootBtn: { height: 65, borderRadius: 20, overflow: 'hidden', elevation: 10 },
    rebootGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    rebootText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 3 }
});
