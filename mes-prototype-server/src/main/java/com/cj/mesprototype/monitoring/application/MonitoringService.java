package com.cj.mesprototype.monitoring.application;

import com.cj.mesprototype.monitoring.domain.LineStatus;
import com.cj.mesprototype.monitoring.presentation.dto.MonitoringLineSnapshot;
import com.cj.mesprototype.workorder.domain.WorkOrder;
import com.cj.mesprototype.workorder.domain.WorkOrderProcess;
import com.cj.mesprototype.workorder.domain.WorkOrderStatus;
import com.cj.mesprototype.workorder.infrastructure.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 실시간 모니터링 스냅샷을 매 호출마다 즉석에서 생성한다(무상태).
 * 라인/가동상태/작업지시는 실제 작업지시 데이터에서 도출하고,
 * OEE/생산량/불량률은 센서값이 없으므로 시뮬레이션으로 채운다.
 */
@Service
@RequiredArgsConstructor
public class MonitoringService {

    private final WorkOrderRepository workOrderRepository;

    @Transactional(readOnly = true)
    public List<MonitoringLineSnapshot> snapshot() {
        LocalDate today = LocalDate.now();
        List<WorkOrder> orders = workOrderRepository.findAll();

        // 라인(작업장) 목록을 등록 순서대로 수집
        LinkedHashSet<String> lines = new LinkedHashSet<>();
        for (WorkOrder order : orders) {
            for (WorkOrderProcess process : order.getProcesses()) {
                if (process.getWorkstation() != null && !process.getWorkstation().isBlank()) {
                    lines.add(process.getWorkstation());
                }
            }
        }

        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        List<MonitoringLineSnapshot> result = new ArrayList<>();

        for (String line : lines) {
            WorkOrderProcess active = pickActiveProcess(orders, line, today);
            if (active == null) {
                result.add(new MonitoringLineSnapshot(line, LineStatus.IDLE, null, null, null, 0, 0, 0, 0.0));
                continue;
            }

            WorkOrder order = active.getWorkOrder();
            int target = order.getQuantity();
            LineStatus status = switch (active.getStatus()) {
                case IN_PROGRESS -> LineStatus.RUNNING;
                case HOLD -> LineStatus.STOPPED;
                default -> LineStatus.IDLE; // READY/COMPLETED: 배정됐지만 가동 중은 아님
            };

            int oee;
            int output;
            double defect;
            int baseOutput = (int) Math.round(target * active.getProgress() / 100.0);
            if (status == LineStatus.RUNNING) {
                // 라인별 고정 베이스라인 + 미세 변동 → '살아있되' 막 튀지 않게.
                int oeeBase = 74 + Math.floorMod(line.hashCode(), 16);            // 74~89, 라인마다 고정
                oee = Math.max(0, Math.min(99, oeeBase + rnd.nextInt(-2, 3)));    // ±2 살랑
                output = baseOutput;                                              // 진행률 기반, 역행 없음(누적은 안 줄어듦)
                double defectBase = 1.5 + Math.floorMod(line.hashCode(), 20) / 10.0; // 1.5~3.4, 라인마다 고정
                defect = Math.round(Math.max(0.0, defectBase + (rnd.nextDouble() - 0.5) * 0.6) * 10) / 10.0; // ±0.3
            } else if (status == LineStatus.STOPPED) {
                oee = 0;
                output = baseOutput;
                defect = 0.0;
            } else {
                oee = 0;
                output = 0;
                defect = 0.0;
            }

            result.add(new MonitoringLineSnapshot(
                    line, status, order.getCode(), order.getItemName(), active.getProcessName(),
                    oee, output, target, defect));
        }

        return result;
    }

    // 라인에 '지금 올라가 있는' 공정: 진행 중이거나(IN_PROGRESS) 오늘이 공정 기간 안.
    private WorkOrderProcess pickActiveProcess(List<WorkOrder> orders, String line, LocalDate today) {
        WorkOrderProcess best = null;
        for (WorkOrder order : orders) {
            for (WorkOrderProcess process : order.getProcesses()) {
                if (!line.equals(process.getWorkstation())) {
                    continue;
                }
                boolean withinWindow =
                        !today.isBefore(process.getStartDate()) && !today.isAfter(process.getDueDate());
                if (process.getStatus() != WorkOrderStatus.IN_PROGRESS && !withinWindow) {
                    continue;
                }
                if (best == null || priority(process.getStatus()) > priority(best.getStatus())) {
                    best = process;
                }
            }
        }
        return best;
    }

    private int priority(WorkOrderStatus status) {
        return switch (status) {
            case IN_PROGRESS -> 3;
            case HOLD -> 2;
            case READY -> 1;
            case COMPLETED -> 0;
        };
    }
}
