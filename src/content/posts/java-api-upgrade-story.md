---
title: "Java 애노테이션 하나를 제거해서 API를 50배 빠르게 만든 이야기"
description: "Spring Boot 애노테이션 하나로 API 50배 빠르게"
date: 2026-03-17T02:27:13.325Z
tags: ["Java","Performance"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/java-api-upgrade-story-1773711458113.webp"
---

**부제:** 작은 Spring Boot 애노테이션 하나가 모든 것을 느리게 만들고 있었습니다 — 이것을 발견하고 백엔드를 번개처럼 빠르게 만든 완전한 이야기입니다.

**저자:** Shanvika Devi

**발행처:** Stackademic

**읽기 시간:** 4분

**발행일:** 3일 전

---

자바 백엔드를 보면서 이런 생각을 해본 적이 있나요: "*왜 이렇게 느릴까? 겉으로 보기에는 모든 것이 괜찮아 보이는데, 성능은 Windows XP를 돌리는 내 낡은 노트북보다도 못하네.*"

몇 달 전의 저였습니다. API 응답 시간은 끔찍했고, 메모리 사용량은 예측 불가능했으며, 서버는 때때로 교통체증에 갇힌 것처럼 동작했습니다.

그리고 가장 웃긴 부분은? 근본 원인은 **단 하나의 작은 애노테이션**이었습니다. 네, 라이브러리도 알고리즘도 복잡한 리팩토링도 아닌 — 모든 Spring Boot 개발자가 별 생각 없이 사용했을 법한 간단한 애노테이션이었습니다.

이것을 교체했을 때, 백엔드는 **50배 빨라졌습니다**.

경험담을 들려드리겠습니다.

## 느린 백엔드의 미스터리

"매일 수백만 건의 요청을 처리하는 Spring Boot 애플리케이션이 있었습니다. 모든 것이 깔끔하게 작성되어 있었습니다: 컨트롤러, 서비스, 리포지토리. 특별히 복잡한 것도 없었죠."

하지만 가장 큰 문제는: **API 지연 시간**이었습니다.

- 일부 엔드포인트는 응답하는데 2-3초가 걸렸습니다.
- 간단한 `GET` 호출조차 어려움을 겪고 있었습니다.
- CPU 사용량이 하늘을 찔렀습니다.

더 많은 서버를 투입하고, 수평적으로 확장하고, 캐싱 레이어까지 추가했습니다. 아무것도 도움이 되지 않았습니다.

그래서 애플리케이션을 프로파일링하기로 결정했습니다.

## 1단계: 코드 프로파일링

**VisualVM**을 실행하고 파헤치기 시작했습니다. CPU 프로파일링 결과 **리플렉션과 프록시 생성에 많은 시간이 소요되고 있음**이 드러났습니다.

이상했습니다. 왜 우리 코드가 프록시 생성에 그렇게 많은 에너지를 소비하고 있을까요?

더 깊이 파고든 후, 범인을 찾았습니다:

```java
@Transactional
public User getUserById(Long id) {
    return userRepository.findById(id).orElseThrow();
}

```

네, 무해해 보이는 **`@Transactional`** 애노테이션이었습니다.

## 2단계: 트랜잭션의 함정

`@Transactional`은 Spring에서 가장 흔한 애노테이션 중 하나입니다. 우리는 어디서나 사용합니다. 삶을 단순하게 만들어주죠:

- 수동으로 트랜잭션을 시작하거나 커밋할 필요가 없습니다.
- Spring이 롤백을 관리해줍니다.
- 개발자들을 많은 보일러플레이트 코드에서 구해줍니다.

하지만 함정이 있습니다: `@Transactional`은 메서드 주위에 **동적 프록시**를 생성하여 작동합니다.

이 프록시는 모든 호출 전후에 트랜잭션 경계를 확인합니다. 잘못 사용하거나 잘못된 곳에 배치하면 숨겨진 성능 킬러가 됩니다.

그리고 그것이 바로 우리의 경우에 일어난 일이었습니다.

## 3단계: 잘못된 사용법

우리는 단순한 읽기 전용 쿼리에도 **서비스 계층 전체에 `@Transactional`을 뿌려놓았습니다**.

예를 들어:

```java
@Transactional
public List<Order> getRecentOrders() {
    return orderRepository.findRecent();
}

```

**단순히 데이터를 가져오는** 메서드에 대해 트랜잭션으로 감싸는 것은 불필요했습니다.

더 나쁜 것은 — 기본적으로 `@Transactional`은 **읽기-쓰기**이므로, SELECT 쿼리에 대해서도 불필요하게 리소스를 잠그고 데이터베이스가 트랜잭션을 처리하도록 강제했습니다.

우리 데이터베이스와 CPU가 도움을 요청하며 울고 있었던 것도 당연했습니다.

## 4단계: 해결책

모든 일반적인 `@Transactional` 애노테이션을 더 정확한 것으로 교체했습니다:

```java
@Transactional(readOnly = true)
public List<Order> getRecentOrders() {
    return orderRepository.findRecent();
}

```

그리고 트랜잭션이 전혀 필요 없는 단순한 리포지토리 호출의 경우, **애노테이션을 완전히 제거**했습니다.

쓰기 작업의 경우는 평소와 같이 `@Transactional`을 유지했습니다.

## 5단계: 충격적인 결과

이 변경을 적용한 후 재배포했습니다.

숫자들이 제 마음을 놀라게 했습니다:

- API 지연 시간이 **2.5초 → 50ms**로 떨어졌습니다.
- CPU 로드가 70% 이상 감소했습니다.
- 데이터베이스 경합 문제가 거의 사라졌습니다.
- 메모리 사용량이 안정화되었습니다.

전반적으로 백엔드는 이제 **50배 빨라졌습니다**.

그리고 이 모든 것이 **하나의 애노테이션을 교체/최적화**한 결과였습니다.

## 왜 이것이 작동하는가

`readOnly = true`로 설정하면 Spring은:

- Hibernate에서 불필요한 플러시 작업을 건너뜁니다.
- SELECT 쿼리에 대한 트랜잭션 처리를 최적화합니다.
- 프록시 오버헤드와 불필요한 잠금을 줄입니다.

이것 없이는 데이터베이스가 모든 쿼리가 데이터를 수정할 수도 있다고 생각하므로, 모든 것을 조심스럽게 처리합니다. 이것은 갑자기 브레이크를 밟아야 할 *수도* 있다는 이유로 빈 고속도로에서 시속 20km로 운전하는 것과 같습니다.

## 모든 Java 개발자를 위한 교훈

제가 배운 것(그리고 여러분이 기억해야 할 것):

- 단지 깔끔해 보인다고 해서 `@Transactional`을 어디에나 뿌리지 마세요.
- 쿼리에는 `@Transactional(readOnly = true)`를 사용하세요.
- 메서드가 트랜잭션이 전혀 필요하지 않다면 `@Transactional`을 제거하세요.
- 정기적으로 앱을 프로파일링하세요 — 작은 실수가 큰 성능 비용을 만듭니다.

## 마무리 말

때때로 Java 백엔드의 가장 큰 병목현상은 알고리즘이나 아키텍처에 있지 않습니다. 우리가 당연하게 여기는 **작은 기본값들**에 있습니다.

코드베이스를 다시 쓰지도 않았고, 프레임워크를 바꾸지도 않았으며, 더 많은 서버를 사지도 않았습니다.

그저 **하나의 애노테이션을 교체**했을 뿐입니다.

그리고 그것이 **50배 빠른** 백엔드를 만들어주었습니다.

다음에 API가 느리다고 느끼면, 데이터베이스나 하드웨어만 탓하지 마세요. 어쩌면 단지 하나의 애노테이션이 여러분을 비웃고 있을지도 모릅니다.

**태그:** #Java #SpringBoot #BackendDevelopment #CodeOptimization #PerformanceTuning #Microservices #DevelopersLife #ProgrammingTips #APIs #CodingJourney

---

## 창립자의 메시지

**안녕하세요, [Sunil](https://linkedin.com/in/sunilsandhu)입니다.** 끝까지 읽어주시고 이 커뮤니티의 일원이 되어주셔서 감사합니다.

우리 팀이 매월 350만 독자를 위해 이러한 발행물을 자원봉사로 운영하고 있다는 것을 아시나요? **우리는 어떤 자금 지원도 받지 않으며, 커뮤니티를 지원하기 위해 이 일을 하고 있습니다. ❤️**

사랑을 보여주고 싶으시다면, 잠시 시간을 내어 [LinkedIn](https://linkedin.com/in/sunilsandhu), [TikTok](https://tiktok.com/@messyfounder), [Instagram](https://instagram.com/sunilsandhu)에서 저를 **팔로우**해주세요. [주간 뉴스레터](https://newsletter.plainenglish.io/)도 구독하실 수 있습니다.

그리고 떠나기 전에 **박수**와 **팔로우**를 잊지 마세요!

---

**출처:**

- 원문: [I Removed a Single Annotation in Java and My API Became 50x Faster](https://blog.stackademic.com/i-removed-a-single-annotation-in-java-and-my-api-became-50x-faster-4937a74f1657)
- 저자: Shanvika Devi
- 발행처: Stackademic
- Senior Full Stack Developer and Team Lead with experience in front-end, back-end, and mobile App development.
