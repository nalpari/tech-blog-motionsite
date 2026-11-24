---
title: "Modern Web Guidance: 코딩 에이전트를 최신 웹 모범 사례로 이끄는 스킬"
description: "Google Chrome이 공개한 Modern Web Guidance의 소개, 소스·배포 저장소 구조, 설치와 검색·조회·레거시 스캔 사용법, Baseline 설정과 주의점 정리"
date: 2026-11-24T16:01:36+09:00
tags: ["Dev tools", "AI"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/modern-web-guidance.png"
featured: false
---

코딩 에이전트에게 모달, 툴팁, 이미지 최적화 같은 웹 UI 작업을 시키면, 이미 브라우저가 기본으로 제공하는 API가 있는데도 오래된 패턴의 무거운 JavaScript를 짜는 일이 잦습니다. 학습 데이터에 레거시 코드가 워낙 많아서, 모델이 API 이름 정도는 알아도 실제 프로덕션에 쓸 만한 최신 구현 패턴은 밀도가 부족한 경우가 많습니다.

[Modern Web Guidance](https://developer.chrome.com/docs/modern-web-guidance)는 웹 플랫폼 전문 지식, 모범 사례, 브라우저 호환성 데이터를 코딩 에이전트에 직접 심는 스킬 세트입니다. 에이전트가 낡은 패턴으로 기울지 않고, 최신 웹 플랫폼의 능력을 쓰도록 이끄는 것이 목적입니다. Google Chrome, Microsoft Edge, Mozilla Firefox, MDN 팀이 웹 개발 커뮤니티와 함께 운영합니다.

이 글은 소스 저장소 [GoogleChrome/modern-web-guidance-src](https://github.com/GoogleChrome/modern-web-guidance-src)와 공식 문서, 배포 저장소 README를 바탕으로 무엇이고 왜 쓰는지, 어떻게 설치하고 쓰는지까지 정리합니다. 명령과 플래그는 문서에 적힌 것만 옮겼습니다.

## Modern Web Guidance는 무엇인가

Modern Web Guidance는 코딩 에이전트가 웹 UI, CSS 레이아웃·애니메이션, 클라이언트 사이드 JavaScript 작업을 시작할 때, CLI로 전문가 검토를 거친 가이드를 찾아 컨텍스트에 넣는 도구입니다. 설치하면 `modern-web-guidance` 스킬이 에이전트에게 이 CLI를 쓰도록 지시합니다. 공식 시작 문서는 이를 "에이전트 스킬이 `modern-web-guidance` CLI를 호출해 유스케이스에 맞는 가이드를 찾게 하는 구조"라고 설명합니다.

사용자가 설치하지 않고도 CLI만으로 가이드 라이브러리를 살펴볼 수 있습니다. Node.js 22 이상이 필요하고, npm 패키지는 [`modern-web-guidance`](https://www.npmjs.com/package/modern-web-guidance)입니다.

프로젝트는 소스와 배포를 나눈 이중 저장소 구조입니다.

- **소스 저장소** ([GoogleChrome/modern-web-guidance-src](https://github.com/GoogleChrome/modern-web-guidance-src)): 가이드 원본, 개발 스크립트, 평가 하니스, 테스트, CLI 도구가 들어 있습니다. 이슈와 Pull Request는 모두 여기에 올립니다.
- **배포 저장소** ([GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance)): 코딩 에이전트가 실제로 설치하는, 컴파일된 Skills와 플러그인 설정만 담긴 읽기 전용 배포본입니다.

소스 쪽에 병합된 변경은 주간 릴리스로 배포 저장소와 npm 패키지에 반영됩니다. 릴리스 문서 기준으로는 GitHub Actions가 매주 월요일 14:50 UTC(한국 시간 월요일 23:50)에 자동 게시합니다. 소프트웨어 코드는 **Apache-2.0**, `guides/` 아래 문서와 가이드는 **CC-BY 4.0**입니다.

Chrome은 2026년 11월 10일 공식 블로그에서 [Modern Web Guidance 1.0 안정판](https://developer.chrome.com/blog/modern-web-guidance-v1)을 발표했습니다. 기존 코드베이스를 훑어 현대화 지점을 찾는 워크플로, 공개 평가 대시보드, 가이드에 대한 더 깊은 전문가 검토가 포함되었고, Firefox와 Edge가 프로젝트에 합류했다고 소개합니다.

## 왜, 언제 쓰나

공식 시작 문서는 가이드 없이 쓰는 모델의 약점을 세 가지로 꼽습니다.

- 최신 웹 문제를 오래된 방식으로 푸는 경향이 있고, 네이티브 HTML·CSS API로 충분한 일에도 JavaScript를 붙이기 쉽습니다.
- 최신 웹 플랫폼 기능을 모르거나, 잘못된 정보를 갖고 있는 경우가 있습니다.
- 프로젝트의 브라우저 지원 기준, 특히 Baseline 목표를 반영하지 못한 채 일반적인 조언을 내놓기 쉽습니다.

Modern Web Guidance는 이 간격을 메우기 위해, 전문가가 큐레이션한 가이드를 에이전트 컨텍스트에 직접 넣습니다. README가 강조하는 초점은 다음 세 가지입니다.

- **최신 브라우저 API**: 모델이 자주 잘못 쓰는 API를 올바른 구조로 쓰도록 돕습니다.
- **성능과 접근성**: 브라우저가 최적화할 수 있고, 접근성 배려가 내장된 플랫폼 API를 우선합니다.
- **책임 있는 폴백**: 무거운 폴리필이나 레거시 라이브러리 대신, 가볍고 합리적인 폴백을 쓰도록 안내합니다.

다음 상황에 잘 맞습니다.

- Claude Code, Copilot CLI, Codex, Antigravity, Grok 같은 코딩 에이전트로 웹 UI를 새로 만들 때
- 기존 모달·툴팁·레거시 패턴을 네이티브 `<dialog>`, Popover API, CSS Anchor Positioning 등으로 옮기고 싶을 때
- LCP, INP, 프리로드 같은 성능 작업이나 WebAuthn 패스키, CSP 같은 보안 작업을 에이전트와 함께할 때
- Chrome 확장 프로그램을 개발해서, 기본 웹 가이드와 함께 Manifest V3용 스킬 팩이 필요할 때

반대로, 백엔드(SQL, ORM, API 라우트)나 CI/Docker 같은 인프라 작업에는 스킬 문서가 트리거하지 말라고 적혀 있습니다. 가이드는 바닐라 HTML/CSS/JS 기준이므로, 프레임워크 프로젝트에서는 최신 플랫폼 기능을 버리지 않는 선에서 맞게 옮겨야 합니다.

## 핵심 구조와 구성

### 에이전트가 가이드를 가져오는 흐름

README가 설명하는 동작은 세 단계입니다.

1. **활성화**: 관련 작업을 받은 코딩 에이전트가 `modern-web-guidance` 스킬을 켭니다. 에이전트는 웹 플랫폼 질문에 이 CLI를 쓰라는 지시를 받습니다.
2. **로컬 의미 검색**: 에이전트가 `modern-web-guidance search "<query>"`를 실행합니다. 오프라인, 무의존 임베딩 모델과 BM25 검색 엔진이 로컬에서 쿼리와 가이드를 짝짓습니다. 검색 API 호출이나 API 키는 없습니다.
3. **가이드 조회**: 에이전트가 `modern-web-guidance retrieve <guide-id>`로 가이드를 가져와, 코드 패턴과 주의점, 폴백을 컨텍스트에 넣습니다.

`npx`를 쓰는 이유는 가이드를 최신으로 유지하기 위해서입니다. 한 번 캐시된 뒤에는 `npx --offline`으로 CLI를 완전히 오프라인에서 쓸 수 있고, 패키지 자체는 의존성 없는 단일 번들입니다. 온라인이면 실행을 막지 않는 익명 사용 텔레메트리가 백그라운드로 나가며, 이 부분은 뒤에서 다시 정리합니다.

### 가이드가 다루는 범위

가이드는 최근 몇 년의 웹 플랫폼 새 기능부터 최전선까지 다루며, **토큰 효율**을 목표로 작성됩니다. 모델이 이미 아는 최저 공통분모 내용은 평가를 통해 걷어 낸다고 설명합니다.

공식 시작 문서는 100개가 넘는 웹 개발 유스케이스에 대한 모범 사례를 포함한다고 소개하고, 문서 랜딩 페이지는 200개 이상의 전문가 검토 가이드라고 안내합니다. 배포 저장소 README의 카탈로그는 작성 시점 기준으로 **269개의 모던 웹 기능**을 CSS & Layout 144개, HTML & DOM 38개, JavaScript & APIs 87개로 나눠 보여 줍니다. 기능 목록과 가이드 개수를 한 숫자로 합치지는 않겠습니다. 최신 목록은 README와 [가이드 카탈로그](https://github.com/GoogleChrome/modern-web-guidance)에서 확인하는 편이 안전합니다.

README가 소개하는 핵심 분야는 다음과 같습니다.

- **User Experience**: View Transitions, 진입·종료 애니메이션, 패럴랙스 스크롤, CSS `scrollbar-color`
- **CSS Layout**: 컨테이너 쿼리, 서브그리드, `oklch` 같은 최신 색 공간, `text-wrap` 조정, 줄 높이 트리밍
- **Performance**: 즉시 프리로드, INP 진단, `scheduler.yield`로 긴 작업 나누기
- **Forms & UI**: 툴팁용 Anchor Positioning, Popover API, 다이얼로그, `:user-invalid` 검증, 자동 크기 필드
- **Accessibility**: 스크린 리더와 키보드 조작, 콘텐츠 탐색과 발견 가능성
- **Built-in AI**: 네이티브 번역, 요약, 언어 감지 API처럼 기기의 로컬 모델

소스 저장소의 `guides/`는 도메인 카테고리로 나뉩니다. `accessibility`, `built-in-ai`, `css`, `forms`, `html`, `js`, `performance`, `privacy`, `pwa`, `security`, `ui-atoms`, `ui-behaviors`, `ui-components`, `user-experience`, `visual-design`, `wasm`, `webmcp` 등이 있습니다. 새 가이드는 보통 `guide.md`, `demo.html`, `expectations.md` 세 파일로 작성합니다. 배포본에서 가이드가 어떻게 생겼는지 보고 싶다면 README가 예시로 드는 [`navigation-drawer`](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/guides/ui-components/navigation-drawer.md)를 보면 됩니다.

안전하고 현대적인 도입을 위해 가이드는 다음도 다룹니다.

- **점진적 향상과 폴백**: 스펙큘레이티브 프리로드처럼 오래된 브라우저가 조용히 무시해도 되는 부가 기능과, 다이얼로그 제어나 네트워크 비컨처럼 가벼운 폴백이 필요한 핵심 동작을 구분합니다. 책임 있는 폴백은 50줄 미만의 사례별 구현, 또는 필요할 때만 불러오는 폴리필을 우선하고 무거운 서드파티 번들은 피합니다.
- **Gotcha**: `fetchLater()`의 64KB 페이로드 한도, macOS 특유의 스크롤바 동작처럼 잘 드러나지 않는 제약을 적습니다.
- **Baseline 연동**: [Baseline](https://web-platform-dx.github.io/web-features/) 프로젝트의 호환성 데이터를 써서, 에이전트가 현재 브라우저 지원 상황에 맞게 적응합니다.
- **Origin Trial과 변동성 큰 기능**: 실험적 Origin Trial API, 또는 최근 3개월 안에 단일 엔진에만 출시되었거나 아직 안정화 중인 기능은 `search`로는 찾을 수 있지만, `retrieve`는 개발자가 명시적으로 허용하기 전에는 막혀 있습니다.

### 스킬 팩

설치 시 `--choose` 플래그로 어떤 스킬 팩을 넣을지 고를 수 있습니다.

- **`modern-web-guidance`** (README 표기 약 205토큰): 최신 브라우저 API, 레이아웃, 성능에 대한 종합 가이드
- **`chrome-extensions`** (README 표기 약 175토큰): Manifest V3, 백그라운드 워커, 확장 API, Chrome 웹 스토어 게시

공식 시작 문서는 Chrome 확장을 개발할 때 `install --choose`를 쓰라고 권합니다.

### 평가로 효과를 검증하는 방식

내용은 평가 하니스로 계속 보정합니다. 전문가 작성 가이드와 데모에서 실제 웹앱 과제, Golden 솔루션, Playwright 그레이더를 만들고, Golden은 100% 통과·수정하지 않은 베이스 앱은 100% 실패하도록 그레이더를 맞춘 다음, 가이드를 켠 에이전트와 켜지 않은 에이전트의 통과율을 비교합니다. 과제 프롬프트는 API 이름을 직접 대지 않아서, 에이전트가 가이드를 스스로 찾아 적용하는지를 봅니다.

공개 결과는 [Eval Dashboard](https://googlechrome.github.io/modern-web-guidance-src/)에서 에이전트·가이드별로 볼 수 있습니다. README에 실린 최근 스냅샷 일부는 다음과 같습니다. 날짜 열은 연도 없이 `Nov 20`처럼 적혀 있습니다.

| Date | Agent + Model | Tasks / Checks | Unguided → Guided (Uplift) |
| :--- | :--- | :---: | :---: |
| Nov 20 | codex_cli (gpt-6.1-sol) | 229 / 1961 | 49% → 85% (**+36pp**) |
| Nov 20 | claude_code (opus-5-5) | 229 / 1961 | 54% → 94% (**+40pp**) |
| Nov 20 | antigravity_cli (gemini-4-argon) | 229 / 1955 | 56% → 97% (**+41pp**) |

공식 시작 문서는 초기 결과 기준으로, Modern Web Guidance를 쓴 에이전트가 최신 모범 사례를 따르는 비율이 평균 37퍼센트포인트 올랐다고 적으면서, 프로젝트 요구 사항, 모델, 프롬프트, 에이전트에 따라 달라질 수 있다고 못 박습니다. 스냅샷의 상승폭과 같은 방향이지만, 이 숫자들을 모든 환경의 보장으로 읽지는 않는 것이 좋겠습니다.

## 설치

권장 방법은 Chrome 팀이 만든 CLI입니다. 공식 시작 문서는 이 경로가 자동 업데이트를 켠다고 설명합니다.

```bash
npx modern-web-guidance@latest install
```

대화형 마법사가 뜹니다. Chrome 확장을 개발하거나, 설치할 스킬 팩을 직접 고르려면 다음을 씁니다.

```bash
npx modern-web-guidance@latest install --choose
```

설치 전에 라이브러리만 시험해 보려면 다음처럼 검색, 조회, 레거시 스캔을 바로 실행할 수 있습니다.

```bash
# 관련 가이드 검색
npx modern-web-guidance@latest search "animate a dialog modal backdrop"

# ID로 가이드 조회
npx modern-web-guidance@latest retrieve "animate-to-from-top-layer"

# 코드베이스에서 현대화할 레거시 패턴 스캔
npx modern-web-guidance@latest legacy-scan .
```

스킬을 지원하는 에이전트라면 CLI 없이 에이전트별 방법으로도 설치할 수 있습니다. 다만 공식 시작 문서는 이 경로 대부분은 자동 업데이트를 지원하지 않는다고 적습니다. 문서에 나온 예시는 다음과 같습니다.

| 환경 | 명령 또는 경로 |
|---|---|
| Vercel Skills CLI | `npx skills add GoogleChrome/modern-web-guidance` |
| GitHub CLI | `gh skill install GoogleChrome/modern-web-guidance` |
| Antigravity CLI | `agy plugin install https://github.com/GoogleChrome/modern-web-guidance` |
| Gemini CLI | `gemini extensions install https://github.com/GoogleChrome/modern-web-guidance --auto-update` |
| Claude Code | `claude plugin marketplace add GoogleChrome/modern-web-guidance` 후 `claude plugin install modern-web-guidance@googlechrome` |
| OpenAI Codex | `codex plugin marketplace add GoogleChrome/modern-web-guidance` 후 `codex plugin add modern-web-guidance@googlechrome` |
| Copilot CLI | `/plugin marketplace add GoogleChrome/modern-web-guidance` 후 `/plugin install modern-web-guidance@googlechrome` |
| Grok Build CLI | `grok plugin install https://github.com/GoogleChrome/modern-web-guidance --trust` |
| Kimi Code | `/plugins install https://github.com/GoogleChrome/modern-web-guidance` |
| Goose | `goose plugin install https://github.com/GoogleChrome/modern-web-guidance --auto-update` |
| JetBrains WebStorm | Settings > AI Assistant > Skills의 Skill Manager에서 설치 |

배포 README에는 이 밖에도 Pi용 `pi install git:github.com/GoogleChrome/modern-web-guidance`와, Claude Code 앱 안에서 `/plugin` 슬래시 명령으로 마켓플레이스를 추가한 뒤 AutoUpdate를 켜고 `/reload-plugins`를 실행하는 절차가 있습니다.

이미 설치한 뒤 올리려면, CLI로 설치한 경우 다음이면 됩니다.

```bash
npx modern-web-guidance@latest update
```

한 가지 함정이 있습니다. README에 따르면 Anthropic의 기본 `claude-plugins-official` 마켓플레이스는 10월 12일부터 서드파티 플러그인 업데이트를 중단해, 이 경로로 설치한 버전이 `v0.0.194`에 머물렀습니다. 자세한 경위는 소스 저장소 [이슈 #3533](https://github.com/GoogleChrome/modern-web-guidance-src/issues/3533)에 있습니다. 업데이트를 받으려면 기존 플러그인을 제거하고 `googlechrome` 마켓플레이스로 다시 설치해야 합니다.

```shell
/plugin uninstall modern-web-guidance@claude-plugins-official
/plugin marketplace add GoogleChrome/modern-web-guidance
/plugin install modern-web-guidance@googlechrome
/plugin  # GoogleChrome 마켓플레이스를 선택하고 AutoUpdate를 켭니다
/reload-plugins
```

## 설정

### Baseline 목표

[Baseline](https://developer.chrome.com/docs/modern-web-guidance/get-started)은 주요 브라우저 엔진에서 기능이 상호 운용 가능한지를 Limited / Newly available / Widely available로 나눕니다. Widely available는 상호 운용된 지 최소 30개월 이상 지난 기능입니다.

프로젝트의 Baseline 목표는 `AGENTS.md` 또는 `CLAUDE.md`에 적어 설정합니다. 공식 문서 예시는 다음과 같습니다.

```
This project's Baseline target is Baseline 2024.
```

설치만 하고 목표를 적지 않으면, Modern Web Guidance는 **Baseline Widely available**를 기본값으로 씁니다. Widely available가 아닌 기능은 가이드가 더 넓은 호환을 위한 구체적 지침을 제공합니다. 많은 경우 점진적 향상이고, 폴리필이 필요하면 지원되지 않는 환경에서만 불러오도록 에이전트에 지시합니다.

스킬 문서의 기본 해석은, Baseline Widely available 기능은 폴백 없이 써도 안전하고, 그 이하 기능은 사용자가 별도 지원 정책을 정하지 않았다면 가이드의 폴백 권고를 따라야 한다는 것입니다. 커스텀 정책 예시는 "폴백을 구현하지 말 것", "Safari 17.4+", "폴리필 대신 가벼운 커스텀 폴백이나 재설계" 같은 문장입니다.

### Origin Trial과 변동성 큰 기능 허용

저장소 루트의 `.mwgrc` JSON(또는 사용자 단위 폴백인 `~/.mwgrc`)으로 Origin Trial과 변동성 큰 기능을 허용할 수 있습니다. 팀과 공유하려면 이 파일을 커밋하면 됩니다.

| CLI 명령 | `.mwgrc` 키 | 효과 |
| :--- | :--- | :--- |
| `npx modern-web-guidance@latest set-allow-origin-trials` | `"allowOriginTrials": true` | 실험적 Origin Trial API 가이드를 잠금 해제합니다. |
| `npx modern-web-guidance@latest set-allow-volatile-features` | `"allowVolatileFeatures": true` | 변동성 큰 단일 엔진 기능 가이드를 잠금 해제합니다. |

공식 문서는 변동성 큰 기능이 한 엔진에만 최근에 출시되었거나 아직 안정화 중일 수 있어, 이후 브라우저 변경에 따라 구현을 고쳐야 할 수 있다고 주의합니다. 가이드에 폴백이 있어도, 이 잠금은 의도적으로 기본 해제되어 있습니다.

### 텔레메트리

온라인에서 CLI를 쓰면 Google이 익명 사용 정보를 수집합니다. 수집 항목은 설치 횟수, 호출한 에이전트 이름, 조회한 가이드 ID, 에이전트가 생성한 CLI 검색 쿼리(예: `"dark mode scrollbar color-scheme"`)입니다. 사용자의 원본 프롬프트는 수집하지 않는다고 적혀 있습니다. 실제 수집 내용은 소스의 [`modern-web.ts`](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/src/cli/modern-web.ts)에서 확인할 수 있습니다.

끄려면 셸 프로필에 다음을 넣습니다.

```bash
export DISABLE_TELEMETRY=1
```

## 사용 방법

설치 후 일상 사용의 중심은 `search`와 `retrieve`입니다. 스킬이 켜진 에이전트에게는 웹 UI 작업을 맡기면 이 흐름을 타게 됩니다. 직접 확인하거나, 에이전트 없이 가이드만 읽고 싶을 때도 같은 명령을 쓸 수 있습니다.

### 가이드 검색과 조회

공식 시작 문서의 예시는 다이얼로그 배경 애니메이션을 찾는 검색입니다.

```bash
npx modern-web-guidance@latest search "animate a dialog modal backdrop"
```

문서는 터미널에 아래와 같은 JSON이 나온다고 보여 줍니다. `description`을 읽고 목적에 맞는 `id`를 고른 뒤 `retrieve`하면 됩니다.

```json
[
  {
    "id": "light-dismiss-a-dialog",
    "description": "Create a modal dialog that can be closed via light dismiss (i.e. clicking or tapping outside of the dialog)",
    "category": "ui-behaviors",
    "featuresUsed": ["<dialog closedby>"],
    "tokenCount": 1085,
    "similarity": 0.7076
  },
  {
    "id": "animate-to-from-top-layer",
    "description": "Animate elements such as dialogs, popovers, and tooltips as they're entering/exiting the top layer.",
    "category": "ui-behaviors",
    "featuresUsed": ["::backdrop", "<dialog>", "overlay", "Popover", "@starting-style", "transition-behavior"],
    "tokenCount": 1541,
    "similarity": 0.6842
  }
]
```

이어서 가이드 본문을 가져옵니다.

```bash
npx modern-web-guidance@latest retrieve "animate-to-from-top-layer"
```

선택한 유스케이스 가이드뿐 아니라, 작업에 해당하는 더 넓은 분야 가이드(`html`, `css`, `js`, `forms`, `accessibility`, `performance`, `security` 등)도 함께 가져오라고 스킬 문서는 안내합니다. 여러 ID는 쉼표로 구분합니다.

스킬이 에이전트에게 시키는 검색 방식도 알아 두면 좋습니다. 배포된 [`SKILL.md`](https://github.com/GoogleChrome/modern-web-guidance/blob/main/skills/modern-web-guidance/SKILL.md)는 **2~5단어의 행동 중심 영어 쿼리**로, 한 번에 하나의 웹 플랫폼 능력이나 UI 패턴만 찾으라고 합니다. 프레임워크 이름이나 앱·도메인 고유 명사는 빼고, "확인 후 삭제"처럼 의지만 있는 요청은 `"confirmation modal dialog"`처럼 UI 원시 요소 이름으로 바꿉니다. 좋은 예는 `"light dismiss dialog"`, `"responsive data table"`이고, `"dialog"`처럼 너무 짧거나 `"responsive table dark mode"`처럼 여러 주제를 한 쿼리에 넣는 것은 피하라고 적혀 있습니다. 결과가 약하면 한 번 다시 검색하고, 그래도 맞지 않으면 `list`로 넓게 보거나 관련 없는 가이드를 억지로 가져오지 않습니다.

pnpm을 쓰는 환경에서는 `npx` 대신 `pnpx`를 쓰라고 합니다. `pnpx`에는 `-y`가 필요 없습니다.

### 에이전트에 던져 볼 수 있는 프롬프트

공식 문서가 제시하는 예시 프롬프트입니다. 스킬이 설치되어 있다면 이런 요청에서 가이드 검색이 일어나길 기대할 수 있습니다.

새 경험을 만들 때:

```
Create an accordion-style stats component that smoothly animates on open and close.
```

```
Build a tab bar with a sliding highlight that tracks active items using CSS Anchor Positioning.
```

```
Design a dashboard card that uses container queries to adapt its layout to its own width.
```

레거시 코드를 현대화할 때:

```
Update legacy modal window implementations to use the <dialog> element and animate them using modern CSS features.
```

```
Migrate legacy tooltips to use the Popover API and CSS Anchor Positioning.
```

보안과 성능:

```
Implement a passkey-based login flow using the latest WebAuthn features.
```

```
Implement a starter Content Security Policy (CSP) without breaking my app.
```

```
Set up my app to begin preloading pages when users hover over important links.
```

```
My app has lots of long tasks, and its INP is affected. Help me fix it.
```

### 레거시 패턴 스캔

1.0에서 강조하는 현대화 워크플로는 `legacy-scan`입니다. 특정 기능이나 컴포넌트를 고치는 작업이 아니라, 코드베이스 전반의 레거시 패턴을 넓게 찾을 때 쓰라고 스킬 문서는 제한합니다.

```bash
npx modern-web-guidance@latest legacy-scan .
```

JSON이 필요하면 경로와 함께 `--json`을 붙입니다.

```bash
npx modern-web-guidance@latest legacy-scan <path> --json
```

흐름은 스캔, 검증, 보고, (현대화 요청이 있으면) 가이드를 조회해 교체한 뒤 다시 스캔하는 순서입니다. 각 결과는 `keepWhen` / `dropWhen` 기준으로 오탐을 걸러야 하고, 폴백이나 벤더 코드, 닮은꼴을 성급히 지우면 안 됩니다. 중요한 제약은, `legacy-scan`이 가이드 전체의 결정적 레거시 규칙을 검사하는 것이 아니라, 카탈로그의 약 20%만 본다는 점입니다. 스캔 결과가 비었다고 해서 현대화할 곳이 하나도 없다는 뜻은 아닙니다.

### 공식 문서와 함께 쓰기

공식 시작 문서는 [Developer Knowledge MCP 서버](https://developer.chrome.com/docs/modern-web-guidance/get-started)와 짝을 지으라고 소개합니다. Modern Web Guidance가 "어떤 최신 패턴을 쓸지"를 알려 주고, CSS 문법이나 Built-in AI API, 현재 Baseline 상태처럼 최신 문서가 더 필요하면 이 MCP가 `developer.chrome.com`과 `web.dev`를 검색합니다. 문서가 드는 조합 프롬프트는 다음과 같습니다.

```
Use Modern Web Guidance to build an accessible popover tooltip with CSS Anchor
Positioning, and check the official Chrome docs for the current browser support
and any fallback this project's Baseline target requires.
```

## 한계와 주의점

문서 기준으로 미리 알아 둘 점은 다음과 같습니다.

- **기본값은 보수적입니다.** Origin Trial과 변동성 큰 기능은 검색은 되지만, 허용 설정을 켜기 전에는 조회가 막힙니다. Baseline 목표를 적지 않으면 Widely available가 기본입니다.
- **변동성 큰 기능은 깨질 수 있습니다.** 폴백 전략이 있어도, 단일 엔진에 막 출시되었거나 아직 안정화 중인 API는 이후 변경될 수 있습니다.
- **설치 경로에 따라 업데이트가 다릅니다.** CLI 설치는 업데이트 명령과 자동 업데이트를 전제로 하고, 에이전트별 설치 상당수는 자동 업데이트가 없습니다. Claude Code의 `claude-plugins-official` 경로는 `v0.0.194`에 머무를 수 있어, `googlechrome` 마켓플레이스로 옮겨야 합니다.
- **`legacy-scan`은 전수가 아닙니다.** 결정적 레거시 규칙이 있는 가이드 약 20%만 검사합니다.
- **검색 품질은 쿼리에 달려 있습니다.** 스킬 문서는 짧거나 여러 주제를 섞거나, 프레임워크·앱 고유 명사가 섞인 쿼리를 피하라고 합니다.
- **텔레메트리가 기본입니다.** 원본 사용자 프롬프트는 수집하지 않는다고 하지만, 온라인에서는 검색 쿼리와 가이드 ID가 올라갑니다. 끄려면 `DISABLE_TELEMETRY=1`이 필요합니다.
- **평가 수치는 환경마다 다릅니다.** 공개 대시보드와 README 스냅샷은 참고이지, 내 모델·코드베이스의 보장값이 아닙니다.
- **가이드는 바닐라 기준입니다.** React, Vue, Tailwind 프로젝트에서는 최신 플랫폼 기능을 유지한 채 어댑터가 필요하고, 타입 정의나 SSR, 번들러 제약은 스킬 문서의 주의 사항을 따라야 합니다.
- **기여 허들은 높습니다.** 가이드는 에이전트가 그대로 섭취하므로, 완전히 새로운 가이드 작성은 온보딩된 Peer이거나 Content ATL·Owner의 허가가 필요합니다. 이슈로 유스케이스를 제안하거나 기존 가이드를 개선하는 PR은 열려 있습니다. 소스 저장소 개발은 pnpm과 Node.js 22.18.0 이상이 필요합니다.

## 마치며

Modern Web Guidance는 코딩 에이전트의 웹 지식을 최신으로 맞추기 위해, 전문가 가이드를 로컬 검색으로 필요한 만큼만 컨텍스트에 넣는 도구입니다. 소스 저장소에서 가이드를 작성하고 평가로 보정한 뒤, 배포 저장소와 npm 패키지로 에이전트에 전달하는 구조입니다.

처음 쓰려면 `npx modern-web-guidance@latest install`로 설치하고, `AGENTS.md`나 `CLAUDE.md`에 Baseline 목표를 적어 두는 것이 공식 문서의 흐름입니다. 설치 전에 `search`와 `retrieve`만으로 가이드 품질을 먼저 봐도 됩니다. 기존 코드베이스를 넓게 현대화하고 싶다면 `legacy-scan`을 쓰되, 카탈로그 일부만 본다는 점을 기억하면 좋겠습니다.

빠진 패턴이나 잘못된 가이드를 발견하면 소스 저장소에 [이슈](https://github.com/GoogleChrome/modern-web-guidance-src/issues)를 열면 됩니다.

## 참고

- [Modern Web Guidance 공식 문서](https://developer.chrome.com/docs/modern-web-guidance)
- [Get started with Modern Web Guidance](https://developer.chrome.com/docs/modern-web-guidance/get-started)
- [Modern Web Guidance 1.0 발표 글](https://developer.chrome.com/blog/modern-web-guidance-v1)
- [소스 저장소 GoogleChrome/modern-web-guidance-src](https://github.com/GoogleChrome/modern-web-guidance-src)
- [배포 저장소 GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance)
- [Eval Dashboard](https://googlechrome.github.io/modern-web-guidance-src/)
- [npm 패키지 modern-web-guidance](https://www.npmjs.com/package/modern-web-guidance)
- [CONTRIBUTING.md](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/CONTRIBUTING.md)
- [Claude 플러그인 업데이트 이슈 #3533](https://github.com/GoogleChrome/modern-web-guidance-src/issues/3533)
