# Use a Debian-based Node.js image
FROM node:18-bullseye

# Install necessary dependencies for Puppeteer/Chrome
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    libnss3 \
    libatk1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm-dev \
    libgtk-3-0 \
    libasound2 \
    libnspr4 \
    fonts-liberation \
    libappindicator3-1 \
    libdbusmenu-gtk3-4 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Run migrations and start the app
CMD ["bash", "-c", "npm run migration:run && npm run start:dev"]

# Expose port
EXPOSE 3000
