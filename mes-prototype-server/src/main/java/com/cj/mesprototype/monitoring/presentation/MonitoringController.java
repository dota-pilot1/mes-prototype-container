package com.cj.mesprototype.monitoring.presentation;

import com.cj.mesprototype.monitoring.application.MonitoringService;
import com.cj.mesprototype.monitoring.presentation.dto.MonitoringLineSnapshot;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Monitoring", description = "실시간 모니터링")
public class MonitoringController {

    private final MonitoringService monitoringService;

    @GetMapping("/monitoring/snapshot")
    @Operation(summary = "라인별 실시간 현황 스냅샷 (작업지시 기반 + 시뮬레이션)")
    public List<MonitoringLineSnapshot> snapshot() {
        return monitoringService.snapshot();
    }
}
