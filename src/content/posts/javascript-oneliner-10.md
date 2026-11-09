---
title: "내 코드를 우아하게 만든 JavaScript 원라이너 10가지"
description: "JS 원라이너 10가지로 코드 간결하게 만들기"
date: 2026-03-17T02:27:13.325Z
tags: ["TypeScript & Javascript"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/javascript-oneliner-10-1773700958483.png"
---

## 매일 사용하는 JS를 쉽게 만들어주는 10가지 복사-붙여넣기 패턴

*고유 배열, 안전한 기본값, fetch JSON, 객체 압축, groupBy, indexBy, 범위, clamp, 다중 정렬, 클립보드로 JavaScript를 업그레이드하세요.*

---

코드베이스에 작은 헬퍼 함수들이 여기저기 뿌려져 있다면, 당신은 혼자가 아닙니다. 저는 한 줄로 할 수 있는 일을 다섯 줄로 작성하곤 했었는데, 이제는 안전하고, 읽기 쉽고, 빠르게 처리할 수 있습니다. 이제 제가 자주 사용하는 10가지 원라이너를 소개합니다. 이들은 똑똑해 보이려고 하지 않습니다; 명확하려고 합니다. 그리고 일단 이것들이 근육 기억으로 자리잡으면, 다른 모든 것들이 시끄럽게 보이기 시작할 것입니다.

---

## 1) 반복문 없이 고유 항목 만들기

```jsx
const unique = arr => [...new Set(arr)];
// ['a','b','a','c'] -> ['a','b','c']

```

**왜 우아한가:** 의도가 명확하고 `Set`이 선형 시간에 중복을 제거합니다.

**실제 사용:** 태그, 사용자 ID, 또는 기능 플래그를 API로 전달하기 전에 중복 제거할 때.

---

## 2) 기본값을 가진 안전한 접근

```jsx
const email = user?.profile?.email ?? '—';

```

**왜 우아한가:** `?.`는 크래시를 방지하고, `??`는 좌측이 `null`/`undefined`일 때만 대체값을 사용합니다(`''`이나 `0`은 아님).

**실제 경험:** 이 한 줄이 보고서 페이지에서 반복적으로 발생하는 "undefined의 속성을 읽을 수 없습니다" 버그를 완전히 해결했습니다. 몇 분 만에 수정을 배포했습니다.

---

## 3) 한 번에 JSON 가져오기

```jsx
const json = await (await fetch(url)).json();

```

**왜 우아한가:** 최소한의 의식. 작은 유틸리티와 스크립트에 훌륭합니다.

**프로 팁:** 필요할 때 작은 가드 추가:

```jsx
const data = await (await fetch(url)).ok ? (await (await fetch(url)).json()) : null;

```

(프로덕션에서는 한 번 래핑해서 재사용하세요 — 호출 지점에서는 여전히 원라이너입니다.)

---

## 4) 객체에서 null/undefined 필드 제거

```jsx
const compact = obj => Object.fromEntries(Object.entries(obj).filter(
    ([, v]) => v != null));
// {a:1,b:null,c:0} -> {a:1,c:0}

```

**왜 우아한가:** 깨끗한 페이로드를 직렬화하면 백엔드 불만과 예상치 못한 기본값을 피할 수 있습니다.

**사례:** 요청 본문을 전송하기 전에 압축하여 시끄러운 감사 로그를 ~30% 줄였습니다.

---

## 5) 키로 배열 항목 그룹화

```jsx
const groupBy = (arr, key) => arr.reduce(
    (g, x) => ((g[x[key]] ??= []).push(x), g), {});
// groupBy(rows, 'status') -> {open:[...], closed:[...]}

```

**왜 우아한가:** 작고, 표현적이며, 놀랍도록 빠릅니다.

**사용법:** 분석 이벤트 버킷화, 매장별 주문 클러스터링, 또는 중첩 메뉴 구축.

---

## 6) id로 배열 인덱싱 (O(1) 조회를 위한 맵)

```jsx
const indexBy = (arr, key='id') => Object.fromEntries(arr.map(
    x => [x[key], x]));
// indexBy(users) -> {'u1':{...}, 'u2':{...}}

```

**왜 우아한가:** N번의 조회를 1번으로 바꿉니다.

**실제 사용:** 세부 패널에 빠른 접근이 필요한 리스트 렌더링 — 타이트한 루프에서 더 이상 `.find`를 사용하지 않습니다.

---

## 7) 범위 만들기 (그리고 즉시 사용)

```jsx
const range = (n, start = 0) => Array.from({ length: n }, (_, i) => i + start);
// range(5) -> [0,1,2,3,4]; range(4, 1) -> [1,2,3,4]

```

**왜 우아한가:** 페이지네이션, 스켈레톤 플레이스홀더, 또는 모의 데이터에 훌륭합니다.

**패턴:** `range(7, 1).map(day => ... )`는 영어처럼 읽힙니다.

---

## 8) 숫자를 안전한 범위로 제한

```jsx
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

```

**왜 우아한가:** 분기 없이 슬라이더, 줌 레벨, 불투명도, 점수를 보호합니다.

**보너스:** 입력 새니타이저와 URL 매개변수와 잘 어울립니다.

---

## 9) 추가 유틸리티 없는 다중 키 정렬

```jsx
// 가격 오름차순, 그 다음 이름 A→Z
items.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));

```

**왜 우아한가:** "X로 정렬하고, 그렇지 않으면 Y로"처럼 읽힙니다.

**트릭:** 내림차순의 경우, 부호를 뒤집으세요: `b.price - a.price`.

---

## 10) 클립보드에 복사 (임시 요소 없음)

```jsx
await navigator.clipboard.writeText(text);

```

**왜 우아한가:** 안전하고, 프로미스 기반이며, 최신 브라우저에서 작동합니다.

**UX 승리:** 토스트와 결합하세요: `copy(); show('복사됨!')`. 작은 기쁨, 큰 느낌.

---

## 작은 전후 비교가 저를 설득했습니다

**이전 (몇 년 전 제가 작성한 실제 코드):**

```jsx
// 인덱스 구축, 필드 보호, 페이로드 압축, 요청 전송 (축약)
const byId = {};
users.forEach(u => { if (u && u.id) byId[u.id] = u; });

const payload = {};
Object.keys(body).forEach(k => {
    if (body[k] !== undefined && body[k] !== null) payload[k] = body[k];
});

const res = await fetch(url);
const data = await res.json();

```

**이후 (오늘):**

```jsx
const byId = indexBy(users);
const bodyOk = compact(body);
const data = await (await fetch(url)).json();

```

세 줄. 더 차분한 머리. 더 적은 버그. 같은 결과.

---

## 제가 따르려고 하는 가독성 규칙

- **구현이 아닌 의도를 명명하세요.** `compact`, `indexBy`, `groupBy`는 미래의 당신에게 무슨 일이 일어나고 있는지 알려줍니다.
- **깔끔하게 읽힐 때는 변경 가능한 단계보다 표현식을 선호하세요.** 한 줄, 한 아이디어.
- **"코드 골프"를 피하세요.** 원라이너가 수수께끼가 되면, 나누세요. 우아함 = 명료함.
- **핫 패스에서 측정하세요.** `groupBy`와 `indexBy`는 렌더와 리듀서 내부에서 실제 시간을 절약할 수 있습니다.
- **설명할 수 있는 언어 기능을 사용하세요.** 옵셔널 체이닝과 널 병합은 2025년에는 기본 소양입니다; 적극 활용하세요.

---

## 빠른 참조 (유틸 파일에 복사용)

```jsx
export const unique = arr => [...new Set(arr)];
export const compact = obj => Object.fromEntries(Object.entries(obj).filter(
    ([,v]) => v != null));
export const groupBy = (arr, key) => arr.reduce(
    (g,x)=> ( (g[x[key]] ??= []).push(x), g), {});
export const indexBy = (arr, key='id') => Object.fromEntries(arr.map(
    x => [x[key], x]));
export const range = (n, s=0) => Array.from({length:n}, (_,i) => i + s);
export const clamp = (n,min,max) => Math.min(max, Math.max(min, n));
export const json = async url => (await (await fetch(url)).json());

```

이것들을 넣고, 한 번 타이핑하고, 하루를 계속하세요.

---

## 결론

원라이너는 똑똑해 보이기 위한 것이 아닙니다; **인지적 부하를 줄이기** 위한 것입니다. 의도를 보이게 하고, 보일러플레이트를 줄이며, 버그가 숨을 곳을 줄입니다. 시끄러운 유틸리티를 명확한 원라이너로 바꾸는 것부터 시작하세요 — 아마 `compact`나 `indexBy`로. 그런 다음 돌아와서 어떤 패턴이 코드를 가장 많이 줄였는지 (그리고 어떤 것에 회의적인지) 알려주세요. 댓글에서 기꺼이 다중 정렬에 대해 토론하겠습니다.

---

**출처:** [10 JavaScript One-Liners That Made My Code Elegant](https://medium.com/@bhagyarana80/10-javascript-one-liners-that-made-my-code-elegant-64bfa1639f9e)

**저자:** Bhagya Rana

**발행일:** 2025년 9월 15일

**태그:** JavaScript, Web Development, Programming, Frontend, Best Practices
