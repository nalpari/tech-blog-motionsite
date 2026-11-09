---
title: "🚀 Spring Boot 4.0 신규 기능 완벽 가이드"
description: "Spring Boot 4.0 주요 신기능과 마이그레이션"
date: 2026-03-17T02:27:13.325Z
tags: ["Java"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/spring-boot-4-new-feature-1773713322858.png"
---

> 릴리스 일자: 2025년 11월 20일
> 
> 
> **Spring Framework**: 7.0 기반
> 
> **최소 JDK**: 17 (LTS), 권장: 25
> 

---

## 📋 목차

1. [기본 요구사항](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#1-%EA%B8%B0%EB%B3%B8-%EC%9A%94%EA%B5%AC%EC%82%AC%ED%95%AD)
2. [코드베이스 완전 모듈화](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#2-%EC%BD%94%EB%93%9C%EB%B2%A0%EC%9D%B4%EC%8A%A4-%EC%99%84%EC%A0%84-%EB%AA%A8%EB%93%88%ED%99%94)
3. [HTTP Service Clients](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#3-http-service-clients)
4. [API 버전 관리](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#4-api-%EB%B2%84%EC%A0%84-%EA%B4%80%EB%A6%AC)
5. [JSpecify Null Safety](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#5-jspecify-null-safety)
6. [내장 Resilience 기능](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#6-%EB%82%B4%EC%9E%A5-resilience-%EA%B8%B0%EB%8A%A5)
7. [OpenTelemetry 스타터](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#7-opentelemetry-%EC%8A%A4%ED%83%80%ED%84%B0)
8. [Kotlin Serialization 지원](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#8-kotlin-serialization-%EC%A7%80%EC%9B%90)
9. [BeanRegistrar](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#9-beanregistrar)
10. [RestTestClient](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#10-resttestclient)
11. [Redis Static Master/Replica](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#11-redis-static-masterreplica)
12. [주요 의존성 업그레이드](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#12-%EC%A3%BC%EC%9A%94-%EC%9D%98%EC%A1%B4%EC%84%B1-%EC%97%85%EA%B7%B8%EB%A0%88%EC%9D%B4%EB%93%9C)
13. [기타 개선사항](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#13-%EA%B8%B0%ED%83%80-%EA%B0%9C%EC%84%A0%EC%82%AC%ED%95%AD)
14. [마이그레이션 가이드](https://claude.ai/chat/7b25ce28-9806-4d43-b11b-523b5de0a119#14-%EB%A7%88%EC%9D%B4%EA%B7%B8%EB%A0%88%EC%9D%B4%EC%85%98-%EA%B0%80%EC%9D%B4%EB%93%9C)

---

![Gemini Generated Image jvcsgtjvcsgtjvcs](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1773713304853-wkb6fy.png)

## 1. 기본 요구사항

| 항목 | 요구사항 |
| --- | --- |
| **JDK** | 최소 17 (LTS), 권장 25 |
| **Spring Framework** | 7.0 |
| **Jakarta EE** | 11 |
| **Servlet** | 6.1 |
| **JPA** | 3.2 |
| **Hibernate** | 7.1 |
| **GraalVM** | 24 완전 지원 |
| **Kotlin** | 2.2 공식 베이스라인 |

---

## 2. 코드베이스 완전 모듈화

Spring Boot 4.0에서는 `spring-boot-autoconfigure` JAR이 기술별 모듈로 분리되었습니다.

### 주요 이점

- ✅ 메모리 사용량 감소
- ✅ 빌드 시간 단축
- ✅ IDE 자동완성에서 불필요한 클래스 제거
- ✅ 필요한 모듈만 선택적으로 사용 가능

---

## 3. HTTP Service Clients

선언적 HTTP 클라이언트를 통해 인터페이스만으로 REST API를 호출할 수 있습니다.

### 3.1 의존성 추가

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

```

### 3.2 인터페이스 정의

```java
import org.springframework.web.service.annotation.*;
import org.springframework.web.bind.annotation.*;

@HttpExchange("/posts")
public interface PostClient {

    @GetExchange
    List<Post> getPosts();

    @GetExchange("/{id}")
    Post getPostById(@PathVariable("id") Integer id);

    @PostExchange
    Post createPost(@RequestBody Post post);

    @PutExchange("/{id}")
    Post updatePost(@PathVariable("id") Integer id, @RequestBody Post post);

    @DeleteExchange("/{id}")
    void deletePost(@PathVariable("id") Integer id);
}

```

### 3.3 그룹별 설정 (application.yml)

```yaml
spring:
  http:
    client:
      service:
        group:
          github:
            base-url: https://api.github.com
            connect-timeout: 5s
            read-timeout: 10s
          jsonplaceholder:
            base-url: https://jsonplaceholder.typicode.com
            connect-timeout: 3s
            read-timeout: 5s

```

### 3.4 @ImportHttpServices를 통한 그룹 관리

```java
import org.springframework.boot.http.client.service.ImportHttpServices;

@Configuration
@ImportHttpServices(
    group = "jsonplaceholder",
    types = { PostClient.class, UserClient.class }
)
public class HttpClientConfig {
}

```

### 3.5 서비스에서 사용

```java
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostClient postClient;

    public List<Post> getAllPosts() {
        return postClient.getPosts();
    }

    public Post getPost(Integer id) {
        return postClient.getPostById(id);
    }

    public Post createNewPost(String title, String body, Integer userId) {
        Post post = new Post(null, userId, title, body);
        return postClient.createPost(post);
    }
}

```

### 3.6 WebClient 기반 리액티브 클라이언트

```java
@HttpExchange("/posts")
public interface ReactivePostClient {

    @GetExchange
    Flux<Post> getPosts();

    @GetExchange("/{id}")
    Mono<Post> getPostById(@PathVariable("id") Integer id);

    @PostExchange
    Mono<Post> createPost(@RequestBody Post post);
}

```

---

## 4. API 버전 관리

Spring Boot 4.0은 4가지 API 버전 관리 전략을 기본 제공합니다.

### 4.1 버전 관리 전략

| 전략 | 예시 | 설명 |
| --- | --- | --- |
| **Path Segment** | `/api/v1/users` | URL 경로에 버전 포함 |
| **Header** | `X-API-Version: 1.0` | HTTP 헤더로 버전 전달 |
| **Query Parameter** | `?version=1.0` | 쿼리 파라미터로 버전 전달 |
| **Media Type** | `Accept: application/vnd.api.v1+json` | 미디어 타입에 버전 포함 |

### 4.2 Java Configuration

```java
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.ApiVersionConfigurer;

@Configuration
public class ApiVersionConfig implements WebMvcConfigurer {

    @Override
    public void configureApiVersioning(ApiVersionConfigurer configurer) {
        configurer
            // Path Segment 방식: /api/v1/users
            .usePathSegment(1)
            // 지원 버전 목록
            .addSupportedVersions("1.0", "1.1", "2.0")
            // 기본 버전
            .setDefaultVersion("1.0")
            // Deprecated 버전 설정
            .addDeprecatedVersions("1.0");
    }
}

```

### 4.3 Header 방식 설정

```java
@Override
public void configureApiVersioning(ApiVersionConfigurer configurer) {
    configurer
        .useHeader("X-API-Version")
        .addSupportedVersions("1.0", "2.0")
        .setDefaultVersion("1.0");
}

```

### 4.4 Properties 설정 (application.yml)

```yaml
spring:
  mvc:
    apiversion:
      default: v1.0
      use:
        header: api-version
        # 또는
        # path-segment: 1
        # query-param: version
        # media-type-param: version

```

### 4.5 컨트롤러에서 버전별 엔드포인트

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    // v1.0 - 기본 응답
    @GetMapping(version = "1.0")
    public List<UserDTOv1> getUsersV1() {
        return userService.findAll().stream()
            .map(user -> new UserDTOv1(user.getId(), user.getName()))
            .toList();
    }

    // v2.0 - 확장된 응답
    @GetMapping(version = "2.0")
    public List<UserDTOv2> getUsersV2() {
        return userService.findAll().stream()
            .map(user -> new UserDTOv2(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt()
            ))
            .toList();
    }

    // 특정 버전 이상
    @GetMapping(value = "/{id}", version = "1.1+")
    public UserDTOv2 getUserById(@PathVariable Long id) {
        User user = userService.findById(id);
        return new UserDTOv2(user.getId(), user.getName(),
                            user.getEmail(), user.getCreatedAt());
    }
}

```

### 4.6 DTO 클래스

```java
// v1.0 DTO
public record UserDTOv1(
    Long id,
    String name
) {}

// v2.0 DTO - 확장된 필드
public record UserDTOv2(
    Long id,
    String name,
    String email,
    LocalDateTime createdAt
) {}

```

### 4.7 클라이언트 측 API 버전 지정

```java
@Service
public class ExternalApiService {

    private final RestClient restClient;

    public ExternalApiService(RestClient.Builder builder) {
        this.restClient = builder
            .baseUrl("https://api.example.com")
            .apiVersionInserter(ApiVersionInserter.useHeader("API-Version"))
            .build();
    }

    public Account getAccount(Long accountId) {
        return restClient.get()
            .uri("/accounts/{id}", accountId)
            .apiVersion(1.1)  // API 버전 지정
            .retrieve()
            .body(Account.class);
    }

    public Account getAccountV2(Long accountId) {
        return restClient.get()
            .uri("/accounts/{id}", accountId)
            .apiVersion(2.0)  // v2.0 API 호출
            .retrieve()
            .body(Account.class);
    }
}

```

### 4.8 테스트 코드

```java
@SpringBootTest
@AutoConfigureMockMvc
class UserControllerVersionTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturnV1Response() throws Exception {
        mockMvc.perform(get("/api/users")
                .header("X-API-Version", "1.0"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].email").doesNotExist());
    }

    @Test
    void shouldReturnV2Response() throws Exception {
        mockMvc.perform(get("/api/users")
                .header("X-API-Version", "2.0"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].email").exists())
            .andExpect(jsonPath("$[0].createdAt").exists());
    }

    @Test
    void shouldUseDefaultVersionWhenNotSpecified() throws Exception {
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].email").doesNotExist()); // v1.0 응답
    }
}

```

---

## 5. JSpecify Null Safety

JSpecify를 통한 표준화된 null 안전성 어노테이션을 지원합니다.

### 5.1 의존성 추가

```xml
<dependency>
    <groupId>org.jspecify</groupId>
    <artifactId>jspecify</artifactId>
    <version>1.0.0</version>
</dependency>

```

### 5.2 서비스 클래스에서 사용

```java
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;

@Service
public class UserService {

    private final UserRepository userRepository;

    // 반환값이 null일 수 있음을 명시
    public @Nullable User findByEmail(@NonNull String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    // 반환값이 절대 null이 아님을 보장
    public @NonNull User getById(@NonNull Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    // 컬렉션 내부 요소도 null이 아님
    public @NonNull List<@NonNull User> findActiveUsers() {
        return userRepository.findByActiveTrue();
    }

    // 파라미터가 null일 수 있음
    public @NonNull List<@NonNull User> searchUsers(
            @Nullable String name,
            @Nullable String email) {
        if (name == null && email == null) {
            return userRepository.findAll();
        }
        return userRepository.searchByNameOrEmail(name, email);
    }
}

```

### 5.3 Record와 함께 사용

```java
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;

public record CreateUserRequest(
    @NonNull String name,
    @NonNull String email,
    @Nullable String phoneNumber,
    @Nullable String address
) {
    // Compact Constructor로 검증
    public CreateUserRequest {
        Objects.requireNonNull(name, "name must not be null");
        Objects.requireNonNull(email, "email must not be null");
    }
}

public record UserResponse(
    @NonNull Long id,
    @NonNull String name,
    @NonNull String email,
    @Nullable String phoneNumber,
    @Nullable LocalDateTime lastLoginAt
) {}

```

### 5.4 패키지 레벨 설정

```java
// package-info.java
@NullMarked  // 패키지 내 모든 타입이 기본적으로 NonNull
package com.example.myapp.domain;

import org.jspecify.annotations.NullMarked;

```

### 5.5 IntelliJ IDEA 설정

IntelliJ IDEA 2025.3+에서 컴파일 타임 null 체크를 활성화하려면:

1. **Settings** → **Editor** → **Inspections**
2. **Java** → **Probable bugs** → **Nullability problems**
3. **Configure annotations** 에서 JSpecify 어노테이션 추가

---

## 6. 내장 Resilience 기능

Spring Framework 7에 `@Retryable`, `@ConcurrencyLimit` 어노테이션이 통합되었습니다.

### 6.1 설정 활성화

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableResilientMethods;

@Configuration
@EnableResilientMethods
public class ResilienceConfig {
}

```

### 6.2 기본 @Retryable 사용

```java
import org.springframework.retry.annotation.Retryable;

@Service
public class NotificationService {

    // 기본 설정: 3번 재시도, 1초 간격
    @Retryable
    public void sendNotification(String message) {
        // 외부 API 호출
        externalNotificationApi.send(message);
    }
}

```

### 6.3 상세 설정: 지수 백오프

```java
@Service
public class NotificationService {

    @Retryable(
        includes = { MessageDeliveryException.class, TimeoutException.class },
        excludes = { InvalidMessageException.class },
        maxAttempts = 5,
        delay = 100,        // 초기 지연 (ms)
        jitter = 10,        // 지터 (ms)
        multiplier = 2,     // 지수 배수
        maxDelay = 1000     // 최대 지연 (ms)
    )
    public void sendNotificationWithBackoff(String notification) {
        log.info("Attempting to send notification: {}", notification);
        messagingClient.send(notification);
    }

    // 재시도 실패 시 폴백 메서드
    @Recover
    public void recoverFromFailure(MessageDeliveryException e, String notification) {
        log.error("Failed to send notification after retries: {}", notification);
        // 폴백 로직: 큐에 저장, 알림 등
        failedNotificationRepository.save(new FailedNotification(notification, e.getMessage()));
    }
}

```

### 6.4 리액티브 지원

```java
@Service
public class ReactiveNotificationService {

    @Retryable(maxAttempts = 5, delay = 100)
    public Mono<Void> sendReactiveNotification(String message) {
        return webClient.post()
            .uri("/notifications")
            .bodyValue(new NotificationRequest(message))
            .retrieve()
            .bodyToMono(Void.class);
    }

    @Retryable(maxAttempts = 3, delay = 200, multiplier = 2)
    public Flux<NotificationResult> sendBatchNotifications(List<String> messages) {
        return Flux.fromIterable(messages)
            .flatMap(msg -> webClient.post()
                .uri("/notifications")
                .bodyValue(new NotificationRequest(msg))
                .retrieve()
                .bodyToMono(NotificationResult.class));
    }
}

```

### 6.5 @ConcurrencyLimit

```java
@Service
public class HeavyProcessingService {

    // 최대 10개의 동시 실행만 허용
    @ConcurrencyLimit(10)
    public Result processHeavyTask(Request request) {
        log.info("Processing heavy task: {}", request.getId());
        // CPU 집약적 작업
        return performHeavyComputation(request);
    }

    // 동시성 제한 + 재시도 조합
    @ConcurrencyLimit(5)
    @Retryable(maxAttempts = 3)
    public Report generateReport(ReportRequest request) {
        return reportGenerator.generate(request);
    }
}

```

### 6.6 RetryTemplate (프로그래매틱 방식)

```java
import org.springframework.retry.RetryPolicy;
import org.springframework.retry.RetryTemplate;

@Service
public class JmsNotificationService {

    private final JmsClient jmsClient;
    private final RetryTemplate retryTemplate;

    public JmsNotificationService(JmsClient jmsClient) {
        this.jmsClient = jmsClient;

        // RetryPolicy 생성
        RetryPolicy retryPolicy = RetryPolicy.builder()
            .includes(MessageDeliveryException.class)
            .excludes(InvalidDestinationException.class)
            .maxAttempts(5)
            .delay(Duration.ofMillis(100))
            .jitter(Duration.ofMillis(10))
            .multiplier(2)
            .maxDelay(Duration.ofSeconds(1))
            .build();

        this.retryTemplate = new RetryTemplate(retryPolicy);
    }

    public void sendToQueue(String destination, Object message) {
        retryTemplate.execute(() -> {
            jmsClient.destination(destination).send(message);
            return null;
        });
    }

    public <T> T sendAndReceive(String destination, Object message, Class<T> responseType) {
        return retryTemplate.execute(() ->
            jmsClient.destination(destination)
                .sendAndReceive(message, responseType)
        );
    }
}

```

---

## 7. OpenTelemetry 스타터

분산 추적과 메트릭을 위한 OpenTelemetry 통합을 제공합니다.

### 7.1 의존성 추가

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-opentelemetry</artifactId>
</dependency>

```

### 7.2 설정 (application.yml)

```yaml
management:
  otlp:
    metrics:
      export:
        url: http://localhost:4318/v1/metrics
        step: 10s
    tracing:
      endpoint: http://localhost:4318/v1/traces
  tracing:
    sampling:
      probability: 1.0  # 개발환경: 100%, 운영환경: 0.1 권장
  metrics:
    tags:
      application: my-application
      environment: ${SPRING_PROFILES_ACTIVE:local}

```

### 7.3 @Observed 어노테이션 사용

```java
import io.micrometer.observation.annotation.Observed;

@Service
public class PaymentService {

    @Observed(
        name = "payment.process",
        contextualName = "process-payment",
        lowCardinalityKeyValues = {"payment.type", "card"}
    )
    public PaymentResult processPayment(String orderId, BigDecimal amount) {
        log.info("Processing payment for order: {}", orderId);

        // 결제 로직
        PaymentResult result = paymentGateway.charge(orderId, amount);

        log.info("Payment completed: {}", result.getTransactionId());
        return result;
    }

    @Observed(name = "payment.refund")
    public RefundResult refundPayment(String transactionId, BigDecimal amount) {
        return paymentGateway.refund(transactionId, amount);
    }
}

```

### 7.4 @MeterTag로 동적 태그 추가

```java
import io.micrometer.core.annotation.Timed;
import io.micrometer.core.annotation.Counted;
import io.micrometer.core.aop.MeterTag;

@Service
public class OrderService {

    @Timed(value = "order.processing.time", description = "Order processing time")
    @Counted(value = "order.processed.count", description = "Number of orders processed")
    public Order processOrder(
            @MeterTag(key = "order.type") String orderType,
            @MeterTag(key = "customer.tier") String customerTier,
            OrderRequest request) {

        log.info("Processing {} order for {} customer", orderType, customerTier);
        return orderProcessor.process(request);
    }

    @Timed("order.fulfillment.time")
    public FulfillmentResult fulfillOrder(
            @MeterTag(key = "fulfillment.method") String method,
            @MeterTag(key = "warehouse.region") String region,
            String orderId) {

        return fulfillmentService.fulfill(orderId, method, region);
    }
}

```

### 7.5 커스텀 Span 생성

```java
import io.micrometer.tracing.Tracer;
import io.micrometer.tracing.Span;

@Service
@RequiredArgsConstructor
public class ComplexBusinessService {

    private final Tracer tracer;

    public void performComplexOperation(String operationId) {
        Span parentSpan = tracer.nextSpan().name("complex-operation").start();

        try (Tracer.SpanInScope ws = tracer.withSpan(parentSpan)) {
            // Step 1
            Span step1Span = tracer.nextSpan().name("step-1-validation").start();
            try {
                validateInput(operationId);
            } finally {
                step1Span.end();
            }

            // Step 2
            Span step2Span = tracer.nextSpan().name("step-2-processing").start();
            try {
                processData(operationId);
            } finally {
                step2Span.end();
            }

            // Step 3
            Span step3Span = tracer.nextSpan().name("step-3-notification").start();
            try {
                sendNotification(operationId);
            } finally {
                step3Span.end();
            }
        } finally {
            parentSpan.end();
        }
    }
}

```

---

## 8. Kotlin Serialization 지원

kotlinx.serialization을 Spring Boot와 통합하여 사용할 수 있습니다.

### 8.1 의존성 추가 (build.gradle.kts)

```kotlin
plugins {
    kotlin("plugin.serialization") version "2.2.20"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-kotlin-serialization")
}

```

### 8.2 설정 (application.yml)

```yaml
spring:
  kotlin:
    serialization:
      json:
        pretty-print: true
        ignore-unknown-keys: true
        encode-defaults: false
        explicit-nulls: false

```

### 8.3 데이터 클래스 정의

```kotlin
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerialName

@Serializable
data class User(
    val id: Long,
    val name: String,
    val email: String,
    @SerialName("phone_number")
    val phoneNumber: String? = null,
    val roles: List<String> = emptyList()
)

@Serializable
data class CreateUserRequest(
    val name: String,
    val email: String,
    @SerialName("phone_number")
    val phoneNumber: String? = null
)

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

```

### 8.4 컨트롤러에서 사용

```kotlin
import kotlinx.serialization.json.Json
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService,
    private val json: Json  // 자동 주입
) {

    @GetMapping
    fun getUsers(): List<User> = userService.findAll()

    @GetMapping("/{id}")
    fun getUser(@PathVariable id: Long): ApiResponse<User> {
        val user = userService.findById(id)
        return ApiResponse(success = true, data = user)
    }

    @PostMapping
    fun createUser(@RequestBody request: CreateUserRequest): ApiResponse<User> {
        val user = userService.create(request)
        return ApiResponse(success = true, data = user)
    }

    // 커스텀 JSON 직렬화
    @GetMapping("/{id}/raw")
    fun getUserRaw(@PathVariable id: Long): String {
        val user = userService.findById(id)
        return json.encodeToString(User.serializer(), user)
    }
}

```

### 8.5 커스텀 Serializer

```kotlin
import kotlinx.serialization.*
import kotlinx.serialization.descriptors.*
import kotlinx.serialization.encoding.*
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

object LocalDateTimeSerializer : KSerializer<LocalDateTime> {
    private val formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME

    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("LocalDateTime", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: LocalDateTime) {
        encoder.encodeString(value.format(formatter))
    }

    override fun deserialize(decoder: Decoder): LocalDateTime {
        return LocalDateTime.parse(decoder.decodeString(), formatter)
    }
}

@Serializable
data class Event(
    val id: Long,
    val name: String,
    @Serializable(with = LocalDateTimeSerializer::class)
    val startTime: LocalDateTime,
    @Serializable(with = LocalDateTimeSerializer::class)
    val endTime: LocalDateTime
)

```

---

## 9. BeanRegistrar

조건부 또는 동적 빈 등록을 위한 프로그래매틱 방식을 제공합니다.

### 9.1 기본 사용법

```java
import org.springframework.beans.factory.config.BeanDefinitionRegistry;
import org.springframework.beans.factory.support.RootBeanDefinition;
import org.springframework.context.annotation.BeanRegistrar;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class DynamicBeanConfig implements BeanRegistrar {

    @Override
    public void registerBeans(BeanDefinitionRegistry registry) {
        // 피처 플래그에 따른 조건부 빈 등록
        if (isFeatureEnabled("advanced-logging")) {
            registry.registerBeanDefinition(
                "advancedLogger",
                new RootBeanDefinition(AdvancedLogger.class)
            );
        }

        if (isFeatureEnabled("metrics-collector")) {
            registry.registerBeanDefinition(
                "metricsCollector",
                new RootBeanDefinition(MetricsCollector.class)
            );
        }
    }

    private boolean isFeatureEnabled(String feature) {
        return Boolean.parseBoolean(
            System.getenv("FEATURE_" + feature.toUpperCase().replace("-", "_"))
        );
    }
}

```

### 9.2 환경 기반 빈 등록

```java
@Configuration(proxyBeanMethods = false)
public class EnvironmentBasedBeanConfig implements BeanRegistrar {

    @Override
    public void registerBeans(BeanDefinitionRegistry registry) {
        String env = System.getProperty("spring.profiles.active", "local");

        switch (env) {
            case "production":
                registerProductionBeans(registry);
                break;
            case "staging":
                registerStagingBeans(registry);
                break;
            default:
                registerDevelopmentBeans(registry);
        }
    }

    private void registerProductionBeans(BeanDefinitionRegistry registry) {
        RootBeanDefinition cacheDef = new RootBeanDefinition(RedisCacheService.class);
        cacheDef.setScope("singleton");
        registry.registerBeanDefinition("cacheService", cacheDef);

        registry.registerBeanDefinition(
            "emailService",
            new RootBeanDefinition(ProductionEmailService.class)
        );
    }

    private void registerDevelopmentBeans(BeanDefinitionRegistry registry) {
        registry.registerBeanDefinition(
            "cacheService",
            new RootBeanDefinition(InMemoryCacheService.class)
        );

        registry.registerBeanDefinition(
            "emailService",
            new RootBeanDefinition(MockEmailService.class)
        );
    }
}

```

### 9.3 플러그인 기반 빈 등록

```java
@Configuration(proxyBeanMethods = false)
public class PluginBeanConfig implements BeanRegistrar {

    @Override
    public void registerBeans(BeanDefinitionRegistry registry) {
        // 플러그인 디렉토리 스캔
        List<String> plugins = discoverPlugins();

        for (String plugin : plugins) {
            try {
                Class<?> pluginClass = Class.forName(plugin);
                String beanName = generateBeanName(pluginClass);

                RootBeanDefinition definition = new RootBeanDefinition(pluginClass);
                definition.setLazyInit(true);

                registry.registerBeanDefinition(beanName, definition);
                log.info("Registered plugin bean: {}", beanName);
            } catch (ClassNotFoundException e) {
                log.warn("Plugin class not found: {}", plugin);
            }
        }
    }

    private List<String> discoverPlugins() {
        // 플러그인 설정 파일 읽기 또는 디렉토리 스캔
        return List.of(
            "com.example.plugins.PaymentPlugin",
            "com.example.plugins.NotificationPlugin",
            "com.example.plugins.ReportPlugin"
        );
    }

    private String generateBeanName(Class<?> clazz) {
        String simpleName = clazz.getSimpleName();
        return Character.toLowerCase(simpleName.charAt(0)) + simpleName.substring(1);
    }
}

```

---

## 10. RestTestClient

통합 테스트를 위한 새로운 테스트 클라이언트입니다.

### 10.1 기본 사용법

```java
import org.springframework.boot.test.web.client.RestTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class UserControllerIntegrationTest {

    @Autowired
    private RestTestClient restTestClient;

    @Test
    void shouldGetAllUsers() {
        restTestClient.get()
            .uri("/api/users")
            .exchange()
            .expectStatus().isOk()
            .expectHeader().contentType(MediaType.APPLICATION_JSON)
            .expectBodyList(User.class)
            .hasSize(10)
            .contains(expectedUser);
    }

    @Test
    void shouldGetUserById() {
        restTestClient.get()
            .uri("/api/users/{id}", 1L)
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.id").isEqualTo(1)
            .jsonPath("$.name").isNotEmpty()
            .jsonPath("$.email").value(email ->
                assertThat(email.toString()).contains("@"));
    }

    @Test
    void shouldCreateUser() {
        CreateUserRequest request = new CreateUserRequest(
            "John Doe",
            "john@example.com"
        );

        restTestClient.post()
            .uri("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(request)
            .exchange()
            .expectStatus().isCreated()
            .expectBody(User.class)
            .value(user -> {
                assertThat(user.getId()).isNotNull();
                assertThat(user.getName()).isEqualTo("John Doe");
                assertThat(user.getEmail()).isEqualTo("john@example.com");
            });
    }
}

```

### 10.2 인증이 필요한 테스트

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SecuredEndpointTest {

    @Autowired
    private RestTestClient restTestClient;

    @Test
    void shouldAccessProtectedEndpoint() {
        restTestClient.get()
            .uri("/api/admin/users")
            .header("Authorization", "Bearer " + getValidToken())
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(User.class)
            .hasSize(greaterThan(0));
    }

    @Test
    void shouldRejectUnauthorizedAccess() {
        restTestClient.get()
            .uri("/api/admin/users")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    void shouldRejectForbiddenAccess() {
        restTestClient.get()
            .uri("/api/admin/users")
            .header("Authorization", "Bearer " + getUserToken()) // 일반 사용자 토큰
            .exchange()
            .expectStatus().isForbidden();
    }
}

```

### 10.3 에러 응답 테스트

```java
@Test
void shouldReturn404WhenUserNotFound() {
    restTestClient.get()
        .uri("/api/users/{id}", 99999L)
        .exchange()
        .expectStatus().isNotFound()
        .expectBody()
        .jsonPath("$.error").isEqualTo("User not found")
        .jsonPath("$.code").isEqualTo("USER_NOT_FOUND")
        .jsonPath("$.timestamp").isNotEmpty();
}

@Test
void shouldReturn400ForInvalidRequest() {
    CreateUserRequest invalidRequest = new CreateUserRequest("", "invalid-email");

    restTestClient.post()
        .uri("/api/users")
        .contentType(MediaType.APPLICATION_JSON)
        .bodyValue(invalidRequest)
        .exchange()
        .expectStatus().isBadRequest()
        .expectBody()
        .jsonPath("$.errors").isArray()
        .jsonPath("$.errors[?(@.field == 'name')]").exists()
        .jsonPath("$.errors[?(@.field == 'email')]").exists();
}

```

---

## 11. Redis Static Master/Replica

Redis Master/Replica 구성을 위한 정적 설정을 지원합니다.

### 11.1 설정 (application.yml)

```yaml
spring:
  data:
    redis:
      masterreplica:
        nodes:
          - redis://master.example.com:6379
          - redis://replica1.example.com:6379
          - redis://replica2.example.com:6379
        read-from: REPLICA_PREFERRED  # MASTER, REPLICA, REPLICA_PREFERRED
      lettuce:
        pool:
          max-active: 20
          max-idle: 10
          min-idle: 5

```

### 11.2 읽기/쓰기 분리

```java
@Service
@RequiredArgsConstructor
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    // 쓰기는 Master로
    public void put(String key, Object value, Duration ttl) {
        redisTemplate.opsForValue().set(key, value, ttl);
    }

    // 읽기는 Replica에서 (설정에 따라 자동 라우팅)
    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void evict(String key) {
        redisTemplate.delete(key);
    }
}

```

### 11.3 MicrometerTracing 자동 구성

```yaml
# Redis 메트릭 및 트레이싱 활성화
management:
  metrics:
    export:
      prometheus:
        enabled: true
  tracing:
    sampling:
      probability: 1.0

# Redis 트레이싱 설정
spring:
  data:
    redis:
      lettuce:
        micrometer:
          enabled: true  # 메트릭 수집
          tracing: true  # 분산 추적

```

---

## 12. 주요 의존성 업그레이드

| 라이브러리 | 버전 |
| --- | --- |
| **Micrometer** | 1.16 |
| **Micrometer Tracing** | 1.6 |
| **Reactor** | 2025.0 |
| **Spring Security** | 7.0 |
| **Spring Data** | 2025.1 |
| **Spring Batch** | 6.0 |
| **Hibernate** | 7.1 |
| **Jackson** | 3.0 |
| **Tomcat** | 11.0 |
| **Jetty** | 12.1 |
| **Kotlin** | 2.2.20 |
| **TestContainers** | 2.0 |
| **MongoDB Driver** | 5.6.0 |
| **Elasticsearch Client** | 9.1 |

---

## 13. 기타 개선사항

### 13.1 JmsClient 자동 구성

```java
@Service
@RequiredArgsConstructor
public class MessageService {

    private final JmsClient jmsClient;

    public void sendMessage(String destination, Object message) {
        jmsClient.destination(destination).send(message);
    }

    public <T> T sendAndReceive(String destination, Object message, Class<T> responseType) {
        return jmsClient.destination(destination)
            .sendAndReceive(message, responseType);
    }
}

```

### 13.2 Virtual Thread 지원 HTTP 클라이언트

```yaml
spring:
  threads:
    virtual:
      enabled: true  # Virtual Thread 활성화
  http:
    client:
      virtual-threads: true  # HTTP 클라이언트에서 Virtual Thread 사용

```

```java
@Configuration
public class VirtualThreadHttpClientConfig {

    @Bean
    public RestClient restClient(RestClient.Builder builder) {
        return builder
            .baseUrl("https://api.example.com")
            .requestFactory(new JdkClientHttpRequestFactory(
                HttpClient.newBuilder()
                    .executor(Executors.newVirtualThreadPerTaskExecutor())
                    .build()
            ))
            .build();
    }
}

```

### 13.3 콘솔 로깅 비활성화

```yaml
logging:
  console:
    enabled: false  # 콘솔 로깅 완전 비활성화
  file:
    name: logs/application.log

```

### 13.4 Elasticsearch API Key 인증

```yaml
spring:
  elasticsearch:
    uris: https://elasticsearch.example.com:9200
    api-key: your-api-key-here  # 새로운 API Key 인증 방식

```

### 13.5 Tomcat 정적 캐시 크기 설정

```yaml
server:
  tomcat:
    resource:
      cache-max-size: 102400  # 100MB (KB 단위)
      allow-linking: true

```

### 13.6 TaskDecorator 다중 빈 지원

```java
@Configuration
public class AsyncConfig {

    @Bean
    public TaskDecorator loggingTaskDecorator() {
        return runnable -> {
            MDC.put("async", "true");
            return () -> {
                try {
                    runnable.run();
                } finally {
                    MDC.remove("async");
                }
            };
        };
    }

    @Bean
    public TaskDecorator securityTaskDecorator() {
        return runnable -> {
            SecurityContext context = SecurityContextHolder.getContext();
            return () -> {
                try {
                    SecurityContextHolder.setContext(context);
                    runnable.run();
                } finally {
                    SecurityContextHolder.clearContext();
                }
            };
        };
    }
}

```

---

## 14. 마이그레이션 가이드

### 14.1 javax → jakarta 마이그레이션

```java
// Before (Spring Boot 2.x)
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.validation.constraints.NotNull;
import javax.servlet.http.HttpServletRequest;

// After (Spring Boot 4.x)
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;
import jakarta.servlet.http.HttpServletRequest;

```

### 14.2 프로퍼티 변경

```yaml
# Before
spring:
  dao:
    exceptiontranslation:
      enabled: true
management:
  tracing:
    enabled: true

# After
spring:
  persistence:
    exceptiontranslation:
      enabled: true
management:
  tracing:
    export:
      enabled: true

```

### 14.3 Spring Retry → Framework Resilience

```java
// Before (Spring Retry)
@EnableRetry
@Configuration
public class RetryConfig {
}

@Service
public class MyService {
    @org.springframework.retry.annotation.Retryable(
        value = Exception.class,
        maxAttempts = 3
    )
    public void doSomething() { }
}

// After (Spring Framework 7 Resilience)
@EnableResilientMethods
@Configuration
public class ResilienceConfig {
}

@Service
public class MyService {
    @org.springframework.retry.annotation.Retryable(
        includes = Exception.class,
        maxAttempts = 3
    )
    public void doSomething() { }
}

```

### 14.4 Jackson 2.x → 3.0

```java
// Jackson 3.0 패키지 변경
// Before
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonProperty;

// After (동일하지만 내부 동작 변경 확인 필요)
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonProperty;

// 주요 변경사항:
// - 기본적으로 더 엄격한 JSON 파싱
// - 일부 deprecated 메서드 제거
// - 성능 개선

```

### 14.5 제거된 기능

```yaml
# 더 이상 지원하지 않는 설정들
spring:
  mvc:
    pathmatch:
      matching-strategy: ant_path_matcher  # 제거됨
      use-suffix-pattern: true             # 제거됨
      use-registered-suffix-pattern: true  # 제거됨
    servlet:
      load-on-startup: 1

```

### 14.6 마이그레이션 체크리스트

```markdown
## Spring Boot 4.0 마이그레이션 체크리스트

### 필수 사항
- [ ] JDK 17 이상 확인
- [ ] javax.* → jakarta.* 패키지 변경
- [ ] build.gradle 또는 pom.xml 의존성 업데이트
- [ ] application.yml 프로퍼티 이름 변경

### Spring Framework 7 적용
- [ ] @EnableRetry → @EnableResilientMethods 변경
- [ ] Spring Retry 어노테이션 속성명 확인 (value → includes)

### 테스트
- [ ] JUnit 4 → JUnit 5 마이그레이션
- [ ] RestTestClient 사용 검토
- [ ] 통합 테스트 실행 확인

### 선택적 개선
- [ ] HTTP Service Clients 도입 검토
- [ ] API Versioning 적용 검토
- [ ] JSpecify Null Safety 도입
- [ ] OpenTelemetry 설정
- [ ] Virtual Thread 활성화 검토

```

---

## 📚 참고 자료

- [Spring Boot 4.0 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes)
- [Spring Framework 7.0 Documentation](https://docs.spring.io/spring-framework/reference/)
- [JSpecify Official Site](https://jspecify.dev/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Kotlin Serialization Guide](https://kotlinlang.org/docs/serialization.html)

---

> 📅 문서 작성일: 2025년 12월 12일
> 
> 
> ✍️ **작성자**: Claude AI
> 
> 🏷️ **버전**: 1.0
>
