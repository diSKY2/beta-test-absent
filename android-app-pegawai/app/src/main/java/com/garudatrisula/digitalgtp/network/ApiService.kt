package com.garudatrisula.digitalgtp.network

import com.google.gson.JsonElement
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit

// GANTI DENGAN URL TUNNEL CLOUDFLARE KAMU!!
// JANGAN LUPA TAMBAHKAN /api/sql/ DI BELAKANGNYA
private const val BASE_URL = "https://garudatrisulaperkasa.web.id/api/sql/"

val logging = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY }
val client = OkHttpClient.Builder()
    .addInterceptor(logging)
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .build()

val retrofit: Retrofit = Retrofit.Builder()
    .baseUrl(BASE_URL)
    .client(client)
    .addConverterFactory(GsonConverterFactory.create())
    .build()

interface ApiService {
    @POST("rpc")
    suspend fun rpc(@Body body: RpcRequest): JsonElement
}

val apiService: ApiService = retrofit.create(ApiService::class.java)

data class RpcRequest(
    val action: String,
    val collection: String,
    val filters: List<Filter>? = null,
    val data: Map<String, Any>? = null,
    val docId: String? = null
)

data class Filter(
    val field: String,
    val operator: String,
    val value: String
)
