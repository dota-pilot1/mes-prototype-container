package com.cj.mesprototype.config;

import com.cj.mesprototype.workorder.domain.WorkOrder;
import com.cj.mesprototype.workorder.domain.WorkOrderProcess;
import com.cj.mesprototype.workorder.domain.WorkOrderStatus;
import com.cj.mesprototype.workorder.infrastructure.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Slf4j
@Component
@Order(7)
@RequiredArgsConstructor
public class WorkOrderSampleDataSeeder implements ApplicationRunner {

    private final WorkOrderRepository workOrderRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        LocalDate today = LocalDate.now();

        if (!workOrderRepository.existsByCode("WO-001")) {
            WorkOrder wo1 = WorkOrder.create(
                    "WO-001", "PP-001", "ITM-001", "태스크 체어", 200,
                    today.plusDays(1), today.plusDays(5),
                    "의자 조립 1라인", "김민준", WorkOrderStatus.READY);
            wo1.addProcess(WorkOrderProcess.create(1, "PROC-001", "자재 출고", "자재 창고", "김민준",
                    today.plusDays(1), today.plusDays(1), 100, WorkOrderStatus.COMPLETED));
            wo1.addProcess(WorkOrderProcess.create(2, "PROC-002", "좌판 가공", "목공 1라인", "김민준",
                    today.plusDays(2), today.plusDays(3), 60, WorkOrderStatus.IN_PROGRESS));
            wo1.addProcess(WorkOrderProcess.create(3, "PROC-003", "프레임 조립", "의자 조립 1라인", "최하윤",
                    today.plusDays(4), today.plusDays(4), 0, WorkOrderStatus.READY));
            wo1.addProcess(WorkOrderProcess.create(4, "PROC-009", "검사/포장", "검사 포장실", "정검사",
                    today.plusDays(5), today.plusDays(5), 0, WorkOrderStatus.READY));
            workOrderRepository.save(wo1);
        }

        if (!workOrderRepository.existsByCode("WO-002")) {
            WorkOrder wo2 = WorkOrder.create(
                    "WO-002", "PP-002", "ITM-002", "회의 테이블", 80,
                    today.plusDays(3), today.plusDays(9),
                    "테이블 조립 1라인", "박서연", WorkOrderStatus.IN_PROGRESS);
            wo2.addProcess(WorkOrderProcess.create(1, "PROC-004", "자재 출고", "자재 창고", "박서연",
                    today.plusDays(3), today.plusDays(3), 100, WorkOrderStatus.COMPLETED));
            wo2.addProcess(WorkOrderProcess.create(2, "PROC-005", "상판 재단", "목공 2라인", "박서연",
                    today.plusDays(4), today.plusDays(6), 45, WorkOrderStatus.IN_PROGRESS));
            wo2.addProcess(WorkOrderProcess.create(3, "PROC-006", "엣지 밴딩", "엣지 밴딩기", "최하윤",
                    today.plusDays(7), today.plusDays(8), 0, WorkOrderStatus.READY));
            wo2.addProcess(WorkOrderProcess.create(4, "PROC-010", "프레임 조립", "테이블 조립 1라인", "박서연",
                    today.plusDays(9), today.plusDays(9), 0, WorkOrderStatus.READY));
            workOrderRepository.save(wo2);
        }

        if (!workOrderRepository.existsByCode("WO-003")) {
            WorkOrder wo3 = WorkOrder.create(
                    "WO-003", "PP-003", "ITM-001", "태스크 체어", 120,
                    today.plusDays(10), today.plusDays(14),
                    "의자 조립 1라인", "이도윤", WorkOrderStatus.HOLD);
            wo3.addProcess(WorkOrderProcess.create(1, "PROC-007", "가스 리프트 입고 대기", "자재 창고", "이도윤",
                    today.plusDays(10), today.plusDays(10), 0, WorkOrderStatus.HOLD));
            wo3.addProcess(WorkOrderProcess.create(2, "PROC-008", "의자 조립", "의자 조립 1라인", "이도윤",
                    today.plusDays(11), today.plusDays(13), 0, WorkOrderStatus.READY));
            wo3.addProcess(WorkOrderProcess.create(3, "PROC-011", "검사/포장", "검사 포장실", "정검사",
                    today.plusDays(14), today.plusDays(14), 0, WorkOrderStatus.READY));
            workOrderRepository.save(wo3);
        }

        log.info("Seeded sample work orders: {}", workOrderRepository.count());
    }
}
