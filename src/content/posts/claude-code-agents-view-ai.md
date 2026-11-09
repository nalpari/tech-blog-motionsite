---
title: "Claude Code Agents View 완벽 가이드: 여러 AI 세션을 한 화면에서 관리하기"
description: "여러 AI 세션을 한 화면에서 관리하기"
date: 2026-05-14T03:30:31.529Z
tags: ["AI & ML"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/1778729407202-bcvzjb.png"
---

---

![claude code agents view](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1778729417088-jl9pzt.png)

## 들어가며

Claude Code를 처음 쓸 때 가장 큰 답답함은 무엇일까요? 바로 **"한 번에 한 가지 일밖에 못 한다"**는 점이었습니다. 코드 리뷰를 시키면 그게 끝날 때까지 새 작업을 시킬 수 없고, 긴 리팩토링을 돌리면 그동안은 다른 질문도 못 하죠.

2026년 5월 11일, Anthropic이 이 문제를 정면으로 해결하는 기능을 공개했습니다. 바로 **Agents View**입니다. 마치 IDE의 탭처럼 여러 Claude 세션을 한 화면에서 관리할 수 있게 된 거죠.

이 글은 주니어 개발자를 대상으로 다음을 다룹니다:

- Agents View가 정확히 무엇이고, 왜 필요한가
- `/agents` 명령어와 Agents View가 어떻게 다른가 (헷갈리기 쉬운 부분)
- Subagent라는 개념과, 그것이 Agents View와 어떻게 연결되는가
- 실제로 어떻게 만들고 활용하는가
- 주니어 개발자가 처음 시작할 때 추천하는 워크플로우

> 💡 **사전 준비**: Claude Code v2.1.139 이상이 필요합니다. 터미널에서 `claude --version`으로 확인하세요. Pro/Max/Team/Enterprise/API 플랜 사용자가 대상이며, 현재(2026년 5월) **Research Preview** 상태입니다.

---

## 1. Agents View란 무엇인가?

### 한 줄 정의

**Agents View는 여러 Claude Code 세션을 한 화면에서 동시에 모니터링하고 제어할 수 있는 CLI 대시보드**입니다.

기존의 Claude Code는 터미널 한 개에 세션 하나가 1:1로 묶여 있었습니다. 다른 작업을 동시에 시키려면 터미널 창을 여러 개 띄워야 했죠. 그러다 보면 어느 창에서 뭘 시켰는지 기억도 안 나고, 입력 대기 중인 세션을 놓치기도 했습니다.

Agents View는 이 문제를 **세션 목록 UI**로 해결합니다. 모든 실행 중인 Claude 세션이 한 리스트에 표시되고, 각 세션의 상태(실행 중/입력 대기/완료)와 마지막 결과 요약을 한눈에 볼 수 있습니다.

### 비유로 이해하기

다음과 같이 생각하면 됩니다:

- **터미널 창** = 작업 책상 한 자리
- **Agents View** = 책상 여러 개가 보이는 사무실 전경
- **세션** = 각 책상에서 일하는 동료 (Claude 인스턴스)

여러 동료가 동시에 일하고 있는데, 누가 일을 끝냈고 누가 질문이 있는지를 한눈에 알 수 있는 매니저용 화면이 Agents View입니다.

### 출시 정보

| 항목 | 값 |
|------|----|
| 출시일 | 2026년 5월 11일 |
| 상태 | Research Preview |
| 필요 버전 | Claude Code v2.1.139+ |
| 지원 플랜 | Pro / Max / Team / Enterprise / API |

---

## 2. Agents View 여는 방법

두 가지 방식이 있습니다.

### 방법 1: 빈 프롬프트에서 왼쪽 화살표(←) 키

Claude Code 세션이 이미 열려 있고 입력창이 **비어 있을 때**, 키보드 왼쪽 화살표(←)를 누르면 Agents View로 진입합니다.

```
> _              ← 여기서 왼쪽 화살표 누름
```

가장 빠른 방법입니다. 일반 작업 중에 잠깐 다른 세션 상태를 확인하고 싶을 때 이상적입니다.

### 방법 2: 터미널에서 `claude agents` 실행

세션을 새로 시작하는 게 아니라, 처음부터 Agents View로 들어가고 싶다면:

```bash
claude agents
```

이렇게 실행하면 어떤 세션도 활성화되지 않은 상태에서 곧바로 대시보드 화면이 열립니다. 아침에 작업을 시작하면서 어제 백그라운드로 돌려놓은 세션들을 점검할 때 유용합니다.

---

## 3. 헷갈리지 마세요: `/agents` vs Agents View

주니어 개발자가 가장 헷갈리는 부분입니다. 이름이 거의 비슷해서요. 하지만 **완전히 다른 기능**입니다.

| 구분 | `/agents` 슬래시 명령어 | Agents View |
|------|------------------------|-------------|
| 목적 | **Subagent 정의 파일을 만들고 편집** | **실행 중인 세션을 모니터링하고 제어** |
| 어떻게 여나 | Claude 세션 안에서 `/agents` 입력 | 빈 프롬프트에서 ← 키 또는 `claude agents` |
| 다루는 대상 | `.claude/agents/*.md` 정의 파일 | 현재 돌고 있는 Claude 인스턴스들 |
| 비유 | "직원 채용 폼" | "사무실 CCTV" |

쉽게 말해:

- `/agents` → **레시피**를 관리 (이런 subagent는 이런 일을 해야 한다)
- Agents View → **요리 중인 주방**을 관리 (지금 누가 무엇을 만들고 있는가)

두 기능 모두 강력하지만, 역할이 다릅니다. 이 글의 핵심은 Agents View지만, Subagent 개념도 이해해야 Agents View가 보여주는 화면이 의미 있게 다가옵니다. 그래서 다음 섹션에서 Subagent를 짚고 갑니다.

---

## 4. 필수 사전 지식: Subagent란?

### Subagent 개념

**Subagent**는 메인 Claude 세션이 특정 작업을 위임할 수 있는 **독립된 Claude 인스턴스**입니다.

예를 들어 메인 세션에서 "이 PR을 코드 리뷰해줘"라고 요청하면, Claude는 그 일을 직접 처리하지 않고 **code-reviewer라는 이름의 subagent에게 위임**할 수 있습니다. 그러면 그 subagent가 자기만의 컨텍스트에서 리뷰를 수행하고, 최종 결과만 메인 세션에 돌려줍니다.

### 왜 위임하는 게 좋은가?

주니어 개발자는 "그냥 메인 세션이 다 하면 안 되나?"라고 생각할 수 있습니다. 위임의 이점은 다음과 같습니다:

**(1) 컨텍스트 윈도우 절약**

Claude는 한 번에 처리할 수 있는 토큰(글자 분량)에 한계가 있습니다. 메인 세션이 코드 리뷰 중간 과정(파일 읽기, 분석 등)까지 다 끌어안고 있으면 곧 한계에 부딪칩니다. Subagent에게 위임하면 중간 과정은 subagent의 독립 컨텍스트에서 처리되고, 메인에는 "리뷰 결과 요약"만 돌아옵니다.

**(2) 역할별 최적화**

서로 다른 일은 서로 다른 시스템 프롬프트가 필요합니다. 코드 리뷰어에게는 "엄격한 리뷰어처럼 행동하세요"가 효과적이지만, 문서 작성자에게는 그게 별로 도움이 안 됩니다. Subagent마다 시스템 프롬프트를 다르게 줄 수 있습니다.

**(3) 도구 권한 제어**

리뷰 전용 subagent에는 Read, Grep만 주고 Bash나 Write는 못 쓰게 막을 수 있습니다. 실수로 파일을 지우거나 위험한 명령을 실행하는 사고를 차단합니다.

**(4) 병렬 실행**

여러 subagent를 동시에 돌릴 수 있습니다. PR 3개를 동시에 리뷰시키는 식의 워크플로우가 가능합니다. **여기서 Agents View가 진짜 빛을 발합니다.**

### Subagent 정의 파일 예시

`.claude/agents/code-reviewer.md`:

```markdown
---
name: code-reviewer
description: Reviews code for quality, performance, and security. Use proactively when code needs careful inspection before merging.
tools: Read, Glob, Grep
model: sonnet
---

You are an experienced senior code reviewer.

Your responsibilities:
- Identify bugs, performance issues, and security vulnerabilities
- Check consistency with team conventions
- Suggest concrete improvements with code examples
- Provide constructive, educational feedback

Output format:
1. Critical issues (must fix)
2. Suggestions (nice to have)
3. Praise (what was done well)
```

frontmatter 필드를 간단히 정리하면:

| 필드 | 필수 | 설명 |
|------|------|------|
| `name` | ✅ | 영문 소문자 + 하이픈으로 된 고유 ID |
| `description` | ✅ | 이 agent를 **언제** 써야 하는지 설명 (자동 위임 판단 기준) |
| `tools` | ❌ | 쉼표로 구분된 도구 목록. 생략하면 모두 상속 |
| `model` | ❌ | `sonnet`, `haiku`, `opus`, `inherit` 중 선택 |

> 💡 **`description`에 "use proactively"라고 적으면** Claude가 더 적극적으로 이 subagent에게 일을 자동 위임합니다. 사용자가 명시적으로 부르지 않아도 description에 부합하는 상황이면 알아서 호출합니다.

---

## 5. Agents View 화면 둘러보기

이제 본격적으로 Agents View 화면을 살펴봅시다.

### 기본 레이아웃

```
┌─ Claude Code · Agents View ─────────────────────────┐
│                                                     │
│  ⚠ Action Required (1)                              │
│  ▸ pr-1234-review        입력 대기 중               │
│     "이 변경을 머지해도 될까요?"                       │
│                                                     │
│  ⏳ Running (3)                                      │
│  ▸ refactor-auth-module  실행 중 · 2m 30s           │
│     "src/auth/middleware.ts 분석 중..."              │
│                                                     │
│  ▸ test-runner-feature-x 실행 중 · 45s              │
│     "Jest 테스트 187개 실행 중..."                     │
│                                                     │
│  ▸ docs-update           실행 중 · 5m 12s           │
│     "API 문서 초안 작성 완료, 검토 대기"               │
│                                                     │
│  ✅ Completed (2)                                    │
│  ▸ lint-cleanup          완료 · 10m 전               │
│  ▸ migration-review      완료 · 25m 전               │
└─────────────────────────────────────────────────────┘
```

### 구역별 설명

**🚨 Action Required (상단 고정)**

가장 위에 있는 구역으로, **사용자 입력을 기다리고 있는 세션**들이 모입니다. Claude가 중요한 결정을 사용자에게 묻거나, 권한 승인을 요청한 경우 여기로 올라옵니다.

이 구역을 항상 위에 두는 이유는 명확합니다. 다른 세션이 멈춰 있는 원인이 대개 이 구역에 있기 때문입니다.

**⏳ Running**

현재 실행 중인 세션들. 각 세션의 진행 상황을 한 줄로 요약해 보여줍니다.

**✅ Completed**

이미 끝난 세션들. 결과를 확인하고 닫거나, 후속 질문을 하기 위해 다시 열 수 있습니다.

### 가능한 동작

세션 행에서 할 수 있는 일들:

- **Enter**: 해당 세션을 풀스크린으로 열어 대화 이어가기
- **세션 종료**: 더 이상 필요 없는 세션 정리
- **결과 복사**: 다른 세션이나 다른 도구로 가져가기 위해
- **컨텍스트 손실 없이 전환**: 한 세션을 보다가 다른 세션으로 가도 둘 다 상태 유지됨

---

## 6. 백그라운드 에이전트와의 연계

Agents View가 진짜 강력해지는 순간은 **백그라운드 에이전트**와 함께 쓸 때입니다.

### 백그라운드로 보내기

긴 작업을 시작한 뒤, 이렇게 백그라운드로 보낼 수 있습니다:

```bash
# 방법 1: 작업 중 슬래시 명령어
/bg

# 방법 2: 처음부터 백그라운드로 시작
claude --bg "이 코드베이스 전체에서 deprecated된 API 호출을 찾아줘"
```

`/bg`로 보낸 세션은 터미널을 차지하지 않고도 계속 돌아갑니다. 그동안 다른 일을 할 수 있죠.

### 그래서 Agents View가 필요해진다

백그라운드 에이전트를 5개 띄워놓으면 누가 어디서 뭘 하고 있는지 도저히 추적이 안 됩니다. 그때 Agents View가 사령탑 역할을 합니다. 모든 백그라운드 세션이 자동으로 목록에 표시되고, 각자의 진행 상황을 거기서 확인할 수 있습니다.

### 추천 워크플로우

```
1. 아침에 "claude agents" 실행 → 대시보드 진입
2. 어제 백그라운드로 돌려둔 세션 결과 확인
3. 새 작업 1: "PR #1234 리뷰" → /bg 로 백그라운드 전환
4. 새 작업 2: "마이그레이션 스크립트 검증" → /bg
5. 새 작업 3: "문서 초안 작성" → /bg
6. Agents View에서 진행 상황 모니터링
7. 입력 대기 표시가 뜨면 그 세션만 잠깐 열어 응답
8. 완료된 세션 결과를 정리하고 마감
```

이 워크플로우 하나만 익혀도 하루 작업 처리량이 눈에 띄게 늘어납니다.

---

## 7. 실전 예시: 주니어 개발자의 첫 시나리오

말로만 설명하면 와닿지 않으니, 실제 시나리오로 따라가봅시다.

### 시나리오: "기능 브랜치를 머지하기 전에 체크"

여러분이 `feature/user-profile` 브랜치를 작업했고, main으로 머지하기 전에 자체 점검을 하고 싶다고 합시다. 보통은 이걸 순차적으로 합니다:

1. 코드 리뷰
2. 테스트 실행
3. 문서 업데이트 확인
4. 보안 점검

총 4단계. 각 단계가 5분씩만 걸려도 20분. 그리고 각 단계마다 결과 보고 다음 단계로 넘어가는 결정도 해야 하죠. 비효율적입니다.

### Agents View 방식

다음과 같이 병렬화합니다:

**Step 1: subagent 정의 (한 번만)**

```bash
mkdir -p .claude/agents
```

`.claude/agents/code-reviewer.md`, `.claude/agents/test-runner.md`, `.claude/agents/docs-checker.md`, `.claude/agents/security-scanner.md` 4개의 정의 파일을 만듭니다. (앞 섹션의 예시 참고)

**Step 2: 4개 작업을 동시에 시작**

각각 다른 터미널에서 실행하거나, 메인 세션에서 명시적으로 호출:

```
Use the code-reviewer subagent to review feature/user-profile branch
```

```
Use the test-runner subagent to run all tests for feature/user-profile
```

```
Use the docs-checker subagent to verify docs are up to date for feature/user-profile
```

```
Use the security-scanner subagent to check for security issues in feature/user-profile
```

각 작업을 `/bg`로 백그라운드로 보냅니다.

**Step 3: Agents View로 모니터링**

빈 프롬프트에서 ← 키를 눌러 Agents View 진입. 4개 세션이 모두 보입니다.

```
⏳ Running (4)
▸ code-reviewer         실행 중 · 1m 20s
▸ test-runner           실행 중 · 1m 19s  
▸ docs-checker          완료 · 30s 전 → "OK"
▸ security-scanner      입력 대기 → "이 라이브러리 업데이트 해도 될까요?"
```

**Step 4: 빠르게 응답하고 결과 모으기**

security-scanner의 질문에 답하고, 나머지 결과를 차례로 확인합니다. 전체가 5분 안에 끝납니다.

이게 Agents View + Subagents 조합의 위력입니다.

---

## 8. 주니어 개발자를 위한 시작 팁

### 팁 1: 처음에는 1~2개 Subagent만 만드세요

처음부터 10개를 만들면 관리가 안 됩니다. 다음 두 개로 시작하길 권합니다:

1. **code-reviewer**: PR 머지 전에 자체 리뷰
2. **test-runner**: 변경사항이 기존 테스트를 깨지 않는지 확인

이 둘만 잘 써도 일상 워크플로우가 크게 개선됩니다.

### 팁 2: Description은 자세하고 구체적으로 쓰세요

자동 위임이 잘 되려면 description이 명확해야 합니다.

```yaml
# ❌ 나쁨
description: Reviews code

# ✅ 좋음
description: |
  Reviews pull requests for code quality, performance, and security issues.
  Use proactively whenever code changes need careful inspection before merging,
  especially for changes to authentication, payment, or database modules.
```

### 팁 3: Tools는 최소 권한으로

읽기만 하면 되는 subagent에 Bash 권한을 주지 마세요. 사고가 일어나기 전에 차단해야 합니다.

```yaml
# 코드 분석만 하는 subagent
tools: Read, Glob, Grep

# 테스트 실행도 필요한 경우만 Bash 추가
tools: Read, Glob, Grep, Bash
```

### 팁 4: Subagent를 Git에 커밋하세요

`.claude/agents/` 폴더를 Git에 포함하면 팀원이 같은 subagent를 공유할 수 있습니다. 회사/팀 단위로 표준 리뷰어 정의를 통일하는 효과가 있습니다.

```bash
# .gitignore에 .claude/agents/는 빼놓아야 함 (.claude/local.json 같은 개인 설정만 제외)
```

### 팁 5: Agents View는 멀티태스킹용, 단일 작업이면 그냥 일반 세션

단순한 질문 하나 던질 거면 굳이 Agents View를 쓸 필요 없습니다. **동시에 2개 이상의 작업이 돌고 있을 때**부터 효과가 나옵니다.

### 팁 6: 모델 선택을 신중하게

```yaml
# 가볍고 빠른 작업 (단순 검색, 포맷 변환)
model: haiku

# 일반적인 작업 (코드 리뷰, 테스트 분석)
model: sonnet

# 복잡한 설계, 아키텍처 결정
model: opus

# 메인 세션과 같은 모델 쓰기
model: inherit
```

비용과 속도의 트레이드오프입니다. 모든 subagent를 opus로 두면 토큰을 빠르게 소비합니다.

---

## 9. 자주 묻는 질문 (FAQ)

**Q1. Agents View 안 보입니다. 왜죠?**

Claude Code 버전을 확인하세요. `claude --version`이 v2.1.139 미만이면 업데이트하세요:

```bash
npm install -g @anthropic-ai/claude-code@latest
```

**Q2. Subagent를 만들었는데 자동 호출이 안 됩니다.**

`description` 필드가 너무 모호하거나 짧으면 메인 Claude가 위임 판단을 안 합니다. "Use proactively when..."으로 시작하는 구체적인 트리거 조건을 넣으세요. 그래도 안 되면 명시적으로 "Use the X subagent to..."라고 직접 부르세요.

**Q3. Subagent가 만든 결과가 메인 세션에서 안 보입니다.**

이는 정상입니다. Subagent의 **중간 작업 과정**은 메인에 표시되지 않고 **최종 메시지만** 돌아옵니다. 컨텍스트를 보호하기 위한 의도된 동작입니다.

**Q4. 동시에 몇 개까지 백그라운드 세션을 띄울 수 있나요?**

기술적 상한선은 플랜에 따라 다르지만, 실용적으로는 **5~7개 정도가 관리 가능한 한계**입니다. 그 이상은 사람이 결과를 따라잡지 못합니다.

**Q5. `/agents`로 만든 subagent를 어디서 편집하나요?**

`.claude/agents/<이름>.md` 파일을 일반 텍스트 에디터로 직접 열어 편집해도 됩니다. 마크다운 파일이라 GitHub에서 diff 보기도 편합니다.

---

## 10. 마치며

Claude Code의 Agents View는 단순한 UI 개선이 아닙니다. **개발자가 AI 에이전트와 일하는 방식의 패러다임을 바꾸는 변화**입니다.

이전: 한 번에 한 가지 일, Claude 끝날 때까지 대기  
이후: 여러 가지 일을 위임, 매니저처럼 진행 상황 모니터링

주니어 개발자로서 처음에는 학습 곡선이 있습니다. Subagent 정의 파일을 만들고, 도구 권한을 어떻게 설정하고, 어떤 작업을 위임할지 판단하는 감각을 키우는 데 시간이 걸립니다. 하지만 이 감각이 자리잡으면 시니어 개발자의 워크플로우에 더 가까워집니다.

다음 단계로 추천드리는 것:

1. 오늘 `.claude/agents/code-reviewer.md` 하나만 만들어보기
2. 이번 주 PR 하나를 그 subagent로 리뷰해보기
3. 결과가 만족스러우면 test-runner도 추가하기
4. 두 개를 동시에 돌려보고 Agents View로 모니터링해보기

작게 시작하고 점진적으로 확장하세요. 그게 안정적으로 익히는 길입니다.

---

## 참고 자료

- [Agent view in Claude Code | Anthropic Blog](https://www.anthropic.com/news/agent-view-in-claude-code)
- [Manage multiple agents with agent view - Claude Code Docs](https://docs.claude.com/en/docs/claude-code/agent-view)
- [Create custom subagents - Claude Code Docs](https://docs.claude.com/en/docs/claude-code/sub-agents)
- [Claude Code Keybindings Guide](https://docs.claude.com/en/docs/claude-code/keyboard-shortcuts)
