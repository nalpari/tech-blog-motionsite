---
title: "Spring Boot에서 ResponseBodyAdvice로 API 응답을 통합하는 가장 간단한 방법"
description: "ResponseBodyAdvice로 API 응답 자동 통합 포맷팅"
date: 2026-03-17T02:27:13.325Z
tags: ["Java","Performance"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/spring-boot-responsebodyadvice-api-1773711619311.png"
---

> 수동 응답 래퍼는 이제 그만. 단일하고 우아한 컴포넌트를 사용하여 모든 REST API 응답을 자동으로 일관되게 포맷하는 방법을 배워보세요.
> 

## 문제 상황

Spring Boot에서 REST API를 구축하는 모든 개발자가 직면하는 과제가 있습니다. 바로 모든 응답이 일관된 구조를 공유하기를 원한다는 것입니다. 성공 응답은 상태와 데이터를 포함해야 하고, 오류 응답은 오류 코드와 메시지를 포함해야 합니다.

순진한 접근 방식은 모든 컨트롤러 메서드에서 수동으로 래퍼 객체를 만드는 것입니다:

```java
// 우리가 제거하고 싶은 수동 보일러플레이트
@GetMapping("/user/{id}")
public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
    User user = userService.findById(id);
    ApiResponse<User> response = new ApiResponse<>("success", user);
    return ResponseEntity.ok(response);
}

```

이 방법은 작동하지만, DRY(Don't Repeat Yourself) 원칙을 명백히 위반합니다. 컨트롤러를 어지럽히고 데이터 가져오기의 관심사와 응답 포맷팅의 관심사를 혼합합니다.

다행히도 Spring Boot는 이 정확한 문제를 위한 목적에 맞는 우아한 솔루션을 제공합니다: **ResponseBodyAdvice**

## ResponseBodyAdvice란?

`ResponseBodyAdvice`는 Spring Framework의 인터페이스로, 컨트롤러 메서드가 반환한 후 HTTP 메시지 변환기에 의해 응답 본문이 작성되기 전에 응답을 가로채고 수정할 수 있게 해줍니다.

간단히 말해, 모든 REST 엔드포인트에서 나가는 모든 응답에 대한 글로벌 후처리 훅입니다.

## 솔루션: ResponseBodyAdvice 구현

다음은 모든 API 응답을 통합하는 완전한 구현입니다:

### 1단계: 통합 응답 클래스 생성

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {
    private String status;
    private T data;
    private String message;

    // 성공 응답을 위한 편의 생성자
    public ApiResponse(String status, T data) {
        this.status = status;
        this.data = data;
    }
}

```

### 2단계: ResponseBodyAdvice 구현

```java
@ControllerAdvice
public class GlobalResponseHandler implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType,
                          Class<? extends HttpMessageConverter<?>> converterType) {
        // 모든 컨트롤러 메서드에 이 어드바이스 적용
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body,
                                 MethodParameter returnType,
                                 MediaType selectedContentType,
                                 Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                 ServerHttpRequest request,
                                 ServerHttpResponse response) {

        // 이미 래핑된 응답이면 그대로 반환
        if (body instanceof ApiResponse) {
            return body;
        }

        // 원시 응답을 ApiResponse로 래핑
        return new ApiResponse<>("success", body);
    }
}

```

### 3단계: 컨트롤러 단순화

이제 컨트롤러가 훨씬 깔끔해집니다:

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // 수동 래핑 없이 사용자 객체만 반환
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }
}

```

## 작동 방식

1. 컨트롤러 메서드가 `User` 객체를 반환합니다
2. Spring이 응답을 JSON으로 변환하기 전에 `GlobalResponseHandler`를 호출합니다
3. `beforeBodyWrite` 메서드가 `User`를 `ApiResponse<User>`로 자동 래핑합니다
4. 클라이언트는 일관된 형식의 응답을 받습니다:

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
    }
}

```

## 고급 기능: 예외 처리 추가

완전한 솔루션을 위해 예외 처리를 추가할 수 있습니다:

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(
            ResourceNotFoundException ex) {

        ApiResponse<Void> response = new ApiResponse<>();
        response.setStatus("error");
        response.setMessage(ex.getMessage());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(
            Exception ex) {

        ApiResponse<Void> response = new ApiResponse<>();
        response.setStatus("error");
        response.setMessage("Internal server error");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                           .body(response);
    }
}

```

## 주요 장점

1. **DRY 원칙 준수**: 응답 래핑 로직을 한 곳에서 작성
2. **깔끔한 컨트롤러**: 비즈니스 로직에 집중
3. **일관성**: 모든 엔드포인트에서 균일한 응답 형식
4. **유지보수성**: 응답 구조 변경이 필요하면 한 곳만 수정
5. **테스트 용이성**: 컨트롤러가 더 간단해져서 테스트가 쉬워짐

## 주의사항

- `supports()` 메서드에서 특정 컨트롤러나 메서드를 제외하려면 조건을 추가할 수 있습니다
- `String` 응답을 반환하는 경우 특별한 처리가 필요할 수 있습니다 (Spring의 `StringHttpMessageConverter` 때문)
- 이미 래핑된 응답(`ApiResponse` 인스턴스)은 다시 래핑되지 않도록 확인합니다

## 결론

`ResponseBodyAdvice`는 Spring Boot에서 API 응답을 통합하는 강력하면서도 간단한 방법입니다. 보일러플레이트 코드를 제거하고, 관심사의 분리를 개선하며, 코드베이스의 일관성을 유지하는 데 도움이 됩니다.

수동 래퍼에 작별을 고하고 깔끔하고 유지보수하기 쉬운 컨트롤러를 만나보세요!

---

## 출처

원문: [The Simplest Way to Unify API Responses in Spring Boot with ResponseBodyAdvice](https://medium.com/@umeshcapg/the-simplest-way-to-unify-api-responses-in-spring-boot-with-responsebodyadvice-0158ff4c7aec)

작성자: Umesh Capg

플랫폼: Medium
