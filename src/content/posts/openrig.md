---
title: "OpenRig: Claude Code와 Codex를 한 팀으로 묶어 굴리는 에이전트 팀 도구"
description: "AI 코딩 에이전트를 rig(팀)와 seat(자리)로 조직하는 OpenRig의 개념, 설치, 역할별 모델 팀 구성, 주요 명령과 Tailscale·ntfy를 이용한 원격 운용까지"
date: 2026-11-14T12:00:00.000Z
tags: ["AI", "claude", "agent", "tmux"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/openrig-cover.png"
---

## 들어가며

Claude Code나 Codex를 여러 개 띄워 두면 터미널 창이 금세 늘어납니다. 어느 창이 무슨 일을 맡았는지, 재부팅하면 어떻게 되살리는지, 한 에이전트가 끝낸 일을 다음 에이전트에게 어떻게 넘기는지를 전부 사람이 기억해야 합니다.

[OpenRig](https://openrig.dev)는 이 문제를 겨냥한 오픈소스 도구입니다. 에이전트마다 자리와 역할을 정하고, 일감을 넘기는 길을 만들고, 팀 전체를 껐다가 그대로 다시 켤 수 있게 합니다. 이 글은 [GitHub 저장소(mvschwarz/openrig)](https://github.com/mvschwarz/openrig)의 README·문서와 유튜브 강의 *OpenRig · Herdr · RustDesk로 AI 에이전트 팀 굴리기*(업로더 단테)를 바탕으로 정리했습니다. 두 자료가 다르면 저장소를 기준으로 삼고 차이를 따로 적었습니다.

| 항목 | 내용 |
|---|---|
| **정체** | 여러 코딩 에이전트를 팀으로 조직·운영하는 오픈소스 도구 (Apache 2.0) |
| **저장소** | `mvschwarz/openrig` (npm 패키지 `@openrig/cli`) |
| **지원 에이전트** | Claude Code, Codex (Pi·Oh My Pi도 런타임으로 언급됨) |
| **지원 환경** | macOS, Linux, Windows는 WSL2 (네이티브 Windows는 미지원) |
| **필요한 것** | Node.js 22 또는 24, tmux, 로그인된 Claude Code 또는 Codex 계정 |

> ⚠️ 이 글을 쓸 때 확인한 최신 릴리스는 v0.7.15이고, 강의는 0.7.4 기준으로 촬영됐습니다. 아직 빠르게 바뀌는 프로젝트라 명령과 옵션은 설치한 버전의 `--help`로 한 번 더 확인하세요.

---

## 1. OpenRig는 무엇이고 어떤 문제를 푸나

저장소 README는 이렇게 설명합니다. "하네스(harness)가 모델을 감싼다면, rig는 하네스들을 감싼다." Claude Code나 Codex 같은 에이전트 하나가 하네스이고, 그 에이전트 여러 개를 한 시스템으로 묶는 것이 rig입니다. OpenRig가 관리하는 대상은 에이전트 자체가 아니라, 에이전트들이 이루는 **팀**입니다. 어떤 세션이 돌고 있는지, 서로 어떤 관계인지, 재부팅 뒤 어떻게 복구하는지, 터미널이 난립하지 않게 하는 방법이 모두 여기에 속합니다.

README가 꼽는 주요 기능은 다음과 같습니다.

- **정의**: 팀 구조를 YAML(RigSpec)로 적습니다.
- **기동**: `rig up` 하나로 tmux 세션, 하네스, 시작 파일, 준비 확인까지 올립니다.
- **관찰**: TUI에서 팀·자리·상태를 그래프와 표로 봅니다.
- **스냅숏**: `rig down --snapshot`으로 팀 상태를 저장하고 `rig up <이름>`으로 복원합니다.
- **소통**: `rig send`, `rig broadcast`, `rig chatroom`으로 에이전트끼리, 또는 사람이 에이전트에게 말합니다.
- **확장**: 돌아가는 팀을 `rig grow`, `rig shrink` 등으로 바꿉니다.

### 핵심 용어

| 용어 | 뜻 |
|---|---|
| **rig** | 에이전트 팀 하나. 강의에서 실습용 팀 이름도 `culture`처럼 rig 이름입니다. |
| **seat(자리)** | 팀 안의 안정적인 역할과 주소. 예: `dev-build@starter`(자리`@`팀). 자리를 채운 대화는 바뀌어도 자리의 정체성과 작성된 맥락은 유지됩니다. |
| **pod** | 관련된 자리들의 묶음. 가이드와 맥락을 공유하지만 에이전트마다 컨텍스트 창은 따로 갖습니다. |
| **RigSpec** | 팀을 선언하는 YAML. pod, member, edge, 연속성 정책, culture 파일을 담습니다. |
| **AgentSpec** | 스킬·지침·훅·시작 규약을 담은 재사용 가능한 에이전트 설계도. |
| **kernel** | OpenRig가 기본으로 띄우는 관리 팀. 사용자가 말을 거는 **operator**(운영자)와 advisor(조언자) 같은 에이전트가 들어 있습니다. |
| **daemon** | 화면 없이 뒤에서 도는 프로그램. `rig` 명령은 모두 이 데몬에게 요청하는 것이라, 꺼져 있으면 아무것도 되지 않습니다. |

### Ghostty · Herdr · OpenRig는 서로 다른 층

영상은 처음 보면 헷갈리는 세 도구를 건물 층에 비유합니다.

| 층 | 도구 | 역할 |
|---|---|---|
| 3층 | **OpenRig** | 팀을 꾸리고, 자리와 역할을 정하고, 일감을 넘깁니다. |
| 2층 | **Herdr** (없으면 tmux) | 창을 여러 칸으로 나눠 에이전트를 한 칸씩 앉히고, 터미널 앱을 닫아도 에이전트가 계속 돌게 합니다. |
| 1층 | **Ghostty** 등 터미널 앱 | 글자를 화면에 그립니다. 바꿔 끼울 수 있고 필수도 아닙니다. |

영상이 짚은 오해 세 가지는 "Herdr만 있으면 OpenRig는 필요 없다"(Herdr는 칸만 나눌 뿐 어느 칸이 무슨 일을 맡았는지 모릅니다), "OpenRig가 터미널이다"(혼자서는 글자를 못 보여 줍니다), "Ghostty가 꼭 필요하다"(설치를 권할 뿐입니다)입니다. 저장소도 같은 구조입니다. OpenRig는 로컬 데몬 + CLI + TUI + MCP 서버이고, tmux 위에서 동작하며, 자리마다 attach할 수 있는 tmux 세션이 하나씩 있습니다. Herdr가 설치돼 있으면 팀의 터미널을 한 화면에 모아 보여 줍니다.

---

## 2. 팀 구성: 역할별로 모델을 달리 쓰기

강의의 실습 팀은 자리 네 개입니다. 같은 모델을 모든 자리에 쓰지 않고 역할에 맞춰 나눴습니다.

| 자리 | 런타임·모델 | 맡은 일 |
|---|---|---|
| `lead` | Claude Code · Opus | 기획, 화면 설계, 일 나누기, 최종 판단 |
| `research` | Claude Code · Haiku | 범위가 분명하고 자료를 많이 읽는 조사 |
| `build` | Claude Code · Sonnet | 설계서대로 구현과 테스트 |
| `review` | Codex (기본 모델) | 독립 리뷰 |

영상이 드는 이유는 두 가지입니다.

1. **교차 리뷰**: 자기가 짠 코드를 자기가 채점하면 후해지기 쉬워서, 구현한 모델과 다른 회사의 모델(Codex)에게 리뷰를 맡깁니다.
2. **비용**: 모든 일을 가장 비싼 모델에 맡길 필요가 없습니다. 영상이 인용한 Anthropic 공식 가격표(입력, 100만 토큰 기준)는 Opus 4달러, Sonnet 2달러, Haiku 0.1달러였습니다. 다만 Haiku는 한 번에 10만 토큰을 넘게 넣으면 값이 5배가 된다는 한계도 함께 언급합니다. Codex는 OpenAI 쪽 구독·사용량으로 따로 계산되니 두 회사 계정이 모두 필요합니다.

팀은 `rig.yaml` 하나로 정의됩니다. 영상에서 본 구조를 풀어 쓰면 다음과 같습니다(실제 파일은 아니고 구조 설명입니다).

- 자리마다 `id`, `runtime`(`claude-code` 또는 `codex`), `model`, `cwd`(일할 폴더), 권한 정책을 적습니다. `review`처럼 `model` 줄이 없으면 그 런타임의 기본 모델을 씁니다.
- `edges`에 누가 누구에게 일을 넘기는지 적습니다. 영상의 팀은 lead가 research·build·review에게 일을 맡기고, build와 review는 서로 협업하는 구조였습니다.
- 자리마다 `agents/<자리>/` 폴더에 `agent.yaml`과 `role.md`가 있고, 자리가 뜰 때 `role.md`를 먼저 읽습니다. 예컨대 research의 `role.md`는 출처·확인 날짜·사실과 추론·불확실한 점을 구분해 전하라고 요구합니다.
- 팀이 일하는 태도를 적은 `CULTURE.md`도 함께 생깁니다.

이 파일은 사용자가 직접 써도 되지만, 영상에서는 kernel의 operator에게 말로 부탁해 만들었고 사람이 고쳐도 됩니다. `model` 한 줄만 바꾸면 그 자리의 모델이 바뀝니다.

### 저장소가 제공하는 기본 팀

저장소 README에는 세 가지 기본 팀이 있고, kernel의 operator가 무엇을 만들고 싶은지 묻고 그중 하나를 추천해 줍니다.

| 팀 | 말을 거는 자리 | 구성과 용도 |
|---|---|---|
| `starter` | `dev-build@starter` | Claude Code 빌더와 Codex 리뷰어. 범위가 분명한 변경 하나 |
| `workshop` | `orch-lead@workshop` | 리드, 빌더, QA, 리뷰어. 한 저장소의 지속 작업 (rig 번들로 설치) |
| `factory` | `orch-lead@factory` | 리드, 조언자, 빌드, QA, 디자인, 독립 리뷰어 둘 등 7개 자리 |

`starter`는 기본적으로 Claude Code와 Codex를 모두 씁니다. 둘 중 하나만 있다면 kernel operator에게 그 환경에 맞춰 팀을 고쳐 달라고 하면 됩니다. `rig specs ls`로 내장 팀 목록을 볼 수 있습니다.

---

## 3. 설치와 지원 환경

### 필요한 것

- Node.js 22 또는 24 (저장소는 Apple silicon Mac에서 22를 권장. 영상에서는 24에서도 잘 돌았다고 합니다)
- tmux (없으면 `rig setup`이 설치를 시도)
- macOS 또는 Linux. Windows는 **WSL2** 안에 Linux를 깔고 그 안에 설치합니다. 네이티브 Windows는 지원하지 않고, 저장소 문서에 따르면 자동 테스트도 아직 WSL2에서는 돌지 않습니다.
- 로그인된 Claude Code 또는 Codex (하나만 있어도 시작 가능)

### 직접 설치하기

영상과 저장소가 공통으로 보여 주는 단계식 설치입니다.

```bash
npm install -g @openrig/cli
rig --version
rig setup --dry-run
```

`rig setup`은 OpenRig가 쓰는 도구를 설치하고 Claude Code·Codex 설정에 자기 내용을 쓰는 명령이라, 영상은 `--dry-run`으로 무엇을 바꾸는지 먼저 확인하라고 거듭 권합니다. 저장소가 밝히는 변경 내용은 다음과 같습니다.

- `~/.tmux.conf`에 OpenRig 블록 추가, tmux 설치 시도(macOS는 Homebrew), 기본값으로 Herdr 설치(`--no-herdr`로 거절)
- Claude Code·Codex의 신뢰 설정과 활동 훅, 발견용 스킬 추가
- 팀을 시작하면 프로젝트의 `CLAUDE.md`·`AGENTS.md`에 관리 지침 추가
- 저장소는 "첫 사용 전에 관련 파일을 백업해 두라"고 안내합니다.

사용할 에이전트를 지정하려면 `rig setup --providers claude` 또는 `--providers codex`처럼 씁니다. 그 뒤 로그인이 안 돼 있다면 `claude auth login`, `codex login`으로 한 번 로그인합니다.

### 에이전트에게 설치를 맡기는 방법 (저장소의 새 권장 경로)

최신 README는 코딩 에이전트에게 설치를 맡기는 길을 먼저 소개합니다. 프로젝트 폴더에서 `rigs` 스킬을 추가한 뒤 Claude Code에서는 `/rigs`, Codex에서는 `$rigs`를 입력하고 만들고 싶은 것을 말하면, 에이전트가 실행할 내용을 먼저 알려 주고 OpenRig를 설치해 operator와 연결해 줍니다.

```bash
# Claude Code
npx skills add https://github.com/mvschwarz/openrig/tree/v0.7.12/skills/rigs --skill rigs --agent claude-code
# Codex
npx skills add https://github.com/mvschwarz/openrig/tree/v0.7.12/skills/rigs --skill rigs --agent codex
```

`curl ... install.sh | sh` 방식의 한 줄 설치 스크립트도 있고, 먼저 `--dry-run`으로 계획만 볼 수 있습니다. 위 URL의 태그는 README에 적힌 `v0.7.12`이므로, 자신의 `rig --version`과 맞는 태그를 쓰라는 것이 저장소의 안내입니다.

---

## 4. 주요 명령 한눈에 보기

아래는 저장소 CLI 레퍼런스나 영상에서 실제로 쓰인 것만 추렸습니다.

| 하는 일 | 명령 |
|---|---|
| 데몬 켜기·상태·끄기 | `rig daemon start` / `status` / `stop` |
| 전체 상태 보기 | `rig status`, `rig ps` |
| 자리 단위로 보기 | `rig ps --nodes`, `rig ps --nodes --rig <팀>` |
| 팀 파일 검사 | `rig spec validate <rig.yaml 경로>` |
| 팀 띄우기 (미리보기 → 실제) | `rig up <팀 또는 파일> --plan` → `rig up <팀 또는 파일>` |
| 팀 끄기 (상태 저장) | `rig down <팀> --snapshot` |
| 저장한 상태로 다시 켜기 | `rig up <팀> --existing` |
| 스냅숏 목록 | `rig snapshot list <팀>` |
| 에이전트에게 말 걸기 | `rig send <자리>@<팀> "내용"` |
| 에이전트 화면 읽기(읽기 전용) | `rig capture <자리>@<팀> --lines <n>` |
| 한 화면에 모아 보기 | `rig terminal open <팀> --provider herdr` |
| 막힌 자리 이어 가기 | `rig seat continue <자리>` |
| 데몬과 팀을 한 번에 되살리기 | `rig start` |
| 환경 점검 | `rig doctor` |
| 내장 팀·스펙 목록 | `rig specs ls --kind rig` |
| 웹 화면 열기 | `rig ui open` (영상 기준 실험 단계) |
| 일감 큐 조작 | `rig queue show`, `claim`, `update`, `handoff` 등 |

`rig send`는 그 자리의 터미널에 사용자 대신 글을 입력해 주는 명령이라 가장 자주 씁니다. 자리 이름은 `rig ps --nodes`의 SESSION 칸에 나온 것을 그대로 씁니다. 사람이 직접 들여다보고 싶으면 `tmux attach -t <세션>`으로 붙고, `Ctrl+B` 다음 `d`로 빠져나옵니다. 창을 닫는 것이 아니라 떼어 놓는 것이라 자리는 계속 돕니다.

---

## 5. 사용 흐름: 앱 하나를 팀에 맡기기

영상은 서울시 문화행사 데이터로 행사 찾기 앱(구·날짜·무료 여부 필터)을 완성하는 실습으로 흐름을 보여 줍니다.

### 5-1. 데몬 켜고 상태 확인

```bash
rig daemon start
rig status
rig ps --nodes --rig kernel
```

데몬을 켜면 kernel도 함께 뜹니다(완전히 준비되기까지 20초쯤 걸렸고, 처음에는 `partial ready`로 보일 수 있습니다). `rig ps --nodes`의 ATTN이 yes면 사람 손이 필요해 멈췄다는 뜻이고, 영상에서는 Codex 로그인 대기가 원인이었습니다. 이때는 해당 자리에 attach해 로그인하거나 훅 신뢰 질문에 답한 뒤 `rig seat continue`를 입력합니다.

### 5-2. 팀 만들기

kernel의 operator에게 말로 부탁합니다.

```bash
rig send operator-agent@kernel "…rigs/culture/rig.yaml에 lead(opus), research(haiku), build(sonnet), review(codex) 네 자리를 만들어 줘…"
rig capture operator-agent@kernel --lines 26
```

팀 파일이 생기면 먼저 검사하고 미리보기로 확인한 다음 띄웁니다.

```bash
rig spec validate rigs/culture/rig.yaml
rig up rigs/culture/rig.yaml --plan
rig up rigs/culture/rig.yaml
rig ps --nodes
```

`rig ps --nodes`의 Model 줄은 설정한 모델과 실제로 응답한 모델을 함께 보여 줍니다. 영상에서는 네 자리가 각각 Opus 5.5, Sonnet 5.5, Haiku 5.5, Codex(gpt 6.1 sol)로 확인됐습니다. 그 팀 파일을 저장소에 올려 두면 누구든 같은 팀을 똑같이 띄울 수 있습니다.

### 5-3. 한 화면에 팀 띄우기

```bash
herdr
rig terminal open culture --provider herdr
```

Herdr 안에서 자리 네 개가 타일로 열립니다. rig가 팀을 관리하고, Herdr는 그 자리들을 한 화면에 모아 보고 말을 거는 창입니다.

### 5-4. 리드에게만 일을 맡기기

리드에게 앱 전체를 맡기되 누가 무엇을 할지까지 적어 줍니다. 영상은 조사는 research, 화면 설계는 lead, 구현은 build, 리뷰는 review로 나누고, 결과는 `docs/`에 파일로 남기고 끝나면 human-gate 일감으로 알리게 했습니다. 일의 흐름은 다음과 같았습니다.

1. **research(Haiku)**: 데이터를 직접 세어 `docs/research.md`를 씁니다. 추측하지 않고 사실·추론·불확실을 구분하며, 판단은 리드에게 넘깁니다.
2. **lead(Opus)**: 조사 결과를 믿지 않고 수치를 직접 다시 계산한 뒤 `docs/design.md`에 완료 조건, 검증 기준, 애매한 데이터 처리 규칙을 정합니다.
3. **build(Sonnet)**: 일감을 `rig queue show`로 읽고 `rig queue claim`으로 맡아 구현·테스트합니다. 끝나면 `rig queue handoff`로 review에게 넘기고, 확인하지 못한 것을 보고에 적습니다.
4. **review(Codex)**: 테스트를 직접 다시 돌리고, 일부러 서버 실패를 만들고, XSS 입력까지 시도한 뒤 `docs/review.md`에 근거와 한계를 남깁니다.
5. **lead**: 보고 전에 자기도 한 번 더 확인하고, 커밋 여부 같은 결정은 사람에게 남깁니다.

이렇게 일의 결과가 파일과 큐에 남기 때문에, 에이전트가 바뀌어도 다음 자리가 그 파일을 읽고 이어서 일합니다.

### 5-5. 끄고 다시 켜기

```bash
rig down culture --snapshot
rig up culture --existing
rig snapshot list culture
```

스냅숏에는 어떤 자리가 있고 자리마다 어떤 대화를 하던 중이었는지가 담기고, OpenRig 데이터베이스(홈의 `.openrig`)에 저장됩니다. 영상 기준으로 데몬도 5분마다 자동 스냅숏을 남깁니다. 복원 결과는 자리별로 resumed 등으로 표시됩니다(저장소 README는 resumed, fresh-primed, awaiting-decision, attention_required, failed를 구분합니다).

### 저장소의 첫 사용 안내(starter)

저장소 README의 수동 경로는 다음과 같습니다. 팀 파일을 직접 만들지 않고 내장 `starter`를 쓰는 방법입니다.

```bash
cd /path/to/your/repository
rig specs preview starter --kind rig
rig up starter --cwd . --plan
rig up starter --cwd .
rig ps --nodes --rig starter
rig send dev-build@starter '<한 가지 변경 요청>…'
```

README는 메시지를 보내는 것만으로는 큐 항목이 생기지 않고 빌더가 작업을 기록한다고 설명하며, 사람은 최종 결과물과 리뷰 결과를 읽고 같은 빌더에게 다음 변경을 맡기라고 안내합니다.

---

## 6. 원격 운용: 밖에서 일을 맡기고 알림 받기

강의의 목표 장면은 "공원 벤치에서 폰으로 집 맥의 에이전트 팀에게 일을 맡기고, 끝나면 알림을 받는 것"입니다.

### 원격은 두 종류로 나눠 생각하기

| 구분 | 도구 | 특징 |
|---|---|---|
| **글자 원격** | SSH, `rig send`, `rig capture` | 가볍고, 연결이 끊겨도 에이전트는 맥의 tmux·Herdr 세션에서 계속 돕니다. 일을 맡기고 진행을 보고 알림을 받기에 충분합니다. |
| **화면 원격** | RustDesk | 로그인 창, macOS 권한 창, 에이전트가 만든 앱 화면처럼 터미널로 못 보는 것을 직접 눌러 봅니다. 무겁고 맥 전체가 열립니다. |

영상의 원칙은 "기본은 글자, 필요할 때만 화면"입니다. Claude Code의 Remote Control은 이름이 비슷하지만 맥 화면이 아니라 Claude Code 대화를 폰에서 이어 가는 기능이라고 구분합니다.

### Tailscale: 인터넷에 문을 열지 않는 통로

Tailscale은 같은 계정으로 로그인한 기기들이 하나의 사설망(tailnet)을 이루게 합니다. 기기마다 `100.`으로 시작하는 주소와 이름이 붙고, 연결은 WireGuard로 암호화됩니다. 공유기 포트를 열지 않고도 밖에서 내 맥에 들어올 수 있습니다.

```bash
tailscale status
tailscale ip -4
tailscale ping <기기 이름>
ssh <기기 이름>
```

OpenRig 데몬은 기본적으로 **자기 자신(127.0.0.1)과 Tailscale 주소에서만** 요청을 받습니다. 저장소 문서의 기본 바인딩은 `127.0.0.1:7433`이고, 영상에서는 `curl`로 `/healthz`의 `bind` 항목을 보여 주며 Tailscale을 자동 감지한다(`tailscaleDetected: true`)고 확인했습니다. 같은 집 와이파이 주소로는 연결이 거절되고, 낯선 `Host` 헤더로 접근하면 `untrusted_host`로 거절됩니다. 다른 이름이 꼭 필요하면 `OPENRIG_ALLOWED_HOSTS`에 적고 데몬을 다시 켭니다.

### 원격 호스트 등록과 ntfy 알림

원격 기기에도 같은 버전의 `rig`를 설치하고, 데몬과 에이전트는 띄우지 않은 채 리모컨처럼 씁니다.

```bash
rig host add --id studio --transport http --url http://<tailscale 이름>:<데몬 포트>
rig ps --host studio
rig send dev-build@starter@studio "…"
rig capture dev-build@starter@studio --lines 30
```

원격에서는 `rig ps` 같은 명령에 `--host studio`를 붙이고, `rig send`·`rig capture`는 자리 이름 뒤에 `@studio`를 한 번 더 붙입니다.

알림은 ntfy(무료 알림 서비스)로 받습니다. 저장소 아키텍처 문서에 따르면 `OPENRIG_NOTIFICATIONS_MECHANISM`(`ntfy`, `webhook`, `none`, 기본 `none`)과 `OPENRIG_NOTIFICATIONS_TARGET`(ntfy 토픽 주소)을 정하고 데몬을 다시 켜면 됩니다. 영상에서도 환경 변수 두 개를 정하고 데몬을 재시작했습니다. 토픽은 이름을 아는 사람이면 누구나 볼 수 있는 우체통 같은 것이라 뒤에 무작위 글자를 붙이라고 합니다. 폰에서는 ntfy 앱에서 그 토픽을 구독하고(계정 불필요), Tailscale 앱에 같은 계정으로 로그인한 뒤 SSH 앱으로 맥에 들어가 `rig` 명령을 쓰면 됩니다.

### human-gate: 사람이 정할 일은 사람에게

human-gate는 사람이 확인해야 할 일을 사람 자리로 넘기는 일감입니다. 알림을 실제로 받으려면 사람이 등록돼 있어야 하고, 영상에서는 등록 전이라 큐에만 쌓이고 알림은 가지 않는다는 안내가 나왔습니다. 저장소 문서에 따르면 사람은 `rig gateway human add`로 등록합니다. 영상에서는 빌더가 human-gate로 보고하면서 커밋과 push는 하지 않고 사람에게 결정을 남겼습니다.

### RustDesk: 화면이 꼭 필요할 때

RustDesk는 무료 오픈소스 원격 데스크톱입니다. 영상의 핵심 내용은 다음과 같습니다.

- 화면을 내주는 맥에는 **화면 및 시스템 오디오 녹화**와 **손쉬운 사용** 권한이 필요하고, 켠 뒤에는 RustDesk를 한 번 종료했다가 다시 열어야 합니다. 안 하면 연결은 되는데 화면이 검게 나옵니다.
- ID로 연결하면 RustDesk 공개 서버가 두 기기를 이어 줍니다. 두 기기가 이미 Tailscale로 묶여 있으면 상대의 Tailscale 주소를 입력해 바깥 서버 없이 직접 연결할 수 있습니다(포트 21118). 이때는 화면을 내주는 쪽에서 **직접 IP 액세스 허용**을 켜야 합니다.
- 직접 IP 연결은 RustDesk 자체 암호화가 적용되지 않는다는 표시(빨간 방패)가 뜹니다. 반드시 Tailscale 같은 암호화된 통로 안에서만 쓰고, IP 화이트리스트에는 보는 쪽 기기의 Tailscale 주소만 넣으라고 합니다.
- 집을 비울 때는 수락해 줄 사람이 없으니 길고 다른 곳에서 안 쓰는 영구 비밀번호를 정해 둡니다.
- 도구 모음의 동작 메뉴에서 파일 전송도 됩니다.
- 개인 맥 한두 대라면 서버가 필요 없고, 여러 대를 관리하는 회사 환경에서는 hbbs(ID 서버)와 hbbr(중계 서버)를 직접 운영하는 셀프 호스팅을 고려하라고 합니다.

---

## 7. 영상의 핵심 팁과 주의점

**자리를 비우기 전에**

- **알림을 켠다**: ntfy 환경 변수를 정하고 데몬을 재시작합니다.
- **허락 질문에 멈추지 않게 한다**: 영상에서는 빌더 자리에 attach해 `Shift+Tab`으로 Claude Code를 auto mode로 바꿨습니다. Codex 자리는 바꾸지 않아 중간에 허락 질문이 한 번 나왔고, 맥에서 직접 승인해야 했습니다.
- **맥이 잠들지 않게 한다**: 외부에서 아무리 불러도 대답이 없을 때 가장 흔한 원인은 맥의 잠자기입니다. 에이전트 맥은 전원에 꽂아 잠자기를 끈 데스크톱이 좋고, 노트북은 금방 잠들어 팀이 멈출 수 있습니다. `pmset -g custom`으로 설정을 보고, 잠시 깨워 둘 때는 `caffeinate -dims`(시간은 `-t`)를 씁니다. 정전 뒤 자동 시작(autorestart)을 켜 두면 좋다고도 합니다.

**보안**

- **공개 인터넷에 열지 않는다**: 에이전트는 내 컴퓨터에서 명령을 실행하므로, 포트를 공개 인터넷에 여는 것은 위험합니다. Tailscale 안에서만 씁니다. 처음 설정에서는 같은 계정의 기기끼리 서로 다 닿으므로, 기기를 공유하거나 여러 사람이 있는 tailnet이면 Tailscale의 Access controls에서 OpenRig 포트를 막는 규칙을 적으라고 합니다.
- **권한 우회는 격리된 환경에서만**: 영상의 팀은 모든 자리를 권한 우회(`builtin yolo`) 정책으로 띄웠습니다. 저장소 문서에 따르면 YOLO는 기본값이 아니며 명시적으로 선택했을 때만 켜집니다. 영상도 이 설정은 실습처럼 따로 떼어 놓은 폴더와 계정에서만 쓰라고 경고합니다.

**human-gate 원칙**

- 커밋·push·공개처럼 되돌리기 어려운 결정은 사람이 합니다. 에이전트가 human-gate로 물어 오면 커밋할지, 리뷰를 더 맡길지를 사람이 고릅니다.
- 에이전트의 보고를 그대로 믿지 않는 구조가 중요합니다. 리드는 수치를 다시 세고, 리뷰어는 테스트를 다시 돌리고, 보고에는 확인하지 못한 것도 적게 합니다.

---

## 8. 문제 해결

영상은 아래 순서로 점검하라고 합니다.

1. **맥이 잠들었는지**: `pmset -g custom`으로 sleep 설정을 확인합니다. 가장 흔한 원인입니다.
2. **데몬이 꺼졌는지**: `rig daemon status`로 보고, `rig ps`가 `Daemon not running`을 내면 `rig start`가 가장 편합니다. 데몬을 켜고 kernel 준비를 확인하고 꺼지기 전에 돌던 팀을 되살립니다. 재부팅으로 tmux까지 사라졌다면 `rig up <팀> --existing`을 안내합니다.
3. **기기가 Tailscale로 닿는지**: `tailscale ping`으로 확인하고, 꺼진 쪽의 Tailscale 앱을 켭니다.
4. **그래도 모르겠으면 `rig doctor`**: 필요한 도구, 로그인, 포트를 점검합니다. 실패 항목에는 Why(왜 문제인지)와 Fix(어떻게 고치는지)가 붙고, WARN은 꼭 필요하지 않은 도구가 없다는 알림이라 넘어가도 됩니다.

자주 마주치는 증상은 다음과 같습니다.

| 증상 | 확인할 것 |
|---|---|
| OpenRig 데몬에 연결할 수 없다는 오류 | 데몬이 꺼진 것. `rig daemon start` |
| `Session not found` | 데몬은 켜졌는데 해당 자리가 없음. `rig start`, kernel만이면 `rig up kernel --existing` |
| `rig ps`의 ATTN이 yes | 로그인·훅 신뢰 질문 등으로 멈춤. 해당 자리에 attach해 해결한 뒤 `rig seat continue` |
| RustDesk 연결은 됐는데 화면이 검다 | 화면 녹화 권한을 켠 뒤 앱을 다시 열었는지 확인 |
| RustDesk 화면은 보이는데 클릭·타자가 안 된다 | 손쉬운 사용 권한 확인 |

저장소의 `docs/reference/help.md`도 `rig --version`과 `rig doctor --json`을 먼저 확인하라고 안내합니다. 이 문서는 `rig context get help`로도 읽을 수 있습니다. 데몬 로그는 `rig daemon logs`로 봅니다.

---

## 9. 영상과 저장소의 차이

| 항목 | 영상 (0.7.4) | 저장소 (최신 릴리스 v0.7.15) |
|---|---|---|
| 버전 | 0.7.4로 고정 설치 | README 기준 0.7.12 태그 안내, 릴리스는 v0.7.15 |
| 설치 경로 | `npm install -g` 후 `rig setup`, 옵션으로 `--providers`, `--no-ghostty`, `--router-line no` | 에이전트에게 맡기는 `rigs` 스킬과 설치 스크립트가 먼저 소개됨. Herdr는 `--no-herdr`로 거절하고 Ghostty는 에이전트가 제안 후 `--ghostty`로 설치 |
| Ghostty | `rig setup`이 설치를 권함 | macOS에서 설치 에이전트가 한 번 제안 |
| 데몬 포트 | healthz는 7433, `rig host add`의 URL은 7533이라고 발음됨 | 문서상 기본 `127.0.0.1:7433` |
| 시작 | `rig daemon start`, `rig status`로 kernel 확인 | `rig daemon start` 후 `rig terminal open saved:kernel --window`로 kernel TUI와 operator를 함께 열고, `rig tui`는 대시보드 |
| 첫 팀 | 강의용으로 만든 culture 팀 | 내장 `starter`·`workshop`·`factory` 추천 |

포트는 강의 자막이 7533으로 적혀 있지만 저장소 문서의 기본값과 영상 속 `healthz` 호출은 7433이라, 자막 오기이거나 설정에 따라 다를 수 있습니다. 이 글의 `rig host add` 예시는 `<데몬 포트>`로 두었으니 `rig daemon status`에 나오는 값을 쓰세요.

---

## 마치며

OpenRig의 핵심 아이디어는 에이전트를 더 똑똑하게 만드는 것이 아니라 **에이전트들을 조직하는 층**을 따로 두는 것입니다. 자리와 역할을 정하고, 일감과 결과를 큐와 파일에 남기고, 팀 상태를 스냅숏으로 저장해 재부팅 뒤에도 이어 갑니다. 여기에 역할별로 모델을 달리 쓰고(비싼 모델은 판단에, 싼 모델은 조사에), 구현한 모델과 다른 모델이 리뷰하게 하면 비용과 품질을 함께 잡을 수 있다는 것이 영상의 주장입니다.

처음 시도한다면 `rig setup --dry-run`으로 바뀌는 것을 확인하고, 내장 `starter` 팀으로 작은 변경 하나를 맡겨 보세요. 원격 운용은 그다음에 Tailscale 안에서만 열고, 기본은 글자 원격으로 쓰는 것을 권합니다. 다만 아직 0.7.x 단계의 빠르게 바뀌는 프로젝트이고 이 글의 일부 내용은 강의 시점(0.7.4) 기준이므로, 실제로 쓸 때는 설치한 버전의 문서를 기준으로 삼으세요.

### 참고 자료

- [OpenRig 공식 사이트](https://openrig.dev)
- [GitHub: mvschwarz/openrig](https://github.com/mvschwarz/openrig) · [시작 가이드](https://github.com/mvschwarz/openrig/blob/main/docs/reference/getting-started.md) · [도움말](https://github.com/mvschwarz/openrig/blob/main/docs/reference/help.md) · [CLI 레퍼런스](https://github.com/mvschwarz/openrig/blob/main/docs/as-built/cli-reference.md)
- [단테: OpenRig · Herdr · RustDesk로 AI 에이전트 팀 굴리기 (2시간 무료 강의)](https://youtu.be/a_L1-cqXWKI)
