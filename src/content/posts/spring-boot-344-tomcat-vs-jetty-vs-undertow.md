---
title: "Spring Boot 3.4.4 최적의 임베디드 웹 서버 선택 가이드: Tomcat vs Jetty vs Undertow"
description: "Tomcat vs Jetty vs Undertow 성능 비교 분석"
date: 2026-03-17T02:27:13.325Z
tags: ["Java","Performance"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/spring-boot-344-tomcat-vs-jetty-vs-undertow-1773700603035.png"
---

> Spring Web과 Virtual Threads를 사용한 Spring Boot 애플리케이션의 Tomcat, Jetty, Undertow 성능 비교 분석
> 

## 📌 핵심 요약

Spring Boot 애플리케이션에서 높은 동시성 처리가 필요하다면 **Undertow + Virtual Threads** 조합이 가장 빠른 응답 시간과 최고의 확장성을 제공합니다.

- **Virtual Threads 없이**: Undertow가 근소한 차이로 가장 빠르지만, 세 서버 모두 비슷한 성능
- **Virtual Threads 사용 시**: Undertow가 고부하에서 압도적인 성능 차이를 보임
- **시작 시간**: Tomcat이 가장 빠름 (특히 Virtual Threads 사용 시)

## 🎯 개요

Spring Boot 애플리케이션을 Spring Web으로 생성하면 기본적으로 Apache Tomcat이 임베디드 웹 서버로 설정됩니다. 하지만 Jetty와 Undertow라는 대안도 존재합니다. 과연 어떤 서버가 가장 좋은 성능을 보일까요?

이 글에서는 간단한 **Greetings API** Spring Boot 애플리케이션을 구축하고, Maven 프로필을 통해 세 가지 웹 서버를 전환하며 성능을 측정해보겠습니다. 또한 Java 21에서 정식 지원되는 Virtual Threads(가상 스레드)의 효과도 함께 살펴보겠습니다.

## 🛠️ 구현 프로젝트: Greetings API

### 프로젝트 구조

- **엔드포인트**: `/greetings?name=?`
- **응답**: 랜덤한 인사말 반환 (Hello, Hi, Olá, Oi, Hallo)
- **처리 지연**: 1초 (실제 DB 호출이나 외부 API 호출 시뮬레이션)

### 주요 코드

### GreetingsService

```java
@Service
public class GreetingsService {
    private static final String[] greetingWord =
        {"Hello", "Hi", "Olá", "Oi", "Hallo"};

    public String randomGreetings(String name) {
        try {
            String word = greetingWord[
                ThreadLocalRandom.current().nextInt(greetingWord.length)
            ];
            Thread.sleep(1000); // 처리 시간 시뮬레이션
            return "%s %s!".formatted(word, name);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}

```

### GreetingsController

```java
@RestController
@RequestMapping("/greetings")
public class GreetingsController {
    private static final Logger log =
        LoggerFactory.getLogger(GreetingsController.class);
    private static final AtomicInteger counter = new AtomicInteger(1);
    private final GreetingsService greetingsService;

    @GetMapping
    public String greeting(
        @RequestParam(required = false, defaultValue = "World") String name
    ) {
        int id = counter.getAndIncrement();
        log.info("Request {} processed by {}", id, Thread.currentThread());
        String greeting = greetingsService.randomGreetings(name);
        log.info("Request {} resumed by {}", id, Thread.currentThread());
        return greeting;
    }
}

```

## ⚙️ Maven 프로필 설정

### Jetty 프로필

```xml
<profile>
    <id>jetty</id>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-starter-tomcat</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jetty</artifactId>
        </dependency>
    </dependencies>
</profile>

```

### Undertow 프로필

```xml
<profile>
    <id>undertow</id>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-starter-tomcat</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-undertow</artifactId>
        </dependency>
    </dependencies>
</profile>

```

### 스레드 설정 (application.properties)

```
spring.application.name=greetings-api

# 각 서버의 최대 스레드 수를 200으로 통일
server.tomcat.threads.max=200
server.jetty.threads.max=200
server.undertow.threads.worker=200

# Virtual Threads 활성화 (필요시 추가)
# spring.threads.virtual.enabled=true

```

## 🐳 Docker 이미지 빌드

각 웹 서버별로 Virtual Threads 활성화/비활성화 버전의 Docker 이미지를 생성:

- `greetings-api-tomcat:3.4.4-21`
- `greetings-api-tomcat:3.4.4-21-vt` (Virtual Threads 활성화)
- `greetings-api-jetty:3.4.4-21`
- `greetings-api-jetty:3.4.4-21-vt`
- `greetings-api-undertow:3.4.4-21`
- `greetings-api-undertow:3.4.4-21-vt`

## 📊 벤치마크 결과

### 테스트 환경

- **머신**: MacBook Pro (1.7GHz Quad-Core Intel Core i7, 16GB RAM)
- **컨테이너 런타임**: Podman 5.4.1
- **메모리 제한**: 1024MB per container
- **부하 테스트 도구**: OHA (https://github.com/hatoo/oha)
- **동시 요청 수**: 100, 300, 900, 2700

### 응답 시간 성능 (평균, 초)

| 서버 구성 | 100 요청 | 300 요청 | 900 요청 | 2700 요청 |
| --- | --- | --- | --- | --- |
| **Virtual Threads 미사용** |  |  |  |  |
| Tomcat | 1.40s | 2.21s | 5.26s | 14.40s |
| Jetty | 1.49s | 2.22s | 5.57s | 14.56s |
| Undertow | **1.38s** ✅ | **2.22s** | **5.24s** ✅ | **14.36s** ✅ |
| **Virtual Threads 사용** |  |  |  |  |
| Tomcat-VT | 1.33s | **1.38s** ✅ | 1.87s | 7.55s |
| Jetty-VT | 1.46s | 1.97s | 4.11s | 5.79s |
| Undertow-VT | **1.33s** ✅ | 1.42s | **2.13s** ✅ | **4.26s** ✅ |

### 시작 시간 (평균, 초)

| 서버 구성 | 평균 시작 시간 |
| --- | --- |
| Tomcat | 2.83s |
| Tomcat-VT | **2.75s** ✅ |
| Jetty | 2.99s |
| Jetty-VT | 2.99s |
| Undertow | 3.05s |
| Undertow-VT | 2.98s |

## 📈 성능 분석 인사이트

### Virtual Threads 미사용 시

- **낮은 부하 (100-300 요청)**: Undertow가 근소하게 우세
- **중간 부하 (900 요청)**: 세 서버 모두 비슷한 성능
- **높은 부하 (2700 요청)**: 14.36-14.56초로 거의 동일

### Virtual Threads 사용 시

- **낮은 부하**: Tomcat과 Undertow가 거의 동일한 성능 (1.33초)
- **중간 부하**: Tomcat이 Undertow보다 약간 빠름
- **높은 부하**: Undertow가 압도적 우위
    - Undertow: 4.26초 (최고 성능) 🏆
    - Jetty: 5.79초 (중간)
    - Tomcat: 7.55초 (가장 느림)

### 주요 발견사항

1. **Virtual Threads의 효과는 매우 큼**
    - 2700 요청 처리 시 최대 70% 성능 향상
    - 특히 Undertow에서 가장 큰 개선 효과
2. **Undertow의 확장성이 가장 우수**
    - Virtual Threads와 함께 사용 시 고부하에서 탁월한 성능
    - 동시 요청이 많을수록 다른 서버와의 격차 벌어짐
3. **Tomcat의 빠른 시작 시간**
    - 특히 Virtual Threads 사용 시 가장 빠른 시작 (2.75초)
    - 마이크로서비스나 서버리스 환경에 유리

## 🎯 사용 권장 사항

### Tomcat을 선택해야 할 때

- ✅ Spring Boot 기본 설정으로 충분한 경우
- ✅ 빠른 시작 시간이 중요한 경우
- ✅ 낮은-중간 부하의 애플리케이션
- ✅ 기존 운영 경험과 레퍼런스가 풍부한 경우

### Jetty를 선택해야 할 때

- ✅ 메모리 사용량이 중요한 경우
- ✅ WebSocket 기능을 많이 사용하는 경우
- ✅ 임베디드 시스템에서 실행하는 경우

### Undertow를 선택해야 할 때

- ✅ **높은 동시성 처리가 필요한 경우** (최우선 추천)
- ✅ Virtual Threads를 적극 활용하려는 경우
- ✅ 대용량 트래픽 애플리케이션
- ✅ 최고의 처리량과 응답 시간이 필요한 경우

## 💡 결론

Spring Boot 3.4.4에서 높은 동시성을 요구하는 애플리케이션을 개발한다면, **Undertow + Virtual Threads** 조합이 최적의 선택입니다. 이 조합은 가장 빠른 응답 시간과 최고의 확장성을 제공합니다.

단, 애플리케이션의 특성에 따라:

- 빠른 시작이 중요하다면 → Tomcat
- 메모리 효율성이 중요하다면 → Jetty
- 최고 성능이 필요하다면 → Undertow

를 선택하는 것이 좋습니다.

### 🔧 Virtual Threads 활성화 방법

```
# application.properties에 추가
spring.threads.virtual.enabled=true

```

---

## 📚 참고 자료

- [Spring Boot 공식 문서](https://docs.spring.io/spring-boot/index.html)
- [Apache Tomcat](https://tomcat.apache.org/)
- [Eclipse Jetty](https://jetty.org/index.html)
- [Undertow](https://undertow.io/)
- [JEP-444: Virtual Threads](https://openjdk.org/jeps/444)
- [벤치마크 도구: api-oha-benchmarker](https://github.com/ivangfr/api-oha-benchmarker)

---

**출처**: [What is the Best Embedded Web Server for Spring Boot version 3.4.4: Tomcat vs. Jetty vs. Undertow](https://itnext.io/what-is-the-best-embedded-web-server-for-spring-boot-version-3-4-4-tomcat-vs-jetty-vs-undertow-c9186a510301) by Ivan Franchin, ITNEXT (May 6, 2025)
