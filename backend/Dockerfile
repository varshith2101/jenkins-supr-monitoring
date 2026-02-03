FROM node:18-alpine

# Install build dependencies for native modules (bcrypt) and wget for health checks
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    wget

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
