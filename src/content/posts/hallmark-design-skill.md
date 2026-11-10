---
title: "Hallmark: AI가 만든 티를 걸러내는 디자인 스킬"
description: "nutlope/hallmark 스킬의 게이트 3단계, 테마 50종, sloplint 검사와 사용법"
date: 2026-11-10T00:00:00.000Z
tags: ["AI", "claude", "skill"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/Minimal-3D-illustration-for-a-tech-blog.jpeg"
---

## 들어가며

코딩 에이전트에게 랜딩 페이지를 맡기면 결과물이 서로 닮습니다. 제목 위에 작은 대문자 라벨이 붙고, 보라에서 파랑으로 넘어가는 그라디언트가 깔리고, 아이콘과 제목을 얹은 카드 세 장이 나란히 놓입니다. 페이지 끝에는 이메일 구독 폼이 있습니다. 한 번 눈에 익으면 "AI가 만들었네" 하고 바로 알아봅니다.

[nutlope/hallmark](https://github.com/nutlope/hallmark)는 이 문제를 겨냥한 디자인 스킬입니다. Together AI가 만들었고 MIT 라이선스로 공개했습니다. Claude Code, Codex CLI, Cursor, OpenCode에서 동작하고, 이 글을 쓰는 시점의 버전은 2.0.0입니다.

방식은 단순합니다. 절대 넘으면 안 되는 바닥 규칙을 정해 두고 그 위에서는 모델이 알아서 디자인하게 둡니다. 결과물은 실제 브라우저에서 렌더링한 뒤 린터로 검사합니다. 저장소를 읽으며 정리한 구성은 아래와 같습니다.

| 구성 요소 | 위치 | 하는 일 |
|---|---|---|
| **Floor** | `SKILL.md` | 어떤 경우에도 어길 수 없는 규칙 16개 |
| **게이트** | `references/gates.md` | Floor, Reflex, Finish 3단계로 나눈 금지 목록 |
| **테마 50종** | `references/themes/` | 종이, 서체, 색, 표면을 묶은 재료. 빌드마다 3개를 뽑아 제시 |
| **sloplint** | `scripts/sloplint.mjs` | 정적 검사와 브라우저 렌더 검사를 하는 린터 |
| **redesign / audit** | `references/redesign.md` | 기존 페이지를 다시 만들거나 진단만 하는 동사 |

> 💡 **사전 준비**: Node 18 이상이 필요합니다. 브라우저 검사(`sloplint --render`, 스크린샷)까지 쓰려면 `npm i -g puppeteer-core` 와 Chrome이 있어야 합니다. 없으면 정적 검사만 돌아갑니다.

---

## 1. 설치하기

### skills CLI로 설치

```bash
npx skills add nutlope/hallmark -g
```

`-g` 는 모든 프로젝트에 설치한다는 뜻입니다. 빼면 현재 프로젝트에만 들어갑니다.

| 하네스 | 설치 위치 | 호출 방법 |
|---|---|---|
| Claude Code | `~/.claude/skills/hallmark` | `/hallmark <프롬프트>` 또는 새 페이지를 만들어 달라고 설명 |
| Codex CLI | `~/.agents/skills/hallmark` | `$hallmark <프롬프트>` 또는 새 페이지를 만들어 달라고 설명 |
| Cursor | 위 복사본을 찾아 씀 | `/hallmark <프롬프트>` |
| OpenCode | 위 복사본을 찾아 씀 | `/hallmark <프롬프트>` |

하네스 하나에만 넣으려면 `--agent` 를 붙입니다.

```bash
npx skills add nutlope/hallmark -g --agent claude-code
```

### Claude Code 플러그인으로 설치

Claude Code 안에서 마켓플레이스를 등록하고 설치합니다. 이 경우 호출 이름이 `/hallmark:hallmark` 로 바뀝니다.

```
/plugin marketplace add nutlope/hallmark
/plugin install hallmark@hallmark
```

### 스킬이 저절로 켜지지 않을 때

새 페이지를 만들어 달라고 하면 스킬이 스스로 켜지는 것이 기본 동작입니다. 켜지지 않으면 이름을 직접 부르면 됩니다. "use hallmark to build ..." 처럼 쓰면 됩니다.

---

## 2. 기본 사용법

### 새 페이지 만들기

```
/hallmark 리스본에 있는 프리랜서용 청구서 앱 랜딩 페이지
```

프롬프트가 다섯 단어뿐이어도 Hallmark는 빌드 전에 한 번 묻습니다. 묻는 항목은 네 가지입니다.

1. **재료(Material)**: 페이지에 실제로 보여줄 수 있는 것. 스크린샷, 사진, 실제 수치, 발언자 이름이 있는 인용문, 써도 되는 로고
2. **대상(Audience)**: 누가 쓰고 무엇을 중요하게 보는지
3. **용도(Use)**: 페이지가 이끌어야 하는 행동 하나
4. **톤(Tone)**: editorial, brutalist, soft, utilitarian, luxury, playful, technical, austere 중 하나. "깔끔하고 모던하게"는 톤으로 쳐주지 않습니다

답하기 번거로우면 **go ahead** 라고 하면 됩니다. 그러면 Hallmark가 알아서 추정하고 무엇을 골랐는지 답변 맨 위에 한 줄로 밝힙니다. 다만 사실은 추정하지 않습니다. 주지 않은 수치, 인용문, 로고는 페이지에 넣지 않고, 주지 않은 사진은 나중에 교체할 자리만 잡아 둡니다.

### 기존 페이지 다루기

Hallmark는 이미 있는 디자인에는 손대지 않습니다. 사용자가 이름을 불러야만 움직입니다.

```
/hallmark redesign ./src/app
/hallmark audit ./index.html
```

`redesign` 은 내용과 배선을 유지한 채 페이지를 다시 만들고 `audit` 은 고치지 않고 보고서만 냅니다. 이름을 부르지 않고 "색만 바꿔줘"라고 하면 Hallmark가 끼어들지 않고 프로젝트가 원래 쓰던 시스템 안에서 요청대로 처리됩니다.

### custom 과 fast 모드

- **custom**: "custom" 이라고 말하면 테마를 쓰지 않습니다. 정해진 구성도, 컴포넌트도, 팔레트 레시피도 없이 프롬프트만 보고 디자인합니다. Floor와 게이트, 검사는 그대로 적용됩니다.
- **fast**: `--fast` 를 붙이거나 프롬프트에 quick, rough, prototype 이 들어가면 질문을 건너뛰고 Finish 단계 검사를 생략합니다. Floor, 스탬프, `tokens.css`, 로그, 대비 검사는 생략하지 않습니다.

---

## 3. 게이트 3단계

Hallmark의 금지 목록은 `references/gates.md` 한 파일에 모여 있습니다. 게이트마다 등급(tier)이 붙어 있고 등급에 따라 어길 수 있는지가 정해집니다.

| 등급 | 어길 수 있나 | 성격 |
|---|---|---|
| **Floor** | 불가 | 대비, 포커스, 모션 줄이기, 지어낸 사실, 깨진 모바일 레이아웃처럼 어떤 좋은 페이지도 일부러 어기지 않는 것 |
| **Reflex** | 이유를 기록하면 가능 | 언어 모델이 습관처럼 빠지는 기본값 |
| **Finish** | 막지 않음 | 팔 길이만큼 떨어져서는 보이지 않는 세부 마감. 보고하고 답만 남김 |

Reflex 게이트를 어기려면 CSS 맨 위 스탬프 블록에 면제(waiver)를 적어야 합니다.

```css
/* Hallmark · waive 47b · one frame, a real terminal capture inside · the terminal is the product being sold */
```

게이트 번호, 근거, 이유 세 칸을 채웁니다. 이유가 24자 미만이거나, 상투적인 문장이거나, 다른 면제와 글자 그대로 같으면 거부됩니다. Floor 게이트를 면제하려 하면 면제 자체가 거부되고 게이트가 그대로 발동합니다. 면제가 세 개를 넘으면 sloplint가 "이건 예외가 아니라 하우스 스타일"이라고 알려주고 그런 규칙은 `design.md` 에 적으라고 안내합니다.

결과 보고도 등급을 따라 나뉩니다. `FAIL` 은 Floor 위반이라 그대로는 내보낼 수 없고 `REFLEX` 는 고치거나 면제해야 합니다. 둘을 따로 세기 때문에 "0 FAIL"은 Floor에 대해서는 항상 참인 문장입니다.

---

## 4. Floor: 어길 수 없는 16개 규칙

Floor는 `SKILL.md` 본문에 들어 있어서 다른 참조 파일을 하나도 읽지 않아도 적용됩니다. 16개 중 성격이 다른 것들을 골랐습니다.

**코드 규칙**

- 모든 색과 서체는 `:root` 에 선언한 토큰을 거칩니다. 토큰 블록 밖에 색 리터럴이나 `font-family` 를 쓰지 않습니다
- `transition: all` 을 쓰지 않고, `width`, `height`, `top`, `left` 를 애니메이션하지 않습니다
- `html` 과 `body` 에 `overflow-x: clip` 을 줍니다. `hidden` 이나 `100vw` 는 쓰지 않습니다
- 상호작용 요소에는 모두 `:focus-visible` 이 있고 애니메이션에는 모두 `prefers-reduced-motion: reduce` 대체가 있습니다

**AI 티 규칙**

- 제목 위 작은 라벨(eyebrow)을 쓰지 않습니다. 자간을 벌린 대문자나 스몰캡 라벨도 쓰지 않습니다
- 로만체 제목 안에 이탤릭 단어 하나를 넣지 않습니다
- 가운뎃점으로 이어 붙인 메타 문자열, 링크 텍스트에 붙인 화살표, 장식용 상태 점을 쓰지 않습니다
- 보라에서 파랑으로 가는 그라디언트, 카드 안의 카드, 아이콘 대신 쓴 이모지, 손으로 그린 브라우저 창을 쓰지 않습니다

**정직성과 분량 규칙**

- 지어낸 수치, 추천사, 로고 벽, 사례 건수를 넣지 않습니다
- 히어로의 제목, 문장 하나, 주 행동 버튼이 1280×800 화면에서 스크롤 없이 모두 보입니다
- 한 화면에 약 80단어까지만 씁니다

재미있는 대목은 eyebrow, 화면당 분량, 템플릿식 구두점, 자간 벌린 대문자 라벨 네 가지입니다. `gates.md` 는 이 넷을 "하우스 룰"이라고 부릅니다. 잘 만든 사이트도 쓰는 기법이지만 기계가 만든 티가 워낙 확실해서 Hallmark는 업계 관행보다 엄격하게 Floor로 올렸다고 설명합니다.

---

## 5. 빌드 한 번이 진행되는 순서

`SKILL.md` 의 Flow는 0번부터 7번까지 여덟 단계입니다.

| 단계 | 이름 | 하는 일 |
|---|---|---|
| 0 | Pre-flight | 프로젝트를 먼저 읽습니다. `design.md`, 서체, 팔레트, 프레임워크, 실행 중인 dev 서버 |
| 1 | Ask once | 재료, 대상, 용도, 톤을 한 번에 묻습니다 |
| 2 | Shape | 방문자가 하러 오는 일(구독, 예약, 구매 등)에서 페이지 구조를 정합니다 |
| 3 | Direction | 테마 세 개를 뽑아 하나를 고르거나, custom 이면 직접 디자인합니다 |
| 4 | Load | 필요한 참조 파일만 읽습니다 |
| 5 | Picks block | 결정 사항을 한 번 정리해 보여줍니다. 방향을 바꿀 기회입니다 |
| 6 | Build | 히어로를 먼저 만들고 검사한 뒤 나머지를 짓습니다 |
| 7 | Sweep | `sloplint --render` 를 통과할 때까지 돌리고 리뷰를 받습니다 |

눈에 띄는 설계가 두 가지 있습니다.

첫째는 **히어로를 따로 먼저 만든다**는 점입니다. 내비게이션과 히어로만 쓴 상태에서 `sloplint --render --stage hero` 를 돌리고, 새 컨텍스트의 서브에이전트에게 리뷰를 받습니다. 히어로가 통과해야 아래 섹션을 짓습니다.

둘째는 **같은 조합이 반복되지 않게 기록한다**는 점입니다. 빌드가 끝나면 `.hallmark/log.json` 에 구조, 테마, 히어로, 내비게이션, 푸터 선택을 남기고, 다음 빌드에서 테마와 구조를 뽑을 때 이 로그를 피해 갑니다. `SKILL.md` 는 "거울 테스트"도 요구합니다. 같은 분야의 비슷한 프롬프트가 똑같은 조합을 받겠는지 스스로 묻고 그렇다면 결정 하나를 바꾸라는 것입니다.

모든 페이지의 CSS 첫 줄에는 Hallmark 스탬프가 찍힙니다. 어떤 테마와 구조를 골랐는지, 무엇을 면제했는지가 여기에 남습니다. hallmark는 원래 귀금속에 찍는 품질 보증 각인을 뜻하는 말인데, 이 스탬프가 그 이름과 잘 맞습니다.

---

## 6. 테마 50종

v2에서 가장 크게 늘어난 부분입니다. `references/themes/` 에 테마 50개가 있고 테마 하나는 8KB 이하의 마크다운 파일 하나와 완성된 페이지의 그림 한 장으로 이뤄집니다. 빌드는 그중 정확히 하나만 읽습니다.

테마 파일은 이렇게 시작합니다. Cobalt 테마의 머리말 일부입니다.

```yaml
name: Cobalt
slug: cobalt
genre: modern-minimal
paper: light 98.5 250
display: grotesk-sans Familjen Grotesk
accent: cool 256
posture: restrained
keywords: api, sdk, cli, dev tool, developer platform, docs, ...
```

README가 거듭 강조하는 문장이 있습니다. **테마는 재료이지 설계도가 아니다**라는 것입니다. 테마는 종이 색, 서체, 표면, 질감, 고유 컴포넌트를 정하지만 페이지에 무엇이 어떤 순서로 들어가는지는 정하지 않습니다. 그래서 같은 테마로 프롬프트 두 개를 돌리면 서로 다른 페이지가 나옵니다.

테마 선택은 스크립트가 맡습니다.

```bash
node <skill-dir>/scripts/theme.mjs deal --genre <genre> --prompt "<프롬프트>"
```

프롬프트에 맞고 로그와 겹치지 않는 테마 세 개가 나옵니다. 에이전트는 그림 세 장을 보고 프롬프트를 감당할 수 있는 재료를 하나 골라 이유와 함께 밝힙니다. 장르는 프롬프트의 단어로 정해집니다. AI 도구나 음악, 영상은 atmospheric, SaaS나 API, 개발자 도구는 modern-minimal, 놀이나 커뮤니티는 playful, 나머지는 editorial입니다.

전체 테마는 [usehallmark.com](https://www.usehallmark.com)에서 볼 수 있습니다.

---

## 7. sloplint: 브라우저에서 돌리는 린터

`sloplint.mjs` 는 Hallmark 없이도 쓸 수 있습니다. 아무 페이지에나 돌려 볼 수 있습니다.

```bash
node skills/hallmark/scripts/sloplint.mjs <파일 또는 폴더> --render
```

검사는 두 층입니다. 정적 층은 CSS와 마크업을 읽고(컴포넌트 안의 Tailwind 유틸리티 포함), 렌더 층은 `--render` 를 붙였을 때 실제 브라우저에서 페이지를 띄워 확인합니다. 렌더 층은 여덟 가지 폭에서 돌아갑니다. 스크립트에 적힌 값은 320, 375, 414, 768, 1024, 1280, 1440, 1920입니다.

프레임워크 프로젝트에서는 dev 서버를 띄워 둔 채 URL을 줍니다.

```bash
node skills/hallmark/scripts/sloplint.mjs --url http://localhost:3000/pricing
```

Claude Code에서는 편집 시점 훅으로도 걸 수 있습니다. `install-hook.mjs` 를 실행하면 sloplint가 PostToolUse 훅으로 연결되고 파일이 쓰일 때 Floor 위반만 알려주고 평소에는 조용히 있습니다.

```bash
node skills/hallmark/scripts/install-hook.mjs
```

---

## 8. redesign 의 세 가지 깊이

`redesign` 은 기본이 전면 재설계(full)입니다. 더 가벼운 깊이는 요청에 그 말이 들어 있을 때만 적용됩니다.

| 깊이 | 유지하는 것 | 바꾸는 것 | 요청 문구 |
|---|---|---|---|
| **full** | 내용과 배선 | 시스템과 구성 전체 | 따로 없음. 기본값 |
| **restyle** | 레이아웃 | 색, 서체, 모서리, 그림자, 모션, 컨트롤 | keep the layout, restyle, reskin |
| **polish** | 시스템과 레이아웃 | 게이트가 지목한 것만 | polish, keep our look |

어느 깊이에서든 지키는 것이 있습니다. 페이지가 말하는 사실, 이름, 가격, 날짜, 인용문은 그대로 옮깁니다. 링크, 폼, 필드, 핸들러, 라우트, `id`, `data-testid` 같은 배선도 건드리지 않습니다. 파일을 지우거나 라우트를 없애려면 사용자가 승인한 파일 단위 계획이 있어야 하고 재설계를 통과시키려고 테스트를 고치지 않습니다.

검증도 스크립트가 맡습니다. `sloplint --before` 가 시작 전에 모든 링크, 필드, 핸들러, 제목을 기록하고, `sloplint --kept` 는 하나라도 사라졌으면 재설계를 실패로 처리합니다. 마지막에는 전후 비교 화면을 나란히 내놓습니다.

git 프로젝트에서는 깨끗한 작업 트리에서 시작하라고 요구합니다. 커밋이나 stash는 사용자에게 부탁하고 스킬이 대신 하지 않습니다. 재설계가 사용자가 읽고 되돌릴 수 있는 diff 하나로 남게 하려는 것입니다.

---

## 9. 사진과 사실을 다루는 방식

AI가 만든 페이지에서 흔한 문제가 지어낸 내용입니다. "고객 10,000곳", 가짜 추천사, 있지도 않은 로고 벽이 그렇습니다. Hallmark는 이 부분을 Floor로 막습니다.

- 사용자가 주지 않은 수치, 인용문, 로고는 페이지에 없습니다
- 제품 화면은 가능하면 진짜를 씁니다. URL, dev 서버, 실행 가능한 앱을 알려주면 `scripts/capture.mjs` 로 스크린샷을 직접 찍습니다
- 사진이 없으면 사진 라이브러리에서 대역을 넣고 사용자의 사진으로 교체할 자리로 표시해 둡니다

사진 라이브러리(`scripts/photos.json`)에는 공개 라이선스 사진 755장의 목록이 들어 있습니다. 이미지 파일은 저장소에 없고 Wikimedia Commons에 호스팅된 사진을 가리킵니다. 사진마다 라이선스(CC0, 퍼블릭 도메인, CC BY, CC BY-SA)가 따로 있고, Hallmark는 쓴 사진의 출처를 페이지 푸터에 적습니다. Unsplash, Pexels, Pixabay 같은 스톡 사이트는 쓰지 않는다고 README에 적혀 있습니다. 그 사이트들의 약관이 AI 도구가 이미지를 고르는 것을 막기 때문이라고 합니다.

---

## 마치며

Hallmark를 읽으며 프롬프트로 부탁하는 대신 코드로 검사한다는 점이 인상에 남았습니다. "AI 티 나지 않게 해줘"라는 요청을 번호가 붙은 게이트 목록으로 바꾸고 그중 기계가 확인할 수 있는 것은 린터에 넣었습니다. 기계가 확인하지 못하는 것은 새 컨텍스트의 리뷰어에게 넘깁니다. `SKILL.md` 에는 "지어낸 통과는 그 자체로 슬롭"이라는 문장도 있습니다.

쓰기 전에 알아둘 점도 있습니다.

- **비용**: 빌드 한 번에 스크립트 실행, 렌더 검사, 서브에이전트 리뷰가 여러 번 들어갑니다. 빌드 한 번의 시간과 토큰 비용을 측정하는 일은 로드맵의 "Now" 항목에 아직 남아 있습니다
- **브라우저 의존**: 렌더 검사는 `puppeteer-core` 와 Chrome이 있어야 합니다. 없으면 정적 검사만 돌아가서 Hallmark의 장점이 절반쯤 사라집니다
- **취향**: Floor는 면제할 수 없습니다. eyebrow나 대문자 라벨을 쓰는 브랜드라면 Hallmark와 맞지 않습니다
- **유행의 수명**: 로드맵은 크림색 종이, 알약 모양 버튼, 검정 바탕에 형광 포인트 하나 같은 스타일이 이제 "생성된 티"로 읽힌다고 적고 있습니다. 무엇이 AI 티인지는 계속 바뀌고 게이트 목록도 따라 바뀔 것입니다

그래도 `sloplint` 하나만 따로 써 봐도 얻는 것이 있습니다. 내 페이지에 `--render` 를 붙여 돌리면 어느 부분이 기계가 만든 것처럼 읽히는지 번호와 함께 나옵니다.

- 저장소: [github.com/nutlope/hallmark](https://github.com/nutlope/hallmark)
- 테마 갤러리: [usehallmark.com](https://www.usehallmark.com)
