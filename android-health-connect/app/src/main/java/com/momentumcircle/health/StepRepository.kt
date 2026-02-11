package com.momentumcircle.health

import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId

class StepRepository(private val healthConnectClient: HealthConnectClient) {

    suspend fun getTodaySteps(): Long {
        return try {
            val now = Instant.now()
            // Start of today (midnight)
            val startTime = LocalDateTime.now()
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .atZone(ZoneId.systemDefault())
                .toInstant()

            val response = healthConnectClient.aggregate(
                AggregateRequest(
                    metrics = setOf(StepsRecord.STEPS_COUNT_TOTAL),
                    timeRangeFilter = TimeRangeFilter.between(startTime, now)
                )
            )

            // Return steps or 0 if null
            response[StepsRecord.STEPS_COUNT_TOTAL] ?: 0
        } catch (e: Exception) {
            e.printStackTrace()
            0
        }
    }
}
