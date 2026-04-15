import React, { Component, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { startLoop, stopLoop } from '@/engine/GameLoop';
import { useGameStore } from '@/store/gameStore';
import { logDiagnosticsSnapshot, logNonBoolean } from '@/utils/runtimeDiagnostics';
import { palette } from '@/utils/theme';

/* ── ErrorBoundary ── */
type EBProps = { children: React.ReactNode };
type EBState = { error: Error | null };

class ErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleReset = async () => {
    await AsyncStorage.clear();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.safeArea}>
          <View style={styles.loadingCard}>
            <Text style={styles.loadingEyebrow}>CRASH LOG</Text>
            <Text style={styles.loadingTitle}>{this.state.error.name}</Text>
            <Text style={styles.loadingMeta}>{this.state.error.message}</Text>
            <Text style={{ color: '#aaa', fontSize: 11, marginTop: 8 }} numberOfLines={20}>
              {this.state.error.stack}
            </Text>
            <Pressable
              onPress={this.handleReset}
              style={{ marginTop: 16, backgroundColor: '#e74c3c', padding: 12, borderRadius: 8 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>저장 데이터 삭제 후 재시작</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/* ── Root Layout ── */
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <RootInner />
    </ErrorBoundary>
  );
}

function RootInner() {
  const isHydrated = useGameStore((state) => state.isHydrated);
  const tutorialComplete = useGameStore((state) => state.tutorialComplete);
  const dailyQuests = useGameStore((state) => state.dailyQuests);
  const workers = useGameStore((state) => state.workers);

  useEffect(() => {
    if (!isHydrated) {
      return undefined;
    }

    startLoop();
    return () => {
      stopLoop();
    };
  }, [isHydrated]);

  useEffect(() => {
    logDiagnosticsSnapshot('root hydration', {
      isHydrated,
      tutorialComplete,
      tutorialCompleteType: typeof tutorialComplete,
      dailyQuestCount: dailyQuests.length,
      workerCount: workers.length,
    });

    logNonBoolean('root tutorialComplete', tutorialComplete);
    dailyQuests.forEach((quest, index) => {
      logNonBoolean('root dailyQuests.completed', quest.completed, {
        index,
        questId: quest.questId,
        field: 'completed',
      });
      logNonBoolean('root dailyQuests.claimed', quest.claimed, {
        index,
        questId: quest.questId,
        field: 'claimed',
      });
    });
    workers.forEach((worker, index) => {
      logNonBoolean('root workers.locked', worker.locked, {
        index,
        workerId: worker.id,
      });
    });
  }, [dailyQuests, isHydrated, tutorialComplete, workers]);

  if (!isHydrated) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingEyebrow}>RAW WORKS</Text>
          <Text style={styles.loadingTitle}>저장 데이터 동기화 중</Text>
          <Text style={styles.loadingMeta}>이전 런 상태를 확인한 뒤 탭 화면을 렌더링합니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: palette.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
    padding: 24,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 24,
    gap: 10,
  },
  loadingEyebrow: {
    color: palette.accentMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  loadingTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
  },
  loadingMeta: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});