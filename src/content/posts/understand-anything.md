---
title: "Understand Anything — 코드베이스를 인터랙티브 지식 그래프로"
description: "코드베이스를 인터랙티브 지식 그래프로"
date: 2026-05-16T11:38:50.343Z
tags: ["AI & ML"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/1778931506565-sp886m.png"
---

> "Graphs that teach > graphs that impress."
> 화려한 그래프가 아닌, 코드의 모든 조각이 어떻게 맞물려 있는지 조용히 가르쳐 주는 그래프.


![ChatGPT Image 2026년 5월 16일 오후 08 37 25](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1778931516954-rgevnb.png)


## 개요

새로 합류한 팀의 저장소를 처음 마주했을 때를 떠올려 보자. 20만 줄의 코드 앞에서 무엇부터 읽어야 할지 막막한 경험은 누구에게나 익숙하다. [Understand Anything](https://github.com/Lum1104/Understand-Anything)은 바로 이 지점을 겨냥한 멀티 플랫폼 플러그인이다. 멀티 에이전트 파이프라인이 프로젝트 전체를 스캔해 파일·함수·클래스·의존성을 추출하고, 이를 **인터랙티브 지식 그래프**로 시각화한다. MIT 라이선스로 공개된 본 프로젝트는 작성 시점 기준 14.7k 스타, 1.4k 포크를 기록하고 있을 만큼 빠르게 주목받고 있다.

핵심 가치는 명확하다. 코드를 "맹목적으로 읽는" 단계에서 "구조를 보는" 단계로 옮겨 가는 것. 그래프는 단순한 시각적 장식이 아니라, 아키텍처·도메인 흐름·변경 영향도를 학습 가능한 형태로 정리해 주는 학습 매체로 작동한다.

## 지원 플랫폼

Claude Code 플러그인으로 시작되었지만 현재는 광범위한 AI 코딩 도구를 지원한다. 이는 단일 코드베이스에서 다양한 어시스턴트의 플러그인 명세 파일(`.claude-plugin/`, `.cursor-plugin/`, `.copilot-plugin/`)을 분기해 관리하는 방식으로 구현되어 있다.

| 플랫폼 | 상태 | 설치 방법 |
| --- | --- | --- |
| Claude Code | ✅ Native | 플러그인 마켓플레이스 |
| Cursor | ✅ Supported | 저장소 클론 시 자동 감지 |
| VS Code + GitHub Copilot | ✅ Supported | 저장소 클론 시 자동 감지 |
| Copilot CLI | ✅ Supported | `copilot plugin install` |
| Codex / OpenCode / Gemini CLI | ✅ Supported | `install.sh <platform>` |
| Antigravity / Pi Agent / Vibe CLI | ✅ Supported | `install.sh <platform>` |
| Hermes / Cline / KIMI CLI / OpenClaw | ✅ Supported | `install.sh <platform>` |

## 주요 기능

### 구조 그래프(Structural Graph)

저장소 전체를 인터랙티브 노드 그래프로 탐색한다. 파일·함수·클래스 단위의 모든 객체가 노드로 변환되며, 클릭 한 번으로 해당 객체의 평문 요약, 의존 관계, 그리고 학습 동선을 제공하는 가이드 투어가 노출된다.

### 비즈니스 로직 뷰(Domain View)

기술적 모듈 구조를 넘어, 코드가 어떤 **비즈니스 도메인·플로우·스텝**에 매핑되는지를 수평형 그래프로 보여준다. PM이나 신규 합류자가 "결제 흐름이 어디서 시작해서 어디로 끝나는가"와 같은 질문에 그래프 한 장으로 답을 얻을 수 있다.

### 지식 베이스 분석(Knowledge Base View)

코드뿐 아니라 위키 형식의 지식 베이스도 동일한 방식으로 처리한다. [Karpathy 패턴 LLM 위키](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)를 입력으로 받으면 결정적(deterministic) 파서가 `index.md`의 위키링크와 카테고리를 추출하고, LLM 에이전트가 암묵적 관계·엔티티·주장(claim)을 발견해 커뮤니티 클러스터링이 적용된 힘 기반(force-directed) 그래프를 생성한다.

### 부가 기능 요약

- **가이드 투어**: 의존성 순서에 따라 자동 생성되는 아키텍처 워크스루
- **퍼지 및 시맨틱 검색**: "어느 부분이 인증을 처리하는가?"와 같은 의미 기반 질의 지원
- **Diff 영향도 분석**: 커밋 전 변경 사항이 시스템의 어느 부분에 파급 효과를 미치는지 시각화
- **페르소나 적응형 UI**: 신입 개발자·PM·파워 유저에 따라 대시보드 정보 밀도를 조정
- **레이어 시각화**: API/Service/Data/UI/Utility 등 아키텍처 레이어 단위 색상 그룹핑
- **언어 개념 주석**: 제네릭, 클로저, 데코레이터 등 12가지 프로그래밍 패턴을 발견 위치에 맞춰 설명

## 빠른 시작

### 1단계 — 플러그인 설치

Claude Code 기준 설치 명령은 두 줄로 끝난다.

```text
/plugin marketplace add Lum1104/Understand-Anything
/plugin install understand-anything
```

다른 플랫폼은 원라이너 설치 스크립트를 사용한다.

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/Lum1104/Understand-Anything/main/install.sh | bash

# 플랫폼을 명시해 프롬프트 생략
curl -fsSL https://raw.githubusercontent.com/Lum1104/Understand-Anything/main/install.sh | bash -s codex
```

```powershell
# Windows (PowerShell)
iwr -useb https://raw.githubusercontent.com/Lum1104/Understand-Anything/main/install.ps1 | iex
```

설치 스크립트는 저장소를 `~/.understand-anything/repo`에 클론하고 선택한 플랫폼에 맞는 심볼릭 링크를 생성한다. 설치 이후에는 사용 중인 CLI/IDE를 재시작해야 한다.

### 2단계 — 코드베이스 분석

```text
/understand
```

멀티 에이전트 파이프라인이 프로젝트를 스캔해 `.understand-anything/knowledge-graph.json`에 그래프를 저장한다. 한국어를 포함한 다국어 출력도 지원한다.

```text
# 한국어 출력
/understand --language ko

# 지원 언어: en(기본), zh, zh-TW, ja, ko
```

`--language` 옵션은 노드 요약·설명, 대시보드 UI 라벨, 가이드 투어 설명에 일괄 적용된다. 한국어 팀에서 도입할 때는 처음부터 `--language ko`로 지정해 두는 편이 운영상 유리하다.

### 3단계 — 대시보드 탐색

```text
/understand-dashboard
```

웹 대시보드가 열리면 코드베이스가 아키텍처 레이어별 색상으로 구분된 그래프로 나타난다. 검색·확대·필터링이 모두 가능하며, 노드를 선택하면 원본 코드와 관계도, 평문 설명이 함께 노출된다.

### 4단계 — 명령어 활용

| 명령 | 용도 |
| --- | --- |
| `/understand-chat <질문>` | 코드베이스 전반에 대한 자연어 Q&A |
| `/understand-diff` | 현재 변경 사항의 영향 범위 분석 |
| `/understand-explain <경로>` | 특정 파일/함수 심층 해설 |
| `/understand-onboard` | 신규 팀원용 온보딩 가이드 생성 |
| `/understand-domain` | 비즈니스 도메인·플로우·스텝 추출 |
| `/understand-knowledge <위키 경로>` | Karpathy 패턴 LLM 위키 분석 |

## 내부 동작 — 멀티 에이전트 파이프라인

`/understand` 명령은 5개의 전문 에이전트(`/understand-domain` 사용 시 6개, `/understand-knowledge` 사용 시 7개)를 오케스트레이션한다.

| 에이전트 | 역할 |
| --- | --- |
| `project-scanner` | 파일 발견, 언어·프레임워크 감지 |
| `file-analyzer` | 함수·클래스·임포트 추출 및 그래프 노드/엣지 생성 |
| `architecture-analyzer` | 아키텍처 레이어 식별 |
| `tour-builder` | 가이드 투어 생성 |
| `graph-reviewer` | 그래프 완전성 및 참조 무결성 검증 (기본 인라인, `--review`로 풀 LLM 리뷰) |
| `domain-analyzer` | 비즈니스 도메인·플로우·프로세스 스텝 추출 |
| `article-analyzer` | 위키 아티클에서 엔티티·주장·암묵 관계 추출 |

파일 분석기는 최대 5개 동시 실행, 배치당 20~30개 파일을 처리하며 병렬로 실행된다. 직전 실행 이후 변경된 파일만 다시 분석하는 **증분 업데이트(incremental update)** 도 지원하므로 대규모 저장소에서도 반복 실행 비용을 통제할 수 있다.

## 팀 도입 전략 — 그래프를 자산으로 관리하기

지식 그래프는 결국 JSON 파일이다. 저장소에 함께 커밋해 두면 팀원들은 파이프라인을 다시 실행하지 않아도 그래프를 활용할 수 있다. 온보딩 가이드, PR 리뷰, docs-as-code 워크플로우에 그대로 통합할 수 있다는 의미다.

커밋 대상은 `.understand-anything/` 디렉터리 전체이며, 로컬 스크래치인 다음 두 경로는 제외한다.

```gitignore
.understand-anything/intermediate/
.understand-anything/diff-overlay.json
```

그래프 최신성을 자동으로 유지하려면 `/understand --auto-update` 옵션을 활성화한다. 포스트 커밋 훅이 매 커밋마다 그래프를 증분 패치하므로 코드와 그래프의 시점 일관성이 유지된다. 릴리스 직전마다 수동으로 `/understand`를 재실행하는 보수적 운영도 가능하다.

그래프가 10MB를 초과하는 대규모 프로젝트에서는 git-lfs로 추적하는 것이 권장된다.

```bash
git lfs install
git lfs track ".understand-anything/*.json"
git add .gitattributes .understand-anything/
```

## 도입 시 고려할 점

본 도구는 LLM 호출을 전제로 한다. 따라서 (1) 코드 일부가 외부 모델로 전송되는 것에 대한 사내 정책, (2) 대규모 저장소 초기 분석 시 발생하는 토큰 비용, (3) 증분 업데이트가 잡아내지 못하는 구조 변경(예: 디렉터리 대규모 재편) 시 풀 리빌드 정책 — 이 세 가지를 사전에 정리해 두는 것이 안전하다.

또한 그래프가 제공하는 "비즈니스 도메인" 추론은 LLM의 해석에 의존한다. 실제 도메인 전문가의 검증을 거쳐 노드 설명을 보정하면 신규 합류자에게 훨씬 신뢰할 만한 학습 자료가 된다.

## 마치며

신규 합류자의 코드베이스 적응 시간을 단축하고, PR 리뷰 시 변경 영향도를 사전에 검토하며, 비즈니스 흐름을 시각적으로 공유한다 — 이 세 가지 효용만으로도 아키텍트팀이 검토할 가치는 충분하다. 특히 멀티 플랫폼 지원으로 팀 내 개발자별 선호 도구가 갈리는 환경(Claude Code, Cursor, Copilot 혼용)에서도 동일한 그래프 산출물을 공유할 수 있다는 점이 인상적이다.

지식 그래프를 코드와 함께 버저닝하는 발상은, 결국 "이해(understanding)"라는 암묵지를 명시지로 옮겨 두려는 시도다. 온보딩 문서가 늘 낡아 가는 문제를 안고 있다면, 한 번 도입을 검토해 볼 만하다.

## 참고 링크

- 저장소: [Lum1104/Understand-Anything](https://github.com/Lum1104/Understand-Anything)
- 공식 홈페이지: [understand-anything.com](https://understand-anything.com)
- 라이브 데모: [understand-anything.com/demo](https://understand-anything.com/demo/)
- 한국어 README: [README.ko-KR.md](https://github.com/Lum1104/Understand-Anything/blob/main/READMEs/README.ko-KR.md)
- 참고 예시 저장소(그래프 커밋 포함): [Lum1104/microservices-demo](https://github.com/Lum1104/microservices-demo)
