# Raw Works Development Readiness

이 문서는 [raw-works-gdd.md](c:\DEV\RawWorksIdle\raw-works-gdd.md)를 구현 가능한 개발 계획으로 변환한 준비 문서다.

## 1. 현재 문서 기준 게임 정의

- 장르: 모바일 방치형 인크리멘탈 생산 시뮬레이션
- 기술 스택 목표: React Native + Expo + TypeScript
- 핵심 성장축: 생산 체인, 완성품 기반 업그레이드, 프레스티지, 작업자, 숙련도, 난이도 스케일링
- MVP 본체: 10개 원자재 체인, 크로스 조합, 3티어 프레스티지, 오프라인 보상, 작업자 가챠, 숙련도

## 2. 구현 우선순위 재정리

문서 전체를 한 번에 구현하면 시스템 간 결합도가 높아져 밸런스 수정 비용이 커진다. 따라서 아래 순서로 개발하는 것이 안전하다.

### Phase 0. 프로젝트 기반

- Expo + TypeScript 프로젝트 생성
- Phase 1 패키지 설치: expo-router v4, zustand v5, AsyncStorage, reanimated v3, break-infinity.js, expo-image, expo-splash-screen, babel-plugin-module-resolver
- 기본 탭 6개 구성
- 저장/복구 파이프라인 먼저 확보

### Phase 1. 플레이 가능한 코어 루프

- 자원 정의
- 레시피 정의
- Zustand 게임 스토어
- 채취
- 생산 슬롯
- 업그레이드
- 단계 해금
- 프레스티지 1티어

이 단계의 목표는 "1시간 내 첫 프레스티지"를 직접 검증 가능한 상태를 만드는 것이다.

### Phase 2. 시스템 확장

- 작업자 시스템
- 가챠
- 오프라인 수익
- 숙련도
- 난이도 스케일링
- 프레스티지 2, 3티어

### Phase 3. 메타 및 운영 기능

- 광고 보상
- IAP
- 알림
- 분석 이벤트
- DEV 치트 패널

광고/IAP/알림은 게임 루프 검증 전에 붙이면 디버깅 비용만 커진다. MVP 코어가 먼저다.

## 3. MVP 범위 고정안

개발 착수 전 범위를 아래처럼 고정하는 것을 권장한다.

### 포함

- 10개 기본 체인 전체
- 기본 크로스, 중급 크로스, 최종 크로스, 프레스티지 레시피
- 프레스티지 3티어 구조
- IP 상점 8종
- 작업자 등급/능력/배치/분해/중복합성
- 숙련도 및 자동 반복
- 오프라인 수익
- 난이도 스케일링

### 초기 릴리스에서 후순위 처리 가능

- 정교한 픽셀 공장 연출
- 인터스티셜 광고
- 실시간 분석 대시보드
- 로컬 알림 고도화
- 스토어 ASO 자료

## 4. 시스템별 구현 결정

아래 항목은 코딩 전에 결정해 둬야 한다.

### 4.1 자원 모델

권장 타입:

```ts
type ResourceTier = 'raw' | 'p1' | 'p2' | 'part' | 'final' | 'cross' | 'prestige';

type ResourceDefinition = {
  id: string;
  nameKo: string;
  emoji: string;
  tier: ResourceTier;
  chain: string;
  unlockedAtStage: number;
  isRaw: boolean;
  isPrestigeItem?: boolean;
};
```

프레스티지 아이템은 일반 자원이 아니라 `isPrestigeItem` 플래그를 가진 자원으로 관리하는 편이 구현이 단순하다.

### 4.2 레시피 모델

권장 타입:

```ts
type RecipeKind = 'chain' | 'cross' | 'prestige';

type RecipeDefinition = {
  id: string;
  kind: RecipeKind;
  chain: string;
  unlockedAtStage: number;
  inputs: Array<{ resourceId: string; amount: number }>;
  output: { resourceId: string; amount: number };
  baseDurationSec: number;
};
```

`durationSec`는 스케일링과 숙련도 계산 전의 값으로 유지해야 한다. 실제 진행 시간은 엔진에서 계산한다.

### 4.3 게임 상태 경계

영구 보존 상태:

- diamonds
- workers
- gachaPity
- mastery
- industryPoints
- ipUpgrades
- prestigeTier
- prestigeCount
- totalPrestigeCount
- firstClear / achievement / daily login 상태

프레스티지 시 리셋 상태:

- 일반 자원 수량
- 일반 업그레이드
- activeRecipes
- 현재 단계 진행도

별도 보존 검토 필요:

- 프레스티지 아이템 수량
- 최고 도달 단계
- lifetime 생산 통계

프레스티지 아이템은 GDD 기준 보존 대상이므로 자원 리셋 로직에서 제외해야 한다.

### 4.4 게임 루프 구조

`setInterval(1000)` 하나만으로는 작업자 속도 배율을 정확히 처리하기 어렵다. 권장 구조는 아래와 같다.

- 전역 하트비트는 250ms 또는 500ms
- 각 raw resource마다 개별 누적 타이머 보유
- 각 생산 슬롯도 별도 종료 시각 보유
- 화면 표시는 초 단위 반올림 가능하지만 계산은 ms 단위 유지

권장 엔진 상태:

```ts
type MiningRuntimeState = {
  lastTickAt: number;
  accumulators: Record<string, number>;
};
```

### 4.5 오프라인 계산 기준

최신 GDD 기준 오프라인 최대 시간은 일반 업그레이드와 IP 업그레이드가 합산된다.

- 기본 8시간
- 자동화 업그레이드 Lv.1 이상부터 단계별 +2시간
- IP `오프라인 강화` 레벨당 +2시간
- 절대 상한 24시간

오프라인 계산은 "광산 자동 채취"와 "진행 중이던 생산 슬롯"만 우선 처리하고, 크로스 자동화는 IP 업그레이드 `자동 크로스` 구매 이후에만 허용한다.

### 4.6 작업자 시스템

문서에 "인접 체인 원자재"가 정의되어 있지 않다. 구현 전에 adjacency 규칙을 데이터로 고정해야 한다.

권장 규칙:

- 목재 ↔ 철광
- 철광 ↔ 석유, 구리
- 석유 ↔ 알루미늄
- 구리 ↔ 실리콘
- 실리콘 ↔ 금
- 리튬 ↔ 희토류
- 희토류 ↔ 우라늄

또는 더 단순하게 "같은 단계에서 해금된 raw resource 풀 중 랜덤 1개"로 처리할 수 있다. 초기 구현은 후자가 더 안전하다.

### 4.7 숙련도 시스템

숙련도는 레시피별 누적 XP로 저장하되, 보너스 계산은 저장하지 말고 파생값으로 계산한다.

저장 권장형:

```ts
type MasteryState = Record<string, { level: number; xp: number }>;
```

자동 반복 해금, 크리티컬, 연쇄 반응은 모두 레벨에서 계산하는 편이 밸런스 수정에 유리하다.

### 4.8 난이도 스케일링

문서상 공식은 존재하지만 기준 시점이 모호하다. 아래처럼 고정한다.

- recipe cost scaling 기준: `totalPrestigeCount + currentStage`
- prestige item repeat scaling 기준: `prestigeCount[tier]`
- upgrade scaling 기준: `current upgrade level`
- duration scaling은 숙련도 적용 전 multiplier만 저장

`currentStage`는 리셋 이후 다시 1로 내려가므로, 반복 플레이의 난이도 급락을 막고 싶다면 `highestStageThisRun`이 아니라 `currentStage`를 사용하는 현재 설계가 더 자연스럽다.

## 5. 문서상 확인된 충돌/모호점 — ✅ 모두 GDD에 반영 완료

아래 8개 항목은 모두 GDD(raw-works-gdd.md)에 직접 해결안을 추가했다.

1. ✅ **오프라인 최대 시간** — 자동화 업그레이드 레벨별 시간표 추가. 일반 업그레이드와 IP 업그레이드 **합산** 규칙 명시. 절대 상한 24시간.
2. ✅ **생산 슬롯 합산** — `최종 슬롯 = 기본(2) + 작업대 레벨 + IP 슬롯 확장 레벨` 공식 GDD 업그레이드 테이블 하단에 추가.
3. ✅ **엔진 해상도** — 250ms 하트비트, 자원별 ms 누적 타이머, 슬롯별 종료 시각 방식으로 GDD 섹션 2에 구현 규칙 추가.
4. ✅ **프레스티지 아이템 자산 분류** — `isPrestigeItem: true` 별도 보존 자산으로 분류. 리셋 로직에서 제외. GDD 업그레이드 섹션에 명시.
5. ✅ **시설규모 Lv.4 비용** — 미래도시×1 비용 보충. GDD 업그레이드 테이블에 직접 반영.
6. ✅ **단계 해금 vs 연구소** — 연구소 업그레이드가 단계 전환의 충족 조건이자 해금 조건임을 명시. GDD 단계 진행 조건 테이블 위에 설명 추가.
7. ✅ **Worker Power 부산물 대상** — "같은 단계에서 해금된 raw resource 풀 중 자신 제외 랜덤 1종" 규칙 확정. GDD 작업자 능력 테이블 하단에 추가.
8. ✅ **IP/난이도 기준 시점** — `totalPrestigeCount`는 난이도 스케일링·라벨에, `highestStageThisRun`은 IP 획득량에 사용. GDD 프레스티지 핵심 규칙에 공식 추가.

## 6. 권장 아키텍처

### 폴더 구성

```text
src/
  app/
  components/
  data/
  engine/
  hooks/
  services/
  store/
  types/
  utils/
```

GDD의 구조에 `types/`와 `hooks/`를 추가하는 것이 좋다. 타입 정의와 UI 계산 훅을 분리하면 파일간 순환 의존을 줄일 수 있다.

### 상태 관리 원칙

- `data/`: 정적 정의만 포함
- `engine/`: 순수 계산 함수 중심
- `store/`: 상태 변경 액션만 포함
- `screens/`: 표시와 사용자 입력만 담당
- `services/`: 광고, 저장, 알림, 분석 같은 외부 IO 담당

엔진 함수가 store를 직접 import하기보다, 가능한 한 입력과 출력이 명확한 순수 함수 형태를 유지하는 편이 테스트에 유리하다.

## 7. 첫 스프린트 작업 순서

### Sprint 1. 저장 가능한 최소 게임

- Expo 프로젝트 생성
- 라우팅/탭 구성
- 자원/레시피 데이터 작성
- gameStore 작성
- MainScreen에서 raw resource 채취 가능
- ProductionScreen에서 체인 생산 가능
- UpgradeScreen에서 기본 업그레이드 2종 적용 가능
- 앱 종료 후 저장/복구 확인

### Sprint 2. 첫 프레스티지 도달

- Stage progression 구현
- PrestigeEngine 1티어 구현
- PrestigeScreen 구현
- IP 상점 3종 우선 구현: 채굴 속도 강화, 제련 가속, 시작 자원
- 첫 프레스티지 1시간 목표 밸런스 점검

### Sprint 3. 메타 시스템 연결

- WorkerEngine
- GachaEngine
- WorkerScreen
- OfflineEngine
- MasteryEngine
- ScalingEngine

## 8. 실제 개발 착수 체크리스트

- Expo SDK 버전 선정
- TypeScript strict 모드 활성화
- 절대 경로 alias 설정
- ESLint / Prettier 여부 결정
- 앱 저장 포맷 버전 필드 추가
- 숫자 포맷 util 우선 작성
- 더미 데이터로 1~3단계 먼저 검증
- 밸런싱용 DEV 패널은 초기에 넣기

## 9. 개발 착수 시점 확정 결정

아래 결정은 모두 GDD v2.8 기준으로 **확정**한다. 개발 중 변경 시 이 섹션을 먼저 갱신할 것.

---

### 9.1 구현 범위

| 결정 | 확정 내용 |
|------|----------|
| Phase 1 범위 | 1~3단계 + 티어1 프레스티지만. 4단계 이후 자원/레시피 데이터는 정의하되 UI에서 잠금 처리 |
| Phase 2 진입 조건 | Phase 1에서 "신규 시작 → 첫 프레스티지 1시간 이내" 밸런스 확인 후 |
| 작업자/숙련도/스케일링 | Phase 2로 미룸. 단, gameStore에 `workers`, `mastery`, `totalPrestigeCount` 필드는 Phase 1에서 미리 선언해 저장 포맷 변경을 방지 |
| 광고/IAP/알림 | Phase 3. 코어 루프 검증 완료 후 |

### 9.2 기술 스택

| 결정 | 확정 내용 |
|------|----------|
| Expo SDK | **SDK 52** (2026-04 기준 최신 stable) |
| 라우팅 | expo-router v4 (파일 기반 라우팅) |
| 상태 관리 | zustand v5 + `persist` 미들웨어 (AsyncStorage 백엔드) |
| 큰 숫자 | break-infinity.js — 후반 자원량이 수만 단위를 넘으므로 초반부터 적용 |
| 애니메이션 | react-native-reanimated v3 |
| 이미지/스프라이트 | expo-image |
| TypeScript | `strict: true` + `noUncheckedIndexedAccess: true` |
| 린트/포맷 | ESLint (flat config) + Prettier. 세이브 시 자동 포맷 |
| 경로 alias | `@/` → `src/` (tsconfig paths + babel-plugin-module-resolver) |

### 9.3 엔진 구조

| 결정 | 확정 내용 |
|------|----------|
| 게임 루프 | `setInterval(250)` 하트비트. 1초 틱 아님 |
| 채취 타이머 | 자원별 ms 누적 방식 (`accumulators: Record<string, number>`) |
| 생산 슬롯 | `endTime` 절대 시각 저장. `startedAt + duration` 아님 |
| 오프라인 최대 | `(8 + 자동화Lv×2 + IP오프라인Lv×2)시간`, 절대 상한 24시간 |
| 슬롯 합산 | `2(기본) + 작업대Lv + IP슬롯확장Lv` 단순 합산 |
| 크로스 오프라인 | IP 업그레이드 `자동 크로스` 구매 전까지 오프라인 미진행 |

### 9.4 데이터 모델

| 결정 | 확정 내용 |
|------|----------|
| 프레스티지 아이템 | 일반 자원과 **별도 상태**(`prestigeItems: Record<id, number>`). 리셋 제외 |
| 숙련도 저장 | `Record<recipeId, { level, xp }>` — 보너스는 파생 계산, 저장 안 함 |
| 저장 포맷 | `{ version: number, ...state }` 형태. 마이그레이션 함수 체인 준비 |
| 저장 주기 | 상태 변경 후 2초 디바운스 자동 저장 |
| ID 컨벤션 | snake_case: `iron_ore`, `steel_plate`, `small_factory` |

### 9.5 프레스티지 & 스케일링

| 결정 | 확정 내용 |
|------|----------|
| IP 계산 변수 | `baseIP(tier) + (highestStageThisRun - tierBaseStage) × 1` |
| tierBaseStage | 티어1=3, 티어2=5, 티어3=8 |
| 난이도 스케일링 입력 | `totalPrestigeCount` (전 티어 합산) |
| 난이도 라벨 | `totalPrestigeCount` 기준: 0~2 초급, 3~5 중급, 6~9 고급, 10+ 마스터 |
| 비용 상한 | 재료 비용 최대 5×, 제작시간 최대 3× (최소 바닥 = 기본의 20%) |
| `highestStageThisRun` | 프레스티지 시 1로 리셋. IP 계산에만 사용 |

### 9.6 작업자 & 부산물 (Phase 2 확정, 선언만 Phase 1)

| 결정 | 확정 내용 |
|------|----------|
| 부산물 대상 | 같은 단계 해금 raw resource 풀 중 자신 제외 랜덤 1종 |
| 부산물 확률 | `(workerPowerMultiplier - 1) × 100`% |
| 가챠 천장 | 50회 누적 뽑기 내 전설 미출현 → 확정. 10연차에 R+ 최소 1명 보장 |
| 분해 수익 | N:1💎, R:5💎, U:15💎, L:50💎 |

### 9.7 UI & UX

| 결정 | 확정 내용 |
|------|----------|
| 탭 수 | 6개: 채취, 생산, 업그레이드, 공장, 작업자, 프레스티지 |
| 테마 | 다크 인더스트리얼. 배경 `#1a1a2e` 계열 |
| 숫자 포맷 | 1,234 → "1.2K", 1,000,000 → "1M" (break-infinity 래퍼) |
| 단계 해금 vs 연구소 | 연구소 업그레이드 = 단계 전환 조건 (동시 수행) |
| DEV 패널 | Phase 1부터 포함. 흔들기 또는 트리플 탭으로 열기. 프로덕션 빌드에서 strip |

### 9.8 밸런스 기준선

| 지표 | 목표 |
|------|------|
| 첫 프레스티지(티어1 초회) | 신규 시작 ~1시간 |
| 티어1 반복 (IP 3개 사용 후) | ~30분 |
| 티어2 초회 도달 | ~3시간 (누적 IP로 영구 강화 후) |
| 티어3 초회 도달 | ~8시간 |
| 오프라인 8시간 수익 | 액티브 30분 분량 이하 (너무 강하면 접속 동기 ↓) |
| 가챠 1회 가능 시점 | 티어1 프레스티지 1회(10💎) + 일일출석 2일(10💎) + 광고 2회(10💎) + 단계 클리어(20💎) = 50💎 → 첫 뽑기 2~3일차 |

## 10. 지금 바로 착수 가능한 구현 순서

현재 문서 상태로 보면 설계는 충분히 고정돼 있다. 실제 개발은 아래 순서로 시작하면 된다.

1. Expo SDK 52 프로젝트 생성
2. `src/app`, `src/data`, `src/store`, `src/engine`, `src/types`, `src/utils` 생성
3. `tsconfig` alias와 ESLint/Prettier 설정
4. `resources.ts`, `recipes.ts`, `upgrades.ts`, `ipUpgrades.ts`, `stages.ts` 작성
5. `gameStore.ts` 작성 (`version`, `prestigeItems`, `highestStageThisRun` 포함)
6. `GameLoop.ts`, `ScalingEngine.ts`, `PrestigeEngine.ts` 최소 골격 작성
7. `MainScreen`, `ProductionScreen`, `UpgradeScreen`, `PrestigeScreen` 최소 UI 작성
8. 1~3단계 + 티어1 프레스티지 플레이 테스트

## 11. 바로 다음 액션

개발을 실제 시작할 때 첫 구현 묶음은 아래가 적절하다.

1. Expo 프로젝트 생성
2. 기본 폴더 구조 및 라우팅 생성
3. `resources.ts`, `recipes.ts`, `gameStore.ts` 작성
4. `MainScreen`, `ProductionScreen`, `UpgradeScreen` 최소 UI 작성
5. 저장/불러오기 검증
6. 3단계 도달과 티어1 프레스티지까지 플레이 테스트