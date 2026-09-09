FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/shared packages/shared
RUN npm install --workspace apps/api --include-workspace-root
COPY apps/api apps/api
RUN npm --workspace apps/api run build
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages/shared ./packages/shared
ENV NODE_ENV=production
EXPOSE 8787
CMD ["node", "apps/api/dist/server.js"]
