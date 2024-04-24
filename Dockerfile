FROM node:20 AS build

WORKDIR /app

COPY . /app

RUN yarn install

RUN yarn build

RUN rm -rf node_modules

RUN yarn install --prod --ignore-optional

FROM gcr.io/distroless/nodejs20

WORKDIR /app

COPY --from=build /app /app

ENV NODE_ENV=production

EXPOSE 3000

CMD ["dist/index.js", "--server"]
