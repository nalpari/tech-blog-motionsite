---
title: "⚡ 프로처럼 코딩할 수 있게 해주는 10가지 JavaScript 트릭"
description: "실무에서 바로 쓸 수 있는 JS 단축 코딩 트릭"
date: 2026-03-17T02:27:13.325Z
tags: ["TypeScript & Javascript"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/javascript-code-like-pro-1773712098791.webp"
---

JavaScript는 시작하기 쉽지만 마스터하기는 까다롭습니다. 기본을 넘어서면, 더 스마트하고 빠르며 우아한 코드를 작성하는 데 도움이 되는 수많은 단축키, 패턴, 그리고 깔끔한 트릭들이 있습니다. 💻

디버깅하든, 리팩토링하든, 아니면 코드를 더 읽기 쉽고 유지보수하기 쉽게 만들고 싶든, 이 트릭들이 여러분의 레벨을 한 단계 높여줄 거예요!

자, 이 보석 같은 트릭들을 살펴볼까요? 💎👇

---

## 1. 🧠 구조 분해 할당으로 보스처럼 코딩하기

**이렇게 쓰지 말고:**

```jsx
const user = {
  name: 'Ravi',
  age: 28,
  country: 'India'
};
const name = user.name;
const age = user.age;

```

**이렇게 쓰세요:**

```jsx
const { name, age } = user;

```

**이름도 바로 바꿀 수 있어요:**

```jsx
const { name: userName } = user;

```

깔끔하고, 강력하고, 미니멀하죠! ✨

---

## 2. 🪄 `||`와 `??`로 단축 평가하기

논리 연산자를 사용해서 기본값을 제공하세요:

```jsx
const greeting = name || 'Guest'; // name이 falsy면 대체

```

**하지만 `??` (널 병합 연산자)를 쓰면 더 좋아요:**

```jsx
const score = inputScore ?? 100; // null이나 undefined만 대체

```

이제 복잡한 if-else 체크는 안녕! 👋

---

## 3. ✨ Spread와 Rest - 엄청난 파워!

**배열 병합하기:**

```jsx
const a = [1, 2];
const b = [3, 4];
const all = [...a, ...b];

```

**객체 복제하고 수정하기:**

```jsx
const updatedUser = { ...user, age: 30 };

```

**인수 모으기:**

```jsx
function logAll(...args) {
  console.log(args);
}

```

진짜로, spread와 rest 연산자는 마법이에요! 🎩✨

---

## 4. 🔁 NodeList를 즉시 배열로 바꾸기

`document.querySelectorAll()` 같은 걸 사용하셨나요?

```jsx
const buttons = [...document.querySelectorAll('button')];

```

이제 `.map()`, `.filter()` 등을 일반 배열처럼 사용할 수 있어요! 🎯

---

## 5. 🎯 옵셔널 체이닝 - "Cannot read property..." 에러는 이제 그만!

**이렇게 쓰지 말고:**

```jsx
if (user && user.profile && user.profile.avatar) {
  console.log(user.profile.avatar);
}

```

**이렇게 쓰세요:**

```jsx
console.log(user?.profile?.avatar);

```

깔끔하고 안전해요! 🛡️

---

## 6. 🔥 한 줄 배열 매핑

객체 리스트에서 하나의 속성만 추출하고 싶으신가요?

```jsx
const names = users.map(u => u.name);

```

**보너스: map + filter를 한 번에:**

```jsx
const activeUsernames = users
  .filter(u => u.active)
  .map(u => u.username);

```

체이닝을 보스처럼! 🧩⛓️

---

## 7. 💡 `!!`로 불린으로 변환하기

```jsx
const isLoggedIn = !!token;

```

truthy/falsy 값을 실제 `true` 또는 `false`로 변환해줍니다.

조건문이나 빠른 체크에 정말 유용해요! 🔍

---

## 8. 🧹 객체를 동적으로 정리하기

객체에서 `null`이나 `undefined` 키를 제거하고 싶으신가요?

```jsx
const cleanObject = Object.fromEntries(
  Object.entries(obj).filter(([_, v]) => v != null)
);

```

한 줄. 순수 JS. API와 폼에서 엄청 유용해요! 🎨

---

## 9. ⏳ `setTimeout`을 Promise로 지연시키기

코드를 일시 중지해야 하나요?

```jsx
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

await wait(1000);
console.log('1초 후...');

```

애니메이션, 재시도, 또는 비동기 함수의 지연에 아주 좋아요! ⏰

---

## 10. 🧪 JSON을 빠르게 복제하기 (주의사항 있음)

```jsx
const clone = JSON.parse(JSON.stringify(obj));

```

⚠️ **주의:** JSON-safe 데이터에서만 작동합니다 (함수, Date, Map 등은 안 돼요)

하지만 급할 때는 빠른 트릭이죠! 🚀

---

## 🚀 마무리하며

JavaScript는 작은 보물들로 가득합니다 - 코딩하고, 리팩토링하고, 다른 사람의 코드를 리뷰하면서 배우는 그런 것들이죠. 이 트릭들은 단순히 코드를 적게 쓰는 것이 아니라, **더 스마트하고**, **더 읽기 쉽고**, **더 성능 좋은** 코드를 작성하는 것에 관한 거예요! 💪

**여러분에게 도전 과제를 드립니다:** ✨

다음 프로젝트나 코드 스니펫에서 이 중 최소 3가지를 사용해보세요!

미래의 여러분(그리고 팀원들)이 감사해할 거예요. 🙌

> 계속 만들고, 계속 배우세요. 💻🔥
> 

---

## 📌 출처

원문: [10 JavaScript Tricks That Will Make You Code Like a Pro](https://medium.com/@TheEnaModernCoder/10-javascript-tricks-that-will-make-you-code-like-a-pro-0fa67c24da45)

저자: Ena Modern Coder

발행일: 2025년 8월 8일
