# Galactic Roof AI - Cloudflare Deployment Guide

This guide provides step-by-step instructions for deploying the Galactic Roof AI system to Cloudflare and setting up the Android app.

## Prerequisites

1. A Cloudflare account
2. Your domain added to Cloudflare
3. Node.js and npm installed on your local machine
4. Git installed on your local machine
5. Android Studio installed (for Android app development)

## 1. Prepare Your Repository

First, create a GitHub repository for your project:

1. Create a new repository on GitHub
2. Clone the repository to your local machine
3. Copy all files from the Galactic Roof AI system to your repository
4. Commit and push the changes to GitHub

## 2. Set Up Cloudflare Pages

### Connect Your Repository

1. Log in to your Cloudflare dashboard
2. Navigate to **Pages**
3. Click **Create a project**
4. Select **Connect to Git**
5. Authenticate with GitHub and select your repository
6. Click **Begin setup**

### Configure Build Settings

1. Set the following build configuration:
   - **Project name**: `galactic-roof-ai`
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `public`
   - **Root directory**: `/` (leave as default)

2. Add the following environment variables:
   - `NODE_VERSION`: `16.0.0`
   - `JWT_SECRET`: `your-secure-jwt-secret` (use a strong random string)

3. Click **Save and Deploy**

## 3. Set Up Cloudflare D1 Database

### Create D1 Database

1. In your Cloudflare dashboard, navigate to **Workers & Pages**
2. Select **D1** from the sidebar
3. Click **Create database**
4. Name your database `galactic-roof-db`
5. Choose a location close to your users
6. Click **Create**

### Run Database Migrations

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

3. Create a migration file:
   ```bash
   wrangler d1 create-migration galactic-roof-db
   ```

4. Copy the SQL schema from `database/init.js` to the migration file

5. Run the migration:
   ```bash
   wrangler d1 migrate galactic-roof-db
   ```

## 4. Set Up Cloudflare R2 Storage

### Create R2 Bucket

1. In your Cloudflare dashboard, navigate to **R2**
2. Click **Create bucket**
3. Name your bucket `galactic-roof-files`
4. Click **Create bucket**

### Configure CORS for the Bucket

1. Select your bucket
2. Go to **Settings** > **CORS**
3. Add a new CORS rule:
   - **Allowed origins**: `https://yourdomain.com`
   - **Allowed methods**: `GET, PUT, POST, DELETE`
   - **Allowed headers**: `*`
   - **Max age**: `86400`
4. Click **Save**

## 5. Create Cloudflare Worker

### Create Worker

1. In your Cloudflare dashboard, navigate to **Workers & Pages**
2. Click **Create a Worker**
3. Name your worker `galactic-roof-api`
4. Click **Create Worker**

### Deploy Worker Code

1. Replace the default code with the contents of `cloudflare_worker.js`
2. Click **Save and Deploy**

### Bind Resources to Worker

1. Go to **Settings** > **Variables**
2. Under **KV Namespace Bindings**, click **Add binding**:
   - **Variable name**: `DATABASE`
   - **KV namespace**: Select your D1 database
3. Under **R2 Bucket Bindings**, click **Add binding**:
   - **Variable name**: `FILES_BUCKET`
   - **R2 bucket**: Select your R2 bucket
4. Under **Environment Variables**, add:
   - `JWT_SECRET`: `your-secure-jwt-secret` (use the same value as in Pages)
5. Click **Save**

## 6. Configure Routes

### Set Up Worker Routes

1. In your Cloudflare dashboard, navigate to **Workers & Pages**
2. Select your worker
3. Go to **Triggers** > **Routes**
4. Add the following route:
   - `yourdomain.com/api/*`
5. Click **Add route**

### Configure Pages Routes

1. Navigate to **Pages**
2. Select your Pages project
3. Go to **Settings** > **Functions**
4. Under **Routes**, add:
   - `yourdomain.com/*`
5. Click **Save**

## 7. Configure Your Domain

### Set Up DNS Records

1. In your Cloudflare dashboard, navigate to **DNS**
2. Add an `A` record:
   - **Name**: `@` (root domain)
   - **IPv4 address**: `192.0.2.1` (this will be overridden by Cloudflare)
   - **Proxy status**: Proxied
3. Add a `CNAME` record:
   - **Name**: `www`
   - **Target**: `yourdomain.com`
   - **Proxy status**: Proxied

### Configure SSL/TLS

1. Navigate to **SSL/TLS** > **Overview**
2. Set the SSL/TLS encryption mode to **Full (strict)**
3. Go to **Edge Certificates**
4. Enable **Always Use HTTPS**

## 8. Build the Android App

### Set Up Android Studio Project

1. Open Android Studio
2. Select **File** > **New** > **New Project**
3. Choose **Empty Activity** and click **Next**
4. Configure your project:
   - **Name**: `Galactic Roof AI`
   - **Package name**: `com.galacticroof.app`
   - **Save location**: Choose your project directory
   - **Language**: Java
   - **Minimum API level**: API 21: Android 5.0 (Lollipop)
5. Click **Finish**

### Add Project Files

1. Replace `MainActivity.java` with the provided file
2. Replace `activity_main.xml` with the provided file
3. Create a new directory `res/xml` and add `file_paths.xml`
4. Update `AndroidManifest.xml` with the provided file
5. Update `build.gradle` with the provided dependencies

### Configure Domain

1. Open `MainActivity.java`
2. Find the line `webView.loadUrl("https://yourdomain.com");`
3. Replace `yourdomain.com` with your actual domain

### Build the App

1. Select **Build** > **Build Bundle(s) / APK(s)** > **Build APK**
2. Wait for the build to complete
3. The APK file will be available in `app/build/outputs/apk/debug/app-debug.apk`

## 9. Test Your Deployment

### Test Web Application

1. Open your browser and navigate to your domain (e.g., `https://yourdomain.com`)
2. You should see the login page
3. Log in with the default admin credentials:
   - Username: `admin`
   - Password: `admin123`
4. Verify that you can access all features:
   - Dashboard
   - Customers
   - Properties
   - Leads
   - Projects
   - Weather
   - Bridge

### Test Android App

1. Install the APK on your Android device
2. Open the app
3. Log in with the same credentials
4. Verify that all features work correctly

## 10. Set Up Continuous Deployment

### Create GitHub Actions Workflow

1. Create a directory `.github/workflows` in your repository
2. Create a file `deploy.yml` with the following content:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          command: pages publish public --project-name=galactic-roof-ai
          
      - name: Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          command: publish cloudflare_worker.js --name=galactic-roof-api
```

### Configure GitHub Secrets

1. In your GitHub repository, go to **Settings** > **Secrets** > **Actions**
2. Add the following secrets:
   - `CF_API_TOKEN`: Your Cloudflare API token
   - `CF_ACCOUNT_ID`: Your Cloudflare account ID

## 11. Maintenance and Updates

### Regular Database Backups

Set up a scheduled Worker to back up your database:

1. Create a new Worker for backups
2. Use the following code:

```javascript
export default {
  async scheduled(event, env, ctx) {
    // Create database backup
    const backup = await env.DATABASE.dump();
    
    // Store backup in R2
    const date = new Date().toISOString().split('T')[0];
    await env.BACKUPS.put(`backup-${date}.sql`, backup);
    
    return new Response('Backup completed');
  }
};
```

3. Set up a cron trigger to run daily

### Monitoring

1. Set up Cloudflare Analytics to monitor your application
2. Configure alerts for errors and performance issues
3. Use Cloudflare Workers Observability for detailed insights

## 12. Security Best Practices

### Secure Your Application

1. Regularly update dependencies
2. Use strong, unique passwords for admin accounts
3. Implement rate limiting for authentication endpoints
4. Enable two-factor authentication for Cloudflare account
5. Regularly rotate API keys and secrets

### Data Protection

1. Encrypt sensitive data in the database
2. Implement proper access controls
3. Set up regular security audits
4. Create a data backup and recovery plan

## Troubleshooting

### Common Issues

1. **Worker not responding**: Check your Worker routes and make sure they're correctly configured
2. **Database connection issues**: Verify your D1 database binding
3. **File upload problems**: Check R2 bucket permissions and CORS configuration
4. **Authentication failures**: Verify JWT secret is consistent across all services

### Getting Help

If you encounter issues:

1. Check Cloudflare documentation
2. Review Worker logs in the Cloudflare dashboard
3. Contact Cloudflare support if needed

## Conclusion

You've successfully deployed the Galactic Roof AI system to Cloudflare and created an Android app for mobile access. Your system is now accessible from anywhere, with secure authentication and cloud storage.