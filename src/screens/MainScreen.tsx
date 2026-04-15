import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  Easing,
  FadeInUp,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ACHIEVEMENTS } from '@/data/achievements';
import { DAILY_QUEST_TEMPLATES } from '@/data/dailyQuests';
import { MOUNTAINS, type MountainDefinition } from '@/data/mountains';
import { resourceById, type ResourceId } from '@/data/resources';
import { tutorialQuestByStep } from '@/data/tutorial';
import { useGameStore } from '@/store/gameStore';
import { palette, spacing, typography } from '@/utils/theme';

const TRANSPORT_EMOJI = ['🚶', '🛒', '⛏️', '🚛', '🤖'] as const;
const TRANSPORT_LABELS = ['도보', '손수레', '광차', '트럭', '자율주행'] as const;
const ROAD_LABELS = ['오솔길', '자갈길', '레일', '포장도로', '고속도로'] as const;
const ROAD_STYLES = [
  { stroke: '#55607a', strokeWidth: 1.5, dashArray: '6 8' },
  { stroke: '#7f8799', strokeWidth: 2, dashArray: undefined },
  { stroke: '#b9c1d0', strokeWidth: 3, dashArray: '2 4' },
  { stroke: '#5f6678', strokeWidth: 4, dashArray: undefined },
  { stroke: '#d7a34b', strokeWidth: 5, dashArray: undefined },
] as const;
const GRADE_COLORS = {
  N: '#8f97ab',
  R: '#4a88ff',
  U: '#ae66ff',
  L: '#f2c94c',
} as const;
const ABILITY_META = {
  yield: { emoji: '📦', label: '채굴량' },
  speed: { emoji: '⚡', label: '속도' },
  power: { emoji: '💪', label: '부산물' },
} as const;
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.55;

type PopupItem = {
  id: number;
  x: number;
  y: number;
  text: string;
};

type PositionedMountain = {
  mountain: MountainDefinition;
  x: number;
  y: number;
  isUnlocked: boolean;
};

function formatNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toFixed(value < 10 && value % 1 !== 0 ? 1 : 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getTouchDistance(touches: readonly { pageX: number; pageY: number }[]): number {
  if (touches.length < 2) {
    return 0;
  }

  const [first, second] = touches;
  if (!first || !second) {
    return 0;
  }

  return Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY);
}

function getNextComboMultiplier(lastTapAt: number, lastTappedMountainId: string | null, currentCombo: number, mountainId: string, now: number): number {
  const withinComboWindow = now - lastTapAt <= 5000;
  const isDifferentMountain = lastTappedMountainId !== mountainId;

  if (!withinComboWindow || !isDifferentMountain) {
    return 1;
  }

  if (currentCombo === 1) {
    return 1.5;
  }

  if (currentCombo === 1.5) {
    return 2;
  }

  return 3;
}

function TransportRunner({
  emoji,
  fromX,
  fromY,
  toX,
  toY,
  durationMs,
}: {
  emoji: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  durationMs: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: Math.max(durationMs, 800),
        easing: Easing.linear,
      }),
      -1,
      true,
    );
  }, [durationMs, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: fromX + (toX - fromX) * progress.value - 14 },
      { translateY: fromY + (toY - fromY) * progress.value - 14 },
      { scale: 0.92 + progress.value * 0.12 },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.runner, animatedStyle]}>
      <Text style={styles.runnerEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

export default function MainScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [now, setNow] = useState(Date.now());
  const [selectedMountainId, setSelectedMountainId] = useState<string | null>(null);
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const stage = useGameStore((state) => state.stage);
  const resources = useGameStore((state) => state.resources);
  const workers = useGameStore((state) => state.workers);
  const workerAssignments = useGameStore((state) => state.workerAssignments);
  const mountainNames = useGameStore((state) => state.mountainNames);
  const dailyQuests = useGameStore((state) => state.dailyQuests);
  const tutorialStep = useGameStore((state) => state.tutorialStep);
  const tutorialComplete = useGameStore((state) => state.tutorialComplete);
  const advanceTutorial = useGameStore((state) => state.advanceTutorial);
  const tapState = useGameStore((state) => state.tapState);
  const achievements = useGameStore((state) => state.achievements);
  const diamonds = useGameStore((state) => state.diamonds);
  const roadLevel = useGameStore((state) => state.roadLevel);
  const offlineReport = useGameStore((state) => state.lastOfflineReport);
  const industryPoints = useGameStore((state) => state.industryPoints);
  const getMiningYield = useGameStore((state) => state.getMiningYield);
  const getMiningCycleMs = useGameStore((state) => state.getMiningCycleMs);
  const getTransportLevel = useGameStore((state) => state.getTransportLevel);
  const tapMine = useGameStore((state) => state.tapMine);
  const completeDailyQuest = useGameStore((state) => state.completeDailyQuest);
  const dismissOfflineReport = useGameStore((state) => state.dismissOfflineReport);

  const panStartRef = useRef({ x: 0, y: 0 });
  const pinchStartDistanceRef = useRef(0);
  const pinchStartScaleRef = useRef(1);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  const viewportSize = Math.min(width - spacing.lg * 2, 420);
  const mapContentSize = Math.max(560, viewportSize * 1.42);
  const center = mapContentSize / 2;
  const radius = mapContentSize * 0.38;
  const transportLevel = getTransportLevel();
  const transportEmoji = TRANSPORT_EMOJI[transportLevel] ?? TRANSPORT_EMOJI[0];
  const currentTutorial = !tutorialComplete ? tutorialQuestByStep[tutorialStep === 0 ? 1 : tutorialStep] : undefined;
  const unlockedAchievements = Object.values(achievements).filter(Boolean).length;
  const unlockedMountainsCount = MOUNTAINS.filter((mountain) => mountain.unlockedAtStage <= stage).length;

  const topResources = useMemo(
    () => Object.entries(resources).filter(([, amount]) => amount > 0).slice(0, 6),
    [resources],
  );

  const positionedMountains = useMemo<PositionedMountain[]>(() => (
    MOUNTAINS.map((mountain, index) => {
      const angle = (Math.PI * 2 * index) / MOUNTAINS.length - Math.PI / 2;
      return {
        mountain,
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
        isUnlocked: mountain.unlockedAtStage <= stage,
      };
    })
  ), [center, radius, stage]);

  const totalOfflineEarned = useMemo(
    () => (offlineReport?.earned ?? []).reduce((sum, entry) => sum + entry.amount, 0),
    [offlineReport],
  );

  const pendingQuestCount = useMemo(
    () => dailyQuests.filter((quest) => !quest.claimed && !quest.completed).length,
    [dailyQuests],
  );

  const selectedMountain = selectedMountainId ? MOUNTAINS.find((mountain) => mountain.id === selectedMountainId) : undefined;
  const selectedWorkerId = selectedMountain ? workerAssignments[selectedMountain.id] : null;
  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId);

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
      onPanResponderGrant: (event) => {
        panStartRef.current = pan;
        if (event.nativeEvent.touches.length >= 2) {
          pinchStartDistanceRef.current = getTouchDistance(event.nativeEvent.touches);
          pinchStartScaleRef.current = scale;
        }
      },
      onPanResponderMove: (event, gestureState) => {
        if (event.nativeEvent.touches.length >= 2) {
          const currentDistance = getTouchDistance(event.nativeEvent.touches);
          if (pinchStartDistanceRef.current > 0 && currentDistance > 0) {
            setScale(clamp((currentDistance / pinchStartDistanceRef.current) * pinchStartScaleRef.current, MIN_SCALE, MAX_SCALE));
          }
          return;
        }

        setPan({
          x: panStartRef.current.x + gestureState.dx,
          y: panStartRef.current.y + gestureState.dy,
        });
      },
      onPanResponderRelease: () => {
        panStartRef.current = pan;
        pinchStartDistanceRef.current = 0;
        pinchStartScaleRef.current = scale;
      },
      onPanResponderTerminate: () => {
        panStartRef.current = pan;
        pinchStartDistanceRef.current = 0;
        pinchStartScaleRef.current = scale;
      },
    }),
    [pan, scale],
  );

  const handleTapMountain = (mountain: PositionedMountain) => {
    if (!mountain.isUnlocked) {
      return;
    }

    const currentTime = Date.now();
    const nextComboMultiplier = getNextComboMultiplier(
      tapState.lastTapAt,
      tapState.lastTappedMountainId,
      tapState.comboMultiplier,
      mountain.mountain.id,
      currentTime,
    );
    const didTap = tapMine(mountain.mountain.id);

    if (!didTap) {
      return;
    }

    const yields = getMiningYield(mountain.mountain.id);
    const popupText = Object.entries(yields)
      .map(([resourceId, amount]) => `${resourceById[resourceId as ResourceId].emoji}+${formatNumber(amount * nextComboMultiplier)}`)
      .join(' ');

    const popupId = currentTime;
    setPopups((current) => [...current, { id: popupId, x: mountain.x, y: mountain.y, text: popupText }]);
    setTimeout(() => {
      setPopups((current) => current.filter((popup) => popup.id !== popupId));
    }, 1100);
  };

  const activeDailyProgress = dailyQuests.filter((quest) => quest.completed && !quest.claimed).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>RAW WORKS</Text>
            <Text style={styles.title}>채취 현황판</Text>
            <View style={styles.resourceRow}>
              {topResources.length ? (
                topResources.map(([resourceId, amount]) => (
                  <View key={resourceId} style={styles.resourceChip}>
                    <Text style={styles.resourceChipText}>{resourceById[resourceId as ResourceId].emoji} {formatNumber(amount)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>해금된 산에서 자동 채굴이 시작되면 주요 자원이 여기에 표시됩니다.</Text>
              )}
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.currencyCard}>
              <Text style={styles.currencyLabel}>💎 다이아</Text>
              <Text style={styles.currencyValue}>{formatNumber(diamonds)}</Text>
            </View>
            <Pressable
              style={styles.settingsButton}
              onPress={() => Alert.alert('설정 준비 중', '설정 화면과 광고 가속 기능은 다음 단계에서 연결됩니다.')}
            >
              <Text style={styles.settingsButtonText}>⚙️ 설정</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.comboRow}>
          <Text style={styles.comboLabel}>콤보 게이지</Text>
          <View style={styles.comboTrack}>
            <View style={[styles.comboFill, { width: `${Math.min((tapState.comboMultiplier / 3) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.comboValue}>x{tapState.comboMultiplier.toFixed(1)}</Text>
        </View>

        <View style={styles.mainSection}>
          <View style={styles.mapViewport}>
            <View style={styles.mapHudTop}>
              <View style={styles.hudChip}>
                <Text style={styles.hudChipText}>{TRANSPORT_LABELS[transportLevel]} {transportEmoji}</Text>
              </View>
              <View style={styles.hudChip}>
                <Text style={styles.hudChipText}>{ROAD_LABELS[roadLevel] ?? ROAD_LABELS[0]}</Text>
              </View>
              <View style={styles.zoomControls}>
                <Pressable style={styles.zoomButton} onPress={() => setScale((current) => clamp(current - 0.1, MIN_SCALE, MAX_SCALE))}>
                  <Text style={styles.zoomButtonText}>－</Text>
                </Pressable>
                <Pressable style={styles.zoomButton} onPress={() => setScale((current) => clamp(current + 0.1, MIN_SCALE, MAX_SCALE))}>
                  <Text style={styles.zoomButtonText}>＋</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.mapFrame}>
              <View style={styles.spaceGlowOne} />
              <View style={styles.spaceGlowTwo} />
              <View style={styles.mapMask} {...panResponder.panHandlers}>
                <View
                  style={[
                    styles.mapContent,
                    {
                      width: mapContentSize,
                      height: mapContentSize,
                      transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
                    },
                  ]}
                >
                  <Svg width={mapContentSize} height={mapContentSize} style={StyleSheet.absoluteFill}>
                    <Circle cx={center} cy={center} r={72} fill="#262842" stroke={palette.accentMuted} strokeWidth={1} />
                    {positionedMountains.map(({ mountain, x, y, isUnlocked }) => {
                      const roadStyle = ROAD_STYLES[roadLevel] ?? ROAD_STYLES[0];

                      return (
                        <Line
                          key={`line_${mountain.id}`}
                          x1={center}
                          y1={center}
                          x2={x}
                          y2={y}
                          stroke={isUnlocked ? roadStyle.stroke : 'rgba(143,151,171,0.22)'}
                          strokeWidth={isUnlocked ? roadStyle.strokeWidth : 1}
                          strokeDasharray={isUnlocked ? roadStyle.dashArray : '4 10'}
                        />
                      );
                    })}
                  </Svg>

                  <View style={[styles.baseNode, { left: center - 58, top: center - 58 }]}>
                    <Text style={styles.baseEmoji}>🏭</Text>
                    <Text style={styles.baseTitle}>중앙 기지</Text>
                    <Text style={styles.baseMeta}>해금 산 {unlockedMountainsCount}/15</Text>
                    <Text style={styles.baseBadge}>{transportEmoji} Lv.{transportLevel}</Text>
                  </View>

                  {positionedMountains.map(({ mountain, x, y, isUnlocked }) => {
                    const yields = getMiningYield(mountain.id);
                    const cycleSec = Math.max(0.1, getMiningCycleMs(mountain.id) / 1000).toFixed(1);
                    const cooldownLeft = isUnlocked
                      ? Math.max(0, 5 - Math.ceil((now - (tapState.cooldowns[mountain.id] ?? 0)) / 1000))
                      : 0;

                    return (
                      <View key={mountain.id}>
                        {isUnlocked ? (
                          <TransportRunner
                            emoji={transportEmoji}
                            fromX={center}
                            fromY={center}
                            toX={x}
                            toY={y}
                            durationMs={Math.max(1200, getMiningCycleMs(mountain.id))}
                          />
                        ) : null}

                        <Pressable
                          onPress={() => handleTapMountain({ mountain, x, y, isUnlocked })}
                          onLongPress={() => isUnlocked && setSelectedMountainId(mountain.id)}
                          style={[
                            styles.mountainNode,
                            { left: x - 54, top: y - 42 },
                            !isUnlocked && styles.mountainNodeLocked,
                          ]}
                        >
                          <Text style={styles.mountainTitle}>⛰️ {mountainNames[mountain.index - 1] ?? `산 ${mountain.index}`}</Text>
                          <Text style={styles.mountainMeta}>{mountain.resources.map((resourceId) => resourceById[resourceId].emoji).join(' ')}</Text>
                          {isUnlocked ? (
                            <>
                              <Text style={styles.mountainMeta}>왕복 {cycleSec}초</Text>
                              <Text style={styles.mountainMeta} numberOfLines={1}>
                                {Object.entries(yields)
                                  .map(([resourceId, amount]) => `${resourceById[resourceId as ResourceId].emoji}${formatNumber(amount)}`)
                                  .join(' ')}
                              </Text>
                              <Text style={styles.tapHint}>{cooldownLeft > 0 ? `탭 쿨다운 ${cooldownLeft}s` : '탭 채굴 가능'}</Text>
                            </>
                          ) : (
                            <>
                              <Text style={styles.lockedText}>🔒 {mountain.unlockedAtStage}단계 해금</Text>
                              <Text style={styles.lockedSubtext}>방사형 맵에 미리 배치된 원정지</Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}

                  {popups.map((popup) => (
                    <Animated.View
                      key={popup.id}
                      entering={FadeInUp.duration(160)}
                      exiting={FadeOutUp.duration(260)}
                      style={[styles.popup, { left: popup.x - 36, top: popup.y - 72 }]}
                    >
                      <Text style={styles.popupText}>{popup.text}</Text>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.overlayPanel}>
              <Pressable style={styles.sideButton} onPress={() => Alert.alert('광고 가속 준비 중', 'x1.2 배속 버튼은 Step 11에서 광고 보상과 연결됩니다.')}>
                <Text style={styles.sideButtonLabel}>x1.2</Text>
                <Text style={styles.sideButtonMeta}>광고</Text>
              </Pressable>
              <Pressable style={styles.sideButton} onPress={() => router.push('/daily-quests')}>
                <Text style={styles.sideButtonLabel}>📋</Text>
                <Text style={styles.sideButtonMeta}>퀘스트 {pendingQuestCount > 0 ? `· ${pendingQuestCount}` : ''}</Text>
              </Pressable>
              <Pressable style={styles.sideButton} onPress={() => router.push('/achievements')}>
                <Text style={styles.sideButtonLabel}>🏆</Text>
                <Text style={styles.sideButtonMeta}>{unlockedAchievements}/{ACHIEVEMENTS.length}</Text>
              </Pressable>
              <Pressable style={styles.sideButton} onPress={() => router.push('/factory')}>
                <Text style={styles.sideButtonLabel}>📈</Text>
                <Text style={styles.sideButtonMeta}>통계</Text>
              </Pressable>
              <Pressable style={styles.sideButton} onPress={() => router.push('/prestige')}>
                <Text style={styles.sideButtonLabel}>🏭</Text>
                <Text style={styles.sideButtonMeta}>{industryPoints} IP</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.rightRail} contentContainerStyle={styles.rightRailContent} showsVerticalScrollIndicator={false}>
            {dailyQuests.map((quest, index) => {
              const template = DAILY_QUEST_TEMPLATES.find((item) => item.id === quest.questId);
              const progressPercent = quest.target > 0 ? (quest.progress / quest.target) * 100 : 0;

              return (
                <View key={quest.questId} style={styles.infoCard}>
                  <Text style={styles.infoTitle}>📋 {template?.nameKo ?? quest.questId}</Text>
                  <Text style={styles.infoMeta}>{quest.progress}/{quest.target}</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
                  </View>
                  <Pressable
                    disabled={!quest.completed || quest.claimed}
                    onPress={() => completeDailyQuest(index)}
                    style={[styles.infoButton, (!quest.completed || quest.claimed) && styles.infoButtonDisabled]}
                  >
                    <Text style={styles.infoButtonText}>{quest.claimed ? '수령 완료' : quest.completed ? '보상 받기' : '진행 중'}</Text>
                  </Pressable>
                </View>
              );
            })}

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>🗺️ 진행 요약</Text>
              <Text style={styles.infoMeta}>해금 산 {unlockedMountainsCount}/15</Text>
              <Text style={styles.infoMeta}>도로 {ROAD_LABELS[roadLevel] ?? ROAD_LABELS[0]}</Text>
              <Text style={styles.infoMeta}>현재 이동수단 {TRANSPORT_LABELS[transportLevel]}</Text>
            </View>
          </ScrollView>
        </View>

        {currentTutorial ? (
          <View style={styles.tutorialBanner}>
            <View style={styles.tutorialCopy}>
              <Text style={styles.tutorialTitle}>{currentTutorial.emoji} {currentTutorial.nameKo}</Text>
              <Text style={styles.tutorialText}>튜토리얼 {currentTutorial.step}/6 · 보상 {currentTutorial.reward}💎</Text>
            </View>
            <View style={styles.tutorialActions}>
              <Pressable style={styles.tutorialButtonGhost} onPress={() => advanceTutorial(currentTutorial.step)}>
                <Text style={styles.tutorialButtonGhostText}>건너뛰기</Text>
              </Pressable>
              <View style={styles.pulseDot} />
            </View>
          </View>
        ) : null}

        {offlineReport ? (
          <View style={styles.offlineBanner}>
            <View>
              <Text style={styles.offlineTitle}>오프라인 수익 배너</Text>
              <Text style={styles.offlineMeta}>{Math.floor(offlineReport.elapsedSec / 60)}분 동안 {formatNumber(totalOfflineEarned)}개 획득</Text>
            </View>
            <Pressable style={styles.offlineButton} onPress={() => Alert.alert('오프라인 요약', '중앙 팝업에서 세부 내역을 확인할 수 있습니다.') }>
              <Text style={styles.offlineButtonText}>요약 보기</Text>
            </Pressable>
          </View>
        ) : null}

        <Modal animationType="fade" transparent visible={offlineReport !== null} onRequestClose={dismissOfflineReport}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>오프라인 수익</Text>
              <Text style={styles.modalMeta}>{Math.floor((offlineReport?.elapsedSec ?? 0) / 60)}분 동안 공장이 가동되었습니다.</Text>
              <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
                {!!offlineReport?.miningEarned.length && (
                  <>
                    <Text style={styles.modalSectionTitle}>채굴 수익</Text>
                    {offlineReport.miningEarned.map((entry) => (
                      <View key={`mining_${entry.resourceId}`} style={styles.modalRow}>
                        <Text style={styles.modalRowText}>{resourceById[entry.resourceId as ResourceId].emoji} {resourceById[entry.resourceId as ResourceId].nameKo}</Text>
                        <Text style={styles.modalRowValue}>+{formatNumber(entry.amount)}</Text>
                      </View>
                    ))}
                  </>
                )}
                {!!offlineReport?.productionEarned.length && (
                  <>
                    <Text style={styles.modalSectionTitle}>생산 수익</Text>
                    {offlineReport.productionEarned.map((entry) => (
                      <View key={`production_${entry.resourceId}`} style={styles.modalRow}>
                        <Text style={styles.modalRowText}>{resourceById[entry.resourceId as ResourceId].emoji} {resourceById[entry.resourceId as ResourceId].nameKo}</Text>
                        <Text style={styles.modalRowValue}>+{formatNumber(entry.amount)}</Text>
                      </View>
                    ))}
                  </>
                )}
                {!offlineReport?.miningEarned.length && !offlineReport?.productionEarned.length && (
                  <Text style={styles.modalEmpty}>획득한 자원이 없습니다. 다음 복귀 때 다시 확인해보세요.</Text>
                )}
              </ScrollView>
              <Pressable style={styles.modalButton} onPress={dismissOfflineReport}>
                <Text style={styles.modalButtonText}>확인</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal animationType="slide" transparent visible={selectedMountain !== undefined} onRequestClose={() => setSelectedMountainId(null)}>
          <View style={styles.sheetBackdrop}>
            <View style={styles.sheetCard}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>⛰️ {selectedMountain ? mountainNames[selectedMountain.index - 1] ?? selectedMountain.id : ''}</Text>
              <Text style={styles.sheetMeta}>현재 채굴 속도 {selectedMountain ? Math.max(0.1, getMiningCycleMs(selectedMountain.id) / 1000).toFixed(1) : '0.0'}초 / 왕복</Text>
              <View style={styles.sheetResources}>
                {selectedMountain?.resources.map((resourceId) => (
                  <View key={resourceId} style={styles.sheetResourceChip}>
                    <Text style={styles.sheetResourceText}>{resourceById[resourceId].emoji} {resourceById[resourceId].nameKo}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.workerCard}>
                <Text style={styles.workerTitle}>배치 작업자</Text>
                {selectedWorker ? (
                  <>
                    <View style={[styles.workerBadge, { borderColor: GRADE_COLORS[selectedWorker.grade] }]}> 
                      <Text style={styles.workerName}>{selectedWorker.name}</Text>
                      <Text style={styles.workerGrade}>{selectedWorker.grade} · Lv.{selectedWorker.level}</Text>
                    </View>
                    <View style={styles.abilityRow}>
                      {selectedWorker.abilities.map((ability) => (
                        <View key={`${selectedWorker.id}_${ability.type}`} style={styles.abilityChip}>
                          <Text style={styles.abilityChipText}>{ABILITY_META[ability.type].emoji} {ABILITY_META[ability.type].label} x{ability.multiplier.toFixed(1)}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <Text style={styles.sheetMeta}>아직 작업자가 배치되지 않았습니다.</Text>
                )}
              </View>

              <View style={styles.sheetActions}>
                <Pressable style={styles.sheetButtonGhost} onPress={() => setSelectedMountainId(null)}>
                  <Text style={styles.sheetButtonGhostText}>닫기</Text>
                </Pressable>
                <Pressable
                  style={styles.sheetButton}
                  onPress={() => {
                    setSelectedMountainId(null);
                    router.push('/worker');
                  }}
                >
                  <Text style={styles.sheetButtonText}>작업자 배치/교체</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerLeft: {
    flex: 1,
    gap: spacing.sm,
  },
  headerRight: {
    width: 116,
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  eyebrow: {
    color: palette.accentMuted,
    fontSize: typography.caption,
    letterSpacing: 2,
    fontWeight: '700',
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
  },
  resourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  resourceChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  resourceChipText: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  emptyText: {
    color: palette.textMuted,
    fontSize: typography.caption,
    maxWidth: 340,
    lineHeight: 18,
  },
  currencyCard: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.xs,
  },
  currencyLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  currencyValue: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  settingsButton: {
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: palette.accent,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: palette.background,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  comboRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  comboLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    width: 68,
  },
  comboTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2a2d47',
    overflow: 'hidden',
  },
  comboFill: {
    height: '100%',
    backgroundColor: palette.accent,
  },
  comboValue: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '800',
    width: 44,
    textAlign: 'right',
  },
  mainSection: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  mapViewport: {
    flex: 1,
    minHeight: 460,
    borderRadius: 28,
    backgroundColor: '#111522',
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    position: 'relative',
  },
  mapHudTop: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: 88,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  hudChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(26,26,46,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(215,163,75,0.3)',
  },
  hudChipText: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '700',
  },
  zoomControls: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  zoomButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(26,26,46,0.88)',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
  },
  mapFrame: {
    flex: 1,
    position: 'relative',
  },
  spaceGlowOne: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(49,75,145,0.14)',
    top: -90,
    left: -40,
  },
  spaceGlowTwo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(215,163,75,0.12)',
    bottom: -70,
    right: -20,
  },
  mapMask: {
    flex: 1,
    overflow: 'hidden',
  },
  mapContent: {
    position: 'absolute',
    left: -70,
    top: -50,
  },
  baseNode: {
    width: 116,
    height: 116,
    borderRadius: 28,
    backgroundColor: '#272d45',
    borderWidth: 1,
    borderColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    padding: spacing.sm,
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  baseEmoji: {
    fontSize: 30,
  },
  baseTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
  },
  baseMeta: {
    color: palette.textMuted,
    fontSize: 10,
  },
  baseBadge: {
    color: palette.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  mountainNode: {
    width: 108,
    minHeight: 82,
    borderRadius: 18,
    backgroundColor: 'rgba(35,35,58,0.95)',
    borderWidth: 1,
    borderColor: palette.border,
    position: 'absolute',
    padding: spacing.sm,
    gap: 2,
  },
  mountainNodeLocked: {
    backgroundColor: 'rgba(35,35,58,0.46)',
    borderColor: 'rgba(143,151,171,0.28)',
  },
  mountainTitle: {
    color: palette.text,
    fontSize: 10,
    fontWeight: '800',
  },
  mountainMeta: {
    color: palette.textMuted,
    fontSize: 9,
  },
  tapHint: {
    color: palette.accent,
    fontSize: 9,
    fontWeight: '700',
  },
  lockedText: {
    color: '#c8cdd8',
    fontSize: 10,
    fontWeight: '700',
  },
  lockedSubtext: {
    color: palette.textMuted,
    fontSize: 9,
    lineHeight: 12,
  },
  runner: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerEmoji: {
    fontSize: 18,
  },
  popup: {
    position: 'absolute',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(10,12,20,0.88)',
    borderWidth: 1,
    borderColor: palette.accent,
  },
  popupText: {
    color: palette.text,
    fontSize: 10,
    fontWeight: '800',
  },
  overlayPanel: {
    position: 'absolute',
    right: spacing.sm,
    top: 70,
    gap: spacing.sm,
    zIndex: 5,
  },
  sideButton: {
    width: 62,
    minHeight: 60,
    paddingHorizontal: 6,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: 'rgba(26,26,46,0.92)',
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  sideButtonLabel: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sideButtonMeta: {
    color: palette.textMuted,
    fontSize: 9,
    textAlign: 'center',
  },
  rightRail: {
    width: 210,
  },
  rightRailContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  infoTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  infoMeta: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#2a2d47',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.accent,
  },
  infoButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: palette.accent,
    alignItems: 'center',
  },
  infoButtonDisabled: {
    backgroundColor: palette.border,
  },
  infoButtonText: {
    color: palette.background,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  tutorialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: '#25213a',
    borderWidth: 1,
    borderColor: '#5e4a2d',
  },
  tutorialCopy: {
    flex: 1,
    gap: 2,
  },
  tutorialTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  tutorialText: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  tutorialActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tutorialButtonGhost: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  tutorialButtonGhostText: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.accent,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: '#202c33',
    borderWidth: 1,
    borderColor: '#355160',
  },
  offlineTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  offlineMeta: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  offlineButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: palette.accent,
  },
  offlineButtonText: {
    color: palette.background,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: 20,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    maxHeight: '70%',
    gap: spacing.md,
  },
  modalTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  modalMeta: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  modalSectionTitle: {
    color: palette.accent,
    fontSize: typography.caption,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  modalEmpty: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 20,
  },
  modalList: {
    maxHeight: 240,
  },
  modalListContent: {
    gap: spacing.sm,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  modalRowText: {
    color: palette.text,
    fontSize: typography.body,
    flex: 1,
  },
  modalRowValue: {
    color: palette.accent,
    fontSize: typography.body,
    fontWeight: '800',
  },
  modalButton: {
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: palette.accent,
    alignItems: 'center',
  },
  modalButtonText: {
    color: palette.background,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: palette.border,
    alignSelf: 'center',
  },
  sheetTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
  },
  sheetMeta: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  sheetResources: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sheetResourceChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sheetResourceText: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  workerCard: {
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  workerTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
  },
  workerBadge: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.md,
    gap: 2,
  },
  workerName: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  workerGrade: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  abilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  abilityChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: palette.surface,
  },
  abilityChipText: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sheetButtonGhost: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
  },
  sheetButtonGhostText: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  sheetButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: palette.accent,
    alignItems: 'center',
  },
  sheetButtonText: {
    color: palette.background,
    fontSize: typography.caption,
    fontWeight: '800',
  },
});