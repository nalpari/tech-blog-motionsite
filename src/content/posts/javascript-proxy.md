---
title: "JavaScript Proxy 객체의 힘: 프로처럼 연산을 가로채기"
description: "JS Proxy로 객체 연산을 가로채는 메타프로그래밍"
date: 2026-03-17T02:27:13.325Z
tags: ["Performance","TypeScript & Javascript"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/javascript-proxy-1773653727361.png"
---

## 🎯 개요

JavaScript는 유연성과 동적 특성으로 유명합니다. 하지만 때로는 단순히 데이터를 조작하는 것 이상이 필요할 때가 있습니다. 객체에서 수행되는 기본 연산들을 **실제로 일어나기 전에** 가로챌 수 있다면 어떨까요? 속성 접근, 할당, 함수 호출, 심지어 `new` 연산에도 사용자 정의 동작을 추가할 수 있다면요?

**Proxy 객체**를 만나보세요! ECMAScript 2015(ES6)에서 도입된 강력한 기능입니다. Proxy는 다른 객체(대상 객체)에 수행되는 연산을 가로채고 "트랩"할 수 있는 객체를 생성할 수 있게 해줍니다. 객체를 둘러싸는 보호하거나 향상시키는 레이어로 생각해보세요. 객체의 상호작용에 대한 완전한 제어권을 제공합니다.

---

## 🔍 Proxy란 무엇인가요?

**Proxy** 객체는 두 개의 인수로 생성됩니다:

- **`target`**: 프록시로 감쌀 객체입니다. 함수, 배열, 심지어 다른 프록시도 될 수 있습니다.
- **`handler`**: "트랩" 메서드들을 포함하는 객체입니다. 이 메서드들은 가로채고 싶은 연산에 대한 사용자 정의 동작을 정의합니다.

```jsx
const target = {}; // 원본 객체
const handler = {}; // 트랩 메서드를 가진 객체
const proxy = new Proxy(target, handler);

```

---

## 🛠️ 주요 트랩(Traps) 이해하기

### 1. **get** 트랩 - 속성 읽기 가로채기

```jsx
const person = {
  name: "Alice",
  age: 30
};

const personProxy = new Proxy(person, {
  get(target, property) {
    console.log(`속성 ${property}에 접근 중...`);
    return target[property];
  }
});

console.log(personProxy.name);
// 출력: 속성 name에 접근 중...
// 출력: Alice

```

### 2. **set** 트랩 - 속성 할당 가로채기

```jsx
const validatedUser = new Proxy({}, {
  set(target, property, value) {
    if (property === 'age' && typeof value !== 'number') {
      throw new TypeError('나이는 숫자여야 합니다!');
    }

    if (property === 'age' && value < 0) {
      throw new RangeError('나이는 음수일 수 없습니다!');
    }

    target[property] = value;
    return true; // 할당 성공을 나타냄
  }
});

validatedUser.name = "Bob"; // ✅ 성공
validatedUser.age = 25; // ✅ 성공
validatedUser.age = -5; // ❌ RangeError 발생

```

### 3. **has** 트랩 - `in` 연산자 가로채기

```jsx
const hiddenProps = new Proxy({ visible: true, _secret: 'hidden' }, {
  has(target, property) {
    if (property.startsWith('_')) {
      return false; // 비밀 속성은 숨김
    }
    return property in target;
  }
});

console.log('visible' in hiddenProps); // true
console.log('_secret' in hiddenProps); // false (실제로는 존재함)

```

---

## 🎨 실용적인 사용 사례

### 🔐 1. 데이터 보안 및 접근 제어

```jsx
const secureData = new Proxy({
  publicInfo: '모든 사용자가 접근 가능',
  confidential: '기밀 정보'
}, {
  get(target, property) {
    if (property === 'confidential') {
      throw new Error('인증되지 않은 접근입니다!');
    }
    return target[property];
  }
});

console.log(secureData.publicInfo); // ✅ 접근 허용
console.log(secureData.confidential); // ❌ Error 발생

```

### 📝 2. 기본값 제공

```jsx
const defaultValues = {
  name: "익명",
  age: 0,
  country: "미국"
};

const userWithDefaults = new Proxy({}, {
  get(target, property) {
    return property in target ? target[property] : defaultValues[property];
  }
});

userWithDefaults.name = "Charlie";
console.log(userWithDefaults.name); // Charlie
console.log(userWithDefaults.age); // 0 (기본값)
console.log(userWithDefaults.country); // 미국 (기본값)

```

### 🚀 3. 메모이제이션 (성능 최적화)

```jsx
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const memoizedFib = new Proxy({}, {
  get(target, property) {
    const n = Number(property);
    if (!(property in target)) {
      console.log(`피보나치(${n}) 계산 중...`);
      target[property] = fibonacci(n);
    } else {
      console.log(`피보나치(${n}) 캐시에서 반환`);
    }
    return target[property];
  }
});

console.log(memoizedFib[10]); // 계산됨
console.log(memoizedFib[10]); // 캐시에서 반환

```

### 🔍 4. 디버깅 및 로깅

```jsx
function createLogger(obj, name) {
  return new Proxy(obj, {
    get(target, property) {
      console.log(`🔍 [${name}] 속성 '${property}' 읽기: ${target[property]}`);
      return target[property];
    },
    set(target, property, value) {
      console.log(`✏️ [${name}] 속성 '${property}' 설정: ${value}`);
      target[property] = value;
      return true;
    }
  });
}

const loggedUser = createLogger({ name: "Dave" }, "User");
loggedUser.age = 28; // ✏️ [User] 속성 'age' 설정: 28
console.log(loggedUser.name); // 🔍 [User] 속성 'name' 읽기: Dave

```

---

## ⚡ 고급 기능

### 🔄 Revocable Proxy (철회 가능한 프록시)

때로는 프록시를 나중에 비활성화해야 할 수도 있습니다:

```jsx
const target = { message: "안녕하세요!" };
const { proxy, revoke } = Proxy.revocable(target, {
  get(target, property) {
    return `가로채짐: ${target[property]}`;
  }
});

console.log(proxy.message); // "가로채짐: 안녕하세요!"

revoke(); // 프록시 비활성화

console.log(proxy.message); // ❌ TypeError: 철회된 프록시에서 'get' 수행 불가

```

### 🪞 Reflect API와 함께 사용하기

Reflect API는 Proxy와 완벽하게 호환됩니다:

```jsx
const smartProxy = new Proxy(target, {
  get(target, property, receiver) {
    console.log(`${property} 속성에 접근`);
    return Reflect.get(target, property, receiver);
  },
  set(target, property, value, receiver) {
    console.log(`${property} 속성을 ${value}로 설정`);
    return Reflect.set(target, property, value, receiver);
  }
});

```

---

## ⚠️ 주의사항 및 제한사항

### 성능 고려사항

- Proxy는 추가적인 레이어를 도입하므로 성능에 약간의 영향을 줄 수 있습니다
- 크리티컬한 성능이 요구되는 곳에서는 신중하게 사용하세요

### 브라우저 호환성

- IE에서는 지원되지 않습니다 (폴리필 불가)
- 최신 브라우저에서는 완전히 지원됩니다

### 투명성 제한

- `===` 엄격한 등호 비교는 가로챌 수 없습니다
- 내장 객체의 내부 슬롯은 프록시할 수 없습니다

---

## 🎯 언제 Proxy를 사용해야 할까요?

✅ **다음과 같은 경우에 사용하세요:**

- 객체 상호작용에 대한 사용자 정의 제어가 필요할 때
- 로깅 및 디버깅 목적
- 유효성 검사 규칙 적용 및 불변성 강제
- 동적 데이터 구조 구축 (예: 음수 배열 인덱싱)
- 함수의 동작 확장 및 래핑

❌ **다음과 같은 경우는 피하세요:**

- 단순한 객체 조작으로 충분할 때
- 성능이 매우 중요한 애플리케이션
- 코드의 복잡성을 불필요하게 증가시키는 경우

---

## 🎉 결론

JavaScript의 Proxy 객체는 객체 동작을 커스터마이징할 수 있는 다재다능하고 강력한 도구입니다. 로깅과 유효성 검사부터 동적 속성 생성과 특수한 경우 처리까지, Proxy는 JavaScript 애플리케이션의 기능을 크게 향상시킬 수 있는 유연한 방법을 제공합니다.

다양한 트랩과 그 적용 방법을 이해함으로써, 더욱 정교하고 제어 가능한 JavaScript 애플리케이션을 구축할 수 있습니다. Proxy는 추가적인 제어 레이어를 더하지만, 과도하게 사용하면 복잡성을 증가시킬 수 있으므로 신중하게 사용해야 합니다.

---

**💡 팁:** Proxy는 메타프로그래밍의 강력한 도구입니다. 프레임워크나 라이브러리를 만들 때, 또는 객체의 동작에 대한 세밀한 제어가 필요할 때 특히 유용합니다!

---

### 📚 출처

- [원문: The Power of JavaScript Proxy Objects: Intercepting Operations Like a Pro](https://habtesoft.medium.com/the-power-of-javascript-proxy-objects-intercepting-operations-like-a-pro-1687b8b527c8)
- [MDN Web Docs - Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [JavaScript.info - Proxy and Reflect](https://javascript.info/proxy)
