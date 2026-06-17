# Panduan Setup Project Android Studio

Karena Anda ingin memisahkan sepenuhnya antara Web (Admin) dan Android (Pegawai), saya telah membuatkan *blueprint* dan source code utama berbasis **Kotlin** dan **Jetpack Compose** untuk aplikasi Android Pegawai. 

Anda dapat mengunduh project AI Studio ini (menggunakan tombol Export/Download) dan memindahkan folder `source-android-pegawai` ini ke dalam project Android Studio yang Anda buat.

## Langkah-langkah Pembuatan di Android Studio:

1. Buka Android Studio -> **New Project** -> Pilih **Empty Activity (Jetpack Compose)**.
2. Beri nama aplikasi (Contoh: `HRD BOS Pegawai`), Package Name (Contoh: `com.hrdbospanel.app`).
3. Setelah project selesai di-sinkronisasi oleh Gradle, salin file-file yang ada di folder ini ke dalam struktur folder aplikasi Anda `app/src/main/java/...`
4. Setup Firebase Murni untuk Android:
   - Buka [Firebase Console](https://console.firebase.google.com/).
   - Tambahkan aplikasi Android (masukkan package name `com.hrdbospanel.app`).
   - Download file `google-services.json` dan letakkan di dalam folder `app/` di Android Studio Anda.
5. Tambahkan dependencies ke `app/build.gradle.kts`:

```kotlin
dependencies {
    // Jetpack Compose & Material 3 (Bawaan project baru Android Studio)
    implementation("androidx.compose.material3:material3")
    
    // Navigation Compose
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Firebase (Firestore)
    implementation(platform("com.google.firebase:firebase-bom:33.0.0"))
    implementation("com.google.firebase:firebase-firestore")

    // Location (Untuk absensi/geofencing)
    implementation("com.google.android.gms:play-services-location:21.2.0")
}
```
Jangan lupa menambahkan plugin Google Services di level project dan app module.

6. Tambahkan permission di `AndroidManifest.xml` (untuk absensi):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```
