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

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Clear Symfony cache to ensure routes are properly loaded
RUN php bin/console cache:clear --env=prod --no-warmup && \
    php bin/console cache:warmup --env=prod

# Create necessary directories
RUN mkdir -p /app/var/cache /app/var/log /app/var/share && \
    chown -R www-data:www-data /app/var && \
    chmod -R 777 /app/var

# Configure PHP-FPM to log errors
RUN echo "php_admin_value[error_log] = /proc/self/fd/2" >> /usr/local/etc/php-fpm.d/www.conf && \
    echo "php_admin_flag[log_errors] = on" >> /usr/local/etc/php-fpm.d/www.conf && \
    echo "catch_workers_output = yes" >> /usr/local/etc/php-fpm.d/www.conf

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/sites-available/default

# Copy supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create startup script
RUN echo '#!/bin/bash\n\
set +e\n\
echo "=== Starting Homi Backend ==="\n\
echo "Running database migrations..."\n\
php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration 2>&1 || echo "Migrations skipped"\n\
echo "Fixing cache permissions..."\n\
chown -R www-data:www-data /app/var 2>&1 || echo "Chown skipped"\n\
chmod -R 775 /app/var 2>&1 || echo "Chmod skipped"\n\
echo "Starting services..."\n\
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf\n\
' > /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 8000

# Start with entrypoint script
CMD ["/app/docker-entrypoint.sh"]
