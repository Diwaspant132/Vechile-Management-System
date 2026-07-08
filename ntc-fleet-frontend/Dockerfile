# Stage 1: Build the React application using Vite
FROM node:18-alpine as build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the build output from the first stage
COPY --from=build /app/dist /usr/share/nginx/html

# Overwrite default Nginx configuration with our custom one for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
