---
title: "React 19.2의 핵심 신기능 — <Activity> 컴포넌트 완전 정복"
description: "상태를 잃지 않고 컴포넌트를 숨기다. React 19.2에서 정식 등장한 <Activity> 컴포넌트의 동작 원리와 실전 활용법을 깊게 파헤칩니다."
date: 2026-03-23T04:40:39.418Z
tags: ["React & Nextjs"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/1774240834050-k6vk8n.png"
---

React 19.2가 2025년 10월에 공식 릴리즈됐습니다. 2024년 12월 React 19.0, 2025년 6월 React 19.1에 이은 세 번째 릴리즈입니다. 이번 업데이트에는 여러 주목할 만한 기능이 포함됐는데, 그 중에서도 가장 화제가 된 것이 바로 `<Activity>` 컴포넌트입니다.

이 포스팅에서는 `<Activity>`가 왜 필요한지, 어떻게 동작하는지, 그리고 실제로 어떻게 활용할 수 있는지를 자세히 살펴봅니다.

---

![react activity](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1774240814783-pd08ut.png)

## 기존의 한계: 컴포넌트를 숨기면 상태가 날아간다

React에서 UI를 조건부로 보이고 숨기는 가장 흔한 방법은 다음 두 가지였습니다.

**1. 조건부 렌더링 (언마운트)**

```jsx
{tab === 'settings' && <Settings />}
```

탭을 전환하는 순간 `<Settings />`는 완전히 언마운트됩니다. 입력 중이던 폼 값, 스크롤 위치, 열려있던 아코디언 상태 — 모두 초기화됩니다. 다시 탭으로 돌아오면 처음부터 다시 시작해야 합니다.

**2. CSS로 숨기기 (`display: none`)**

```jsx
<div style={{ display: tab === 'settings' ? 'block' : 'none' }}>
  <Settings />
</div>
```

이 방법은 상태를 유지할 수 있지만, 컴포넌트는 계속 마운트된 상태이므로 `useEffect` 구독, 타이머, 이벤트 리스너 등의 **사이드 이펙트가 백그라운드에서 계속 실행**됩니다. 보이지 않는 컴포넌트가 API를 호출하거나 WebSocket을 유지하는 것은 낭비이자 버그의 씨앗입니다.

정리하면:

| 방식 | 상태 유지 | 이펙트 정리 | 문제 |
|------|-----------|-------------|------|
| 조건부 렌더링 | ❌ | ✅ | 상태가 리셋됨 |
| CSS hide | ✅ | ❌ | 불필요한 사이드 이펙트 지속 |
| **`<Activity>`** | **✅** | **✅** | **없음** |

`<Activity>`는 두 방식의 단점을 모두 해결하는 중간 지점입니다.

---

## `<Activity>` 란?

`<Activity>`는 UI의 일부를 **"백그라운드 상태"** 로 전환하는 컴포넌트입니다. `mode` prop 하나로 동작을 제어합니다.

```jsx
import { Activity } from 'react';

<Activity mode="hidden">
  <Settings />
</Activity>
```

### 두 가지 모드

- **`mode="visible"`**: 자식 컴포넌트를 정상적으로 표시하고, Effects를 마운트하며, 업데이트를 일반 우선순위로 처리합니다.
- **`mode="hidden"`**: 자식 컴포넌트를 시각적으로 숨기고, Effects를 언마운트하며, 남아있는 렌더링 작업을 가장 낮은 우선순위로 미룹니다.

중요한 포인트: **숨겨진 상태에서도 React state와 DOM state는 메모리에 그대로 보존됩니다.** 다시 `visible`로 전환되면, 이전 상태가 그대로 복원되고 Effects가 재실행됩니다.

---

## 내부 동작 원리

`<Activity mode="hidden">`으로 전환될 때 React가 하는 일:

1. **`display: none`** 을 자식 요소에 적용해 시각적으로 숨김
2. **모든 자식의 Effects를 정리(cleanup)** — 구독, 타이머, 이벤트 리스너 제거
3. **남은 렌더링 작업을 최저 우선순위로 연기** — 화면에 보이는 콘텐츠에 CPU 양보
4. **React state와 DOM state는 메모리에 유지**

다시 `visible`로 전환되면:

1. 자식 요소의 `display: none` 해제
2. 이전 상태 그대로 복원
3. Effects 재실행

운영체제의 백그라운드 태스크 처리와 비슷한 개념입니다. 메모리와 컨텍스트는 살아있지만, CPU는 포어그라운드 작업에 양보합니다.

---

## 실전 예제

### 예제 1: 탭 UI — 상태 유지

가장 기본적인 사용 사례입니다.

```jsx
import { Activity, useState } from 'react';

function TabbedUI() {
  const [tab, setTab] = useState('home');

  return (
    <>
      <nav>
        <button onClick={() => setTab('home')}>홈</button>
        <button onClick={() => setTab('settings')}>설정</button>
      </nav>

      <Activity mode={tab === 'home' ? 'visible' : 'hidden'}>
        <Home />
      </Activity>
      <Activity mode={tab === 'settings' ? 'visible' : 'hidden'}>
        <Settings />
      </Activity>
    </>
  );
}
```

`<Settings />`에서 입력 중이던 폼 값이나 스크롤 위치가, 탭을 전환했다 돌아와도 그대로 유지됩니다. 그리고 `<Settings />`가 hidden 상태일 때는 불필요한 API 폴링이나 WebSocket 연결도 자동으로 정리됩니다.

---

### 예제 2: 사이드바 프리렌더링 — 빠른 초기 로드

`<Activity mode="hidden">`을 이용해 사용자가 곧 탐색할 가능성이 높은 페이지를 **백그라운드에서 미리 렌더링**할 수 있습니다. Suspense 기반의 데이터 패칭 프레임워크를 사용 중이라면, 사용자가 클릭하기 전에 이미 데이터가 준비돼 있습니다.

```jsx
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <>
      <Activity mode={currentPage === 'dashboard' ? 'visible' : 'hidden'}>
        <Dashboard />
      </Activity>

      {/* 사용자가 곧 방문할 가능성이 높은 페이지를 백그라운드에서 미리 준비 */}
      <Activity mode={currentPage === 'reports' ? 'visible' : 'hidden'}>
        <Reports />
      </Activity>
    </>
  );
}
```

`<Reports />`는 hidden 상태에서도 데이터를 백그라운드에서 페치합니다. 사용자가 Reports 탭을 클릭하는 순간 이미 데이터가 캐시되어 있어 거의 즉각적인 전환이 가능합니다.

> ⚠️ **주의**: 백그라운드 데이터 페칭은 Suspense 기반 데이터 소스(Next.js, Relay 등)에서만 동작합니다. `useEffect` 안에서 fetch하는 방식은 hidden Activity에서 동작하지 않습니다.

---

### 예제 3: 뒤로 가기 내비게이션 — 상태 보존

SPA에서 사용자가 목록 → 상세 → 목록으로 돌아올 때, 목록의 스크롤 위치와 필터 상태를 유지하고 싶을 때 유용합니다.

```jsx
function ProductApp() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <>
      <Activity mode={view === 'list' ? 'visible' : 'hidden'}>
        <ProductList
          onSelect={(id) => {
            setSelectedId(id);
            setView('detail');
          }}
        />
      </Activity>

      <Activity mode={view === 'detail' ? 'visible' : 'hidden'}>
        {selectedId && (
          <ProductDetail
            id={selectedId}
            onBack={() => setView('list')}
          />
        )}
      </Activity>
    </>
  );
}
```

상세 페이지에서 뒤로 가기 버튼을 눌렀을 때, 목록의 스크롤 위치와 선택된 필터가 그대로 복원됩니다.

---

## 주의사항 및 한계

### 1. DOM 사이드 이펙트는 여전히 지속될 수 있다

`display: none`으로 숨겨도 DOM 자체는 살아있습니다. `<video>` 태그처럼 Effect 없이도 재생 상태를 가지는 요소는 별도로 처리가 필요합니다.

```jsx
// video를 Activity로 숨길 때는 직접 pause 처리 필요
useEffect(() => {
  if (mode === 'hidden') videoRef.current?.pause();
}, [mode]);
```

### 2. 메모리 사용량 증가

hidden 상태의 컴포넌트들은 메모리에 상태를 계속 유지합니다. 수십 개의 Activity를 동시에 hidden으로 두면 메모리 사용량이 늘어날 수 있습니다. 사용자가 다시 돌아올 가능성이 높은 일부 핵심 뷰에만 선택적으로 적용하세요.

### 3. `display: none`이 강제됨

hidden 상태에서 React는 `display: none`을 직접 설정합니다. 이 값을 CSS로 오버라이드할 수는 없습니다.

### 4. Effects는 반드시 cleanup을 구현해야 한다

`<Activity>`는 hidden 전환 시 Effects를 정리(cleanup)합니다. cleanup이 제대로 구현되지 않은 Effects가 있다면 이 시점에 문제가 드러납니다. `<StrictMode>`와 함께 사용하면 이런 문제를 미리 발견할 수 있습니다.

---

## 기존 방식과 비교 요약

```
언마운트 (조건부 렌더링)
  → 상태 소멸, Effects 정리 ✅

CSS hidden
  → 상태 유지, Effects 계속 실행 ❌

<Activity mode="hidden">
  → 상태 유지 ✅, Effects 정리 ✅, 렌더링 저우선순위 ✅
```

---

## React 19.2의 다른 주요 기능들

`<Activity>`만큼 주목받은 기능들을 간략히 소개합니다.

- **`useEffectEvent` 훅**: Effect 내에서 "이벤트 로직"을 분리하는 훅. 의존성 배열 없이 항상 최신 state/props를 참조할 수 있어, stale closure 문제를 우아하게 해결합니다.
- **`cacheSignal` API**: RSC(React Server Components)에서 `cache()`의 수명이 끝났을 때 감지할 수 있는 `AbortSignal`을 제공합니다.
- **Partial Pre-rendering**: 앱의 정적 부분을 미리 렌더링해 CDN에서 제공하고, 이후 동적 콘텐츠만 스트리밍하는 새로운 렌더링 모델입니다.
- **Chrome DevTools Performance Tracks**: React의 스케줄러와 컴포넌트 렌더링 타임라인을 Chrome 성능 탭에서 직접 확인할 수 있습니다.

---

## 마치며

`<Activity>`는 단순한 편의 컴포넌트가 아닙니다. React의 렌더링 파이프라인, 스케줄링 시스템, Effects 관리를 깊이 통합한 결과물입니다. 겉으로 보기엔 `mode="visible" | "hidden"` 두 가지 값이 전부지만, 내부적으로는 매우 정교한 메커니즘이 동작합니다.

탭 UI, 멀티스텝 폼, 뒤로 가기 내비게이션, 프리렌더링 최적화 등 다양한 시나리오에서 활용할 수 있습니다. 기존에 상태 유지를 위해 억지로 CSS hack을 쓰거나, Redux/Zustand로 UI 상태를 전역으로 올렸던 경우라면 `<Activity>`로 훨씬 깔끔하게 해결할 수 있습니다.

---

**참고 자료**
- [React 19.2 공식 블로그](https://react.dev/blog/2025/10/01/react-19-2)
- [React 공식 문서 — `<Activity>`](https://react.dev/reference/react/Activity)
