---
title: "500개의 풀 리퀘스트 리뷰 후 발견한 모든 Java 개발자가 저지르는 실수들"
description: "500개 PR 리뷰에서 발견한 Java 흔한 실수들"
date: 2026-03-16T09:19:58.296Z
tags: ["Java"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/500-java-1773652790973.png"
---

## 😮 500개의 풀 리퀘스트를 리뷰한 후, 놀라운 것들을 발견했습니다...

"코드 리뷰는 멋져 보이지만, 하루에 15번째 풀 리퀘스트를 열어보고 이런 코드를 보게 되면:"

```java
if (optional.isPresent()) {
    return optional.get();
}

```

**축하합니다!** 🎉 당신은 방금 **NullPointerException 2.0**을 발명했습니다 — 이번에는 더 화려한 포장지와 함께 말이죠.

저는 500개 이상의 PR을 리뷰했습니다. 어떤 것들은 개발자가 된 것을 자랑스럽게 만들었습니다. 하지만 다른 것들은 직업을 바꿔서 염소 농장을 시작하고 싶게 만들었습니다.

가장 흔한 Java 개발자들의 실수들에 대해 이야기해보겠습니다 — 비판하기 위해서가 아니라, **더 깔끔하고 정상적인 코드를 작성하는 데 도움**을 주기 위해서입니다.

## 1. Optional: 계속 포장만 하는 선물

```java
Optional<String> name = getUserName();
if (name.isPresent()) {
    System.out.println(name.get());
}

```

이건 Optional이 아닙니다. 이건 **추가 단계를 거친 null**입니다. Optional은 `null`을 방지해야 하는데, `.isPresent()`와 `.get()`으로 disguise하는 것이 아닙니다.

✅ **더 나은 방법:**

```java
getUserName().ifPresent(System.out::println);

```

✅ **훨씬 더 나은 방법:** `map()`, `flatMap()`, `orElse()`를 사용해서 실제로 값과 작업하세요.

**밈 같은 생각:** `.isPresent()`가 당신의 가장 친한 친구라면, 당신은 Optional을 사용하는 게 아니라 희망을 사용하고 있는 겁니다.

## 2. 인터페이스당 돈을 받는 것처럼 추상화하기

"'IUserServiceFactoryProviderInterface'를 추가하고 그것을 'UserLogicExecutorModule'에 주입하자."

**왜??**

과도한 추상화는 아무도 이해할 수 없는 시스템을 만드는 방법입니다 — 심지어 2주 후의 당신도 말이죠.

✅ **경험 법칙:** 두 번 복제하기 전까지는 추상화하지 마세요.

**밈 같은 순간:** 하나의 구현체로 인터페이스를 만들 때마다, 소프트웨어 아키텍트 한 명이 날개를 잃습니다.

## 3. 스트림: 우아함이 혼돈으로 변할 때

```java
List<String> names = users.stream()
    .filter(u -> u.getAge() > 18)
    .map(User::getName)
    .sorted()
    .collect(Collectors.toList());

```

깔끔하고 좋습니다. 하지만 그 다음:

```java
users.stream()
    .flatMap(group -> group.getMembers().stream())
    .collect(Collectors.groupingBy(...))
    ... // 혼돈이 계속됩니다

```

이제 당신의 **한 줄 코드**가 **순서도와 간식 휴식**을 필요로 합니다.

✅ **규칙:** 디버깅이 필요하다면 — **스트림하지 마세요**.

**밈 같은 지혜:** 4줄을 절약하기 위해 코드를 수수께끼로 바꾸지 마세요.

## 4. 🔥 가변성: 조용한 살인자

매개변수로 받은 것을 변경하는 메서드:

```java
public void update(User user) {
    user.setStatus("INACTIVE");
}

```

팡! 이제 당신의 앱은 예측 불가능합니다.

✅ **항상 불변 패턴을 선호하세요:**

- 새 객체 반환
- final 사용
- 입력 값을 건드리지 마세요

**밈 같은 경고:** 입력을 변경하는 것은 누군가의 커피에 침을 뱉고도 그대로 건네는 것과 같습니다. 기술적으로는 작동하지만 — 하지 마세요.

## 5. 😅 단위 테스트 없음 = 프로덕션에서 혼돈

"작은 변경이었어요, 테스트가 필요하다고 생각하지 않았어요."

맞습니다. 비행기 날개의 작은 나사 하나처럼 말이죠.

✅ **황금 법칙:** 코드가 **분기**한다면, **테스트**가 필요합니다.

**밈 같은 순간:** 테스트 없음? 신뢰 없음. 미래의 자신조차도 믿지 않습니다.

## 6. 로깅: 소음의 벽 또는 완전한 침묵

**너무 많은 로그:**

```java
System.out.println("Entering method A");
System.out.println("Still in method A");
System.out.println("Exiting method A");

```

**로그 제로:**

```java
// 아무것도 없음, 주석조차 없음

```

✅ **더 나은 로깅 전략:**

- 개발자를 위해 `DEBUG` 사용
- 주요 작업에 `INFO` 사용
- 뭔가 터질 때 `ERROR` 사용
- 비밀번호, 토큰, 주말 후회는 절대 로그하지 마세요

**밈 같은 교훈:** 로그가 소설을 쓸 수 있거나, 더 나쁘게는 아무것도 쓰지 않는다면 — 잘못하고 있는 겁니다.

## 7. 🧱 지옥에서 온 생성자

```java
public UserService(UserRepo repo, EmailService email, Validator val,
                  Logger logger, Clock clock, MetricsRegistry reg,
                  Cache cache, Config cfg, ...) {

```

이 생성자는 자신만의 생성자가 필요합니다.

✅ **다음을 사용해서 리팩터링하세요:**

- 빌더
- 설정 객체
- 서비스 분할

**밈 같은 밈:** 생성자가 6개 이상의 매개변수를 가진다면, 클래스가 신뢰 문제를 가지고 있습니다.

## 8. 😬 객체 비교에 == 사용하기

```java
if (user.getRole() == Role.ADMIN) // 나쁨

```

**enum**을 비교하는 게 아니라면, `==`을 사용하지 마세요. 절대.

✅ **안전하게 `.equals()` 사용하기:**

```java
if (Role.ADMIN.equals(user.getRole()))

```

**밈 같은 화상:** 문자열에 `==`를 사용하는 것은 `NullPointerException` 신들을 소환하는 방법입니다.

## 9. 📝 명예의 훈장처럼 주석 거부하기

"깔끔한 코드는 주석이 필요 없어요." 확실히. 새벽 2시에 아무도 당신의 멋진 알고리즘을 이해하지 못할 때까지는 말이죠.

✅ **다음에 대해 짧고 유용한 주석을 남기세요:**

- 까다로운 로직
- 임시방편
- 비즈니스 규칙

**밈 같은 펀치라인:** 미래의 자신이 설명하지 않은 것 때문에 당신을 때리고 싶어한다면 — 주석을 달아두세요.

## 10. 🪓 유틸리티 클래스 과부하

"헬퍼들을 만나보세요:"

- `StringUtils`
- `DateUtils`
- `EverythingUtils`

그리고 갑자기 **God class 2.0**을 구축했습니다.

✅ **대신:**

- 헬퍼를 작고 범위가 좁게 유지
- 가능할 때 실제 서비스 클래스 사용

**밈 같은 로스트:** 유틸리티 클래스가 메인 서비스보다 더 많은 메서드를 가진다면 — 도움이 되는 게 아니라 저장하고 있는 겁니다.

## 11. 마음을 부수는 일관성 없는 네이밍

```java
String name;
String[] names;
Set<String> name_set;

```

**스타일을 선택하고 고수하세요. 카멜 케이스든, 스네이크 케이스든 — 일관성만 유지하면 됩니다.**

✅ **팁:**

- 컬렉션에는 복수형
- 무작위 축약어 피하기
- 사람들이 이해할 수 있는 단어 사용

**밈 같은 생각:** 변수 이름에 범례가 필요하다면 — 이미 전쟁에서 진 겁니다.

## 12. 🧍‍♂️ 인간이 아닌 기계를 위한 코드 작성

컴파일러는 코드를 유지보수하지 않습니다. **사람이 합니다.**

✅ **인간 친화적으로 만드세요:**

- 깔끔한 이름
- 논리적 구조
- 필요한 곳에 주석

**밈 같은 만트라:** 코드는 비밀이 아닙니다 — 비밀처럼 작성하지 마세요.

## 리뷰받고 싶은 Java 개발자가 되세요

완벽할 필요는 없습니다. 신중하기만 하면 됩니다.

✅ Optional 남용 피하기

✅ 스트림을 책임감 있게 사용

✅ 현명하게 로깅

✅ 테스트 작성

✅ 복잡한 로직 설명

✅ 이름을 잘 짓기

✅ 소유하지 않은 것을 변경하지 마세요

PR이 공포 소설처럼 보여도 걱정하지 마세요 — 우리 모두 그런 경험이 있습니다.

하지만 이제? 더 잘 아니까요.

## 🙌 웃거나 무언가를 배웠다면

박수를 보내주세요. 아마 두 번이나. 또는 50번이나.

그리고 리뷰어가 보기 전에 그 PR을 리팩터링하러 가세요. 😅

`#Java` `#CodeReview` `#CleanCode` `#ProgrammingHumor` `#DeveloperLife` `#SoftwareEngineering` `#PullRequests`

---

**출처:** [I Reviewed 500 Pull Requests — Here's What Every Java Dev Gets Wrong](https://blog.stackademic.com/i-reviewed-500-pull-requests-heres-what-every-java-dev-gets-wrong-7d2706faa33d) by Kavya's Programming Path on Stackademic
