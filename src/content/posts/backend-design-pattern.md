---
title: "백엔드 디자인 패턴 10가지: 언제 쓰고, 어디까지 적용해야 할까?"
description: "기능 하나를 추가하려고 서비스 여러 개를 동시에 고친 경험이 있는가? 외부 API의 응답 필드 하나가 바뀌었을 뿐인데 주문 로직까지 손대야 했던 적은? 테스트 하나를 돌리기 위해 데이터베이스와 결제 서버를 모두 띄워야 한다면 어떨까?"
date: 2026-09-15T03:43:11.349Z
tags: ["Java","Performance"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/1789443728050-6a71tf.png"
---

기능 하나를 추가하려고 서비스 여러 개를 동시에 고친 경험이 있는가? 외부 API의 응답 필드 하나가 바뀌었을 뿐인데 주문 로직까지 손대야 했던 적은? 테스트 하나를 돌리기 위해 데이터베이스와 결제 서버를 모두 띄워야 한다면 어떨까?

이런 상황에서 개발 생산성을 결정하는 것은 기능을 구현하는 속도가 아니라 **변경이 퍼지는 범위**다.

디자인 패턴은 이 범위를 줄이는 도구다. 객체를 생성하는 위치를 한곳에 모으고, 자주 바뀌는 정책을 분리하고, 외부 장애가 내부로 번지는 것을 막는 식이다.

이 글은 Gopi C K의 [10 Backend Design Patterns Every Developer Should Know Before 2027](https://medium.com/@gopi_ck/10-backend-design-patterns-every-developer-should-know-before-2027-eae27a3c940b)에서 소개한 패턴 목록을 출발점으로 삼는다. 예시 코드, 적용 판단 기준, 주의사항은 따로 구성했다.

예시는 Java 21 문법과 Spring 기반 백엔드를 기준으로 한다. 구조에 집중하기 위해 import, 엔티티 매핑, 일부 의존 객체의 구현은 생략했다. 각 코드는 설명용 발췌이며, 하나의 완성된 애플리케이션을 이루지는 않는다.

---

## 먼저, 10가지 패턴을 한눈에 살펴보자

이 목록에는 객체 수준의 패턴, 애플리케이션 구조 패턴, 장애 대응 패턴이 함께 섞여 있다. 같은 규모의 문제를 다루는 것이 아니라는 점을 염두에 두자.

| 패턴 | 핵심 질문 |
|---|---|
| Repository | 데이터를 가져오는 방법을 어디에 둘까? |
| Factory | 어떤 구현 객체를 생성할까? |
| Singleton | 객체를 어떤 범위에서 하나만 공유할까? |
| Strategy | 같은 작업에 적용할 정책을 어떻게 바꿀까? |
| Observer | 사건이 발생했을 때 후속 처리를 어떻게 연결할까? |
| Builder | 설정이 많은 객체를 어떻게 읽기 쉽게 만들까? |
| Adapter | 외부 시스템의 규약을 내부 모델로 어떻게 바꿀까? |
| Decorator | 기존 기능에 부가 동작을 어떻게 덧붙일까? |
| CQRS | 상태 변경과 조회를 어떻게 분리할까? |
| Circuit Breaker | 실패하는 외부 호출을 언제 중단할까? |

패턴 이름을 외우기보다, 지금 코드에서 어떤 문제가 반복되는지부터 살펴보자.

## 1. Repository: 저장 방식과 업무 규칙 사이에 경계 만들기

### 문제: 업무 규칙을 읽으려는데 SQL부터 이해해야 한다

주문 취소 기능을 생각해 보자.

취소 가능 여부는 주문 상태에 따라 달라진다. 그런데 이 규칙이 SQL, 커넥션 처리, 결과 매핑과 한 메서드 안에 섞여 있다면 핵심 동작을 파악하기 어렵다.

Repository는 도메인 객체를 조회하고 저장하는 접근 지점을 제공한다. 호출자는 필요한 데이터를 요청할 뿐이고, 구체적인 저장소 접근은 그 뒤에서 처리된다. [Martin Fowler의 Repository 설명](https://martinfowler.com/eaaCatalog/repository.html)

### 예시: 주문 조회와 취소 규칙 분리하기

```java
interface OrderRepository {
    Optional<Order> findById(UUID id);
    void save(Order order);
}

@Service
class CancelOrderService {
    private final OrderRepository orders;

    CancelOrderService(OrderRepository orders) {
        this.orders = orders;
    }

    @Transactional
    public void cancel(UUID orderId) {
        Order order = orders.findById(orderId)
                .orElseThrow(() ->
                        new IllegalArgumentException("주문이 없습니다."));

        order.cancel();
        orders.save(order);
    }
}
```

`CancelOrderService`는 조회 결과를 받아 취소를 요청할 뿐이다. SQL이나 ORM의 세부 사항을 알 필요가 없다.

"이미 배송을 시작한 주문은 취소할 수 없다"와 같은 규칙은 `order.cancel()` 안에 둔다. 저장소 접근과 취소 가능 여부가 각각 다른 위치에서 관리된다.

### 적용할 때 주의할 점

Repository가 있다고 데이터베이스 교체가 쉬워지는 것은 아니다. 트랜잭션 격리 수준, 잠금, 쿼리 기능, 데이터 모델의 차이는 여전히 영향을 준다.

또한 Spring Data Repository로 충분한 프로젝트라면, 같은 메서드를 그대로 전달하기만 하는 계층을 하나 더 얹을 이유는 없다.

판단 기준은 **업무 코드에서 실제로 숨겨야 할 저장소 세부 사항이 있는가**다.

## 2. Factory: 객체 생성 규칙을 한곳에 모으기

### 문제: 객체를 만드는 조건문이 여러 곳에 반복된다

환경에 따라 콘솔 알림을 쓰기도 하고 SMTP 알림을 쓰기도 해야 한다고 가정하자.

각 서비스가 설정을 읽고 알림 객체를 직접 생성하면, 생성 규칙이 바뀔 때마다 여러 파일을 수정해야 한다.

Factory는 객체 생성의 책임을 한곳에 모은다.

### 예시: 설정에 맞는 알림 구현 생성하기

```java
interface Notifier {
    void send(String recipient, String message);
}

final class NotifierFactory {
    static Notifier create(
            String mode,
            Supplier<Notifier> smtpCreator
    ) {
        return switch (mode) {
            case "console" -> (recipient, message) ->
                    System.out.println(recipient + ": " + message);
            case "smtp" -> smtpCreator.get();
            default -> throw new IllegalArgumentException(
                    "지원하지 않는 알림 모드: " + mode);
        };
    }
}
```

SMTP 연결 설정처럼 복잡한 생성 절차는 `smtpCreator`로 넘긴다. 호출자는 반환된 `Notifier`의 동작만 사용하면 된다.

이 코드는 생성 로직을 한곳에 모은 **Simple Factory** 예시다. 상속을 이용하는 GoF의 Factory Method와는 구분해서 이해하는 것이 좋다.

### Factory가 해결하지 않는 것

새로운 모드를 추가하면 이 예시의 `switch`도 함께 수정해야 한다. Factory를 만들었다고 기존 코드 수정이 완전히 사라지는 것은 아니다.

얻는 이점은 **변경해야 할 위치가 명확해진다**는 것이다.

Spring이 이미 빈을 생성하고 주입해 준다면, 별도의 Factory 클래스 대신 설정 클래스의 `@Bean` 메서드만으로 충분할 수도 있다.

## 3. Singleton: 공유 객체의 범위를 정확히 이해하기

### 문제: 공유해도 되는 자원을 요청마다 새로 만든다

HTTP 클라이언트나 연결 풀처럼 재사용을 전제로 하는 객체를 매 요청마다 생성하면 자원을 불필요하게 소모한다.

Spring에서는 기본 singleton scope를 활용하면 된다. 다만 Spring의 싱글턴은 **컨테이너 안에서 빈 정의별로 하나**라는 뜻이다. 분산 시스템 전체에서 객체 하나를 공유한다는 뜻이 아니다. [Spring Bean Scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)

### 예시: HTTP 클라이언트 재사용하기

```java
@Configuration
class ClientConfig {
    @Bean
    HttpClient httpClient() {
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
    }
}
```

이 빈을 주입받는 서비스들은 같은 컨테이너 안에서 하나의 인스턴스를 공유한다.

서버가 세 대라면 각 서버의 컨테이너마다 별도 인스턴스가 존재한다.

### 가장 흔한 실수: 요청 데이터를 필드에 저장하기

다음 구조는 위험하다.

```java
@Service
class CheckoutService {
    private UUID currentUserId; // 요청마다 달라지는 값
}
```

여러 요청이 같은 서비스 객체를 사용하므로 서로의 값을 덮어쓸 수 있다.

요청별 값은 메서드 인자나 지역 변수로 전달해야 한다.

```java
public void checkout(UUID userId, UUID cartId) {
    // 요청별 값은 이 호출 안에서만 사용한다.
}
```

**객체가 하나라는 사실이 스레드 안전성을 보장하지는 않는다.**

연결 풀 역시 "연결 하나"가 아니다. 하나의 풀 객체가 여러 연결을 관리한다.

## 4. Strategy: 달라지는 정책을 교체 가능한 동작으로 만들기

### 문제: 하나의 계산 함수에 정책이 계속 추가된다

배송비가 주문 금액, 멤버십, 배송 지역에 따라 달라진다고 해 보자.

조건이 두 개 정도라면 `if`로 충분하다. 하지만 정책별 계산과 예외가 늘어나면 하나의 메서드에서 모두 관리하기 어려워진다.

Strategy는 바뀌는 동작을 별도의 객체로 분리한다.

### 예시: 배송비 정책 교체하기

```java
interface ShippingPolicy {
    long fee(long subtotalWon);
}

final class StandardShipping implements ShippingPolicy {
    @Override
    public long fee(long subtotalWon) {
        if (subtotalWon < 0) {
            throw new IllegalArgumentException("주문 금액은 음수일 수 없습니다.");
        }
        return subtotalWon >= 50_000 ? 0 : 3_000;
    }
}

final class MemberShipping implements ShippingPolicy {
    @Override
    public long fee(long subtotalWon) {
        if (subtotalWon < 0) {
            throw new IllegalArgumentException("주문 금액은 음수일 수 없습니다.");
        }
        return 0;
    }
}
```

정책을 사용하는 쪽은 구체적인 계산 방법을 몰라도 된다.

```java
ShippingPolicy policy = isMember
        ? new MemberShipping()
        : new StandardShipping();

long shippingFee = policy.fee(42_000);
```

금액은 이 예시의 통화 규칙에 맞춰 정수 원 단위로 표현했다. 소수점 단위가 있는 통화를 지원한다면 최소 화폐 단위를 정하거나, `BigDecimal`과 반올림 규칙을 명시해야 한다.

### Factory와 어떻게 다른가?

Factory는 **어떤 객체를 생성할지**에, Strategy는 **어떤 동작을 적용할지**에 관심이 있다.

Factory가 Strategy 객체를 만들어 줄 수도 있다. 하지만 간단한 정책 선택까지 반드시 Factory로 감쌀 필요는 없다.

## 5. Observer: 발생한 사건과 후속 처리를 분리하기

### 문제: 핵심 서비스가 후속 작업을 모두 알고 있다

게시글 공개 기능을 생각해 보자.

글이 공개되면 검색 색인을 갱신하고, 구독자 알림을 준비하고, 통계를 기록해야 할 수 있다. 이 호출을 모두 게시글 서비스에 넣으면 후속 작업이 하나 늘 때마다 핵심 서비스도 수정해야 한다.

Observer의 핵심은 사건을 알리는 쪽과 그 사건에 반응하는 쪽을 분리하는 데 있다.

### 예시: 글 공개 후 검색 색인 갱신하기

```java
record ArticlePublished(UUID articleId) {}

@Service
class ArticleService {
    private final ArticleRepository articles;
    private final ApplicationEventPublisher events;

    ArticleService(
            ArticleRepository articles,
            ApplicationEventPublisher events
    ) {
        this.articles = articles;
        this.events = events;
    }

    @Transactional
    public void publish(UUID id) {
        Article article = articles.findById(id).orElseThrow();
        article.publish();
        articles.save(article);

        events.publishEvent(new ArticlePublished(id));
    }
}
```

후속 동작은 별도 리스너가 담당한다.

```java
@Component
class SearchIndexListener {
    private final SearchIndexer indexer;

    SearchIndexListener(SearchIndexer indexer) {
        this.indexer = indexer;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void on(ArticlePublished event) {
        indexer.update(event.articleId());
    }
}
```

`AFTER_COMMIT`을 지정하면 트랜잭션이 정상적으로 커밋된 뒤에 리스너가 실행된다. 기본 설정에서는 트랜잭션 밖에서 발생한 이벤트를 이 리스너가 처리하지 않는다는 점도 알아 두자. [Spring Transaction-bound Events](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html)

### 이벤트를 쓴다고 자동으로 보장되지 않는 것

위 코드는 비동기 실행, 재시도, 이벤트의 영속적 보관을 보장하지 않는다.

DB 커밋 직후 프로세스가 종료되면 후속 작업을 놓칠 수 있다. 리스너가 실패하더라도 이미 커밋된 게시글이 자동으로 되돌아가지는 않는다.

유실되면 안 되는 작업이라면, 이벤트를 같은 트랜잭션 안에서 DB에 기록하는 Outbox 같은 설계를 검토해야 한다. 이벤트가 다시 전달될 수 있다면 중복 처리에도 대비해야 한다.

프로세스 내부의 Observer와 메시지 브로커를 사용하는 Pub/Sub는 개념적으로 연결되어 있지만, 전달 보장과 운영 방식은 다르다.

## 6. Builder: 설정이 많은 객체의 생성 과정을 읽기 쉽게 만들기

### 문제: 생성자 인자의 의미가 보이지 않는다

다음과 같은 코드는 읽는 사람에게 기억력 테스트를 요구한다.

```java
new ExportOptions("csv", true, false, 1000, "UTF-8");
```

두 불리언 값이 무엇을 뜻하는지 확인하려면 선언부로 이동해야 한다.

Builder는 설정 이름을 드러내면서 객체를 단계적으로 구성하게 해 준다.

### 예시: Java 표준 HTTP 요청 Builder

```java
HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create("https://api.example.com/products/42"))
        .timeout(Duration.ofSeconds(3))
        .header("Accept", "application/json")
        .GET()
        .build();
```

URI, 요청 제한 시간, 헤더, HTTP 메서드가 코드에 그대로 드러난다. 마지막 `build()`에서 요청 객체가 만들어진다. [Java HttpRequest.Builder](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.Builder.html)

### 언제 직접 만들면 좋을까?

선택 필드가 많거나 여러 생성 조합을 지원해야 할 때 유용하다. 필드가 두세 개인 단순한 값 객체라면 생성자나 `record`가 더 간단하다.

또한 Builder가 있다고 유효성 검사가 저절로 생기지는 않는다. 직접 구현한다면 필수값 누락이나 서로 상충하는 설정을 최종 생성 시점에 검증해야 한다.

## 7. Adapter: 외부 시스템의 표현을 내부 모델로 번역하기

### 문제: 외부 API의 표현이 업무 코드에 퍼진다

외부 창고 API가 재고 수량을 문자열로 반환한다고 가정하자.

```json
{
  "item_code": "SHOE-42",
  "available_qty": "12"
}
```

이를 그대로 사용하면 주문 서비스도 문자열을 숫자로 바꿔야 하고, 외부 필드 이름까지 알아야 한다.

Adapter는 외부 규약을 내부에서 쓰는 계약으로 변환한다.

### 예시: 창고 응답을 내부 재고 조회로 감싸기

```java
interface StockReader {
    int available(String sku);
}

record WarehouseResponse(
        String item_code,
        String available_qty
) {}

interface WarehouseClient {
    WarehouseResponse fetch(String sku);
}

final class WarehouseAdapter implements StockReader {
    private final WarehouseClient client;

    WarehouseAdapter(WarehouseClient client) {
        this.client = client;
    }

    @Override
    public int available(String sku) {
        WarehouseResponse response = client.fetch(sku);

        if (response == null || !sku.equals(response.item_code())) {
            throw new IllegalStateException("잘못된 창고 응답입니다.");
        }

        try {
            int quantity = Integer.parseInt(response.available_qty());
            if (quantity < 0) {
                throw new IllegalStateException("재고 수량이 음수입니다.");
            }
            return quantity;
        } catch (NumberFormatException e) {
            throw new IllegalStateException("재고 수량 형식이 잘못되었습니다.", e);
        }
    }
}
```

호출자는 `StockReader`만 사용한다. 외부 시스템의 필드 이름과 문자열 변환은 모두 Adapter 안에 모인다.

### 필드 이름 이상의 변환이 필요하다

실제 연동에서는 단위, 시간대, 상태 코드, 오류의 의미도 다를 수 있다.

특히 "재고 조회 실패"를 "재고 0개"로 바꿔 버리면 장애와 품절을 구분할 수 없다. 값의 형식을 맞추는 것만큼 **의미를 보존하는 것**이 중요하다.

## 8. Decorator: 같은 계약을 유지하면서 부가 동작 추가하기

### 문제: 측정 코드가 본래 기능을 가린다

재고 조회의 소요 시간을 측정하고 싶다고 하자.

Adapter 안에 측정 코드를 직접 넣을 수도 있다. 하지만 다른 재고 구현에도 같은 기능이 필요하면 코드가 반복된다.

Decorator는 기존 객체를 감싸서 같은 인터페이스를 제공하되, 앞뒤에 동작을 덧붙인다.

### 예시: 재고 조회 시간 측정하기

```java
final class TimedStockReader implements StockReader {
    private final StockReader delegate;
    private final LongConsumer recordNanos;

    TimedStockReader(
            StockReader delegate,
            LongConsumer recordNanos
    ) {
        this.delegate = delegate;
        this.recordNanos = recordNanos;
    }

    @Override
    public int available(String sku) {
        long started = System.nanoTime();
        try {
            return delegate.available(sku);
        } finally {
            recordNanos.accept(System.nanoTime() - started);
        }
    }
}
```

실제 조회는 `delegate`가 수행한다. Decorator는 조회의 성공 여부와 관계없이 경과 시간을 기록한다.

`recordNanos`에는 예외를 던지지 않는 계측 함수를 넘겨야 한다. 계측 실패가 원래 조회 결과나 예외를 덮어쓰지 않도록 하기 위해서다.

### Adapter와 구분하기

- Adapter는 서로 다른 계약을 변환한다.
- Decorator는 같은 계약을 유지하면서 기능을 덧붙인다.

여러 Decorator를 중첩하면 순서도 동작에 영향을 준다. 예를 들어 측정기가 캐시 바깥에 있으면 캐시 적중까지 측정하고, 안쪽에 있으면 실제 조회 시간만 측정한다.

Spring AOP나 미들웨어가 이미 요구를 충족한다면 별도의 래퍼를 만들 필요는 없다. 다만 모든 미들웨어를 엄밀한 의미의 Decorator로 분류할 수 있는 것은 아니다.

## 9. CQRS: 변경 모델과 조회 모델의 목적 분리하기

### 문제: 화면 조회 때문에 업무 모델이 복잡해진다

주문 취소에는 상태 전이 규칙이 필요하다. 반면 주문 목록 화면에는 주문 번호, 표시용 상태, 합계 정도만 있으면 된다.

두 작업을 같은 모델로 처리하려다 보면 목록 조회를 위해 불필요한 객체까지 로딩하거나, 화면 전용 필드가 업무 모델에 하나둘 늘어난다.

CQRS는 상태를 바꾸는 Command와 데이터를 읽는 Query에 서로 다른 모델을 쓸 수 있도록 분리한다. 반드시 데이터베이스나 서버를 나눠야 하는 것은 아니다. [Martin Fowler의 CQRS 설명](https://martinfowler.com/bliki/CQRS.html)

### 예시: 취소 명령과 목록 응답을 다르게 표현하기

```java
record CancelOrder(UUID orderId) {}

record OrderSummary(
        UUID orderId,
        String status,
        long totalWon
) {}
```

Command는 주문의 규칙을 거쳐 상태를 바꾼다.

```java
@Transactional
public void handle(CancelOrder command) {
    Order order = orders.findById(command.orderId()).orElseThrow();
    order.cancel();
    orders.save(order);
}
```

Query는 화면에 필요한 열만 직접 조회할 수 있다.

```sql
SELECT id AS order_id, status, total_won
FROM orders
WHERE customer_id = :customer_id
ORDER BY created_at DESC, id DESC
LIMIT :limit;
```

조회 결과는 `OrderSummary`로 매핑한다. 고객 식별자는 인증된 사용자에게 허용된 범위 안의 값이어야 한다.

### 처음부터 읽기 DB를 따로 만들 필요는 없다

같은 DB를 쓰면서 모델과 처리 경로만 분리하는 것부터 시작할 수 있다.

별도의 읽기 저장소를 운영하면 동기화 지연, 재처리, 장애 복구가 추가로 따라온다. 주문 직후 목록에 주문이 보이지 않는 상황을 사용자에게 어떻게 설명할지도 정해야 한다.

또한 CQRS와 Event Sourcing은 별개다. 이벤트를 상태의 원본으로 저장하지 않아도 CQRS를 적용할 수 있다.

단순 CRUD처럼 조회와 변경의 요구가 비슷하다면 분리 비용이 이익보다 클 수 있다.

## 10. Circuit Breaker: 실패하는 의존성으로 향하는 호출 제한하기

### 문제: 외부 서비스 장애가 내부 자원을 붙잡는다

외부 재고 서비스가 느려지면 호출 중인 요청이 쌓인다. 그 결과 내부 작업 스레드나 연결 자원이 부족해져 다른 기능까지 영향을 받는다.

Circuit Breaker는 관측된 실패율 등을 기준으로 호출을 일시적으로 차단한다.

| 상태 | 동작 |
|---|---|
| Closed | 호출을 허용하면서 결과를 관측한다. |
| Open | 호출을 보내지 않고 거부한다. |
| Half-open | 제한된 호출로 회복 여부를 확인한다. |

Resilience4j에서는 슬라이딩 윈도우, 최소 호출 수, 실패율 임계값 등을 설정할 수 있다. [Resilience4j CircuitBreaker](https://resilience4j.readme.io/docs/circuitbreaker)

### 예시: 재고 조회에 Circuit Breaker 적용하기

```java
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
        .slidingWindowType(
                CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
        .slidingWindowSize(20)
        .minimumNumberOfCalls(10)
        .failureRateThreshold(50)
        .waitDurationInOpenState(Duration.ofSeconds(10))
        .permittedNumberOfCallsInHalfOpenState(3)
        .build();

CircuitBreaker breaker =
        CircuitBreaker.of("warehouse", config);

StockReader protectedReader = sku ->
        breaker.executeSupplier(() -> adapter.available(sku));
```

`breaker`와 `protectedReader`는 애플리케이션 구성 시점에 한 번 생성해 재사용해야 한다. 요청마다 새로 만들면 이전 호출의 실패 기록이 쌓이지 않는다.

이 설정은 최소 10건이 모인 뒤, 최근 최대 20건을 기준으로 실패율을 평가한다. 회로가 열려 있으면 호출이 거부되므로, 상위 계층에서 이를 적절한 실패 응답으로 바꿔 줘야 한다.

### 타임아웃과 Circuit Breaker는 다른 역할이다

타임아웃은 **한 번의 호출을 얼마나 기다릴지** 정한다. Circuit Breaker는 **이 의존성으로 호출을 계속 보낼지** 정한다.

Circuit Breaker가 이미 실행 중인 느린 요청을 취소해 주지는 않는다. HTTP 클라이언트의 연결 및 요청 제한 시간은 별도로 설정해야 한다.

또한 모든 오류를 외부 장애로 세면 안 된다. 잘못된 입력처럼 재호출로 해결되지 않는 오류는 따로 분류해야 한다.

장애 시 재고를 임의로 0으로 반환하기보다, "현재 재고를 확인할 수 없음"을 명시하는 편이 정확하다.

---

## 패턴을 함께 사용할 때는 책임을 따라 연결하자

재고 조회 하나만 보더라도 여러 패턴이 자연스럽게 이어질 수 있다.

```text
주문 서비스
    ↓ 내부 계약: StockReader
Circuit Breaker로 보호된 호출
    ↓
조회 시간을 측정하는 Decorator
    ↓
외부 응답을 변환하는 Adapter
    ↓
창고 API
```

각 단계에는 독립적인 존재 이유가 있다.

- 업무 코드는 내부의 재고 조회 계약만 사용한다.
- 장애 제어는 외부 호출을 계속할지 결정한다.
- 계측은 실제 조회에 걸린 시간을 관측한다.
- Adapter는 외부 데이터를 내부 의미로 변환한다.

이 구조가 모든 프로젝트에 필요한 것은 아니다. 실제 요구가 없는 계층은 생략하면 된다.

또한 패턴을 조합했다고 업무 전체의 일관성까지 해결되지는 않는다. 예를 들어 "재고 확인"과 "결제" 사이에 다른 주문이 재고를 소진할 수 있다. 이를 막으려면 재고 예약, 조건부 갱신 같은 별도의 동시성 설계가 필요하다.

## 패턴을 도입하기 전에 확인할 세 가지

### 1. 지금 어떤 변경이 반복되는가?

"언젠가 외부 업체가 바뀔 수 있다"보다 "현재 두 업체의 응답 변환이 세 서비스에 중복되어 있다"가 Adapter 도입의 더 구체적인 근거다.

### 2. 도입한 뒤 변경 위치가 줄어드는가?

인터페이스와 클래스는 늘었는데 기능을 추가할 때마다 수정하는 파일 수가 그대로라면, 경계를 잘못 나눴을 가능성이 크다.

### 3. 기존 도구가 이미 해결하고 있는가?

Spring의 빈 관리, Spring Data의 저장소 추상화, 표준 라이브러리의 Builder를 먼저 살펴보자. 같은 구조를 직접 다시 만들 이유가 있는지 확인해야 한다.

## 마무리: 패턴 이름보다 변경의 경계를 보자

디자인 패턴을 이해했다는 것은 정의를 외웠다는 뜻이 아니다.

새로운 요구가 들어왔을 때 다음을 설명할 수 있어야 한다.

- 어디가 바뀌는가?
- 그 변경이 왜 그 위치에 있어야 하는가?
- 어떤 비용과 제약이 추가되는가?
- 더 단순한 방법으로도 해결할 수 있는가?

좋은 패턴 적용은 반복되는 문제를 줄이고, 다음 개발자가 변경할 위치를 쉽게 찾도록 만든다.

지금 프로젝트에서 가장 자주 수정하는 메서드 하나를 골라 보자. 그 안에 저장소 접근, 객체 생성, 정책 선택, 외부 규약, 장애 처리가 얼마나 섞여 있는지 살펴보면 된다.

**그중 실제로 다른 이유로 바뀌는 부분을 하나 분리하는 것**, 그것이 디자인 패턴을 실무에 적용하는 가장 좋은 시작이다.
![exec d818ba55 25b4 40b1 85f6 63d14de426ce](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1789443722046-xcesx9.png)
