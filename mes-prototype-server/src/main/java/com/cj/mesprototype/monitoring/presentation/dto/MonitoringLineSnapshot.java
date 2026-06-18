package com.cj.mesprototype.monitoring.presentation.dto;

import com.cj.mesprototype.monitoring.domain.LineStatus;

public record MonitoringLineSnapshot(
        String line,
        LineStatus status,
        String workOrderCode,
        String itemName,
        String processName,
        int oee,
        int outputQty,
        int targetQty,
        double defectRate
) {
}
