# Raw Works - Unity 코파일럿 단계별 개발 프롬프트

## 1. 문서 목적

이 문서는 [raw-works-unity-design.md](raw-works-unity-design.md)를 실제 개발 순서로 분해한 코파일럿 지시 문서다.

핵심 목표는 다음과 같다.

- 실제 개발을 한 번에 큰 덩어리로 맡기지 않고, 작고 검증 가능한 단계로 나눈다.
- 각 단계마다 코파일럿에게 바로 붙여 넣을 수 있는 영어 프롬프트를 제공한다.
- 각 단계마다 직접 확인할 수 있는 테스트 기준을 붙인다.
- 초기 세팅부터 마지막 폴리싱 전 검증까지 끊김 없이 이어지는 개발 루트를 만든다.

이 문서는 설계 문서가 아니라 실행 순서 문서다.

---

## 2. 사용 원칙

이 문서는 아래 방식으로 사용한다.

1. 한 번에 한 단계만 코파일럿에 지시한다.
2. 해당 단계 결과를 Unity에서 바로 테스트한다.
3. 테스트가 통과하면 다음 단계로 넘어간다.
4. 실패하면 같은 단계 안에서 수정 프롬프트를 추가로 던진다.

중요한 점:

- 여러 단계를 한 번에 합치지 않는다.
- 특히 초기 1~6단계는 반드시 잘게 간다.
- Play를 눌렀을 때 바로 검증 가능한 상태를 계속 유지해야 한다.

---

## 2-1. Unity 프로젝트 생성부터 시작하기

Unity를 처음 만지는 기준으로는 아래 순서로 시작하는 것이 가장 안전하다.

1. Unity Hub를 설치하고 로그인한다.
2. Unity Editor는 가능하면 최신 LTS를 설치한다.
3. Hub에서 `New project`를 누르고 템플릿은 `2D URP`가 있으면 그것을, 없으면 `URP` 또는 `2D Core`를 선택한다.
4. 프로젝트 이름은 `RawWorksUnity`처럼 별도 Unity 프로젝트명으로 잡는다.
5. 위치는 현재 문서와 별개로 Unity 프로젝트 전용 폴더를 만든다. 예: `C:/DEV/RawWorksUnity`
6. 프로젝트를 만든 뒤 처음 열리면 아래 항목부터 먼저 맞춘다.

권장 초기 설정:

- `Edit > Project Settings > Editor`에서 `Asset Serialization`을 `Force Text`로 둔다.
- `Edit > Project Settings > Version Control`에서 `Mode`를 `Visible Meta Files`로 둔다.
- `Edit > Project Settings > Player`에서 회사명/제품명을 임시로라도 입력한다.
- `Window > Package Manager`에서 `TextMeshPro`가 준비되어 있는지 확인한다.
- `Edit > Preferences > External Tools`에서 외부 에디터를 VS Code로 맞춘다.

이 문서를 시작하기 전에 직접 할 일:

1. 빈 프로젝트가 정상적으로 열리는지 확인한다.
2. `Assets` 폴더가 보이는지 확인한다.
3. `Scenes` 폴더를 만들고 `Boot.unity`를 저장할 준비를 한다.
4. Console 창을 열어 두고 이후 모든 단계에서 에러/경고를 바로 본다.
5. Hierarchy, Project, Inspector, Console 네 창이 동시에 보이도록 레이아웃을 정리한다.

테스트할 때 보는 기본 창:

- `Hierarchy`: 런타임에 오브젝트가 자동 생성되는지 확인
- `Project`: 폴더/스크립트/씬 생성 여부 확인
- `Console`: 로그, 경고, 예외 확인
- `Game`: 실제 화면 결과 확인
- `Test Runner`: 30단계 이후 EditMode/PlayMode 테스트 실행

초보자용 진행 팁:

- 한 단계 구현 후 반드시 `Boot.unity`를 연 상태에서 Play로 확인한다.
- Console에 빨간 에러가 하나라도 생기면 다음 단계로 넘어가지 않는다.
- Inspector에서 수동 연결이 필요해 보이면 이 문서 방향과 어긋난 것이다. 먼저 코드 생성 방식으로 다시 확인한다.
- 테스트 중 씬에 임시 오브젝트를 손으로 넣었다면 저장 전에 제거할지 반드시 점검한다.

---

## 3. 전체 개발 단계 요약

권장 순서는 다음과 같다.

1. 프로젝트 뼈대와 폴더 구조
2. 렌더 파이프라인과 기본 프로젝트 옵션 정리
3. `Boot.unity` 씬 준비
4. 자동 부트스트랩
5. 시작 로그와 런타임 진단
6. 리소스 정의
7. 산, 스테이지, 월드 좌표 정의
8. 레시피와 프레스티지 정의
9. `GameState` 기본 구조
10. `DevConfig`, `BootProfile`, `DevStateFactory`
11. `RuntimeContext` 연결
12. `SimulationRunner` 기본 뼈대
13. 명령 큐와 더미 명령
14. 디버그 HUD 생성
15. 디버그 핫키와 시간 제어
16. 월드 좌표계와 넓은 맵 규칙
17. 드래그 카메라 이동
18. 확대/축소 카메라
19. 월드맵 산 생성
20. 산 선택과 포커스 이동
21. 채굴 루프
22. 광산 내부 배송 루프
23. 중앙 인벤토리와 자원 흐름
24. 생산 시스템 코어
25. 생산 패널 UI
26. 단계 진행 시스템
27. 프레스티지 미리보기
28. 프레스티지 리셋 실행
29. 하단 탭과 패널 쉘
30. EditMode 테스트
31. PlayMode 테스트
32. 아트 샌드박스와 파랄랙스
33. 플레이스홀더 비주얼 스타일 정리
34. 최종 아트 교체 준비 구조 정리

---

## 4. 단계별 프롬프트 세트

각 단계는 아래 형식으로 구성한다.

- 목표
- 완료 조건
- Unity에서 직접 확인할 테스트
- 코파일럿 프롬프트

메인 월드 기본 전제:

- 메인 화면에서 모든 산이 한 번에 보일 필요는 없다.
- 산은 넓은 월드 공간에 퍼져 있어야 한다.
- 플레이어는 드래그로 이동하고 휠 또는 지정 입력으로 확대/축소한다.
- 초기 프로토타입부터 이 구조를 유지한다.
- 메인 월드의 산 노드 위에는 이름, 채굴량, 배송 주기 같은 텍스트 정보를 띄우지 않는다.
- 산 상세 정보는 산 클릭 후 선택 패널 또는 HUD에서만 보여준다.
- 잠금 산은 흑백 또는 desaturated 상태로 보여준다.
- 현재 해금 가능한 다음 산은 흑백 상태지만 약한 강조를 준다.
- 아직 선행 산이 해금되지 않은 산은 더 어둡게 누르고 클릭 시 선행 조건 메시지만 보여준다.
- 산 해금은 Gold 소비 + 직전 산 선행 해금 규칙을 따른다.
- 산을 해금하면 즉시 컬러 그래픽으로 전환되어 열린 상태가 분명히 보여야 한다.
- 초기 경제 밸런스 목표는 `DefaultStart` 기준 첫 프레스티지 75~90분이다.
- 티어1 프레스티지 예상 보상은 기본 1 IP, 잘 풀리면 2 IP 수준으로 본다.

---

## 5. 1단계 - 프로젝트 뼈대와 폴더 구조

### 목표

Unity 프로젝트 안에 최소한의 런타임 구조와 테스트 폴더 구조를 잡는다.

### 완료 조건

- `Assets/_Project` 이하 폴더 구조가 정리된다.
- `Boot.unity` 씬이 존재한다.
- 이후 단계에서 참조할 기본 네임스페이스와 파일 위치 규칙이 정해진다.

### 직접 테스트

1. `Project` 창에서 `Assets/_Project` 아래 폴더가 문서 구조대로 생성됐는지 확인한다.
2. `Assets/_Project/Scenes` 또는 지정한 씬 폴더 안에 `Boot.unity`가 있는지 확인한다.
3. `Boot.unity`를 더블클릭해서 열고 `Ctrl+S`로 저장이 정상 동작하는지 확인한다.
4. 현재 단계에서는 씬이 비어 있어도 괜찮지만, 이후 단계용 기본 진입 씬이 하나로 고정됐는지만 확인한다.

### Copilot Prompt

```text
Set up the initial Unity project structure for Raw Works.

Constraints:
- No SerializeField
- No Inspector-based architecture
- Keep everything ready for code-driven bootstrap later

Create or organize these folders under Assets/_Project:
- Runtime/Bootstrap
- Runtime/Core/Data
- Runtime/Core/Domain
- Runtime/Core/Simulation
- Runtime/Core/Commands
- Runtime/Core/Progression
- Runtime/Core/Prestige
- Runtime/Core/Workers
- Runtime/Presentation/World
- Runtime/Presentation/UI
- Runtime/Presentation/Camera
- Runtime/Presentation/Debug
- Runtime/Infrastructure/Logging
- Runtime/Infrastructure/Save
- Runtime/Infrastructure/Time
- Tests/EditMode
- Tests/PlayMode
- Art/Sprites
- Art/Tiles
- Art/Backgrounds
- Art/Effects
- Art/UI
- Art/Fonts
- Scenes

Also create a Boot.unity scene and add a short README-style comment file or documentation note describing folder responsibilities.
```

---

## 6. 2단계 - 렌더 파이프라인과 기본 프로젝트 옵션 정리

### 목표

초기부터 픽셀 기반 PC 월드를 염두에 둔 기본 프로젝트 설정 방향을 잡는다.

### 완료 조건

- URP 또는 사용할 렌더 기준이 정리됨
- Pixel Perfect Camera 사용 계획이 정리됨
- 품질 옵션과 해상도 기준 메모가 남음

### 직접 테스트

1. `Window > Package Manager`를 열어 현재 사용할 렌더 기준이 `URP`인지 확인한다.
2. `TextMeshPro`, `Input System`을 쓸 계획이라면 설치 여부 또는 사용 메모가 남아 있는지 확인한다.
3. 해상도, Pixel Perfect Camera 사용 여부, 품질 기준이 문서나 메모 파일에 적혀 있는지 확인한다.
4. 이 단계는 화면 변화보다 설정 기준 정리가 목적이므로, 팀원이 봐도 같은 초기 세팅을 재현할 수 있는지가 통과 기준이다.

### Copilot Prompt

```text
Prepare the Unity project baseline settings for Raw Works.

Constraints:
- No Inspector-driven gameplay setup
- Keep this focused on project baseline only

Set up or document the baseline for:
- URP usage
- Pixel Perfect Camera compatibility
- TextMeshPro usage
- a PC landscape target resolution plan

Do not implement gameplay yet. Keep this step limited to project baseline readiness.
```

---

## 7. 3단계 - `Boot.unity` 씬 준비

### 목표

부팅 전용 씬을 만들고, 게임이 항상 같은 진입점으로 시작하게 한다.

### 완료 조건

- `Boot.unity`가 존재함
- 씬이 거의 비어 있음
- 이 씬이 개발 시작점으로 사용됨

### 직접 테스트

1. `Project` 창에서 `Boot.unity`를 열고 활성 씬이 맞는지 확인한다.
2. `Hierarchy`를 보고 수동 배치된 게임플레이 오브젝트가 없는지 확인한다.
3. 기본 카메라나 기본 조명만 남아 있거나, 완전히 비어 있어도 괜찮다.
4. 씬을 저장한 뒤 다시 열어도 동일한 상태가 유지되는지 확인한다.

### Copilot Prompt

```text
Create and prepare the Boot.unity scene for Raw Works.

Constraints:
- Keep the scene nearly empty
- Do not rely on scene-authored gameplay objects
- This scene must act as the single prototype entry point

Prepare Boot.unity so later runtime bootstrap code can own the entire game startup flow.
```

---

## 8. 4단계 - 자동 부트스트랩

### 목표

Play를 누르면 자동으로 `GameBootstrap`가 생성되게 만든다.

### 완료 조건

- `RuntimeInitializeOnLoadMethod`로 부팅됨
- 씬에 `GameBootstrap`를 배치하지 않아도 동작함
- Play 시 콘솔에 기본 시작 로그가 찍힘

### 직접 테스트

1. `Boot.unity`를 연 상태에서 Console을 비우고 Play를 누른다.
2. `Hierarchy`에 수동 배치 없이 `GameBootstrap`가 자동으로 생기는지 확인한다.
3. `Console`에 부팅 성공 로그가 1회 이상 찍히는지 확인한다.
4. Play를 멈췄다가 다시 눌러도 같은 방식으로 자동 생성과 로그 출력이 반복되는지 확인한다.

### Copilot Prompt

```text
Implement automatic runtime bootstrap for Raw Works in Unity.

Constraints:
- No SerializeField
- No Inspector wiring
- Press Play must create the bootstrap automatically

Implement:
- AutoBootstrap static entry using RuntimeInitializeOnLoadMethod
- GameBootstrap MonoBehaviour created from code
- A minimal startup log so boot success is immediately visible

Do not implement gameplay yet. Only implement the boot path and the minimal runtime root object creation.
```

---

## 9. 5단계 - 시작 로그와 런타임 진단

### 목표

부팅 성공 여부와 현재 상태를 바로 알 수 있는 기본 진단 출력을 만든다.

### 완료 조건

- 부트 시점 로그가 찍힘
- 현재 프로필 또는 기본 상태가 로그에 표시됨
- 이후 단계에서 확장 가능한 진단 구조가 생김

### 직접 테스트

1. Play 직후 `Console`에서 부팅 로그, 프로필 로그, 상태 요약 로그가 순서대로 보이는지 확인한다.
2. 같은 내용이 매 프레임 스팸처럼 반복되지 않고 시작 시점에만 출력되는지 확인한다.
3. Stop 후 다시 Play 했을 때도 로그 형식이 무너지지 않는지 확인한다.
4. 에러나 예외 없이 진단 로그만 나오는 상태면 통과로 본다.

### Copilot Prompt

```text
Add startup diagnostics and runtime reporting to the Raw Works bootstrap.

Constraints:
- No Inspector setup
- Keep diagnostics lightweight and code-driven

Implement:
- a startup reporter or equivalent logging helper
- boot success logs
- initial profile or state summary logs

This step should improve observability only, not gameplay.
```

---

## 10. 6단계 - 리소스 정의

### 목표

Stage 1~3에 필요한 리소스를 코드 데이터로 분리한다.

### 완료 조건

- `ResourceDatabase` 생성
- 체인별 기본 리소스가 들어감
- ScriptableObject 없이 코드로만 읽을 수 있음

### 직접 테스트

1. Play를 누르고 `Console`에서 리소스 정의 수 또는 등록 완료 로그를 찾는다.
2. Stage 1~3 범위 자원이 빠지지 않았는지 로그 또는 초기 HUD 값으로 확인한다.
3. 중복 ID나 누락 데이터 관련 경고가 없는지 확인한다.
4. 가능하면 wood, copper, iron, oil, aluminum 체인이 모두 데이터에 들어갔는지 로그 문구로 확인한다.

### Copilot Prompt

```text
Create the static resource definitions for Raw Works.

Constraints:
- No ScriptableObjects
- No SerializeField
- Hardcode all values directly in C# files

Scope:
- stages 1 to 3 only
- wood, copper, iron, oil, aluminum chains

Implement ResourceDatabase and the related resource definition types only.
```

---

## 11. 7단계 - 산, 스테이지, 월드 좌표 정의

### 목표

산 데이터와 스테이지 데이터, 그리고 넓은 월드에 배치할 좌표 규칙을 코드로 정의한다.

### 완료 조건

- `MountainDatabase` 생성
- `StageDatabase` 생성
- 산 좌표가 한 화면 내부가 아니라 넓은 월드 기준으로 정의됨

### 직접 테스트

1. Play 후 `Console`에서 산 개수와 Stage 데이터 개수 로그를 확인한다.
2. 산 좌표 최소값/최대값이 현재 카메라 화면보다 넓은 범위인지 로그로 확인한다.
3. 아직 시각화가 없더라도, 일부 산 좌표가 원점 주변에 몰리지 않고 멀리 퍼지도록 정의되어 있는지 숫자로 확인한다.
4. 선행 산 해금 조건이나 해금 비용이 데이터 구조에 포함됐는지 정의 코드 또는 로그 요약으로 확인한다.

### Copilot Prompt

```text
Create mountain, stage, and world-layout definitions for Raw Works.

Constraints:
- No ScriptableObjects
- No SerializeField
- Hardcode all values in code

Implement:
- MountainDatabase
- StageDatabase
- prototype world positions for mountains in a larger world space

Include in the data model:
- sequential unlock prerequisites between mountains
- unlockCostGold values that follow the GDD order
- visual state information needed to represent locked grayscale, next-unlockable grayscale highlight, and unlocked color states

Important:
- do not place all mountains inside a single fixed screen view
- spread mountains across a wider map
- prepare the data so the player will need drag navigation and zoom to inspect the full world later
```

---

## 12. 8단계 - 레시피와 프레스티지 정의

### 목표

Stage 1~3 프로토타입용 레시피와 첫 프레스티지 목표 데이터를 넣는다.

### 완료 조건

- `RecipeDatabase` 생성
- 기본 체인 레시피와 크로스 레시피가 들어감
- 첫 프레스티지 목표 데이터가 정리됨

### 직접 테스트

1. Play 후 `Console`에서 레시피 데이터 로드 수를 확인한다.
2. 기본 체인 레시피와 크로스 레시피가 최소한 몇 개 이상 잡히는지 확인한다.
3. 프레스티지 목표 데이터가 함께 초기화되었다는 로그가 있으면 확인한다.
4. 레시피 ID 중복이나 누락 예외 없이 정상 로드되면 통과로 본다.

### Copilot Prompt

```text
Create recipe and prototype prestige definitions for Raw Works.

Constraints:
- No ScriptableObjects
- No SerializeField
- Hardcode all values in C# files

Implement:
- RecipeDatabase
- minimum recipes for stages 1 to 3
- the first prestige target definition needed for prototype preview

Balance targets:
- default progression should aim for a first prestige window around 75 to 90 minutes
- tier 1 prestige preview should usually land at 1 IP and only reach 2 IP when progression is strong
- keep permanent prestige upgrades intentionally modest, not overpowered
```

---

## 13. 9단계 - `GameState` 기본 구조

### 목표

게임 상태를 Unity 오브젝트 밖으로 분리한다.

### 완료 조건

- `GameState` 생성
- 핵심 하위 상태 클래스 생성

### 직접 테스트

1. Play 후 초기 `GameState`가 생성되었다는 로그를 확인한다.
2. Stage, Gold, 자원 보유량, 해금 산 목록 같은 핵심 필드가 기본값으로 채워졌는지 확인한다.
3. 상태가 MonoBehaviour 필드가 아니라 별도 상태 객체에 있다는 로그/구조를 확인한다.
4. Null reference 없이 상태 초기화가 완료되면 통과다.

### Copilot Prompt

```text
Implement the core GameState model for Raw Works.

Constraints:
- No SerializeField
- Keep gameplay state outside MonoBehaviours
- Hardcode default values in code

Implement:
- GameState and key child state classes
Do not implement RuntimeContext or profile selection yet in this step.
```

---

## 14. 10단계 - `DevConfig`, `BootProfile`, `DevStateFactory`

### 목표

개발용 시작 상태를 코드로 고정할 수 있게 만든다.

### 완료 조건

- `BootProfile` 생성
- `DevConfig` 생성
- `DevStateFactory`에서 프로필별 상태 반환 가능

### 직접 테스트

1. `DevConfig`에서 활성 프로필을 하나 지정하고 Play를 누른다.
2. `Console` 또는 HUD에서 현재 프로필 이름이 정확히 표시되는지 확인한다.
3. 프로필을 `DefaultStart`, `Stage2Unlocked`, `Stage3PrestigeReady`로 바꿔가며 다시 Play 한다.
4. 프로필 변경에 따라 시작 Gold, 해금 산, 진행 상태가 실제로 달라지는지 확인한다.

### Copilot Prompt

```text
Implement prototype boot profiles for Raw Works.

Constraints:
- No SerializeField
- Hardcode all profile values in code

Implement:
- BootProfile enum
- DevConfig static class
- DevStateFactory with at least DefaultStart, Stage2Unlocked, and Stage3PrestigeReady

Update the bootstrap flow so the active profile determines the starting state.

Important:
- do not auto-unlock all visible mountains by default
- keep the sequential mountain unlock rules enabled in prototype profiles unless a profile explicitly overrides them for visual testing
```

---

## 15. 11단계 - `RuntimeContext` 연결

### 목표

정의, 상태, 시스템, 뷰 루트를 묶는 런타임 컨텍스트를 만든다.

### 완료 조건

- `RuntimeContext` 생성
- `GameBootstrap`가 컨텍스트를 보관함

### 직접 테스트

1. Play 후 `RuntimeContext created`와 비슷한 로그가 출력되는지 확인한다.
2. `GameBootstrap`가 컨텍스트를 만들고 보관한다는 흐름이 예외 없이 끝나는지 확인한다.
3. 정의 데이터와 상태 객체 참조가 컨텍스트에 묶였다는 요약 로그가 있으면 함께 확인한다.
4. 이후 단계 코드가 붙기 쉬운 형태로 단일 컨텍스트 진입점이 생겼으면 통과다.

### Copilot Prompt

```text
Implement a RuntimeContext container for Raw Works.

Constraints:
- No SerializeField
- Keep the bootstrap flow explicit and code-driven

Implement a RuntimeContext that can hold definitions, state, and references to runtime systems or roots as they are introduced.

Update GameBootstrap to create and store the RuntimeContext.
```

---

## 16. 12단계 - `SimulationRunner` 기본 뼈대

### 목표

게임 로직의 기본 업데이트 순서를 고정한다.

### 완료 조건

- `SimulationRunner` 생성
- `GameBootstrap.Update()`가 `SimulationRunner.Tick()`만 호출함

### 직접 테스트

1. Play 후 `SimulationRunner.Tick`이 실제 호출되고 있는지 로그 또는 카운터로 확인한다.
2. 로그가 너무 과도하면 틱 카운터를 간헐적으로만 찍도록 했는지 확인한다.
3. `GameBootstrap.Update()`가 다른 로직을 직접 처리하지 않고 러너 호출만 하는 구조인지 코드상으로도 확인한다.
4. 프레임이 진행되는 동안 예외 없이 Tick 루프가 유지되면 통과다.

### Copilot Prompt

```text
Implement the first SimulationRunner skeleton for Raw Works.

Constraints:
- No SerializeField
- Keep systems testable and deterministic

Implement:
- SimulationRunner

Update GameBootstrap so Update only delegates to SimulationRunner.Tick(deltaTime).
```

---

## 17. 13단계 - 명령 큐와 더미 명령

### 목표

입력을 시스템 친화적으로 처리하기 위한 명령 큐를 추가한다.

### 완료 조건

- `CommandQueue` 생성
- `IGameCommand` 생성
- 더미 명령 1~2개 실행 가능

### 직접 테스트

1. Play 후 더미 명령이 큐에 들어가고 실행되었다는 로그를 확인한다.
2. 같은 명령이 직접 상태를 바꾸는 대신 큐를 통해 처리되는지 코드 구조를 확인한다.
3. 더미 명령 1개는 로그만, 다른 1개는 실제 상태값 변경처럼 서로 다른 검증이 가능하면 더 좋다.
4. 명령 실행 후 예외 없이 큐가 비워지면 통과다.

### Copilot Prompt

```text
Add command queue support to the Raw Works prototype.

Constraints:
- No SerializeField
- UI and input should not mutate state directly

Implement:
- CommandQueue
- IGameCommand
- CommandSystem.Execute
- one or two placeholder commands for verification
```

---

## 18. 14단계 - 디버그 HUD 생성

### 목표

Inspector 대신 상태를 바로 볼 수 있는 HUD를 만든다.

### 완료 조건

- 코드로 생성되는 Canvas 기반 HUD 존재
- 현재 Stage, 돈, 주요 자원, 프로필이 화면에 표시됨

### 직접 테스트

1. Play를 누르자마자 `Game` 화면에 디버그 HUD가 바로 나타나는지 확인한다.
2. HUD에 최소한 프로필, Stage, Gold, 주요 자원, 배속 정보가 보이는지 확인한다.
3. 화면 크기를 조금 바꿔도 HUD가 완전히 사라지지 않는지 확인한다.
4. Inspector 수동 배치 없이 코드 생성 UI만으로 동작하면 통과다.

### Copilot Prompt

```text
Implement a runtime-generated debug HUD for Raw Works.

Constraints:
- No Inspector setup
- Create the UI from code
- Press Play must immediately show useful debug state

Implement:
- DebugHudFactory
- a simple Canvas with text labels

Display at minimum:
- active boot profile
- current stage
- money
- key resource counts
- simulation speed
```

---

## 19. 15단계 - 디버그 핫키와 시간 제어

### 목표

핫키로 상태를 빠르게 검증하고 시간을 가속/정지할 수 있게 만든다.

### 완료 조건

- `F1`, `F2`, `F3`, `F4`, `F5`, `F6`, `F7`, `F8`, `Space` 동작
- HUD 토글, 자원 추가, Stage 변경, 레시피 즉시 완성, 프레스티지 미리보기, 런 리셋, 시간 배속, 잠금 디버그, 일시정지 가능

### 직접 테스트

1. Play 후 `F1`을 눌러 HUD가 숨김/표시 토글되는지 확인한다.
2. `F2`를 눌러 테스트 자원 또는 Gold가 즉시 증가하는지 HUD로 확인한다.
3. `F3`를 눌러 Stage가 올라가거나 테스트 진행 상태가 바뀌는지 확인한다.
4. `F4`, `F5`, `F6`, `F7`, `F8`, `Space`를 하나씩 눌러 레시피 즉시 완료, 프레스티지 미리보기 갱신, 런 리셋, 배속 전환, 잠금 디버그, 일시정지가 각각 분리 동작하는지 확인한다.
5. 키 입력 후 Console에 무엇이 실행됐는지 로그가 남으면 디버깅이 쉬우므로 함께 확인한다.

### Copilot Prompt

```text
Implement debug hotkeys and basic time controls for Raw Works.

Constraints:
- No Inspector setup
- Keep the controls code-driven and prototype-focused

Implement:
- F1 to toggle the debug HUD
- F2 to add test resources
- F3 to advance stage
- F4 to instantly complete the selected active recipe
- F5 to refresh prestige preview values
- F6 to reset the current run (prestige-equivalent reset: clear Gold, mountains, upgrades, resources, workerAssignments; keep IP, ipUpgrades, mastery, workers, diamonds, gachaPity, prestigeItems, mountainNames, achievements)
- F7 to cycle simulation speed (x1 → x5 → x20)
- F8 to toggle lock/unlock visual debug overlay on all mountains
- Space to pause or resume
```

---

## 20. 16단계 - 월드 좌표계와 넓은 맵 규칙

### 목표

메인 월드를 한 화면 고정형이 아닌 넓은 탐색형 구조로 먼저 정의한다.

### 완료 조건

- 월드 기준 좌표계가 정해짐
- 화면보다 넓은 맵 범위를 지원함
- 산이 넓게 퍼져 배치될 전제가 코드와 문서에 반영됨

### 직접 테스트

1. Play 후 월드 bounds 또는 좌표 범위 로그를 확인한다.
2. 현재 카메라 중심 근처만이 아니라 화면 밖 좌표도 실제로 데이터에 포함되는지 확인한다.
3. 이후 드래그/줌을 붙였을 때 쓸 수 있도록 좌표계 기준이 월드 단위로 잡혀 있는지 확인한다.
4. 산 배치가 단일 화면용 그리드처럼 좁게 고정되지 않았으면 통과다.

### Copilot Prompt

```text
Define the wide-world map rules for Raw Works.

Constraints:
- The main map must be larger than a single screen view
- Do not assume all mountains fit inside the initial camera frame
- Keep the design ready for drag navigation and zoom

Implement or define:
- world coordinate range rules
- camera bounds or world bounds helpers
- mountain spread rules for a wider prototype map
```

---

## 21. 17단계 - 드래그 카메라 이동

### 목표

마우스 드래그로 넓은 월드를 이동할 수 있게 만든다.

### 완료 조건

- 드래그로 카메라 이동 가능
- 과도한 흔들림 없이 맵 탐색 가능

### 직접 테스트

1. Play 후 마우스 드래그 또는 지정 입력으로 카메라를 움직여 본다.
2. 좌우뿐 아니라 상하 이동도 가능한지 확인한다.
3. 드래그를 멈췄을 때 카메라가 과하게 미끄러지거나 떨리지 않는지 확인한다.
4. 월드 끝 경계가 있다면 카메라가 범위를 벗어나지 않는지도 함께 확인한다.

### Copilot Prompt

```text
Implement drag-based camera navigation for the Raw Works prototype map.

Constraints:
- No Inspector setup
- The map is larger than the screen
- Focus on clean prototype controls

Implement drag or click-and-drag camera movement so the player can inspect a wide mountain field.
```

---

## 22. 18단계 - 확대/축소 카메라

### 목표

휠 또는 지정 입력으로 확대/축소를 지원한다.

### 완료 조건

- 확대/축소 가능
- 최소/최대 줌 제한 존재
- 확대 시 픽셀과 UI 읽힘이 크게 무너지지 않음

### 직접 테스트

1. Play 후 마우스 휠을 올리고 내려 줌 인/아웃이 되는지 확인한다.
2. 최소 줌과 최대 줌에서 더 이상 확대/축소되지 않는지 확인한다.
3. 너무 가까운 줌에서 픽셀이나 UI 가독성이 완전히 망가지지 않는지 확인한다.
4. 드래그 카메라와 함께 써도 입력 충돌 없이 동작하면 통과다.

### Copilot Prompt

```text
Implement zoom controls for the Raw Works prototype camera.

Constraints:
- No Inspector setup
- Keep the map larger than the viewport
- Add sensible min and max zoom levels

Implement mouse-wheel or equivalent zoom control for the prototype camera.
```

---

## 23. 19단계 - 월드맵 산 생성

### 목표

산을 고르는 메인 월드맵을 코드로 생성해서 화면에 기본 선택 구조를 보이게 한다.

### 완료 조건

- 산 노드 여러 개 생성
- 산 위치는 코드 계산으로 배치됨
- 산 노드 위에 정보 텍스트 오버레이가 없음
- 잠금 산 / 다음 해금 가능 산 / 해금 완료 산이 시각적으로 구분됨

### 직접 테스트

1. Play 후 `Game` 화면에서 월드맵이 비어 있지 않고 산 노드가 여러 개 보이는지 확인한다.
2. 드래그와 줌으로 이동했을 때 다른 위치에도 산이 배치되어 있는지 확인한다.
3. 잠금 산, 다음 해금 가능 산, 해금된 산이 색이나 명암으로 구분되는지 확인한다.
4. 메인 월드 산 위에 채굴량, 배송 상태 같은 텍스트가 떠 있지 않은지 확인한다.

### Copilot Prompt

```text
Implement the first runtime-generated world view for Raw Works.

Constraints:
- No prefabs required for the core prototype
- No Inspector references
- All positions calculated in code

Implement:
- WorldFactory
- multiple mountain node views
- world-map background layers or simple map decoration

Mountain presentation rules:
- locked mountains use grayscale or desaturated visuals
- the next unlockable mountain uses grayscale plus a subtle highlight
- mountains that are not yet eligible because of prerequisite order should look darker and more inactive
- unlocked mountains switch to full color immediately

Important:
- place mountains across a wider world map, not inside a single compact screen layout
- some mountains should require drag navigation or zoom adjustment to inspect comfortably
- keep mountain nodes visually clean
- do not show mining stats, labels, or floating text directly above mountains in the main world view
- do not render route lines or travel-path overlays in the main world view
- this screen is for selecting mountains, not visualizing round-trip travel

Use simple placeholder visuals such as colored sprites, primitive shapes, or generated UI/world elements. The goal is readability, not final art.
```

---

## 24. 20단계 - 산 선택과 포커스 이동

### 목표

산을 클릭해서 선택하고, 필요하면 카메라가 선택 대상을 보기 쉽게 이동하게 만든다.

### 완료 조건

- 산 클릭 선택 가능
- 선택 상태가 시각적으로 드러남
- 선택 산 정보가 HUD 또는 패널에 표시됨
- 메인 월드에는 선택 전후 모두 산 위 정보 텍스트를 띄우지 않음

### 직접 테스트

1. 가까운 산을 클릭해 선택 하이라이트가 보이는지 확인한다.
2. 다른 산을 클릭했을 때 선택 대상이 바뀌고 이전 선택 강조가 해제되는지 확인한다.
3. 멀리 있는 산도 카메라 이동 후 클릭 선택이 가능한지 확인한다.
4. 잠금 산을 클릭했을 때는 해금 비용 또는 선행 조건 메시지가 패널/HUD에만 나오고 산 위에는 텍스트가 뜨지 않는지 확인한다.

### Copilot Prompt

```text
Implement mountain selection and optional camera focus behavior for Raw Works.

Constraints:
- No Inspector setup
- Keep the world map wider than the viewport

Implement:
- clicking or selecting mountain nodes
- selected mountain state
- visual highlight for the selected mountain
- optional camera focus or centering helper for selected mountains
- locked mountain interaction messaging
- unlock interaction for mountains that are currently eligible

Important:
- show mountain details in a panel or HUD only
- do not render mountain stats directly above the mountain node
- if a mountain is locked because the previous mountain is not unlocked yet, show a prerequisite message instead of an unlock action
- if a mountain is unlockable, show its Gold cost in the side panel or HUD, not above the node
```

---

## 24-1. 광산 내부 채굴/배송 상태 머신 요약

21단계와 22단계를 구현할 때는 아래 상태 머신을 기준으로 본다.

### 상태 목록

- `Idle`
- `MiningInShaft`
- `LoadingOreCart`
- `LiftToSurface`
- `DeliverToInventory`

### 상태 전이 규칙

```text
Idle
	-> mining starts
MiningInShaft
	-> ore resolved
LoadingOreCart
	-> cart filled
LiftToSurface
	-> delivery ready
DeliverToInventory
	-> inventory updated
Idle
```

### 구현 기준

- 채굴 결과는 광산 내부 작업이 끝난 직후에도 전역 인벤토리에 바로 반영하지 않는다.
- 적재와 승강기/출구 이송이 끝난 뒤 배송 완료 처리에서만 총량을 올린다.
- 메인 월드맵은 산 선택용 화면이므로 배송 상태를 선이나 배송 주기 오브젝트로 보여주지 않는다.
- 메인 월드에서는 산 노드 위에 상태 텍스트를 띄우지 않는다.

---

## 25. 21단계 - 채굴 루프

### 목표

광산 상세 화면 기준으로 채굴과 적재가 진행되도록 구현한다.

### 완료 조건

- 광산 내부 채굴 완료 시 채굴량이 계산됨
- 채굴된 자원은 즉시 전역 인벤토리에 들어가지 않고 적재 상태에 들어감
- 배송 완료 전에는 HUD 자원 총량이 증가하지 않음

### 직접 테스트

1. 광산 상세 화면 또는 디버그 HUD를 켠 상태에서 채굴 시작부터 적재 상태까지 변화를 본다.
2. 채굴 완료 직후 자원이 즉시 공용 인벤토리에 더해지지 않는지 확인한다.
3. `pending cargo`나 적재량 같은 중간 상태가 따로 보이면 그 값이 먼저 증가하는지 확인한다.
4. 배송 완료 전 HUD 총량이 그대로이고, 배송 완료 시점에만 총량이 늘어나면 통과다.

### Copilot Prompt

```text
Implement the mining loop for Raw Works.

Constraints:
- No SerializeField
- Hardcode prototype mining values
- Keep the logic in pure systems where possible

Implement:
- MiningState fields needed for basic mining
- mining resolution inside the selected or active mountain detail flow
- per-mountain loading results
- cargo data that moves into the mine delivery pipeline

Important:
- do not add mined resources directly to the central inventory when mining resolves
- mined resources must first enter a loading or delivery state and only increase totals after delivery completion
```

### 세밀한 수정 프롬프트

#### Fix Prompt A - 산 도착 전에 자원이 증가하는 경우

```text
Fix the previous mining implementation for Raw Works.

Constraints:
- preserve the current architecture
- do not introduce SerializeField
- keep Play working immediately after boot

Issue to fix:
- mined resources are increasing in the central inventory before the delivery cycle completes

Expected result:
- mining must resolve inside the mountain workflow, not directly into the global totals
- mined resources must be stored as pending cargo first
- central inventory totals must increase only during the final delivery step
```

#### Fix Prompt B - 채굴이 틱 누적으로만 처리되는 경우

```text
Refine the mining loop implementation for Raw Works.

Constraints:
- keep the mining and delivery state machine explicit
- do not introduce Inspector dependencies
- keep the code testable

Issue to fix:
- mining is being treated as a passive timer instead of an arrival-based loading event

Expected result:
- mining must happen inside the mountain workflow
- loading must produce cargo data tied to the active mountain cycle
- the mining system should integrate cleanly with delivery state changes
```

#### Fix Prompt C - HUD가 너무 빨리 증가하는 경우

```text
Fix the mining and HUD integration for Raw Works.

Constraints:
- preserve the current system split
- do not add mined resources directly on mountain arrival

Issue to fix:
- resource totals in the HUD update immediately when mining occurs at the mountain

Expected result:
- HUD totals must reflect central inventory only
- pending cargo should be tracked separately until the delivery step completes
```

---

## 26. 22단계 - 광산 내부 배송 루프

### 목표

광산 내부 적재, 승강기/출구 이송, 전역 인벤토리 반영까지 포함한 배송 루프를 넣는다.

### 완료 조건

- 산마다 배송 주기 계산됨
- 광산 상세 화면에서 배송 상태 표시가 있음
- 채굴 후 적재와 배송 단계가 분리됨
- 배송 완료 시에만 자원이 공용 인벤토리로 들어감

### 직접 테스트

1. Play 후 한 산을 선택하고 배송 상태가 `적재 -> 승강기/이송 -> 배송 완료`처럼 나뉘어 보이는지 확인한다.
2. 채굴 직후 바로 자원이 증가하지 않고, 배송 완료 타이밍에만 공용 인벤토리가 증가하는지 확인한다.
3. 두 산 이상을 비교해 배송 주기나 완료 속도 차이가 실제로 존재하는지 확인한다.
4. Console 또는 HUD에서 적재 이벤트와 배송 완료 이벤트가 별개 로그로 남는지 확인한다.

### Copilot Prompt

```text
Implement mine-internal delivery cycle logic for Raw Works.

Constraints:
- No Inspector setup
- Hardcoded delivery values for prototype testing
- Keep formulas outside view code

Implement:
- DeliverySystem.Tick or equivalent
- per-mountain delivery timers
- loading after mining resolution
- lift or surface transfer timing
- delivery to central inventory only on delivery completion
- a simple delivery state visualization inside the mine detail view or debug UI

Use different delivery durations for different mountains so the behavior is easy to verify in Play mode.
```

### 세밀한 수정 프롬프트

#### Fix Prompt A - 배송 단계가 분리되지 않은 경우

```text
Fix the transport implementation for Raw Works.

Constraints:
- preserve the current architecture
- do not introduce SerializeField
- keep Play working immediately after boot

Issue to fix:
- delivery is only visual and does not follow a real loading, lift, deliver cycle

Expected result:
- implement explicit delivery states for loading, transfer, and delivery completion
- resource delivery must happen only after the final delivery step
```

#### Fix Prompt B - 적재와 배송 완료 이벤트가 분리되지 않은 경우

```text
Refine the transport state transitions for Raw Works.

Constraints:
- keep the system deterministic and easy to test
- do not collapse loading and delivery completion into one event

Issue to fix:
- loading and delivery completion are not separated clearly in the delivery flow

Expected result:
- mining completion must trigger loading logic
- delivery completion must trigger inventory update logic
- each transition should be observable in logs or debug state
```

#### Fix Prompt C - 배송 상태가 실제 적재 정보를 가지지 않는 경우

```text
Fix cargo handling in the Raw Works delivery loop.

Constraints:
- keep the delivery logic code-driven
- do not use Inspector configuration

Issue to fix:
- the delivery pipeline advances but does not carry explicit cargo data

Expected result:
- each active mountain delivery state should track cargo resource id and cargo amount
- final delivery should consume that cargo data and then clear it
```

#### Fix Prompt D - 메인 월드에 산 정보가 다시 올라가는 경우

```text
Fix the main world presentation for Raw Works.

Constraints:
- preserve the wide draggable and zoomable world
- keep mountain nodes visually clean

Issue to fix:
- mining or transport information is being rendered directly above mountain nodes in the main world view

Expected result:
- mountain nodes should show only the mountain visual and selection highlight
- mining, cargo, and trip details must appear only in the selected panel or debug HUD
```

---

## 27. 23단계 - 중앙 인벤토리와 자원 흐름

### 목표

산 채굴, 운송, 제작, 판매가 하나의 중앙 인벤토리 흐름으로 연결되게 만든다.

### 완료 조건

- 공용 인벤토리에 자원 누적
- 원재료/부품/제품 판매 시 Gold 증가
- Gold를 사용해 현재 해금 가능한 산을 여는 흐름이 연결됨
- 채굴/운송/생산이 같은 자원 풀을 사용
- 채굴 결과가 산에서 바로 들어가지 않고 배송 완료 후 반영됨

### 직접 테스트

1. 특정 산에서 배송 완료된 자원이 공용 인벤토리에 들어오는지 먼저 확인한다.
2. 그 자원을 재료로 쓰는 생산을 시작해 인벤토리 수량이 실제로 감소하는지 확인한다.
3. 원재료/부품/제품을 각각 판매해 Gold가 늘어나는지 확인한다.
4. 증가한 Gold를 사용해 다음 해금 가능 산을 열 수 있으면 자원 흐름이 한 경제 루프로 연결된 것이다.

### Copilot Prompt

```text
Connect mining, delivery, and production into a shared central inventory flow for Raw Works.

Constraints:
- No Inspector setup
- Keep the economy state explicit and easy to debug

Implement a central inventory and Gold economy model so delivered resources are stored in one shared runtime economy, can be sold for Gold, and can later be consumed by production.

Important:
- support selling raw materials, parts, and finished products
- use hardcoded prototype sell prices based on the GDD balance direction
- unlocking the next eligible mountain must spend Gold from this shared economy
- keep sell and unlock events visible in logs or the debug HUD
```

---

## 28. 24단계 - 생산 시스템 코어

### 목표

자원 소비 후 결과물을 만드는 생산 큐를 구현한다.

### 완료 조건

- 생산 패널 또는 최소 버튼 UI 존재
- 레시피 시작 가능
- 재료 소비 후 타이머 진행
- 완료 시 결과물 지급

### 직접 테스트

1. 공용 인벤토리에 필요한 재료가 있는 상태에서 기본 레시피를 하나 시작해 본다.
2. 시작 직후 재료가 먼저 차감되는지 확인한다.
3. 타이머 진행 후 완료 시점에 결과물이 인벤토리에 추가되는지 확인한다.
4. 같은 레시피를 재료 부족 상태에서 다시 눌렀을 때 시작되지 않고 이유를 알 수 있는 로그 또는 UI 반응이 있는지 확인한다.

### Copilot Prompt

```text
Implement the production queue system for Raw Works.

Constraints:
- No SerializeField
- Runtime-generated UI only
- Hardcoded recipe values from the static database

Implement:
- ProductionState
- ProductionSystem.Tick
- StartRecipeCommand
- recipe progress timers
- input consumption and output rewards
- a minimal production panel created from code

Only support the stage 1 to 3 prototype recipes for now.
```

---

## 29. 25단계 - 생산 패널 UI

### 목표

생산 가능한 레시피 목록과 제작 버튼을 분리된 패널로 보여준다.

### 완료 조건

- 생산 패널이 코드로 생성됨
- 레시피 목록과 상태가 보임
- 선택 레시피 제작 시작 가능

### 직접 테스트

1. Play 후 생산 패널을 열고 레시피 목록이 보이는지 확인한다.
2. 레시피 하나를 클릭했을 때 요구 재료, 진행 상태, 시작 버튼이 함께 보이는지 확인한다.
3. 시작 버튼을 눌렀을 때 실제 명령 큐를 통해 생산이 시작되는지 확인한다.
4. 진행 중 레시피와 대기 상태 레시피가 구분되어 보이면 통과다.

### Copilot Prompt

```text
Implement a runtime-generated production panel UI for Raw Works.

Constraints:
- No Inspector wiring
- All UI must be created from code

Implement a simple production panel that lists available prototype recipes, shows basic requirements, and allows starting production through commands.
```

---

## 30. 26단계 - 단계 진행 시스템

### 목표

제작과 해금 조건에 따라 Stage가 올라가는 시스템을 넣는다.

### 완료 조건

- 현재 Stage가 상태에 기록됨
- 조건 충족 시 Stage 2, Stage 3 진입 가능
- 새 산 또는 새 레시피가 해금됨

### 직접 테스트

1. `DefaultStart` 또는 유사한 기본 프로필로 시작해 mountain #2를 해금하고 기본 생산을 시작한다.
2. 조건 충족 직후 Stage가 2로 올라가고 HUD/로그에 즉시 반영되는지 확인한다.
3. 이어서 Stage 3 조건도 맞춰 보고 새 산 또는 새 레시피가 열리는지 확인한다.
4. Stage가 올라가도 실제 산 사용은 순차 Gold 해금 규칙을 계속 따른다는 점도 함께 확인한다.

### Copilot Prompt

```text
Implement stage progression for the Raw Works prototype.

Constraints:
- No Inspector setup
- Keep progression rules in pure logic
- Use the existing static definitions and game state

Implement:
- ProgressionSystem.Evaluate
- stage unlock checks for prototype stages 1 to 3
- unlocking of mountains and recipes based on current stage
- debug-visible feedback when stage changes

Prototype rule alignment:
- stage 1 to 2 should require mountain #2 unlock plus basic production startup
- stage progression should reveal additional mountains, but actual usage still requires sequential Gold unlocks
```

---

## 31. 27단계 - 프레스티지 미리보기

### 목표

현재 상태에서 프레스티지 보상을 계산해 보여준다.

### 완료 조건

- 예상 IP 또는 보상 계산됨
- HUD 또는 패널에 표시됨
- 티어1 기준 보상이 대체로 1 IP, 잘 풀리면 2 IP 정도로 보임

### 직접 테스트

1. 일반 진행 상태에서 `F5` 또는 프레스티지 미리보기 버튼을 눌러 예상 IP가 계산되는지 확인한다.
2. Gold, 해금 산, 진행 상태를 바꾼 뒤 다시 계산했을 때 예상값이 달라지는지 확인한다.
3. 보통 상태에서는 1 IP 근처, 강한 상태에서는 2 IP까지 나오는지 대략 확인한다.
4. 계산 결과가 HUD 또는 패널에 눈에 띄게 표시되면 통과다.

### Copilot Prompt

```text
Implement prestige preview calculation for the Raw Works prototype.

Constraints:
- No SerializeField
- Keep prestige logic state-driven and easy to debug

Implement:
- PrestigeSystem.RefreshPreview
- debug-visible prestige preview output

Only support the first prestige layer needed by the stage 1 to 3 prototype.

Balance rules:
- target a tier 1 preview of 1 IP in most normal cases
- allow 2 IP only for stronger prototype states
- keep the preview consistent with a first-prestige pacing target around 75 to 90 minutes from DefaultStart
```

---

## 32. 28단계 - 프레스티지 리셋 실행

### 목표

첫 프레스티지 직전 루프를 검증할 수 있도록 프레스티지 미리보기와 리셋 구조를 만든다.

### 완료 조건

- 현재 상태에서 예상 IP 또는 보상이 계산됨
- 프레스티지 실행 시 런 상태 초기화됨
- 영구 유지 대상은 유지됨
- 산 해금, Gold, 일반 자원은 초기화되고 영구 IP 계열만 유지됨

### 직접 테스트

1. `Stage3PrestigeReady` 같은 준비된 프로필로 시작하거나 디버그 키로 조건을 맞춘다.
2. 프레스티지 실행 전 현재 Gold, 해금 산, 일반 자원, IP, 작업자 수를 눈으로 적어 둔다.
3. 프레스티지를 실행한 뒤 Gold, 일반 자원, 해금 산, 진행 중 생산이 초기화되는지 확인한다.
4. industryPoints, ipUpgrades, mastery, workers, diamonds, gachaPity, prestigeItems, mountainNames, 업적/튜토리얼은 유지되는지 확인한다.
5. workerAssignments는 산 해금 리셋에 따라 비워지는지도 함께 확인한다.

### Copilot Prompt

```text
Implement prestige preview and prototype prestige reset for Raw Works.

Constraints:
- No SerializeField
- Keep prestige logic mostly pure and state-driven
- Prototype scope only

Implement:
- TriggerPrestigeCommand
- prototype reset rules
- preservation of permanent data where appropriate

Only support the first prestige layer needed for the stage 1 to 3 prototype.

Important reset rules:
- reset Gold
- reset unlocked mountains and mountain-specific upgrades
- reset normal resources and active production
- reset workerAssignments (산 해금이 리셋되므로 배치 무효)
- keep industry points and permanent prestige upgrades
- keep generated mountain names
- keep mastery, workers, diamonds, gachaPity
- keep prestigeItems, prestigeTier
- keep achievements and tutorial progress
```

---

## 33. 29단계 - 하단 탭과 패널 쉘

### 목표

최소 HUD 수준을 넘어서 자원, 제작, 프로젝트, 관리자, 부스트, 모션 패널 골격을 만든다.

### 완료 조건

- 하단 메인 탭 6개 생성
- 탭 전환 가능
- 각 패널은 최소 텍스트/리스트 정도라도 표시됨

### 직접 테스트

1. Play 후 하단 탭 6개가 모두 보이는지 확인한다.
2. 각 탭을 눌렀을 때 해당 패널만 열리고 이전 패널은 닫히는지 확인한다.
3. 자원 패널을 열어 둔 상태에서 값이 변하고, 생산 패널에서는 큐 상태가 따로 갱신되는지 확인한다.
4. 탭 전환 중 Null reference나 끊김 없이 패널 구조만 바뀌면 통과다.

### Copilot Prompt

```text
Expand the runtime UI of Raw Works into a panel-based prototype shell.

Constraints:
- No Inspector wiring
- All UI created from code
- Keep presentation separated from state and systems

Implement:
- bottom navigation with 6 tabs
- resource panel
- production panel
- project panel
- manager placeholder panel
- boost placeholder panel
- motion placeholder panel

Use simple, readable placeholder visuals. Focus on structure and state refresh, not final art.
```

---

## 34. 30단계 - EditMode 테스트

### 목표

핵심 계산을 Unity 없이 검증할 수 있도록 테스트를 붙인다.

### 완료 조건

- 채굴, 운송, 생산, 단계 진행, 프레스티지 테스트 존재
- 테스트가 하드코딩된 상태로 안정적으로 돌아감

### 직접 테스트

1. `Window > General > Test Runner`를 연다.
2. `EditMode` 탭을 선택하고 전체 테스트를 실행한다.
3. 채굴, 배송, 생산, 단계 진행, 프레스티지 테스트가 각각 생성됐는지 확인한다.
4. 실패한 테스트가 있으면 메시지로 어느 계산이 틀렸는지 바로 읽을 수 있는지도 확인한다.

### Copilot Prompt

```text
Add EditMode tests for the Raw Works prototype core systems.

Constraints:
- Test pure logic only where possible
- Use hardcoded test definitions and test game states

Add tests for:
- mining throughput calculations
- mine delivery cycle timing
- production input consumption and output creation
- stage unlock logic
- prestige preview calculation

Keep tests readable and deterministic.
```

---

## 35. 31단계 - PlayMode 테스트

### 목표

런타임 연결 상태를 PlayMode에서 검증한다.

### 완료 조건

- 부트스트랩 자동 생성 테스트 존재
- HUD 표시 테스트 존재
- 일정 시간 후 자원 증가 테스트 존재

### 직접 테스트

1. `Test Runner`에서 `PlayMode` 탭을 선택한다.
2. 자동 부트스트랩, HUD 생성, 월드 생성, 상태 변화 테스트가 보이는지 확인한다.
3. 전체 실행 시 과도하게 오래 걸리지 않고 짧은 시간 안에 끝나는지 확인한다.
4. 실패 시 씬 진입, 오브젝트 생성, 통합 흐름 중 어디가 끊겼는지 메시지로 파악 가능한지 확인한다.

### Copilot Prompt

```text
Add PlayMode integration tests for the Raw Works prototype.

Constraints:
- Focus on runtime integration
- Keep tests short and robust

Add PlayMode tests for:
- automatic GameBootstrap creation
- debug HUD creation
- world creation
- visible state changes after a short runtime
- a debug command changing runtime state
```

---

## 36. 32단계 - 아트 샌드박스와 파랄랙스

### 목표

최종 비주얼을 바로 넣기 전에, 카메라와 레이어와 파랄랙스를 검증할 수 있는 아트 샌드박스를 만든다.

### 완료 조건

- Pixel Perfect 기준 확인 가능
- 배경 레이어가 분리됨
- 공장 허브 패널/산 플레이스홀더가 더 보기 좋게 정리됨
- 확대/축소 테스트 가능

### 직접 테스트

1. Play 후 아트 샌드박스 화면에서 카메라 줌 인/아웃을 반복한다.
2. 배경이 원경/중경/전경으로 나뉘어 서로 다른 깊이감으로 움직이는지 확인한다.
3. 산 노드와 공장 허브 패널 플레이스홀더가 이전보다 읽기 쉬워졌는지 확인한다.
4. 픽셀이 과도하게 흔들리거나 파랄랙스가 방향을 거꾸로 타지 않으면 통과다.

### Copilot Prompt

```text
Create an art sandbox layer for Raw Works to validate premium pixel-art presentation.

Constraints:
- Do not copy Sea of Stars assets or exact palette
- No Inspector references for the core setup
- Keep it compatible with the existing runtime bootstrap structure

Implement:
- Pixel Perfect Camera friendly setup
- parallax-ready background layers
- improved placeholder views for mountain nodes and factory hub panels
- zoom presets
- simple glow or lighting hook points for later polish

Important:
- the art sandbox must work with a wider draggable and zoomable world, not a single-screen composition

This is a structure task, not a final asset task.
```

---

## 37. 33단계 - 플레이스홀더 비주얼 스타일 정리

### 목표

최종 아트 전 단계에서 플레이스홀더도 일정한 무드와 색 규칙을 가지게 정리한다.

### 완료 조건

- 공장 허브 패널, 산, 배경 플레이스홀더의 톤이 통일됨
- 광물 색 포인트가 자원별로 구분됨

### 직접 테스트

1. 맵 끝까지 드래그하며 산 종류와 잠금 상태가 멀리서도 구분되는지 확인한다.
2. 광물 체인별 포인트 색이 섞여 보이지 않고 역할 구분에 도움이 되는지 확인한다.
3. 공장 허브 패널, 산, 배경의 톤이 서로 따로 놀지 않는지 확인한다.
4. 아직 최종 아트가 아니어도 전체 무드가 한 프로젝트처럼 보이면 통과다.

### Copilot Prompt

```text
Refine the placeholder visual style of the Raw Works prototype.

Constraints:
- Do not implement final art yet
- Keep the wide draggable and zoomable world readable

Improve:
- placeholder color consistency
- mountain differentiation
- base readability
- simple visual hierarchy across the world map
```

---

## 38. 34단계 - 최종 아트 교체 준비 구조 정리

### 목표

나중에 실제 아트를 갈아끼우기 쉽게 뷰 레이어를 정리한다.

### 완료 조건

- 월드 뷰와 데이터 상태 분리 유지
- 플레이스홀더 교체 포인트가 명확함
- 색상/스타일 상수 관리 위치가 정리됨

### 직접 테스트

1. 플레이스홀더 색상 상수나 스프라이트 참조 지점을 한 군데에서 찾을 수 있는지 확인한다.
2. 산 뷰나 UI 뷰 클래스를 바꾸더라도 코어 상태/시뮬레이션 코드를 수정할 필요가 없는지 확인한다.
3. 테스트용으로 플레이스홀더 하나를 다른 색이나 다른 스프라이트로 바꿔 봐서 영향 범위가 뷰 레이어에만 머무는지 확인한다.
4. 아트 교체 포인트가 명확히 분리되어 있으면 이후 실제 리소스 교체가 쉬운 구조다.

### Copilot Prompt

```text
Refactor the Raw Works prototype presentation layer so it is ready for final art replacement later.

Constraints:
- Keep logic and presentation separated
- No SerializeField-driven dependency wiring
- Preserve the current play-immediately workflow

Refine:
- world view classes
- UI view classes
- theme or style constants
- placeholder asset replacement points

Do not change core gameplay behavior unless needed for clean separation.
```

---

## 39. 단계 사이에서 쓰는 수정 프롬프트 규칙

한 단계가 실패했을 때는 다음 방식으로 짧게 수정 프롬프트를 던지는 것이 좋다.

예시 패턴:

```text
Fix the previous implementation with these constraints:

- preserve the current architecture
- do not introduce SerializeField
- keep Play working immediately after boot

Issue to fix:
- [여기에 한 줄로 문제를 적기]

Expected result:
- [여기에 수정 후 기대 결과를 적기]
```

예:

```text
Fix the previous implementation with these constraints:

- preserve the current architecture
- do not introduce SerializeField
- keep Play working immediately after boot

Issue to fix:
- resource values are not updating in the debug HUD after mining ticks

Expected result:
- mining changes must appear in the runtime HUD within 2 seconds after pressing Play
```

---

## 40. 실제 추천 진행 순서

처음부터 34단계까지 전부 한 번에 하려 하지 않는 것이 중요하다.

가장 안전한 흐름은 아래다.

1. 1단계부터 5단계까지 완료
2. 부트와 진단 로그 검증
3. 6단계부터 15단계까지 완료
4. 데이터, 상태, HUD, 시간 제어 검증
5. 16단계부터 20단계까지 완료
6. 넓은 메인 월드, 드래그, 확대/축소, 산 선택 검증
7. 21단계부터 28단계까지 완료
8. 채굴, 운송, 생산, 단계 진행, 프레스티지 검증
9. 29단계부터 31단계까지 완료
10. 패널형 UI와 테스트 체계 검증
11. 32단계부터 34단계까지 완료
12. 아트 샌드박스, 플레이스홀더 정리, 최종 아트 교체 준비

---

## 41. 최종 정리

질문에 대한 답은 명확하다. 코파일럿 프롬프트는 3개로 끝내는 것이 아니라, 실제 개발 단계에서는 반드시 잘게 쪼개서 지시하는 편이 맞다.

특히 이 프로젝트처럼 아래 조건이 있는 경우 더 그렇다.

- Unity 초반 구조를 잘못 잡으면 되돌리기 비용이 큼
- Inspector를 쓰지 않으므로 디버그와 부트 구조가 중요함
- Play 즉시 결과가 보여야 하므로 매 단계의 검증 포인트가 분명해야 함
- 메인 맵이 한 화면에 다 안 들어오는 넓은 구조이므로 카메라와 월드 탐색을 초반부터 별도 단계로 다뤄야 함

이 문서는 그 목적에 맞게 초기 세팅부터 마지막 폴리싱 준비 단계까지 코파일럿 지시 단계를 쪼개 놓은 실행용 문서다.