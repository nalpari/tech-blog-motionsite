---
title: "\"Next.js 16.2 릴리즈 — 무엇이 달라졌나?\""
description: "2026년 3월 18일 릴리즈된 Next.js 16.2의 주요 변경 사항을 정리했습니다. 성능 개선, 디버깅 강화, AI 에이전트 지원, Turbopack 업데이트까지 한눈에."
date: 2026-03-20T05:02:41.730Z
tags: ["React & Nextjs"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/1773982940266-nnth1g.png"
---

2026년 3월 18일, Next.js 16.2가 공식 릴리즈되었습니다.

이번 릴리즈는 **성능 대폭 향상**, **개발자 경험 개선**, **AI 코딩 에이전트 지원 강화**, 그리고 **200개 이상의 Turbopack 버그픽스** 등을 담고 있습니다. 크고 작은 변화들이 많은 만큼 핵심 내용을 하나씩 살펴보겠습니다.

---

![nextjs 162](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1773982952519-oeyq1d.png)

## ⚡ 성능: 개발 서버 시작이 약 4배 빨라졌다

### Faster Time-to-URL (~87% faster `next dev`)

Next.js 16.2에서 `next dev` 실행 후 `localhost:3000`이 준비되는 시간이 **이전 버전(16.1) 대비 약 87% 단축**되었습니다. 이는 약 4배에 가까운 속도 개선입니다. 개발 중 서버를 껐다 켰다 하는 일이 잦은 분들에게 체감이 클 변화입니다.

### Faster Rendering (~25~60% 빠른 렌더링)

Next.js 팀이 **React 코어에 직접 기여**한 패치가 이번 버전에 포함되었습니다. 기존에는 `JSON.parse`에 reviver 콜백을 사용하는 방식으로 Server Components payload를 역직렬화했는데, 이 방식은 V8 엔진에서 C++와 JavaScript 경계를 매번 넘나들어야 했기 때문에 불필요한 오버헤드가 컸습니다.

새로운 방식은 `JSON.parse()`로 우선 파싱 후, 순수 JavaScript로 재귀 순회하는 2단계 방식을 사용합니다. 결과적으로:

| 시나리오 | 개선율 |
|---|---|
| 1000개 아이템 테이블 (Server Component) | **26% 빠름** |
| 중첩 Suspense 구조 | **33% 빠름** |
| Payload CMS 홈페이지 | **34% 빠름** |
| Payload CMS Rich Text | **60% 빠름** |

RSC payload 크기가 클수록 체감이 더 큰 경향이 있으므로, 데이터 헤비한 앱에서는 더욱 눈에 띄는 성능 향상을 기대할 수 있습니다.

---

## 🐛 디버깅: 개발 경험이 크게 좋아졌다

### Server Function Logging

이제 개발 서버 터미널에서 **Server Function(Server Action) 실행 로그**를 바로 확인할 수 있습니다. 각 로그에는 다음 정보가 포함됩니다:

- 함수 이름
- 전달된 인자
- 실행 시간
- 정의된 파일 경로

이전까지는 Server Action이 실제로 실행됐는지 확인하려면 `console.log`를 직접 찍거나, 네트워크 탭을 뒤져야 했습니다. 이제는 터미널만 봐도 됩니다.

### Hydration Diff Indicator

하이드레이션 미스매치가 발생했을 때, 에러 오버레이에서 **서버에서 온 컨텐츠와 클라이언트에서 온 컨텐츠를 명확히 구분**해서 보여줍니다. `+ Client` / `- Server` 형식의 diff 표시 방식이라 어디서 어떤 차이가 발생했는지 즉시 파악할 수 있습니다.

### Error Causes in Dev Overlay

에러 오버레이에서 이제 **`Error.cause` 체인**을 함께 표시합니다. 에러가 다른 에러를 감싸는 경우(wrapping errors)에 원인 에러들이 최대 5단계까지 플랫한 리스트 형태로 표시됩니다. 에러 추적이 훨씬 직관적으로 개선되었습니다.

### `--inspect` for `next start`

16.1에서 도입된 `next dev --inspect`에 이어, 이번에는 **`next start --inspect`** 도 지원합니다. 프로덕션 서버에 Node.js 디버거를 직접 붙일 수 있어 CPU/메모리 프로파일링이나 프로덕션 이슈 디버깅이 가능해집니다.

```bash
next start --inspect
```

---

## 🤖 AI 에이전트 지원: 프레임워크가 AI를 위한 도구를 직접 챙기기 시작했다

Next.js 16.2에서 가장 눈길을 끄는 방향성 중 하나는 **AI 코딩 에이전트를 위한 개선**입니다. [별도 블로그 포스트](https://nextjs.org/blog/next-16-2-ai)로도 깊게 다루고 있습니다.

### AGENTS.md in `create-next-app`

`create-next-app`으로 새 프로젝트를 생성하면 이제 기본으로 **`AGENTS.md` 파일**이 포함됩니다. 이 파일은 Claude Code, Cursor 등 AI 코딩 에이전트에게 "코딩을 시작하기 전에 `node_modules/next/dist/docs/` 경로에 번들된 Next.js 문서를 먼저 읽어라"고 지시합니다.

Next.js 팀의 내부 연구에 따르면, 이 방식으로 문서를 제공했을 때 에이전트의 Next.js 관련 eval 통과율이 **100%** 였으며, 온디맨드 방식의 문서 검색(79%)보다 월등히 높았다고 합니다.

> 기존 프로젝트에 적용하고 싶다면, 프로젝트 루트에 `AGENTS.md`와 `CLAUDE.md` 파일을 수동으로 추가하면 됩니다. `CLAUDE.md`는 Claude Code용 설정 파일로, `@AGENTS.md`를 통해 컨텍스트를 포함할 수 있습니다.

### Browser Log Forwarding

개발 환경에서 브라우저 에러가 이제 **터미널로 자동 포워딩**됩니다. 브라우저 콘솔에 접근하기 어려운 AI 에이전트도 클라이언트 사이드 에러를 바로 확인할 수 있게 됩니다.

`next.config.ts`에서 세부 설정이 가능합니다:

```ts
const nextConfig = {
  logging: {
    browserToTerminal: true, // 기본값: 'error' (에러만)
    // 'warn' — 경고 + 에러
    // true — 모든 콘솔 출력
    // false — 비활성화
  },
};
```

### `next-browser` (Experimental)

`@vercel/next-browser`는 AI 에이전트가 터미널 명령어로 실행 중인 Next.js 앱을 직접 검사할 수 있게 해주는 실험적 CLI입니다.

- 스크린샷, 네트워크 요청, 콘솔 로그 접근
- React 컴포넌트 트리, props, hooks 상태 조회
- PPR 경계, 에러 정보 등 Next.js 전용 인사이트

```bash
npx skills add vercel-labs/next-browser
# Claude Code나 Cursor에서 /next-browser 명령어로 사용
```

---

## 📦 Turbopack: 200개 이상의 수정 및 개선

Turbopack 관련 변경 사항은 워낙 방대하여 [별도 포스트](https://nextjs.org/blog/next-16-2-turbopack)로 분리되었습니다. 주요 내용만 요약하면:

- **더 빠른 빌드**: 성능 최적화 지속 진행
- **SRI(Subresource Integrity) 지원 추가**
- **`postcss.config.ts` 지원**: JavaScript 대신 TypeScript로 PostCSS 설정 가능
- **Tree Shaking 개선**: 미사용 코드 제거가 더 정교해짐
- **Server Fast Refresh**: 서버 컴포넌트에서도 빠른 HMR 지원
- **200개 이상의 버그 수정**

---

## 🎨 그 외 주요 변경 사항

### `transitionTypes` Prop for `<Link>`

App Router의 `<Link>` 컴포넌트에 `transitionTypes` prop이 추가되었습니다. React의 View Transitions API와 함께 사용하여 네비게이션 시 방향에 따른 다양한 애니메이션 적용이 가능합니다.

```tsx
<Link href="/about" transitionTypes={['slide']}>
  About
</Link>
```

Pages Router에서는 무시됩니다.

### Faster `ImageResponse`

OG 이미지 생성 등에 사용되는 `ImageResponse`가 크게 개선되었습니다:

- 기본 이미지: **2배 빠름**
- 복잡한 이미지: 최대 **20배 빠름**
- CSS/SVG 지원 범위 확대 (inline CSS 변수, `text-indent`, `box-sizing`, `display: contents` 등)
- 기본 폰트가 Noto Sans → **Geist Sans**로 변경

### 새로운 기본 에러 페이지 디자인

`global-error.tsx`나 `error.tsx`를 정의하지 않은 경우 프로덕션에서 표시되는 기본 500 에러 페이지가 더 깔끔하고 모던한 디자인으로 업데이트되었습니다.

### Multiple Icon Formats

이제 앱 디렉토리에 같은 기본 이름의 아이콘 파일을 여러 확장자로 동시에 둘 수 있습니다 (예: `icon.png`와 `icon.svg`). 최신 브라우저는 SVG를, 구형 브라우저는 PNG를 자동으로 사용합니다.

### Adapters API 안정화 (Stable)

배포 플랫폼이나 커스텀 빌드 파이프라인에서 Next.js 빌드 프로세스를 커스터마이징할 수 있도록 해주는 `adapterPath` API가 실험적 단계를 벗어나 **정식(stable) API로 승격**되었습니다.

```ts
// next.config.ts
const nextConfig = {
  adapterPath: require.resolve('./my-adapter.js'),
};
```

---

## 🧪 실험적 기능 (Experimental)

### `unstable_catchError()`

`error.js` 파일 컨벤션의 에러 복구 기능을 컴포넌트 레벨까지 세분화할 수 있는 새로운 API입니다. 컴포넌트 트리 어디에든 커스텀 에러 바운더리를 배치할 수 있습니다.

```tsx
'use client';

import { unstable_catchError, type ErrorInfo } from 'next/error';

function CustomErrorBoundary(
  props: { title: string },
  { error, unstable_retry }: ErrorInfo,
) {
  return (
    <div>
      <h2>{props.title}</h2>
      <p>{error.message}</p>
      <button onClick={() => unstable_retry()}>다시 시도</button>
    </div>
  );
}

export default unstable_catchError(CustomErrorBoundary);
```

### `unstable_retry()` in `error.tsx`

기존 `reset()` 함수는 에러 상태만 초기화하고 컴포넌트를 재렌더링할 뿐, 데이터 페칭에서 발생한 에러는 해결하지 못했습니다. 새롭게 추가된 `unstable_retry()`는 `router.refresh()`와 `reset()`을 `startTransition()` 내에서 함께 호출하여 **데이터도 다시 가져오는 진짜 재시도**를 수행합니다.

```tsx
'use client';

import type { ErrorInfo } from 'next/error';

export default function Error({ error, unstable_retry }: ErrorInfo) {
  return (
    <div>
      <h2>오류가 발생했습니다</h2>
      <p>{error.message}</p>
      <button onClick={() => unstable_retry()}>다시 시도</button>
    </div>
  );
}
```

### `experimental.prefetchInlining`

링크 hover 시 발생하는 prefetch 요청을 단일 응답으로 묶어주는 옵션입니다. 요청 수를 줄이는 대신 공유 레이아웃 데이터가 중복될 수 있어 트레이드오프가 있습니다.

### `experimental.appNewScrollHandler`

App Router의 스크롤 및 포커스 관리 시스템을 개선하는 실험적 옵션입니다. 페이지 이동 후 브라우저 네이티브 동작과 일치하도록 포커스 처리 방식이 바뀌었습니다.

---

## 🔼 업그레이드 방법

```bash
# 자동 업그레이드 CLI 사용 (권장)
npx @next/codemod@canary upgrade latest

# 수동 업그레이드
npm install next@latest react@latest react-dom@latest

# 새 프로젝트 시작
npx create-next-app@latest
```

---

## 마치며

Next.js 16.2는 단순한 마이너 버전 업이 아닙니다. **개발 서버 속도**, **렌더링 성능**, **디버깅 경험**, 그리고 **AI 코딩 에이전트와의 협업**이라는 네 가지 축에서 동시에 큰 발전이 이루어졌습니다.

특히 AI 에이전트를 위한 투자가 눈에 띕니다. AGENTS.md 기본 제공, 브라우저 로그 포워딩, next-browser 실험적 CLI 등은 "에이전트도 개발자와 동일한 가시성을 가져야 한다"는 철학을 반영합니다. 앞으로 Next.js가 AI 네이티브 개발 환경의 표준이 되려는 방향성이 더욱 뚜렷해지고 있는 것 같습니다.

프로젝트에서 Next.js를 사용 중이라면 꼭 업그레이드해 보시길 추천드립니다. 특히 `next dev` 시작 속도 차이는 매일 느끼는 만큼 체감이 클 것입니다.

---

> 참고 링크
> - [Next.js 16.2 공식 블로그](https://nextjs.org/blog/next-16-2)
> - [Turbopack 업데이트 상세](https://nextjs.org/blog/next-16-2-turbopack)
> - [AI 에이전트 개선 상세](https://nextjs.org/blog/next-16-2-ai)
