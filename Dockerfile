FROM node:18 AS build

WORKDIR /app

COPY . /app

RUN yarn install --prod --ignore-optional

RUN cp /app/dist/index.js /app/dist/ulysse

FROM gcr.io/distroless/nodejs:18

WORKDIR /app

COPY --from=build /app/dist /app/

ENV NODE_ENV=production

EXPOSE 3000

CMD ["ulysse"]
