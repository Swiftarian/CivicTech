# ==========================================
# 多階段建置 Dockerfile
# ==========================================

# ==========================================
# Stage 1: 建置階段
# ==========================================
FROM node:22-alpine AS builder

# 設定工作目錄
WORKDIR /app

# 安裝 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 複製套件定義檔案
COPY package.json pnpm-lock.yaml ./

# 安裝依賴（包含 devDependencies，用於建置）
RUN pnpm install --frozen-lockfile

# 複製所有原始碼
COPY . .

# 建置應用程式
RUN pnpm build

# ==========================================
# Stage 2: 生產階段
# ==========================================
FROM node:22-alpine AS runner

# 設定工作目錄
WORKDIR /app

# 安裝 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 複製套件定義檔案
COPY package.json pnpm-lock.yaml ./

# 只安裝生產依賴
RUN pnpm install --prod --frozen-lockfile

# 從建置階段複製建置產物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# 複製其他必要檔案
COPY drizzle ./drizzle
COPY server ./server
COPY shared ./shared

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 啟動應用程式
CMD ["pnpm", "start"]
