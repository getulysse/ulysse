FROM node:18 AS build

COPY . /app

RUN yarn install

FROM gcr.io/distroless/nodejs:18

WORKDIR /app

COPY --from=build /app/ /app/

ENV NODE_ENV=production

EXPOSE 3000

CMD ["server.mjs"]
