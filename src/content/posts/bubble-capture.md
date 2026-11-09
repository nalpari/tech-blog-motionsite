---
title: "JavaScript 이벤트 버블링과 캡처링: 실무 활용 가이드"
description: "DOM 이벤트 전파 메커니즘과 위임 패턴 실무 활용"
date: 2026-03-17T02:27:13.325Z
tags: ["TypeScript & Javascript"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/bubble-capture-1773712283242.png"
---

![Gemini Generated Image izet2fizet2fizet](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1773712307462-i7qpmm.png)


## 들어가며

프론트엔드 개발을 하다 보면 예상치 못한 이벤트 동작을 경험하게 됩니다. 버튼 하나를 클릭했을 뿐인데 부모 요소의 클릭 이벤트까지 함께 실행되거나, 특정 영역에만 적용하려던 이벤트가 다른 곳까지 영향을 미치는 경우가 있습니다.

이러한 동작은 버그가 아니라 **이벤트 전파(Event Propagation)**라는 명확한 메커니즘에 의해 설계된 것입니다. 이벤트는 DOM 트리를 따라 흐르며 전파되는 구조를 가지고 있으며, 이 흐름을 이해하면 더 효율적이고 안정적인 DOM 설계가 가능합니다.

## 이벤트 전파의 세 단계

이벤트는 단순히 발생한 요소에서만 처리되는 것이 아니라, DOM 트리를 따라 다음 세 단계를 거쳐 전파됩니다:

### 1. 캡처링 단계 (Capturing Phase)

- 이벤트가 최상위 요소(`document`)에서 시작하여 실제 타깃 요소까지 하위로 내려갑니다
- 위에서 아래로 전파되는 단계입니다

### 2. 타깃 단계 (Target Phase)

- 이벤트가 실제 발생한 요소에 도달하여 핸들러가 실행되는 시점입니다
- 이벤트의 목적지에 해당합니다

### 3. 버블링 단계 (Bubbling Phase)

- 이벤트가 타깃 요소에서 다시 상위 요소로 역방향으로 올라가며 전파됩니다
- 아래에서 위로 전파되는 단계입니다

```
Document (최상위)
    ↓ 캡처링
  body
    ↓
  div
    ↓
  button (타깃)
    ↑ 버블링
  div
    ↑
  body
    ↑
Document

```

## 버블링과 캡처링의 차이

### 버블링 (Bubbling)

대부분의 이벤트는 버블링 방식으로 처리됩니다. `addEventListener`를 기본 옵션으로 사용하면 버블링 단계에서 이벤트를 처리합니다.

```jsx
// 버블링 단계에서 이벤트 처리 (기본값)
element.addEventListener('click', handler);
// 또는
element.addEventListener('click', handler, false);

```

### 캡처링 (Capturing)

캡처링 단계에서 이벤트를 처리하려면 세 번째 인자로 `true` 또는 `{ capture: true }`를 전달해야 합니다.

```jsx
// 캡처링 단계에서 이벤트 처리
element.addEventListener('click', handler, true);
// 또는
element.addEventListener('click', handler, { capture: true });

```

## 실무 활용 사례

### 1. 이벤트 위임 (Event Delegation)

이벤트 위임은 버블링의 특성을 활용한 대표적인 패턴입니다. 각 자식 요소에 개별적으로 이벤트를 등록하는 대신, 부모 요소 하나에만 이벤트를 등록하여 모든 자식의 이벤트를 처리할 수 있습니다.

```jsx
// ❌ 비효율적인 방식
document.querySelectorAll('li').forEach(li => {
  li.addEventListener('click', handleClick);
});

// ✅ 효율적인 방식 (이벤트 위임)
document.querySelector('ul').addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    handleClick(e);
  }
});

```

**장점:**

- 수십, 수백 개의 자식 요소가 있어도 하나의 리스너로 모두 처리 가능
- 동적으로 추가되는 요소도 자동으로 이벤트 처리
- 메모리 사용량 감소 및 성능 향상
- 코드 유지보수성 향상

### 2. 고빈도 이벤트 최적화

`scroll`, `mousemove`, `resize`처럼 빈번하게 발생하는 이벤트는 성능 저하의 원인이 될 수 있습니다. 이런 경우 이벤트 위임과 함께 디바운싱/스로틀링 기법을 활용해야 합니다.

```jsx
// 디바운싱 예제
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 스크롤 이벤트에 디바운싱 적용
window.addEventListener('scroll', debounce(() => {
  console.log('스크롤 처리');
}, 200));

```

### 3. 이벤트 전파 제어

### stopPropagation()

이벤트가 상위 또는 하위 요소로 전파되는 것을 중단합니다.

```jsx
button.addEventListener('click', (e) => {
  e.stopPropagation();
  // 이 버튼의 클릭 이벤트가 부모로 전파되지 않음
});

```

### preventDefault()

브라우저의 기본 동작을 취소합니다.

```jsx
form.addEventListener('submit', (e) => {
  e.preventDefault();
  // 폼 제출 시 페이지 새로고침 방지
});

```

## target vs currentTarget

이벤트 객체의 두 속성을 정확히 구분하는 것이 중요합니다:

- **`event.target`**: 실제 이벤트가 발생한 요소 (클릭한 요소)
- **`event.currentTarget`**: 이벤트 핸들러가 등록된 요소

```jsx
ul.addEventListener('click', (e) => {
  console.log('target:', e.target);           // 클릭한 li
  console.log('currentTarget:', e.currentTarget); // ul

  // 이벤트 위임 시 target으로 조건 분기
  if (e.target.matches('.delete-button')) {
    // 삭제 버튼 처리
  } else if (e.target.matches('.edit-button')) {
    // 수정 버튼 처리
  }
});

```

## 실전 팁

### 1. 프레임워크와의 관계

React, Vue, Next.js 같은 프레임워크를 사용할 때도 기본은 브라우저의 이벤트 전파 메커니즘을 따릅니다. 프레임워크의 이벤트 시스템을 이해하려면 먼저 순수 JavaScript의 이벤트 전파를 이해해야 합니다.

### 2. 디버깅 팁

이벤트 전파 흐름을 확인하려면:

```jsx
element.addEventListener('click', (e) => {
  console.log('Event phase:', e.eventPhase);
  // 1: 캡처링, 2: 타깃, 3: 버블링
  console.log('Target:', e.target);
  console.log('CurrentTarget:', e.currentTarget);
}, true); // 캡처링 단계에서도 확인

```

### 3. 이벤트 위임 시 주의사항

- DOM 계층 구조를 고려한 조건 분기 필요
- `closest()` 메서드를 활용하여 부모 요소까지 탐색
- 이벤트 타입에 따라 버블링이 되지 않는 경우도 있음 (`focus`, `blur` 등)

```jsx
ul.addEventListener('click', (e) => {
  const button = e.target.closest('.action-button');
  if (button) {
    // 버튼 또는 버튼 내부 요소를 클릭한 경우
    handleButtonClick(button);
  }
});

```

## 마치며

이벤트 전파 메커니즘을 이해하면:

- 효율적인 이벤트 위임 구조 설계
- 성능 최적화 (메모리, CPU 사용량 감소)
- 동적 UI 처리 개선
- 예측 가능한 이벤트 흐름 제어

가 가능합니다.

단순히 이벤트를 등록하는 것을 넘어, **언제, 어디서, 어떻게** 이벤트가 실행되는지를 예측하고 설계할 수 있는 개발자로 성장해보시기 바랍니다. 이벤트 흐름의 이해는 곧 DOM 흐름의 이해이며, 프론트엔드 개발 역량의 핵심 기반이 됩니다.

---

**참고 자료:**

- [MDN - Event Bubbling and Capturing](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture)
- [JavaScript.info - Bubbling and Capturing](https://javascript.info/bubbling-and-capturing)

**원문:** [요즘IT - 이벤트 버블링 vs 캡처링](https://yozm.wishket.com/magazine/detail/3458/)
