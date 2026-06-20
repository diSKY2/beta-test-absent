package com.hrdbospanel.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hrdbospanel.app.data.FirebaseManager
import kotlinx.coroutines.launch

import com.hrdbospanel.app.data.EmployeeData

@Composable
fun LoginScreen(onLoginSuccess: (EmployeeData) -> Unit) {
    var nik by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }
    
    val coroutineScope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "HRD BOS PANEL", fontSize = 24.sp, color = MaterialTheme.colorScheme.primary)
        Text(text = "Aplikasi Pegawai", fontSize = 16.sp, modifier = Modifier.padding(bottom = 32.dp))

        OutlinedTextField(
            value = nik,
            onValueChange = { nik = it },
            label = { Text("NIK (Nomor Induk Karyawan)") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )

        if (errorMessage.isNotEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = errorMessage, color = MaterialTheme.colorScheme.error)
        }

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = {
                if (nik.isBlank() || password.isBlank()) {
                    errorMessage = "Harap isi NIK dan Password"
                    return@Button
                }
                isLoading = true
                errorMessage = ""
                coroutineScope.launch {
                    val result = FirebaseManager.loginWithNik(nik, password)
                    isLoading = false
                    result.onSuccess { employee ->
                        onLoginSuccess(employee)
                    }.onFailure {
                        errorMessage = it.message ?: "Terjadi kesalahan"
                    }
                }
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = !isLoading
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
            } else {
                Text("MASUK")
            }
        }
    }
}
