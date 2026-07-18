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
