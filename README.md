# RUNTIME

[blog.devgrr.kr](https://blog.devgrr.kr) — Engineering 팀이 운영하며 배운 것을 기록하는 정적 테크 블로그입니다. 장애 회고, 설계 결정, 그 사이의 트레이드오프를 글 단위로 남깁니다.

Astro로 빌드한 정적 사이트입니다. 홈은 히어로 영상, 이번 주 글, 태그 필터가 있는 아카이브이고, 글 페이지는 목차·읽기 시간·라이트/다크 테마·[giscus](https://giscus.app) 댓글을 붙입니다.

## 요구 사항

- Node.js `>=22.23.4`
- [pnpm](https://pnpm.io) (락파일은 `pnpm-lock.yaml`)

## 로컬에서 실행

```sh
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # ./dist
pnpm preview    # 빌드 결과 미리보기
```

사이트 이름, 소개, 글쓴이는 `src/site.ts` 한 곳에서 바꿉니다.

## 글 추가

`src/content/posts/<slug>.md`를 만들면 `/posts/<slug>/`로 나갑니다. 파일 이름이 주소입니다.

```md
---
title: "글 제목"
description: "목록과 메타 설명에 쓰는 한 줄"
date: 2026-11-15
tags: ["Java", "Performance"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/example.png"
featured: false
draft: false
---
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `title` | 예 | 글 제목 |
| `description` | 예 | 카드 요약, `og:description` |
| `date` | 예 | 목록 정렬과 표시 날짜. 최신 글이 위 |
| `tags` | 아니오 | 홈 필터 칩. 첫 태그가 카드 라벨 |
| `cover` | 아니오 | 커버 이미지 URL. 없으면 `/media/hero-poster.jpg` |
| `featured` | 아니오 | `true`인 글이 홈 Featured. 없으면 최신 글 |
| `draft` | 아니오 | `true`인 글은 `pnpm build`에서 빠지고 `pnpm dev`에서는 그대로 보임. 기본값 `false` |

본문 `##` 제목은 글 페이지 목차로 모입니다. 읽기 시간은 공백을 뺀 글자 수 기준, 분당 약 500자입니다.

## 커버 이미지

개발 서버에서만 `/_upload`가 열립니다. 프로덕션 빌드에는 이 경로가 남지 않습니다. 프로젝트 루트에 `.env.local`이 있어야 하고, 값은 프로세스 환경 변수가 아니라 이 파일에서 읽습니다.

```sh
AWS_REGION=
S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_COVER_PREFIX=
```

이미지만 올릴 수 있고, 같은 이름의 객체는 덮어쓰지 않습니다. 응답으로 받은 URL을 글의 `cover`에 넣습니다. `.env.local`은 커밋하지 않습니다.

히어로 영상은 `public/media/hero.mp4`, 포스터는 `public/media/hero-poster.jpg`입니다.

## 디렉터리

```text
/
├── src
│   ├── pages
│   │   ├── index.astro              # 홈
│   │   └── posts/[...slug].astro    # 글
│   ├── layouts/Layout.astro         # 내비, 테마, 푸터
│   ├── components/Author.astro
│   ├── content/posts/               # 마크다운 글
│   ├── content.config.ts            # 글 스키마
│   ├── site.ts                      # 사이트·글쓴이
│   └── styles/global.css
├── integrations/s3-upload.mjs       # dev 전용 /_upload
├── public/                          # 파비콘, 히어로 미디어
├── deploy/                          # EC2 compose, 호스트 nginx
├── nginx.conf                       # 컨테이너 nginx
└── Dockerfile
```

코드 하이라이트는 Shiki 이중 테마(`github-light` / `vesper`)이고, 색은 `data-theme`에 따라 `global.css`가 고릅니다.

## 배포

`main`에 푸시하면 GitHub Actions가 이미지를 만들어 Docker Hub에 올리고, EC2에서 `docker compose pull` 후 컨테이너를 교체합니다. 호스트 nginx 설정(`deploy/nginx-blog.devgrr.kr.conf`)도 같이 반영하고, `nginx -t`에 실패하면 직전 설정으로 되돌립니다.

- 이미지: `<DOCKERHUB_USERNAME>/tech-blog-motionsite`
- 컨테이너는 `127.0.0.1:3100`만 열고, 호스트 nginx가 `blog.devgrr.kr`을 그쪽으로 넘깁니다.
- HTTPS는 앞단 로드밸런서에서 끝납니다.

필요한 Actions 시크릿: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`. EC2의 `~/tech-blog-motionsite/deploy/.env`에는 `DOCKERHUB_USERNAME`을 둡니다.

로컬에서 이미지 빌드:

```sh
docker build -t tech-blog-motionsite .
```
