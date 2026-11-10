---
title: "Claude Code mods 4종 정리: 캐시 비용, 녹화 보안, 목표 진행률, 파일 충돌 방지"
description: "nateherkai/claude-code-mods 의 mod 4종 설명과 사용법"
date: 2026-11-10T00:00:00.000Z
tags: ["claude", "mods"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/claude-code-mods-cover.jpg"
---

## 들어가며

Claude Code에는 **mod**라는 확장 방식이 있습니다. mod는 Claude Code 안에서 돌아가는 플러그인으로, 화면에 직접 그림을 그릴 수 있고(프롬프트 위 한 줄, 푸터 라벨, 사이드 패널), 슬래시 명령어를 추가하고, Claude가 도구를 실행하기 직전에 끼어들 수도 있습니다.

이 글에서는 Nate Herk가 공개한 [nateherkai/claude-code-mods](https://github.com/nateherkai/claude-code-mods) 저장소의 mod 4종을 정리합니다. 각각 해결하는 문제가 분명합니다.

| Mod | 명령어 | 하는 일 |
|---|---|---|
| **Cache Keeper** | `/cache`, `/keepwarm`, `/board`, `/handoff` | 프롬프트 캐시가 살아 있는지, 식었을 때 다시 쓰는 비용이 얼마인지 보여주고, 큰 대화의 캐시를 유지하고, 비싼 전송 전에 물어봅니다 |
| **Recording Mode** | `/rec`, `/rec strict`, `/rec off`, `/rec config` | 화면 녹화 중에 키, 개인정보, 사업 수치를 가리고 민감한 파일을 열지 못하게 합니다 |
| **Goal Meter** | `/goals` | `/goal` 의 진행률을 Claude의 작업 계획 기준으로 막대와 예상 완료 시각으로 보여줍니다 |
| **Collision Guard** | `/guard` | 다른 대화가 최근 30분 안에 고친 파일을 수정하려 할 때 먼저 물어봅니다 |

> 💡 **사전 준비**: Claude Code **2.1.287 이상**이 필요합니다. `claude --version` 으로 확인하세요. 터미널과 데스크톱 앱의 Code 탭 모두에서 동작합니다.

---

## 1. 설치하기

### mod를 쓸 수 있는 계정인지 확인

Anthropic이 mod 기능을 계정별로 순차 적용하고 있습니다. 아무 폴더에서나 아래 명령을 실행해 보세요.

```bash
claude plugin test
```

- `no hooks module to load` → mod를 로드할 수 있는 상태
- `served off` → 아직 계정에 열리지 않은 상태

나중에 기능이 열리더라도 다시 설치할 필요는 없습니다.

### 마켓플레이스 추가 후 설치

저장소를 플러그인 마켓플레이스로 등록합니다.

```bash
claude plugin marketplace add nateherkai/claude-code-mods
```

원하는 mod를 하나씩 설치합니다.

```bash
claude plugin install cache-keeper@nateherk-mods
```

```bash
claude plugin install recording-mode@nateherk-mods
```

```bash
claude plugin install goal-meter@nateherk-mods
```

```bash
claude plugin install collision-guard@nateherk-mods
```

설치한 뒤에는 **새 대화를 열어야** 합니다. mod는 대화가 시작될 때 로드되고, `/reload-plugins` 로는 다시 로드되지 않습니다.

### 업데이트와 삭제

설치본은 복사본이라서 직접 업데이트하기 전에는 바뀌지 않습니다.

```bash
claude plugin marketplace update nateherk-mods
```

```bash
claude plugin update <mod>@nateherk-mods
```

업데이트 후에도 새 대화를 열어야 반영됩니다. 삭제는 다음과 같습니다.

```bash
claude plugin uninstall <mod>@nateherk-mods
```

---

## 2. Cache Keeper: 식은 캐시에 돈 쓰지 않기

### 왜 필요한가

Claude Code는 요청마다 대화 전체를 다시 읽습니다. 프롬프트 캐시에서 읽으면 일반 입력 가격의 **10분의 1**입니다. 그런데 캐시가 만료되면(설정에 따라 5분 또는 1시간 동안 입력이 없을 때) 다음 메시지가 대화 전체를 캐시에 다시 쓰게 되고, 이때는 입력 가격의 **최대 2배**가 듭니다.

40만 토큰짜리 대화라면 메시지 한 번에 몇 달러가 나갈 수 있습니다. 반면 캐시를 유지하는 비용은 센트 단위입니다.

### 프롬프트 위 상태 줄

```
● cache warm 42m │ ctx 412k │ rewrite ≈ $3.30 │ session $5.12
```

캐시가 살아 있는 시간, 컨텍스트 크기, 캐시가 식었을 때 다시 쓰는 비용, 세션 누적 비용이 한 줄에 나옵니다. 만료 5분 전에는 노란색으로 바뀌고 `keep warm` 버튼이 나타납니다. 5시간 한도와 주간 한도도 같은 줄에 표시되며 80%에서 노란색, 95%에서 빨간색이 됩니다.

### 명령어

| 명령어 | 설명 |
|---|---|
| `/keepwarm [시간\|off]` | 이 대화의 캐시를 유지합니다. 기본 4시간이고, 만료 직전에 작은 핑을 보냅니다. 핑이 캐시를 읽지 않고 쓰게 되면 스스로 꺼지고 알려줍니다 |
| `/board` | 로컬의 모든 대화를 한 패널에 보여줍니다. 내 입력을 기다리는 대화, 작업 중인 대화, 캐시가 곧 식을 대화 순으로 정렬됩니다. 각 행에 상태, 컨텍스트 크기, 캐시, 비용, 실행 중인 에이전트, keep-warm 버튼이 있습니다 |
| `/handoff` | 함께 들어 있는 `/session-handoff` 스킬을 실행해 인수인계 문서를 저장하고, 대화를 비운 뒤 그 문서를 새 대화의 첫 프롬프트로 보냅니다 |
| `/cache` | 상태와 설정을 보여줍니다. 설정 항목은 `ttl 5\|60\|auto`, `guard on\|off`, `big 150k`, `alerts on\|off` 입니다 |

### 식은 캐시 전송 가드

캐시가 만료된 15만 토큰 이상 대화에 메시지를 보내려 하면 먼저 물어봅니다.

- **Send anyway**: 그대로 전송
- **Compact first**: 먼저 압축
- **Cancel**: 취소

짧은 새 대화는 거대한 대화보다 훨씬 싸기 때문에, 대화가 커졌다면 `/handoff` 로 넘어가는 편이 유리합니다.

> 💡 표시되는 가격은 Claude API 가격표 기준입니다. 구독 플랜에서는 청구 금액이 아니라 한도 대비 사용량으로 나타납니다.

---

## 3. Recording Mode: 녹화 중 민감 정보 가리기

화면을 녹화하거나 공유하기 전에 `/rec` 을 실행합니다. 3초 안에 열려 있는 모든 대화에 적용되고, `/rec off` 로 전체를 끕니다.

### 하는 일

- **화면에서 가리기**: API 키와 토큰, 프로젝트 폴더와 상위 폴더의 `.env` 값 전체, 이메일, 이름, 전화번호, 주소, 카드·계좌·신분증 번호, 금액, 사업 용어(매출, 마진, 급여 등) 옆의 수치를 가립니다. `/rec strict` 는 큰 숫자와 퍼센트까지 모두 가립니다.
- **결과 통째로 숨기기**: 메일, 채팅, 작업, 캘린더, 파일, CRM, 재무 도구의 결과를 화면에서 숨깁니다. Claude는 실제 결과를 그대로 받고, 화면에 그려지는 내용만 달라집니다.
- **파일 열기 차단**: `.env`, 자격 증명, SSH·클라우드 키, Claude 메모리 폴더, 재무 문서(급여, 청구서, 계약서, 예산, 전망, 세무 파일)를 열지 못하게 합니다. QuickBooks 같은 재무 도구도 막히고, Claude에게도 녹화 중에는 열 수 없다고 알려줍니다.
- **Claude에게 알리기**: 프롬프트마다 이름, 수치, 내부 계획을 답변에 넣지 말라는 숨은 메모가 붙습니다.
- **빨간 ● REC 표시**: 켜져 있는 동안 프롬프트 위와 푸터에 표시됩니다.

### `/rec config` 로 내 환경에 맞추기

`/rec config` 를 실행하면 `~/.claude/mods-data/recording-mode/config.json` 이 만들어집니다.

```json
{
  "keepNames": ["Your Name"],
  "names": ["A Teammate", "A Client"],
  "privatePaths": ["clients/", "finance/", "my-private-notes.md"],
  "businessTools": [],
  "closedTools": []
}
```

| 항목 | 설명 |
|---|---|
| `keepNames` | 녹화 중에도 그대로 보여줄 이름(본인 이름, 브랜드명) |
| `names` | 항상 가릴 사람 이름. 이메일과 연락처 필드에 있는 이름은 자동으로 잡힙니다 |
| `privatePaths` | 녹화 중 Claude가 열 수 없는 폴더나 파일 이름. 경로 일부만 일치해도 되고 대소문자를 가리지 않습니다 |
| `businessTools` | 결과를 숨김 처리할 도구·명령 이름 추가 |
| `closedTools` | 녹화 중 Claude가 호출할 수 없는 도구 이름 추가 |

파일을 저장한 뒤 `/rec` 을 다시 실행하면 적용됩니다.

### 한계

- 바뀌는 것은 **화면에 그려지는 내용**과 **Claude가 열 수 있는 파일**입니다. 저장되는 내용은 그대로입니다.
- 패턴 기반 마스킹이라 평문으로 풀어 쓴 내용까지 전부 잡지는 못합니다. 공개 전에 녹화본을 직접 확인해야 합니다.
- 데스크톱 앱 사이드바의 대화 제목은 mod로 가릴 수 없습니다.

---

## 4. Goal Meter: `/goal` 진행률 보기

평소처럼 `/goal <완료 조건>` 을 입력합니다. Claude가 먼저 Goal Meter의 작업 도구로 계획을 쓰고, 모든 작업에 S·M·L 크기를 매긴 뒤, 작업을 시작하고 끝낼 때마다 표시합니다.

### 화면 표시

- **프롬프트 위**: `5 of 8 tasks · 69%` 와 진행 막대, `38m elapsed · about 17m left (≈3:40pm) · plan grew 7 → 8 · 1 agent running` 같은 요약, 최근 끝난 작업, 지금 실행 중인 작업과 담당 에이전트, 다음 작업, 목표 점검이 마지막으로 남긴 "아직 미달" 사유가 나옵니다. `g` 를 누르면 전체 목록을 볼 수 있습니다.
- **푸터**: `◎ goal 69% · ~17m`. 프롬프트 위 줄을 숨겨도 보입니다.

### 퍼센트와 예상 시간 계산 방식

- 퍼센트는 계획 대비 끝난 작업량입니다. S, M, L 작업은 각각 1, 2, 3으로 계산합니다.
- 예상 시간은 해당 목표의 지금까지 속도를 기준으로 하고, 작업 2개가 끝난 뒤부터 표시됩니다.
- Claude가 할 일을 더 찾으면 계획이 늘어나고, 그만큼 막대가 뒤로 물러날 수 있습니다.

### 명령어

| 명령어 | 설명 |
|---|---|
| `/goals` | 이 대화의 전체 작업 목록과, 최근 12시간 동안의 다른 대화 목표를 모두 보여줍니다 |
| `/goals hide\|show` | 프롬프트 위 줄을 숨기거나 보여줍니다 |
| `/goals strict on` | 계획이 만들어지기 전에는 목표 안에서 파일을 수정하지 못하게 합니다 |
| `/goals clear` | 목표 계획을 지웁니다 |

Claude에게 추가 요청을 보내지 않습니다. Claude가 호출하는 작업 도구는 목표당 몇 번의 작은 호출뿐입니다. `/goal` 없이 Claude가 만든 계획도 같은 방식으로 표시됩니다.

---

## 5. Collision Guard: 여러 대화의 파일 충돌 막기

한 프로젝트에서 대화를 여러 개 돌리면 두 대화가 서로 모르는 채로 같은 파일을 고칠 수 있습니다. Collision Guard는 Claude가 파일을 수정하거나 쓰기 전에, 열려 있는 다른 대화가 **최근 30분 안에** 그 파일을 바꿨는지 확인합니다. 바꿨다면 먼저 물어봅니다.

- **Proceed**: 그대로 수정합니다.
- **Move to a worktree**: 이 대화의 작업을 git worktree로 옮겨 두 대화가 같은 파일을 건드리지 않게 합니다. git이 추적하는 파일일 때만 제시됩니다.
- **Cancel**: 파일을 그대로 두고 어떻게 진행할지 사용자에게 묻습니다.

### 명령어

| 명령어 | 설명 |
|---|---|
| `/guard` | 현재 감지하고 있는 내용을 보여줍니다 |
| `/guard off` | 끕니다 |
| `/guard window 60` | 감지 범위를 30분에서 60분으로 바꿉니다 |

각 대화는 자기가 바꾼 파일의 작은 목록만 유지하고, Claude의 프롬프트에는 아무것도 추가하지 않습니다.

---

## 6. 데이터는 어디에 저장되나

모든 데이터는 내 컴퓨터의 `~/.claude/mods-data/` 아래에 남습니다.

- Cache Keeper의 세션 하트비트와 저장된 인수인계 문서
- Recording Mode의 녹화 플래그와 설정
- 각 대화의 목표 계획
- Collision Guard의 파일 목록

mod 자체가 따로 네트워크 요청을 보내지는 않습니다. 예외는 Cache Keeper의 keep-warm 핑으로, `/keepwarm` 이 켜져 있는 동안에만 보내는 작은 모델 요청입니다.

---

## 마치며

네 가지 mod를 상황별로 다시 정리하면 다음과 같습니다.

- 큰 대화를 오래 붙들고 작업한다 → **Cache Keeper**
- 화면을 녹화하거나 공유한다 → **Recording Mode**
- `/goal` 로 긴 작업을 맡긴다 → **Goal Meter**
- 한 프로젝트에서 대화를 여러 개 돌린다 → **Collision Guard**

필요한 것만 골라 설치하면 되고, 라이선스는 MIT입니다. 자세한 내용은 [저장소 README](https://github.com/nateherkai/claude-code-mods)에서 확인할 수 있습니다.
