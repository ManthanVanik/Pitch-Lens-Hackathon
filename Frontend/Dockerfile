# # Use Node.js LTS
# FROM node:18-alpine

# # Set working directory
# WORKDIR /app

# # Install dependencies
# COPY package*.json ./
# RUN npm install --production

# # Copy all project files
# COPY . .

# # Build Next.js
# RUN npm run build

# # Expose port 8080 (Cloud Run expects this)
# EXPOSE 8080

# # Start Next.js
# # CMD ["npm", "run", "start", "-p", "8080"]
# # Use Cloud Run PORT environment variable
# CMD ["sh", "-c", "npm run start -- -p ${PORT:-8080}"]



# Install dependencies only when needed
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Rebuild the source code only when needed
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Set environment variable for Next.js build
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Build Next.js app
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./

# Expose port
EXPOSE 8080
CMD ["npm", "start"]
