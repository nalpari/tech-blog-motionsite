---
title: "📊 Entity에서 DTO로: 세 가지 매핑 방식의 성능 비교"
description: "Entity-DTO 매핑 세 가지 방식 성능 비교 분석"
date: 2026-03-17T02:27:13.325Z
tags: ["Java","Performance"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/entity-to-dto-1773712004071.webp"
---

## 🎯 들어가며

애플리케이션에서 데이터를 노출할 때 DTO를 사용하는 것은 많은 장점이 있어 강력히 권장됩니다. 노출되는 데이터 관리부터 성능 및 보안 문제까지, DTO는 모든 애플리케이션에 반드시 있어야 합니다.

하지만 DTO에는 중요한 단점이 하나 있습니다 ⚠️: **항상 엔티티와 DTO 간의 변환이 필요하다는 점입니다.** 이는 추가적인 복잡성을 가져옵니다.

> 💡 이 글에서는 Entity를 DTO로 변환하는 여러 방법을 살펴보고, 그 중 어떤 것이 가장 성능이 좋은지 찾아보겠습니다.
> 

---

## 🛠️ 매핑 기법

이번 글에서 비교할 매핑 옵션은 다음과 같습니다:

**1️⃣ Manual mapping (수동 매핑)**

가장 기본적인 기법으로, 개발자가 Entity의 필드를 DTO로 수동으로 매핑합니다.

**2️⃣ MapStruct**

수동 방식과 유사하지만 자동으로 이루어지며, 개발자가 필드를 수동으로 매핑할 필요가 없습니다.

**3️⃣ JPQL**

JPQL을 사용하면 쿼리에서 직접 Entity를 DTO로 변환할 수 있습니다.

각 접근 방식에는 장단점이 있으며, 어떤 것을 사용할지는 개발의 복잡성이나 아키텍처 요구사항에 따라 달라질 수 있습니다 🤔

---

## ⚖️ 비교 실험

이제 **두 가지 시나리오**를 사용하여 세 가지 접근 방식의 성능을 비교해보겠습니다:

- 간단한 시나리오
- 복잡한 시나리오

### 📚 간단한 시나리오

실험은 다른 엔티티와 관계가 없는 간단한 엔티티로 시작합니다. 데이터베이스 테이블에는 1000개의 책이 삽입되어 있습니다.

Book 엔티티는 다음과 같은 필드를 가지고 있습니다:

- id (고유 식별자)
- name (책 이름)
- author (저자)
- releaseDate (출판일)
- numberOfPages (페이지 수)
- language (언어)

BookDTO는 엔티티와 동일한 구조를 가집니다.

세 가지 매핑 방식 모두 BookDTO 리스트를 반환합니다. 각 시나리오마다 100번의 요청을 실행했고, 다음은 각각의 평균 실행 시간(ms)입니다:

**📈 성능 결과:**

- ✋ Manual 방식: **11ms**
- 🔧 MapStruct 방식: **10ms**
- 📝 JPQL 방식: **8ms**

보시다시피, 세 방식 간의 차이는 미미합니다. JPQL 버전이 약간 더 빠르지만 큰 차이는 없습니다.

### 🔗 복잡한 시나리오

이제 엔티티에 **@ManyToOne 관계**를 추가하여 조금 더 복잡하게 만들어보겠습니다. 각 Book은 이제 Publisher를 가지게 됩니다.

Publisher 엔티티 필드:

- id (고유 식별자)
- name (출판사 이름)
- since (설립일)
- address (주소)
- country (국가)

BookDTO도 이제 PublisherDTO를 포함하도록 변경되었습니다.

100번의 요청을 다시 실행한 결과:

**📈 성능 결과:**

- ✋ Manual 방식: **472ms** 😱
- 🔧 MapStruct 방식: **494ms** 😱
- 📝 JPQL 방식: **19ms** ⚡

이번에는 차이가 확연합니다! JPQL 옵션이 다른 두 옵션보다 훨씬 더 나은 성능을 보였습니다. Manual과 MapStruct는 비슷한 성능을 보였지만... 차이가 너무 크지 않나요? 🤔 좀 더 분석해봅시다!

### 🐛 N+1 문제 발견!

Manual과 MapStruct 버전 모두 JpaRepository의 `findAll()` 메서드를 사용하고 있었습니다. 또한 publisher의 fetch 타입이 `FetchType.LAZY`로 설정되어 있어서, 여기에 **N+1 문제**가 있었습니다! 😵

이는 각 fetch마다 데이터베이스에 1001번의 select가 발생한다는 의미입니다:

- 📖 1번: 모든 책을 가져오는 select
- 📚 1000번: 각 책의 출판사를 가져오는 select (책이 1000개였으므로)

### 🛠️ N+1 문제 해결

이 문제를 해결하기 위해 `@Query`와 `JOIN FETCH`를 사용한 새로운 메서드로 교체했습니다:

```java
@Query("SELECT b FROM Book b JOIN FETCH b.publisher")
List<Book> findAllWithPublisher();

```

이 변경 후의 결과를 확인해봅시다! 🎉

**📈 최종 성능 결과:**

- ✋ Manual 방식: **24ms** ✨
- 🔧 MapStruct 방식: **23ms** ✨
- 📝 JPQL 방식: **19ms** ⚡

Manual과 MapStruct 버전의 실행 시간이 엄청나게 개선되었습니다! 결과는 간단한 시나리오에서 얻은 것과 매우 유사합니다. JPQL이 다시 조금 더 빠르지만, 큰 차이는 없습니다.

---

## 💡 결론

서로 다른 복잡도를 가진 두 가지 시나리오에서 실험을 실행한 결과, Entity에서 DTO로의 세 가지 매핑 유형 간에 큰 차이가 없다는 것이 밝혀졌습니다.

하지만 두 시나리오 모두에서 **JPQL 솔루션이 가장 우수**했고, 그 다음이 MapStruct, 마지막으로 Manual 솔루션이었습니다 🏆

성능은 비슷하지만, 어떤 솔루션도 보편적으로 이상적이지는 않습니다. 프로젝트에 따라 한 접근 방식이 다른 것보다 더 잘 맞을 수 있기 때문입니다. 옵션 중 하나를 선택하는 것은 선호도나 특정 요구사항의 문제일 수 있습니다 🎯

---

**✍️ 읽어주셔서 감사합니다!**

---

## 📌 출처

원문: [Entity to DTO: A Performance Comparison of Three Mapping Approaches](https://levelup.gitconnected.com/entity-to-dto-a-performance-comparison-of-three-mapping-approaches-ed3f81b7179c)

저자: Flavius Zichil

발행: Level Up Coding (2025년 9월 28일)
