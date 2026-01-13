# Uptime Monitor Mobile App

Native mobile application for Uptime Monitor built with Flutter. Monitor your services on the go with real-time push notifications when monitors go down or recover.

## Features

- **Monitor Dashboard** - View all your monitors at a glance with status indicators
- **Monitor Details** - Detailed statistics with response time charts and uptime percentages
- **Push Notifications** - Instant alerts when monitors go down or recover
- **Date Range Filtering** - View statistics for 24h, 7d, or 30d periods
- **Real-time Updates** - Pull to refresh for latest monitor status
- **Multi-Backend Support** - Connect to any self-hosted Uptime Monitor instance
- **Secure Authentication** - JWT-based authentication

## Prerequisites

- Flutter SDK 3.38.5 (see setup options below)
- Android Studio / Xcode (for Android/iOS development)
- A running Uptime Monitor backend instance

## Installation

### 1. Clone and Setup

**Option A: Using FVM (recommended)**

[FVM](https://fvm.app/) manages Flutter versions per project. The required version is specified in `.fvmrc`.

```bash
# Install FVM if you don't have it
dart pub global activate fvm

# Install the project's Flutter version and get dependencies
cd mobile
fvm install
fvm flutter pub get
```

**Option B: Using system Flutter**

Ensure you have Flutter 3.38.5+ installed, then:

```bash
cd mobile
flutter pub get
```

### 2. Configure Backend URL

The app needs to connect to your Uptime Monitor backend:

**For Development:**
Edit `lib/core/config/app_config.dart`:
```dart
static const String baseUrl = 'http://10.0.2.2:3200'; // Android emulator
// or
static const String baseUrl = 'http://localhost:3200'; // iOS simulator
```

**For Production:**
Users can configure the server URL in the app settings.

### 3. Firebase Configuration (for Push Notifications)

**Option A: Use Community Relay** (Recommended)
- No Firebase setup needed
- Backend uses community FCM relay
- Works out of the box

**Option B: Your Own Firebase**
1. Create Firebase project at https://console.firebase.google.com
2. Add Android app (package: `com.yourproject.uptimemonitor`)
3. Download `google-services.json`
4. Place in `android/app/google-services.json`
5. Update `applicationId` in `android/app/build.gradle`

### 4. Run the App

**Android:**
```bash
flutter run
```

**iOS:**
```bash
cd ios
pod install
cd ..
flutter run
```

## Building for Production

### Android APK

```bash
flutter build apk --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle (for Play Store)

```bash
flutter build appbundle --release
```

Output: `build/app/outputs/bundle/release/app-release.aab`

### iOS (requires macOS)

```bash
flutter build ios --release
```

Then archive and upload via Xcode.

## App Configuration

### Connecting to Your Backend

1. Launch the app
2. On first run, enter your backend URL (e.g., `https://monitor.yourdomain.com`)
3. Login with your admin credentials
4. The app automatically registers for push notifications

### Backend Requirements

Your Uptime Monitor backend must have:
- `NEXTAUTH_SECRET` configured (for JWT authentication)
- Optional: FCM relay or Firebase credentials for push notifications

## Tech Stack

- **Framework**: Flutter 3.38.5
- **State Management**: Riverpod
- **Navigation**: go_router
- **HTTP Client**: Dio
- **Charts**: fl_chart
- **Local Storage**: SharedPreferences + FlutterSecureStorage
- **Push Notifications**: Firebase Cloud Messaging
- **Date/Time**: intl

## Project Structure

```
lib/
├── core/
│   ├── config/           # App configuration
│   ├── services/         # Core services (API, FCM, Navigation)
│   └── theme/           # App theming
├── features/
│   ├── auth/            # Authentication (login, JWT)
│   ├── monitors/        # Monitor list and details
│   ├── notifications/   # Push notification handling
│   └── settings/        # App settings
└── main.dart            # App entry point
```

## Push Notifications

The app supports FCM push notifications for monitor alerts:

### How It Works

1. **Registration**: On login, the app gets an FCM device token
2. **Backend Storage**: Token is sent to backend and stored in MongoDB
3. **Alerts**: When a monitor fails, backend sends push notification via:
   - Community FCM relay (default), or
   - Direct Firebase (if configured)
4. **Notification Tap**: Opens app and navigates to the specific monitor

### Notification Data Format

```json
{
  "type": "monitor_down",
  "monitorId": "123abc",
  "monitorName": "Production API",
  "url": "https://api.example.com",
  "error": "Connection timeout"
}
```

## Development

### Running in Development Mode

```bash
flutter run
```

### Hot Reload

Press `r` in the terminal to hot reload changes.

### Debugging

Use Flutter DevTools:
```bash
flutter pub global activate devtools
flutter pub global run devtools
```

## Troubleshooting

### Cannot Connect to Backend

- **Android Emulator**: Use `http://10.0.2.2:3200` (not `localhost`)
- **iOS Simulator**: Use `http://localhost:3200`
- **Real Device**: Use your computer's IP address (e.g., `http://192.168.1.100:3200`)
- **Production**: Use HTTPS with valid SSL certificate

### Push Notifications Not Working

1. Check backend logs for FCM configuration
2. Verify `google-services.json` is in `android/app/`
3. Ensure backend has FCM relay or Firebase credentials configured
4. Test with `adb logcat` (Android) or Xcode console (iOS)

### Build Errors

```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

For mobile-specific contributions:
- Follow Flutter/Dart style guide
- Use Riverpod for state management
- Keep UI consistent with existing design
- Test on both Android and iOS if possible

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
