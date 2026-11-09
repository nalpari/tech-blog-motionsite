---
title: "Claude Code에 메모리를 부여하는 방법"
description: "4개 마크다운 파일로 Claude Code 메모리 구축"
date: 2026-03-17T02:27:13.325Z
tags: ["AI & ML","Performance"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/memory-for-claude-code-1773654135993.png"
---

> 단 4개의 파일로 건망증 심한 AI를 신뢰할 수 있는 코딩 파트너로 변신시키기
> 

## 📌 핵심 요약

Claude Code는 뛰어난 AI 코딩 도구지만 세션마다 기억이 초기화되는 치명적인 단점이 있습니다. 이 문제를 해결하기 위해 **4개의 마크다운 파일**로 구성된 간단한 프레임워크를 활용하면, Claude가 항상 프로젝트의 컨텍스트를 기억하고 일관된 작업을 수행할 수 있습니다.

## 🐠 문제: 금붕어 같은 기억력

Claude Code를 사용하다 보면 마치 매번 새로운 인턴과 일하는 것 같은 느낌을 받게 됩니다:

- ✖️ 이미 생성한 파일을 다시 만듬
- ✖️ 중요한 단계를 빠뜨림
- ✖️ 기술 스택이나 아키텍처 결정사항을 잊어버림
- ✖️ 완료되지 않은 작업을 방치

## 💡 해결책: 4개 파일 프레임워크

### 🎯 1. **PRD.md** - 북극성 (Product Requirements Document)

> 무엇을 만들고, 누구를 위해 만들며, 왜 필요한지 정의
> 

**포함 내용:**

- 한 줄 비전 선언문
- 구체적인 사용자 문제 정의
- 2-3개의 핵심 페르소나
- 명확한 사용자 스토리
- 성공 지표 (활성화율, 응답 속도, 유지율 등)

**생성 프롬프트:**

```
Generate a PRD file from this project idea that defines what we're building, who it's for, and why it matters.

```

### 🔧 2. **CLAUDE.md** - 행동 계약서

> Claude가 어떻게 작업해야 하는지 규칙 정의
> 

**포함 내용:**

- 세션 워크플로우 정의
- 코딩 표준 및 명명 규칙
- 테스팅 기대사항
- 로깅 및 문서화 규칙
- **필수 명령어** (아래 블록 반드시 포함):

```markdown
Always read PLANNING.md at the start of every new conversation,
check TASKS.md before starting your work,
mark completed tasks to TASKS.md immediately,
and add newly discovered tasks to TASKS.md when found.

```

**생성 프롬프트:**

```
Generate a CLAUDE.md file from this PRD that will guide Claude Code sessions on this project.

```

### 🏗️ 3. **PLANNING.md** - 아키텍처 메모리

> 현재 시스템이 어떻게 구축되어 있는지 기록
> 

**포함 내용:**

- 아키텍처 다이어그램 (텍스트 설명)
- 기술 스택 선택과 이유
- 주요 데이터 모델
- API 흐름 및 제약사항
- 미해결 질문사항

**생성 프롬프트:**

```
Create a PLANNING.md file that includes vision, architecture, technology stack, and required tools list for this app.

```

### ✅ 4. **TASKS.md** - 작업 추적기

> 다음에 무엇을 해야 하는지 관리
> 

**포함 내용:**

- 마일스톤별 작업 분류
- 원자적 단위의 작업 (한 세션에 완료 가능)
- 체크박스 형태의 진행 상황

**예시:**

```markdown
## Milestone 1: Setup
- [ ] Initialize repository
- [x] Set up React + Tailwind (2025-07-22)
- [ ] Create health check endpoint

## Milestone 2: Data Layer
- [ ] Design database schema
- [ ] Implement JWT authentication

```

**생성 프롬프트:**

```
Create a TASKS.md file with bullet point tasks divided into milestones for building this app.

```

## 🔄 일일 작업 루프

### 1️⃣ **세션 시작**

```
Please read PLANNING.md, CLAUDE.md, and TASKS.md to understand the project.
Then complete the first task on TASKS.md.

```

### 2️⃣ **작업 진행**

Claude가:

- 컨텍스트 파싱
- 미완료 작업 선택
- 변경사항 제안
- 승인 후 구현
- 완료 표시

### 3️⃣ **세션 종료 전**

```
Please add a session summary to CLAUDE.md summarizing what we've done so far.

```

## ✨ 효과

이 시스템을 구축하면:

- ✅ 프로젝트 컨텍스트 항상 기억
- ✅ 중복 작업 방지
- ✅ 일관된 코드 구조 유지
- ✅ 진행 상황 실시간 추적
- ✅ 시간 대폭 절약

## 🚀 시작하기

다음 Claude Code 프로젝트를 시작할 때:

1. 위 4개 파일을 먼저 생성
2. 각 세션 시작 시 파일 읽기 명령
3. 작업 진행 및 기록
4. 세션 종료 시 요약 추가

**5분 투자로 수시간의 머리 아픈 시간을 절약할 수 있습니다!**

---

## 📚 추가 팁

- 파일이 불필요하게 재구현되거나 테스트가 누락된다면 CLAUDE.md의 지시사항을 더 명확히 수정
- 작업 단위가 너무 크다면 더 작은 원자적 단위로 분할
- 4개 파일은 조율 가능한 레버처럼 작동 - 한 파일의 명확성이 다른 파일의 모호함을 보완

---

**출처:** [How to Give Claude Code a Memory](https://generativeai.pub/how-to-give-claude-code-a-memory-75bf78e9693c) by Nishad Ahamed, Generative AI Publication, July 22, 2025
