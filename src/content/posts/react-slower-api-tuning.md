---
title: "React와 Next.js에서 느린 API 호출을 해결하는 방법 ⚡"
description: "React/Next.js API 호출 최적화 전략 모음"
date: 2026-03-17T02:27:13.325Z
tags: ["Performance","React & Nextjs"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/react-slower-api-tuning-1773712053424.webp"
---

React를 처음 접하고 Next.js로 넘어갔을 때, 페이지가 즉시 로드될 거라고 기대했습니다. 하지만 프로젝트가 커질수록 답답한 상황이 발생했습니다. 백엔드는 문제가 없는데도 프론트엔드가 느리게 느껴졌죠. 사용자들은 로딩 스피너를 보거나, 더 나쁜 경우 빈 화면만 바라봐야 했습니다. 😥

처음에는 단순히 백엔드 응답 시간 문제라고 생각했습니다. 하지만 깊이 파고들자, 대부분의 지연은 **데이터를 가져오고 렌더링하는 방식** 때문이었다는 것을 깨달았습니다. Next.js 15의 App Router는 캐싱과 페칭 기본값을 상당히 변경했기 때문에, API 성능에 대한 접근 방식을 조정해야 했습니다.

이 글에서는 제가 저질렀던 실수들, 앱을 느리게 만든 원인들, 그리고 실제로 효과가 있었던 해결책들을 공유하겠습니다. 🚀

## 수정하기 전에 측정하기 📊

초반에 저지른 실수 중 하나는 문제가 무엇인지도 모르고 바로 해결책으로 뛰어들었다는 것입니다. 이제는 어떤 작업을 하기 전에 Chrome DevTools를 열고 **Network 탭**을 확인하여 API가 실제로 얼마나 걸리는지 확인합니다. 가끔은 백엔드는 괜찮은데, 프론트엔드가 요청을 연쇄적으로 만들고 있는 경우가 있습니다.

또한 **Performance 패널**을 사용하여 hydration 시간과 렌더링 지연을 확인합니다. Next.js에서는 서버 사이드 fetch 시간을 로깅하는 것도 도움이 됩니다. 어디서 속도가 느려지는지(백엔드, 프론트엔드 페칭, 렌더링)를 알게 되면 그제야 수정을 시작합니다. 🔍

## 순차적 요청이 모든 것을 느리게 만듭니다 🐌

초기 빌드에서 저는 데이터를 순차적으로 가져왔습니다. 예를 들어, 사용자 정보, 거래 내역, 알림이 필요했습니다. 코드는 이렇게 생겼죠:

```jsx
const user = await fetchUser();
const tx = await fetchTransactions(user.id);
const notifs = await fetchNotifications(user.id);

```

문제는? 각 호출이 이전 호출이 끝날 때까지 기다렸다는 것입니다. 각각이 200ms가 걸린다면, 총 시간은 쉽게 600-700ms를 넘어갔습니다. ⏱️

첫 번째 큰 개선은 **병렬 페칭**으로 전환했을 때 왔습니다:

```jsx
const [user, tx, notifs] = await Promise.all([
  fetchUser(),
  fetchTransactions(),
  fetchNotifications()
]);

```

이렇게 하면 총 대기 시간이 가장 느린 호출만큼만 걸립니다. 한 대시보드에서 이 단일 변경만으로 페이지가 두 배 빠르게 느껴졌습니다! 💨

## 너무 많은 데이터 가져오기 📦

또 다른 문제는 실제로 필요한 것보다 훨씬 많은 데이터를 가져오는 것이었습니다. 예를 들어, 이름과 아바타만 필요한데 수십 개의 필드가 있는 전체 사용자 프로필을 가져오는 경우입니다. 이는 응답 크기를 부풀려서 네트워크와 프론트엔드 파싱 모두를 느리게 만들었습니다.

이를 해결하기 위해 쿼리에 대해 의도적으로 생각하기 시작했습니다. API가 필드 필터를 지원한다면 `?fields=name,avatar`를 추가했습니다. 리스트의 경우 페이지네이션과 `limit=10`을 추가했습니다. 한 케이스에서는 전체 프로필 객체에서 필수 요소만으로 전환하여 페이로드를 200kb에서 20kb 이하로 줄였습니다.

**배운 교훈**: UI가 실제로 필요로 하는 것만 전송하세요! ✂️

## 캐싱 또는 재검증 없음 💾

로그를 확인했을 때 충격적인 것을 발견했습니다. 동일한 엔드포인트가 몇 초 내에 동일한 사용자에 대해 여러 번 호출되고 있었습니다. 이는 대역폭과 서버 부하의 낭비였죠.

클라이언트 측에서는 **SWR** 또는 **React Query**를 사용하기 시작했습니다. 이들은 응답을 캐시하고 백그라운드에서 재검증합니다. 이는 사용자가 반복 방문 시 즉시 캐시된 데이터를 볼 수 있고, 업데이트는 조용히 백그라운드에서 가져온다는 것을 의미했습니다.

서버 측에서 Next.js 15는 새로운 캐싱 동작을 도입했습니다. 기본적으로 `fetch`는 **더 이상 캐시되지 않습니다** - `cache: 'no-store'`처럼 동작합니다. 이를 해결하기 위해 데이터가 모든 요청마다 변경되지 않는다는 것을 알 때 명시적으로 캐싱을 설정했습니다:

```jsx
const res = await fetch(API_URL, { cache: 'force-cache' });

```

자주 변경되지 않는 데이터의 경우 재검증을 사용합니다:

```jsx
const res = await fetch(API_URL, { next: { revalidate: 60 } });

```

이는 응답을 캐시하고 60초마다 재검증합니다. 또한 무거운 DB 호출을 `unstable_cache`로 래핑하여 모든 요청마다 재실행되지 않도록 했습니다. 🎯

## 잘못된 위치에서 페칭하기 🎪

처음에는 거의 모든 fetch를 클라이언트 컴포넌트의 `useEffect` 안에 넣었습니다:

```jsx
useEffect(() => {
  fetch('/api/data').then(r => r.json()).then(setData);
}, []);

```

이는 사용자가 페이지를 로드하고, 아무것도 보지 못한 다음, 데이터를 위해 다시 기다려야 한다는 것을 의미했습니다. 백엔드가 빠르더라도 느리게 느껴졌습니다.

Next.js 15에서는 대부분의 페칭을 **Server Components**로 이동했습니다. 예를 들어 `app/page.tsx`에서:

```jsx
export default async function Page() {
  const res = await fetch(API_URL, { cache: 'force-cache' });
  const data = await res.json();
  return <MyUI data={data} />;
}

```

이제 서버가 HTML을 클라이언트에 보내기 전에 데이터를 가져옵니다. 사용자는 즉시 의미 있는 콘텐츠를 봅니다! 동적이거나 사용자별 데이터가 필요한 경우, UI의 해당 부분을 fallback과 함께 `<Suspense>`로 래핑합니다. ⚙️

## 번들 크기와 Hydration 지연 📦

API 호출이 빠르더라도 hydration과 렌더링이 상호작용을 차단하여 앱이 느리게 느껴지는 경우가 있었습니다. 이는 보통 JavaScript 번들이 너무 크기 때문에 발생했습니다.

해결책은 코드를 분할하고 필수가 아닌 부분을 lazy-load하는 것이었습니다. Next.js에서는 dynamic imports가 도움이 되었습니다:

```jsx
import dynamic from 'next/dynamic';
const HeavyChart = dynamic(() => import('./HeavyChart'), { ssr: false });

```

이렇게 하면 초기 로드가 가벼워집니다. 메인 UI가 상호작용 가능해진 후에만 무거운 차트를 가져왔습니다. 🎨

## API 라우트가 오버헤드를 추가함 🔄

또 다른 숨겨진 지연은 API를 구조화하는 방식에서 발생했습니다. 때때로 Next.js API 라우트 핸들러(`app/api/...`)를 백엔드에 대한 프록시로 사용했습니다. 편리하기는 했지만, 특히 서버리스 콜드 스타트에서 추가 지연이 발생했습니다.

Next.js 15에서 라우트 핸들러도 기본적으로 캐싱되지 않습니다. 캐시를 원한다면 명시적으로 선언해야 했습니다:

```jsx
export const dynamic = 'force-static';
export async function GET() {
  const res = await fetch(API_URL);
  return Response.json(await res.json());
}

```

**핵심 교훈**: 가능하면 불필요한 프록시 홉을 피하세요! 🎯

## UI 피드백 부족 ⏳

때때로 요청이 빠르더라도 사용자가 빈 공간을 응시하기 때문에 앱이 고장 난 것처럼 느껴졌습니다. 제 앱 중 하나에서 사용자들은 API가 느리다고 생각했지만, 진실은 제가 로딩 상태를 추가하지 않았다는 것이었습니다.

이제 항상 피드백을 제공합니다. Next.js 15의 React Suspense를 사용하면 간단합니다:

```jsx
<Suspense fallback={<LoadingSkeleton />}>
  <UserProfile />
</Suspense>

```

데이터가 1초가 걸리더라도 사용자는 즉시 플레이스홀더를 봅니다. 실제 속도만큼이나 체감 속도도 중요합니다! ⚡

## 실제 예시: 대시보드 페이지 수정하기 🛠️

제 프로젝트 중 하나에 사용자 정보, 거래 내역, 알림을 보여주는 대시보드가 있었습니다. 초기에는:

- 모든 데이터가 `useEffect`로 클라이언트에서 fetch됨
- 호출이 순차적이었음
- 캐싱이 없었음
- 무거운 차트 라이브러리가 첫 렌더에 로드됨
- 로딩 플레이스홀더가 없었음

사용 가능해지는 데 거의 3초가 걸려 고통스러울 정도로 느렸습니다. 😫

단계별로 리팩토링했습니다:

1. **Server Component**로 페칭을 이동하고 `Promise.all` 사용
2. `cache: 'force-cache'`와 재검증을 추가하여 캐싱 제어
3. 비용이 많이 드는 DB 호출을 `unstable_cache`로 래핑
4. dynamic imports로 차트 라이브러리를 lazy-load
5. Suspense로 스켈레톤 플레이스홀더 추가

그 후, 사용자는 700ms 이내에 의미 있는 콘텐츠를 볼 수 있었고, 차트는 그 후 부드럽게 로드되었습니다. 차이는 하늘과 땅 차이였습니다! 🌟

## 배운 것 📚

Next.js 15나 React에서 API 호출이 느리게 느껴진다면, 대부분 백엔드만의 문제가 아닙니다. 느림은 보통 다음에서 발생합니다:

✅ 병렬 대신 순차적으로 데이터 페칭

✅ 너무 많은 데이터 요청

✅ 캐시 또는 재검증을 잊어버림

✅ Server Components 대신 모든 것을 클라이언트 측에서 페칭

✅ 거대한 번들을 한 번에 로드

✅ 지연을 발생시키는 프록시 레이어 추가

✅ 로딩 상태와 사용자 피드백 무시

해결책은 화려하지 않지만 효과가 있습니다. 먼저 측정한 다음 캐싱, 페칭, 렌더링 전략을 조정하세요. 항상 실제 속도와 체감 속도 모두를 고려하세요.

Next.js 15 App Router로 이동한 이후, 캐싱에 대해 명시적으로 작성하고(`force-cache`, `revalidate`, `unstable_cache`) Server Components를 활용하는 것이 제 프로젝트에서 가장 큰 개선이었습니다.

이제 "느린 API"에 직면할 때마다 당황하는 대신 이 체크리스트를 거칩니다. 거의 항상 병목 현상은 이러한 지점 중 하나에 있으며, 이를 수정하면 앱이 다시 빠르게 느껴집니다! 🚀

---

**📌 출처**: [Why Your API Calls Are Slow and How to Fix Them in Nextjs 15](https://medium.com/@jigsz6391/why-your-api-calls-are-slow-and-how-to-fix-them-in-nextjs-15-93400a2cb310)

**✍️ 원저자**: debug_senpai

**📅 게시일**: 2025년 10월 1일

**🔗 원문 블로그**: [jigsdev.xyz](https://jigsdev.xyz/blogs/why-your-api-calls-are-slow-and-how-to-fix-them-in-nextjs-15)
