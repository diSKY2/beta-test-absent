package com.hrdbospanel.app.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.hrdbospanel.app.data.FirebaseManager
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceScreen(
    employeeId: String,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var hasLocationPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context, Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasLocationPermission = isGranted
    }

    var isSubmitting by remember { mutableStateOf(false) }
    var statusMessage by remember { mutableStateOf("") }
    val coroutineScope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Absensi Geofencing") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {

            if (!hasLocationPermission) {
                Text("Membutuhkan akses lokasi untuk absensi.")
                Spacer(modifier = Modifier.height(16.dp))
                Button(onClick = { permissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION) }) {
                    Text("Berikan Akses Lokasi")
                }
            } else {
                Text("Lokasi terdeteksi. Silakan absen masuk atau pulang.")
                Spacer(modifier = Modifier.height(32.dp))

                Button(
                    onClick = {
                        isSubmitting = true
                        statusMessage = ""
                        coroutineScope.launch {
                            // TODO: Ambil latitude & longitude ASLI dari FusedLocationProviderClient
                            val dummyLat = -6.200000 
                            val dummyLng = 106.816666

                            val result = FirebaseManager.submitAttendance(employeeId, dummyLat, dummyLng, "IN")
                            isSubmitting = false
                            if (result.isSuccess) {
                                statusMessage = "Berhasil Absen Masuk!"
                            } else {
                                statusMessage = "Gagal absen: ${result.exceptionOrNull()?.message}"
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("CLOCK IN (MASUK)")
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        isSubmitting = true
                        statusMessage = ""
                        coroutineScope.launch {
                            val dummyLat = -6.200000 
                            val dummyLng = 106.816666
                            val result = FirebaseManager.submitAttendance(employeeId, dummyLat, dummyLng, "OUT")
                            isSubmitting = false
                            if (result.isSuccess) {
                                statusMessage = "Berhasil Absen Pulang!"
                            } else {
                                statusMessage = "Gagal absen: ${result.exceptionOrNull()?.message}"
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("CLOCK OUT (PULANG)")
                }

                if (isSubmitting) {
                    Spacer(modifier = Modifier.height(24.dp))
                    CircularProgressIndicator()
                }

                if (statusMessage.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(statusMessage, color = MaterialTheme.colorScheme.secondary)
                }
            }
        }
    }
}
