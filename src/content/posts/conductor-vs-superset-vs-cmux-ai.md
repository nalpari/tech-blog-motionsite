---
title: "Conductor vs Superset vs cmux — AI 에이전트 워크플로우 툴 비교"
description: "AI 코딩 에이전트 시대, 나에게 맞는 워크플로우 툴은 무엇인가? 세 가지 도구의 철학과 차이를 낱낱이 비교한다."
date: 2026-03-20T04:23:55.786Z
tags: ["Dev tools"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/conductor-vs-superset-vs-cmux-ai-1773981005840.png"
---

> **읽는 시간:** 약 10분  
> **키워드:** Claude Code · Git Worktree · macOS · AI Agent Tooling

---

## 목차

1. [배경: AI 에이전트 시대의 새로운 문제](#배경-ai-에이전트-시대의-새로운-문제)
2. [Conductor — 에이전트 지휘자](#conductor--에이전트-지휘자)
3. [Superset — 오픈소스 에이전트 오케스트레이터](#superset--오픈소스-에이전트-오케스트레이터)
4. [cmux — AI 시대를 위한 터미널](#cmux--ai-시대를-위한-터미널)
5. [한눈에 비교](#한눈에-비교)
6. [나는 무엇을 선택해야 할까?](#나는-무엇을-선택해야-할까)
7. [마무리](#마무리)

---

![agent tools](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1773980835958-k8newz.png)

## 배경: AI 에이전트 시대의 새로운 문제

Claude Code, OpenAI Codex, Gemini CLI 같은 AI 코딩 에이전트가 일상 도구가 된 지금, 개발자들은 새로운 병목을 경험하기 시작했다. 에이전트 하나를 실행해두고 결과를 기다리는 동안, 나머지 시간이 낭비된다는 것이다.

해결책은 간단해 보인다 — 여러 에이전트를 병렬로 실행하면 된다. 하지만 그게 말처럼 쉽지 않다. 에이전트들이 같은 브랜치에서 충돌을 일으키고, 어떤 에이전트가 뭘 하고 있는지 파악하기 어려우며, 결과를 리뷰하고 머지하는 것도 번거롭다.

> 💡 **핵심 문제:** Git worktree를 직접 구성하고, 여러 터미널 탭을 오가며, 언제 에이전트가 완료됐는지 계속 확인해야 하는 번거로움. 이 문제를 해결하는 세 가지 접근 방식이 등장했다.

2025년 말~2026년 초 사이, 이 문제를 해결하겠다는 툴들이 쏟아지기 시작했다. 그중에서 빠르게 커뮤니티의 주목을 받은 세 가지가 바로 **Conductor**, **Superset**, **cmux**다. 세 툴은 같은 문제를 서로 다른 철학으로 접근한다.

---

## Conductor — 에이전트 지휘자

**🔗 [conductor.build](https://conductor.build)**  
**카테고리:** macOS 네이티브 · Claude Code + Codex · Git Worktree 자동화 · 무료(API 별도)

Conductor는 **"에이전트 팀을 지휘한다"** 는 컨셉에 충실한 툴이다. macOS 네이티브 앱으로, 레포지토리를 추가하면 각 에이전트마다 격리된 Git worktree 워크스페이스를 자동으로 구성해준다.

### 어떻게 동작하나

작동 방식은 단순하다. 레포를 추가 → 에이전트 배포 → 에이전트가 각자 격리된 워크스페이스에서 작업 → 대시보드에서 진행 상황 모니터링 → 결과 리뷰 후 머지. Claude Code나 Codex를 이미 구독하고 있다면, Conductor는 그 인증 정보를 그대로 사용한다. 별도 비용이 없다는 뜻이다.

**주요 기능:**
- 각 에이전트마다 자동으로 Git worktree 생성 — 충돌 없이 격리된 환경
- 대시보드에서 여러 에이전트의 작업 현황 한눈에 파악
- 코드 변경 사항 리뷰 및 머지 UI 내장
- Claude Code + OpenAI Codex 지원
- Linear, Vercel, Stripe 등 실제 기업 개발자들이 신뢰

### Conductor의 철학

Conductor의 핵심 가치는 **"아름다운 GUI로 복잡성을 숨긴다"** 는 것이다. Git worktree를 직접 건드릴 필요 없이, 앱이 모든 것을 처리한다. 에이전트 상태를 한 화면에서 보고, 클릭 몇 번으로 머지까지 완료할 수 있다.

> "If you want to run multiple Claude Code agents at the same time, use Conductor. Beautiful UI and handles all the git worktree stuff for you!"  
> — Ian Nuttall, serial internet biz builder

> "I've been using Conductor every day for a while now and it's the future. The last time I felt this strongly about a developer tool was Vercel and Supabase."  
> — Zach Blume, Software Engineer @ Stripe

### 아쉬운 점

현재 Claude Code와 Codex만 지원한다. Gemini CLI, OpenCode, Cursor 에이전트 등 다른 CLI 기반 에이전트를 사용한다면 선택지에서 빠진다. 에이전트 생태계가 빠르게 확장되고 있는 지금, 이 제한이 아쉽다.

---

## Superset — 오픈소스 에이전트 오케스트레이터

**🔗 [superset.sh](https://superset.sh)**  
**카테고리:** macOS · 에이전트 무관 · 오픈소스(GitHub ⭐ 7.3k) · Git Worktree 자동화 · 무료(API 별도)

Superset은 스스로를 **"AI 에이전트를 위한 코드 에디터"** 라고 정의한다. Conductor와 비슷하게 병렬 에이전트 실행과 워크스페이스 격리를 제공하지만, 에이전트에 종속되지 않는다는 점에서 결정적으로 다르다.

### 에이전트 무관(Agent-Agnostic)의 힘

Superset은 Claude Code, OpenAI Codex, Google Gemini CLI, Cursor Agent, OpenCode 등 **CLI로 실행 가능한 모든 에이전트** 를 지원한다. 툴이 에이전트를 선택하는 게 아니라, 개발자가 에이전트를 선택한다. 이 유연성이 Superset의 가장 큰 차별점이다.

**주요 기능:**
- 10개 이상의 병렬 에이전트를 동시에 실행 가능
- Git worktree 기반 완전 격리 — 머지 충돌 없음
- VS Code, Cursor, Xcode, JetBrains, 터미널 등 어떤 IDE에서도 원클릭 오픈
- 포트 포워딩 내장 — 에이전트가 실행 중인 서버에 바로 접근
- 변경 사항 diff 뷰 내장 (Side by Side / Inline)
- 오픈소스 (GitHub ⭐ 7.3k) — 투명성과 커뮤니티 기여 가능

### Superset의 철학

Superset의 핵심 메시지는 **"기존 툴을 바꾸지 않아도 된다"** 는 것이다. 에디터를 바꿀 필요 없고, 에이전트를 바꿀 필요도 없다. Superset이 중간에서 병렬화와 격리를 처리해주고, 개발자는 결과만 확인하면 된다.

> 🌿 오픈소스라는 점도 주목할 만하다. 소스 코드를 확인하고, 기여하고, 포크할 수 있다. 벤더 종속(vendor lock-in) 우려가 없다.

> "if you're not using @superset_sh, you're getting left behind in 2026"  
> — @zachdive on X

### 아쉬운 점

현재 macOS만 지원한다. 또 에이전트 무관이라는 강점이 역설적으로 에이전트별 최적화가 부족할 수 있다는 의미이기도 하다. Conductor처럼 Claude Code에 특화된 세밀한 통합이 없을 수 있다.

---

## cmux — AI 시대를 위한 터미널

**🔗 [cmux.dev](https://cmux.dev)**  
**카테고리:** macOS 네이티브 터미널 · libghostty 기반 · Swift + AppKit · 완전 무료 오픈소스

cmux는 앞의 두 툴과 **결정적으로 다른 접근 방식** 을 취한다. Conductor와 Superset이 에이전트 오케스트레이터라면, cmux는 **터미널 그 자체를 AI 에이전트 워크플로우에 최적화** 한 도구다.

### 터미널의 재발명

cmux는 Ghostty의 창시자이자 HashiCorp 창업자인 Mitchell Hashimoto가 만든 `libghostty`를 렌더링 엔진으로 사용하는 macOS 네이티브 터미널 앱이다. Electron이 아닌 Swift + AppKit으로 만들어져 가볍고 빠르다.

**주요 기능:**
- **수직 탭(Vertical Tabs)** — 사이드바에 탭이 세로로 나열. 각 탭에 브랜치명, 작업 디렉토리, 포트, 알림 텍스트 표시
- **알림 링(Notification Rings)** — 에이전트가 주의를 필요로 할 때 pane 주변에 빛나는 링 표시. Claude Code hooks와 연동
- **인앱 브라우저** — 터미널 옆에 브라우저를 분할해서 열 수 있음. 스크립터블 API 제공
- **분할 pane** — 가로/세로 분할 지원
- **소켓 API / CLI** — 자동화 및 스크립팅을 위한 프로그래밍 인터페이스
- GPU 가속 렌더링 — libghostty 기반 부드러운 성능
- 모든 CLI 에이전트 지원 (당연히 — 그냥 터미널이니까)

### cmux의 철학

cmux의 메시지는 명확하다: **"tmux처럼 복잡한 설정 없이, GUI 터미널의 편리함으로, AI 에이전트 워크플로우를 소화한다."** prefix 키 없이, 설정 파일 없이, 알림 링으로 에이전트가 완료됐는지 즉시 파악할 수 있다.

> 🔔 알림 시스템이 특히 인상적이다. OSC 9/99/777 이스케이프 시퀀스를 통해 표준 방식으로 알림을 트리거하거나, Claude Code hooks와 연동하면 에이전트 완료 시 자동으로 알림이 울린다. 여러 에이전트를 돌려두고 다른 일을 하다가 "완료" 알림을 받는 경험이 자연스럽다.

> "Been using this for a week and it's fantastic. Vert tab for each WIP task. Inside, Claudes on one side and browser with PR and resources on the other, switch between tasks and stay organized."  
> — @connorelsea on X

> "Another day another libghostty-based project, this time a macOS terminal with vertical tabs, better organization/notifications, embedded/scriptable browser specifically targeted towards people who use a ton of terminal-based agentic workflows."  
> — Mitchell Hashimoto, Creator of Ghostty & Founder of HashiCorp

### 아쉬운 점

cmux는 워크스페이스 격리나 에이전트 오케스트레이션을 직접 관리해주지 않는다. Git worktree 설정은 사용자가 직접 해야 하고, 에이전트 실행도 각 탭에서 수동으로 한다. 오케스트레이션 레이어가 없다는 것이다. 이를 단점으로 볼 수도 있지만, "터미널은 터미널답게"라는 철학의 산물이기도 하다.

---

## 한눈에 비교

| 항목 | Conductor | Superset | cmux |
|------|-----------|----------|------|
| 카테고리 | 에이전트 오케스트레이터 | 에이전트 오케스트레이터 | 터미널 앱 |
| 지원 에이전트 | Claude Code, Codex | 모든 CLI 에이전트 | 모든 CLI 에이전트 |
| 플랫폼 | macOS | macOS | macOS |
| 오픈소스 | ✗ | ✓ (7.3k ⭐) | ✓ |
| 가격 | 무료 (API 별도) | 무료 (API 별도) | 완전 무료 |
| Git Worktree 자동화 | ✓ 자동 | ✓ 자동 | 수동 |
| 병렬 에이전트 대시보드 | ✓ | ✓ | ✗ |
| 코드 리뷰 / Diff UI | ✓ | ✓ | ✗ |
| 에이전트 완료 알림 | △ 기본 | △ 기본 | ✓ 강력 (알림 링) |
| 인앱 브라우저 | ✗ | ✗ | ✓ |
| 외부 IDE 연동 | ✗ | ✓ VS Code, Cursor 등 | △ 터미널에서 실행 |
| 포트 포워딩 | ✗ | ✓ | ✗ |
| 소켓 API / 자동화 | ✗ | ✗ | ✓ |
| 기술 스택 | 비공개 | 비공개 | Swift + libghostty |
| 주요 사용처 | Linear, Vercel, Stripe | Amazon, Google, Atlassian | HashiCorp 창업자 칭찬 |

---

## 나는 무엇을 선택해야 할까?

결국 이 세 툴은 서로 다른 개발자를 위해 만들어졌다. 시나리오별로 추천을 정리하면 이렇다.

| 상황 | 추천 |
|------|------|
| Claude Code에 올인 중, 깔끔한 GUI가 필요하다 | **Conductor** |
| 여러 에이전트를 유연하게 전환하며 쓰고 싶다 | **Superset** |
| Neovim, lazygit 등 터미널 중심 개발, tmux가 번거롭다 | **cmux** |
| AI 에이전트 워크플로우를 막 시작했고 비용 없이 시작하고 싶다 | **cmux** (완전 무료) |
| 팀에 코드 리뷰 프로세스와 통합해 도입하고 싶다 | **Conductor** |
| 오픈소스여야 하고 벤더 종속이 없어야 한다 | **Superset** |

### 같이 쓸 수도 있다

흥미로운 점은 세 툴이 상호 배타적이지 않다는 것이다. **cmux를 기본 터미널로 쓰면서**, 그 안에서 Superset이나 Conductor의 에이전트를 실행하는 조합도 가능하다. 실제로 커뮤니티에서 "cmux + lazygit + nvim + Claude Code" 조합을 즐겨 쓴다는 후기가 많다.

> 🤔 **내 생각:** 처음 시작한다면 cmux로 터미널 환경부터 개선해보자. 에이전트 병렬 실행이 필요해지면 Superset(오픈소스)나 Conductor(폴리쉬한 UI) 중 스타일에 맞는 것을 추가하는 순서가 자연스럽다.

---

## 마무리

AI 코딩 에이전트의 등장은 개발 생산성의 패러다임을 바꾸고 있다. 하지만 에이전트 하나를 잘 쓰는 것에서, 여러 에이전트를 동시에 지휘하는 것으로 전환하려면 새로운 도구가 필요하다.

**Conductor** 는 아름다운 GUI로 복잡성을 숨기고, Claude Code/Codex 사용자에게 최적의 경험을 제공한다. **Superset** 은 에이전트 무관한 오픈소스 오케스트레이터로 최대한의 유연성을 추구한다. **cmux** 는 터미널이라는 기반 위에서, AI 시대에 맞는 알림과 멀티태스킹 경험을 선사한다.

세 툴 모두 아직 초기 단계이고 빠르게 발전하고 있다. 지금 당장 하나를 선택해 써보고, 워크플로우에 맞게 조합해나가는 것이 최선이다. AI 에이전트 시대의 개발 환경은 아직 답이 없다 — 가장 빠르게 실험하는 사람이 앞서게 될 것이다.

---

### 세 줄 요약

- **Conductor** — Claude Code 사용자라면 가장 폴리쉬된 에이전트 오케스트레이터
- **Superset** — 에이전트를 가리지 않는 오픈소스 멀티에이전트 허브
- **cmux** — tmux의 후계자를 자처하는 AI 시대 터미널
