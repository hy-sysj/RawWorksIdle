import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ScreenShell } from '@/components/ScreenShell';
import { IP_UPGRADES } from '@/data/ipUpgrades';
import { calculateIpEarned, canPrestige, getPrestigeItemId, getTierBaseIp, getTierBaseStage } from '@/engine/PrestigeEngine';
import { resourceById } from '@/data/resources';
import { useGameStore, type PrestigeTier } from '@/store/gameStore';
import { logDiagnosticsSnapshot } from '@/utils/runtimeDiagnostics';
import { getDifficultyLabel } from '@/utils/progression';
import { palette, spacing, typography } from '@/utils/theme';

const PRESTIGE_TIERS: PrestigeTier[] = [1, 2, 3];
const TIER_META: Record<PrestigeTier, { label: string; accent: string; description: string }> = {
  1: { label: '소규모 공장', accent: '#7ec8ff', description: '첫 반복 루프를 여는 기본 프레스티지입니다.' },
  2: { label: '산업단지', accent: '#d7a34b', description: '티어 해금 투자 이후 본격적인 중반 루프를 엽니다.' },
  3: { label: '미래도시', accent: '#8ef0c3', description: '최종 티어 반복으로 대량 IP를 수급합니다.' },
};

function formatBig(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return `${value}`;
}

export default function PrestigeScreen() {
  const params = useLocalSearchParams<{ section?: string }>();
  const scrollRef = useRef<ScrollView | null>(null);
  const [shopOffsetY, setShopOffsetY] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const stage = useGameStore((state) => state.stage);
  const highestStageThisRun = useGameStore((state) => state.highestStageThisRun);
  const industryPoints = useGameStore((state) => state.industryPoints);
  const prestigeItems = useGameStore((state) => state.prestigeItems);
  const prestigeCount = useGameStore((state) => state.prestigeCount);
  const totalPrestigeCount = useGameStore((state) => state.totalPrestigeCount);
  const prestigeTier = useGameStore((state) => state.prestigeTier);
  const ipUpgrades = useGameStore((state) => state.ipUpgrades);
  const canUnlockTier = useGameStore((state) => state.canUnlockTier);
  const triggerPrestige = useGameStore((state) => state.triggerPrestige);
  const buyIpUpgrade = useGameStore((state) => state.buyIpUpgrade);
  const getMaxProductionSlots = useGameStore((state) => state.getMaxProductionSlots);
  const getMaxOfflineHours = useGameStore((state) => state.getMaxOfflineHours);
  const lastPrestigeReport = useGameStore((state) => state.lastPrestigeReport);
  const dismissPrestigeReport = useGameStore((state) => state.dismissPrestigeReport);

  const difficultyLabel = getDifficultyLabel(totalPrestigeCount);
  const costMultiplier = (1 + totalPrestigeCount * 0.15) * (1 + stage * 0.1);

  const overviewCards = [
    { label: '총 프레스티지', value: `${totalPrestigeCount}`, subValue: `최고 티어 ${prestigeTier}` },
    { label: '난이도', value: difficultyLabel, subValue: `x${costMultiplier.toFixed(2)}` },
    { label: '생산 슬롯', value: `${getMaxProductionSlots()}`, subValue: `IP 확장 ${ipUpgrades.slot_expansion}` },
    { label: '오프라인', value: `${getMaxOfflineHours()}h`, subValue: `강화 ${ipUpgrades.offline_boost}` },
  ];

  useEffect(() => {
    if (params.section !== 'shop' || shopOffsetY <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, shopOffsetY - spacing.lg), animated: true });
    }, 120);

    return () => clearTimeout(timer);
  }, [params.section, shopOffsetY]);

  useEffect(() => {
    if (!lastPrestigeReport) {
      return;
    }

    setShowTransition(true);
    const transitionTimer = setTimeout(() => setShowTransition(false), 900);
    const dismissTimer = setTimeout(() => dismissPrestigeReport(), 2600);

    return () => {
      clearTimeout(transitionTimer);
      clearTimeout(dismissTimer);
    };
  }, [dismissPrestigeReport, lastPrestigeReport]);

  useEffect(() => {
    logDiagnosticsSnapshot('screen mount', {
      screen: 'PrestigeScreen',
      stage,
      industryPoints,
      prestigeTier,
    });
  }, [industryPoints, prestigeTier, stage]);

  return (
    <ScreenShell
      title="프레스티지"
      subtitle="기업 매각으로 현재 런을 정리하고 산업 포인트를 쌓아 영구 성장 루프를 엽니다."
      body="매각 시 사라지는 자산과 유지되는 자산을 분리해서 보여 주고, 티어별 IP 기대값과 영구 상점 구매 판단이 한 화면에서 끝나도록 정리한 프레스티지 허브입니다."
    >
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroEyebrow}>INDUSTRY POINTS</Text>
              <Text style={styles.heroValue}>{formatBig(industryPoints)} IP</Text>
              <Text style={styles.heroSubtitle}>현재 단계 {stage} · 이번 런 최고 단계 {highestStageThisRun}</Text>
            </View>
            <View style={styles.balanceBadge}>
              <Text style={styles.balanceBadgeLabel}>영구 자산</Text>
              <Text style={styles.balanceBadgeValue}>숙련도 · 작업자 · IP 업그레이드 유지</Text>
            </View>
          </View>

          <View style={styles.overviewGrid}>
            {overviewCards.map((card) => (
              <View key={card.label} style={styles.overviewCard}>
                <Text style={styles.overviewLabel}>{card.label}</Text>
                <Text style={styles.overviewValue}>{card.value}</Text>
                <Text style={styles.overviewSubValue}>{card.subValue}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>기업 매각</Text>
            <Text style={styles.sectionCaption}>현재 런 자원과 일반 업그레이드를 리셋하고 IP를 획득합니다.</Text>
          </View>

          {PRESTIGE_TIERS.map((tier) => {
            const meta = TIER_META[tier];
            const itemId = getPrestigeItemId(tier);
            const prestigeItem = resourceById[itemId];
            const owned = prestigeItems[itemId] ?? 0;
            const unlocked = canUnlockTier(tier);
            const ipPreview = calculateIpEarned(tier, highestStageThisRun);
            const canExecute = canPrestige({ tier, prestigeItems, canUnlockTier });
            const unlockProgress = tier === 1 ? 0 : ipUpgrades.tier_unlock;
            const unlockTarget = tier - 1;

            return (
              <View key={tier} style={[styles.tierCard, { borderColor: `${meta.accent}55` }]}>
                <View style={styles.tierHeader}>
                  <View style={styles.tierTitleBlock}>
                    <Text style={styles.tierLabel}>★{tier} {meta.label}</Text>
                    <Text style={styles.tierDescription}>{meta.description}</Text>
                  </View>
                  <View style={[styles.tierIpBadge, { borderColor: `${meta.accent}80` }]}>
                    <Text style={styles.tierIpBadgeLabel}>예상 IP</Text>
                    <Text style={[styles.tierIpBadgeValue, { color: meta.accent }]}>{ipPreview}</Text>
                  </View>
                </View>

                <View style={styles.requirementRow}>
                  <View style={[styles.requirementChip, owned > 0 ? styles.requirementChipDone : styles.requirementChipPending]}>
                    <Text style={styles.requirementChipLabel}>{prestigeItem.emoji} {prestigeItem.nameKo}</Text>
                    <Text style={styles.requirementChipValue}>{owned}/1</Text>
                  </View>
                  <View style={[styles.requirementChip, unlocked ? styles.requirementChipDone : styles.requirementChipPending]}>
                    <Text style={styles.requirementChipLabel}>티어 해금</Text>
                    <Text style={styles.requirementChipValue}>{tier === 1 ? '기본' : `${unlockProgress}/${unlockTarget}`}</Text>
                  </View>
                  <View style={styles.requirementChipNeutral}>
                    <Text style={styles.requirementChipLabel}>기준 단계</Text>
                    <Text style={styles.requirementChipValue}>{getTierBaseStage(tier)}단계+</Text>
                  </View>
                </View>

                <View style={styles.prestigeMetaPanel}>
                  <Text style={styles.prestigeMetaText}>기본 IP {getTierBaseIp(tier)} + 초과 단계 보너스 {Math.max(0, highestStageThisRun - getTierBaseStage(tier))}</Text>
                  <Text style={styles.prestigeMetaText}>누적 매각 횟수 {prestigeCount[tier]}회 · 보유 프레스티지 아이템 {owned}개</Text>
                </View>

                {!unlocked ? <Text style={styles.lockOverlayText}>이 티어는 IP 상점의 티어 해금 구매 후 활성화됩니다.</Text> : null}

                <Pressable
                  onPress={() => {
                    if (!canExecute) {
                      return;
                    }

                    Alert.alert(
                      '기업 매각',
                      `현재 런을 리셋하고 IP ${ipPreview}를 획득합니다. 일반 자원, 일반 업그레이드, 활성 생산 슬롯이 초기화됩니다. 진행할까요?`,
                      [
                        { text: '취소', style: 'cancel' },
                        {
                          text: '매각 실행',
                          style: 'destructive',
                          onPress: () => {
                            triggerPrestige(tier);
                          },
                        },
                      ],
                    );
                  }}
                  style={[styles.primaryButton, { backgroundColor: canExecute ? meta.accent : palette.border }]}
                >
                  <Text style={styles.primaryButtonText}>{canExecute ? `기업 매각 · IP ${ipPreview}` : unlocked ? '프레스티지 아이템 부족' : '티어 해금 필요'}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionBlock} onLayout={(event) => setShopOffsetY(event.nativeEvent.layout.y)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>IP 상점</Text>
            <Text style={styles.sectionCaption}>구매 즉시 영구 적용되며 프레스티지 이후에도 유지됩니다.</Text>
          </View>

          {IP_UPGRADES.map((upgrade) => {
            const level = ipUpgrades[upgrade.id] ?? 0;
            const affordable = industryPoints >= upgrade.cost;
            const isMaxed = level >= upgrade.maxLevel;
            const canBuy = affordable && !isMaxed;
            const highlightTierUnlock = upgrade.id === 'tier_unlock' && affordable && !isMaxed;

            return (
              <View key={upgrade.id} style={[styles.shopCard, highlightTierUnlock && styles.shopCardHighlight]}>
                <View style={styles.shopHeader}>
                  <View style={styles.shopTitleBlock}>
                    <Text style={styles.shopTitle}>{upgrade.nameKo}</Text>
                    <Text style={styles.shopDescription}>{upgrade.description}</Text>
                  </View>
                  <View style={styles.shopLevelBadge}>
                    <Text style={styles.shopLevelText}>{isMaxed ? 'MAX' : `Lv.${level}/${upgrade.maxLevel}`}</Text>
                  </View>
                </View>

                <View style={styles.shopInfoRow}>
                  <Text style={styles.shopEffect}>{upgrade.effect}</Text>
                  <Text style={[styles.shopCost, affordable ? styles.shopCostPositive : styles.shopCostNegative]}>{upgrade.cost} IP</Text>
                </View>

                <Pressable
                  onPress={canBuy ? () => buyIpUpgrade(upgrade.id) : undefined}
                  style={[styles.shopButton, canBuy ? styles.shopButtonEnabled : styles.shopButtonDisabled]}
                >
                  <Text style={styles.shopButtonText}>{isMaxed ? 'MAX' : canBuy ? `구매 ${upgrade.cost} IP` : affordable ? '구매 불가' : 'IP 부족'}</Text>
                </Pressable>

                {level > 0 ? <Text style={styles.boughtText}>✓ 구매됨 · 현재 레벨 {level}</Text> : null}
              </View>
            );
          })}
        </View>

        {lastPrestigeReport ? (
          <View style={styles.toastWrap} pointerEvents="none">
            <View style={styles.toastCard}>
              <Text style={styles.toastTitle}>프레스티지 완료</Text>
              <Text style={styles.toastText}>★{lastPrestigeReport.tier} 매각 완료 · IP +{lastPrestigeReport.ipEarned}</Text>
            </View>
          </View>
        ) : null}

        {showTransition ? (
          <View style={styles.transitionOverlay} pointerEvents="none">
            <View style={styles.transitionCard}>
              <Text style={styles.transitionTitle}>기업 매각 중</Text>
              <Text style={styles.transitionText}>라인을 정리하고 새 런 준비를 마칩니다.</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroCard: {
    borderRadius: 22,
    padding: spacing.lg,
    backgroundColor: '#191f34',
    borderWidth: 1,
    borderColor: '#334065',
    gap: spacing.md,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroEyebrow: {
    color: palette.accentMuted,
    fontSize: typography.caption,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  heroValue: {
    marginTop: spacing.xs,
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    color: palette.textMuted,
    fontSize: typography.body,
  },
  balanceBadge: {
    maxWidth: 140,
    alignSelf: 'flex-start',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#10192d',
    borderWidth: 1,
    borderColor: '#3e507c',
  },
  balanceBadgeLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  balanceBadgeValue: {
    marginTop: spacing.xs,
    color: palette.text,
    fontSize: typography.caption,
    lineHeight: 18,
    fontWeight: '700',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  overviewCard: {
    flexGrow: 1,
    minWidth: 132,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: 'rgba(10, 14, 26, 0.55)',
    borderWidth: 1,
    borderColor: '#2d3654',
    gap: spacing.xs,
  },
  overviewLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  overviewValue: {
    color: palette.accent,
    fontSize: 22,
    fontWeight: '800',
  },
  overviewSubValue: {
    color: palette.text,
    fontSize: typography.caption,
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
  },
  sectionCaption: {
    color: palette.textMuted,
    fontSize: typography.caption,
    textAlign: 'right',
    flexShrink: 1,
  },
  tierCard: {
    borderRadius: 18,
    padding: spacing.lg,
    backgroundColor: palette.background,
    borderWidth: 1,
    gap: spacing.md,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  tierTitleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  tierLabel: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  tierDescription: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  tierIpBadge: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#151a2a',
    minWidth: 84,
  },
  tierIpBadgeLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  tierIpBadgeValue: {
    marginTop: spacing.xs,
    fontSize: 22,
    fontWeight: '900',
  },
  requirementRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  requirementChip: {
    minWidth: 120,
    flexGrow: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    gap: spacing.xs,
  },
  requirementChipDone: {
    backgroundColor: 'rgba(84, 181, 125, 0.12)',
    borderColor: 'rgba(84, 181, 125, 0.36)',
  },
  requirementChipPending: {
    backgroundColor: 'rgba(215, 163, 75, 0.12)',
    borderColor: 'rgba(215, 163, 75, 0.38)',
  },
  requirementChipNeutral: {
    minWidth: 120,
    flexGrow: 1,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#38415c',
    backgroundColor: '#181d2d',
    gap: spacing.xs,
  },
  requirementChipLabel: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  requirementChipValue: {
    color: palette.textMuted,
    fontSize: typography.caption,
  },
  prestigeMetaPanel: {
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: '#171b2b',
    borderWidth: 1,
    borderColor: '#303750',
    gap: spacing.xs,
  },
  prestigeMetaText: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  lockOverlayText: {
    color: palette.accent,
    fontSize: typography.caption,
    lineHeight: 18,
    fontWeight: '700',
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#10131f',
    fontSize: typography.caption,
    fontWeight: '900',
  },
  shopCard: {
    borderRadius: 18,
    padding: spacing.lg,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.md,
  },
  shopCardHighlight: {
    borderColor: '#f0c35d',
    backgroundColor: '#201a0f',
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  shopTitleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  shopTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  shopDescription: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  shopLevelBadge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: '#46506f',
    backgroundColor: '#15192a',
  },
  shopLevelText: {
    color: palette.text,
    fontSize: typography.caption,
    fontWeight: '800',
  },
  shopInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    alignItems: 'center',
  },
  shopEffect: {
    color: palette.text,
    fontSize: typography.body,
    flex: 1,
    fontWeight: '700',
  },
  shopCost: {
    fontSize: typography.caption,
    fontWeight: '900',
  },
  shopCostPositive: {
    color: '#67d18c',
  },
  shopCostNegative: {
    color: '#ff7b7b',
  },
  shopButton: {
    borderRadius: 14,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  shopButtonEnabled: {
    backgroundColor: palette.accent,
  },
  shopButtonDisabled: {
    backgroundColor: palette.border,
  },
  shopButtonText: {
    color: '#10131f',
    fontSize: typography.caption,
    fontWeight: '900',
  },
  boughtText: {
    color: '#8dd9a7',
    fontSize: typography.caption,
    fontWeight: '700',
  },
  toastWrap: {
    position: 'absolute',
    top: spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toastCard: {
    minWidth: 220,
    maxWidth: 320,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 16,
    backgroundColor: '#10192d',
    borderWidth: 1,
    borderColor: '#57d38c',
    gap: spacing.xs,
  },
  toastTitle: {
    color: '#8dd9a7',
    fontSize: typography.caption,
    fontWeight: '900',
    textAlign: 'center',
  },
  toastText: {
    color: palette.text,
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
  },
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8, 12, 22, 0.68)',
  },
  transitionCard: {
    width: 240,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 20,
    backgroundColor: '#161d31',
    borderWidth: 1,
    borderColor: '#5dd2a2',
    gap: spacing.sm,
  },
  transitionTitle: {
    color: '#8ef0c3',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  transitionText: {
    color: palette.text,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
});