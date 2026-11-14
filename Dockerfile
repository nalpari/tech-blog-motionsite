FROM node:24-alpine AS build
WORKDIR /app
RUN npm i -g pnpm@12.16.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# 정적 사이트라 빌드 결과만 nginx 로 내보낸다.
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
