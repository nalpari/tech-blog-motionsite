---
title: "React 19.1: 정말로 무엇이 바뀌었고 개발자들이 왜 이것을 사랑하게 될까"
description: "React 19.1의 use(), useOptimistic 등 핵심 변화"
date: 2026-03-17T02:27:13.325Z
tags: ["React & Nextjs"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/react-19-key-features-1773711685942.jpg"
---

![](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*fEZddCgBxZAIBkpYMHk1-Q.png)

**작성자: Luna Rojas | 2025년 9월 17일 | 읽는 시간: 6분**

React 19.1만큼 중요하게 느껴지는 버전은 거의 없었습니다. 단순히 새로운 기능 목록이 아니라, 우리가 코드를 생각하고 작성하는 방식의 근본적인 변화입니다.

제가 생각하기에 세 가지 핵심 영역이 있습니다: 코드 작성 방식(`use`와 `useOptimistic`), 자체 최적화 방식(React Compiler), 그리고 브라우저 통합 방식(View Transitions).

처음으로 이 모든 조각들이 실제 문제를 해결하기 위해 연결되는 느낌입니다: 일반적인 작업을 위한 코드를 덜 작성하고, 외부 라이브러리와 싸우지 않고도 더 부드러운 사용자 경험을 제공합니다.

---

## `use()`: 데이터 페칭을 위한 `useEffect`와의 작별

솔직히 말해서, 데이터를 가져오기 위한 `useEffect`와 `useState` 패턴은 항상 다소 장황했습니다. 로딩 상태, 에러 상태, 데이터 자체를 수동으로 관리해야 했습니다... 우리 모두가 반복해서 수행한 의식이었죠.

React 19.1은 `use()` 훅을 도입했으며, 이것이 놀라운 방식으로 이를 단순화하기 때문에 추천합니다. 프로미스를 전달하기만 하면 React가 나머지를 처리합니다.

**이것이 게임 체인저인 이유:**

**이전 방식** (우리 모두가 수천 번 작성한 클래식 패턴):

```jsx
// 우리 모두가 수천 번 작성한 클래식 패턴
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/user/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => setError(err))
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Failed to load.</p>;
  return <h1>{user.name}</h1>;
}

```

**React 19.1의 새로운 방식** (`use()`와 `Suspense` 사용):

```jsx
import { use, Suspense } from 'react';

// 프로미스를 반환하는 함수
const fetchUser = (userId) =>
  fetch(`/api/user/${userId}`).then(res => res.json());

function Profile({ userId }) {
  // `use`가 프로미스를 "언래핑"합니다. 준비되지 않았으면 일시 중단됩니다.
  const user = use(fetchUser(userId));
  return <h1>{user.name}</h1>;
}

// 부모 컴포넌트에서 Suspense로 감싸기
function App() {
  return (
    <Suspense fallback={<p>Loading profile...</p>}>
      <Profile userId="123" />
    </Suspense>
  );
}

```

**중요 사항:** `use()`는 `useEffect`에서 했던 모든 것을 대체하는 것이 아닙니다. 이것은 리소스(프로미스 및 컨텍스트와 같은)를 선언적으로 읽기 위해 특별히 설계되었으며, 로딩 상태를 위해 `<Suspense>`를 사용하고 에러를 위해 Error Boundaries를 사용하는 것에 완전히 의존합니다. 이것이 우리의 데이터 흐름에 대해 더 구조적으로 생각하도록 강제하기 때문에 특히 마음에 듭니다.

---

## `useOptimistic`: 거짓 없는 즉각적인 UI 업데이트

이것은 인터랙티브 앱에서 매우 일반적인 문제를 해결하는 보석 중 하나입니다. 사용자가 사진에 "좋아요"를 누른다고 상상해보세요. 서버 응답을 기다려서 하트가 채워지는 것을 보길 원하지 않습니다. UI가 즉시 반응하길 원합니다.

이것이 낙관적 업데이트(optimistic update)입니다. React 19 이전에는 이것을 수동으로 구현하는 것이 엉망이었습니다: 로컬 상태를 업데이트하고, 요청을 보내고, 실패하면 변경사항을 되돌려야 했습니다.

이제 `useOptimistic`이 이것을 우리를 위해 수행합니다.

```jsx
import { useOptimistic } from 'react';

async function sendLikeToServer(likes) {
  // 실패할 수 있는 요청 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (Math.random() > 0.5) {
    throw new Error('Network error');
  }
  return { success: true };
}

function LikeButton({ initialLikes }) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    initialLikes,
    // 낙관적 상태가 업데이트되는 방식을 정의하는 함수
    (currentLikes, newLikes) => currentLikes + newLikes
  );

  const handleClick = async () => {
    // 1. 낙관적 값으로 UI를 즉시 업데이트
    addOptimisticLike(1);

    try {
      // 2. 서버에 실제 요청 전송
      await sendLikeToServer(optimisticLikes + 1);
    } catch (error) {
      // 3. 실패하면 React가 자동으로 상태를 되돌립니다. 마법이죠!
      console.error('Like failed, state is reverted automatically.');
    }
  };

  return <button onClick={handleClick}>❤️ {optimisticLikes} Likes</button>;
}

```

API 호출이 실패하면 React가 자동으로 상태를 되돌린다는 점이 특히 마음에 듭니다. 이는 우리를 위한 롤백 코드가 줄어들고 훨씬 더 부드러운 사용자 경험을 의미합니다.

---

## React Labs: View Transitions와 애니메이션의 미래

이제 정말 흥미로운 부분입니다. React는 정말 멋진 네이티브 브라우저 API와 통합하기 시작했습니다.

**View Transitions**는 UI 상태 간의 매우 부드러운 애니메이션을 만들기 위한 브라우저 네이티브 기능입니다 - 한 페이지에서 다른 페이지로 이동할 때처럼요. 이전에는 애니메이션 라이브러리를 가져오고 많은 커스텀 CSS를 작성해야 했습니다.

이제 React 19는 이 API를 선언적으로 사용할 수 있는 컴포넌트를 제공합니다. React가 "진짜" 웹 플랫폼에 더 기대고 있다는 점이 특히 마음에 듭니다.

**주의사항:** 이것은 아직 실험적이지만, 미래가 어디로 향하고 있는지에 대한 매우 명확한 신호를 제공합니다: 브라우저와 더 통합된 React입니다.

---

## React Compiler: `useMemo`와 `useCallback`의 종말 (거의)

솔직히 말해봅시다: 우리 모두는 컴포넌트에 `useMemo`가 필요한지, 함수를 `useCallback`으로 감싸야 하는지 고민하며 시간을 낭비했습니다. 물론 최적화 도구이지만, 코드를 복잡하게 만들고 잘못 사용하면 오히려 상황을 악화시킬 수도 있습니다.

**React Compiler**는 React 팀의 이 문제에 대한 답입니다. 코드를 분석하고 실제로 필요한 곳에만 이러한 최적화를 자동으로 적용하는 도구입니다.

**추천하는 이유:** 아이디어가 훌륭합니다. 앱의 로직 작성에 집중하고 컴파일러가 미세 최적화를 처리하도록 합니다. 목표는 기본적으로 더 깔끔한 코드와 훌륭한 성능입니다.

하지만 봐요, 이것은 마법이 아닙니다. 예상대로 작동하지 않는 경우 내부에서 무슨 일이 일어나고 있는지 알기 위해 React에서 렌더링이 어떻게 작동하는지 이해하는 것이 여전히 매우 중요합니다. 기본을 배우는 것을 건너뛸 수 있는 핑계가 아닙니다.

---

## Server Components와 Suspense: 모든 조각이 마침내 맞춰지다

React 19와 함께, React 18에서 소개된 **Server Components**와 같은 많은 아이디어가 마침내 완전한 의미를 갖게 됩니다.

`use()` 훅은 퍼즐의 빠진 조각입니다. 클라이언트 측 컴포넌트가 서버에서 스트리밍되는 데이터를 자연스럽게 소비할 수 있게 해주는 완벽한 다리입니다.

실제 프로젝트에서, 특히 Next.js와 같은 프레임워크를 사용하는 경우, 이는 점진적으로 로드되는 UI(먼저 쉘, 그다음 콘텐츠)를 구축하는 것이 훨씬 간단하고 직관적이라는 것을 의미합니다. Suspense를 사용한 스트리밍의 전체 시스템은 이제 완전하고 잘 생각된 것처럼 느껴집니다.

---

## 아무것도 깨뜨리지 않고 이것들을 시도하는 방법

View Transitions와 Compiler와 같은 이러한 기능의 대부분은 아직 실험적 채널에 있습니다. 아직 프로덕션에 넣지 말라는 것이 제 추천입니다.

놀이터 프로젝트나 별도의 기능 브랜치를 만들어 실험해보세요. 실험 버전을 설치하는 것은 간단합니다:

```bash
npm install react@experimental react-dom@experimental

```

이를 통해 React의 미래를 경험하고, 피드백을 제공하고, 이러한 API가 안정화될 때를 대비할 수 있습니다. [React Labs 블로그 포스트](https://react.dev/blog/2024/04/25/react-labs-what-we-have-been-working-on-march-2024)에서 진행 상황을 확인할 수 있습니다.

---

## 빠른 요약: 보일러플레이트가 적은 더 스마트한 React

요약하자면, React 19.1은 단순한 업데이트가 아니라 개발자로서 우리의 삶의 질을 향상시킵니다.

- *`use()`와 `useOptimistic`*는 우리가 매일 작성했던 보일러플레이트 코드를 제거합니다
- **React Compiler**는 수동 최적화의 부담을 우리 어깨에서 덜어줄 것을 약속합니다
- **View Transitions**는 우리를 유동적이고 네이티브한 애니메이션이 있는 미래에 더 가깝게 만듭니다

**최종 추천:** 작은 프로젝트나 개인 프로젝트에서 이러한 새로운 훅을 시도하기 시작하세요. `use()`와 `Suspense`에 익숙해지세요. 이것들이 앞으로 몇 년 동안 React 애플리케이션을 구축하는 방법을 정의할 것이기 때문입니다.

---

**출처:** [React 19.1: What Really Changes and Why Developers Are Going to Love It](https://medium.com/@Luna-Rojas/react-19-1-what-really-changes-and-why-developers-are-going-to-love-it-18081ff20fbe)

**작성자:** Luna Rojas

**원문 게시일:** 2025년 9월 17일
