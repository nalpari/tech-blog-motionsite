---
title: "Claude Code 커스텀 커맨드 가이드"
description: "Claude Code 커스텀 커맨드 생성과 활용법"
date: 2026-03-15T04:11:44.486Z
tags: ["AI & ML"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/claude-code-1773548513821.png"
---

## 개요

Claude Code의 커스텀 커맨드는 반복적인 작업을 자동화하고 일관된 프롬프트를 사용할 수 있게 해주는 강력한 기능입니다. Markdown 파일을 특정 디렉토리에 생성하기만 하면 Claude Code가 자동으로 인식하여 `/command_name` 형태로 사용할 수 있습니다.

---

## 🔧 기본 구조

### 커맨드 유형

| 유형 | 저장 위치 | 사용 범위 | 예시 |
| --- | --- | --- | --- |
| **프로젝트 커맨드** | `.claude/commands/` | 해당 프로젝트에서만 | `/project:optimize` |
| **사용자 커맨드** | `~/.claude/commands/` | 모든 프로젝트에서 | `/optimize` |

### 명명 규칙

- 파일명이 커맨드명이 됩니다 (`.md` 확장자 제외)
- 하위 디렉토리를 사용하여 카테고리화 가능
- 일관된 동사-명사 형태 권장 (예: `create-post`, `fix-issue`)

---

## 📝 커맨드 생성 방법

### 1. 기본 커맨드

```bash
# 프로젝트별 커맨드 생성
mkdir -p .claude/commands
echo "코드의 성능을 분석하고 최적화 방안을 제안해주세요:" > .claude/commands/optimize.md

# 사용자 전역 커맨드 생성
mkdir -p ~/.claude/commands
echo "보안 취약점을 검토해주세요:" > ~/.claude/commands/security-review.md

```

### 2. 인수를 받는 커맨드

`$ARGUMENTS` 플레이스홀더를 사용하여 동적 값 전달:

```bash
echo 'GitHub 이슈 #$ARGUMENTS를 수정해주세요. 우리의 코딩 표준을 따라서 작업해주세요.' > .claude/commands/fix-issue.md

```

**사용법:**

```
> /fix-issue 123

```

### 3. 카테고리별 구조화

```bash
# 디렉토리 구조 예시
.claude/commands/
├── posts/
│   ├── new.md
│   └── edit.md
├── tests/
│   ├── create.md
│   └── run.md
└── deploy/
    ├── staging.md
    └── production.md

```

**사용법:**

```
> /project:posts:new "새 블로그 포스트"
> /project:tests:create "UserService"

```

---

## ⚙️ 고급 기능

### 1. 메타데이터 설정

YAML 프론트매터를 사용하여 추가 설정:

```markdown
---
allowed-tools: Bash(npm run test:*)
argument-hint: [컴포넌트명]
description: 테스트 파일 생성
model: haiku
---

$ARGUMENTS에 대한 포괄적인 테스트를 작성해주세요:
- Jest와 React Testing Library 사용
- __tests__ 디렉토리에 배치
- 모든 주요 기능 테스트
- 엣지 케이스와 오류 시나리오 포함

```

### 2. 전처리 명령어 실행

`!` 접두사로 커맨드 실행 전 bash 명령어 실행:

```markdown
---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*)
description: Git 커밋 생성
---

## 현재 상황
- Git 상태: !`git status`
- 현재 브랜치: !`git branch --show-current`
- 최근 커밋: !`git log --oneline -5`

위 정보를 바탕으로 적절한 커밋 메시지를 생성해주세요.

```

---

## 💡 실용적인 예제

### 📄 새 블로그 포스트 생성

**파일:** `.claude/commands/posts/new.md`

```markdown
I want to create a new blog post with the following title: $ARGUMENTS

1. Generate the proper kebab-case filename with today's date (YYYY-MM-DD-title-slug.md)
2. Create the frontmatter with title, date, and draft status
3. Add a basic structure with introduction and conclusion placeholders
4. Include relevant tags and categories

```

### 🔍 코드 리뷰

**파일:** `.claude/commands/review.md`

```markdown
Please review this code for:

**보안 및 품질:**
- Security vulnerabilities
- Performance issues
- Code quality and best practices
- Potential bugs

**문서화:**
- Documentation completeness
- Code comments clarity

**특별 검토 사항:** $ARGUMENTS

```

### 🧪 테스트 생성

**파일:** `.claude/commands/test.md`

```markdown
Create comprehensive tests for: $ARGUMENTS

**테스트 요구사항:**
- Use Jest and appropriate testing libraries
- Include unit tests and integration tests
- Test edge cases and error scenarios
- Ensure proper mocking where needed
- Add descriptive test names and comments

**구조:**
- Place tests in `__tests__` directory
- Follow naming convention: `ComponentName.test.js`
- Include setup and teardown if needed

```

### 🚀 배포 준비

**파일:** `.claude/commands/deploy/prepare.md`

```markdown
---
allowed-tools: Bash(npm run build), Bash(npm run test), Bash(git status)
description: 배포 전 준비 작업
---

## 배포 환경: $ARGUMENTS

**배포 전 체크리스트:**

1. **코드 품질 검증:**
   - 현재 상태: !`git status`
   - 테스트 실행: !`npm run test`
   - 빌드 확인: !`npm run build`

2. **준비 작업:**
   - 버전 업데이트 확인
   - CHANGELOG.md 업데이트
   - 환경별 설정 검증
   - 백업 확인

3. **최종 검토:**
   - Breaking changes 확인
   - 롤백 계획 수립
   - 모니터링 준비

```

---

## 🎯 사용법 및 팁

### 기본 사용법

```bash
# 커맨드 실행
> /optimize                           # 기본 최적화
> /fix-issue 456                     # 인수와 함께
> /project:posts:new "My New Post"   # 카테고리 커맨드
> /help                              # 사용 가능한 커맨드 보기

```

### 💡 생산성 팁

1. **일관된 명명 규칙 사용**
    - 동사-명사 패턴: `create-component`, `fix-bug`
    - 카테고리별 분류: `tests/`, `deploy/`, `docs/`
2. **자주 사용하는 작업 패턴화**
    - 프로젝트 초기화
    - 코드 리뷰 체크리스트
    - 배포 전 검증
3. **팀과 공유**
    - 프로젝트 커맨드로 팀 워크플로우 표준화
    - README에 커스텀 커맨드 목록 문서화
4. **토큰 최적화**
    - CLAUDE.md의 고정 절차를 커맨드로 분리
    - 필요할 때만 로드하여 토큰 사용량 20% 절약 가능

---

## 🔗 추가 리소스

- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code)
- [커뮤니티 커맨드 모음](https://github.com/hesreallyhim/awesome-claude-code)
- [슬래시 커맨드 레퍼런스](https://docs.anthropic.com/en/docs/claude-code/slash-commands)

---

*이 가이드를 통해 Claude Code의 커스텀 커맨드를 효과적으로 활용하여 개발 생산성을 크게 향상시킬 수 있습니다. 반복적인 작업을 자동화하고 일관된 워크플로우를 구축해보세요!*
