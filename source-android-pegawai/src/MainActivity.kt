package com.hrdbospanel.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.hrdbospanel.app.ui.screens.AttendanceScreen
import com.hrdbospanel.app.ui.screens.DashboardScreen
import com.hrdbospanel.app.ui.screens.LoginScreen
import com.hrdbospanel.app.ui.theme.HRDTheme // Anda bisa generate theme di Android Studio

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            // Gunakan Material 3 Theme bawaan Compose
            MaterialTheme {
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
    
    // State lokal untuk menyimpan session login
    var loggedInEmployeeId by remember { mutableStateOf<String?>(null) }
    var loggedInEmployeeName by remember { mutableStateOf("") }
    var loggedInDepartmentName by remember { mutableStateOf("") }
    var loggedInSubDepartmentName by remember { mutableStateOf("") }

    NavHost(
        navController = navController,
        startDestination = "login"
    ) {
        composable("login") {
            LoginScreen(
                onLoginSuccess = { employee ->
                    loggedInEmployeeId = employee.id
                    loggedInEmployeeName = employee.name
                    loggedInDepartmentName = employee.departmentName
                    loggedInSubDepartmentName = employee.subDepartmentName
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        
        composable("dashboard") {
            DashboardScreen(
                employeeName = loggedInEmployeeName,
                departmentName = loggedInDepartmentName,
                subDepartmentName = loggedInSubDepartmentName,
                onNavigateToAttendance = {
                    navController.navigate("attendance")
                },
                onNavigateToReport = {
                    navController.navigate("report")
                },
                onLogOut = {
                    loggedInEmployeeId = null
                    navController.navigate("login") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }
        
        composable("attendance") {
            AttendanceScreen(
                employeeId = loggedInEmployeeId ?: "",
                onBack = { navController.popBackStack() }
            )
        }

        composable("report") {
            com.hrdbospanel.app.ui.screens.WorkReportScreen(
                employeeId = loggedInEmployeeId ?: "",
                onBack = { navController.popBackStack() }
            )
        }
    }
}
