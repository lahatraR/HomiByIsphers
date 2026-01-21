FROM php:8.4-fpm

# Set build-time environment to prod to avoid loading dev bundles during auto-scripts
ARG APP_ENV=prod
ENV APP_ENV=${APP_ENV}
ENV APP_DEBUG=0
ENV COMPOSER_ALLOW_SUPERUSER=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip \
    nginx \
    supervisor

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql pgsql mbstring exif pcntl bcmath gd

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Install dependencies (ignore platform reqs since we're in php:8.4-fpm container)
RUN composer install --no-dev --optimize-autoloader --ignore-platform-reqs

# Clear Symfony cache to ensure routes are properly loaded
RUN php bin/console cache:clear --env=prod --no-warmup && \
    php bin/console cache:warmup --env=prod

# Fix ALL permissions - this is critical
RUN mkdir -p /app/var/cache /app/var/log /app/var/share && \
    chown -R www-data:www-data /app && \
    find /app -type d -exec chmod 755 {} \; && \
    find /app -type f -exec chmod 644 {} \; && \
    chmod -R 777 /app/var && \
    chmod 755 /app/public && \
    chmod 755 /app/bin/console

# Configure PHP-FPM
RUN echo "php_admin_value[error_log] = /proc/self/fd/2" >> /usr/local/etc/php-fpm.d/www.conf && \
    echo "php_admin_flag[log_errors] = on" >> /usr/local/etc/php-fpm.d/www.conf && \
    echo "catch_workers_output = yes" >> /usr/local/etc/php-fpm.d/www.conf && \
    echo "clear_env = no" >> /usr/local/etc/php-fpm.d/www.conf && \
    echo "user = www-data" >> /usr/local/etc/php-fpm.d/www.conf && \
    echo "group = www-data" >> /usr/local/etc/php-fpm.d/www.conf && \
    echo "listen = 127.0.0.1:9000" >> /usr/local/etc/php-fpm.d/www.conf

# Copy nginx configuration
COPY docker/nginx.conf.full /etc/nginx/nginx.conf
RUN chmod 644 /etc/nginx/nginx.conf && \
    mkdir -p /var/log/nginx && \
    chmod 777 /var/log/nginx

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create startup script
RUN echo '#!/bin/bash\n\
set +e\n\
echo "=== Starting Homi Backend ==="\n\
echo "Environment: APP_ENV=$APP_ENV APP_DEBUG=$APP_DEBUG"\n\
echo "PHP Version:"\n\
php -v\n\
echo "Running database migrations..."\n\
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration 2>&1 || echo "Migrations skipped"\n\
echo "Fixing ALL cache and var permissions..."\n\
find /app/var -type d -exec chmod 777 {} \\; 2>&1 || echo "Find dirs failed"\n\
find /app/var -type f -exec chmod 666 {} \\; 2>&1 || echo "Find files failed"\n\
chmod 755 /app/bin/console\n\
chown -R www-data:www-data /app 2>&1 || echo "Chown skipped"\n\
echo "Listing routes:"\n\
php bin/console debug:router | head -20 || echo "Route debug failed"\n\
echo "Testing index.php access:"\n\
ls -la /app/public/index.php\n\
echo "Starting services..."\n\
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf\n\
' > /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 8000

# Start with entrypoint script
CMD ["/app/docker-entrypoint.sh"]
