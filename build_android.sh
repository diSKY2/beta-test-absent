#!/bin/bash
# Script untuk generate folder project Android Studio yang siap pakai
DIR="android-app-pegawai"

mkdir -p $DIR/app/src/main/java/com/garudatrisula/digitalgtp/ui/theme
mkdir -p $DIR/app/src/main/java/com/garudatrisula/digitalgtp/ui/screens
mkdir -p $DIR/app/src/main/java/com/garudatrisula/digitalgtp/network
mkdir -p $DIR/app/src/main/res/values
mkdir -p $DIR/gradle/wrapper

# 1. settings.gradle.kts
cat << 'INNER_EOF' > $DIR/settings.gradle.kts
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "DigitalGTPPegawai"
include(":app")
INNER_EOF

# 2. build.gradle.kts (Project)
cat << 'INNER_EOF' > $DIR/build.gradle.kts
plugins {
    id("com.android.application") version "8.1.4" apply false
    id("org.jetbrains.kotlin.android") version "1.9.0" apply false
}
INNER_EOF

# 3. gradle.properties
cat << 'INNER_EOF' > $DIR/gradle.properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
INNER_EOF

# 4. gradle-wrapper.properties
cat << 'INNER_EOF' > $DIR/gradle/wrapper/gradle-wrapper.properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.4-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
INNER_EOF

# 5. app/build.gradle.kts
cat << 'INNER_EOF' > $DIR/app/build.gradle.kts
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.garudatrisula.digitalgtp"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.garudatrisula.digitalgtp"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
        vectorDrawables { useSupportLibrary = true }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions { jvmTarget = "1.8" }
    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.1" }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.activity:activity-compose:1.8.0")
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.7.5")
    
    // Retrofit & OkHttp for REST API to Server/Postgres (Tanpa Firebase)
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.11.0")

    // Location
    implementation("com.google.android.gms:play-services-location:21.0.1")
}
INNER_EOF

# 6. AndroidManifest.xml
cat << 'INNER_EOF' > $DIR/app/src/main/AndroidManifest.xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.DigitalGTP"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.DigitalGTP">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
INNER_EOF

cat << 'INNER_EOF' > $DIR/app/src/main/res/values/strings.xml
<resources>
    <string name="app_name">Pegawai GTP</string>
</resources>
INNER_EOF

cat << 'INNER_EOF' > $DIR/app/src/main/res/values/themes.xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.DigitalGTP" parent="android:Theme.Material.Light.NoActionBar" />
</resources>
INNER_EOF

# 7. MainActivity.kt
cat << 'INNER_EOF' > $DIR/app/src/main/java/com/garudatrisula/digitalgtp/MainActivity.kt
package com.garudatrisula.digitalgtp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.garudatrisula.digitalgtp.ui.theme.DigitalGTPTheme
import com.garudatrisula.digitalgtp.ui.screens.LoginScreen
import com.garudatrisula.digitalgtp.ui.screens.DashboardScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DigitalGTPTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        }
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(
                onLoginSuccess = { employeeId ->
                    navController.navigate("dashboard/\$employeeId") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        composable("dashboard/{employeeId}") { backStackEntry ->
            val employeeId = backStackEntry.arguments?.getString("employeeId") ?: ""
            DashboardScreen(employeeId = employeeId, onLogout = {
                navController.navigate("login") {
                    popUpTo("dashboard/\$employeeId") { inclusive = true }
                }
            })
        }
    }
}
INNER_EOF

cat << 'INNER_EOF' > $DIR/app/src/main/java/com/garudatrisula/digitalgtp/ui/theme/Theme.kt
package com.garudatrisula.digitalgtp.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF6650a4),
    secondary = Color(0xFF625b71),
    tertiary = Color(0xFF7D5260)
)

@Composable
fun DigitalGTPTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
INNER_EOF

# 8. ApiService.kt
cat << 'INNER_EOF' > $DIR/app/src/main/java/com/garudatrisula/digitalgtp/network/ApiService.kt
package com.garudatrisula.digitalgtp.network

import com.google.gson.JsonElement
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit

// GANTI DENGAN URL TUNNEL CLOUDFLARE KAMU!!
// JANGAN LUPA TAMBAHKAN /api/sql/ DI BELAKANGNYA
private const val BASE_URL = "https://garudatrisulaperkasa.web.id/api/sql/"

val logging = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY }
val client = OkHttpClient.Builder()
    .addInterceptor(logging)
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .build()

val retrofit: Retrofit = Retrofit.Builder()
    .baseUrl(BASE_URL)
    .client(client)
    .addConverterFactory(GsonConverterFactory.create())
    .build()

interface ApiService {
    @POST("rpc")
    suspend fun rpc(@Body body: RpcRequest): JsonElement
}

val apiService: ApiService = retrofit.create(ApiService::class.java)

data class RpcRequest(
    val action: String,
    val collection: String,
    val filters: List<Filter>? = null,
    val data: Map<String, Any>? = null,
    val docId: String? = null
)

data class Filter(
    val field: String,
    val operator: String,
    val value: String
)
INNER_EOF

# 9. LoginScreen.kt
cat << 'INNER_EOF' > $DIR/app/src/main/java/com/garudatrisula/digitalgtp/ui/screens/LoginScreen.kt
package com.garudatrisula.digitalgtp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import com.garudatrisula.digitalgtp.network.*

@Composable
fun LoginScreen(onLoginSuccess: (String) -> Unit) {
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "Login Pegawai (Native Android)", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(32.dp))
        
        OutlinedTextField(
            value = username,
            onValueChange = { username = it },
            label = { Text("Username") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(32.dp))

        if (errorMsg != null) {
            Text(text = errorMsg!!, color = MaterialTheme.colorScheme.error)
            Spacer(modifier = Modifier.height(8.dp))
        }

        Button(
            onClick = {
                if (username.isBlank() || password.isBlank()) {
                    errorMsg = "Isi username dan password"
                    return@Button
                }
                isLoading = true
                errorMsg = null
                scope.launch {
                    try {
                        // Request login lewat API (Mengecek di tabel employees postgres)
                        val req = RpcRequest(
                            action = "getDocs",
                            collection = "employees",
                            filters = listOf(
                                Filter("username", "==", username)
                            )
                        )
                        val response = apiService.rpc(req)
                        
                        if (response.isJsonArray) {
                            val array = response.asJsonArray
                            if (array.size() > 0) {
                                val userObj = array[0].asJsonObject
                                val pass = userObj.get("password").asString
                                if (pass == password) {
                                    val empId = userObj.get("id").asString
                                    onLoginSuccess(empId)
                                } else {
                                    errorMsg = "Password salah"
                                }
                            } else {
                                errorMsg = "Username tidak ditemukan di Database"
                            }
                        } else {
                            errorMsg = "Format respon server tidak dikenali"
                        }

                    } catch (e: Exception) {
                        errorMsg = "Gagal koneksi ke server: \${e.message}"
                    } finally {
                        isLoading = false
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !isLoading
        ) {
            Text(if (isLoading) "Loading..." else "Login")
        }
    }
}
INNER_EOF

# 10. DashboardScreen.kt
cat << 'INNER_EOF' > $DIR/app/src/main/java/com/garudatrisula/digitalgtp/ui/screens/DashboardScreen.kt
package com.garudatrisula.digitalgtp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import com.garudatrisula.digitalgtp.network.*
import java.util.Date

@Composable
fun DashboardScreen(employeeId: String, onLogout: () -> Unit) {
    var isLoading by remember { mutableStateOf(false) }
    var statusMsg by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "Dashboard Pegawai", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))
        Text(text = "Selamat datang, ID: \$employeeId")
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = { 
                isLoading = true
                statusMsg = "Mengirim absen..."
                scope.launch {
                    try {
                        val req = RpcRequest(
                            action = "addDoc",
                            collection = "attendances",
                            data = mapOf(
                                "employeeId" to employeeId,
                                "date" to Date().toString(),
                                "state" to "present",
                                "clockInTime" to Date().toString(),
                                "isLate" to false,
                                "notes" to "Absen via Aplikasi Android Native!"
                            )
                        )
                        apiService.rpc(req)
                        statusMsg = "Absen Berhasil Disimpan di Postgres!"
                    } catch (e: Exception) {
                        statusMsg = "Gagal Absen: \${e.message}"
                    } finally {
                        isLoading = false
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !isLoading
        ) {
            Text(if (isLoading) "Loading..." else "Absen Masuk (Clock In)")
        }
        
        if (statusMsg.isNotEmpty()) {
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = statusMsg, color = MaterialTheme.colorScheme.primary)
        }

        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = onLogout,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
        ) {
            Text("Logout")
        }
    }
}
INNER_EOF

echo "GENERATION_COMPLETE"
