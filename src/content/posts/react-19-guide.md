---
title: "React 19 새로운 기능 가이드"
description: "React 19 컴파일러, Actions, use() 등 핵심 기능"
date: 2026-03-17T02:27:13.325Z
tags: ["React & Nextjs"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/react-19-guide-1773711560049.jpg"
---

## 개요

React 19는 2024년 12월 5일에 정식 출시된 React의 메이저 버전 업데이트입니다. React 18 출시 이후 2년 만에 선보인 이번 버전은 성능 개선과 개발자 경험 향상에 초점을 맞춘 혁신적인 기능들을 포함하고 있습니다.

---

![](https://images.unsplash.com/photo-1620924049153-4d32fcbe88fe?ixlib=rb-4.1.0&q=85&fm=jpg&crop=entropy&cs=srgb)

## 주요 새로운 기능

### 1. React Compiler (리액트 컴파일러)

React 19의 가장 주목할 만한 기능으로, React 코드를 최적화된 JavaScript로 자동 변환합니다.

**주요 특징:**

- **자동 최적화**: 더 이상 수동으로 `useMemo`, `useCallback`, `memo`를 사용할 필요가 없습니다
- **성능 향상**: 컴포넌트 렌더링을 자동으로 최적화하여 불필요한 재렌더링 방지
- **코드 간소화**: 메모이제이션 관련 코드를 제거하여 더 깔끔한 코드 작성 가능

**기존 방식 vs React 19:**

```jsx
// React 18 - 수동 최적화 필요
function Component({ data }) {
  const expensiveCalculation = useMemo(() => {
    return data.map(item => item * 2);
  }, [data]);

  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <div>{expensiveCalculation}</div>;
}

// React 19 - 컴파일러가 자동 최적화
function Component({ data }) {
  const expensiveCalculation = data.map(item => item * 2);

  const handleClick = () => {
    console.log('clicked');
  };

  return <div>{expensiveCalculation}</div>;
}

```

---

### 2. Actions (액션)

데이터 변경과 상태 업데이트를 자동으로 처리하는 새로운 패턴입니다.

**주요 기능:**

- 비동기 함수를 transition 내에서 사용 가능
- pending 상태, 에러, 낙관적 업데이트를 자동 처리
- 순차적 요청 자동 관리

**useTransition과 함께 사용:**

```jsx
function UpdateName() {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async () => {
    startTransition(async () => {
      const error = await updateName(name);
      if (error) {
        setError(error);
        return;
      }
      redirect("/path");
    });
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSubmit} disabled={isPending}>
        Update
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}

```

**새로운 Action 관련 Hook:**

### useActionState

폼 제출 시 비동기 로직의 pending/error 상태를 자동 추적합니다.

```jsx
function FormComponent() {
  const [state, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const error = await updateData(formData);
      if (error) {
        return { error };
      }
      return { success: true };
    },
    { error: null }
  );

  return (
    <form action={submitAction}>
      <input name="username" />
      <button type="submit" disabled={isPending}>
        {isPending ? '전송 중...' : '제출'}
      </button>
      {state.error && <p>{state.error}</p>}
    </form>
  );
}

```

### useFormStatus

폼의 상태 정보를 제공합니다 (폼 컴포넌트 내부에서 사용).

```jsx
function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? '제출 중...' : '제출'}
    </button>
  );
}

```

### useOptimistic

낙관적 UI 업데이트를 쉽게 구현할 수 있습니다.

```jsx
function CommentSection({ comments }) {
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state, newComment) => [...state, { ...newComment, pending: true }]
  );

  async function submitComment(formData) {
    const newComment = { text: formData.get('comment'), id: Date.now() };
    addOptimisticComment(newComment);
    await sendCommentToServer(newComment);
  }

  return (
    <div>
      {optimisticComments.map(comment => (
        <div key={comment.id} style={{ opacity: comment.pending ? 0.5 : 1 }}>
          {comment.text}
        </div>
      ))}
      <form action={submitComment}>
        <input name="comment" />
        <button type="submit">댓글 작성</button>
      </form>
    </div>
  );
}

```

---

### 3. use() API

컴포넌트 렌더링 중에 리소스(Promise, Context)를 읽을 수 있는 새로운 API입니다.

**주요 특징:**

- Promise와 Context를 동일한 API로 처리
- 조건부로 호출 가능 (Hook과 달리)
- Suspense와 자연스럽게 통합

**Promise 읽기:**

```jsx
import { use, Suspense } from 'react';

function Comments({ commentsPromise }) {
  // Promise가 resolve될 때까지 Suspend
  const comments = use(commentsPromise);

  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>{comment.text}</div>
      ))}
    </div>
  );
}

function App() {
  const commentsPromise = fetchComments();

  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  );
}

```

**조건부 Context 읽기:**

```jsx
function MyComponent({ shouldUseTheme }) {
  // 조건부로 Context 읽기 - Hook으로는 불가능!
  if (shouldUseTheme) {
    const theme = use(ThemeContext);
    return <div style={{ color: theme.color }}>Themed Content</div>;
  }

  return <div>Default Content</div>;
}

```

---

### 4. React Server Components (RSC)

서버에서 실행되는 컴포넌트로, React 19에서 안정화되었습니다.

**주요 이점:**

- **초기 페이지 로드 시간 단축**: 클라이언트로 전송되는 JavaScript 양 감소
- **서버 리소스 직접 접근**: API 없이 데이터베이스나 파일 시스템에 직접 접근
- **코드 이식성 향상**: 서버와 클라이언트에서 모두 실행 가능한 컴포넌트 작성

**예시:**

```jsx
// app/page.js (서버 컴포넌트 - 기본값)
async function BlogPost({ id }) {
  // 서버에서 직접 데이터베이스 쿼리
  const post = await db.query('SELECT * FROM posts WHERE id = ?', [id]);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}

```

---

### 5. Document Metadata (문서 메타데이터)

컴포넌트 내에서 직접 `<title>`, `<meta>`, `<link>` 태그를 렌더링할 수 있습니다.

**주요 특징:**

- 자동으로 `<head>`로 호이스팅
- SSR, 클라이언트 전용 앱, Server Components와 모두 호환
- SEO 관리 간소화

**사용 예시:**

```jsx
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title} - My Blog</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />
      <meta property="og:image" content={post.imageUrl} />

      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}

```

---

### 6. ref를 prop으로 전달

더 이상 `forwardRef`가 필요하지 않습니다!

**React 18 vs React 19:**

```jsx
// React 18 - forwardRef 필요
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

// React 19 - 일반 prop으로 전달
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

// 사용
function Parent() {
  const inputRef = useRef(null);
  return <Input ref={inputRef} />;
}

```

---

### 7. ref Cleanup 함수

ref 콜백에서 cleanup 함수를 반환할 수 있습니다.

**기능:**

- 컴포넌트 언마운트 시 자동으로 cleanup 실행
- 메모리 누수 방지
- 리소스 관리 개선

**예시:**

```jsx
function VideoPlayer() {
  return (
    <video
      ref={(node) => {
        if (node) {
          // 설정
          const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
              node.play();
            } else {
              node.pause();
            }
          });
          observer.observe(node);

          // Cleanup 함수 반환
          return () => {
            observer.disconnect();
          };
        }
      }}
    />
  );
}

```

---

### 8. Directives (지시어)

컴포넌트와 함수가 어디서 실행될지 명시합니다.

### 'use client'

클라이언트에서만 실행되는 코드를 표시합니다.

```jsx
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}

```

### 'use server'

서버 측 함수(Server Actions)를 표시합니다.

```jsx
'use server';

export async function createPost(formData) {
  const title = formData.get('title');
  const content = formData.get('content');

  await db.posts.create({
    title,
    content,
    createdAt: new Date()
  });

  revalidatePath('/posts');
}

```

---

### 9. 향상된 Hydration 오류 메시지

서버와 클라이언트 간의 불일치를 더 명확하게 표시합니다.

**개선 사항:**

- 단일 명확한 오류 메시지
- 차이점을 명확하게 강조
- 디버깅 경험 향상

---

### 10. 리소스 프리로딩

폰트, 스크립트, 스타일시트를 백그라운드에서 미리 로드할 수 있습니다.

**사용 예시:**

```jsx
import { preload, preinit } from 'react-dom';

function MyComponent() {
  // 폰트 프리로드
  preload('/fonts/my-font.woff2', { as: 'font', type: 'font/woff2' });

  // 스크립트 프리로드 및 초기화
  preinit('/scripts/analytics.js', { as: 'script' });

  return <div>My Component</div>;
}

```

**이점:**

- 페이지 로드 속도 향상
- 더 부드러운 사용자 경험
- 빠른 인지 로드 시간

---

### 11. Web Components 지원 개선

React 19는 Web Components와의 통합을 대폭 개선했습니다.

**개선 사항:**

- Web Components를 React 컴포넌트처럼 직접 사용 가능
- 변환이나 래퍼 없이 사용 가능
- 캐러셀, 차트 등 기존 Web Components 라이브러리 활용 가능

```jsx
// Web Component를 React에서 바로 사용
function MyApp() {
  return (
    <div>
      <custom-carousel>
        <div>Slide 1</div>
        <div>Slide 2</div>
      </custom-carousel>
    </div>
  );
}

```

---

## 제거된 기능 및 Breaking Changes

### 1. 더 이상 필요하지 않은 것들

- **forwardRef**: 이제 ref를 일반 prop으로 전달
- **useMemo, useCallback, memo**: 컴파일러가 자동 최적화
- **React.lazy**: 이제 `use()`로 통합

### 2. 더 이상 사용되지 않는 것들

- 일부 레거시 라이프사이클 메서드 (componentWillMount 등)
- String refs (문자열 ref)

---

## TypeScript 지원 개선

React 19는 TypeScript 지원을 대폭 강화했습니다:

- 새로운 Hook과 API에 대한 더 나은 타입 추론
- 개선된 타입 정의
- 더 강력한 타입 안정성
- 개발 초기에 오류 포착 가능

---

## 마이그레이션 가이드

### 설치

```bash
npm install react@19 react-dom@19

```

### 주요 마이그레이션 단계

1. **TypeScript 버전 확인**: TypeScript 5.0 이상 권장
2. **forwardRef 제거**: 일반 prop으로 변경
3. **불필요한 메모이제이션 제거**: 컴파일러가 처리
4. **레거시 라이프사이클 업데이트**: 최신 패턴으로 변경

---

## React 19를 사용할 수 있는 프레임워크

다음 프레임워크들이 React 19를 지원합니다:

- **Next.js 15**: App Router와 Server Components 완전 지원
- **Remix**: 향상된 Server Components 지원
- **Astro**: React 19 통합
- **Vite**: React 19 플러그인 지원
- **Waku**: React 19 네이티브 지원

---

## 결론

React 19는 React 생태계의 큰 도약입니다. 주요 개선 사항은 다음과 같습니다:

✅ **자동 최적화**: 컴파일러가 성능 최적화를 자동 처리
✅ **간소화된 API**: 더 직관적이고 사용하기 쉬운 API
✅ **향상된 성능**: Server Components와 개선된 렌더링
✅ **더 나은 개발자 경험**: 명확한 에러 메시지와 개선된 도구
✅ **현대적 패턴**: Actions, use() API 등 새로운 패턴

React 19는 더 적은 코드로 더 빠르고 안정적인 애플리케이션을 구축할 수 있게 해주는 버전입니다.

---

## 참고 자료

- [공식 React 19 발표 블로그](https://react.dev/blog/2024/12/05/react-19)
- [React 19 업그레이드 가이드](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [React 공식 문서](https://react.dev/)
