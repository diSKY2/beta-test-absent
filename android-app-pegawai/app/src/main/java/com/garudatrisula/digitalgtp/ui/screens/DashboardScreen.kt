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
