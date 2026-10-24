FROM nginx:1.28-alpine
COPY dist/frontend/browser/ /usr/share/nginx/html/
COPY dist/frontend/3rdpartylicenses.txt /usr/share/nginx/html/3rdpartylicenses.txt
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
