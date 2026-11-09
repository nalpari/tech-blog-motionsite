---
title: "Next.js 앱을 느리게 만드는 6가지 캐싱 실수 (그리고 해결 방법)"
description: "Next.js 캐싱 6가지 실수와 ISR/SWR 해결법"
date: 2026-03-17T02:27:13.325Z
tags: ["Performance","React & Nextjs"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/nextjs-mistake-6-1773701509034.webp"
---

**Next.js**로 개발할 때, 캐싱은 마치 어둠의 예술처럼 느껴질 수 있습니다.

**ISR, SSR, SSG, 그리고 revalidation** 사이에서 앱이 번개처럼 빠르다고 생각할 수 있지만, 실제로는 불필요한 서버 작업을 하거나, 더 나쁘게는 오래된 콘텐츠를 제공하고 있을 수 있습니다.

저도 그런 경험이 있습니다. 캐싱이 올바르게 설정된 것 *같고*, 개발 환경에서는 페이지가 빠르게 로드되지만, 프로덕션 환경에서는 느려지는 경우가 있었습니다. 수십 개의 Next.js 앱을 디버깅한 후(제 것과 다른 사람들의 것), 성능을 생각보다 더 많이 저하시키는 **일반적인 캐싱 실수**들을 발견했습니다.

다음은 **Next.js 앱에서 자주 보는 6가지 캐싱 실수**와 간단하고 실용적인 예제로 해결하는 방법입니다.

---

## 실수 1: 필요하지 않을 때 SSR(`getServerSideProps`) 사용하기

이것은 아마도 **"1번 성능 킬러"**일 것입니다.

> SSR은 실제로 매 요청마다 새로운 데이터가 필요할 때 훌륭합니다.
> 
> 
> *하지만 대부분의 경우 그렇지 않습니다.*
> 

**❌ 잘못된 방법:**

```jsx
export async function getServerSideProps() {
  const res = await fetch('<https://api.example.com/posts>');
  const data = await res.json();
  return { props: { data } };
}

```

이것은 데이터가 자주 변경되지 않을 때도 **모든 요청에서 실행됩니다**.

**✅ 올바른 방법:**

**ISR**(`getStaticProps` + `revalidate`)을 대신 사용하세요.

```jsx
export async function getStaticProps() {
  const res = await fetch('<https://api.example.com/posts>');
  const data = await res.json();

  return {
    props: { data },
    revalidate: 60 // 60초마다 재생성
  };
}

```

> 결과: 빠른 정적 로드 + 정기적인 신선함.
> 

---

## 실수 2: `getStaticProps`에 `revalidate` 설정하지 않기

정적 페이지는 성능에 좋습니다 — 하지만 데이터가 변경되면 어떻게 될까요?

`revalidate`를 추가하는 것을 잊으면, 사용자들은 수동으로 재배포하지 않는 한 **영원히 오래된 데이터**를 볼 수 있습니다.

**❌ 잘못된 방법:**

```jsx
export async function getStaticProps() {
  const res = await fetch('<https://api.example.com/data>');
  const data = await res.json();
  return { props: { data } }; // revalidate 없음!
}

```

**✅ 올바른 방법:**

스마트한 `revalidate` 값을 추가하세요 (초 단위):

```jsx
export async function getStaticProps() {
  const res = await fetch('<https://api.example.com/data>');
  const data = await res.json();

  return {
    props: { data },
    revalidate: 300 // 5분마다 새로고침
  };
}

```

> 핵심: 데이터가 변경되면 ISR을 사용하세요.
> 

---

## 실수 3: API 경로에서 Cache-Control 헤더 잘못 사용하기

커스텀 API 경로들이 기본적으로 캐시되지 않는다는 것을 알고 계시나요?

`/api/*`에서 계산되었거나 느린 데이터를 제공하면서 응답을 캐시하지 않는다면, 모든 요청에서 서버 사이클을 낭비하고 있는 것입니다.

**❌ 잘못된 방법:**

```jsx
export default function handler(req, res) {
  res.status(200).json({ time: Date.now() });
}

```

모든 요청이 서버에 새롭게 도달합니다.

**✅ 올바른 방법:**

**캐시 헤더**를 사용해서 동작을 제어하세요.

```jsx
export default function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  res.status(200).json({ time: Date.now() });
}

```

> 보너스: Vercel과 같은 플랫폼에서 CDN 레벨 캐싱을 위해 s-maxage를 사용하세요.
> 

---

## 실수 4: 클라이언트 사이드 캐싱 잊어버리기 (SWR, Fetch)

모든 것을 빌드 타임에 캐시할 필요는 없습니다. 때로는 **클라이언트 사이드 캐싱**이 올바른 선택입니다.

클라이언트 사이드에서 데이터를 가져오면서 캐시하지 않는다면, 그냥 대역폭을 낭비하고 있는 것입니다.

**❌ 잘못된 방법:**

```jsx
useEffect(() => {
  fetch('/api/user').then(res => res.json()).then(setUser);
}, []);

```

모든 페이지 로드 = 새로운 네트워크 호출.

**✅ 올바른 방법:**

`SWR`이나 React Query를 사용하세요.

```jsx
import useSWR from 'swr';

const fetcher = url => fetch(url).then(res => res.json());
const { data, error } = useSWR('/api/user', fetcher);

```

> SWR은 캐시하고, 재검증하며, UI를 빠르게 유지합니다.
> 

---

## 실수 5: 동적 라우트 과도하게 캐싱하기

`getStaticPaths`를 사용해서 **모든 블로그 포스트**나 동적 페이지를 미리 생성하고 싶을 수 있습니다. 좋게 들리지만... 빌드 타임 비대화에 부딪힐 때까지는 말이죠.

**❌ 잘못된 방법:**

```jsx
export async function getStaticPaths() {
  const res = await fetch('<https://api.example.com/posts>');
  const posts = await res.json();
  const paths = posts.map(post => ({ params: { slug: post.slug } }));

  return { paths, fallback: false }; // 수천 개의 포스트가 있다면 나쁨
}

```

**✅ 올바른 방법:**

`fallback: 'blocking'`과 **ISR**을 사용하세요.

```jsx
return {
  paths: [], // 또는 작은 부분집합
  fallback: 'blocking'
};

```

> 페이지들이 요청에 따라 생성되고 캐시됩니다.
> 

---

## 실수 6: Fetch에서 `no-store` vs `force-cache` 무시하기

Next.js 13+ (App Router)에서 fetch는 내장된 캐시 옵션을 가지고 있습니다.

이것들을 설정하지 않으면, 기본값에 의존하게 되는데 — 이것이 원하는 것이 아닐 수 있습니다.

**❌ 잘못된 방법:**

```jsx
const res = await fetch('<https://api.example.com/data>');

```

이것은 기본 캐싱 동작을 사용할 수 있습니다 (잘못될 수 있음).

**✅ 올바른 방법:**

명시적으로 설정하세요:

```jsx
const res = await fetch('<https://api.example.com/data>', {
  cache: 'force-cache' // 또는 'no-store' 또는 'no-cache'
});

```

> SSR 스타일 fetch에는 no-store를 사용하세요
> 
> 
> *정적 생성에는 `force-cache`를 사용하세요*
> 
> *시간 기반 ISR fetch에는 `revalidate`를 사용하세요*
> 

---

## 마지막 팁: Next.js에서 더 스마트하게 캐시하는 방법

1. **항상 물어보세요: 이 데이터가 사용자/요청별로 신선해야 하나요?**
2. **SSR보다 revalidation이 있는 정적 생성 (ISR)을 선호하세요.**
3. **클라이언트에서는 SWR이나 React Query를 사용하세요.**
4. **API 경로에는 헤더와 CDN 캐싱을 사용하세요.**
5. **빌드 타임을 모니터링하세요** — 너무 많은 페이지 = 느린 배포.

---

## ✍️ 결론

Next.js에서의 캐싱은 만능이 아닙니다. 강력하지만 — 잘못 사용하면 조용히 앱을 느리게 만들 것입니다.

이 6가지 일반적인 실수를 피함으로써, **성능을 극적으로 개선하고, 서버 비용을 줄이며**, **더 나은 사용자 경험을 제공**할 수 있습니다.

이 분석이 저에게 도움이 되었던 만큼 여러분에게도 도움이 되기를 바랍니다. Next.js에서 다른 캐싱 특이점들을 경험해보셨다면, 댓글로 들려주세요! 👇

---

**출처:** [6 Next.js Caching Mistakes That Make Your App Slower (And How to Fix Them)](https://javascript.plainenglish.io/6-next-js-caching-mistakes-that-make-your-app-slower-and-how-to-fix-them-5e0113469546)

**원문 저자:** Meet

**게시:** JavaScript in Plain English

**번역일:** 2025년 9월 23일
