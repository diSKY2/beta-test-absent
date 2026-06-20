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
    val subDepartmentId: String = "",
    val departmentName: String = "",
    val subDepartmentName: String = ""
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
                val depId = doc.getString("departmentId") ?: ""
                val subDepId = doc.getString("subDepartmentId") ?: ""
                
                var depName = ""
                var subDepName = ""
                
                if (depId.isNotEmpty()) {
                    val depDoc = db.collection("departments").document(depId).get().await()
                    depName = depDoc.getString("name") ?: ""
                }
                
                if (subDepId.isNotEmpty()) {
                    val subDepDoc = db.collection("sub_departments").document(subDepId).get().await()
                    subDepName = subDepDoc.getString("name") ?: ""
                }

                val employee = EmployeeData(
                    id = doc.id,
                    name = doc.getString("name") ?: "",
                    nik = doc.getString("nik") ?: "",
                    role = doc.getString("role") ?: "",
                    locationId = doc.getString("locationId") ?: "",
                    departmentId = depId,
                    subDepartmentId = subDepId,
                    departmentName = depName,
                    subDepartmentName = subDepName
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

    // Fungsi Laporan Kerja (Menyimpan laporan ke koleksi work_reports)
    suspend fun submitWorkReport(employeeId: String, description: String, photoUrl: String = ""): Result<Boolean> {
        return try {
            val reportData = hashMapOf(
                "employeeId" to employeeId,
                "date" to System.currentTimeMillis(),
                "createdAt" to System.currentTimeMillis(),
                "description" to description,
                "photoUrl" to photoUrl
            )
            val docRef = db.collection("work_reports").document() // auto ID
            
            // To sync back to Web App, we should add an 'id' field inside the document if web uses it.
            reportData["id"] = docRef.id
            
            docRef.set(reportData).await()
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
