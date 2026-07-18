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
