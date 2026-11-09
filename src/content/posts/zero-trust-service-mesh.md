---
title: 사내망을 믿지 않기로 했다
description: VPN 안쪽이면 안전하다는 가정을 버리고, 서비스 간 모든 호출에 mTLS와 정책 검사를 붙인 1년의 기록.
date: 2026-08-25
category: security
author: 정민재
role: Security Engineering
cover: /media/cover-security.jpg
---

"내부망이니까 괜찮다"는 말은 침해 사고 보고서에 가장 자주 등장하는 문장입니다. 우리는 이 가정을 지우기로 했습니다.

## 모든 호출에 신원을

서비스 메시를 도입해 모든 서비스 간 통신에 mTLS를 적용했습니다. 이제 IP가 아니라 워크로드 신원으로 접근을 판단합니다.

```rego
package authz

default allow := false

allow if {
  input.source.service == "order-api"
  input.destination.service == "payment-api"
  input.request.method == "POST"
}
```

## 점진적 적용

한 번에 차단하면 장애가 납니다. 처음 3개월은 감사(audit) 모드로만 돌리면서 실제 호출 그래프를 수집했고, 그 그래프로 정책 초안을 자동 생성했습니다.

## 결과

허용 목록에 없는 호출은 이제 기본적으로 거부됩니다. 지난 레드팀 훈련에서 측면 이동(lateral movement) 시나리오는 첫 단계에서 막혔습니다.
