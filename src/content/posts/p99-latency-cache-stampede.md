---
title: 캐시가 만료되는 0.3초 동안 무슨 일이 일어났나
description: 매일 오전 9시 정각에 튀던 p99 지연의 원인은 캐시 스탬피드였습니다. 확률적 조기 갱신으로 피크를 82% 줄인 과정을 공유합니다.
date: 2026-10-28
category: infra
author: 김도윤
role: Backend Platform
cover: /media/cover-infra.jpg
featured: true
---

매일 오전 9시 정각, 주문 API의 p99 지연이 180ms에서 2.4초로 튀었습니다. 트래픽은 평소의 1.3배 수준이었고 CPU와 메모리에도 여유가 있었습니다. 그런데도 9시 00분 00초부터 약 0.3초 동안 DB 커넥션 풀이 바닥났습니다.

## 증상: 정각에만 무너지는 시스템

처음에는 출근 시간 트래픽 탓이라고 생각했습니다. 그런데 트래픽 그래프는 완만하게 올라가는데 지연 그래프만 칼같이 정각에 튀었습니다. 트래픽이 원인이었다면 이런 모양이 나올 수 없습니다.

로그를 1초 단위로 다시 집계하자 패턴이 드러났습니다. 정각마다 같은 캐시 키 수백 개가 **동시에** 만료되고 있었습니다. 캐시 워밍 배치가 자정에 모든 키를 TTL 9시간으로 한꺼번에 채워 넣고 있었던 겁니다.

## 원인: 같은 순간에 만료되는 키들

캐시가 비는 순간, 그 키를 요청한 모든 워커가 동시에 DB로 갑니다. 이른바 캐시 스탬피드(thundering herd)입니다. 키 하나에 동시 요청이 400개라면 DB 쿼리도 400번 나갑니다. 결과는 모두 같은데도요.

```ts
// Before: 만료되면 모두가 DB로 간다
async function get(key: string) {
  const hit = await cache.get(key);
  if (hit) return hit;
  const value = await db.load(key); // ← 400개 워커가 동시에 여기 도착
  await cache.set(key, value, { ttl: 9 * 3600 });
  return value;
}
```

## 해결: 확률적 조기 갱신

해결책은 두 가지를 섞었습니다. 첫째, TTL에 ±10% 지터를 줘서 만료 시점을 흩뜨렸습니다. 둘째, 만료가 가까워질수록 높은 확률로 **한 요청만** 미리 갱신하게 했습니다(XFetch 알고리즘).

```ts
// After: 만료 직전, 확률적으로 한 명만 미리 갱신한다
const BETA = 1.0;

async function get(key: string) {
  const entry = await cache.getWithMeta(key);
  const now = Date.now() / 1000;
  const shouldRefresh =
    !entry || now - entry.delta * BETA * Math.log(Math.random()) >= entry.expiry;

  if (!shouldRefresh) return entry.value;

  const start = Date.now();
  const value = await db.load(key);
  const delta = (Date.now() - start) / 1000;
  const ttl = 9 * 3600 * (0.9 + Math.random() * 0.2); // ±10% jitter
  await cache.setWithMeta(key, value, { ttl, delta });
  return value;
}
```

## 결과

배포 다음 날 오전 9시, p99는 2.4초에서 430ms로 내려갔습니다. 피크 시점의 DB 쿼리 수는 82% 줄었습니다. 커넥션 풀 고갈 알람은 그 뒤로 한 번도 울리지 않았습니다.

> 캐시는 성능 도구이기 전에 동시성 문제입니다. 만료 시점을 설계하지 않으면 캐시는 장애를 예약해 둔 셈이 됩니다.

## 남은 숙제

키 단위 락(singleflight)도 검토했지만, 인스턴스가 여러 대인 환경에서는 분산 락 비용이 더 컸습니다. 다음 글에서는 분산 환경의 요청 병합(request coalescing)을 다룰 예정입니다.
