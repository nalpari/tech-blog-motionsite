---
title: "Alibaba Open Code Review: 결정적 파이프라인과 LLM Agent를 결합한 코드 리뷰 도구"
description: "알리바바가 오픈소스로 공개한 AI 코드 리뷰 CLI Open Code Review의 특징, 설치와 설정, 네이티브·위임 모드 사용법, 규칙 커스터마이즈와 한계 정리"
date: 2026-11-18T16:43:28+09:00
tags: ["AI", "Dev tools"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/alibaba-open-code-review.png"
featured: false
---

범용 코딩 에이전트에게 "이 PR을 리뷰해 줘"라고 맡기면, 큰 변경에서 파일을 건너뛰거나, 지적한 위치가 실제 코드와 어긋나거나, 같은 프롬프트인데도 품질이 흔들리는 일이 자주 있습니다. [Alibaba Open Code Review](https://github.com/alibaba/open-code-review)는 이 지점을 정면으로 겨냥한 AI 코드 리뷰 CLI입니다. 알리바바 그룹 내부의 공식 AI 코드 리뷰 어시스턴트였던 도구를, 대규모 사용으로 검증한 뒤 커뮤니티에 오픈소스로 공개한 프로젝트입니다.

이 글은 저장소 README와 공식 문서 소스(`pages/src/content/docs/`)를 바탕으로, 무엇이고 왜 쓰는지, 어떻게 설치·설정하고 쓰는지까지 정리합니다. 명령과 플래그는 문서에 적힌 것만 옮겼습니다.

## Open Code Review는 무엇인가

Open Code Review(줄여서 OCR, CLI 명령은 `ocr`)는 Git diff를 읽고, tool-use가 가능한 전용 에이전트를 통해 설정한 LLM에 변경 파일을 넘긴 뒤, **라인 단위 위치가 포함된 구조화된 리뷰 코멘트**를 만들어 주는 도구입니다. 에이전트는 파일 전체 읽기, 코드베이스 검색, 다른 변경 파일 확인 같은 도구를 써서 표면적인 diff 감상문이 아니라 맥락 있는 리뷰를 하도록 설계되어 있습니다.

diff가 없거나, 익숙하지 않은 코드베이스를 통째로 살펴보고 싶을 때는 `ocr scan`으로 파일 전체를 리뷰할 수 있습니다. 라이선스는 **Apache-2.0**이고, npm 패키지는 `@alibaba-group/open-code-review`입니다.

저장소가 설명하는 사용 규모는 지난 2년 동안 수만 명의 개발자에게 제공되어 수백만 건의 코드 결함을 찾아냈다는 것입니다. 모델 엔드포인트만 설정하면 바로 쓸 수 있고, 별도 API 키를 쓰기 싫다면 뒤에 나올 위임 모드로 기존 코딩 에이전트 구독을 재사용할 수도 있습니다.

## 왜, 언제 쓰나

README는 범용 에이전트(Skills로 코드 리뷰를 시키는 경우)의 약점을 세 가지로 꼽습니다.

- **불완전한 커버리지**: 큰 changeset에서 일부 파일만 보고 중요한 변경을 놓치기 쉽습니다.
- **위치 드리프트**: 지적한 문제가 실제 라인·파일과 어긋나는 일이 잦습니다.
- **불안정한 품질**: 자연어 스킬은 디버깅이 어렵고, 프롬프트를 조금만 바꿔도 결과가 크게 흔들립니다.

원인은 리뷰 절차를 언어 모델에만 맡기면, "어떤 파일을 볼지", "코멘트를 어디에 달지" 같은 단계에 강한 제약이 없다는 점입니다. Open Code Review는 이 단계를 **결정적 엔지니어링**으로 고정하고, 모델에게는 동적 판단과 맥락 검색을 맡기는 하이브리드 구조를 씁니다.

다음 상황에 잘 맞습니다.

- 로컬에서 staged/unstaged/untracked 변경, 브랜치 범위, 또는 단일 커밋을 리뷰하고 싶을 때
- Claude Code, Codex, Cursor, Kimi Code 같은 에이전트 안에서 슬래시 명령이나 스킬로 리뷰를 돌리고 싶을 때
- PR/MR마다 CI에서 리뷰를 돌리고, JSON이나 SARIF로 결과를 받고 싶을 때
- 별도의 OCR용 API 키 없이, 이미 쓰는 코딩 에이전트 구독으로 리뷰만 수행하고 싶을 때(위임 모드)

반대로, Git이 아닌 VCS만 쓰는 저장소이거나, 네이티브 tool calling을 지원하지 않는 로컬 모델만 있는 환경에서는 문서가 명시한 제약이 있습니다. 이 부분은 글 뒷부분의 한계에서 다시 정리합니다.

## 핵심 설계와 기능

### 결정적 파이프라인과 Agent의 역할 분담

반드시 틀리면 안 되는 단계는 엔지니어링 로직이 담당합니다.

- **파일 선택**: 리뷰할 파일과 걸러낼 파일을 파이프라인이 결정해, 중요한 변경이 빠지지 않게 합니다.
- **파일 번들링**: 관련 파일을 하나의 리뷰 단위로 묶습니다. 문서 예시는 `message_en.properties`와 `message_zh.properties`를 함께 묶는 식입니다. 각 묶음은 독립된 컨텍스트의 서브 에이전트로 돌고, 큰 changeset에서도 나누어 동시에 리뷰할 수 있습니다. 아키텍처 문서 기준으로는 파일 메타데이터만 보고 관련 파일을 묶으며, 한 그룹은 최대 10개 파일입니다.
- **규칙 매칭**: 파일 특성에 맞는 리뷰 규칙을 템플릿 엔진으로 붙여, 모델의 주의를 좁힙니다.
- **위치 지정과 reflection**: 코멘트 위치와 내용을 별도 모듈이 다듬어, 라인 정확도와 내용 정확도를 높입니다.

모델은 그 위에서 도구를 호출하며 동적으로 맥락을 가져옵니다. 기본 diff 리뷰의 내장 도구는 여섯 가지입니다. `file_read`, `file_read_diff`, `file_find`, `code_search`로 맥락을 읽고, `code_comment`로 라인 범위와 함께 코멘트를 남기며, `task_done`으로 루프를 끝냅니다. 계획 단계에서는 읽기 도구만 참고하고, 코멘트 도구는 꺼 둡니다.

한 가지 중요한 제약이 있습니다. 다른 파일을 읽는 도구는 **현재 파일의 diff를 이해하기 위한 맥락**이지, 그 파일에 코멘트를 달기 위한 대상이 아닙니다. 다른 그룹에서 발견한 문제는 기본적으로 코멘트 대상이 되지 않습니다.

### 두 가지 실행 모드

| | 네이티브 모드 | 위임 모드 |
|---|---|---|
| 스킬 | `open-code-review` | `open-code-review-delegate` |
| 리뷰 수행 주체 | OCR 전용 리뷰 에이전트와 파이프라인 | OCR의 파이프라인·가드레일을 따르는 호스트 코딩 에이전트 |
| 모델과 인증 | OCR 자체의 프로바이더 설정 | 호스트 에이전트의 기존 모델과 인증 |
| 이런 때 | OCR용 모델 엔드포인트가 있고 전체 파이프라인을 쓰고 싶을 때 | 별도 API 키가 없거나, 이미 쓰는 에이전트 구독을 재사용하고 싶을 때 |

별도 키가 없다면 위임 모드로 시작하는 편이 문서의 권장입니다. 위임 모드는 OCR 쪽 LLM 설정만 생략할 뿐, 호스트 에이전트의 인증·사용량 제한·비용은 그대로입니다. 에이전트 구독이 네이티브 모드의 API 자격 증명이 되는 것은 아닙니다. 위임 모드에서 OCR은 파일 선택, 규칙 해석, 커버리지 요구, 구조화된 보고 같은 가드레일을 제공하고, 실제 분석과 보고는 호스트 에이전트가 수행합니다. OCR의 전체 네이티브 파이프라인을 그대로 실행하는 것은 아닙니다.

### 그밖에 알아둘 기능

- **내장 규칙**: 바이너리에 언어·파일 유형별 시스템 규칙이 들어 있습니다. 예를 들어 Java 규칙에는 NPE 패턴과 스레드 안전성 검사가 있고, MyBatis 매퍼 XML에는 SQL 인젝션·파라미터 오류를 보라고 적힌 예시 규칙이 있습니다. 프로젝트나 사용자 규칙으로 덮거나, `merge_system_rule`로 합칠 수 있습니다.
- **출력**: 기본은 사람용 텍스트이고, `--format json`으로 기계가 읽기 쉬운 결과를, `--format sarif`로 GitHub Code Scanning용 SARIF 2.1.0 리포트를 낼 수 있습니다.
- **세션과 뷰어**: 리뷰는 `~/.opencodereview/sessions/` 아래에 남고, `ocr session list`로 목록을 보거나 `--resume`으로 중단된 리뷰를 재개할 수 있습니다. `ocr viewer`는 로컬 웹 UI(`localhost:5483`)를 띄워 세션을 탐색합니다.
- **CI/CD**: 저장소에 GitHub Actions, GitLab CI, GitFlic CI, Gerrit용 연동 예시가 있습니다.
- **MCP**: `ocr review`에서 OCR이 MCP 클라이언트가 되어, 이슈 트래커나 문서 같은 외부 도구를 리뷰 에이전트에 붙일 수 있습니다. 문서 기준으로 `ocr scan`에는 아직 연결되지 않습니다.
- **코멘트 언어**: `ocr config set language`로 리뷰 코멘트 언어를 정할 수 있고, 설정하지 않으면 영어가 기본입니다.

프로젝트는 AACR-Bench라는 벤치마크도 공개합니다. README에 따르면 인기 오픈소스 저장소 50곳의 실제 Pull Request 200개, 프로그래밍 언어 10개, 시니어 엔지니어 80명 이상이 교차 검증한 어노테이션 결함 1,505개로 구성됩니다. 같은 기반 모델을 쓴 범용 에이전트(Claude Code)와 비교하면 정밀도(Precision)와 F1은 더 높고, 토큰은 약 9분의 1, 속도도 더 빠르다고 합니다. 다만 재현율(Recall)은 더 낮으며, 이는 노이즈를 줄이고 정밀도를 우선한 의도적인 트레이드오프라고 설명합니다.

## 설치

사전 요구 사항은 **Git 2.41 이상**입니다. npm으로 설치할 때는 빠른 시작 문서 기준으로 **Node.js 18 이상**이 필요하고, 네이티브 모드를 쓸 때는 LLM API 키도 필요합니다. 위임 모드만 쓴다면 OCR 쪽 API 키는 없어도 됩니다.

권장 설치는 npm 전역 설치입니다.

```bash
npm install -g @alibaba-group/open-code-review
ocr version
```

설치가 끝나면 `ocr` 명령을 전역에서 쓸 수 있습니다. 특정 버전을 고정하려면 `@alibaba-group/open-code-review@<version>` 형태로 설치합니다. npm으로 설치한 경우, 기본적으로 `ocr`를 실행할 때마다 백그라운드에서 최신 버전을 확인하고 자동 업그레이드합니다. 확인 간격의 기본값은 18분이고 `OCR_UPDATE_INTERVAL`(분)으로 바꿀 수 있으며, 자동 업데이트를 끄려면 `OCR_NO_UPDATE`를 비어 있지 않은 값으로 두면 됩니다.

다른 설치 방법도 있습니다.

- **Homebrew**(macOS / Linux): `brew install open-code-review`
- **설치 스크립트**: `curl -fsSL https://open-codereview.ai/install.sh | sh` (Windows는 `irm https://open-codereview.ai/install.ps1 | iex`)
- **GitHub Release 바이너리**: Node.js 없이 `opencodereview-darwin-arm64` 같은 정적 바이너리를 받아 `ocr`로 이름 붙여 PATH에 둡니다. 릴리스에 `sha256sum.txt`가 함께 올라옵니다.
- **소스 빌드**: Go 1.26.10 이상, Git, Make가 필요하며 `make build` 후 `dist/opencodereview`를 복사합니다.

설치를 확인하려면 `ocr version`, `ocr --help`, `ocr review --help`를 실행하면 됩니다.

에이전트 안에서 쓰려면, 리뷰할 프로젝트에서 스킬을 설치할 수 있습니다.

```bash
npx skills add alibaba/open-code-review
```

설치 과정에서 필요한 스킬과 에이전트를 고릅니다. `ocr`가 없으면 스킬이 환경 권한에 따라 설치를 안내하고, 미리 `npm install -g @alibaba-group/open-code-review`로 넣어 둘 수도 있습니다. 플랫폼별 플러그인 설치는 아래와 같습니다. 모두 Git 2.41 이상과 `ocr` CLI가 필요합니다.

```text
# Claude Code
/plugin marketplace add alibaba/open-code-review
/plugin install open-code-review@open-code-review

# Codex
codex plugin marketplace add alibaba/open-code-review
# 이후 Codex에서 /plugins로 Open Code Review를 설치·활성화

# Cursor (수동)
# plugins/open-code-review/ 전체를 ~/.cursor/plugins/local/open-code-review/ 로 복사한 뒤
# 매니페스트가 ~/.cursor/plugins/local/open-code-review/.cursor-plugin/plugin.json 에 있는지 확인하고 창을 다시 로드

# Kimi Code
/plugins install https://github.com/alibaba/open-code-review
```

Claude Code와 Kimi Code 플러그인은 `/open-code-review:review`와 `/open-code-review:delegate-review` 슬래시 명령을 제공합니다. Codex는 호출 가능한 리뷰 스킬을 쓰고, Cursor는 이식 가능한 스킬을 제공합니다.

## 설정

설정 파일은 `~/.opencodereview/config.json`입니다. 방법은 세 가지입니다.

- 대화형 TUI: `ocr config provider`, `ocr config model`
- 명령줄: `ocr config set <key> <value>` (스크립트·CI에 적합)
- JSON 파일을 직접 편집 (비권장. 다음 `ocr config set`에서 다시 포맷됩니다)

네이티브 모드에서는 리뷰 전에 LLM을 설정해야 합니다. `ocr review`, `/open-code-review:review`, `open-code-review` 스킬은 Claude Code 구독 로그인이 아니라 **OCR 자체 프로바이더 설정**을 사용합니다.

권장 방법은 대화형 설정입니다.

```bash
ocr config provider
ocr config model
```

TUI가 프로바이더 선택, API 키 입력, 모델 설정을 안내한 뒤 `ocr llm test`로 연결을 확인합니다. CI처럼 TUI를 쓸 수 없는 환경에서는 같은 설정을 명령으로 기록합니다.

```bash
ocr config set provider                    anthropic
ocr config set model                       claude-opus-4-6
ocr config set providers.anthropic.api_key "<API_KEY>"
ocr llm test
```

내장 프로바이더는 Anthropic, OpenAI, OpenRouter, Gemini, DashScope, DeepSeek, Kimi, xAI 등을 포함하며, 대부분 API 키는 해당 환경 변수로도 넣을 수 있습니다. ChatGPT 프로바이더는 `ocr auth login`으로 만든 자격 증명을 쓰고, AWS Bedrock은 AWS 자격 증명 체인을 사용합니다. OpenAI·Anthropic 호환 커스텀 엔드포인트도 추가할 수 있습니다.

연결이 안 되면 다음을 먼저 봅니다.

- `no valid LLM endpoint configured`: 설정 파일이나 `OCR_LLM_URL` / `OCR_LLM_TOKEN` / `OCR_LLM_MODEL` 같은 환경 변수에 완전한 (URL, 토큰, 모델) 조합이 없습니다.
- `ocr llm test`의 401 / 403: 토큰이 잘못됐거나 만료됐을 수 있습니다. Anthropic은 URL이 `/v1/messages`로 끝나고 `use_anthropic=true`, OpenAI 호환은 `/v1/chat/completions`에 `use_anthropic=false`여야 합니다.

실행마다 모델을 바꾸려면 저장된 설정을 건드리지 않고 플래그만 넘기면 됩니다.

```bash
ocr review --provider anthropic --model claude-opus-4-6 --format json
```

## 사용 방법

Git 저장소로 이동한 뒤 리뷰합니다. `ocr review`에 플래그를 주지 않으면 **워크스페이스 모드**로, 현재 작업 트리의 staged·unstaged·untracked 변경을 모두 봅니다. `--from`/`--to`와 `--commit`은 함께 쓸 수 없고, 섞으면 오류가 납니다.

```bash
cd your-project

# 워크스페이스 모드 — staged, unstaged, untracked 변경
ocr review

# 현재 브랜치가 main에서 갈라진 이후의 커밋된 변경 (--to 기본값은 HEAD)
ocr review --from main

# 브랜치 범위 — merge-base(main, feature-branch)..feature-branch
ocr review --from main --to feature-branch

# 단일 커밋
ocr review --commit abc123

# LLM을 호출하지 않고, 어떤 파일이 리뷰·제외되는지 먼저 확인
ocr review --preview

# 결과를 파일로 저장 (호스트 에이전트·CI에 권장)
ocr review --format json --output result.json

# stdout에는 JSON만, 진행 로그는 숨김
ocr review --format json --audience agent > review.json
```

중단된 범위·커밋·워크스페이스 리뷰는 세션으로 재개할 수 있습니다. `--resume`과 `--preview`는 함께 쓸 수 없습니다.

```bash
ocr session list
ocr review --from main --to feature-branch --resume <session-id>
```

diff 대신 파일 전체를 보려면 `ocr scan`을 씁니다. Git 이력이 없어도 됩니다.

```bash
ocr scan                          # 저장소 전체
ocr scan --path internal/agent    # 디렉터리 또는 특정 파일
ocr scan --path internal/agent,internal/llm/client.go
ocr scan --preview
ocr scan --resume <session-id>
```

자주 쓰는 품질·비용 조절 플래그는 다음과 같습니다. 기본값은 CLI 레퍼런스 기준입니다.

- `--effort`: `low`(1라운드), `medium`(2라운드, 기본), `high`(3라운드). 라운드가 늘면 재현율은 올라가고 비용도 비례해 커집니다. 문서의 표현을 빌리면, 리뷰가 얕게 느껴질 때 `--effort high`가 가장 저렴한 품질 레버이고, `--effort low`는 기본 대비 비용을 대략 절반으로 줄이는 빠른 점검용입니다.
- `--background` / `--background-file`: PR 설명이나 요구사항을 프롬프트에 넣습니다. 문서도 다른 에이전트에서 호출할 때 이 플래그를 넘기라고 강조합니다.
- `--concurrency`: 동시에 돌릴 서브태스크 수. 기본값은 8입니다.
- `--exclude`: 이번 실행에서 추가로 제외할 패턴입니다.

위임 모드를 직접 쓸 때는 OCR이 파일 목록과 규칙만 준비하고, 호스트 에이전트가 리뷰합니다.

```bash
ocr delegate preview
ocr delegate preview --from main --to feature
ocr delegate rule src/main.go src/handler.go
```

CI에서는 보통 브랜치 범위 리뷰를 기계가 읽기 쉬운 형태로 돌립니다.

```bash
ocr review \
  --from "origin/<base-branch>" \
  --to "origin/<head-branch>" \
  --format json \
  --audience agent
```

GitHub Actions 예시는 저장소의 [`examples/github_actions/ocr-review.yml`](https://github.com/alibaba/open-code-review/blob/main/examples/github_actions/ocr-review.yml)에 있고, 아래처럼 가져와 쓸 수 있습니다.

```bash
mkdir -p .github/workflows
curl -o .github/workflows/ocr-review.yml \
  https://raw.githubusercontent.com/alibaba/open-code-review/main/examples/github_actions/ocr-review.yml
```

### 프로젝트 규칙 커스터마이즈

규칙은 네 층으로 해석되고, 파일마다 **먼저 매칭된 층이 이깁니다**.

1. `--rule` 플래그 (가장 높음)
2. 프로젝트의 `<repo>/.opencodereview/rule.json` (커밋해도 됨)
3. 사용자 전역 `~/.opencodereview/rule.json`
4. 바이너리에 내장된 시스템 기본 규칙

상위 층 파일이 없으면 그냥 건너뜁니다. 시스템 규칙 층은 항상 있으므로, 어떤 파일이든 규칙은 하나 이상 정해집니다. 간단한 프로젝트 규칙 예시는 문서에 이렇게 나옵니다.

```json
{
  "include": ["src/**/*.{ts,tsx}", "src/**/*.go"],
  "exclude": ["**/*.test.ts", "**/generated/**"],
  "rules": [
    {
      "path": "src/api/**/*.go",
      "rule": "All exported handlers must validate request bodies before use."
    },
    {
      "path": "**/*mapper*.xml",
      "rule": "Check SQL for injection risks, parameter errors, and missing closing tags."
    }
  ]
}
```

`include`는 화이트리스트가 아니라, 기본 제외 패턴을 우회하는 경로입니다. `exclude`는 사용자 필터 중에서 우선순위가 가장 높고, `rules`는 선언 순서대로 첫 매칭이 적용됩니다. 사용자 규칙은 기본적으로 시스템 규칙을 **대체**하므로, 언어별 내장 규칙을 유지한 채 보안 점검을 얹으려면 `merge_system_rule`을 `true`로 둬야 합니다. 어떤 규칙이 붙었는지는 LLM 비용 없이 확인할 수 있습니다.

```bash
ocr rules check src/main/java/com/example/UserService.java
ocr review --preview
```

## 한계와 주의점

문서와 FAQ에 분명히 적혀 있는 제약입니다.

- **정밀도를 위해 재현율을 양보합니다.** 벤치마크에서 범용 에이전트보다 Recall이 낮습니다. 놓치는 결함이 더 있을 수 있다는 뜻입니다.
- **Git 전용입니다.** diff 제공자가 `git`을 호출하므로 SVN, Mercurial 등은 지원하지 않습니다. `ocr review`는 Git 작업 트리가 아니면 `not a git repository`로 바로 종료됩니다. `--repo`로 경로를 넘길 수는 있습니다.
- **모델은 네이티브 tool calling을 지원해야 합니다.** 도구 호출을 본문에 서술만 하는 모델은 리뷰가 `No tool calls parsed`를 반복하다 코멘트 없이 끝날 수 있습니다. FAQ는 `deepseek-r1`을 흔한 예로 들고, Ollama에서는 tools 태그가 있는 모델(예: `qwen3`)을 고르라고 합니다.
- **시크릿을 보내기 전에 가려 주는 기능은 내장되어 있지 않습니다.** 권장 방법은 시크릿을 커밋하지 않고, 해시 재료가 있는 파일을 `exclude`에 넣으며, 필요하면 diff 쪽에서 사전에 가리는 것입니다.
- **너무 큰 diff는 모델에 전달되기 전에 빠집니다.** 한 파일의 diff만으로 `MAX_TOKENS` 기본값(200000)의 80%를 넘으면 해당 파일은 로그에만 남고 리뷰에서 제외되며, 실행 자체는 실패하지 않습니다.
- **위임 모드는 네이티브 파이프라인 전체가 아닙니다.** 파일 선택과 규칙, 가드레일은 OCR이 맡지만 분석·위치 지정·보고는 호스트 에이전트가 수행합니다.
- **MCP는 `ocr review`에만 연결됩니다.** OCR은 MCP 도구가 읽기 전용인지도 강제하지 않으므로, 서버 권한과 데이터 접근을 직접 확인해야 합니다.
- **코딩 에이전트 구독은 네이티브 모드 API 키가 아닙니다.** 네이티브 리뷰는 OCR 프로바이더 설정이 별도로 필요합니다.

상태를 지우려면 `~/.opencodereview`를 삭제하면 됩니다. 문서에 따르면 OCR은 npm 설치 시 일시적인 바이너리 다운로드를 제외하면 이 디렉터리 밖에는 쓰지 않습니다. npm 패키지 제거는 `npm uninstall -g @alibaba-group/open-code-review`입니다.

## 마치며

Open Code Review는 "에이전트에게 리뷰를 부탁하는 스킬"이 아니라, 파일 선택·묶기·규칙 매칭·코멘트 위치를 엔지니어링으로 고정한 뒤 그 안에서 LLM을 돌리는 도구입니다. 로컬 변경을 `ocr review`로 보거나, 에이전트 스킬·플러그인으로 에디터 안에서 쓰거나, CI에서 JSON을 받아 PR에 달 수 있습니다. 별도 키가 없다면 위임 모드로 시작하고, 전체 파이프라인과 내장 도구 루프가 필요하면 네이티브 모드로 프로바이더를 설정하면 됩니다.

아직 빠르게 움직이는 프로젝트이므로, 설치한 버전의 `ocr review --help`와 저장소 문서를 한 번 더 확인하는 편이 안전합니다. 이 글의 명령과 숫자는 작성 시점에 확인한 저장소 문서에 근거합니다.

## 참고

- [alibaba/open-code-review](https://github.com/alibaba/open-code-review) — 소스 저장소와 README
- [open-codereview.ai](https://open-codereview.ai) — 공식 사이트
- [한국어 README](https://github.com/alibaba/open-code-review/blob/main/docs/i18n/README.ko-KR.md)
- [설치 문서 소스](https://github.com/alibaba/open-code-review/blob/main/pages/src/content/docs/ko/installation.md)
- [설정 문서 소스](https://github.com/alibaba/open-code-review/blob/main/pages/src/content/docs/ko/configuration.md)
- [CLI 레퍼런스 소스](https://github.com/alibaba/open-code-review/blob/main/pages/src/content/docs/ko/cli-reference.md)
- [위임 모드 문서 소스](https://github.com/alibaba/open-code-review/blob/main/pages/src/content/docs/ko/integrations/delegate.md)
- [플러그인 설치 가이드](https://github.com/alibaba/open-code-review/blob/main/plugins/open-code-review/README.md)
- [GitHub Actions 워크플로 예시](https://github.com/alibaba/open-code-review/blob/main/examples/github_actions/ocr-review.yml)
