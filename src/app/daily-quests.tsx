import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DAILY_QUEST_COMPLETION_BONUS, DAILY_QUEST_TEMPLATES } from '@/data/dailyQuests';
import { ScreenShell } from '@/components/ScreenShell';
import { useGameStore } from '@/store/gameStore';
import { palette, spacing, typography } from '@/utils/theme';

export default function DailyQuestsRoute() {
  const dailyQuests = useGameStore((state) => state.dailyQuests);
  const dailyQuestDate = useGameStore((state) => state.dailyQuestDate);
  const completeDailyQuest = useGameStore((state) => state.completeDailyQuest);

  const claimedCount = dailyQuests.filter((quest) => quest.claimed).length;

  return (
    <ScreenShell title="일일 퀘스트" subtitle="매일 갱신되는 3개의 목표와 수령 상태를 관리합니다." body="메인 채굴 화면 사이드 버튼에서 바로 열 수 있는 전용 화면입니다. 각 퀘스트의 진행률과 개별 보상, 전체 완료 보너스를 한 번에 확인할 수 있습니다.">
      <Link href="/(tabs)" asChild>
        <Pressable style={stylesDaily.backButton}>
          <Text style={stylesDaily.backButtonText}>채취로 돌아가기</Text>
        </Pressable>
      </Link>

      <Text style={stylesDaily.summary}>기준일 {dailyQuestDate}</Text>
      <Text style={stylesDaily.summaryMeta}>전체 완료 보너스 {DAILY_QUEST_COMPLETION_BONUS}💎 · 수령 {claimedCount}/{dailyQuests.length}</Text>

      <ScrollView contentContainerStyle={stylesDaily.list} showsVerticalScrollIndicator={false}>
        {dailyQuests.map((quest, index) => {
          const template = DAILY_QUEST_TEMPLATES.find((item) => item.id === quest.questId);
          const progressPercent = quest.target > 0 ? (quest.progress / quest.target) * 100 : 0;

          return (
            <View key={quest.questId} style={stylesDaily.card}>
              <View style={stylesDaily.cardHeader}>
                <Text style={stylesDaily.cardTitle}>{template?.nameKo ?? quest.questId}</Text>
                <Text style={stylesDaily.cardMeta}>{quest.progress}/{quest.target}</Text>
              </View>
              <View style={stylesDaily.progressTrack}>
                <View style={[stylesDaily.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
              </View>
              <Text style={stylesDaily.cardMeta}>보상 {template?.reward ?? 0}💎</Text>
              <Pressable
                disabled={!quest.completed || quest.claimed}
                onPress={() => completeDailyQuest(index)}
                style={[stylesDaily.button, (!quest.completed || quest.claimed) && stylesDaily.buttonDisabled]}
              >
                <Text style={stylesDaily.buttonText}>{quest.claimed ? '수령 완료' : quest.completed ? '보상 받기' : '진행 중'}</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </ScreenShell>
  );
}

const stylesDaily = StyleSheet.create({
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
  list: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
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
  button: {
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: palette.accent,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: palette.border,
  },
  buttonText: {
    color: palette.background,
    fontSize: typography.caption,
    fontWeight: '800',
  },
});