package com.hrdbospanel.app.data

import org.json.JSONObject
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import java.io.OutputStreamWriter
import java.io.InputStreamReader
import java.io.BufferedReader
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class EmployeeData(
    val id: String = "",
    val name: String = "",
    val nik: String = "",
    val role: String = "",
    val profilePicUrl: String = "",
    val locationId: String = "",
    val departmentId: String = "",
    val subDepartmentId: String = "",
    val departmentName: String = "",
    val subDepartmentName: String = ""
)

object FirebaseManager {
    // GANTI IP INI KE IP KOMPUTER SERVER (Jika pakai emulator Android Studio: 10.0.2.2)
    // Jika menggunakan server cloud saat ini (Production/Staging Web HRD):
    private const val BASE_URL = "https://beta-test-absent-production.up.railway.app/api"

    private suspend fun postRequest(endpoint: String, jsonBody: String): String = withContext(Dispatchers.IO) {
        val url = URL("$BASE_URL$endpoint")
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = "POST"
        connection.setRequestProperty("Content-Type", "application/json")
        connection.doOutput = true

        OutputStreamWriter(connection.outputStream).use { writer ->
            writer.write(jsonBody)
            writer.flush()
        }

        val responseCode = connection.responseCode
        val inputStream = if (responseCode in 200..299) connection.inputStream else connection.errorStream
        
        val response = BufferedReader(InputStreamReader(inputStream)).use { it.readText() }
        
        if (responseCode !in 200..299) {
            throw Exception("HTTP $responseCode: $response")
        }
        return@withContext response
    }

    suspend fun loginWithNik(nik: String, password: String): Result<EmployeeData> {
        return try {
            val jsonBody = JSONObject().apply {
                put("nik", nik)
                put("password", password)
            }.toString()

            val response = postRequest("/mobile/login", jsonBody)
            val jsonResponse = JSONObject(response)
            val data = jsonResponse.getJSONObject("data")

            val employee = EmployeeData(
                id = data.optString("id", ""),
                name = data.optString("name", ""),
                nik = data.optString("nik", ""),
                role = data.optString("role", ""),
                profilePicUrl = data.optString("profilePicUrl", ""),
                locationId = data.optString("locationId", ""),
                departmentId = data.optString("departmentId", ""),
                subDepartmentId = data.optString("subDepartmentId", "")
                // we can map dept/subDept names if needed by doing more RPC calls
            )
            Result.success(employee)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitAttendance(employeeId: String, lat: Double, lng: Double, type: String): Result<Boolean> {
        return try {
            val payload = JSONObject().apply {
                put("employeeId", employeeId)
                put("timestamp", System.currentTimeMillis())
                put("latitude", lat)
                put("longitude", lng)
                put("type", type)
            }

            val jsonBody = JSONObject().apply {
                put("action", "addDoc")
                put("collection", "attendance_logs")
                put("data", payload)
            }.toString()

            postRequest("/sql/rpc", jsonBody)
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun submitWorkReport(employeeId: String, description: String, photoUrl: String = ""): Result<Boolean> {
        return try {
            val payload = JSONObject().apply {
                put("employeeId", employeeId)
                put("date", System.currentTimeMillis())
                put("description", description)
                put("photoUrl", photoUrl)
            }

            val jsonBody = JSONObject().apply {
                put("action", "addDoc")
                put("collection", "work_reports")
                put("data", payload)
            }.toString()

            postRequest("/sql/rpc", jsonBody)
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // --- FITUR KETUA REGU: AMBIL ANGGOTA TIM ---
    suspend fun getTeamMembers(subDepartmentId: String): Result<List<EmployeeData>> {
        return try {
            val filters = JSONArray().apply {
                put(JSONObject().apply {
                    put("field", "subDepartmentId")
                    put("op", "==")
                    put("value", subDepartmentId)
                })
            }
            val jsonBody = JSONObject().apply {
                put("action", "getDocs")
                put("collection", "employees")
                put("filters", filters)
            }.toString()

            val response = postRequest("/sql/rpc", jsonBody)
            val jsonArray = JSONArray(response)
            val members = mutableListOf<EmployeeData>()
            for (i in 0 until jsonArray.length()) {
                val data = jsonArray.getJSONObject(i)
                members.add(EmployeeData(
                    id = data.optString("id", ""),
                    name = data.optString("name", ""),
                    nik = data.optString("nik", ""),
                    role = data.optString("role", "")
                ))
            }
            Result.success(members)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
