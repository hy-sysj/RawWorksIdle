import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { ACHIEVEMENTS, type AchievementDefinition } from '@/data/achievements';
import { ScreenShell } from '@/components/ScreenShell';
import { useGameStore } from '@/store/gameStore';
import { getAchievementProgress } from '@/utils/progression';
import { palette, spacing, typography } from '@/utils/theme';

const CATEGORIES: Array<AchievementDefinition['category'] | 'all'> = [
  'all',
  'mining',
  'production',
  'prestige',
  'worker',
  'exploration',
  'road',
  'mastery',
];

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  all: '전체',
  mining: '채굴',
  production: '생산',
  prestige: '프레스티지',
  worker: '작업자',
  exploration: '탐험',
  road: '도로',
  mastery: '숙련',
};

export default function AchievementsRoute() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('all');
  const [sortMode, setSortMode] = useState<'default' | 'unlocked-first' | 'locked-first' | 'reward-desc'>('default');
  const stats = useGameStore((state) => state.stats);
  const totalPrestigeCount = useGameStore((state) => state.totalPrestigeCount);
  const workers = useGameStore((state) => state.workers);
  const stage = useGameStore((state) => state.stage);
  const roadLevel = useGameStore((state) => state.roadLevel);
  const mastery = useGameStore((state) => state.mastery);
  const achievements = useGameStore((state) => state.achievements);

  const filteredAchievements = useMemo(() => {
    const baseList = category === 'all' ? [...ACHIEVEMENTS] : ACHIEVEMENTS.filter((achievement) => achievement.category === category);

    if (sortMode === 'unlocked-first') {
      return baseList.sort((left, right) => Number(achievements[right.id] === true) - Number(achievements[left.id] === true));
    }

    if (sortMode === 'locked-first') {
      return baseList.sort((left, right) => Number(achievements[right.id] === true) - Number(achievements[left.id] === true));
    }

    if (sortMode === 'reward-desc') {
      return baseList.sort((left, right) => right.reward - left.reward);
    }

    return baseList;
  }, [achievements, category, sortMode]);

  const unlockedCount = Object.values(achievements).filter(Boolean).length;
  const totalReward = filteredAchievements.reduce((sum, achievement) => sum + achievement.reward, 0);
  const unlockedReward = filteredAchievements.reduce((sum, achievement) => sum + (achievements[achievement.id] ? achievement.reward : 0), 0);

  return (
    <ScreenShell title="업적" subtitle="카테고리별 목표와 현재 진행률을 한 번에 확인합니다." body="GDD 기준 7개 카테고리 업적을 필터링해서 보고, 각 업적의 현재 수치와 목표, 보상을 바로 확인할 수 있습니다.">
      <Link href="/(tabs)" asChild>
        <Pressable style={stylesAchievements.backButton}>
          <Text style={stylesAchievements.backButtonText}>채취로 돌아가기</Text>
        </Pressable>
      </Link>

      <Text style={stylesAchievements.summary}>달성 {unlockedCount}/{ACHIEVEMENTS.length}</Text>
      <Text style={stylesAchievements.summaryMeta}>보상 합계 {unlockedReward}/{totalReward}💎</Text>

      <ScrollView horizontal contentContainerStyle={stylesAchievements.filterRow} showsHorizontalScrollIndicator={false}>
        {CATEGORIES.map((item) => (
          <Pressable
            key={item}
            onPress={() => setCategory(item)}
            style={[stylesAchievements.filterChip, category === item && stylesAchievements.filterChipActive]}
          >
            <Text style={[stylesAchievements.filterText, category === item && stylesAchievements.filterTextActive]}>{CATEGORY_LABELS[item]}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal contentContainerStyle={stylesAchievements.filterRow} showsHorizontalScrollIndicator={false}>
        {[
          { id: 'default', label: '기본순' },
          { id: 'unlocked-first', label: '달성 우선' },
          { id: 'locked-first', label: '잠금 우선' },
          { id: 'reward-desc', label: '보상 높은순' },
        ].map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setSortMode(item.id as typeof sortMode)}
            style={[stylesAchievements.filterChip, sortMode === item.id && stylesAchievements.filterChipActive]}
          >
            <Text style={[stylesAchievements.filterText, sortMode === item.id && stylesAchievements.filterTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={stylesAchievements.list} showsVerticalScrollIndicator={false}>
        {filteredAchievements.map((achievement) => {
          const progress = getAchievementProgress(achievement, {
            stats,
            totalPrestigeCount,
            workers,
            stage,
            roadLevel,
            mastery,
          });
          const unlocked = achievements[achievement.id] === true;

          return (
            <View key={achievement.id} style={stylesAchievements.card}>
              <View style={stylesAchievements.cardHeader}>
                <Text style={stylesAchievements.cardTitle}>{achievement.nameKo}</Text>
                <Text style={stylesAchievements.cardMeta}>{unlocked ? '달성' : `${progress.current}/${progress.target}`}</Text>
              </View>
              <View style={stylesAchievements.progressTrack}>
                <View style={[stylesAchievements.progressFill, { width: `${(progress.current / progress.target) * 100}%` }]} />
              </View>
              <Text style={stylesAchievements.cardMeta}>{CATEGORY_LABELS[achievement.category]} · 보상 {achievement.reward}💎</Text>
            </View>
          );
        })}
      </ScrollView>
    </ScreenShell>
  );
}

const stylesAchievements = StyleSheet.create({
  backButton: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: palette.accent,
  },
  backButtonText: {
    color: palette.background,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  summary: {
    marginTop: spacing.md,
    color: palette.accent,
    fontSize: typography.body,
    fontWeight: '800',
  },
  summaryMeta: {
    marginTop: spacing.xs,
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  filterRow: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filterChipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  filterText: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  filterTextActive: {
    color: palette.background,
  },
  list: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '700',
    flex: 1,
  },
  cardMeta: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.accent,
  },
});