FROM node:12

LABEL maintainer "devdw98@gmail.com"

RUN mkdir /app

WORKDIR /app

ADD ./ /app

RUN npm install

# ENV NODE_ENV=development

EXPOSE 3000

CMD npm start