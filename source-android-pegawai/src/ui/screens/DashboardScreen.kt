package com.hrdbospanel.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    employeeName: String,
    departmentName: String,
    subDepartmentName: String,
    onNavigateToAttendance: () -> Unit,
    onNavigateToReport: () -> Unit,
    onLogOut: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Beranda Pegawai") },
                actions = {
                    TextButton(onClick = onLogOut) {
                        Text("Keluar", color = MaterialTheme.colorScheme.error)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Profile Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Person, contentDescription = "Profile", modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(text = "Selamat Datang,", fontSize = 14.sp)
                        Text(text = employeeName, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        if (departmentName.isNotEmpty()) {
                            Text(text = departmentName + if(subDepartmentName.isNotEmpty()) " - $subDepartmentName" else "", fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            Text("Menu Utama", fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.padding(bottom = 16.dp))

            // Grid Menu (Simple using Columns/Rows)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                MenuButton(
                    icon = Icons.Default.LocationOn,
                    title = "Absensi Geo",
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToAttendance
                )
                MenuButton(
                    icon = Icons.Default.DateRange,
                    title = "Jadwal Shift",
                    modifier = Modifier.weight(1f),
                    onClick = { /* TODO: Navigate to schedule */ }
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                MenuButton(
                    icon = Icons.Default.List,
                    title = "Laporan Kerja",
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToReport
                )
                MenuButton(
                    icon = Icons.Default.List,
                    title = "Izin / Slip",
                    modifier = Modifier.weight(1f),
                    onClick = { /* TODO: Navigate to payroll */ }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MenuButton(icon: ImageVector, title: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = modifier.height(120.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(icon, contentDescription = title, modifier = Modifier.size(36.dp), tint = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = title, fontWeight = FontWeight.Medium)
        }
    }
}
