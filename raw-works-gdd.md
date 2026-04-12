# Raw Works — Game Design Document

> 맨손 개척자로 시작해 산업제국을 건설하는 실생활 소재 방치형 모바일 게임  
> React Native + Expo + TypeScript | 픽셀 아트 | 1인 개발 MVP

---

## 1. 게임 개요

| 항목 | 내용 |
|------|------|
| 게임명 | Raw Works |
| 장르 | 방치형 인크리멘탈 / 생산 시뮬레이션 |
| 플랫폼 | React Native + Expo (iOS / Android) |
| 그래픽 | 픽셀 아트 (16×16 ~ 32×32 스프라이트) |
| 수익 모델 | 광고 제거 IAP + 선택형 광고 보상 + 💎다이아 가챠 |
| MVP 목표 | 1인 개발 / 3~4개월 |

### 한 줄 컨셉

> 원목 하나, 철광석 하나. 맨손에서 시작해 미래도시를 건설하라.

### Idle Planet Miner 참고 요소

| IPM 요소 | Raw Works 적용 |
|----------|---------------|
| 광석 채굴 → 제련 → 합금 → 아이템 | 원자재 채취 → 1차 가공 → 2차 가공 → 부품 → 완성품 |
| 행성별 광석 해금 (심층 채굴) | 단계별 광맥 해금 (5단계 → 8단계 확장) |
| 제련기(Smelter) 슬롯 시스템 | 가공 슬롯 시스템 (동시 생산) |
| Sell → 코인 → 업그레이드 구매 | 완성품 자체가 업그레이드 재료 |
| Galaxy 이동 (프레스티지) | 기업 매각 (프레스티지) |
| 다중 합금 조합 (Bronze = Cu + Sn) | 크로스 체인 조합 |
| 매니저 시스템 | 작업자(Worker) 시스템 — 등급별 랜덤 능력치 |
| 행성 프로젝트 | 산업 프로젝트 (대형 완성품) |
| Rover 업그레이드 (채굴량·속도) | 작업자 가챠 뽑기 (💎 다이아) |
| 생산 반복 → 단순 수량 증가 | 생산 반복 → 숙련도 레벨업 (시간 감소, 산출량 증가, 자동화) |
| 난이도 고정 (행성별 고정 수치) | 난이도 스케일링 (프레스티지횟수·단계에 따른 비용 증가) |

### Planet Miner와 차별화

| 항목 | Planet Miner | Raw Works |
|------|-------------|-----------|
| 업그레이드 재화 | 코인(돈) | 만든 완성품 자체 |
| 체인 구조 | 단일 선형 | 10개 체인 → 크로스 조합 |
| 프레스티지 | 행성 이주 | 기업 매각 (공장 → 더 큰 부지) |
| 세계관 | 우주 | 실생활 산업 공정 |
| 교육성 | 없음 | 실제 화학/제조 공정 기반 |
| 자원 다양성 | 광석 + 합금 위주 | 광석 + 원유 + 희토류 + 우라늄 + 리튬 등 |
| 후반 콘텐츠 | 갤럭시 반복 | 첨단 산업 체인 (반도체, 원자력, 전기차) |
| 채굴 강화 | 업그레이드로 수치 증가 | 작업자 가챠 — 등급별 랜덤 능력 조합 |
| 매니저 | 구매로 고정 효과 | 작업자 배치 + 등급(N/R/U/L) + 확률형 능력치 |
| 성장 방식 | 업그레이드 구매만 | 생산 숙련도 (만들수록 능력치↑) + 업그레이드 + 작업자 |
| 난이도 | 선형 고정 | 프레스티지 반복에 따른 동적 스케일링 |

---

## 2. 핵심 게임플레이 루프

```
채취 → 1차 가공 → 2차 가공 → 크로스 조합 → 완성품 → 설비 업그레이드 → 채취 속도 ↑
         ↗ 작업자 배치 (생산량·속도·능력)          ↘ 중급 크로스 → 최종 크로스 → 프레스티지
    ↗ 숙련도 ↑ (반복 생산 → 시간↓ 산출↑ 자동화)     ↘ 프레스티지 → 💎다이아 → 가챠 뽑기 → 작업자 획득
                                                ↘ 난이도 스케일링 (비용↑) ← 능력치 강해질수록
```

> IPM처럼 "더 깊은 행성을 캘수록 더 좋은 광석 → 더 비싼 합금" 구조.  
> Raw Works에서는 "더 많은 체인 해금 → 크로스 조합 가능 → 더 강한 업그레이드" 흐름.

완성품이 곧 업그레이드 재료. "내가 만든 착암기로 더 빨리 캔다" — 생산과 성장이 하나의 루프로 연결됨.

---

## 3. 생산 체인

### 색상 범례
- `[원자재]` — 직접 채취 (10종: 원목, 철광석, 원유, 구리광석, 보크사이트, 석영, 리튬광석, 금광석, 희토류광석, 우라늄광석)
- `[1차]` — 1차 가공품
- `[2차]` — 2차 가공품
- `[부품]` — 부품 조합
- `[완성품]` — 최종 완성품
- `[크로스]` — 크로스 체인 조합품

### 원자재 총괄표

| 원자재 | 체인 | 해금 단계 | 최종 완성품 | IPM 대응 |
|--------|------|----------|------------|----------|
| 원목 | 목재 | 1 | 책상 | Copper (기본) |
| 철광석 | 철광 | 1 | 공장 설비 | Iron (기본) |
| 원유 | 석유 | 2 | 케이스/용기 | Lead |
| 보크사이트 | 알루미늄 | 2 | 항공 부품 | Aluminum |
| 구리광석 | 구리 | 2 | 전기 장치 | Silver |
| 석영 | 실리콘 | 4 | 마이크로프로세서 | Silica |
| 리튬광석 | 리튬 | 4 | 에너지 저장장치 | Titanium |
| 금광석 | 금 | 4 | 정밀 전자장치 | Gold |
| 희토류광석 | 희토류 | 5 | 고효율 모터 | Platinum |
| 우라늄광석 | 우라늄 | 6 | 원자력 모듈 | Iridium (최고 티어) |

---

### 🪵 목재 체인

```
[원목] → [목재] → [합판] + [목재] → [가구 부품] → [책상]
```

### ⛏️ 철광 체인

```
[철광석] → [선철] → [강철판] + [선철] → [철골 프레임] → [공장 설비]
```

### 🛢️ 석유 체인

```
[원유] → [나프타] → [폴리머] + [나프타] → [플라스틱 소재] → [케이스 / 용기]
```

### 🪨 구리 체인

```
[구리광석] → [동괴] → [구리선] + [동괴] → [전선 다발] → [전기 장치]
```

---

### 🔩 알루미늄 체인 (2단계 해금)

```
[보크사이트] → [알루미나] → [알루미늄 판재] + [알루미나] → [경량 프레임] → [항공 부품]
```

> IPM의 합금(Bronze, Steel) 계층 구조를 참고. 알루미늄은 경량화 계열 후반 핵심 소재.

### 💎 실리콘 체인 (4단계 해금)

```
[석영] → [실리콘] → [웨이퍼] + [실리콘] → [반도체 칩] → [마이크로프로세서]
```

> 실제 반도체 공정 반영: 석영 → 고순도 실리콘 → 웨이퍼 절단 → 칩 패키징.

### 🔋 리튬 체인 (4단계 해금)

```
[리튬광석] → [리튬화합물] → [리튬이온셀] + [리튬화합물] → [배터리 팩] → [에너지 저장장치]
```

> IPM의 Battery 아이템 참고. 리튬 → 배터리로 이어지는 현실적 공급망.

### ✨ 금 체인 (4단계 해금)

```
[금광석] → [금괴] → [금선] + [금괴] → [귀금속 커넥터] → [정밀 전자장치]
```

> IPM에서 Gold가 고가치 광석인 것처럼, 소량 생산 + 고가치 완성품 구조.

### 🌍 희토류 체인 (5단계 해금)

```
[희토류광석] → [희토류 산화물] → [네오디뮴 자석] + [희토류 산화물] → [모터 코어] → [고효율 모터]
```

> 현실의 희토류 정련 과정 반영. 네오디뮴 자석은 전기차·풍력발전 핵심 소재.

### ☢️ 우라늄 체인 (6단계 해금)

```
[우라늄광석] → [옐로케이크] → [농축우라늄] + [옐로케이크] → [핵연료봉] → [원자력 모듈]
```

> IPM의 후반 희귀 광석(Iridium, Palladium) 포지션. 최고 티어 에너지 체인.

---

### ⚙️ 크로스 체인 조합 (핵심 후반 콘텐츠)

#### 기본 크로스 (2~4단계)

```
[강철판] + [알루미늄 판재] + [폴리머] → [복합 소재 패널]          ← 2단계 (첫 크로스)

[철골 프레임] + [전선 다발] + [플라스틱 소재] → [스마트 기계]    ← 3단계

[가구 부품] + [철골 프레임] + [전기 장치] → [첨단 작업대]       ← 3단계

[구리선] + [실리콘] + [플라스틱 소재] → [기초 회로보드]          ← 4단계 (실리콘이 4단계 해금)
```

#### 중급 크로스 (5~6단계)

```
[반도체 칩] + [귀금속 커넥터] + [기초 회로보드] → [고급 회로보드]

[배터리 팩] + [고효율 모터] + [경량 프레임] → [전기차 유닛]

[핵연료봉] + [강철판] + [복합 소재 패널] → [원자로 모듈]

[네오디뮴 자석] + [구리선] + [철골 프레임] → [발전기 코어]

[마이크로프로세서] + [전선 다발] + [플라스틱 소재] → [IoT 디바이스]
```

#### 최종 크로스 (7~8단계)

```
[고급 회로보드] + [에너지 저장장치] + [마이크로프로세서] → [AI 컴퓨팅 유닛]

[전기차 유닛] + [AI 컴퓨팅 유닛] + [IoT 디바이스] → [스마트 시티 모듈]

[원자로 모듈] + [발전기 코어] + [에너지 저장장치] → [무한 에너지 코어]

[스마트 시티 모듈] + [무한 에너지 코어] + [산업단지] → ★★★ 미래도시 완성 (3차 최종 프레스티지)
```

#### 프레스티지 아이템 (3티어 × 반복 가능)

> IPM의 Galaxy 반복처럼, **같은 티어를 여러 번 프레스티지**하며 산업 포인트(IP)를 모아  
> 영구 업그레이드를 구매하고, 충분히 강해진 후 다음 티어로 진입.

```
★ 티어1: [공장 설비] + [전기 장치] + [케이스] → 소규모 공장 (3단계~)
★★ 티어2: [스마트 기계] + [첨단 작업대] + [소규모 공장] → 산업단지 (5단계~)
★★★ 티어3: [스마트 시티 모듈] + [무한 에너지 코어] + [산업단지] → 미래도시 (8단계~)
```

> **프레스티지 핵심 규칙:**
>
> | 항목 | 내용 |
> |------|------|
> | 반복 가능 | 같은 티어를 원하는 만큼 반복 프레스티지 가능 |
> | 산업 포인트(IP) | 프레스티지 시 획득하는 **영구 재화** (리셋되지 않음) |
> | IP 획득량 | 티어1: 1~3 IP, 티어2: 5~10 IP, 티어3: 20~50 IP |
> | IP 스케일링 | 리셋 시 도달한 단계가 높을수록 IP 배율 증가 |
> | 리셋 범위 | 자원 + 일반 업그레이드 초기화, IP + IP업그레이드 + 프레스티지 아이템 + 숙련도 + 작업자 + 💎다이아 보존 |
> | 티어 해금 조건 | 티어2: "티어 해금" IP업그레이드 구매 필요 (10 IP), 티어별 1회 |
>
> **IP 획득량 계산 기준 (해결):**  
> - `totalPrestigeCount`: 전체 프레스티지 횟수의 합계 (티어1+티어2+티어3). **난이도 스케일링 공식**에 사용.  
> - `highestStageThisRun`: **해당 런**에서 도달한 최고 단계 (리셋 시 1로 초기화). **IP 획득량 계산**에 사용.  
>   IP 획득 공식: `baseIP(tier) + (highestStageThisRun - tierBaseStage) × 1`  
> - `난이도 라벨` 계산: `totalPrestigeCount` 기준 (0～2: 초급, 3～5: 중급, 6～9: 고급, 10+: 마스터)  
> - IP 획득량과 난이도 라벨은 서로 다른 변수를 기준으로 한다.
>
> **티어 해금 상세:**
> - 티어 해금 IP업그레이드를 구매하면 다음 티어 프레스티지 버튼 활성화
> - 티어 해금 전에도 해당 단계까지 진행 가능 (IP 모으기 가능)
> - 예: 티어2 해금 = 10 IP 지불 → 5단계 도달 시 산업단지 프레스티지 버튼 활성화
>
> **IP 영구 업그레이드 상점 (IPM의 Dark Matter Shop 참고):**
>
> | IP 업그레이드 | 비용 | 효과 | 최대 |
> |--------------|------|------|------|
> | 채굴 속도 강화 | 1 IP | 기본 채취량 +25% (누적) | 10회 |
> | 제련 가속 | 2 IP | 가공 시간 -10% (누적) | 10회 |
> | 시작 자원 | 1 IP | 리셋 시 기본 원자재 100개로 시작 | 5회 |
> | 슬롯 확장 | 3 IP | 생산 슬롯 +1 (영구) | 3회 |
> | 오프라인 강화 | 2 IP | 오프라인 최대 +2시간 (누적) | 5회 |
> | 자동 크로스 | 5 IP | 크로스 조합도 오프라인 진행 | 1회 |
> | 작업자 보관함 | 2 IP | 작업자 보관함 +10명 (누적) | 3회 |
> | 티어 해금 | 10 IP | 다음 티어 프레스티지 해금 | 티어당 1회 |

---

## 4. 업그레이드 구조

완성품을 소모해 설비를 업그레이드. 돈이 아닌 물건으로 성장하는 구조.

| 업그레이드 | 재료 | 효과 |
|-----------|------|------|
| 곡괭이 → 착암기 → 굴착기 → 양자드릴 | 강철판 + 철골 프레임 → 복합 소재 패널 | 채취속도 +50%, 틱당 획득량 ↑ |
| 용광로 → 전기로 → 아크로 → 플라즈마로 | 선철 + 전선 다발 → 원자로 모듈 | 제련시간 -30%, 부산물 획득 |
| 수동 → 컨베이어 → 로봇팔 → AI 라인 | 스마트 기계 + 플라스틱 소재 → AI 컴퓨팅 유닛 | 오프라인 수익 +2시간 |
| 목재 → 철제 → 첨단 작업대 → 나노 작업대 | 가구 부품 + 전기 장치 → 고급 회로보드 | 조합 슬롯 +1 (동시 생산) |
| 소규모 → 공장 → 산업단지 → 미래도시 | 공장 설비 + 복합 소재 패널 → 스마트 시티 모듈 → 미래도시×1 | 채취 지점 +1 (병렬 채굴) |
| 연구소 건설 | 스마트 기계 + 책상 | 실리콘·리튬·금 체인 해금 |
| 연구소 Lv.2 — 첨단 연구소 | 고급 회로보드 + 정밀 전자장치 | 희토류·우라늄·최종 크로스 해금 |
| 에너지 그리드 | 발전기 코어 + 에너지 저장장치 | 전체 생산속도 ×1.5 |

> **생산 슬롯 합산 규칙:**  
> 최종 생산 슬롯 = 기본 슬롯(2) + 작업대 업그레이드 레벨 + IP 업그레이드 `슬롯 확장` 레벨  
> 예: 철제 작업대(Lv.2) + IP 슬롯 확장 2회 = 2 + 2 + 2 = **6 슬롯**  
> 두 시스템은 단순 합산이며 독립적으로 적용된다.

> **시설규모 업그레이드 Lv.4 비용 보충:**  
> Lv.4(미래도시): 미래도시×1 — 최종 프레스티지 아이템으로 최대 채취 지점 해근.

> **프레스티지 아이템 자산 분류 (해결):**  
> 프레스티지 아이템(소규모공장, 산업단지, 미래도시)은 일반 자원과 **별도 보존 자산**으로 취급한다.  
> 프레스티지 리셋 시 일반 자원은 초기화되지만, 프레스티지 아이템 수량은 **영구 보존**된다.  
> 구현 시 `isPrestigeItem: true` 플래그로 구분하고, 리셋 로직에서 제외한다.

### 오프라인 수익

| 항목 | 내용 |
|------|------|
| 최대 누적 시간 | **기본 8시간** — 자동화 업그레이드 레벨에 따라 증가 (아래 표 참고) |
| 오프라인 진행 | 채취, 1차 가공, 컨베이어 조합 |
| 오프라인 미진행 | 크로스 조합 (IP 업그레이드 `자동 크로스` 구매 시 오프라인 진행으로 전환), 연구소 (접속 후 직접 시작) |
| 재접속 시 | 획득 자원 요약 팝업 표시 |

**오프라인 최대 시간 상세:**

| 자동화 업그레이드 레벨 | 오프라인 최대 시간 | IP `오프라인 강화`와의 합산 |
|----------------------|-------------------|---------------------------|
| Lv.0 수동 (기본) | 8시간 | 8 + (IP 레벨 × 2)시간 |
| Lv.1 컨베이어 | 10시간 | 10 + (IP 레벨 × 2)시간 |
| Lv.2 로봇팔 | 12시간 | 12 + (IP 레벨 × 2)시간 |
| Lv.3 AI 라인 | 14시간 | 14 + (IP 레벨 × 2)시간 |

> 일반 업그레이드 `자동화`와 IP 업그레이드 `오프라인 강화`는 **합산** 적용한다.  
> 예: 로봇팔(Lv.2) + IP 오프라인 강화 3회 = 12 + 6 = 최대 18시간.  
> 절대 최대 상한: **24시간** (이 이상은 적용하지 않음).

---

## 5. 작업자(Worker) 시스템

> IPM의 Rover 업그레이드(채굴량·속도 단순 수치 상승)와 차별화.  
> Raw Works는 **각 원자재 광맥마다 작업자를 배치**하고, 작업자의 **등급 + 랜덤 능력 조합**이 생산 효율을 결정.

### 작업자 능력 3종

| 능력 | 아이콘 | 효과 |
|------|--------|------|
| 생산량(Yield) | 📦 | 틱당 채취 수량 ×배율 증가 |
| 채굴속도(Speed) | ⚡ | 자동 채취 틱 간격 감소 (1초 → 0.8초 등) |
| 채굴능력(Power) | 💪 | 채굴 시 부산물(인접 체인 원자재) 소량 추가 획득 확률 |

> **부산물 드랍 대상 규칙 (해결):**  
> 부산물 대상은 **같은 단계에서 해금된 raw resource 풀** 중 랜덤 1종이다.  
> 예: 철광석 채굴 시 → 1단계 해금 풀(원목, 철광석) 중 자신 제외 → 원목 1개 추가 획득 가능  
> 예: 구리광석 채굴 시 → 2단계 해금 풀(원유, 보크사이트, 구리광석) 중 자신 제외 → 원유 또는 보크사이트  
> 확률: `(workerPowerMultiplier - 1) × 100`%  (Power ×1.3 → 30% 확률)

### 등급 시스템

| 등급 | 테두리 | 능력 수 | 배율 범위 | 가챠 확률 |
|------|--------|---------|----------|----------|
| 노말(N) | ⬜ 회색 | 1개 | ×1.1 ~ ×1.3 | 60% |
| 레어(R) | 🟦 파랑 | 1~2개 | ×1.2 ~ ×1.5 | 25% |
| 유니크(U) | 🟪 보라 | 2~3개 | ×1.4 ~ ×1.8 | 12% |
| 전설(L) | 🟨 금색 | 3개 (모두) | ×1.6 ~ ×2.5 | 3% |

> **능력 결정 규칙:**
>
> 1. 등급에 따라 능력 수가 랜덤 결정 (예: 레어 → 1개 또는 2개)
> 2. 생산량·채굴속도·채굴능력 중 해당 수만큼 랜덤 선택
> 3. 각 능력의 배율은 등급 범위 내에서 랜덤 (소수점 1자리)
> 4. 같은 등급이라도 능력 조합과 수치가 다름 → 수집 + 비교 재미

### 작업자 배치

| 항목 | 내용 |
|------|------|
| 배치 슬롯 | 각 원자재 광맥당 1명 (10광맥 = 최대 10명 배치) |
| 교체 | 언제든 배치/해제/교체 가능 (쿨타임 없음) |
| 보관함 | 보유 작업자 전체 리스트 (최대 50명, IP 업그레이드로 확장) |
| 잠금 | 즐겨찾기 잠금으로 실수 분해 방지 |
| 분해 | 불필요한 작업자 분해 → 💎 다이아 소량 환급 (N:1, R:5, U:15, L:50) |

### 💎 다이아몬드 & 가챠 시스템

#### 다이아 획득처

| 획득처 | 수량 | 빈도 |
|--------|------|------|
| 프레스티지 보너스 | 티어1: 10💎, 티어2: 30💎, 티어3: 100💎 | 매 프레스티지 |
| 일일 출석 | 5💎 (7일 연속: 보너스 30💎) | 매일 |
| 업적 달성 | 10~50💎 | 일회성 |
| 광고 시청 | 5💎 | 하루 5회 |
| 단계 첫 클리어 | 20💎 | 단계당 1회 |

#### 가챠 뽑기

| 항목 | 내용 |
|------|------|
| 단일 뽑기 | 50💎 — 작업자 1명 |
| 10연차 뽑기 | 450💎 — 작업자 10명 (레어 이상 1명 보장) |
| 천장(Pity) | 50회 뽑기(5×10연차 = 2250💎) 내 전설 미획득 시 전설 확정 |
| 중복 처리 | 같은 등급 작업자를 재료로 넣어 레벨업 (등급 동일 시 합성 가능) |

#### 작업자 레벨업 (중복 활용)

| 등급 | 중복 필요 수 (Lv.Max) | Lv.Max 보너스 |
|------|----------------------|--------------|
| 노말(N) | 5회 | 능력 배율 +0.1 |
| 레어(R) | 4회 | 능력 배율 +0.15 |
| 유니크(U) | 3회 | 능력 배율 +0.2 |
| 전설(L) | 2회 | 능력 배율 +0.3 |

> **작업자 + 기존 시스템 시너지:**
>
> - 채굴 도구 업그레이드(곡괭이→양자드릴) × 작업자 생산량 배율 = 최종 채취량
> - IP 영구 업그레이드(채굴 속도 강화) × 작업자 채굴속도 배율 = 최종 틱 속도
> - 작업자의 채굴능력(부산물)은 크로스 조합 재료 수급을 가속
> - 프레스티지 리셋 시 **작업자는 보존** (보관함 유지)

---

## 6. 생산 숙련도(Mastery) 시스템

> IPM에서 아이템을 계속 만들수록 전체 생산력이 올라가는 것처럼,  
> Raw Works는 **레시피를 반복 생산할수록 해당 레시피의 숙련도가 올라** 영구 보너스를 획득.  
> 숙련도가 쌓이면 능력치는 좋아지지만, 동시에 **난이도도 스케일링**되어 플레이타임이 자연스럽게 늘어남.

### 숙련도 기본 구조

| 항목 | 내용 |
|------|------|
| 단위 | 레시피별 숙련도 (예: "강철판 숙련 Lv.5") |
| XP 획득 | 레시피 1회 완성 = 1 XP (크로스 레시피 = 2 XP) |
| 레벨업 | Lv.1→2: 5XP, Lv.2→3: 12XP, Lv.3→4: 25XP, Lv.4→5: 50XP...  (공식: 5 × Lv^1.5) |
| 최대 레벨 | 일반 레시피: Lv.20 / 크로스 레시피: Lv.15 / 프레스티지 레시피: Lv.10 |
| 리셋 | 프레스티지 시 **숙련도 보존** (영구 누적) |

### 숙련도 보너스 (레벨당)

| 보너스 | 레벨당 효과 | 최대 효과 (Lv.20) |
|--------|-----------|-------------------|
| 생산 시간 감소 | -3% (누적) | -60% |
| 산출량 증가 | +5% (누적) | +100% (2배) |
| 자동 생산 해금 | Lv.5 도달 시 해당 레시피 자동 반복 생산 | — |
| 크리티컬 생산 | Lv.10 도달 시 10% 확률로 ×2 산출 | — |
| 연쇄 반응 | Lv.15 도달 시 5% 확률로 다음 단계 1개 즉시 생산 | — |

> **숙련도 마일스톤 이벤트:**
>
> | 달성 조건 | 보상 |
> |----------|------|
> | 한 체인 전체 Lv.5 도달 | 해당 체인 원자재 자동 채취 속도 ×1.3 |
> | 한 체인 전체 Lv.10 도달 | 해당 체인 전용 레시피 슬롯 +1 |
> | 크로스 레시피 5종 Lv.5 도달 | 크로스 조합 시간 전체 -20% |
> | 전체 레시피 Lv.5 도달 | 💎 50 + 칭호 "숙련 장인" |
> | 전체 레시피 Lv.10 도달 | 💎 200 + 칭호 "마스터 엔지니어" |

### 숙련도 UI 표시

- 레시피 카드에 숙련 레벨 배지 표시 (예: ⭐5)
- 숙련 게이지바 (현재 XP / 다음 레벨 XP)
- Lv.5 자동생산 해금 시 "🔄 AUTO" 뱃지 점등
- 생산 화면에서 숙련 보너스 적용 전/후 비교 표시

---

## 6-1. 난이도 스케일링

> 숙련도와 업그레이드로 능력치가 강해질수록, **레시피 비용과 필요 수량이 점진적으로 증가**.  
> "강해졌는데 같은 난이도" → 지루함 방지. "강해져도 도전감 유지" → 플레이타임 연장.

### 스케일링 공식

```
최종 비용 = 기본 비용 × (1 + 프레스티지 횟수 × 0.15) × (1 + 해금 단계 × 0.1)
최종 제작시간 = 기본 시간 × (1 + 프레스티지 횟수 × 0.10) / 숙련도 감소율
```

### 스케일링 적용 범위

| 항목 | 스케일링 방식 | 체감 |
|------|-------------|------|
| 레시피 재료 수량 | 프레스티지 횟수 ×15% 증가 | 티어1 3회차: 재료 ×1.45 |
| 레시피 제작 시간 | 프레스티지 횟수 ×10% 증가 (숙련도로 상쇄) | 숙련도로 상쇄 가능 |
| 업그레이드 비용 | 단계당 ×1.5 기하급수적 증가 | 후반부 업그레이드에 더 많은 생산 필요 |
| 크로스 조합 재료 | 단계 + 프레스티지 횟수 복합 스케일링 | 후반 크로스는 대량 생산 필수 |
| 프레스티지 아이템 | 같은 티어 반복 시 재료 ×1.2씩 증가 | 3회차 소규모공장: ×1.44 재료 |

### 스케일링 vs 숙련도 균형

```
초반 (프레스티지 0~2회):
  숙련도 낮음 + 스케일링 낮음 → 기본 난이도. 빠른 진행.

중반 (프레스티지 3~6회):
  숙련도 중간 (Lv.5~10) + 스케일링 중간 → 난이도 ↑ 하지만 숙련 보너스로 상쇄.
  자동생산 해금으로 편의성 ↑, 재료 요구량 ↑로 정체감 없이 도전 유지.

후반 (프레스티지 7회+):
  숙련도 높음 (Lv.15+) + 스케일링 높음 → 최적 작업자 배치 + 크리티컬 생산 + 연쇄 반응으로 돌파.
  플레이어의 전략적 선택(어떤 레시피 먼저 숙련?)이 진행 속도를 좌우.
```

> **핵심 설계 의도:**  
> 숙련도 상승 속도 > 난이도 상승 속도 → 꾸준히 플레이하면 반드시 강해짐  
> 하지만 난이도 스케일링으로 "한 번에 끝" 방지 → 반복 프레스티지 동기 유지

---

## 7. 게임 진행 단계

> IPM의 행성 순서(가까운 행성 → 먼 행성 → 소행성대 → 외행성)처럼,  
> 쉬운 원자재 → 희귀 원자재 순서로 해금. 단계가 늘어나면서 체인 깊이도 증가.
>
> **프레스티지 페이싱 (IPM 참고)**  
> IPM은 첫 Galaxy 이동이 1~2시간 내로 빠르게 도달.  
> Raw Works도 첫 프레스티지를 **3단계 (~1시간)**에 배치해 루프를 빠르게 체험시킴.

### 단계 진행 조건

> **단계 해금 vs 연구소 업그레이드 우선순위 (해결):**  
> 단계 전환 조건이 만족되면 단계가 자동으로 올라가고, 새 원자재를 **해금**한다.  
> 연구소 업그레이드는 단계를 더 밀어올리는 **추가 조건**이지 대체가 아니다.  
> 예: 3→4 전환은 "연구소 건설" 업그레이드가 공 조건이자 해금 조건이다.  
> 5→6 전환은 "첨단 연구소 건설" 업그레이드가 공 조건이자 해금 조건이다.  
> 즉, 3→4를 위해서는 연구소를 지어야 하고, 연구소를 지으면 4단계 진입도 동시에 수행된다.

| 단계 전환 | 해금 조건 |
|----------|----------|
| 1 → 2 | 목재 체인 완성품(책상) 1개 생산 |
| 2 → 3 | 복합 소재 패널(첫 크로스) 1개 생산 |
| 3 → 4 | 연구소 건설 업그레이드 적용 (스마트 기계 + 책상) |
| 4 → 5 | 기초 회로보드 + 첨단 작업대 각 1개 생산 |
| 5 → 6 | 첨단 연구소 건설 업그레이드 적용 (고급 회로보드 + 정밀 전자장치) |
| 6 → 7 | 원자로 모듈 + 발전기 코어 각 1개 생산 |
| 7 → 8 | AI 컴퓨팅 유닛 1개 생산 |

### 프레스티지 로드맵 (반복 가능)

> 각 티어는 **여러 번 반복** 가능. 반복할 때마다 산업 포인트(IP)를 획득하고,  
> IP로 영구 업그레이드를 구매하여 충분히 강해진 후 다음 티어로 진입.

| 티어 | 해금 조건 | 목표 아이템 | 필요 체인 | IP 획득 | 초회 예상시간 |
|------|----------|------------|-----------|---------|--------------|
| ★ 소규모 공장 | 3단계 도달 | 공장설비+전기장치+케이스 | 4체인 | 1~3 | ~1시간 |
| ★★ 산업단지 | 티어해금 IP업그레이드 + 5단계 | 스마트기계+첨단작업대+소규모공장 | 8체인 | 5~10 | ~3시간 |
| ★★★ 미래도시 | 티어해금 IP업그레이드 + 8단계 | 스마트시티+무한에너지코어+산업단지 | 10체인 | 20~50 | ~8시간 |

> **예상 플레이 흐름:**  
> 티어1을 3~5회 반복 (IP 8~12 누적) → IP샵에서 영구 강화 → 티어2 해금  
> 티어2를 2~4회 반복 (IP 18~40 누적) → 추가 강화 → 티어3 해금  
> 티어3 도달 후에도 계속 반복하며 IP 업그레이드 맥스 도전

---

### 1단계 — 맨손 개척
- 원목 + 철광석만 채취 가능
- 기본 도구 제작, 목재 체인 + 철광 체인 시작
- **해금:** 용광로, 톱질 작업대

### 2단계 — 소규모 가공
- 원유 채굴 + 보크사이트 채굴 + 구리광석 채굴 해금
- 나프타 → 폴리머 체인, 알루미늄 체인, 구리 체인 시작
- 첫 크로스 조합 등장 (복합 소재 패널)
- **해금:** 정유 설비, 알루미늄 제련소

### 3단계 — 전기화 + ★ 티어1 프레스티지 (소규모 공장)
- 구리 → 전선 다발 → 전기 장치, 석유 → 케이스, 철광 → 공장설비 체인 완성
- 스마트 기계, 첨단 작업대 크로스 조합 등장
- **소규모 공장 조합** → 첫 프레스티지 가능 (IP 1~3 획득)
- **여러 번 반복하며 IP 누적** → IP 샵에서 영구 강화 구매
- 티어 해금 IP업그레이드 구매 시 티어2 해금
- **해금:** 전기로, 로봇팔, 오프라인 수익 확장

### 4단계 — 첨단 산업
- 석영 채굴 해금, 실리콘 체인 시작
- 리튬 채굴 + 금 채굴 해금
- 기초 회로보드 크로스 조합 (실리콘 해금으로 가능)
- 연구소 건설 (스마트 기계 + 책상)
- **해금:** 리튬이온 생산라인, 귀금속 정련소

### 5단계 — 산업단지 + ★★ 티어2 프레스티지
- 첨단 작업대 크로스 조합
- **산업단지 완성** → 티어2 프레스티지 가능 (IP 5~10 획득)
- **반복하며 IP 누적** → 티어 해금 IP업그레이드 구매 시 티어3 해금
- 희토류 광맥 해금, 네오디뮴 자석 체인 시작
- 고급 회로보드, 전기차 유닛 조합 등장
- **해금:** 첨단 연구소, 희토류 정련 설비

### 6단계 — 원자력 시대
- 우라늄 광맥 해금
- 옐로케이크 → 농축우라늄 → 핵연료봉 체인
- 원자로 모듈, 발전기 코어 크로스 조합
- 에너지 그리드 업그레이드로 전체 생산 가속
- **해금:** 우라늄 농축 시설, 플라즈마로

### 7단계 — AI 산업
- IoT 디바이스, AI 컴퓨팅 유닛 조합
- 반도체 + 배터리 + 희토류 크로스 체인 집중
- **해금:** AI 라인 (완전 자동 생산), 양자드릴

### 8단계 — 미래도시 + ★★★ 티어3 프레스티지 (최종)
- 스마트 시티 모듈 + 무한 에너지 코어 조합
- **미래도시 완성** → 최종 프레스티지 (IP 20~50 획득)
- 최종 도달 후에도 반복 프레스티지로 IP 누적, 모든 IP 업그레이드 맥스 도전

---

## 8. React Native 프로젝트 구조

```
src/
├── engine/
│   ├── GameLoop.ts           ← setInterval 1초 틱
│   ├── ResourceManager.ts    ← 자원 수량 상태 관리
│   ├── ProductionEngine.ts   ← 체인 자동 생산 처리
│   ├── OfflineEngine.ts      ← 오프라인 경과 계산
│   ├── PrestigeEngine.ts     ← 기업 매각 / IP 계산 / 리셋
│   ├── WorkerEngine.ts       ← 작업자 능력치 계산 / 채굴 배율 적용
│   ├── GachaEngine.ts        ← 가챠 뽑기 / 확률 / 천장 처리
│   ├── MasteryEngine.ts      ← 숙련도 XP 계산 / 레벨업 / 보너스 적용
│   └── ScalingEngine.ts      ← 난이도 스케일링 계수 계산
├── data/
│   ├── resources.ts          ← 자원 정의
│   ├── recipes.ts            ← 생산 레시피 정의
│   ├── upgrades.ts           ← 일반 업그레이드 정의
│   ├── ipUpgrades.ts         ← IP 영구 업그레이드 정의
│   ├── workers.ts            ← 작업자 등급/능력 정의 + 가챠 확률표
│   ├── mastery.ts            ← 숙련도 레벨 테이블 / 보너스 정의 / 마일스톤
│   ├── scaling.ts            ← 난이도 스케일링 계수 정의
│   └── stages.ts             ← 진행 단계 / 해금 조건 정의
├── store/
│   ├── gameStore.ts          ← Zustand 전역 상태
│   └── saveStore.ts          ← AsyncStorage 저장/로드
├── screens/
│   ├── MainScreen.tsx        ← 채취 / 현황판
│   ├── ProductionScreen.tsx  ← 생산 체인 UI
│   ├── UpgradeScreen.tsx     ← 업그레이드 목록
│   ├── PrestigeScreen.tsx    ← 프레스티지 + IP 상점
│   ├── FactoryScreen.tsx     ← 공장 현황 / 픽셀 맵
│   └── WorkerScreen.tsx      ← 작업자 보관함 / 배치 / 가챠 뽑기
├── components/
│   ├── ResourceBar.tsx
│   ├── RecipeCard.tsx
│   ├── UpgradeItem.tsx
│   ├── PrestigeButton.tsx    ← 프레스티지 조건 표시 + 실행
│   ├── IpShopItem.tsx        ← IP 상점 아이템 카드
│   ├── WorkerCard.tsx        ← 작업자 카드 (등급 테두리 + 능력치 표시)
│   ├── GachaModal.tsx        ← 가챠 뽑기 연출 (등급별 이펙트)
│   ├── WorkerSlot.tsx        ← 광맥 작업자 드롭 슬롯
│   ├── OfflineModal.tsx      ← 오프라인 수익 팝업
│   └── PixelSprite.tsx       ← 픽셀 아트 렌더러
├── services/
│   ├── AdService.ts          ← AdMob 광고 관리
│   ├── NotificationService.ts← 오프라인 알림
│   └── AnalyticsService.ts   ← 이벤트 트래킹
└── utils/
    ├── bigNumber.ts          ← 큰 숫자 포맷 (1K, 1M...)
    └── timeUtils.ts
```

### 핵심 패키지

| 용도 | 패키지 | 버전 기준 |
|------|--------|----------|
| 상태 관리 | zustand | v5 |
| 저장 | @react-native-async-storage/async-storage | latest |
| 애니메이션 | react-native-reanimated | v3 |
| 네비게이션 | expo-router | v4 |
| 픽셀 스프라이트 | expo-image (PNG 스프라이트) | latest |
| 큰 숫자 | break-infinity.js | latest |
| 경로 alias | babel-plugin-module-resolver | latest |
| 광고 | react-native-google-mobile-ads | Phase 3 |
| 알림 | expo-notifications | Phase 3 |
| 분석 | expo-firebase-analytics | Phase 3 |
| IAP | expo-in-app-purchases | Phase 3 |
| 스플래시 | expo-splash-screen | latest |
| 빌드 | eas-cli | latest |

> Phase 1에서는 상단 7개만 설치. 광고/알림/분석/IAP는 Phase 3에서 추가.

---

## 9. Copilot 프롬프트 세트

### Step 1 — 프로젝트 초기 세팅

```
Create a React Native + Expo SDK 52 + TypeScript (strict: true, noUncheckedIndexedAccess: true) project called "RawWorks".

Project structure:
  src/
    app/          ← expo-router v4 file-based routes
    components/   ← reusable UI components
    data/         ← static game data (resources, recipes, upgrades, etc.)
    engine/       ← pure game logic functions
    hooks/        ← custom React hooks for UI calculations
    services/     ← external IO (ads, notifications, analytics) — Phase 3
    store/        ← zustand state + persistence
    types/        ← shared TypeScript type definitions
    utils/        ← bigNumber formatter, timeUtils, etc.

Path alias: '@/' → 'src/' using tsconfig paths + babel-plugin-module-resolver.

Lint/format: ESLint flat config + Prettier (format on save).

Phase 1 packages only:
  zustand (v5), @react-native-async-storage/async-storage,
  react-native-reanimated (v3), expo-router (v4),
  break-infinity.js, expo-splash-screen, expo-image,
  babel-plugin-module-resolver

(Do NOT install ads/notifications/analytics/IAP yet — Phase 3.)

Create the initial app layout with expo-router file-based routing and a bottom tab navigator with 6 tabs:
  채취(Mine), 생산(Produce), 업그레이드(Upgrade), 공장(Factory), 작업자(Worker), 프레스티지(Prestige)

Theme: dark industrial — background #1a1a2e, monospace font for numbers.
```

---

### Step 2 — 자원 + 레시피 데이터 정의

```
Create TypeScript data files for RawWorks:

1. src/data/resources.ts
Define ResourceTier = 'raw' | 'p1' | 'p2' | 'part' | 'final' | 'cross' | 'prestige'
Define ResourceDefinition type: {
  id: string,            // snake_case: iron_ore, steel_plate, small_factory
  nameKo: string,
  emoji: string,
  tier: ResourceTier,
  chain: string,
  unlockedAtStage: number,
  isRaw: boolean,
  isPrestigeItem?: boolean   // true for small_factory, industrial_complex, future_city
}

Resources (10 chains):

목재 체인:
원목(log), 목재(lumber), 합판(plywood), 가구부품(furniture_part), 책상(desk)

철광 체인:
철광석(iron_ore), 선철(pig_iron), 강철판(steel_plate), 철골프레임(steel_frame), 공장설비(factory_unit)

석유 체인:
원유(crude_oil), 나프타(naphtha), 폴리머(polymer), 플라스틱소재(plastic), 케이스(case)

구리 체인:
구리광석(copper_ore), 동괴(copper_ingot), 구리선(copper_wire), 전선다발(wire_bundle), 전기장치(electric_unit)

알루미늄 체인:
보크사이트(bauxite), 알루미나(alumina), 알루미늄판재(aluminum_plate), 경량프레임(light_frame), 항공부품(aviation_part)

실리콘 체인:
석영(quartz), 실리콘(silicon), 웨이퍼(wafer), 반도체칩(semiconductor), 마이크로프로세서(microprocessor)

리튬 체인:
리튬광석(lithium_ore), 리튬화합물(lithium_compound), 리튬이온셀(li_ion_cell), 배터리팩(battery_pack), 에너지저장장치(energy_storage)

금 체인:
금광석(gold_ore), 금괴(gold_ingot), 금선(gold_wire), 귀금속커넥터(precious_connector), 정밀전자장치(precision_electronics)

희토류 체인:
희토류광석(rare_earth_ore), 희토류산화물(rare_earth_oxide), 네오디뮴자석(neodymium_magnet), 모터코어(motor_core), 고효율모터(high_eff_motor)

우라늄 체인:
우라늄광석(uranium_ore), 옐로케이크(yellowcake), 농축우라늄(enriched_uranium), 핵연료봉(fuel_rod), 원자력모듈(nuclear_module)

크로스 조합품:
복합소재패널(composite_panel), 기초회로보드(basic_circuit), 스마트기계(smart_machine), 첨단작업대(adv_workbench),
고급회로보드(adv_circuit), 전기차유닛(ev_unit), 원자로모듈(reactor_module), 발전기코어(generator_core), IoT디바이스(iot_device),
AI컴퓨팅유닛(ai_computing), 스마트시티모듈(smart_city), 무한에너지코어(infinite_energy)

프레스티지 아이템:
소규모공장(small_factory), 산업단지(industrial_complex), 미래도시(future_city)

2. src/data/recipes.ts
Define RecipeKind = 'chain' | 'cross' | 'prestige'
Define RecipeDefinition type: {
  id: string,                                        // snake_case
  kind: RecipeKind,
  chain: string,
  unlockedAtStage: number,
  inputs: Array<{ resourceId: string, amount: number }>,
  output: { resourceId: string, amount: number },
  baseDurationSec: number     // scaling과 숙련도 적용 전 기본값. 실제 시간은 엔진에서 계산.
}
Create all 40 recipes for the 10 production chains.
Also include 15 cross-chain recipes (4 basic + 5 mid + 3 final + 3 prestige).
Prestige items:
- ★ 소규모공장(small_factory) = 공장설비 + 전기장치 + 케이스 (3단계)
- ★★ 산업단지(industrial_complex) = 스마트기계 + 첨단작업대 + 소규모공장 (5단계)
- ★★★ 미래도시(future_city) = 스마트시티모듈 + 무한에너지코어 + 산업단지 (8단계)
Duration scales: raw→p1: 5s, p1→p2: 15s, p2→part: 30s, part→final: 60s, cross basic: 90s, cross mid: 180s, cross final: 300s
```

---

### Step 3 — Zustand 게임 스토어

```
Create src/store/gameStore.ts using zustand v5 with persist middleware (AsyncStorage backend) for RawWorks.

Save format: wrap entire state in { version: 1, ...state }.
Include a migration chain function for future version bumps.
Save on every state change (debounced 2 seconds).
ID convention: all resource/recipe/upgrade IDs use snake_case.

State shape:
- resources: Record<resourceId, number>
- prestigeItems: Record<prestigeItemId, number> (separate from resources, survives resets)
- diamonds: number (gacha currency, survives resets)
- activeRecipes: { recipeId, endTime: number, slot: number }[] (endTime = Date.now() + scaledDurationMs)
- upgrades: Record<upgradeId, number>
- workers: Worker[] (all owned workers)
  Worker: { id: string, grade: 'N'|'R'|'U'|'L', abilities: { type: 'yield'|'speed'|'power', multiplier: number }[], level: number, dupeCount: number, locked: boolean }
- workerAssignments: Record<rawResourceId, workerId | null> (10 slots)
- gachaPity: number (pity counter for legendary guarantee)
- mastery: Record<recipeId, { level: number, xp: number }> (production mastery, survives resets)
- totalPrestigeCount: number (total prestiges across all tiers, used for difficulty scaling)
- highestStageThisRun: number (highest stage reached in current run, resets on prestige, used for IP calculation)
- stage: number (1-8)
- prestigeTier: number (0-3, current highest tier unlocked)
- prestigeCount: Record<1|2|3, number> (times prestiged per tier)
- industryPoints: number (permanent currency, survives resets)
- ipUpgrades: Record<ipUpgradeId, number> (permanent upgrades bought with IP)
- lastSaveTime: string (ISO)

Actions:
- addResource(id, amount)
- deductResource(id, amount): boolean
- startRecipe(recipeId, slot): boolean
- completeRecipe(slot)
- applyUpgrade(upgradeId)
- triggerPrestige(tier: 1|2|3) → reset resources/recipes/upgrades, keep IP + ipUpgrades + prestigeItems + mastery + workers + diamonds
  - IP earned = baseIP(tier) + (highestStageThisRun - tierBaseStage) × 1
  - Reset highestStageThisRun to 1
  - Increment totalPrestigeCount
  - prestigeItems are NOT reset (separate state from resources)
- buyIpUpgrade(upgradeId) → deduct IP, apply permanent bonus
- canUnlockTier(tier) → check if "티어 해금" IP upgrade purchased for that tier
- getMaxProductionSlots() → return 2 + upgrades['workbench'] + ipUpgrades['slot_expansion'] (additive stacking)
- getMaxOfflineHours() → return 8 + (upgrades['automation'] × 2) + (ipUpgrades['offline_boost'] × 2), cap at 24
- pullGacha(type: 'single'|'ten') → deduct diamonds, generate workers, update pity
- assignWorker(rawResourceId, workerId) → place worker on mining slot
- unassignWorker(rawResourceId) → remove worker from slot
- recycleWorker(workerId) → convert to diamonds (N:1, R:5, U:15, L:50)
- feedDuplicateWorker(targetId, feedId) → merge duplicate for level up
- addMasteryXp(recipeId, xp) → gain XP, check level up, apply bonuses
- getScaledCost(recipeId) → return adjusted cost based on prestige count + stage
- getScaledDuration(recipeId) → return adjusted duration (scaling ÷ mastery reduction)

Use AsyncStorage for persistence. Save on every state change (debounced 2s).
```

---

### Step 4 — 게임 루프 엔진

```
Create src/engine/GameLoop.ts for RawWorks.

Requirements:
- setInterval every 250ms (heartbeat, NOT 1-second tick)
- Maintain per-resource ms accumulators: Record<rawResourceId, number>
- On each heartbeat (deltaMs = Date.now() - lastHeartbeat):
  1. Auto-mining: for each unlocked raw resource:
     a. accumulator[resourceId] += deltaMs
     b. effectiveTickMs = baseTickMs / workerSpeedMult (e.g. 1000ms / 1.2 = 833ms)
     c. while accumulator[resourceId] >= effectiveTickMs:
        - accumulator[resourceId] -= effectiveTickMs
        - amount = baseRate × miningUpgradeMultiplier × workerYieldMult
        - addResource(resourceId, amount)
        - roll workerPowerChance → if success, add 1 unit of random same-stage raw resource (excluding self)
  2. Check active recipes: if Date.now() >= recipe.endTime → completeRecipe()
     On complete: addMasteryXp(recipeId, XP), apply mastery yieldBonus + criticalChance to output
     If mastery autoRepeat enabled + resources available → auto-restart (set new endTime)
  3. Auto-complete conveyor belt recipes (if conveyor upgrade active)
  4. Update highestStageThisRun = max(highestStageThisRun, stage)
- AppState listener:
  - background: save Date.now() as lastBackgroundTime to AsyncStorage
  - foreground: call OfflineEngine.calculate()
- Export: startLoop(), stopLoop()
- Use gameStore actions for all state changes
```

---

### Step 5 — 오프라인 수익 엔진

```
Create src/engine/OfflineEngine.ts for RawWorks.

Logic:
- calculate(): async function
  1. Load lastBackgroundTime from AsyncStorage
  2. maxOfflineSec = gameStore.getMaxOfflineHours() × 3600
     (= (8 + automation_upgrade_level×2 + ip_offline_boost_level×2) × 3600, cap 24h)
  3. elapsedSec = Math.min((Date.now() - lastBackgroundTime) / 1000, maxOfflineSec)
  4. Calculate earned resources:
     - Auto-mining resources × elapsedSec × miningRate × workerYieldMultiplier
     - Completed recipe cycles (floor(elapsedSec / getScaledDuration(recipe))) for each active recipe slot
     - Apply mastery yieldBonus to recipe outputs
     - If IP upgrade '자동 크로스' purchased: also process cross-chain recipe slots offline
       (otherwise cross recipes are paused during offline)
  5. Add all earned resources via gameStore.addResource()
     Add mastery XP for completed recipe cycles
  6. Return OfflineReport: { elapsedSec, earned: {resourceId, amount}[] }

- Show a modal with the OfflineReport when calculate() resolves
- If elapsedSec < 60, skip the modal
```

---

### Step 6 — 메인 화면 UI

```
Create src/screens/MainScreen.tsx for RawWorks (pixel art idle game).

UI layout:
- Header: game title + prestige count + stage badge
- Resource grid (2 columns): show all unlocked resources with emoji icon, name, amount
  - Amount formatted: use bigNumber util (1234 → "1.2K", 1000000 → "1M")
  - Highlight resources currently being produced (pulse animation)
- Mining section: tap button for each unlocked raw resource
  (↳ each mining slot shows assigned worker portrait + grade border if present)
  (1단계: 원목, 철광석 / 2단계: 원유, 보크사이트, 구리광석 / 4단계: 석영, 리튬광석, 금광석 / 5단계: 희토류광석 / 6단계: 우라늄광석)
  with auto-mining rate display (e.g. "자동: +2.5/s 📦×1.4")
  → tap worker icon to open quick-assign from WorkerScreen
- 💎 Diamond balance display (top-right corner)
- Bottom: offline earnings banner if available

Style: dark industrial theme, monospace font for numbers, pixel-art feel.
Use react-native-reanimated for number change animations.
```

---

### Step 7 — 생산 체인 UI

```
Create src/screens/ProductionScreen.tsx for RawWorks.

UI:
- Active Slots section (top): show 1~3 production slots (based on upgrade level)
  Each slot: recipe name, progress bar (elapsed/duration), output preview, cancel button
- Recipe List (scrollable): grouped by chain (목재, 철강, 석유, 구리, 알루미늄, 실리콘, 리튬, 금, 희토류, 우라늄, 크로스)
  Each recipe card:
  - Input ingredients with amounts (check if player has enough → highlight green/red)
    → If scaled cost > base cost, show "기본 ×3 → 스케일 ×5" in orange
  - Arrow → output item
  - Duration display (e.g. "15초") — show mastery reduction if applicable ("15초 → 12초 ⭐")
  - Mastery badge: ⭐Lv.5 with XP progress bar underneath
  - 🔄 AUTO badge if mastery Lv.5+ and auto-repeat enabled
  - "생산 시작" button (disabled if insufficient resources or all slots busy)
  - Lock icon if not yet unlocked (stage requirement)

Use gameStore for resource checks and startRecipe() action.
```

---

### Step 8 — 업그레이드 화면 UI + 데이터

```
Create upgrade system for RawWorks:

1. src/data/upgrades.ts
Define Upgrade type: { id, nameKo, tiers: { level, cost: {resourceId, amount}[], effect }[], category: 'mining'|'smelting'|'automation'|'facility'|'research' }

Upgrades:
- 채굴도구: 곡괭이(Lv1) → 착암기(Lv2) → 굴착기(Lv3) → 양자드릴(Lv4)
  cost: 강철판×5 → 철골프레임×3 → 복합소재패널×2 → AI컴퓨팅유닛×1
  effect: miningRate ×1.5 per level
- 제련설비: 용광로(Lv1) → 전기로(Lv2) → 아크로(Lv3) → 플라즈마로(Lv4)
  cost: 선철×10 → 전선다발×5 → 발전기코어×2 → 원자로모듈×1
  effect: smeltingTime ×0.7 per level
- 자동화: 수동(Lv0) → 컨베이어(Lv1) → 로봇팔(Lv2) → AI라인(Lv3)
  cost: 스마트기계×1 → 플라스틱소재×10 → 고급회로보드×2 → AI컴퓨팅유닛×1
  effect: offlineMaxHours +2 per level
- 작업대: 목재(Lv1) → 철제(Lv2) → 첨단(Lv3) → 나노(Lv4)
  cost: 가구부품×5 → 전기장치×3 → 고급회로보드×1 → 마이크로프로세서×2
  effect: productionSlots +1 per level
- 시설규모: 소규모(Lv1) → 공장(Lv2) → 산업단지(Lv3) → 미래도시(Lv4)
  cost: 공장설비×1 → 복합소재패널×5 → 스마트시티모듈×1 → 미래도시×1
  effect: miningSlots +1 per level
- 연구소: Lv1 = 스마트기계+책상, Lv2 = 고급회로보드+정밀전자장치
  effect: Lv1 = stage 3→4 transition condition + unlock stages 4+, Lv2 = stage 5→6 transition condition + unlock stages 6+
  (연구소 업그레이드를 적용하면 단계 전환도 동시에 수행됨)
- 에너지그리드: 발전기코어+에너지저장장치
  effect: globalProductionSpeed ×1.5

Slot stacking rule:
  maxProductionSlots = 2 (base) + workbench_upgrade_level + ip_slot_expansion_level
  Example: 철제 작업대(Lv2) + IP 슬롯확장 2회 = 2 + 2 + 2 = 6 slots

2. src/data/stages.ts
Define Stage type: { id, nameKo, unlocksResources: resourceId[], unlocksRecipes: recipeId[], requiredUpgrades?: upgradeId[] }
Create stages 1-8 with their unlock conditions matching GDD section 7.

3. src/screens/UpgradeScreen.tsx
UI:
- Grouped by category with section headers
- Each upgrade: current level, next level cost (green/red availability), effect preview, "업그레이드" button
- Research section at bottom with milestone unlock descriptions
- Locked upgrades show lock icon + requirement text
```

---

### Step 9 — 프레스티지 엔진 + IP 상점

```
Create prestige system for RawWorks:

1. src/engine/PrestigeEngine.ts
- calculateIpEarned(tier: 1|2|3, highestStageThisRun: number): number
  - Base: tier1=1, tier2=5, tier3=20
  - Bonus: +1 IP per stage beyond prestige tier's base stage
  - Formula: baseIP + (highestStageThisRun - tierBaseStage) * bonusPerStage
  - tierBaseStage: tier1=3, tier2=5, tier3=8
- canPrestige(tier): boolean — check if player has prestige item (from prestigeItems state) + meets tier requirements
- executePrestige(tier):
  1. Calculate IP earned using highestStageThisRun
  2. Add IP to gameStore.industryPoints
  3. Increment gameStore.prestigeCount[tier] and gameStore.totalPrestigeCount
  4. Reset: resources → 0 (or startingAmount if IP upgrade bought), upgrades → 0, activeRecipes → []
  5. Reset: highestStageThisRun → 1, stage → 1
  6. Keep: industryPoints, ipUpgrades, mastery, workers, workerAssignments, diamonds, gachaPity, prestigeTier, prestigeItems (separate preserved state)
  7. Apply IP upgrade bonuses (startResources, etc.)

2. src/data/ipUpgrades.ts
Define IpUpgrade type: { id, nameKo, description, cost: number, maxLevel: number, effect }
8 upgrades matching GDD prestige rules section (채굴속도강화, 제련가속, 시작자원, 슬롯확장, 오프라인강화, 자동크로스, 작업자보관함, 티어해금).

3. src/screens/PrestigeScreen.tsx (new tab or modal from FactoryScreen)
UI layout:
- Top section: Current IP balance (big number), prestige count per tier
- Prestige Buttons: 3 tiers, each showing:
  - Requirements (prestige item owned? IP upgrade count met?)
  - IP reward preview ("이 프레스티지로 IP 3 획득")
  - "기업 매각" button with confirmation dialog
  - Lock overlay if tier not yet unlocked
- IP Shop section (scrollable):
  - Each IP upgrade card: name, description, current level/max, cost, buy button
  - Bought upgrades show checkmark, maxed show "MAX"
  - Tier unlock item highlighted when affordable
```

---

### Step 10 — 공장 현황 화면

```
Create src/screens/FactoryScreen.tsx for RawWorks.

UI:
- Pixel art factory view (top): simple grid showing unlocked buildings/machines as pixel sprites
  - Buildings appear as player upgrades: 용광로, 전기로, 컨베이어, 로봇팔, 연구소, etc.
  - Animate smoke/sparks on active machines
- Stats dashboard (bottom):
  - Total resources produced (lifetime counter)
  - Current production rates per resource (/sec)
  - Active recipe slots with progress
  - Prestige tier badge + total IP earned
  - Offline earnings rate preview
- Quick access buttons: "프레스티지" → PrestigeScreen, "IP 상점" → IP shop section
```

---

### Step 11 — 수익화 (광고 + IAP)

```
Set up monetization for RawWorks:

1. src/services/AdService.ts
- Initialize react-native-google-mobile-ads
- Ad types:
  a. Rewarded ad: "광고 보고 2배 보상" — doubles offline earnings (1 view per return)
  b. Rewarded ad: "광고 보고 생산 가속" — 2x production speed for 5 minutes
  c. Interstitial ad: show every 5th prestige (non-intrusive frequency)
- Functions: loadRewardedAd(), showRewardedAd(callback), loadInterstitial(), showInterstitial()
- Use test ad unit IDs for development
- Track ad cooldowns to prevent spam

2. IAP setup in app.json:
- Product: "remove_ads" (one-time purchase, $2.99)
  - Removes all interstitial ads
  - Rewarded ads remain available (optional, player-initiated)
- Use expo-in-app-purchases for purchase flow
- Store purchase status in AsyncStorage + gameStore

3. Integration points:
- OfflineModal.tsx: "2배 받기 (광고)" button next to "확인" button
- MainScreen.tsx: "⚡ 가속 (광고)" floating button
- Settings: "광고 제거 ($2.99)" purchase button
- If remove_ads purchased: hide interstitials, show "감사합니다" badge
```

---

### Step 12 — 오프라인 알림

```
Set up push notifications for RawWorks:

1. src/services/NotificationService.ts
- Use expo-notifications
- Request permission on first launch (non-blocking)
- Schedule local notifications:
  a. "자원이 가득 찼어요! 수확하러 오세요 🏭" — after offline max time reached
  b. "생산 완료! [아이템명] 제작이 끝났습니다 ⚒️" — when longest active recipe would complete
  c. "공장이 멈췄어요... 다시 가동하세요! 🔧" — 24hr inactivity reminder
- Cancel existing notifications on app foreground
- Reschedule on app background

2. Integration:
- GameLoop.ts: on background → schedule notifications based on active state
- OfflineEngine.ts: on foreground → cancel all pending notifications
- Settings screen: notification toggle (on/off)
```

---

### Step 13 — 분석 + 밸런스 트래킹

```
Set up analytics for RawWorks:

1. src/services/AnalyticsService.ts
- Use expo-firebase-analytics (or custom lightweight tracker)
- Track events:
  - game_start: { prestigeTier, prestigeCount, industryPoints }
  - prestige: { tier, ipEarned, highestStage, sessionDurationMin }
  - ip_upgrade_buy: { upgradeId, level, totalIp }
  - stage_unlock: { stage, sessionDurationMin }
  - upgrade_apply: { upgradeId, level }
  - ad_watched: { type: 'reward_double'|'reward_boost'|'interstitial' }
  - iap_purchase: { productId }
  - gacha_pull: { type: 'single'|'ten', resultGrades: string[], legendaryPity: number }
  - worker_assign: { workerId, grade, resourceId }
  - worker_recycle: { grade, diamondsReturned }
  - mastery_levelup: { recipeId, newLevel, milestone?: string }
  - difficulty_label: { label, totalPrestigeCount, costMultiplier }
  - session_end: { durationMin, highestStage }
- Wrapper: logEvent(name, params) with debounce for frequent events
- Privacy: no PII collected, analytics opt-out in settings

2. Integration: call logEvent() at each trigger point across screens and engines.
```

---

### Step 14 — 테스트 + 밸런스 튜닝

```
Create testing utilities for RawWorks:

1. src/utils/devTools.ts (DEV only, stripped in production)
- Debug panel (shake gesture or triple-tap to open):
  - Add any resource ×100 / ×1000
  - Set stage to any value (1-8)
  - Add IP ×10
  - Instant complete all active recipes
  - Reset all data
  - Time warp: simulate N hours offline
  - Toggle: show tick rate, FPS counter
- cheatCode(code: string): hidden text input for QA
  - "MAXALL" → all resources to 999999
  - "IPRICH" → add 100 IP
  - "STAGE8" → set stage to 8
  - "SPEEDX10" → 10x game speed for 60 seconds

2. Balance testing checklist:
- Verify: tier1 prestige reachable in ~1 hour from fresh start
- Verify: tier1 repeat takes ~30 min with 3 IP upgrades
- Verify: tier2 prestige reachable in ~3 hours (with IP upgrades from tier1)
- Verify: tier3 prestige reachable in ~8 hours (with accumulated IP)
- Verify: recipe durations feel rewarding (not too fast, not dragging)
- Verify: offline earnings match expectations (8hr cap = meaningful but not game-breaking)
- Log resource flow bottlenecks per stage
- Verify: gacha pity guarantees legendary at 50 pulls
- Verify: 10-pull always contains at least 1 R+
- Verify: worker yield multiplier stacks correctly with mining upgrades + IP bonuses
- Verify: diamond economy — enough to pull 1-2x per prestige cycle without feeling starved
- Verify: worker power (부산물) drop rate is noticeable but not overpowered
- Verify: mastery Lv.5 reachable for main chain recipes by prestige 2~3
- Verify: mastery auto-repeat (Lv.5) significantly reduces manual tedium in mid-game
- Verify: difficulty scaling at prestige 5 feels challenging but not punishing
- Verify: mastery time reduction roughly offsets difficulty duration increase by mid-game
- Verify: scaled costs never exceed 5× base (cap working correctly)
- Verify: prestige item repeat cost scaling feels fair (3rd repeat = ×1.44)
- Verify: 난이도 label (초급→중급→고급→마스터) progression matches player experience
```

---

### Step 15 — 빌드 + 배포 준비

```
Prepare RawWorks for production build and store submission:

1. App identity:
- app.json:
  - name: "Raw Works"
  - slug: "raw-works"
  - version: "1.0.0"
  - ios.bundleIdentifier: "com.rawworks.idle"
  - android.package: "com.rawworks.idle"
  - orientation: "portrait"
  - icon: "./assets/icon.png" (1024×1024, pixel art factory logo)
  - splash: { image: "./assets/splash.png", backgroundColor: "#1a1a2e" }
  - android.adaptiveIcon: { foregroundImage, backgroundColor }

2. EAS Build setup:
- npx eas-cli login
- eas.json:
  {
    "build": {
      "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
      "production": { "autoIncrement": true }
    },
    "submit": {
      "production": {
        "ios": { "appleId": "...", "ascAppId": "...", "appleTeamId": "..." },
        "android": { "serviceAccountKeyPath": "./google-service-account.json" }
      }
    }
  }

3. Production checklist:
- [ ] Remove all devTools / debug panel in production build
- [ ] Replace test ad unit IDs with production IDs
- [ ] Enable Hermes engine (android) for performance
- [ ] Set expo-updates channel for OTA updates
- [ ] Test on physical devices (iOS + Android)
- [ ] Test offline/background transitions thoroughly
- [ ] Verify AsyncStorage save/load after app kill
- [ ] Test IAP purchase flow (sandbox)
- [ ] ProGuard / minification check
- [ ] App size < 50MB target

4. Build commands:
- Preview: eas build --platform all --profile preview
- Production: eas build --platform all --profile production
- Submit: eas submit --platform all --profile production
```

---

### Step 16 — 스토어 등록 (ASO)

```
Prepare store listings for RawWorks:

1. Google Play Store:
- 앱 이름: Raw Works — 방치형 산업 시뮬레이션
- 짧은 설명 (80자): 원목과 철광석에서 시작해 미래도시를 건설하는 방치형 공장 게임
- 긴 설명 (4000자):
  "맨손에서 시작하는 산업 혁명!

  🪵 원목을 베고, ⛏️ 철광석을 캐는 것부터 시작하세요.
  10가지 원자재를 채취하고, 실제 산업 공정을 따라 가공하세요.
  목재 → 가구, 철광석 → 강철, 석유 → 플라스틱, 구리 → 전자장치...
  그리고 체인을 교차 조합해 스마트 기계, 전기차, AI 컴퓨팅까지!

  ⚙️ 특징:
  • 10개 생산 체인 × 5단계 가공 = 60+ 자원
  • 15개 크로스 체인 조합 (반도체, 배터리, 원자력...)
  • 돈이 아닌 '만든 물건'으로 업그레이드하는 독특한 시스템
  • 작업자 가챠 — 노말~전설 등급, 랜덤 능력 조합으로 채굴 극대화
  • 3티어 반복 프레스티지 + 산업 포인트 영구 성장
  • 최대 12시간 오프라인 자동 생산
  • 실제 산업 공정 기반 — 배우면서 즐기기

  🏭 소규모 공장 → 산업단지 → 미래도시!
  당신의 산업 제국을 건설하세요."

- 카테고리: 시뮬레이션 > 방치형
- 콘텐츠 등급: 전체이용가
- 스크린샷 5장: 채취화면, 생산화면, 업그레이드화면, 프레스티지화면, 공장전경
- 피처 그래픽 (1024×500): 픽셀 아트 공장 + 로고

2. Apple App Store:
- 동일 내용 + 키워드: 방치형,idle,공장,시뮬레이션,산업,제작,광석,자원
- 부제: 맨손에서 미래도시까지
- 프로모션 텍스트: 실제 산업 공정 기반 방치형 공장 시뮬레이션
- 개인정보 처리방침 URL 필요 (간단한 정적 페이지)
- 심사 참고사항: "This is an idle/incremental game. No real-money gambling."

3. Privacy policy page: (필수)
- Create a simple static page (GitHub Pages or Notion public page)
- Content: 수집 정보 없음 (분석은 익명), 광고 SDK 사용 고지
```

---

### Step 17 — 작업자 데이터 + 가챠 확률 정의

```
Create worker and gacha data files for RawWorks:

1. src/data/workers.ts
Define WorkerGrade: 'N' | 'R' | 'U' | 'L'
Define WorkerAbilityType: 'yield' | 'speed' | 'power'
Define WorkerAbility: { type: WorkerAbilityType, multiplier: number }
Define WorkerTemplate: { grade: WorkerGrade, abilityCount: { min, max }, multiplierRange: { min, max } }

Grade templates:
- N (노말): abilityCount 1~1, multiplier 1.1~1.3
- R (레어): abilityCount 1~2, multiplier 1.2~1.5
- U (유니크): abilityCount 2~3, multiplier 1.4~1.8
- L (전설): abilityCount 3~3, multiplier 1.6~2.5

Gacha rate table:
  NORMAL_RATE = 0.60
  RARE_RATE = 0.25
  UNIQUE_RATE = 0.12
  LEGENDARY_RATE = 0.03

Gacha costs:
  SINGLE_PULL_COST = 50 diamonds
  TEN_PULL_COST = 450 diamonds (10% discount)

Pity system:
  PITY_THRESHOLD = 50 (cumulative single pulls without legendary → guarantee next is L)
  TEN_PULL_GUARANTEE = at least 1 R or higher per 10-pull

Worker recycle values (diamonds returned):
  N: 1, R: 5, U: 15, L: 50

Level up (duplicate merge):
  N max dupes: 5, R: 4, U: 3, L: 2
  Per level bonus: N +0.02, R +0.03, U +0.04, L +0.06 (to each ability multiplier)

Worker ability descriptions (for UI):
  yield: "틱당 채취 수량 ×{multiplier} 증가"
  speed: "자동 채취 간격 ×{1/multiplier} 감소"
  power: "채굴 시 인접 체인 원자재 {(multiplier-1)*100}% 확률 추가 획득"

2. src/data/diamonds.ts
Define DiamondSource: { id, nameKo, amount, frequency }
Sources:
- prestige_t1: 10💎 per tier1 prestige
- prestige_t2: 30💎 per tier2 prestige
- prestige_t3: 100💎 per tier3 prestige
- daily_login: 5💎 daily (7-day streak: 30💎 bonus)
- achievement: 10~50💎 one-time
- ad_watch: 5💎 (max 5/day)
- stage_first_clear: 20💎 per stage (once)
```

---

### Step 18 — 가챠 엔진 + 작업자 엔진

```
Create gacha and worker engines for RawWorks:

1. src/engine/GachaEngine.ts
- generateWorker(grade: WorkerGrade): Worker
  1. Determine abilityCount from grade template (random between min~max)
  2. Pick abilityCount types from ['yield','speed','power'] without replacement (random)
  3. For each ability, roll multiplier within grade's multiplierRange (round to 1 decimal)
  4. Return Worker { id: uuid, grade, abilities, level: 1, dupeCount: 0, locked: false }

- pullSingle(): Worker
  1. Check diamonds >= 50, deduct
  2. Increment gachaPity counter
  3. If gachaPity >= 50 → force grade = 'L', reset pity to 0
  4. Else roll random(0~1):
     - < 0.03 → 'L' (reset pity)
     - < 0.15 → 'U'
     - < 0.40 → 'R'
     - else → 'N'
  5. Return generateWorker(grade)

- pullTen(): Worker[]
  1. Check diamonds >= 450, deduct
  2. Pull 10 workers using pullSingle logic
  3. If none are R or higher → upgrade lowest roll to R
  4. Return 10 workers

- recycleWorker(workerId): number (diamonds returned)
  1. Look up worker grade, return recycle value
  2. Remove from gameStore.workers

- mergeDuplicate(targetId, feedId):
  1. Verify same grade
  2. If target.dupeCount < maxDupes → increment level, add multiplier bonus to each ability
  3. Remove feedId worker

2. src/engine/WorkerEngine.ts
- getMiningMultiplier(rawResourceId): { yieldMult, speedMult, powerChance }
  1. Check workerAssignments[rawResourceId]
  2. If no worker → return { 1, 1, 0 }
  3. Aggregate worker's abilities:
     - yield ability → yieldMult
     - speed ability → speedMult (reduces tick interval)
     - power ability → powerChance (% chance for bonus resource from same-stage pool)
  4. Return multipliers

- applyWorkerBonus(rawResourceId, baseAmount, baseTickMs):
  Get multipliers, return { finalAmount: baseAmount * yieldMult, finalTickMs: baseTickMs / speedMult, bonusDrop: random() < powerChance }

- getBonusDropTarget(rawResourceId): resourceId
  1. Get the stage at which rawResourceId was unlocked
  2. Collect all other raw resources unlocked at the same stage
  3. Return random pick from that pool (excluding self)
  Example: copper_ore (stage 2) → pool = [crude_oil, bauxite] → random pick

- Integration with GameLoop.ts:
  On each mining tick per resource:
  1. Get worker multipliers for that resource
  2. Apply yield multiplier to amount
  3. Tick interval uses accumulator system (250ms heartbeat, see Step 4)
  4. Roll power chance → if success, add 1 unit of getBonusDropTarget(resourceId)
```

---

### Step 19 — 작업자 화면 UI

```
Create src/screens/WorkerScreen.tsx for RawWorks.

UI layout (3 sections):

1. 가챠 뽑기 섹션 (top)
- 💎 Diamond balance (large, top-right)
- Two pull buttons:
  - "단일 뽑기 (50💎)" — single pull
  - "10연차 뽑기 (450💎)" — 10-pull with R+ guarantee badge
- Pity counter display: "전설 보장까지 {50 - pity}회"
- Pull animation: card flip reveal with grade-colored glow effect
  - N: grey flash, R: blue flash, U: purple burst, L: golden explosion + screen shake
- 10-pull shows all 10 cards in a grid, auto-highlights R+ cards

2. 보관함 섹션 (middle, scrollable)
- Filter tabs: 전체 | N | R | U | L
- Sort: 등급순 | 능력순 | 최근순
- Grid of WorkerCards (3 columns):
  Each card shows:
  - Grade border color (grey/blue/purple/gold)
  - Worker pixel art portrait (procedurally tinted by grade)
  - Level badge (Lv.1~Max)
  - Ability icons with multiplier values: 📦×1.3  ⚡×1.2  💪×1.5
  - Lock icon toggle (tap to lock/unlock)
  - "배치" button → opens resource selector modal
  - "분해" button (disabled if locked) → confirm dialog → returns diamonds
- Duplicate merge: drag worker onto same-grade worker → merge animation → level up

3. 배치 현황 섹션 (bottom)
- 10 mining slots in 2×5 grid, each showing:
  - Resource icon + name (원목, 철광석, ...)
  - Assigned worker card (or empty "+" slot)
  - Active multiplier preview: "📦×1.3 ⚡×1.2"
  - Tap to unassign or swap worker
- Total mining bonus summary: "전체 생산량 +42%, 속도 +18%"
- Locked resources shown as greyed-out slots with stage requirement
```

---

### Step 20 — 숙련도 데이터 + 엔진

```
Create production mastery system for RawWorks:

1. src/data/mastery.ts
Define MasteryLevel: { level, requiredXp, bonuses: { productionTimeReduction, yieldBonus, unlocks?: string } }

Level table (formula: requiredXp = ceil(5 * level^1.5)):
- Lv.1→2: 5 XP
- Lv.2→3: 12 XP
- Lv.3→4: 25 XP
- Lv.4→5: 50 XP (unlock: auto-repeat production for this recipe)
- Lv.5→6: 82 XP
- ...continue to Lv.20 for normal recipes, Lv.15 for cross, Lv.10 for prestige

Per-level bonuses:
- productionTimeReduction: 3% per level (cumulative, cap 60% at Lv.20)
- yieldBonus: 5% per level (cumulative, cap 100% at Lv.20)
- Lv.5 milestone: AUTO_REPEAT unlock (recipe auto-restarts after completion)
- Lv.10 milestone: CRITICAL_PRODUCTION (10% chance for ×2 output)
- Lv.15 milestone: CHAIN_REACTION (5% chance to instantly produce 1 of next-tier item)

Define MasteryMilestone: { condition: string, reward: string }
Chain milestones:
- All recipes in 1 chain at Lv.5 → chain raw resource automine ×1.3
- All recipes in 1 chain at Lv.10 → chain dedicated recipe slot +1
- 5 cross recipes at Lv.5 → all cross recipe time -20%
- All recipes Lv.5 → 💎50 + title "숙련 장인"
- All recipes Lv.10 → 💎200 + title "마스터 엔지니어"

XP per completion:
  NORMAL_RECIPE_XP = 1
  CROSS_RECIPE_XP = 2
  PRESTIGE_RECIPE_XP = 3

2. src/engine/MasteryEngine.ts
- addXp(recipeId, xp):
  1. Add xp to mastery[recipeId].xp
  2. Check if xp >= requiredXp for next level → level up
  3. On level up: apply bonuses, check milestones
  4. Return { leveled: boolean, newLevel, milestonesUnlocked: string[] }

- getMasteryBonus(recipeId): { timeReduction: number, yieldBonus: number, autoRepeat: boolean, criticalChance: number, chainReactionChance: number }
  Calculate cumulative bonuses from current mastery level

- checkMilestone(recipeId): MasteryMilestone[] | null
  Evaluate chain-wide and global milestones

- Integration with ProductionEngine:
  On recipe completion → call addXp(recipeId, XP_PER_TYPE)
  On recipe start → apply getMasteryBonus() to duration and output
  If autoRepeat unlocked + resources available → auto-restart recipe
```

---

### Step 21 — 난이도 스케일링 데이터 + 엔진

```
Create difficulty scaling system for RawWorks:

1. src/data/scaling.ts
Define ScalingConfig:
  RECIPE_COST_PER_PRESTIGE = 0.15        // +15% material cost per total prestige count
  RECIPE_DURATION_PER_PRESTIGE = 0.10     // +10% duration per prestige
  UPGRADE_COST_MULTIPLIER = 1.5           // geometric scaling per upgrade tier
  CROSS_STAGE_MULTIPLIER = 0.10           // +10% per stage for cross recipes
  PRESTIGE_ITEM_REPEAT_MULTIPLIER = 0.20  // +20% per same-tier prestige repeat

  Caps:
  MAX_COST_MULTIPLIER = 5.0               // materials never exceed 5× base
  MAX_DURATION_MULTIPLIER = 3.0           // duration never exceeds 3× base

2. src/engine/ScalingEngine.ts
- getScaledRecipeCost(recipeId, baseCost: {resourceId, amount}[]): {resourceId, amount}[]
  Formula per material:
    scaledAmount = ceil(baseAmount × min((1 + totalPrestigeCount × 0.15) × (1 + currentStage × 0.10), MAX_COST_MULTIPLIER))
    NOTE: totalPrestigeCount = sum of all tier prestiges. currentStage = current run stage (resets on prestige).
  For prestige items: additionally multiply by (1 + prestigeCount[sameTier] × 0.20)

- getScaledDuration(recipeId, baseDurationSec): number
  1. scaledDuration = baseDurationSec × min(1 + totalPrestigeCount × 0.10, MAX_DURATION_MULTIPLIER)
  2. masteryReduction = MasteryEngine.getMasteryBonus(recipeId).timeReduction
  3. finalDuration = scaledDuration × (1 - masteryReduction)
  4. Return max(finalDuration, baseDurationSec × 0.2) // floor at 20% of base (never instant)

- getScaledUpgradeCost(upgradeId, currentLevel): {resourceId, amount}[]
  Each level multiplies base cost by UPGRADE_COST_MULTIPLIER^currentLevel

- getDifficultyLabel(totalPrestigeCount): string
  0~2: "초급", 3~5: "중급", 6~9: "고급", 10+: "마스터"
  NOTE: uses totalPrestigeCount only (NOT highestStageThisRun)

- Variable reference:
  - totalPrestigeCount → difficulty scaling formulas + difficulty label
  - highestStageThisRun → IP earned calculation (see PrestigeEngine)
  - currentStage → recipe cost scaling (resets each run, prevents difficulty stalling)
  - prestigeCount[tier] → prestige item repeat cost scaling

- Integration points:
  - ProductionScreen: show scaled costs (use getScaledRecipeCost instead of base)
  - UpgradeScreen: show scaled upgrade costs
  - RecipeCard: display original → scaled cost comparison if scaled > original
  - PrestigeScreen: show "난이도: 중급 (×1.45)" badge
  - GameLoop: use getScaledDuration for recipe timing
```

---

*Raw Works — GDD v2.8*  
*작성일: 2026년 4월*  
*변경: v2.8 — 프롬프트 세트 기술 스택 확정 반영. 핵심 패키지 테이블에 버전+Phase 구분 추가. Step1: SDK52, expo-router v4, strict TS, 경로 alias, Phase 1 패키지만 설치, 폴더에 hooks·types·services 추가. Step2: ResourceDefinition에 isRaw·isPrestigeItem·tier 확장, RecipeDefinition에 kind·baseDurationSec, snake_case ID. Step3: zustand v5, save format version, 2초 디바운스, migration chain.*
