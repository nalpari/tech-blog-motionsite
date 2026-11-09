---
title: "Spring WebFlux에서 Kotlin Coroutine으로 Reactive 프로그래밍 구현하기"
description: "WebFlux에서 Kotlin Coroutine으로 리액티브 구현"
date: 2026-03-17T02:27:13.325Z
tags: ["Java","Performance"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/spring-webflux-kotlin-coroutine-reactive-1773711530524.webp"
---

> 💡 핵심 요약
> 
> 
> LGU+ 디지털 커머스랩에서 Spring WebFlux 기반의 리액티브 스트림 구현 시, 기존 Reactor의 Mono와 Flux 대신 Kotlin Coroutine의 Flow를 활용하여 러닝 커브를 낮추고 개발 효율성을 높인 사례입니다.
> 

---

## 🎯 배경 및 문제점

### 우리가 마주친 문제

2022년 LGU+ 디지털 커머스랩은 기존 서비스 플랫폼을 **마이크로서비스 아키텍처(MSA)**로 전면 전환한 후, 다음과 같은 문제들을 해결해야 했습니다:

- **느린 네트워크 환경**에서의 사용자 경험 저하
- **API 호출 증가**로 인한 네트워크 지연
- MSA로 인해 **세분화된 API**의 호출 횟수 증가

---

## 🏗️ 해결 방안: Backend For Frontend (BFF) 패턴

### BFF 패턴 도입 배경

BFF 패턴을 적용하여 다음과 같은 이점을 얻었습니다:

### ✅ BFF의 주요 장점

- **API 마다 다른 인증 방식** 처리 가능
- **서비스에 필요한 API를 묶어서 한 번에 처리** (API Aggregation)
- **API 엔드포인트 분리**로 후속 작업 비용 절감
- **CORS 이슈** 해결
- **세분화된 API 변경** 시 커뮤니케이션 비용 절감

---

## 📋 구체적인 요구사항

### 필수 요구사항

- 급증 트래픽을 감당할 수 있는 **고성능 웹 애플리케이션**
- 서비스에 필요한 API를 묶어서 **한번의 API 호출**(API aggregation)

### 추가 요구사항

- *피처 플래그(Feature Flag)**를 통한 A/B 테스트 지원
- MSA 장애 대비 **캐싱(Cache)** 및 **차단기(Circuit Breaker)** 역할

---

## 🛠️ 구현 방법

### 프로그래밍 언어: Kotlin 선택

### Kotlin을 선택한 이유

- **개발자의 개발 역량 강화**
- **코드 작성 간결성** (Java 대비 구문이 간결)
- **비동기/논블로킹/코루틴** 스펙 쉬운 적용

### Kotlin의 주요 특징

| 특징 | 설명 |
| --- | --- |
| **자바와의 상호운용성** | 기존 Java 코드와 완벽 호환 |
| **널 안전성** | 타입 시스템에서 널 값 명시적 선언 |
| **확장 함수** | 기존 클래스 수정 없이 새로운 기능 추가 |
| **함수형 프로그래밍** | 람다식과 고차 함수 지원 |
| **동시성 프로그래밍** | 코루틴을 통한 경량 비동기 처리 |

---

## 🔄 코루틴(Coroutine)의 이해

### 코루틴이란?

> Co(함께, 서로) + routine(규칙적 일의 순서, 작업의 집합)
> 
> 
> 함께 동작하며 규칙이 있는 일의 순서를 뜻합니다.
> 

### 코루틴의 특징

- 스레드가 아닌 **스레드 내 동작하는 하나의 작업 단위**
- **컨텍스트 스위칭 오버헤드**가 적은 비동기 경량 스레드
- **스레드 내 컨텍스트 스위칭 없이** 여러 코루틴을 실행, 중단, 재개

---

## ⚡ Spring WebFlux와 리액티브 스트림

### WebFlux vs WebMVC

Spring Framework는 웹 관련하여 두 가지 프레임워크를 제공합니다:

- **WebMVC**: 전통적인 서블릿 기반
- **WebFlux**: 리액티브 기반의 고성능 프레임워크

### 리액티브 스트림의 핵심 구성요소

| 구성요소 | 역할 |
| --- | --- |
| **Publisher** | 데이터를 생성하여 전송 |
| **Subscriber** | 데이터를 소비, 요청 및 구독 취소 |
| **Subscription** | Publisher와 Subscriber 간의 구독 상태 관리 |
| **Processor** | 중간 데이터 변환 수행 |

### Reactor의 핵심 타입

- **Mono**: **0 또는 1개의 데이터**를 비동기적으로 처리
- **Flux**: **0개 이상의 데이터 스트림**을 비동기적으로 처리

---

## 🚧 리액티브 프로그래밍의 도전 과제

### 주요 어려움

- **높은 적응 시간**: 기존 동기 프로그래밍과 다른 개념
- **스택 트레이스 추적의 어려움**: 비동기 코드에서 디버깅 복잡
- **높은 숙련도 요구**: Reactor API에 대한 깊은 이해 필요

---

## 💡 해결책: Kotlin Coroutine + WebFlux

### 핵심 아이디어

> 2019년 4월부터 Kotlin Coroutine은 Flow로 리액티브 스트림의 Reactor와 유사하게 시그널을 전달하고 처리할 수 있는 기능을 제공합니다.
> 

### 지원 버전

- **Spring Framework 5.2** 이상
- **Spring Boot 2.2** 이상 (2019년 4월부터 코루틴 지원)
- **Spring WebFlux 5.2** 이상에서 코틀린 코루틴을 리액티브 스트림에 대응해 사용 가능

### 개발 스펙

```
📦 최종 개발 환경
├── OpenJDK 17
├── Kotlin 1.9.21
├── Spring Boot 3.2.2
└── Gradle 8.4

```

---

## 📊 성능 비교 결과

### 테스트 환경

- **대상 노드**: GCP K8S POD — vCPU 2 core, MEM 4G (2개)
- **대상 API**: LGU+ 메인 전시 구좌 조회 API
- **테스트 클라이언트**: 2개, 동시 스레드 10개~100개 (10초 단위 증가)

### 성능 개선 결과

| 지표 | WebMVC | WebFlux with Coroutine | 개선율 |
| --- | --- | --- | --- |
| **처리량(TPS)** | 기준값 | 약 **300% 향상** | 🚀 |
| **응답시간** | 기준값 | 약 **50% 단축** | ⚡ |
| **메모리 사용량** | 기준값 | 약 **30% 절약** | 💾 |

---

## 🎯 결론 및 효과

### 주요 성과

✅ **개발 시간 단축**: WebMVC와 유사한 코드 패러다임으로 러닝 커브 최소화

✅ **성능 향상**: 리액티브 스트림의 고성능 특성 그대로 활용

✅ **운영 비용 절감**: 디버깅과 유지보수의 복잡성 감소

✅ **개발자 경험 개선**: 기존 동기 프로그래밍 방식과 유사한 코드 작성

### 핵심 메시지

> 코루틴을 이용해서 WebMVC와 코드 작성 패러다임은 비슷하지만, 내부는 리액티브 스트림으로 동작하도록 쉽게 코드를 개발할 수 있습니다.
> 

리액티브 스트림의 Reactor를 배우고 적용하는 것보다 **코루틴을 배워서 적용하는 것이 프로젝트의 개발 시간을 단축하고 개발 난이도 및 운영 비용을 절감하는 측면에서 더 효과적**입니다.

---

## 📚 참고 자료

- [Going Reactive with Spring, Coroutines and Kotlin Flow](https://spring.io/blog/2019/04/12/going-reactive-with-spring-coroutines-and-kotlin-flow)
- [Backend For Frontend Pattern](https://microservices.io/patterns/apigateway.html)
- [Spring WebMVC Documentation](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
- [Spring WebFlux Documentation](https://docs.spring.io/spring-framework/reference/web/webflux/new-framework.html)

---

**출처**: [LG U+ 기술블로그 - Spring WebFlux에서 Kotlin Coroutine으로 Reactive 프로그래밍 구현하기](https://techblog.uplus.co.kr/spring-webflux%EC%97%90%EC%84%9C-kotlin-coroutine%EC%9C%BC%EB%A1%9C-reactive-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B0-reactor-mono-flux-%EB%8C%80%EC%B2%B4-%EC%82%AC%EB%A1%80-6f28253aa121)

**작성자**: LG U+ TechBlog (권세욱님)

**발행일**: 2024년 10월 28일
