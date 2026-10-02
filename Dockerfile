FROM node:18-alpine

RUN apk add --no-cache fail2ban bash iptables iproute2 python3

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY jail.local /etc/fail2ban/jail.local
COPY filter-http-flood.conf /etc/fail2ban/filter.d/http-flood.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY . .

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
