---
title: "10가지 고급 Spring Boot 개념"
description: "Spring Boot 고급 개념 10가지 실무 적용 가이드"
date: 2026-03-17T02:27:13.325Z
tags: ["Java","Performance"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/spring-boot-expert-things-1773711645914.jpg"
---

![](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*MRO6fS-Ornu4oS4qJqhXYw.png)

솔직히 말하자면 — 대부분의 Java 개발자들은 REST API를 설정하고, 클래스에 `@RestController`를 붙이고, JSON을 반환할 수 있다는 이유만으로 Spring Boot를 "안다"고 생각합니다.

하지만 진실은 이렇습니다: Spring Boot는 빙산과 같아서 — 90%가 표면 아래에 숨겨져 있습니다. 그리고 아직도 모든 것을 `@Autowired`로만 하고 Stack Overflow에서 설정을 무작정 복사하고 있다면, 죄송하지만 여러분은 표면만 긁고 있는 것입니다.

이 글에서는 **진짜 고급 Spring Boot 개념**들을 다루겠습니다 — 유행어가 아니라, 학술적인 헛소리도 아닌, 여러분의 백엔드 실력을 진정으로 한 단계 끌어올릴 수 있는 것들입니다. 단순한 CRUD를 넘어서, 애플리케이션을 더 확장 가능하고, 안전하고, 테스트 가능하며, 실제로 **프로덕션 준비**가 되도록 만드는 것들을 탐구하겠습니다.

---

## 1. 프로파일과 환경별 설정

### 이게 뭔가요?

Spring Boot는 **프로파일**(예: `dev`, `test`, `prod`)을 정의할 수 있게 해주어, 코드를 변경하지 않고도 다른 환경에서 앱이 다르게 동작하도록 할 수 있습니다.

### 왜 유용한가요?

로컬 개발 환경에서 프로덕션과 동일한 데이터베이스나 캐시 설정을 사용하고 싶지 않을 것입니다. 그건 문제를 자초하는 것입니다.

### 어떻게 하나요?

```yaml
# application.yml
spring:
  profiles:
    active: dev

```

그런 다음, 각 프로파일마다 다른 파일을 생성합니다:

```yaml
# application-dev.yml
server:
  port: 8080

# application-prod.yml
server:
  port: 80

```

Spring은 활성 프로파일을 기반으로 올바른 설정 파일을 자동으로 로드합니다.

### 프로 팁:

시작 시 활성 프로파일을 전달할 수 있습니다:

```bash
java -jar myapp.jar --spring.profiles.active=prod

```

---

## 2. 커스텀 스타터 — 나만의 Spring Boot 마법 만들기

### 이게 뭔가요?

`spring-boot-starter-web`이 어떻게 작동하는지 궁금했나요? 실제로 자신만의 커스텀 스타터 라이브러리를 만들 수 있습니다!

### 왜 이렇게 할까요?

큰 회사에서 일하고 있고, 모든 마이크로서비스가 Kafka, 보안 설정, 로깅 설정 등 동일한 것들이 필요하다고 상상해보세요. 50개의 서비스에 코드를 복사-붙여넣기하는 대신, 커스텀 스타터를 만드세요.

### 어떻게 하나요?

1. 별도의 Maven 모듈을 생성합니다.
2. 모든 공통 종속성을 추가합니다.
3. `@Configuration`과 `@ConditionalOn...` 어노테이션을 사용하여 빈을 자동 구성합니다.
4. 패키징하고 다른 프로젝트에서 가져옵니다.

이제 팀은 `mycompany-starter-commons`를 사용하여 모든 공유 마법을 미리 연결할 수 있습니다.

---

## 3. 조건부 빈 — 무엇이 생성되는지(그리고 언제) 제어하기

### 왜 고급일까요?

대부분의 개발자들은 모든 것에 `@Component`나 `@Service`만 어노테이션합니다. 하지만 실제 애플리케이션은 **조건부 와이어링**이 필요합니다.

### 언제 유용할까요?

프로덕션에서는 **Redis 캐시**를 사용하고 싶지만, 개발 환경에서는 **인메모리 캐시**를 사용하고 싶다고 상상해보세요.

```java
@Configuration
@ConditionalOnProperty(name = "use.redis", havingValue = "true")
public class RedisConfig {
    @Bean
    public CacheManager redisCacheManager() {
        return new RedisCacheManager();
    }
}

@Configuration
@ConditionalOnProperty(name = "use.redis", havingValue = "false", matchIfMissing = true)
public class InMemoryCacheConfig {
    @Bean
    public CacheManager inMemoryCacheManager() {
        return new ConcurrentMapCacheManager();
    }
}

```

`application-prod.yml`에서 `use.redis=true`로 설정하면, 코드 변경 없이 완료됩니다.

---

## 4. 라이프사이클 훅 (@PostConstruct, @PreDestroy, ApplicationRunner)

### 왜 신경 써야 할까요?

때로는 **앱이 시작된 후** 초기 데이터를 로드하거나 캐시를 워밍업하는 등의 로직을 실행해야 합니다. 또는 **종료 전에** 무언가를 정리해야 할 수도 있습니다.

### 옵션들:

### 1. `@PostConstruct` — 빈이 초기화된 후 실행

```java
@PostConstruct
public void init() {
    System.out.println("App just started!");
}

```

### 2. `ApplicationRunner`

```java
@Component
public class StartupRunner implements ApplicationRunner {
    public void run(ApplicationArguments args) {
        System.out.println("Running after app startup");
    }
}

```

### 3. `@PreDestroy` — 종료 전 정리

```java
@PreDestroy
public void destroy() {
    System.out.println("App is shutting down");
}

```

1999년처럼 `main()`에 이 로직을 작성하지 마세요. 올바른 훅을 사용하세요.

---

## 5. @TestConfiguration, 슬라이스, @MockBean을 사용한 테스팅

### @SpringBootTest를 넘어선 테스팅

솔직히 말하면 — 적절한 테스트를 작성하는 것은 대부분의 개발자들이 가장 하기 싫어하는 일입니다. 하지만 매번 `@SpringBootTest`로 전체 Spring 컨텍스트를 테스트한다면, 테스트가 느리고 낭비적입니다.

### 더 나은 방법: 슬라이스 어노테이션 사용

- `@WebMvcTest` — 컨트롤러 레이어용
- `@DataJpaTest` — 리포지토리 레이어용
- `@MockBean` — 종속성 모킹용

```java
@WebMvcTest(MyController.class)
class MyControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MyService myService;

    @Test
    void testEndpoint() throws Exception {
        when(myService.getValue()).thenReturn("mocked");
        mockMvc.perform(get("/my-endpoint"))
            .andExpect(status().isOk());
    }
}

```

올바른 도구를 사용하면 테스팅이 고통스러울 필요가 없습니다.

---

## 6. @ConfigurationProperties를 프로처럼 사용하기

### 대부분의 개발자들이 하는 방식:

```java
@Value("${myapp.name}")
private String name;

```

### 하지만 더 나은 방법은:

```java
@ConfigurationProperties(prefix = "myapp")
public class AppProperties {
    private String name;
    private int timeout;
    // getters & setters
}

```

이것을 빈으로 등록합니다:

```java
@EnableConfigurationProperties(AppProperties.class)

```

이렇게 하면 관련 설정 값들을 단일 클래스로 그룹화하여, 코드를 더 읽기 쉽고 관리하기 쉽게 만듭니다.

**보너스:** YAML 및 IntelliJ 자동 완성과 완벽하게 작동합니다.

---

## 7. Spring Security DSL을 사용한 커스텀 보안

Spring Security는 악몽이었습니다. 하지만 새로운 Lambda 스타일 DSL로, 실제로 쾌적해졌습니다.

### 이전 (오래된 XML 또는 복잡한 오버라이드):

```java
http
    .authorizeRequests()
    .antMatchers("/admin/**").hasRole("ADMIN")
    .anyRequest().authenticated();

```

### 현재 (더 깔끔한 DSL):

```java
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/admin/**").hasRole("ADMIN")
    .anyRequest().authenticated()
);

```

필터를 커스터마이즈하거나, JWT 기반 보안을 추가하거나, 자신만의 `AuthenticationProvider`를 작성할 수도 있습니다.

모든 엔드포인트에서 `permitAll()`로 보안을 비활성화하고 있다면 — 이제 성장할 때입니다.

---

## 8. Spring Boot Actuator — 앱의 영혼을 들여다보기

**Actuator 없이** 프로덕션에 서비스를 배포한다면, 그건 대시보드 없이 비행기를 조종하는 것과 같습니다.

### 제공하는 것:

- `/actuator/health` — 내 앱이 건강한가?
- `/actuator/metrics` — JVM 메모리, GC, 스레드 수, DB 풀
- `/actuator/env` — 활성 프로파일 및 환경 변수 확인
- `/actuator/beans` — 로드된 모든 빈

### `application.yml`에서 엔드포인트 활성화:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: "*"

```

이것을 Prometheus, Grafana 또는 클라우드 모니터링 스택과 통합할 수 있습니다.

---

## 9. 커스텀 자동 구성

내부 사용을 위한 커스텀 모듈을 만들고 있고 사용자에게 기본 구성을 제공하고 싶다고 가정해봅시다.

### 단계:

1. `@Configuration`으로 어노테이션된 클래스를 생성합니다.
2. 사용자가 재정의할 수 있도록 `@ConditionalOnMissingBean`을 추가합니다.
3. `spring.factories`를 통해 등록합니다:

```
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.mycompany.autoconfig.MyAutoConfig

```

이제 누군가 여러분의 jar를 추가하면, 여러분의 설정이 자동으로 로드됩니다 — Spring Boot 스타터와 마찬가지로.

---

## 10. 모든 것을 망치는 일반적인 실수들

경험 많은 개발자들도 물리는 몇 가지 일반적인 실수로 마무리하겠습니다:

- 베이스 패키지를 이해하지 못한 채 `@ComponentScan` 사용
- 순환 종속성 자동 와이어링 (안녕, 스택 오버플로우)
- DB 연결을 닫지 않거나 연결 풀을 구성하지 않음
- Spring 앱에서 `Thread.sleep()` 사용 (제발, 하지 마세요)
- 이미 컨텍스트에 존재하는 빈을 수동으로 생성하려고 시도

고급 Spring Boot는 단순히 더 많은 어노테이션에 관한 것이 아닙니다 — 더 스마트하고 유지 관리하기 쉬운 코드를 작성하는 것입니다.

---

## 출처

**원문:** [10 Advanced Spring Boot Concepts](https://blog.stackademic.com/10-advanced-spring-boot-concepts-86fe5824471e)

**저자:** Shanvika Devi

**게시일:** 2025년 7월 24일

**출처:** Stackademic (Medium)
