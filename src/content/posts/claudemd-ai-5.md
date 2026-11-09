---
title: "안드레 카파시가 공개한 CLAUDE.md의 비밀: 당신의 AI 코딩이 획기적으로 변하는 5가지 전략"
description: "안드레 카파시가 공개한 CLAUDE.md의 비밀: 당신의 AI 코딩이 획기적으로 변하는 5가지 전략"
date: 2026-05-13T12:08:57.886Z
tags: ["AI & ML"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/1778673938056-ayf7en.png"
---

최근 Claude Code와 같은 에이전틱 워크플로우(Agentic Workflow)가 대세로 자리 잡으면서 많은 개발자가 CLAUDE.md를 작성하기 시작했습니다.
 하지만 제가 현장에서 지켜본 바로는 대다수가 이 강력한 도구를 제대로 활용하지 못하고 있습니다. "한국어로 답해줘"라고 명시해도 영어로 답이 오거나, 특정 폴더는 건드리지 말라고 신신당부해도 기어코 코드를 수정해버리는 상황, 익숙하시죠? 문제를 해결하겠다고 규칙을 하나둘 추가하다 보면 어느새 CLAUDE.md는 AI도 읽기 힘든 500줄짜리 비대한 매뉴얼이 되어버립니다.
이것은 단순히 문서화의 문제가 아니라 **'하네스 엔지니어링(Harness Engineering)'**의 부재입니다.
오늘은 안드레 카파시(Andrej Karpathy)와 앤트로픽(Anthropic)이 제시하는 고효율 전략을 통해, CLAUDE.md를 단순한 텍스트 파일이 아닌 프로젝트의 강력한 조종석으로 바꾸는 법을 공유해 드립니다.

![ChatGPT Image 2026년 5월 13일 오후 08 55 52](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1778674000865-wmzlbb.png)

## 핵심 인식의 전환: CLAUDE.md는 'README'가 아니라 '가드레일'이다
가장 먼저 바로잡아야 할 오해는 이 문서의 정체성입니다. 많은 개발자가 이를 인간을 위한 프로젝트 소개서(README)처럼 작성하곤 합니다. 하지만 실리콘밸리의 고성능 AI 에이전트 환경에서 이 문서의 정의는 완전히 다릅니다.
"인간이 읽는 리드미가 아니라 클로드가 같은 실수를 안 하게 하는 인스트럭션(Instruction)입니다."

CLAUDE.md는 AI가 프로젝트 내에서 넘지 말아야 할 선을 정해주고, 똑같은 실수를 반복하지 않도록 만드는 '가드레일'이자 '조종간'입니다. 이 차이를 이해하는 것이 품질 향상의 시작입니다. AI에게 배경 지식을 설명하려 들지 말고, AI의 행동을 제어하는 '실행 가능한 지침'을 작성하세요.

![ChatGPT Image 2026년 5월 13일 오후 08 58 04](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1778674017360-2rjtzq.png)

## 전략 1: 8단계 컨텍스트 레이어와 4가지 위치의 비밀

Claude는 매 요청마다 총 8가지 레이어의 컨텍스트를 읽어와 하나로 합칩니다. 이 구조를 알면 어떤 지침을 어디에 작성해야 할지 명확해집니다.
[Claude의 8단계 컨텍스트 스택]
시스템 프롬프트 (System Prompt): 가장 기본이 되는 지침
도구 정의 (Tool Definitions): 사용 가능한 툴에 대한 정의
Global 레이어: ~/.claude/.claude.md (모든 프로젝트 공통 규칙)
Project 레이어: 리포지토리 루트의 .claude.md (팀 공용 규칙)
Local 레이어: .claude.local.md (개인 메모, 비밀 토큰 등 / Git 제외 권장)
Sub-directory 레이어: 특정 폴더 내의 .claude.md (패키지별 특수 규칙)
대화 히스토리 (History): 이전 대화 내용
사용자 메시지 (User Message): 현재 사용자의 직접적인 요청
High-Leverage Tip: 리스트의 아래로 내려갈수록 구체적이며 우선순위가 높습니다. 즉, 서브 디렉토리의 지침이 글로벌 지침을 덮어씁니다. 보편적인 코딩 스타일은 상위(Global)에, 모노레포의 패키지별 특수 규칙은 하위(Sub-directory)에 배치하여 컨텍스트 효율을 극대화하세요.

![ChatGPT Image 2026년 5월 13일 오후 08 59 47](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1778674061323-8im1ew.png)

## 전략 2: 코드가 말해주는 정보는 과감히 삭제하라

CLAUDE.md에 토큰을 낭비하는 가장 흔한 안티 패턴은 AI가 코드를 읽어서 이미 알고 있는 정보를 적는 것입니다. 이는 명백한 토큰 낭비입니다.

Bad (삭제 대상): "이 프로젝트는 React와 TypeScript를 사용합니다.", "컴포넌트는 src/components에 있습니다." (AI는 이미 파일 확장자와 구조를 보고 압니다.)

Good (추가 대상): 프로젝트 고유의 비즈니스 규칙, AI가 자주 빠지는 함정(Gotchas), 우선순위 충돌 시의 결정 기준.
"코드대로 해줘"라는 추상적인 지시 대신, AI가 실수를 저지르기 쉬운 구체적인 지점을 공략하세요. AI가 읽을 수 없는 '개발자의 의도'만이 문서에 남아야 합니다.

![ChatGPT Image 2026년 5월 13일 오후 09 01 32](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1778674075685-mdindu.png)

## 전략 3: '실수 즉시 반영'의 높은 ROI (Mistake-to-Instruction Loop)

한 번에 완벽한 문서를 쓰려 하지 마세요. 가장 효율적인 유지보수 방법은 AI가 실수를 저지른 그 순간을 포착하는 것입니다. 제가 추천하는 3단계 워크플로우는 다음과 같습니다.
실수 발생: Claude가 테스트를 Mock으로 대충 짜버리거나 잘못된 라이브러리를 호출함.
수정 및 교육: 개발자가 실수를 바로잡고 이유를 설명함.
명령 수행: **"이 실수를 반복하지 않도록 CLAUDE.md를 업데이트해줘."**라고 명령함.
이 루프를 딱 일주일만 반복해 보세요. 문서는 여러분의 프로젝트에 최적화된 강력한 가이드북으로 진화할 것입니다. 이것이 가장 투자 대비 효율(ROI)이 높은 방식입니다.

![ChatGPT Image 2026년 5월 13일 오후 09 03 37](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1778674090407-agq6w4.png)

## 전략 4: 빌드/테스트/린트 명령어를 명시하여 비용 절감하기

AI 에이전트가 package.json을 뒤져가며 명령어를 추측하게 두지 마세요. 추측 과정에서 발생하는 시간과 토큰은 모두 비용입니다.

CLAUDE.md에 npm test, npm run build, npm run lint와 같은 핵심 명령어를 명시하세요. 명령어가 고정되어 있으면 AI는 시행착오 없이 즉시 실행 단계로 진입하며, 이는 결과물의 품질을 2~3배 향상시키는 가장 쉬운 방법입니다.

![ChatGPT Image 2026년 5월 13일 오후 09 05 16](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1778674107349-d8himr.png)

## 전략 5: 안드레 카파시의 스킬과 앤트로픽 공식 플러그인 활용

진정한 전문가들은 이미 자동화된 도구를 사용하고 있습니다.
1. 안드레 카파시의 'Think First' 스킬 안드레 카파시는 자신이 사용하는 CLAUDE.md를 GitHub에 공개했습니다. 이를 여러분의 **Global(.claude.md)**에 그대로 복사해서 사용하세요.
속도보다 신중함(Deliberation > Speed): 코딩 전 질문을 통해 모든 가정을 배제함.
외과적 수정(Surgical Refactor): 요청받지 않은 기능은 절대 추가하지 않고, 필요한 줄만 정확히 수정함.
단순함 유지: 오버엔지니어링을 철저히 배제하고 최소한의 코드만 작성함.

2. 앤트로픽 공식 플러그인 (claude-md-management) 명령 한 줄로 문서의 품질을 관리할 수 있습니다.
claude-md-improver: 기존 문서의 품질을 루브릭에 따라 점수화(A~F)하고 개선점을 제안함.
revise-claude-md: 현재 세션에서 배운 학습 내용을 바탕으로 문서를 자동 리팩토링함.
Pro-Tip (파일 분할 및 도구 호환): 문서가 100줄을 넘어간다면 coding-style.md처럼 파일을 분리하고 CLAUDE.md에서 참조(Reference)만 시키세요. 또한, Cursor를 사용 중이라면 CLAUDE.md 내에서 .cursorrules나 ai-instructions.md를 참조하게 만들어 '단일 진실 공급원(Single Source of Truth)'을 유지할 수 있습니다.

## 결론: 하네스 엔지니어링의 핵심으로서의 CLAUDE.md

AI 에이전트 시대에 우리가 관리해야 할 가장 핵심적인 코드는 무엇일까요? 저는 그것이 CLAUDE.md라고 확신합니다. Claude Code라는 강력한 하네스(Harness)를 조종하는 핸들이 바로 이 문서이기 때문입니다.

마지막으로 여러분의 프로젝트를 위한 최적화 체크리스트를 확인해 보세요.

[ ] 문서의 전체 길이가 100줄 이하인가? (길면 파일 분할 활용)

[ ] 빌드, 테스트, 린트 명령어가 명시되어 있는가?

[ ] 코드로 알 수 있는 정보(폴더 구조 등)를 삭제했는가?

[ ] 안드레 카파시의 'Think First' 원칙이 반영되어 있는가?

[ ] **claude-md-improver**를 통해 최근 한 달 내에 점검받았는가?

[ ] AI가 실수했을 때 즉시 그 내용을 문서에 업데이트하고 있는가?

AI가 상향 평준화될수록 차별화된 결과물을 만드는 핵심은 결국 이 '가드레일'을 얼마나 정교하게 설계하느냐에 달려 있습니다. 오늘 바로 여러분의 프로젝트에 이 전략들을 적용해 보시기 바랍니다.

**참고**
https://github.com/multica-ai/andrej-karpathy-skills/tree/main
