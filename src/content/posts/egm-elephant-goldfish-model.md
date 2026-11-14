---
title: "EGM(Elephant-Goldfish Model): 구현 전에 계획의 빈틈을 찾는 Google의 AI 플러그인"
description: "코끼리(맥락을 아는 작성자)와 금붕어(맥락이 없는 리뷰어)로 계획을 검증하는 EGM의 개념, 설치, 명령어 흐름과 drift 점검까지"
date: 2026-11-14T00:00:00.000Z
tags: ["AI", "claude", "plugin"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/egm-cover.png"
---

## 들어가며

코딩 에이전트에게 기능을 맡기면 대개 곧바로 만들기 시작합니다. 문제는 만든 뒤에야 드러납니다. 계획 모드를 써도 비슷합니다. 계획을 세운 대화창에서 같은 에이전트가 그 계획을 다시 검토하니, 사실상 자기 생각에 동의하는 셈이 됩니다.

[EGM(Elephant-Goldfish Model)](https://egm.dev/)은 이 문제를 겨냥해 Google이 공개한 오픈소스 플러그인입니다. 계획을 쓰는 쪽과 계획을 검토하는 쪽을 일부러 분리합니다. 이 글은 [egm.dev](https://egm.dev/)의 문서와 AI LABS의 소개 영상(*EGM: Google's New Way To Use Claude Code Is Insane*)을 바탕으로 개념과 사용 흐름을 정리했습니다.

| 항목 | 내용 |
|---|---|
| **정체** | AI 어시스턴트용 오픈소스 플러그인 (Apache 2.0) |
| **저장소** | `google/elephant-goldfish-model` |
| **지원 환경** | Claude Code, Claude Cowork, Codex(CLI·데스크톱), ChatGPT 데스크톱, Antigravity |
| **바탕이 된 글** | Dave Rensin, *Elephants, Goldfish, and the New Golden Age of Software Engineering* |

> ⚠️ egm.dev 하단에 "공식 지원되는 Google 제품은 아니다"라는 문구가 있습니다. 실험적 도구로 보고 쓰는 편이 안전합니다.

---

## 1. 개념: 코끼리와 금붕어

이름 그대로 두 역할이 있습니다.

| 역할 | 기억 | 하는 일 |
|---|---|---|
| 🐘 **코끼리** (작성 어시스턴트) | 프로젝트의 배경, 목표, 대화 전체를 기억 | 아이디어를 함께 파고들고, 실패 가능성을 따지고, 계획 문서를 작성 |
| 🐟 **금붕어** (신선한 리뷰어) | 아무것도 기억 못 함 | 계획 문서(와 코드)만 읽고 빠진 것, 불명확한 것을 보고 |

핵심은 금붕어가 **대화를 보지 못한다**는 점입니다. 작성자는 문서에 적지 않은 것을 머릿속에 알고 있습니다. 금붕어는 그 맥락이 없으니, 문서에 없는 부분이 그대로 질문으로 드러납니다.

공식 사이트의 예시가 이를 잘 보여 줍니다. "스터디 공간 오픈 계획"에 다음 문장이 있다고 해 봅시다.

> 자원봉사자가 **운영 시간** 동안 데스크를 맡는다. 학생은 평소 양식으로 방을 예약한다. **금요일 규칙**은 유지한다.

대화를 보지 못한 리뷰어는 이렇게 지적합니다.

- 데스크는 누가 맡나요? 담당자도, 당번표도 없습니다.
- 운영 시간이 언제인가요? 계획이 언급만 하고 적어 두지 않았습니다.
- 금요일 규칙이 뭔가요? 독자가 볼 수 없는 결정에 계획이 기대고 있습니다.

작성자에게는 당연한 내용이라 문서에 안 썼던 것들입니다. 이런 빈틈을 구현 전에 잡는 것이 EGM의 목적입니다.

### 왜 대화를 못 보게 하나

영상에서 소개한 Google의 설명은 이렇습니다. 모델은 자기 생각을 고집하고 이미 합의한 것에 동의하는 경향이 있어서, 같은 대화 안에서 검증하면 오류를 찾기보다 승인하게 됩니다. 그래서 리뷰어는 대화에서 완전히 격리됩니다.

### 최종 결정은 사람이 한다

리뷰어는 의도적으로 많은 지적을 쏟아냅니다. 쓸모 있는 것만 받아들이고 나머지는 버리는 것은 사람의 몫입니다. 공식 문서도 리뷰를 "피드백의 출처"로 볼 뿐 계획이 맞다는 증명으로 보지 않습니다. 사실 확인과 변경 승인은 사용자가 합니다.

### 전체 흐름

<div class="egm-flow" style="overflow-x:auto;margin:2em 0">
<svg viewBox="0 0 680 400" role="img" aria-labelledby="egm-flow-title egm-flow-desc" style="display:block;width:100%;min-width:680px;height:auto">
<title id="egm-flow-title">EGM 계획 작성과 독립 리뷰 흐름</title>
<desc id="egm-flow-desc">코끼리가 계획 문서를 쓰면 금붕어가 문서만 읽고 독립 리뷰해 지적 사항을 사용자에게 넘기고, 사용자가 확인해 승인한 수정을 코끼리가 반영한 뒤 다시 리뷰로 돌아가는 흐름을 보여 주는 스윔레인 다이어그램</desc>
<defs>
<style>
.egm-flow svg text{font-family:var(--sans);letter-spacing:0}
.egm-flow .f-ink{fill:hsl(var(--fg))}
.egm-flow .f-soft{fill:hsl(var(--fg)/.62)}
.egm-flow .f-acc{fill:var(--accent)}
.egm-flow .f-paper{fill:var(--bg)}
.egm-flow .f-lane{fill:hsl(var(--fg)/.045)}
.egm-flow .f-tint{fill:color-mix(in srgb,var(--accent) 12%,transparent)}
.egm-flow .s-rule{stroke:var(--line);fill:none}
.egm-flow .s-ink{stroke:hsl(var(--fg)/.8);fill:none}
.egm-flow .s-acc{stroke:var(--accent);fill:none}
.egm-flow .s-flow{stroke:hsl(var(--fg)/.62);fill:none;stroke-width:1.2}
.egm-flow .s-back{stroke:hsl(var(--fg)/.62);fill:none;stroke-width:1.2;stroke-dasharray:5 4}
.egm-flow .m-flow{fill:hsl(var(--fg)/.62)}
.egm-flow .mono{font-family:var(--mono)}
</style>
<marker id="egm-flow-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon class="m-flow" points="0 0, 8 3, 0 6"/></marker>
</defs>
<rect x="0" y="16" width="680" height="336" class="s-rule" stroke-width="1"/>
<rect x="0" y="16" width="112" height="336" class="f-lane"/>
<line x1="0" y1="128" x2="680" y2="128" class="s-rule" stroke-width="1"/>
<line x1="0" y1="240" x2="680" y2="240" class="s-rule" stroke-width="1"/>
<line x1="112" y1="16" x2="112" y2="352" class="s-rule" stroke-width="1"/>
<path d="M236 72 H244 A8 8 0 0 1 252 80 V176 A8 8 0 0 0 260 184 H268" class="s-flow" marker-end="url(#egm-flow-arrow)"/>
<path d="M376 184 H384 A8 8 0 0 1 392 192 V288 A8 8 0 0 0 400 296 H408" class="s-flow" marker-end="url(#egm-flow-arrow)"/>
<path d="M516 296 H594 A8 8 0 0 0 602 288 V100" class="s-flow" marker-end="url(#egm-flow-arrow)"/>
<path d="M548 72 H330 A8 8 0 0 0 322 80 V156" class="s-back" marker-end="url(#egm-flow-arrow)"/>
<rect x="168" y="142" width="76" height="16" rx="2" class="f-paper"/>
<text x="206" y="154" text-anchor="middle" font-size="12" font-weight="500" class="f-soft">문서만 전달</text>
<rect x="400" y="214" width="64" height="16" rx="2" class="f-paper"/>
<text x="432" y="226" text-anchor="middle" font-size="12" font-weight="500" class="f-soft">지적 사항</text>
<rect x="518" y="192" width="76" height="16" rx="2" class="f-paper"/>
<text x="556" y="204" text-anchor="middle" font-size="12" font-weight="500" class="f-soft">승인한 수정</text>
<rect x="411" y="50" width="48" height="16" rx="2" class="f-paper"/>
<text x="435" y="62" text-anchor="middle" font-size="12" font-weight="500" class="f-soft">재검토</text>
<rect x="128" y="44" width="108" height="56" rx="6" class="f-paper"/>
<rect x="128" y="44" width="108" height="56" rx="6" class="s-ink" stroke-width="1"/>
<text x="182" y="68" text-anchor="middle" font-size="12" font-weight="600" class="f-ink">계획 문서 작성</text>
<text x="182" y="86" text-anchor="middle" font-size="9" class="f-soft mono">/egm-draft</text>
<rect x="268" y="156" width="108" height="56" rx="6" class="f-paper"/>
<rect x="268" y="156" width="108" height="56" rx="6" class="s-ink" stroke-width="1"/>
<text x="322" y="180" text-anchor="middle" font-size="12" font-weight="600" class="f-ink">독립 리뷰</text>
<text x="322" y="198" text-anchor="middle" font-size="9" class="f-soft mono">/egm-review</text>
<rect x="408" y="268" width="108" height="56" rx="6" class="f-paper"/>
<rect x="408" y="268" width="108" height="56" rx="6" class="f-tint s-acc" stroke-width="1"/>
<text x="462" y="292" text-anchor="middle" font-size="12" font-weight="600" class="f-acc">확인하고 결정</text>
<text x="462" y="310" text-anchor="middle" font-size="9" class="f-soft mono">/egm-resolve</text>
<rect x="548" y="44" width="108" height="56" rx="6" class="f-paper"/>
<rect x="548" y="44" width="108" height="56" rx="6" class="s-ink" stroke-width="1"/>
<text x="602" y="68" text-anchor="middle" font-size="12" font-weight="600" class="f-ink">승인분 반영</text>
<text x="602" y="86" text-anchor="middle" font-size="9" class="f-soft mono">docs/designs</text>
<text x="16" y="66" font-size="12" font-weight="600" class="f-ink">🐘 코끼리</text>
<text x="16" y="86" font-size="12" class="f-soft">대화를 기억</text>
<text x="16" y="178" font-size="12" font-weight="600" class="f-ink">🐟 금붕어</text>
<text x="16" y="198" font-size="12" class="f-soft">문서만 읽음</text>
<text x="16" y="290" font-size="12" font-weight="600" class="f-ink">👤 사용자</text>
<text x="16" y="310" font-size="12" class="f-soft">최종 결정</text>
<line x1="0" y1="368" x2="680" y2="368" class="s-rule" stroke-width="1"/>
<line x1="16" y1="386" x2="52" y2="386" class="s-flow" marker-end="url(#egm-flow-arrow)"/>
<text x="62" y="390" font-size="12" class="f-soft">진행</text>
<line x1="116" y1="386" x2="152" y2="386" class="s-back" marker-end="url(#egm-flow-arrow)"/>
<text x="162" y="390" font-size="12" class="f-soft">재검토 순환</text>
</svg>
</div>

리뷰어가 읽는 것은 **작성된 계획 문서 하나뿐**입니다.

---

## 2. 설치하기

플러그인 전체를 설치해야 합니다. 스킬만 가져오면 안 됩니다. 리뷰에는 대화 맥락이 분리된 별도의 AI 리뷰어(서브에이전트)가 필요하기 때문입니다.

**Claude Code**

```bash
claude plugin marketplace add google/elephant-goldfish-model && \
claude plugin install egm@egm
```

설치 후 새 세션을 시작합니다.

**Codex CLI**

```bash
codex plugin marketplace add google/elephant-goldfish-model && \
codex plugin add egm@egm
```

**Antigravity**

```bash
agy plugin install https://github.com/google/elephant-goldfish-model
```

**기타**

- ChatGPT·Codex 데스크톱: 플러그인 페이지에서 Install을 누릅니다 (데스크톱 전용).
- Claude Cowork: 플러그인 패널에서 마켓플레이스 `google/elephant-goldfish-model`을 추가합니다.

> 💡 서브에이전트를 격리해서 돌릴 수 있는 환경이 필요합니다. 클라우드 환경은 지원이 부분적이므로 [설치 가이드](https://egm.dev/install)에서 현재 제한을 확인하세요. 영상에서는 설치 시 `.claude` 아래에 `agents/`, `skills/`, `egm/`(저장소 사본) 폴더가 생기고 CLAUDE.md에도 안내 문구가 추가됐습니다.

### 설치 후 CLAUDE.md 점검

영상 제작자는 설치 직후 CLAUDE.md에 "리뷰 서브에이전트는 자기 서브에이전트를 띄울 수 없다"는 취지의 줄이 들어간 것을 발견했습니다. 이는 옛 버전 기준의 내용이었고, 새 버전에서는 서브에이전트가 하위 에이전트를 시작할 수 있어서 이 줄이 리뷰 구조(리뷰 에이전트 하나가 여러 금붕어를 띄움)와 어긋났습니다. 저장소가 자주 갱신되므로 같은 문제가 없을 수도 있지만, 설치 후 한 번 확인해 보세요. 비슷한 줄이 있으면 에이전트에게 고치라고 하면 됩니다.

---

## 3. 명령어 한눈에 보기

공식 문서가 구분한 세 가지 작업 영역입니다.

| 영역 | 명령어 | 하는 일 |
|---|---|---|
| 아이디어 구체화 | `/egm-brainstorm` | 문제를 탐색하고 브리프(개념 요약)를 작성 |
| | `/egm-draft` | 브리프나 메모를 설계 문서로 변환 |
| 문서 검토 | `/egm-review` | 소프트웨어 설계를 독립 리뷰어로 검토 |
| | `/egm-resolve` | 지적 사항을 확인하고 변경 합의 |
| | `/egm-review-loop` | 리뷰어와 기준을 직접 골라 임의의 문서를 검토 (커스텀 리뷰) |
| 코드 작업 | `/egm-bootstrap` | 기존 코드베이스 문서 작성·갱신 |
| | `/egm-drift-report` | 문서와 현재 소스 코드의 차이를 보고 |

기본 제공되는 draft·review 워크플로는 **소프트웨어 설계**를 대상으로 합니다. 다른 문서(프로젝트 제안서, 설계 브리프, 운영 계획 등)에는 `/egm-review-loop`를 씁니다. 코드베이스 문서화와 drift 보고는 소프트웨어 프로젝트에만 해당합니다.

---

## 4. 사용법: 기능 하나를 만드는 전체 과정

영상에서 이미 만든 패션 앱에 "판매자가 팔린 사이즈, 품절된 사이즈, 재입고 시점을 보는 페이지"를 추가한 과정을 따라가며 정리합니다.

### 4-1. 기존 프로젝트라면 먼저 부트스트랩

```text
/egm-bootstrap
```

코끼리가 기존 앱을 이해하도록 폴더를 하나씩 훑으며 폴더별 README를 씁니다. 각 README에는 그 폴더 코드가 하는 일, 지켜야 할 규칙이 담깁니다.

- 폴더가 15개를 넘으면 전체 매핑을 계속할지 먼저 물어봅니다. README 작성에 서브에이전트가 많이 필요해서입니다.
- 영상의 앱에서는 서브에이전트가 병렬로 돌아 README 28개를 새로 쓰고 기존 루트 README도 갱신했습니다.
- 코드가 없는 폴더(예: 설계서를 모아 둔 `specs/`)에는 README가 만들어지지 않습니다.

**주의할 점이 하나 있습니다.** README는 사람이 읽으라고 쓴 파일이라 에이전트가 시키지 않으면 읽지 않습니다. 영상에서 제시한 해결책은 세 가지입니다.

1. 각 README 옆에 `CLAUDE.md`를 두어 README를 함께 보라고 지시 (Codex는 `AGENTS.md`)
2. 부트스트랩을 다시 돌릴 때 `CLAUDE.md`를 처음부터 만들도록 설정 추가
3. 루트 `CLAUDE.md`에 "작업하는 폴더의 README를 읽어라"라는 한 줄 추가

영상에서는 1번을 택했습니다.

### 4-2. 브레인스토밍

```text
/egm-brainstorm
학생들이 공용 스터디 공간을 예약하게 돕고 싶어요.
누가 접근해야 하는지, 예약이 어떻게 동작하는지,
요청이 겹치면 어떻게 되는지 같이 정리해 줘요.
```

코끼리가 질문을 이어 가며 문제가 선명해질 때까지 묻고, 끝나면 짧은 브리프를 씁니다. 영상에서는 이미 작성된 계획이 있자 그 계획의 문제점을 짚은 뒤 질문을 던졌습니다. 질문에 계속 답하고 나면 구현 구상을 제시하고 선택지를 줍니다.

- **금붕어 6마리와 함께 검토**: 서로 다른 관점의 금붕어 6마리가 돌아갑니다.
- **직접 수정 요청**: 접근이 맞지 않으면 대화로 더 설명합니다.

검토를 마치면 프로젝트 루트에 **개념 브리프** 파일이 생깁니다. 기능 설명, 조사 결과, 걸림돌, 해야 할 일이 담겨 있으니 원하는 방향인지 읽어 보고, 수정은 몇 번이든 요청할 수 있습니다.

### 4-3. 초안(Draft) 작성

```text
/egm-draft
```

개념 브리프를 바탕으로 첫 버전의 **설계 초안**을 씁니다. 영상에서 설명한 구성은 다음과 같습니다.

1. 기능이 무엇이고 어떤 문제를 푸는지, 무엇을 하고 무엇을 하지 않는지
2. 사용자가 거치는 핵심 경로(**Critical User Journeys**). 나중에 테스트를 쓸 수 있게 하기 위한 것
3. 기술 계획: 실제로 어떻게 만들 것인가
4. 검토한 대안: 다른 구현 방식의 장단점과 선택하지 않은 이유
5. 단계별 구현 계획(체크리스트)

각 부분을 쓸 때마다 사용자의 승인을 기다리므로 다음 부분을 쌓기 전에 방향을 바로잡을 수 있습니다. 완성된 파일은 `docs/designs/` 아래에 기능 이름으로 저장됩니다.

### 4-4. 독립 리뷰

초안은 지금까지 사용자와 맞장구쳐 온 같은 에이전트가 썼습니다. 그래서 구현 전에 금붕어에게 보냅니다.

```text
/egm-review
```

영상에서 본 리뷰 진행은 이렇습니다.

- 리뷰 서브에이전트 하나가 시작되고, 이 에이전트가 다른 서브에이전트(금붕어)들을 백그라운드로 띄웁니다. 메인 에이전트의 컨텍스트가 각 리뷰어의 보고서로 차는 것을 막고, 통합한 보고서 한 개만 사용자가 읽게 하려는 설계입니다.
- 첫 단계는 **Zoom Out** 서브에이전트입니다. 더 쉬운 구현 방법은 없는지, 앱에 이미 같은 일을 하는 부분이 있는지 확인합니다.
- 리뷰는 여러 라운드로 나뉘고, 라운드마다 계획을 다른 관점으로 점검합니다. 라운드가 끝날 때마다 사용자는 다음 라운드로 가거나 수정을 요청할 수 있습니다.
- 각 라운드는 별도 보고서를 쓰고 `docs/designs`의 계획을 갱신합니다.
- 모든 라운드가 끝나면 계획 상태가 "검토 중(in review)"에서 "제안됨(proposed)"으로 바뀌고 리뷰가 "완료"로 표시됩니다.

금붕어들이 보는 관점은 영상 기준으로 다음과 같습니다.

- 더 단순한 방법이 있는지, 앱에 이미 같은 기능이 있는지
- 앱을 모르는 사람이 읽어도 말이 되는지
- 많은 사용자가 동시에 쓸 때 생길 문제
- 추측 없이 만들 수 있을 만큼 명확한지
- 계획이 어떻게 쓰이고 구성됐는지 (2개)

리뷰어는 서면 기준(체크리스트 성격의 규칙)에 따라 계획을 평가합니다.

### 4-5. 구현

리뷰가 끝나면 `docs/designs/`에 완성된 설계 파일이 하나 남습니다. 새 대화를 열고 "이 파일에 있는 기능을 만들어 줘"라고 하면 됩니다. 엣지 케이스가 미리 정리되어 있어서 에이전트가 따를 규칙이 분명하고, 결과도 훨씬 낫다는 것이 영상 제작자의 평가입니다.

### 4-6. 구현 후: Drift 점검

기능을 만든 뒤에도 앱은 계속 바뀌는데 문서는 그대로입니다. `/egm-drift-report`가 문서와 코드의 차이를 찾습니다.

```text
/egm-drift-report docs/designs
```

- 폴더 안의 설계 문서나 README를 하나씩 읽고 현재 코드와 비교합니다.
- **차이만** 보고합니다: 빠진 기능, 덜 끝난 부분, 코드가 다른 방식을 쓰는 곳.
- 결과는 날짜가 붙은 보고서 파일로 저장됩니다. 차이가 없는 문서는 "No drift detected"로 표시됩니다.

영상에서는 서브에이전트 2개가 앱의 서로 다른 부분을 나눠 점검했고, 문서와 안 맞는 곳뿐 아니라 **실제 버그**도 찾았습니다. 규칙상 "판매된 상품은 숨기기만 하고 삭제할 수 없다"인데, 코드에서는 판매자가 이미 팔린 상품을 삭제할 수 있었습니다. 이런 문제는 에이전트에게 부분별로 고쳐 달라고 맡길 수 있습니다.

---

## 5. 문서 종류와 상관없이 쓰는 커스텀 리뷰

`/egm-review-loop`는 소프트웨어 설계가 아닌 문서에도 쓸 수 있습니다. 설계 문서, README, 기능 명세, 계획서, 프로젝트 제안서, 브리프가 대상이고, 긴 문서의 일부만 검토할 수도 있습니다.

```text
/egm-review-loop
study-space-plan.md 를 검토해 줘.
운영 일정과 담당 책임에 대한 리뷰어와 기준을
같이 골라 줘.
```

공식 문서가 설명하는 동작은 다음과 같습니다.

- 문서, 리뷰어, 리뷰어별 적용 기준을 직접 고릅니다.
- 신선한 리뷰어가 문서를 읽고, 어시스턴트는 사용자가 승인한 수정만 반영합니다.
- **연속 두 라운드에서 심각한 문제가 나오지 않을 때까지** 반복합니다. 최대 5라운드이고, 5라운드에 이르면 계속할지 물어봅니다.
- 기본 제공 리뷰어는 7종입니다: 구조, 문체, 처음 읽는 사람 기준의 명확성, 설계 결정, 구현 준비도, 기술 세부 사항, 불필요한 복잡도.
- 파일로 만든 자체 기준을 리뷰어에게 줄 수도 있습니다.
- 결과물은 지적 사항 보고서와 승인한 수정이 반영된 문서입니다.

---

## 6. 언제 쓰고, 언제 쓰지 말까

**잘 맞는 경우**

- 틀리면 비용이 큰 큰 기능을 계획할 때
- 엣지 케이스와 동시 접속, 결정 누락이 걱정될 때
- 구현 후에도 문서와 코드를 일치시키고 싶을 때

**맞지 않는 경우**

- 에이전트가 한 번에 끝낼 수 있는 간단한 수정. Google도 이런 경우엔 계획·리뷰 과정이 오히려 흐름을 늦춘다고 말합니다.

장점은 이렇게 정리됩니다. 대부분의 계획 방식은 계획서까지만 주고, 그 계획의 허점은 알아서 찾아야 합니다. EGM은 대화를 못 보는 리뷰어가 허점을 대신 찾아 주고, 구현이 끝난 뒤에도 앱 전체를 계획과 대조해 볼 수 있습니다. 단, 리뷰는 정답 증명이 아니라 피드백일 뿐이니 지적 사항을 직접 확인하고 판단해야 합니다. 시간이 더 걸린다는 비용도 감수해야 합니다.

---

## 마치며

EGM의 아이디어는 단순합니다. **맥락을 아는 쪽이 쓰고, 맥락을 모르는 쪽이 읽게 한다.** 결국 문서만 읽고도 이해되는 계획이어야 에이전트도 추측 없이 구현할 수 있습니다. 큰 기능을 앞두고 있다면 `/egm-brainstorm`에서 시작해 `/egm-draft`, `/egm-review`로 이어 보고, 이미 쌓인 프로젝트라면 `/egm-bootstrap`과 `/egm-drift-report`부터 써 보길 권합니다.

### 참고 자료

- [EGM 공식 사이트](https://egm.dev/) · [가이드](https://egm.dev/guide) · [설치](https://egm.dev/install) · [스킬 목록](https://egm.dev/skills)
- [GitHub: google/elephant-goldfish-model](https://github.com/google/elephant-goldfish-model)
- [Elephants, Goldfish, and the New Golden Age of Software Engineering (Dave Rensin)](https://medium.com/@drensin/elephants-goldfish-and-the-new-golden-age-of-software-engineering-c33641a48874)
- [AI LABS: EGM: Google's New Way To Use Claude Code Is Insane](https://youtu.be/xxf6D9jynFw)
