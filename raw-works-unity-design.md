# Raw Works - Unity 재설계 문서

## 1. 문서 목적

이 문서는 [raw-works-gdd.md](raw-works-gdd.md)의 게임 규칙과 콘텐츠 방향을 유지한 상태에서, 실제 개발 기준을 Unity 중심으로 다시 정의한 구현 설계 문서다.

이 문서의 핵심 목표는 다음 4가지다.

- Play 버튼을 누르면 아무 설정 없이 즉시 게임이 돌아가야 한다.
- Inspector 세팅 없이 코드만으로 초기 프로토타입이 동작해야 한다.
- 핵심 게임 로직은 Unity 바깥의 순수 C#으로 테스트 가능해야 한다.
- 비주얼은 Sea of Stars급의 완성도를 참고하되, 자산과 연출은 완전히 독자적으로 제작해야 한다.

이 문서는 기존 GDD를 대체하지 않는다. 기존 GDD는 게임 내용의 원본 문서이고, 이 문서는 Unity 구현 기준 문서다.

---

## 2. 개발 원칙

### 2-1. 절대 원칙

- `SerializeField`를 사용하지 않는다.
- Inspector에 수동으로 연결해야 하는 구조를 만들지 않는다.
- Scene에 오브젝트를 미리 배치해야 동작하는 구조를 피한다.
- 테스트 수치와 임시 밸런스는 전부 코드에 하드코딩한다.
- Play 직후 결과가 보여야 하므로 부트스트랩과 기본 UI는 코드로 생성한다.

### 2-2. 왜 이렇게 가는가

초기 Unity 개발에서 가장 흔한 병목은 다음이다.

- 씬에 빠진 참조 때문에 Play 직후 에러가 남
- 어떤 값이 어디서 설정되는지 Inspector를 뒤져야 함
- 콘텐츠 추가보다 연결 작업이 더 오래 걸림
- 테스트하려면 매번 Scene을 수동 구성해야 함

이 프로젝트는 초기에 그것을 완전히 피해야 한다. 따라서 Phase 1은 데이터, 부트스트랩, HUD, 월드 노드 생성까지 모두 코드 우선으로 간다.

---

## 3. Unity 최소 프로토타입 목표

최소 프로토타입은 "완성된 게임"이 아니라 "핵심 루프가 자동으로 검증되는 시뮬레이션 샌드박스"여야 한다.

Play를 누르면 최소한 아래가 즉시 보여야 한다.

- 중앙 기지 1개
- 주변 산 노드 여러 개
- 산과 기지를 연결하는 선
- 좌상단 핵심 자원 HUD
- 하단 탭 또는 패널 전환 UI
- 시뮬레이션이 흐르고 있다는 로그 또는 숫자 변화
- 디버그 단축키 안내

즉, 빈 씬이 아니라 "지금 이 게임이 어떻게 굴러가는지 바로 보이는 상태"가 기본 시작점이어야 한다.

---

## 4. 최소 프로토타입의 성공 기준

다음이 모두 만족되면 최소 프로토타입 성공이다.

1. 프로젝트를 새로 받아도 `Boot.unity`만 열고 Play 하면 동작한다.
2. Inspector에서 참조를 하나도 넣지 않아도 된다.
3. 콘솔을 안 봐도 화면상에서 자원 증가와 루프 진행이 보인다.
4. `F1`부터 `F6`까지 디버그 기능으로 주요 상태를 즉시 검증할 수 있다.
5. Stage 1에서 Stage 3까지 진행과 첫 프레스티지 전 검증이 가능하다.

---

## 5. 권장 Unity 프로젝트 구조

```text
Assets/
  _Project/
    Runtime/
      Bootstrap/
      Core/
        Data/
        Domain/
        Simulation/
        Commands/
        Progression/
        Prestige/
        Workers/
      Presentation/
        World/
        UI/
        Camera/
        Debug/
      Infrastructure/
        Logging/
        Save/
        Time/
    Tests/
      EditMode/
      PlayMode/
    Art/
      Sprites/
      Tiles/
      Backgrounds/
      Effects/
      UI/
      Fonts/
    Scenes/
      Boot.unity
```

Phase 1은 `Boot.unity` 하나만 있어도 충분하다.

---

## 6. 부트 구조 설계

### 6-1. 씬 정책

`Boot.unity`는 거의 비어 있어야 한다.

씬에 미리 있어도 되는 것은 많아야 아래 정도다.

- 기본 카메라
- EventSystem

하지만 이것도 가능하면 코드로 생성해도 된다. 핵심은 "씬에 뭘 깔아야 돌아가는가"가 없어야 한다는 점이다.

### 6-2. 진입 방식

권장 방식은 `RuntimeInitializeOnLoadMethod`로 부트스트랩 루트를 생성하는 것이다.

```csharp
using UnityEngine;

public static class AutoBootstrap
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void Create()
    {
        var root = new GameObject("GameBootstrap");
        Object.DontDestroyOnLoad(root);
        root.AddComponent<GameBootstrap>();
    }
}
```

이렇게 하면 씬에 `GameBootstrap`를 미리 배치할 필요가 없다.

### 6-3. GameBootstrap 책임

`GameBootstrap`는 아래 순서로 초기화한다.

1. 하드코딩된 데이터베이스 로드
2. 활성 테스트 프로필 결정
3. 초기 `GameState` 생성
4. 시뮬레이션 러너 생성
5. 월드 오브젝트 생성
6. UI 생성
7. 디버그 HUD 생성
8. 카메라 초기화
9. 시작 로그 출력

권장 코드 구조는 다음과 같다.

```csharp
using UnityEngine;

public sealed class GameBootstrap : MonoBehaviour
{
    private RuntimeContext _context;

    private void Awake()
    {
        var definitions = StaticGameDatabase.Build();
        var profile = DevConfig.ActiveProfile;
        var state = DevStateFactory.Create(profile, definitions);

        var simulation = new SimulationRunner(definitions, state);
        var worldRoot = WorldFactory.Create(definitions, state, simulation);
        var uiRoot = HudFactory.Create(definitions, state, simulation);
        var debugRoot = DebugHudFactory.Create(definitions, state, simulation);
        var cameraRig = CameraFactory.Create(state);

        _context = new RuntimeContext(definitions, state, simulation, worldRoot, uiRoot, debugRoot, cameraRig);
        StartupReporter.Print(_context);
    }

    private void Update()
    {
        _context.Simulation.Tick(Time.deltaTime);
        _context.UiRoot.Refresh(_context.State);
        _context.WorldRoot.Refresh(_context.State);
        _context.DebugRoot.Refresh(_context.State);
    }
}
```

핵심은 `Update()`에서 비즈니스 로직을 직접 쓰지 않고, `SimulationRunner`에 위임하는 것이다.

---

## 7. Play 즉시 동작하는 최소 프로토타입 구성

### 7-1. 최소 화면 구성

Phase 1에서 Play 직후 보여야 하는 최소 요소는 다음과 같다.

#### 월드

- 중앙 기지 1개
- Stage 1 산 2개 이상
- Stage 2 산 3개 이상
- Stage 3 검증용 잠금 산 일부
- 산과 기지를 잇는 점선 경로
- 이동 중인 카트 또는 트럭 더미 오브젝트

#### UI

- 좌상단: 돈, 핵심 자원 3개, 현재 단계
- 우상단: 디버그 버튼 또는 패널 토글
- 하단: 6개 메인 탭
- 중앙 하단: 선택 대상 정보 패널
- 우측 또는 좌측: 디버그 HUD

### 7-2. 최소 기능

아래 기능이 바로 되어야 한다.

- 산 클릭 시 선택됨
- 선택한 산의 자원, 속도, 왕복 시간 표시
- 시간이 지나면 자원이 증가함
- 생산 패널에서 레시피 목록이 보임
- 버튼 클릭 시 제작 시작
- 재료가 있으면 결과물이 생김
- 단계 조건 충족 시 다음 스테이지 진입 가능 표시
- 프레스티지 가능 상태를 계산할 수 있음

---

## 8. 코드 수준 클래스 설계

여기서부터는 실제 구현 기준으로 더 구체화한다.

### 8-1. 정적 데이터 레이어

초기에는 ScriptableObject 대신 정적 코드 데이터로 간다.

권장 파일:

- `ResourceDatabase.cs`
- `RecipeDatabase.cs`
- `MountainDatabase.cs`
- `StageDatabase.cs`
- `UpgradeDatabase.cs`
- `WorkerDatabase.cs`

예시:

```csharp
public static class ResourceDatabase
{
    public static readonly ResourceDef[] All =
    {
        new ResourceDef("log", "원목", ResourceTier.Raw, "wood", 1, true),
        new ResourceDef("copper_ore", "구리광석", ResourceTier.Raw, "copper", 1, true),
        new ResourceDef("lumber", "목재", ResourceTier.P1, "wood", 1, false),
        new ResourceDef("copper_ingot", "동괴", ResourceTier.P1, "copper", 1, false),
    };
}
```

### 8-2. 게임 상태 레이어

상태는 반드시 Unity 오브젝트에서 분리한다.

```csharp
public sealed class GameState
{
    public SessionState Session;
    public EconomyState Economy;
    public MiningState Mining;
    public ProductionState Production;
    public ProgressionState Progression;
    public PrestigeState Prestige;
    public WorkerState Workers;
    public DebugState Debug;
}
```

각 하위 상태는 가능한 한 Plain C# 클래스 또는 `struct`로 유지한다.

### 8-3. 시뮬레이션 러너

`SimulationRunner`가 매 프레임 또는 고정 틱마다 아래 순서로 처리한다.

1. 입력 명령 반영
2. 산 채굴 진행
3. 운송 왕복 완료 처리
4. 생산 큐 진행
5. 단계 조건 판정
6. 프레스티지 가능 여부 갱신
7. 이벤트 버퍼 기록

예시:

```csharp
public sealed class SimulationRunner
{
    private readonly GameDefinitions _definitions;
    private readonly GameState _state;
    private readonly CommandQueue _commands = new();

    public SimulationRunner(GameDefinitions definitions, GameState state)
    {
        _definitions = definitions;
        _state = state;
    }

    public void Enqueue(IGameCommand command)
    {
        _commands.Enqueue(command);
    }

    public void Tick(float deltaTime)
    {
        CommandSystem.Execute(_commands, _definitions, _state);
        MiningSystem.Tick(deltaTime, _definitions, _state);
        TransportSystem.Tick(deltaTime, _definitions, _state);
        ProductionSystem.Tick(deltaTime, _definitions, _state);
        ProgressionSystem.Evaluate(_definitions, _state);
        PrestigeSystem.RefreshPreview(_definitions, _state);
        EventLogSystem.FlushFrame(_state);
    }
}
```

이 구조면 EditMode 테스트에서 `Tick()`만 반복 호출해도 핵심 검증이 가능하다.

### 8-4. 명령 큐 구조

UI가 직접 상태를 바꾸지 않도록 간단한 명령 큐를 둔다.

예:

- `SelectMountainCommand`
- `StartRecipeCommand`
- `ClaimDebugResourcesCommand`
- `AdvanceStageCommand`
- `TriggerPrestigeCommand`

이렇게 해야 나중에 입력 방식이 바뀌어도 코어 로직이 흔들리지 않는다.

### 8-5. 월드 팩토리

월드 표시는 `WorldFactory`가 책임진다.

역할:

- 기지 생성
- 산 노드 생성
- 연결선 생성
- 운송 유닛 뷰 생성
- 선택 강조 이펙트 생성

중요한 점:

- 위치값도 초기에는 코드에서 계산한다.
- 산 배치는 GDD의 15산 구조를 따르되, Phase 1은 6~8개만 우선 보여도 된다.

예시 좌표 정책:

- 기지: `(0, -3)`
- 산은 반원형 또는 부채꼴 배치
- 거리 = Stage에 따라 증가

### 8-6. HUD 팩토리

`HudFactory`는 코드로 Canvas와 주요 텍스트, 버튼을 만든다.

초기에는 Unity UI Toolkit보다 UGUI가 구현 속도 면에서 유리하다. 단, 이것도 Inspector 연결 없이 전부 코드로 생성해야 한다.

생성 항목:

- 루트 Canvas
- 상단 자원 바
- 하단 탭 바
- 좌측 선택 패널
- 우측 디버그 패널

---

## 9. DevConfig와 테스트 프로필 설계

Play 즉시 테스트 가능하게 만들려면, 실행 시 어떤 상태로 시작할지를 코드에서 고정해야 한다.

### 9-1. 권장 프로필

```csharp
public enum BootProfile
{
    DefaultStart,
    Stage2Unlocked,
    Stage3PrestigeReady,
    VisualSandbox,
    EconomyStress,
}
```

```csharp
public static class DevConfig
{
    public const BootProfile ActiveProfile = BootProfile.Stage3PrestigeReady;
    public const bool ShowDebugHudOnBoot = true;
    public const bool AutoUnlockVisibleMountains = true;
    public const float SimulationSpeedMultiplier = 1.0f;
}
```

### 9-2. 프로필별 목적

`DefaultStart`

- 완전 초반 체험용
- Stage 1 루프 검증

`Stage2Unlocked`

- 철광, 석유, 알루미늄 체인 검증
- 중간 단계 해금 확인

`Stage3PrestigeReady`

- 첫 프레스티지 직전 루프 확인
- 최소 프로토타입의 기본 프로필로 가장 적절

`VisualSandbox`

- 모든 산 시각 배치 확인
- 카메라, 조명, 파랄랙스, 색감 조정용

`EconomyStress`

- 대량 자원, 고속 틱, 다중 레시피 동시 검증
- 숫자 오버플로우 및 성능 문제 확인용

### 9-3. 상태 팩토리 예시

```csharp
public static class DevStateFactory
{
    public static GameState Create(BootProfile profile, GameDefinitions definitions)
    {
        return profile switch
        {
            BootProfile.DefaultStart => CreateDefaultStart(definitions),
            BootProfile.Stage2Unlocked => CreateStage2Unlocked(definitions),
            BootProfile.Stage3PrestigeReady => CreateStage3PrestigeReady(definitions),
            BootProfile.VisualSandbox => CreateVisualSandbox(definitions),
            BootProfile.EconomyStress => CreateEconomyStress(definitions),
            _ => CreateDefaultStart(definitions),
        };
    }
}
```

---

## 10. 최소 프로토타입의 실제 부팅 시나리오

`Stage3PrestigeReady` 기준으로 Play를 누르면 아래처럼 동작해야 한다.

1. Stage 3 상태로 시작한다.
2. 목재, 구리, 철, 석유, 알루미늄 체인의 핵심 중간 자원이 일부 지급된다.
3. 복합소재패널, 기초회로보드, 스마트기계, 첨단작업대 중 1~2개는 제작 가능한 상태다.
4. 화면에는 Stage 1~3 산이 보이고 일부는 이미 해금되어 있다.
5. 카트나 트럭 더미 유닛이 왕복 중이다.
6. 상단 HUD에서 자원 숫자가 조금씩 변한다.
7. 생산 패널에서 버튼 몇 번만 누르면 첫 프레스티지 조건 근처까지 갈 수 있다.

즉, 시작 후 10초 안에 "이 루프가 뭔지"가 보여야 한다.

---

## 11. 필수 디버그 기능 상세 설계

Inspector를 쓰지 않기 때문에 디버그 기능은 선택이 아니라 필수다.

### 11-1. 단축키

- `F1`: 디버그 HUD 표시/숨김
- `F2`: 핵심 자원 패키지 지급
- `F3`: 다음 단계 강제 진입
- `F4`: 선택 레시피 즉시 완성
- `F5`: 프레스티지 미리보기 갱신
- `F6`: 런 리셋, 영구 진행 유지
- `F7`: 시뮬레이션 속도 x1/x5/x20 전환
- `F8`: 모든 산 표시 토글
- `Space`: 일시정지

### 11-2. 디버그 HUD 표시 항목

- 현재 프로필
- 현재 단계
- 돈
- 프레스티지 예상 보상
- 초당 채굴량
- 초당 운송량
- 활성 생산 큐 수
- 선택 산 ID
- 선택 산 왕복 시간
- 최근 이벤트 로그 10개

### 11-3. 이벤트 로그 예시

- `Mountain mountain_03 delivered 2 iron_ore`
- `Recipe copper_ingot completed`
- `Stage advanced to 3`
- `Prestige preview updated: 2 IP`

로그는 개발 중 콘솔만 보지 않도록 화면에도 보여야 한다.

---

## 12. EditMode 테스트 설계

핵심 계산은 Unity 없이 돌아야 한다.

### 12-1. 우선 작성할 테스트

1. 채굴 속도 계산 테스트
2. 왕복 시간 계산 테스트
3. 생산 입력 소비 테스트
4. 생산 완료 결과물 지급 테스트
5. Stage 1 -> 2 조건 테스트
6. Stage 2 -> 3 조건 테스트
7. 첫 프레스티지 계산 테스트

### 12-2. 예시 테스트 이름

- `MiningSystem_CalculatesExpectedThroughput()`
- `ProductionSystem_ConsumesInputsAndCreatesOutput()`
- `ProgressionSystem_UnlocksStage2_WhenWheelbarrowAndPickaxeReady()`
- `PrestigeSystem_ReturnsExpectedIp_ForTier1State()`

### 12-3. 테스트 기준

- Arrange: 하드코딩된 `GameDefinitions`, `GameState`
- Act: 시스템 함수 실행
- Assert: 자원 수량, 단계, 플래그, 결과값 검증

---

## 13. PlayMode 테스트 설계

PlayMode 테스트는 런타임 연결 검증용이다.

### 13-1. 우선 순위

1. Play 시 `GameBootstrap` 자동 생성됨
2. HUD가 자동 생성됨
3. 산 노드가 화면에 생성됨
4. 2초 경과 후 자원이 증가함
5. 디버그 명령 실행 시 상태가 바뀜

### 13-2. 통과 기준

- PlayMode에서 빈 화면이 아니다.
- 3초 안에 최소 1개 숫자가 변화한다.
- 디버그 핫키 또는 명령 호출이 실제 상태를 바꾼다.

---

## 14. 최소 구현 범위 제안

전체 GDD를 한 번에 Unity로 옮기면 실패할 가능성이 높다. 따라서 첫 번째 구현 범위는 아래로 제한한다.

### 14-1. 포함

- Stage 1~3
- 5개 기본 체인: 목재, 구리, 철광, 석유, 알루미늄
- 4개 크로스 레시피: 복합소재패널, 기초회로보드, 스마트기계, 첨단작업대
- 첫 프레스티지 아이템: 소규모공장
- 산 8개 이하의 축소 맵
- 6개 메인 탭 UI 껍데기
- 디버그 HUD

### 14-2. 제외

- 작업자 가챠 상세 연출
- 업적 화면
- 일일 퀘스트 화면
- 고급 숙련도 마일스톤
- 오프라인 보상
- 저장/로드 마이그레이션
- 과도한 VFX

---

## 15. 화면 구성 설계

모바일 탭 감각이 아니라 PC용 화면 구성을 기본으로 본다.

### 15-1. 메인 레이아웃

- 좌측 상단: 자원, 화폐, 단계
- 중앙: 산 필드와 기지
- 우측: 선택 정보 또는 디버그 정보
- 하단: 메인 메뉴 6개

### 15-2. 메인 메뉴 제안

스크린샷 방향을 반영해 아래처럼 정리하는 편이 좋다.

- 자원
- 제작
- 프로젝트
- 관리자
- 부스트
- 모션

이 이름은 내부 구현상 탭일 뿐이고, 나중에 실제 명칭은 조정 가능하다.

### 15-3. 패널 구현 방식

각 패널은 다음 구조를 가진다.

- `PanelController` : 열기/닫기/선택 상태
- `PanelView` : Unity UI 객체 보유
- `PanelPresenter` : 현재 `GameState`를 읽어 표시값 반영

이 3개를 분리하면 UI가 커져도 유지가 쉽다.

---

## 16. Sea of Stars 감성 아트 가이드 - 실무 버전

여기서 말하는 목표는 "Sea of Stars를 복제"가 아니라, 아래 요소를 참고한 고급 픽셀 판타지-인더스트리얼 무드다.

- 픽셀 기반이지만 조명 표현이 풍부함
- 단순 복고가 아니라 고급스럽고 밀도 있는 배경
- 색감과 명암이 드라마틱함
- 정적인 화면도 살아 있는 것처럼 느껴짐

절대 하지 말아야 할 것:

- Sea of Stars 팔레트를 그대로 베끼기
- 동일한 지형 구조를 모사하기
- 캐릭터, 이펙트, UI 장식을 그대로 흉내 내기

우리가 참고해야 하는 것은 "완성도 원리"다.

---

## 17. 아트 스타일의 핵심 정의

### 17-1. 월드 무드 키워드

- 황혼
- 심야 산업지대
- 광물의 차가운 발광
- 금속 장비의 따뜻한 반사광
- 몽환적이지만 읽기 쉬운 배경

### 17-2. 형태 키워드

- 산은 실루엣이 강해야 한다
- 기지는 작은 픽셀 성채처럼 진화해야 한다
- 운송 수단은 작아도 식별 가능한 개성을 가져야 한다
- 광물 색은 체인별로 분명히 구분되어야 한다

### 17-3. 렌더 목표

- 첫눈에 "픽셀 아트인데 싼 느낌이 아니다"가 나와야 한다
- 작은 화면 요소도 명확하게 읽혀야 한다
- 전체가 너무 어두워서 정보가 묻히면 안 된다

---

## 18. 실무용 비주얼 파이프라인

### 18-1. 1단계 - 기준 해상도 먼저 고정

아트를 찍기 전에 먼저 해상도와 카메라 규칙을 잠가야 한다.

권장 기준:

- 내부 월드 해상도: `320 x 180` 또는 `426 x 240`
- 타일 또는 그리드 기준은 필요하면 `8x8`, `16x16`, `32x32` 중 하나로 통일
- UI는 월드보다 높은 해상도로 그려도 됨

실무 권장:

- 월드 스프라이트는 `16x16`, `32x32`, `64x64` 배수 기준으로 설계
- 산 노드, 기지, 운송수단처럼 중요한 오브젝트는 정수 배수 크기를 유지

### 18-2. 2단계 - 팔레트 보드 제작

바로 스프라이트를 그리지 말고 먼저 팔레트 보드를 만든다.

필수 팔레트 그룹:

- 배경 하늘 4~6색
- 원경 산맥 3~4색
- 중경 지형 4~6색
- 전경 오브젝트 기본색 6~10색
- 금속 하이라이트 3색
- 광물 발광색 체인별 2~3색
- UI 금색 계열 3~4색

권장 원칙:

- 검정으로 닫지 말고, 남색/보라/청색 기반의 어두운 색으로 닫는다.
- 광물 발광은 너무 형광처럼 튀지 않게 제한한다.
- 금색 UI는 노란색 단색이 아니라 황금-주황-갈색의 계조로 간다.

### 18-3. 3단계 - 값 설계 먼저, 색은 나중

실무에서는 컬러보다 값 설계가 중요하다.

순서:

1. 그레이스케일로 실루엣 설계
2. 큰 명암 덩어리 정리
3. 읽힘 확인
4. 그 뒤 색상 적용

이렇게 해야 산 노드와 기지가 배경에 묻히지 않는다.

### 18-4. 4단계 - 레이어 분리 규칙

배경은 최소 5단으로 쪼개는 것을 권장한다.

- Sky
- Far Mountains
- Mid Mountains
- Playfield Ground
- Foreground Accents

추가 레이어:

- Fog
- Glow Overlay
- Spark Particles
- Weather Optional

이 레이어 분리가 있어야 Sea of Stars 계열의 깊이감이 나온다.

---

## 19. 씬 아트 제작 규칙

### 19-1. 산 노드 제작 규칙

각 산은 아이콘이 아니라 작은 환경 오브젝트처럼 보여야 한다.

구성 요소 권장:

- 산 본체 실루엣
- 산 정상 또는 광맥 색 포인트
- 잠금 상태용 장치 또는 자물쇠 장식
- 자원 종류를 암시하는 보조 오브젝트

예:

- 구리산: 따뜻한 주황-적색 광맥 포인트
- 석영산: 청백색 크리스털 포인트
- 우라늄산: 녹청색 발광 틈

### 19-2. 기지 제작 규칙

기지는 Stage 상승에 따라 시각적으로 커져야 한다.

최소 단계별 변화:

- Stage 1: 작은 창고 + 조명 2개
- Stage 2: 굴뚝 추가 + 적재장 확장
- Stage 3: 가공 설비 실루엣 추가
- Stage 4+: 안테나, 탱크, 발전 설비 등 확장

즉, 기지는 단순 아이콘이 아니라 진행도 표시 장치 역할도 해야 한다.

### 19-3. 운송수단 제작 규칙

아주 작은 크기여도 다음은 읽혀야 한다.

- 사람
- 손수레
- 광차
- 트럭
- 드론 또는 고급 수송 수단

중요 포인트:

- 실루엣 차이
- 바퀴 수 또는 몸체 길이 차이
- 운송 중 흔들림 또는 발광 포인트

---

## 20. 라이팅과 후처리 가이드

### 20-1. Unity 기술 방향

권장:

- URP
- Pixel Perfect Camera
- Sprite Atlas
- TextMeshPro

선택:

- 2D Light
- Bloom
- Color Adjustments

초기에는 셰이더 과잉보다 스프라이트 자체의 명암 설계를 우선한다.

### 20-2. 라이팅 원칙

- 환경 전체는 차갑게
- 상호작용 가능한 요소는 따뜻하게
- 광물, 설비, UI 강조는 국소적으로 밝게
- 모든 요소를 밝히지 말고, 플레이 정보에만 빛을 준다

### 20-3. 추천 연출

- 기지 창문 깜빡임
- 용광로 오렌지 글로우
- 광물 반짝임
- 산 뒤편 얇은 안개 이동
- 구름 그림자 또는 색 변주

### 20-4. 블룸 사용 규칙

- 광물 발광과 핵심 UI 강조에만 제한적으로 사용
- 작은 오브젝트가 번져서 뭉개지지 않도록 강도는 약하게 유지

---

## 21. 애니메이션 실무 가이드

### 21-1. 우선순위

아래 순서대로 작업하는 것이 가장 효율적이다.

1. 운송 유닛 이동
2. 산 반짝임
3. 기지 조명 점멸
4. 제작 완료 짧은 펄스
5. 배경 안개/구름 이동
6. UI 선택 글로우

### 21-2. 프레임 수 권장

- 미세 루프: 2~4프레임
- 일반 환경 루프: 4~6프레임
- 중요한 제작 완료 연출: 6~10프레임

중요한 점은 프레임 수를 늘리는 것이 아니라, 적은 프레임으로도 리듬을 잘 주는 것이다.

### 21-3. 모션 원칙

- 멈춘 것처럼 보이는 화면을 만들지 않는다.
- 동시에 모든 것이 흔들리게 하지 않는다.
- 가장 중요한 루프 하나만 크게, 나머지는 미세하게 움직인다.

---

## 22. UI 아트 제작 가이드

### 22-1. UI 방향

UI는 "황동 장치판 + 어두운 야간 산업 배경" 느낌이 적절하다.

필수 특징:

- 짙은 남청색 패널 바탕
- 따뜻한 금색 외곽선
- 약한 내부 그라데이션
- 정보 우선순위가 명확한 타이포그래피

### 22-2. 텍스트 규칙

- 숫자는 모노스페이스 계열 감각이 필요함
- 제목은 픽셀 감성 또는 저해상도와 잘 맞는 서체 사용
- 본문은 지나치게 픽셀 폰트만 고집하지 말고, 가독성을 우선한다

### 22-3. 버튼 규칙

- 비활성은 어두운 청색 + 약한 금 테두리
- 활성은 밝은 금색 하이라이트
- 선택 중은 외곽 발광 또는 안쪽 그라데이션 강화

---

## 23. 아트 생산 일정 추천

아트는 아래 순서가 안전하다.

### 23-1. 첫 주

- 카메라 기준 잠그기
- 해상도 잠그기
- 팔레트 보드 제작
- 월드 레이아웃 러프 제작

### 23-2. 둘째 주

- 기지 3단계 버전 제작
- 산 6종 우선 제작
- 운송수단 4종 러프 제작
- UI 패널 샘플 1종 제작

### 23-3. 셋째 주

- 파랄랙스 배경 확정
- 광물별 발광 규칙 확정
- 주요 루프 애니메이션 추가
- 실제 게임 카메라에서 가독성 검증

### 23-4. 넷째 주

- 화면 통일감 조정
- 라이팅 패스 조정
- HUD와 월드의 색 충돌 정리
- 최종 샷 테스트

---

## 24. 실제 작업용 체크리스트

### 24-1. 프로그래밍 체크리스트

- Play 시 자동 부팅되는가
- Inspector 연결이 없어도 동작하는가
- 최소 HUD가 코드로 생성되는가
- `SimulationRunner`만으로 진행이 가능한가
- 디버그 핫키가 모두 작동하는가
- Stage 3 프레스티지 직전 상태가 프로필로 준비되는가

### 24-2. 아트 체크리스트

- 산 실루엣이 자원별로 구분되는가
- 기지가 Stage별로 진화해 보이는가
- 배경과 플레이 필드가 분리되어 보이는가
- 광물 발광이 과하지 않은가
- UI와 배경 색이 충돌하지 않는가
- 카메라 확대/축소 시 픽셀이 깨지지 않는가

---

## 25. 코파일럿 작업 지시문 세트

이 섹션만 영어로 유지한다. 실제 코파일럿에게 붙여 넣는 용도다.

### Prompt 1 - Bootstrap Prototype

```text
Create a minimal Unity prototype architecture for Raw Works with these constraints:

- No SerializeField
- No Inspector wiring
- Hardcode all test values directly in scripts
- Press Play and the prototype must run immediately with no setup

Implement code structure only, not final art.

Requirements:
- Boot through RuntimeInitializeOnLoadMethod
- Create a GameBootstrap MonoBehaviour from code
- Build static code databases for resources, recipes, mountains, and stages
- Create a DevConfig with BootProfile presets
- Default profile must be Stage3PrestigeReady
- Build GameState, SimulationRunner, CommandQueue, and DebugHud architecture
- Spawn a base, mountain nodes, connection lines, a simple HUD, and a debug overlay from code
- Add debug hotkeys F1-F8 and Space
- Show immediate state changes after pressing Play

Use clean, testable C# structure with pure domain logic where possible.
```

### Prompt 2 - Mining and Production Slice

```text
Implement the first playable vertical slice of Raw Works in Unity.

Constraints:
- No SerializeField
- No Inspector setup
- Hardcoded values only
- Play must immediately show results

Scope:
- Stages 1 to 3 only
- Wood, copper, iron, oil, aluminum chains
- Composite panel, basic circuit, smart machine, advanced workbench
- Small factory prestige item preview

Implement:
- Mining tick logic
- Transport round-trip logic
- Production queue logic
- Stage progression checks
- Prestige preview calculation
- Runtime-generated HUD and debug panel
```

### Prompt 3 - Art Sandbox Setup

```text
Create a Unity art sandbox scene setup for Raw Works inspired by premium pixel-art RPG presentation.

Do not copy Sea of Stars assets or exact palette.

Requirements:
- PC landscape layout
- Pixel Perfect Camera setup
- URP-friendly 2D scene structure
- Parallax background layers
- Base and mountain placeholder sprites generated or represented with simple shapes
- Lighting hooks for glow accents
- Camera zoom presets
- All scene objects spawned from code with no Inspector references
```

---

## 26. 최종 방향

이 프로젝트의 초반 Unity 개발은 "씬을 예쁘게 만들기"보다 "Play 즉시 검증 가능한 구조를 잡는 것"이 먼저다.

정리하면 우선순위는 아래와 같다.

1. 코드만으로 부팅된다.
2. 화면에 즉시 결과가 나온다.
3. 핵심 루프가 10초 안에 이해된다.
4. 디버그 기능으로 테스트가 빠르다.
5. 그 다음에 Sea of Stars급 완성도를 목표로 비주얼을 올린다.

이 순서를 지키면 초기 Unity 프로젝트에서 가장 흔한 구조 혼란과 반복 세팅 비용을 크게 줄일 수 있다.
