---
title: 디자인 토큰 1,200개를 240개로 줄인 방법
description: 세 개의 프로덕트가 저마다 쓰던 색상과 간격 값을 하나의 시맨틱 토큰 체계로 합쳤습니다. 마이그레이션은 코드모드로 자동화했습니다.
date: 2026-10-14
category: frontend
author: 박서연
role: Design Systems
cover: /media/cover-frontend.jpg
---

우리 레포에는 회색만 47가지가 있었습니다. `#f5f5f5`, `#f6f6f6`, `#f4f4f5`처럼 눈으로는 구분되지 않는 값들이 세 개의 프로덕트에 흩어져 있었습니다.

## 문제: 원시값은 의도를 담지 못한다

`gray-100`이라는 이름은 "얼마나 밝은 회색인지"는 알려주지만 "어디에 쓰는지"는 알려주지 않습니다. 다크 모드를 붙이려는 순간 이 차이가 드러났습니다. 같은 `gray-100`이 어떤 곳에서는 배경이고 어떤 곳에서는 비활성 텍스트였습니다.

## 설계: 세 단계 토큰

토큰을 세 계층으로 나눴습니다.

- **Primitive**: 팔레트 그 자체. `ember-500`, `ink-900`
- **Semantic**: 쓰임새. `surface-raised`, `text-muted`, `border-subtle`
- **Component**: 컴포넌트 전용 예외. 꼭 필요할 때만 씁니다.

```css
:root {
  --ink-900: #0b0b0c;
  --ink-100: #f2f1ee;

  --surface-base: var(--ink-900);
  --text-primary: var(--ink-100);
  --text-muted: color-mix(in oklab, var(--ink-100) 60%, transparent);
}
```

## 마이그레이션: 사람이 아니라 코드모드가

1,200개 토큰을 손으로 옮기면 반년이 걸립니다. 대신 사용처를 AST로 분석해서 "이 값이 어떤 속성에 쓰였는지"를 기준으로 시맨틱 토큰을 추천하는 코드모드를 만들었습니다. `background`에 쓰인 `#f5f5f5`는 `surface-sunken`으로, `color`에 쓰인 같은 값은 `text-disabled`로 바꾸는 식입니다.

## 결과

토큰은 1,200개에서 240개로 줄었습니다. 다크 모드는 시맨틱 계층만 다시 매핑해서 2주 만에 출시했습니다. 무엇보다 리뷰에서 "이 회색 맞아요?"라는 질문이 사라졌습니다.
