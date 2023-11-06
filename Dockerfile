FROM node:18 AS build

WORKDIR /app

COPY . /app

RUN yarn install --prod --ignore-optional

FROM gcr.io/distroless/nodejs:18

WORKDIR /app

COPY --from=build /app/ /app/

ENV NODE_ENV=production

EXPOSE 3000

CMD ["src/index.mjs", "server"]
