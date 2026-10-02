#!/bin/bash
set -e
mkdir -p /var/log/app /var/run/fail2ban
touch /var/log/app/access.log /var/log/fail2ban.log
rm -f /var/run/fail2ban/fail2ban.sock /var/run/fail2ban/fail2ban.pid

node server.js &
sleep 1
fail2ban-client -x start

echo "[backend-protected] Node.js API + Fail2Ban running."
exec tail -F /var/log/fail2ban.log
