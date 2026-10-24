FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY dist/ /srv/
EXPOSE 3000
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
