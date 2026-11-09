---
title: "🚀 수년간 무시했던 JPA 메서드들 — 이것만 알면 Spring Boot 애플리케이션 10배 빨라진다!"
description: "JPA 메서드로 Spring Boot 성능 10배 높이기"
date: 2026-03-17T02:27:13.325Z
tags: ["Java","Performance"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/spring-boot-jpq-performance-1773713476055.png"
---

수년간 무시해왔던 핵심 **JPA 메서드와 어노테이션**들을 마침내 탐구해보니, 놀라운 일이 벌어졌습니다. 애플리케이션이 **10배 더 빨라지고**, 쿼리 수는 줄어들고, 메모리 사용량도 감소했으며, 코드도 훨씬 깔끔해졌습니다.

---


![Gemini Generated Image tk480ltk480ltk48 (1) (1)](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1773713470754-rvp0jy.png)


## 🔄 1. `existsById()` — findById() 대신 사용하기

단순히 **존재 여부만 확인**하면 될 때:

```java
if (userRepository.existsById(id)) {
    // 전체 엔티티를 로드할 필요 없음
}

```

### ✅ 왜 더 빠른가?

- 불필요한 엔티티 로딩을 피함
- SQL 크기 감소
- 단순한 `SELECT COUNT(*)` 또는 `SELECT 1` 쿼리만 실행

---

## 💾 2. `saveAll()` — 암묵적 배치 저장

수년간 이렇게 저장했다면...

```java
// ❌ 비효율적인 방식
for (User user : users) {
    userRepository.save(user);
}

```

이제 이렇게 바꾸세요:

```java
// ✅ 효율적인 방식
userRepository.saveAll(users);

```

### 💡 힌트

`saveAll()`은 내부적으로 각 엔티티에 대해 `save()`를 호출하지만, `hibernate.jdbc.batch_size`를 설정하면 persistence context가 배치 처리를 최적화할 수 있습니다.

---

## ⚙️ 3. `saveAndFlush()` — 즉시 영속화

### 🧠 문제 상황

레코드를 생성한 후 **즉시 해당 데이터가 DB에 있어야 하는** 다른 작업을 수행해야 할 때 (네이티브 쿼리, 트리거, 다른 서비스에서 DB 조회 등)

```java
// ❌ 문제가 될 수 있는 코드
User newUser = userRepository.save(user);
auditRepository.save(new AuditLog("User created: " + newUser.getId()));

```

`save()`는 아직 실제로 INSERT를 flush하지 않았기 때문에, audit 서비스가 물리적으로 영속화된 user에 의존한다면 실패할 수 있습니다.

### 💡 해결책 — `saveAndFlush()` 사용

```java
// ✅ 즉시 영속화
User newUser = userRepository.saveAndFlush(user);
auditRepository.save(new AuditLog("User created: " + newUser.getId()));

```

### ✅ 동작 방식

`saveAndFlush()`는 두 가지 작업을 수행합니다:

1. 엔티티를 영속화 (`save()`처럼)
2. 내부적으로 `EntityManager.flush()`를 즉시 호출

새 레코드가 **데이터베이스에 바로 기록**됩니다.

---

## 🪶 4. `getReferenceById()` — 경량 엔티티 로더

### ⚙️ 동작 원리

`getReferenceById()`는 `EntityManager.getReference()`의 **Spring Data JPA 래퍼**입니다.

```java
User userRef = userRepository.getReferenceById(userId);
order.setUser(userRef);
orderRepository.save(order);

```

### ✅ 핵심 포인트

- **SQL 쿼리가 즉시 실행되지 않음**
- JPA가 엔티티에 대한 **지연 프록시(lazy proxy)** 생성
- ID 외의 다른 필드에 접근할 때만 Hibernate가 DB 조회

### 📉 왜 더 빠른가?

다른 엔티티에서 외래 키를 설정하기 위해 엔티티를 참조만 하면 되는 경우, 전체 객체를 DB에서 로드하는 것은 **시간 낭비**입니다.

```java
// ✅ 최적화된 방식
User userRef = userRepository.getReferenceById(userId);
order.setUser(userRef);

```

SELECT 쿼리 없음, 데이터 페칭 없음, 단지 참조만 생성됩니다.

---

## 🧹 5. `deleteById()` — 깔끔한 삭제

이렇게 삭제했다면...

```java
// ❌ 비효율적인 방식
User user = userRepository.findById(id).orElseThrow();
userRepository.delete(user);

```

이것은 **가장 효율적인 방법이 아닙니다**.

### ⚙️ 더 나은 방법

```java
// ✅ 효율적인 방식
userRepository.deleteById(userId);

```

### ✅ 결과

- 엔티티를 먼저 가져오는 `SELECT` 쿼리 **없음**
- Spring Data JPA가 주어진 ID에 대해 직접 `DELETE FROM` 문 실행

### 📉 왜 더 빠른가?

`delete(entity)`를 호출하면 Hibernate는 보통 두 단계를 수행합니다:

1. 엔티티를 로드하기 위한 `SELECT` 쿼리 실행
2. 삭제를 위한 `DELETE` 문 실행

`deleteById()`는 첫 번째 단계를 건너뜁니다!

---

## 🔄 6. `flush()` — 동기화 도구

언뜻 보면 JPA의 `flush()`가 신비로울 수 있습니다. `save()`를 호출하면 엔티티가 DB에 나타나고 모든 것이 "그냥 작동"하니까요.

### ⚙️ flush()가 실제로 하는 일

`save()`나 `persist()`를 호출할 때, 엔티티는 **메모리에만 저장**되며 즉시 DB에 기록되지 않습니다.

`flush()`는 Hibernate에게 인메모리 상태를 실제 데이터베이스와 **강제로 동기화**하도록 합니다.

### 💡 요약

> 💡 flush() = "대기 중인 모든 SQL 변경 사항(INSERT, UPDATE, DELETE)을 지금 당장 데이터베이스로 보내라"
> 

---

## 📦 7. `findAll(Sort)` / `findAll(Pageable)` — 정렬과 페이지네이션

### 목적

정렬과 페이지네이션으로 엔티티 조회

### 💪 왜 강력한가?

**필요한 슬라이스만** 로드하여 대용량 데이터 조회를 최적화합니다.

```java
Page<User> users = userRepository.findAll(
    PageRequest.of(0, 20, Sort.by("name"))
);

```

### ✅ 장점

- 대용량 쿼리로 인한 메모리 과부하 방지
- 내장된 페이지네이션이 Spring Data에서 자동 처리

---

## 🧮 8. `count()` — 빠른 카운트

### 목적

레코드를 가져오지 않고 빠르게 **개수만 세기**

### 💪 왜 강력한가?

최적화된 SQL `COUNT(*)` 실행

```java
long activeUsers = userRepository.countByStatus("ACTIVE");

```

### ✅ 활용처

대시보드, 요약 정보, 페이지네이션 총 개수에 이상적

---

## 🧩 9. JPA 파생 쿼리 메서드 — 복합 키 검색

Spring Data JPA의 **파생 쿼리 메서드**가 빛을 발합니다.

### ⚙️ 동작 원리

Spring Data JPA는 **메서드 이름 자체를 기반으로** SQL 쿼리를 자동 생성하는 리포지토리 메서드를 정의할 수 있습니다.

수동 `@Query` 없음, JPQL 없음, 보일러플레이트 없음!

```java
Optional<Client> findByClientIdAndCustomerNoAndCountryCode(
    String clientId,
    String customerNo,
    String countryCode
);

```

Spring Data가 이것을 해석하여 다음과 같은 쿼리를 자동 생성합니다:

```sql
SELECT * FROM client
WHERE client_id = ?
AND customer_no = ?
AND country_code = ?;

```

### ✅ 장점

- JPQL이나 네이티브 SQL 필요 없음
- 보일러플레이트 코드 없음
- 높은 가독성과 타입 안전성

---

## ⚡ 마지막 팁

👉 JPA를 블랙박스로 취급하지 마세요. **정교하게 튜닝된 엔진**처럼 다루세요. 그리고 당신은 언제 가속하고, 언제 기어를 바꾸고, 언제 관성 주행할지 결정하는 **드라이버**입니다.

이 리듬을 익히면, JPA는 Spring Boot 툴킷에서 **가장 강력한 도구** 중 하나가 됩니다. 💪🚀

---

## 📋 메서드 요약 표

| 메서드 | 용도 | 성능 이점 |
| --- | --- | --- |
| `existsById()` | 존재 여부 확인 | 엔티티 로딩 불필요 |
| `saveAll()` | 배치 저장 | 배치 최적화 가능 |
| `saveAndFlush()` | 즉시 영속화 | DB 즉시 반영 |
| `getReferenceById()` | 참조만 필요할 때 | SELECT 쿼리 없음 |
| `deleteById()` | ID로 삭제 | SELECT 없이 직접 DELETE |
| `flush()` | 강제 동기화 | 즉시 DB 반영 |
| `findAll(Pageable)` | 페이지네이션 | 필요한 데이터만 로드 |
| `count()` | 개수 조회 | 최적화된 COUNT 쿼리 |
| 파생 쿼리 | 조건부 검색 | 자동 쿼리 생성 |

---

## 🔗 출처

- **원문**: [I Ignored These JPA Methods for Years — Now Spring Boot Application 10× Faster](https://faun.pub/i-ignored-these-jpa-methods-for-years-now-spring-boot-application-10-faster-f93d02b003cc)
- **저자**: Pramod Kumar
- **게시일**: 2025년 11월 8일
- **출처 플랫폼**: FAUN.dev() 🐾 (Medium)
