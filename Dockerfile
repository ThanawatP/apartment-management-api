FROM node:8.1.1

ADD package.json /tmp/package.json
RUN cd /tmp && npm install --production && npm install --dev
RUN mkdir -p /usr/src/app && cp -a /tmp/node_modules /usr/src/app/
WORKDIR /usr/src/app
COPY . /usr/src/app

ENV MONGO_URI localhost
ENV CORS_PORT 4200

EXPOSE 3001

RUN chmod +x ./run.sh
CMD ["./run.sh"]