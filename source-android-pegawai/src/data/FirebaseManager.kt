package com.hrdbospanel.app.data

import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

data class EmployeeData(
    val id: String = "",
    val name: String = "",
    val nik: String = "",
    val role: String = "",
    val locationId: String = "",
    val departmentId: String = "",
    val subDepartmentId: String = ""
)

object FirebaseManager {
    private val db = FirebaseFirestore.getInstance()

    // Fungsi Login menggunakan NIK dan Password langsung menembak Firestore
    suspend fun loginWithNik(nik: String, password: String): Result<EmployeeData> {
        return try {
            val querySnapshot = db.collection("employees")
                .whereEqualTo("nik", nik)
                .whereEqualTo("password", password)
                .get()
                .await()

            if (querySnapshot.isEmpty) {
                Result.failure(Exception("NIK atau Password salah"))
            } else {
                val doc = querySnapshot.documents.first()
                val employee = EmployeeData(
                    id = doc.id,
                    name = doc.getString("name") ?: "",
                    nik = doc.getString("nik") ?: "",
                    role = doc.getString("role") ?: "",
                    locationId = doc.getString("locationId") ?: "",
                    departmentId = doc.getString("departmentId") ?: "",
                    subDepartmentId = doc.getString("subDepartmentId") ?: ""
                )
                Result.success(employee)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Fungsi Absensi (Mencatat clock in Firestore attendance log)
    suspend fun submitAttendance(employeeId: String, lat: Double, lng: Double, type: String): Result<Boolean> {
        return try {
            val attendanceData = hashMapOf(
                "employeeId" to employeeId,
                "timestamp" to System.currentTimeMillis(),
                "latitude" to lat,
                "longitude" to lng,
                "type" to type // "IN" atau "OUT"
            )
            db.collection("attendance_logs").add(attendanceData).await()
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
