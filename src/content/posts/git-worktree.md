---
title: "Git Worktree 완벽 가이드"
description: "git worktree로 브랜치 전환 없이 동시 작업하기"
date: 2026-03-17T02:27:13.325Z
tags: ["Dev tools"]
cover: "https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/covers/git-worktree-1773713759078.png"
---

> **예상 읽기 시간:** 약 10분
> 
> 
> **대상 독자:** Git을 일상적으로 사용하는 개발자
> 
> **핵심 키워드:** `git worktree`, 멀티 브랜치 작업, 생산성
> 

---

![worktree1 (1)](https://devgrr.s3.ap-northeast-2.amazonaws.com/blog-assets/post-images/1773713747798-1ad17x.png)

## 들어가며 — 우리가 매일 겪는 그 불편함

개발을 하다 보면 이런 상황이 자주 생긴다.

> *"feature/payment 브랜치에서 결제 모듈을 개발하던 중, 갑자기 운영 배포된 main 브랜치에서 긴급 버그가 터졌다."*
> 

이때 당신이 하는 행동은?

1. 지금 하던 작업을 `git stash`로 임시 저장
2. `git checkout main` 으로 브랜치 전환
3. 버그 수정하고 커밋, 푸시
4. 다시 `git checkout feature/payment` 로 복귀
5. `git stash pop` 으로 작업 복원
6. *(스태시 충돌 발생)* 🤯

혹은 더 과감하게, 같은 프로젝트를 **두 번 클론**해서 디렉토리를 두 개 열어두는 방법을 쓰기도 한다. 이것도 나름 유효한 방법이지만 디스크 낭비가 심하고, 원격 저장소와의 동기화를 두 번 관리해야 하는 피로감이 따른다.

**Git Worktree는 이 문제를 근본적으로 해결한다.**

---

## Git Worktree란 무엇인가?

`git worktree`는 **하나의 Git 저장소에서 여러 작업 디렉토리(working tree)를 동시에 체크아웃**할 수 있게 해주는 기능이다. Git 2.5 (2015년)부터 공식 지원되며, 별도 플러그인 없이 Git에 기본 내장되어 있다.

### 핵심 개념 이해하기

먼저 용어를 정리하자.

| 용어 | 의미 |
| --- | --- |
| **Main worktree** | `git clone` 또는 `git init`으로 생성된 최초의 작업 디렉토리 |
| **Linked worktree** | `git worktree add`로 추가한 연결된 작업 디렉토리 |
| **`.git` 디렉토리** | 저장소의 실제 데이터(객체, refs 등)가 저장되는 곳. Linked worktree는 이를 공유한다 |

```
my-project/               ← Main worktree (main 브랜치)
├── .git/                 ← 실제 저장소 데이터 (공유됨)
│   └── worktrees/        ← Linked worktree 메타데이터
├── src/
└── ...

../my-project-hotfix/     ← Linked worktree (hotfix 브랜치)
├── .git                  ← 실제로는 파일 하나 (포인터)
├── src/
└── ...

../my-project-feature/    ← Linked worktree (feature 브랜치)
├── .git                  ← 실제로는 파일 하나 (포인터)
├── src/
└── ...
```

Linked worktree의 `.git`은 디렉토리가 아니라 **파일 하나**다. 내용을 열어보면 이렇게 생겼다:

```
gitdir: /path/to/my-project/.git/worktrees/my-project-hotfix
```

Main worktree의 `.git` 디렉토리를 가리키는 포인터일 뿐이다. 덕분에 **Git 객체(커밋, 트리, 블롭)는 전혀 중복 없이 공유**된다.

### 기존 방법들과의 비교

| 방법 | 브랜치 전환 필요 | 디스크 사용 | 동시 작업 | Git 히스토리 공유 |
| --- | --- | --- | --- | --- |
| 브랜치 전환 (`checkout`) | ✅ 매번 | 낮음 | ❌ | ✅ |
| 프로젝트 재클론 | ❌ | **매우 높음** | ✅ | ❌ |
| **Git Worktree** | ❌ | **낮음** | ✅ | ✅ |

Worktree는 재클론과 달리 **.git 데이터를 공유**하므로 한쪽에서 fetch한 원격 브랜치를 다른 worktree에서도 즉시 사용할 수 있다.

---

## 기본 사용법

### 1. Worktree 추가하기

```bash
# 기본 문법
git worktree add <경로> [<브랜치>]

# 예시 1: 기존 브랜치를 새 디렉토리에 체크아웃
git worktree add ../my-project-hotfix hotfix/login-bug

# 예시 2: 새 브랜치를 동시에 생성하면서 추가 (-b 옵션)
git worktree add -b feature/new-api ../my-project-feature main

# 예시 3: 특정 커밋 해시로 체크아웃 (Detached HEAD 상태)
git worktree add ../my-project-review abc1234
```

> ⚠️ **중요:** 이미 **다른 worktree에서 체크아웃 중인 브랜치**는 추가로 체크아웃할 수 없다. 같은 브랜치를 두 군데서 동시에 수정하면 충돌이 발생하기 때문에 Git이 이를 원천 차단한다.
> 

### 2. Worktree 목록 확인하기

```bash
git worktree list
```

출력 예시:

```
/Users/sangwook/my-project           abc1234 [main]
/Users/sangwook/my-project-hotfix    def5678 [hotfix/login-bug]
/Users/sangwook/my-project-feature   ghi9012 [feature/new-api]
```

- `-porcelain` 옵션을 붙이면 스크립트 파싱에 유용한 형태로 출력된다:

```bash
git worktree list --porcelain
```

### 3. Worktree 제거하기

```bash
# 권장 방법: git 명령어로 제거 (메타데이터도 함께 정리)
git worktree remove ../my-project-hotfix

# 강제 제거 (수정된 파일이 있어도 강제 삭제)
git worktree remove --force ../my-project-hotfix

# 디렉토리를 수동으로 삭제한 경우, 남은 메타데이터 정리
git worktree prune
```

> `rm -rf`로 디렉토리를 직접 지웠다면 반드시 `git worktree prune`을 실행해 `.git/worktrees/` 안의 고아 메타데이터를 청소해주어야 한다.
> 

### 4. Worktree 잠금/잠금 해제

외장 드라이브처럼 **마운트가 일시적으로 해제될 수 있는 경로**에 worktree가 있다면, 잠금을 걸어 `prune`으로 실수 삭제되는 것을 방지할 수 있다.

```bash
# 잠금
git worktree lock ../my-project-hotfix --reason "외장 드라이브에 위치"

# 잠금 해제
git worktree unlock ../my-project-hotfix
```

---

## 실전 활용 시나리오

### 시나리오 1: 긴급 핫픽스 대응

```bash
# 현재 feature 브랜치에서 작업 중
# (stash 없이 바로 핫픽스 디렉토리 생성)
git worktree add ../my-project-hotfix -b hotfix/critical-bug main

# 새 터미널 탭 or 새 에디터 창에서 핫픽스 디렉토리 열기
cd ../my-project-hotfix

# 버그 수정 및 커밋
vim src/auth/login.ts
git add .
git commit -m "fix: 로그인 토큰 만료 처리 누락 수정"
git push origin hotfix/critical-bug

# 핫픽스 완료 후 worktree 제거
cd ../my-project
git worktree remove ../my-project-hotfix
```

이 과정에서 **feature 브랜치의 작업은 전혀 건드리지 않는다.** stash도, 브랜치 전환도 없다.

### 시나리오 2: 코드 리뷰 & 동시 개발

```bash
# PR 리뷰용 worktree 추가
git worktree add ../my-project-review feature/teammate-pr

cd ../my-project-review
# 리뷰 대상 브랜치 실행해보기
npm run dev  # 포트 3001에서 실행

# 동시에 main worktree에서 내 작업 계속
cd ../my-project
npm run dev  # 포트 3000에서 실행
```

**두 개의 Next.js dev 서버를 동시에 띄워** 직접 비교하며 리뷰할 수 있다.

### 시나리오 3: 장기 릴리즈 브랜치 관리

```bash
# v1.x 유지보수 브랜치를 상시 열어두기
git worktree add ../my-project-v1 release/v1.x

# 필요할 때 언제든 패치 작업
cd ../my-project-v1
git cherry-pick <커밋해시>  # main의 버그픽스를 v1에 적용
```

### 시나리오 4: 빌드/배포 파이프라인

CI 환경 없이 로컬에서 두 버전을 동시에 빌드해야 할 때:

```bash
git worktree add ../my-project-staging staging
git worktree add ../my-project-prod main

# 병렬 빌드
(cd ../my-project-staging && npm run build) &
(cd ../my-project-prod && npm run build) &
wait
```

---

## 프로젝트 도입 방법 — 팀 레벨에서의 전략

### 디렉토리 구조 컨벤션 정하기

팀이 함께 쓰는 경우, **디렉토리 이름 규칙**을 미리 정해두는 것이 좋다.

**패턴 1: 프로젝트명 + 브랜치 타입**

```
~/projects/
├── my-project/           ← main worktree
├── my-project-hotfix/    ← hotfix용
├── my-project-review/    ← PR 리뷰용
└── my-project-exp/       ← 실험적 작업
```

**패턴 2: 프로젝트 폴더 내부에 worktrees 서브폴더 (Bare 저장소 방식)**

```
~/projects/my-project/
├── .bare/               ← Bare 저장소 (실제 Git 데이터)
├── main/                ← main worktree
├── hotfix/              ← hotfix worktree
└── feature-x/           ← feature worktree
```

이 Bare 저장소 방식은 별도 섹션에서 다룬다.

### `.gitignore` 고려사항

Worktree 디렉토리 자체는 Git의 추적 대상이 아니므로 `.gitignore`에 추가할 필요 없다. 하지만 **프로젝트 루트에 worktree 관련 설정 파일**을 두는 경우라면 `.gitignore`에 포함하자.

### 환경변수 및 `.env` 파일

각 worktree는 **독립된 파일 시스템** 위에 있으므로, `.env` 파일이 main worktree에만 있다면 linked worktree에는 없다. 대책:

```bash
# 방법 1: 심볼릭 링크
ln -s ../my-project/.env ../my-project-hotfix/.env

# 방법 2: 공유 경로 참조 (.env.shared 등 별도 관리)
# 방법 3: 각 worktree마다 별도 .env 생성
```

### node_modules 문제

`node_modules`는 각 worktree마다 **따로 존재**한다. 동일한 패키지가 중복 설치되는 비효율이 생길 수 있다.

```bash
# 해결책 1: 심볼릭 링크 (패키지 버전이 같을 경우)
ln -s ../my-project/node_modules ../my-project-hotfix/node_modules

# 해결책 2: pnpm 사용 (글로벌 패키지 캐시로 중복 최소화)
# pnpm은 하드링크 기반으로 디스크 사용량을 대폭 줄여준다

# 해결책 3: 그냥 각각 npm install
# (브랜치마다 패키지 버전이 다를 수 있으므로 이게 가장 안전함)
```

---

## 심화: Bare 저장소 방식 (권장 패턴)

일반적인 `git clone` 대신 **Bare 저장소**로 설정하면 더 깔끔한 구조를 만들 수 있다. 이 방식은 최근 Git 파워유저들 사이에서 인기를 얻고 있다.

### Bare 저장소 설정하기

```bash
# 1. 프로젝트 폴더 생성
mkdir my-project && cd my-project

# 2. Bare clone (--bare는 작업 파일 없이 .git 데이터만 클론)
git clone --bare git@github.com:my-org/my-project.git .bare

# 3. .git 파일 생성 (일반 git 명령어가 bare 저장소를 인식하게)
echo "gitdir: ./.bare" > .git

# 4. 원격 브랜치 fetch 설정 (bare clone은 기본적으로 fetch 설정이 없음)
git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
git fetch

# 5. 이제 worktree 추가
git worktree add main main
git worktree add feature feature/new-api
```

결과 구조:

```
my-project/
├── .bare/         ← 실제 Git 데이터
├── .git           ← "gitdir: ./.bare" 한 줄짜리 파일
├── main/          ← main 브랜치 worktree
└── feature/       ← feature 브랜치 worktree
```

### 왜 Bare 방식이 좋은가?

1. **명확한 구조**: 프로젝트 디렉토리 안에 모든 worktree가 모여 있어 관리가 쉽다
2. **IDE 친화적**: VS Code, IntelliJ 등에서 프로젝트 루트를 하나로 잡을 수 있다
3. **스크립트화 쉬움**: `~/projects/my-project/main`, `~/projects/my-project/hotfix` 처럼 경로가 예측 가능하다

---

## 유용한 팁 & 주의사항

### 팁 1: 쉘 함수로 자동화

`.zshrc` 또는 `.bashrc`에 추가:

```bash
# worktree 빠르게 추가하는 함수
function gwt() {
  local branch=$1
  local path="../$(basename $(pwd))-${branch//\//-}"
  git worktree add "$path" "$branch"
  echo "✅ Worktree created at: $path"
  echo "   cd $path"
}

# 사용법
gwt hotfix/login-bug
# → ../my-project-hotfix-login-bug 에 worktree 생성
```

### 팁 2: fzf와 연동한 빠른 이동

```bash
# 현재 저장소의 worktree 간 빠른 이동
function gwtcd() {
  local worktree
  worktree=$(git worktree list | fzf | awk '{print $1}')
  [ -n "$worktree" ] && cd "$worktree"
}
```

### 팁 3: VS Code에서 여러 worktree 동시에 열기

```bash
# 각 worktree를 새 VS Code 창으로 열기
code ../my-project-hotfix

# 현재 창에서 새 worktree 폴더 추가 (멀티루트 워크스페이스)
# VS Code: File > Add Folder to Workspace
```

### 주의사항 모음

**① 같은 브랜치는 중복 체크아웃 불가**

```bash
# ❌ 에러 발생
git worktree add ../another-main main
# fatal: 'main' is already checked out
```

**② git stash는 worktree 간 공유되지 않는다**

stash는 실제로 `.git/refs/stash`에 저장되므로 어느 worktree에서든 `git stash list`로 볼 수 있다. 단, `git stash pop`은 **현재 worktree**에 적용된다는 점을 유의하자.

**③ git hooks는 공유된다**

`.git/hooks/`가 공유되므로 pre-commit, pre-push 등의 훅은 모든 worktree에 동일하게 적용된다. 이는 일반적으로 원하는 동작이다.

**④ 서브모듈이 있는 경우**

서브모듈이 포함된 프로젝트는 각 worktree에서 `git submodule update --init`을 별도로 실행해야 한다.

```bash
cd ../my-project-hotfix
git submodule update --init --recursive
```

---

## Git Worktree와 함께 쓰면 좋은 도구들

### tmux / 터미널 멀티플렉서

```
┌─────────────────────┬─────────────────────┐
│ my-project (main)   │ my-project-hotfix   │
│ $ npm run dev       │ $ git log --oneline │
├─────────────────────┼─────────────────────┤
│ my-project-feature  │ my-project-review   │
│ $ vim src/api.ts    │ $ npm test          │
└─────────────────────┴─────────────────────┘
```

### lazygit

`lazygit`은 `git worktree list`를 UI로 보여주고, 각 worktree 간 전환을 쉽게 할 수 있는 TUI 클라이언트다. Worktree를 본격적으로 활용한다면 강력 추천한다.

### direnv

각 worktree 디렉토리마다 다른 환경변수를 자동으로 설정할 수 있다.

```bash
# my-project-hotfix/.envrc
export NODE_ENV=production
export PORT=3001
```

---

## 자주 묻는 질문 (FAQ)

**Q. Worktree는 얼마나 만들 수 있나요?**

A. 기술적인 제한은 없다. 다만 각 worktree마다 에디터, 개발 서버, 빌드 프로세스 등이 메모리를 소비하므로 실용적으로는 2~5개 정도가 적당하다.

**Q. Worktree를 다른 머신에서도 쓸 수 있나요?**

A. Worktree 메타데이터는 `.git/worktrees/`에 절대 경로로 저장되므로, 다른 머신에서는 직접 이용할 수 없다. 각 머신에서 별도로 `git worktree add`를 실행해야 한다.

**Q. Detached HEAD 상태의 worktree는 어떻게 관리하나요?**

A. 특정 커밋이나 태그를 체크아웃할 때 Detached HEAD가 된다. 이후 변경사항을 보존하려면 `git checkout -b <새브랜치명>`으로 브랜치를 만들어야 한다.

**Q. git worktree와 git submodule은 다른가요?**

A. 완전히 다른 개념이다. submodule은 **다른 저장소**를 현재 저장소 안에 포함시키는 것이고, worktree는 **같은 저장소**를 여러 경로에서 동시에 작업할 수 있게 하는 것이다.

---

## 마치며

`git worktree`는 분명히 러닝 커브가 있다. 처음엔 "그냥 stash 쓰면 되지 않나?"라는 생각이 든다. 하지만 한 번 손에 익으면 **브랜치 전환으로 인한 컨텍스트 스위칭 비용**이 얼마나 컸는지 실감하게 된다.

특히 다음과 같은 상황에서 워크트리는 게임체인저가 된다:

- **핫픽스가 잦은 서비스** — stash/unstash 없이 즉시 대응
- **긴 빌드 시간이 필요한 프로젝트** — 다른 worktree에서 빌드하는 동안 현재 작업 계속
- **여러 버전의 동시 유지보수** — v1, v2, main을 한 저장소에서 병렬 관리
- **코드 리뷰 중 자기 작업도 계속해야 할 때** — 두 브랜치를 동시에 실행

도입 순서를 제안하자면:

1. 먼저 `git worktree add`와 `git worktree remove`만 익힌다
2. 핫픽스 상황에서 실제로 한 번 써본다
3. Bare 저장소 방식으로 전환을 고려한다
4. 팀과 디렉토리 컨벤션을 맞춘다

Git의 기능 중에서 이렇게 실용적이면서도 잘 알려지지 않은 기능이 또 있을까. 지금 당장 터미널을 열고 시작해보자.

```bash
git worktree add ../$(basename $(pwd))-hotfix -b hotfix/my-first-worktree main
```

---

*이 포스트가 도움이 되었다면 팀원들과 공유해주세요. 질문이나 피드백은 댓글로 남겨주시면 감사하겠습니다.* 🙌
