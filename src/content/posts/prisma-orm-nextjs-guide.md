---
title: "Prisma ORM 완전 정복: Next.js 프로젝트에서 왜 Prisma를 써야 하는가"
description: "Next.js에서 Prisma ORM 도입과 활용 가이드"
date: 2026-03-17T02:27:13.325Z
tags: ["React & Nextjs"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/prisma-orm-nextjs-guide-1773713552257.png"
---

> **작성일:** 2025년 3월
> 

---

![cover](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1773713541065-vs5gih.png)

## 들어가며

백엔드 개발에서 데이터베이스 연동은 피할 수 없는 과제다. SQL을 직접 작성하면 유연하지만 타입 안전성이 없고, 기존 ORM들은 타입 지원이 부족하거나 설정이 복잡하다. 그렇다면 **TypeScript 기반의 현대적인 풀스택 환경**에서 최선의 선택은 무엇일까?

이 글에서는 최근 Next.js 생태계에서 빠르게 자리를 잡아가고 있는 **Prisma ORM**을 깊이 있게 살펴보고, 왜 Next.js 프로젝트에서 Prisma가 사실상의 표준(de facto standard)이 되어가고 있는지를 실제 코드와 함께 설명한다.

---

## Prisma란 무엇인가?

**Prisma**는 Node.js 및 TypeScript 환경을 위한 차세대 ORM(Object-Relational Mapper)이다. 2019년 처음 등장해 2021년 v1.0을 릴리즈한 이후, GitHub Star 40,000개를 넘으며 빠르게 성장한 오픈소스 프로젝트다.

Prisma는 단순한 ORM이 아니라 **3가지 핵심 도구의 모음**으로 이루어져 있다.

| 도구 | 역할 |
| --- | --- |
| **Prisma Client** | 자동 생성되는 타입 안전(Type-safe) 쿼리 빌더 |
| **Prisma Migrate** | 선언적 데이터 마이그레이션 관리 도구 |
| **Prisma Studio** | 데이터베이스를 시각적으로 탐색하는 GUI |

### 지원 데이터베이스

- PostgreSQL
- MySQL / MariaDB
- SQLite
- SQL Server
- MongoDB (Preview)
- CockroachDB

---

## 기존 ORM과 무엇이 다른가?

### 전통적인 ORM의 문제점

TypeORM, Sequelize 같은 전통적 ORM들은 오랜 역사를 가지고 있지만, TypeScript 환경에서는 다음과 같은 한계를 가진다.

```tsx
// TypeORM 예시 - 반환 타입이 불분명하다
const users = await userRepository.find({
  where: { active: true },
  relations: ['posts']
});
// users의 타입? User[] 이지만 posts가 실제로 로드됐는지는 런타임에서만 알 수 있다
```

- **관계 데이터의 타입 불안전**: `relations`로 조인한 데이터의 타입이 런타임까지 보장되지 않는다.
- **N+1 문제 발생 가능성**: 관계 데이터를 명시적으로 처리하지 않으면 쿼리가 폭발적으로 증가한다.
- **스키마와 코드의 불일치**: 모델 정의가 분산되어 있어 DB 실제 상태와 코드가 어긋나기 쉽다.

### Prisma의 접근 방식

Prisma는 `schema.prisma`라는 **단일 진실 공급원(Single Source of Truth)** 에서 출발한다. 이 파일 하나로부터 타입, 마이그레이션, 클라이언트가 모두 생성된다.

```
schema.prisma
     │
     ├──► Prisma Migrate → SQL 마이그레이션 파일
     ├──► Prisma Client  → 완벽히 타입화된 쿼리 빌더
     └──► Prisma Studio  → DB GUI
```

---

## 핵심 개념: Prisma Schema

모든 것은 `prisma/schema.prisma` 파일에서 시작된다.

```
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts     Post[]
  profile   Profile?
}

model Post {
  id          Int      @id @default(autoincrement())
  title       String
  content     String?
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())

  author      User     @relation(fields: [authorId], references: [id])
  authorId    Int

  categories  Category[]
}

model Profile {
  id     Int     @id @default(autoincrement())
  bio    String?
  user   User    @relation(fields: [userId], references: [id])
  userId Int     @unique
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
```

### Schema의 주요 어트리뷰트

| 어트리뷰트 | 설명 | 예시 |
| --- | --- | --- |
| `@id` | 기본 키 지정 | `@id` |
| `@default()` | 기본값 설정 | `@default(now())`, `@default(autoincrement())` |
| `@unique` | 유니크 제약 | `@unique` |
| `@updatedAt` | 자동 업데이트 타임스탬프 | `@updatedAt` |
| `@relation` | 관계 정의 | `@relation(fields: [...], references: [...])` |
| `@@index` | 복합 인덱스 | `@@index([email, name])` |

---

## Next.js 프로젝트 셋업 가이드

### 1단계: 설치

```bash
npm install prisma @prisma/client
npx prisma init
```

`prisma init` 실행 시 다음 파일들이 생성된다:

- `prisma/schema.prisma` — 스키마 정의 파일
- `.env` — 환경변수 파일 (DATABASE_URL 포함)

### 2단계: 환경변수 설정

```
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

### 3단계: 마이그레이션

스키마를 작성한 후 DB에 반영한다.

```bash
# 개발환경: 마이그레이션 파일 생성 + DB 적용
npx prisma migrate dev --name init

# 프로덕션: 마이그레이션만 적용
npx prisma migrate deploy
```

마이그레이션 실행 시 `prisma/migrations/` 폴더에 버전별 SQL 파일이 자동 생성된다.

```
prisma/
└── migrations/
    ├── 20250301000000_init/
    │   └── migration.sql
    └── 20250310000000_add_profile/
        └── migration.sql
```

### 4단계: Prisma Client 싱글톤 설정

Next.js에서는 개발 환경에서 Hot Reload로 인해 Prisma Client 인스턴스가 중복 생성되는 문제가 발생할 수 있다. 이를 방지하는 싱글톤 패턴을 사용한다.

```tsx
// lib/prisma.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

---

## Prisma Client 주요 CRUD 패턴

### 데이터 조회 (Read)

```tsx
import { prisma } from '@/lib/prisma'

// 단일 레코드 조회
const user = await prisma.user.findUnique({
  where: { id: 1 },
})

// null 반환 대신 에러를 던지고 싶을 때
const user = await prisma.user.findUniqueOrThrow({
  where: { email: 'admin@example.com' },
})

// 조건 검색
const activeUsers = await prisma.user.findMany({
  where: {
    posts: {
      some: { published: true }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 0,
})

// 관계 데이터 함께 조회 (include)
const userWithPosts = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    },
    profile: true,
  },
})

// 필드 선택 (select) - 필요한 데이터만 가져와 성능 최적화
const userNames = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    _count: {
      select: { posts: true }
    }
  }
})
```

### 데이터 생성 (Create)

```tsx
// 단일 생성
const newUser = await prisma.user.create({
  data: {
    email: 'sangwook@example.com',
    name: '김상욱',
    profile: {
      create: {
        bio: '개발팀 3팀 차장'
      }
    }
  },
  include: { profile: true }
})

// 다중 생성 (Batch)
await prisma.post.createMany({
  data: [
    { title: '첫 번째 포스트', authorId: 1 },
    { title: '두 번째 포스트', authorId: 1 },
  ],
  skipDuplicates: true,
})
```

### 데이터 수정 (Update)

```tsx
// 단일 업데이트
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: '김상욱 (수정됨)',
    posts: {
      updateMany: {
        where: { published: false },
        data: { published: true }
      }
    }
  }
})

// upsert (없으면 생성, 있으면 업데이트)
const user = await prisma.user.upsert({
  where: { email: 'sangwook@example.com' },
  update: { name: '김상욱' },
  create: {
    email: 'sangwook@example.com',
    name: '김상욱',
  }
})
```

### 데이터 삭제 (Delete)

```tsx
// 단일 삭제
await prisma.user.delete({
  where: { id: 1 }
})

// 조건 삭제
await prisma.post.deleteMany({
  where: {
    published: false,
    createdAt: { lt: new Date('2024-01-01') }
  }
})
```

---

## 강력한 필터링 시스템

Prisma의 `where` 절은 SQL의 거의 모든 연산을 타입 안전하게 표현할 수 있다.

```tsx
// 복합 조건
const posts = await prisma.post.findMany({
  where: {
    AND: [
      { published: true },
      { createdAt: { gte: new Date('2025-01-01') } },
      {
        OR: [
          { title: { contains: 'Prisma', mode: 'insensitive' } },
          { content: { startsWith: '오늘' } }
        ]
      },
      { author: { NOT: { name: null } } }
    ]
  }
})

// 숫자 범위 필터
const recentPosts = await prisma.post.findMany({
  where: {
    id: { in: [1, 2, 3] },
  }
})

// 관계 필터
const usersWithManyPosts = await prisma.user.findMany({
  where: {
    posts: { some: { published: true } },
    _count: { posts: { gt: 5 } }  // Prisma 5.x에서 지원
  }
})
```

---

## 트랜잭션 처리

데이터 정합성이 중요한 작업은 트랜잭션으로 처리한다.

```tsx
// 방법 1: $transaction 배열 (병렬 처리)
const [newUser, newPost] = await prisma.$transaction([
  prisma.user.create({ data: { email: 'test@test.com', name: 'Test' } }),
  prisma.post.create({ data: { title: 'Test Post', authorId: 1 } }),
])

// 방법 2: Interactive Transaction (권장 - 롤백 가능)
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'new@example.com', name: '신규유저' }
  })

  // 비즈니스 로직 검증
  if (user.id > 1000) {
    throw new Error('사용자 수 한도 초과') // 자동 롤백
  }

  const post = await tx.post.create({
    data: {
      title: '첫 포스트',
      authorId: user.id
    }
  })

  return { user, post }
})
```

---

## Next.js App Router와의 통합

### Server Component에서 직접 사용

```tsx
// app/users/page.tsx (Server Component)
import { prisma } from '@/lib/prisma'

export default async function UsersPage() {
  // 서버 컴포넌트에서 직접 DB 조회 가능
  const users = await prisma.user.findMany({
    include: {
      _count: { select: { posts: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <h2>{user.name}</h2>
          <p>포스트: {user._count.posts}개</p>
        </div>
      ))}
    </div>
  )
}
```

### Route Handler (API Route)

```tsx
// app/api/posts/route.ts
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '10')

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.post.count()
  ])

  return NextResponse.json({
    data: posts,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      authorId: body.authorId,
    }
  })

  return NextResponse.json(post, { status: 201 })
}
```

### Server Action에서 사용

```tsx
// app/actions/post.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  await prisma.post.create({
    data: { title, content, authorId: 1 }
  })

  revalidatePath('/posts') // 캐시 갱신
}
```

---

## Prisma의 타입 시스템 활용

Prisma가 생성하는 타입을 활용하면 코드 전반에 걸쳐 일관된 타입을 유지할 수 있다.

```tsx
import { Prisma, User, Post } from '@prisma/client'

// 자동 생성된 타입 직접 사용
type UserWithPosts = Prisma.UserGetPayload<{
  include: {
    posts: { include: { categories: true } }
    profile: true
  }
}>

// 이 타입은 include 구조를 정확히 반영한다
function renderUser(user: UserWithPosts) {
  console.log(user.profile?.bio)          // Profile | null
  console.log(user.posts[0].categories)   // Category[]
  // 타입 자동완성 완벽 지원!
}

// 입력 타입 활용
type CreateUserInput = Prisma.UserCreateInput
type UpdatePostInput = Prisma.PostUpdateInput

async function updatePost(id: number, data: UpdatePostInput) {
  return prisma.post.update({ where: { id }, data })
}
```

---

## Prisma Migrate 전략

### 개발 환경

```bash
# 스키마 변경 후 마이그레이션 생성 및 적용
npx prisma migrate dev --name add_user_role

# DB를 스키마에 맞게 강제 리셋 (데이터 초기화)
npx prisma migrate reset
```

### 프로덕션 환경

```bash
# 마이그레이션 상태 확인
npx prisma migrate status

# 프로덕션 마이그레이션 적용 (새 파일만 실행)
npx prisma migrate deploy
```

### package.json 스크립트 설정

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:generate": "prisma generate",
    "postinstall": "prisma generate"
  }
}
```

---

## 시딩(Seeding): 초기 데이터 삽입

```tsx
// prisma/seed.ts
import { prisma } from '../lib/prisma'

async function main() {
  // 카테고리 생성
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Technology' },
      update: {},
      create: { name: 'Technology' }
    }),
    prisma.category.upsert({
      where: { name: 'DevOps' },
      update: {},
      create: { name: 'DevOps' }
    })
  ])

  // 관리자 계정 생성
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: '관리자',
      profile: { create: { bio: '시스템 관리자' } },
      posts: {
        create: [
          {
            title: 'Prisma ORM 시작하기',
            content: '이 포스트는 시드 데이터입니다.',
            published: true,
            categories: { connect: [{ id: categories[0].id }] }
          }
        ]
      }
    }
  })

  console.log(`시드 완료: 관리자(${admin.email}) 생성됨`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

```json
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## 성능 최적화 팁

### 1. select로 필요한 필드만 조회

```tsx
// ❌ 모든 필드 조회 (비효율)
const users = await prisma.user.findMany()

// ✅ 필요한 필드만 선택
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true }
})
```

### 2. 페이지네이션 적용

```tsx
// 커서 기반 페이지네이션 (대용량 데이터에 적합)
const posts = await prisma.post.findMany({
  take: 10,
  cursor: { id: lastPostId },  // 마지막 조회된 ID
  skip: 1,                     // cursor 자체는 스킵
  orderBy: { id: 'asc' }
})
```

### 3. $queryRaw로 복잡한 쿼리 처리

```tsx
// 복잡한 집계나 Raw SQL이 필요할 때
const result = await prisma.$queryRaw<{ count: bigint; month: string }[]>`
  SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as count
  FROM posts
  WHERE published = true
  GROUP BY month
  ORDER BY month DESC
  LIMIT 12
`
```

### 4. 인덱스 설정

```
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  authorId  Int
  createdAt DateTime @default(now())

  @@index([authorId])           // 단일 인덱스
  @@index([authorId, createdAt]) // 복합 인덱스
}
```

---

## Prisma를 써야 하는 이유 총정리

### ✅ 완벽한 TypeScript 타입 안전성

쿼리 결과에 대해 `include`/`select` 구조까지 정확히 반영된 타입이 자동 생성된다. IDE 자동완성이 완벽하게 동작하며, 런타임 에러를 컴파일 타임에 잡을 수 있다.

### ✅ 단일 진실 공급원 (schema.prisma)

DB 스키마, 타입, 마이그레이션이 모두 하나의 파일에서 파생된다. 코드와 DB가 절대 어긋나지 않는다.

### ✅ 직관적이고 선언적인 API

SQL을 몰라도 복잡한 관계 쿼리를 자연스럽게 표현할 수 있다. 중첩 생성(`nested create`), 연결(`connect`), 끊기(`disconnect`) 등 관계 조작이 매우 직관적이다.

### ✅ 자동화된 마이그레이션

스키마 변경 → 마이그레이션 파일 자동 생성 → 버전 관리가 자동화된다. Flyway처럼 별도 마이그레이션 도구를 관리할 필요가 없다.

### ✅ Next.js App Router와의 최고 궁합

Server Component, Server Action, Route Handler 어디서든 바로 사용할 수 있다. Vercel의 공식 Next.js 예시에서도 Prisma를 기본 ORM으로 사용한다.

### ✅ Prisma Studio — 개발 생산성 향상

```bash
npx prisma studio
```

로컬에서 실행되는 GUI 도구로, DB를 직접 시각적으로 조회하고 수정할 수 있다. 개발 중 데이터 확인 작업이 극적으로 빨라진다.

---

## Prisma vs 경쟁 도구 비교

| 기준 | Prisma | TypeORM | Drizzle ORM | Sequelize |
| --- | --- | --- | --- | --- |
| TypeScript 지원 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 학습 곡선 | 낮음 | 중간 | 낮음 | 중간 |
| 마이그레이션 | 자동화 | 수동/자동 | 수동 | 수동 |
| 번들 사이즈 | 중간 | 큼 | 매우 작음 | 큼 |
| 생태계/커뮤니티 | 매우 활발 | 활발 | 성장 중 | 오래됨 |
| Raw SQL 지원 | 지원 | 지원 | 우수 | 지원 |
| GUI 도구 | Studio 내장 | 없음 | 없음 | 없음 |

> **Drizzle ORM**도 최근 빠르게 성장하는 강력한 대안이지만, 마이그레이션 자동화와 Studio 같은 편의 기능은 Prisma가 앞선다. 번들 사이즈가 중요한 Edge Runtime 환경이라면 Drizzle을 고려할 만하다.
> 

---

## 주의사항 및 알려진 한계

**1. Prisma Client 번들 사이즈** Prisma Client는 런타임 의존성이 있어 Vercel Edge Runtime이나 Cloudflare Workers 같은 환경에서는 `@prisma/adapter-neon` 같은 별도 어댑터가 필요하다.

**2. 대용량 Batch 작업** `createMany`, `updateMany`는 `returning` 절 지원이 제한적이다. 대용량 배치에는 `$executeRaw`를 고려하자.

**3. Schema 변경 시 신중함 필요** `migrate dev`는 기존 데이터를 변경하거나 삭제할 수 있다. 프로덕션에서는 반드시 `migrate deploy`를 사용하고 마이그레이션 파일을 git으로 관리해야 한다.

---

## 마치며

Prisma는 "TypeScript + Node.js 기반 풀스택" 환경에서 **데이터베이스 작업을 가장 안전하고 생산적으로** 처리할 수 있는 도구다. 특히 Next.js App Router의 Server Component, Server Action과 조합하면 별도의 API 레이어 없이도 타입 안전하게 DB를 다룰 수 있다.

팀 프로젝트에서는 스키마 기반의 단일 진실 공급원, 자동화된 마이그레이션, Studio 도구의 조합이 팀원들의 온보딩 시간과 디버깅 시간을 크게 줄여준다.

처음에는 스키마 파일이나 마이그레이션 개념이 낯설게 느껴질 수 있지만, 한번 익숙해지면 그 전으로는 돌아갈 수 없다. 아직 Prisma를 써보지 않았다면, 지금 당장 새 Next.js 프로젝트에 적용해보길 강력히 권한다.

---

> 🔗 **참고 자료**
> 
> - [Prisma 공식 문서](https://www.prisma.io/docs)
> - [Prisma GitHub](https://github.com/prisma/prisma)
> - [Next.js + Prisma 예시 (Vercel)](https://vercel.com/templates/next.js/prisma)
> - [Prisma Discord 커뮤니티](https://pris.ly/discord)
