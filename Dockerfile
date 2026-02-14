FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/voice-engine-core/package.json packages/voice-engine-core/
COPY packages/voice-engine-dsp/package.json packages/voice-engine-dsp/
RUN npm ci
COPY tsconfig.json tsconfig.base.json ./
COPY packages/ packages/
RUN npm run build

FROM node:22-slim
RUN groupadd -r engine && useradd -r -g engine engine
WORKDIR /app
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/packages/voice-engine-core/dist packages/voice-engine-core/dist/
COPY --from=builder /app/packages/voice-engine-core/package.json packages/voice-engine-core/
COPY --from=builder /app/packages/voice-engine-dsp/dist packages/voice-engine-dsp/dist/
COPY --from=builder /app/packages/voice-engine-dsp/package.json packages/voice-engine-dsp/
COPY package.json ./
USER engine
ENTRYPOINT ["node", "packages/voice-engine-dsp/dist/src/index.js"]
