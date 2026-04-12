# Raw Works

원목과 철광석에서 시작해 미래도시까지 확장하는 방치형 산업 시뮬레이션 게임입니다.

React Native + Expo + TypeScript 기반으로 제작 중이며, 생산 체인, 자동 채취, 숙련도, 작업자, 프레스티지, 영구 업그레이드 구조를 중심으로 설계되어 있습니다.

## 앱 설명

Raw Works는 실생활 산업 공정을 소재로 한 모바일 방치형 게임입니다.

- 원자재 채취
- 1차/2차 가공
- 크로스 조합 생산
- 업그레이드와 생산 슬롯 확장
- 작업자 배치와 자동 채취 강화
- 프레스티지를 통한 영구 성장

현재 프로젝트에는 다음 기반 기능이 구현되어 있습니다.

- Expo SDK 52 기반 앱 구조
- expo-router 탭 네비게이션
- 자원/레시피/업그레이드/IP 업그레이드/스테이지 데이터
- Zustand + AsyncStorage 기반 영속 스토어
- 250ms 하트비트 게임 루프
- 오프라인 수익 계산
- 실제 동작하는 채취 화면
- 실제 동작하는 생산 화면

## 기술 스택

- Expo SDK 52
- React Native 0.76
- React 18
- TypeScript
- expo-router v4
- Zustand v5
- AsyncStorage
- react-native-reanimated

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run start
```

실행 후 Expo 개발 서버가 열리며, 다음 방식으로 확인할 수 있습니다.

- Android 에뮬레이터 실행: `npm run android`
- iOS 시뮬레이터 실행: `npm run ios`
- 웹 실행: `npm run web`

Windows PowerShell 실행 정책 문제로 `npm`이 막히는 환경에서는 아래처럼 `.cmd`로 실행하면 됩니다.

```bash
npm.cmd run start
```

## 사용 가능한 스크립트

```bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
```

타입 체크는 아래처럼 실행할 수 있습니다.

```bash
npx tsc --noEmit
```

## 프로젝트 구조

```text
src/
  app/          expo-router 라우트
  components/   공통 UI 컴포넌트
  data/         자원, 레시피, 업그레이드 등 정적 데이터
  engine/       게임 루프, 오프라인 계산 등 게임 로직
  hooks/        커스텀 훅
  services/     외부 연동용 서비스 레이어
  store/        Zustand 전역 상태 및 저장
  types/        공용 타입
  utils/        숫자/시간 포맷 등 유틸리티
```

## 주요 문서

- `raw-works-gdd.md`: 게임 기획 및 구현 단계 문서
- `development-readiness.md`: 개발 착수용 정리 문서

## 현재 구현 범위

현재 플레이 가능한 범위는 다음과 같습니다.

- 자동 채취 루프가 백그라운드에서 동작
- 채취 탭에서 해금된 원자재 확인 및 수동 채취 가능
- 생산 탭에서 레시피 확인, 비용 검증, 생산 시작 가능
- 생산 슬롯 진행률과 남은 시간 확인 가능
- 오프라인 복귀 시 누적 수익 계산

아직 남아 있는 주요 작업은 다음과 같습니다.

- 업그레이드 화면 실제 연결
- 프레스티지 화면 실제 연결
- 작업자/가챠 화면 연결
- 숙련도/스케일링/프레스티지 엔진 분리 고도화
- 공장 화면 및 시각 연출 구현

## 개발 메모

- 상태 저장은 AsyncStorage를 사용합니다.
- 세이브 데이터는 버전 필드를 포함한 형태로 저장됩니다.
- 프로젝트는 엄격한 TypeScript 설정을 사용합니다.
- 경로 별칭으로 `@/`가 `src/`를 가리킵니다.