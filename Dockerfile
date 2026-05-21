FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install Python and build tools for native modules (better-sqlite3) and uv for MCP servers
RUN apk add --no-cache python3 py3-pip build-base && \
    pip install --break-system-packages uv

# Install deps first (better layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json web/
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY mcp.json ./

# Environment
ENV NODE_ENV=production

# Build output for production
RUN pnpm build

# Remove build deps to slim the image
RUN apk del build-base

# Run the bot from compiled output
CMD ["node", "dist/index.js"]
