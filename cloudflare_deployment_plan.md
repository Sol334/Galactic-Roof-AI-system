# Galactic Roof AI - Cloudflare Deployment & Android App Integration

## 1. System Modifications for Cloudflare

### Database Migration
We'll replace SQLite with Cloudflare D1 (serverless SQL database):

```javascript
// Current SQLite connection
const db = new sqlite3.Database(path.join(__dirname, 'database/galacticroof.db'));

// Will be replaced with Cloudflare D1 connection
// const db = new D1Database(env.DATABASE);
```

### Environment Variables
Create a `.env.production` file for Cloudflare:

```
NODE_ENV=production
DATABASE_URL=your_d1_database_url
JWT_SECRET=your_secure_jwt_secret
```

### File Storage
Replace local file storage with Cloudflare R2:

```javascript
// Current local file storage
const uploadsDir = path.join(__dirname, 'uploads');

// Will be replaced with R2 storage
// const storage = new R2Storage(env.R2_BUCKET);
```

## 2. Cloudflare Deployment Setup

### Cloudflare Pages Setup
1. Create a new Cloudflare Pages project
2. Connect to your GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `public`
   - Environment variables: Add all from `.env.production`

### Cloudflare Workers Setup
1. Create a new Worker for API endpoints
2. Configure Worker Routes:
   - `yourdomain.com/api/*` → API Worker
   - `yourdomain.com/*` → Pages deployment

### Cloudflare D1 Database Setup
1. Create a new D1 database
2. Run migration scripts to create tables
3. Bind the database to your Worker

### Cloudflare R2 Storage Setup
1. Create an R2 bucket for file storage
2. Configure CORS for web access
3. Bind the bucket to your Worker

## 3. Domain Configuration

1. Add your domain to Cloudflare (if not already there)
2. Create DNS records:
   - `A` record for root domain pointing to Cloudflare Pages
   - `CNAME` record for `www` subdomain
   - `CNAME` record for `api` subdomain (if needed)

2. Configure SSL/TLS:
   - Set to Full (strict) mode
   - Enable Always Use HTTPS

## 4. Android App Wrapper

### App Structure
Create an Android app that uses WebView to display the web application:

```java
public class MainActivity extends AppCompatActivity {
    private WebView webView;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webview);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        
        // Enable file uploads
        webView.setWebChromeClient(new WebChromeClient() {
            // Handle file uploads
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, 
                    FileChooserParams fileChooserParams) {
                // File chooser implementation
                return true;
            }
        });
        
        // Add interface for native features
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");
        
        // Load the website
        webView.loadUrl("https://yourdomain.com");
    }
}
```

### Native Features Integration
Create a JavaScript interface to access native Android features:

```java
public class WebAppInterface {
    private Context context;
    
    WebAppInterface(Context context) {
        this.context = context;
    }
    
    @JavascriptInterface
    public void showToast(String message) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
    }
    
    @JavascriptInterface
    public void scheduleNotification(String title, String message, long timeInMillis) {
        // Notification scheduling code
    }
    
    @JavascriptInterface
    public String getDeviceInfo() {
        return Build.MANUFACTURER + " " + Build.MODEL;
    }
}
```

### App Manifest Configuration
Configure the app manifest for required permissions:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.galacticroof.app">
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.CAMERA" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Galactic Roof AI"
        android:theme="@style/AppTheme">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### Offline Support
Add offline capabilities to the Android app:

```javascript
// In the web application
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            console.log('Service Worker registered');
        })
        .catch(error => {
            console.log('Service Worker registration failed:', error);
        });
}
```

Create a service worker for offline caching:

```javascript
// service-worker.js
const CACHE_NAME = 'galactic-roof-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/auth.js',
    '/js/bridge.js',
    '/offline.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});
```

## 5. Implementation Steps

### Step 1: Prepare the CRM System
1. Modify the database connection to work with Cloudflare D1
2. Update file storage to use Cloudflare R2
3. Create production environment configuration

### Step 2: Deploy to Cloudflare
1. Set up Cloudflare Pages project
2. Create and configure Cloudflare Workers
3. Set up D1 database and run migrations
4. Create R2 bucket for file storage

### Step 3: Configure Domain
1. Add DNS records
2. Configure SSL/TLS settings
3. Test the deployment

### Step 4: Create Android App
1. Set up Android Studio project
2. Implement WebView with the configured domain
3. Add native feature integrations
4. Configure offline support
5. Build and test the app

### Step 5: Publish and Distribute
1. Generate signed APK/App Bundle
2. Publish to Google Play Store
3. Create direct download link on your website

## 6. Maintenance and Updates

### Automated Deployments
Set up GitHub Actions for continuous deployment:

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
```

### Database Backups
Set up regular database backups:

```javascript
// In Cloudflare Worker
export async function scheduled(event, env, ctx) {
    // Create database backup
    const backup = await env.DATABASE.dump();
    
    // Store backup in R2
    const date = new Date().toISOString().split('T')[0];
    await env.BACKUPS.put(`backup-${date}.sql`, backup);
}
```

### App Updates
Configure the Android app for automatic updates:

```java
// Check for updates
private void checkForUpdates() {
    AppUpdateManager appUpdateManager = AppUpdateManagerFactory.create(context);
    Task<AppUpdateInfo> appUpdateInfoTask = appUpdateManager.getAppUpdateInfo();
    
    appUpdateInfoTask.addOnSuccessListener(appUpdateInfo -> {
        if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                && appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
            try {
                appUpdateManager.startUpdateFlowForResult(
                        appUpdateInfo,
                        AppUpdateType.IMMEDIATE,
                        this,
                        REQUEST_CODE_UPDATE);
            } catch (IntentSender.SendIntentException e) {
                e.printStackTrace();
            }
        }
    });
}
```