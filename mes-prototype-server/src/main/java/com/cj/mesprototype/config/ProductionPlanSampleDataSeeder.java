package com.cj.mesprototype.config;

import com.cj.mesprototype.productionplan.domain.PlanStatus;
import com.cj.mesprototype.productionplan.domain.ProductionPlan;
import com.cj.mesprototype.productionplan.infrastructure.ProductionPlanRepository;
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
@Order(8)
@RequiredArgsConstructor
public class ProductionPlanSampleDataSeeder implements ApplicationRunner {

    private final ProductionPlanRepository productionPlanRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        LocalDate today = LocalDate.now();

        seed("PP-001", 1L, "ITM-001", "태스크 체어", "BOM-001", 200,
                today.plusDays(1), today.plusDays(5), PlanStatus.CONFIRMED);
        seed("PP-002", 2L, "ITM-002", "회의 테이블", "BOM-002", 80,
                today.plusDays(3), today.plusDays(9), PlanStatus.PLANNED);
        seed("PP-003", 1L, "ITM-001", "태스크 체어", "BOM-001", 120,
                today.plusDays(10), today.plusDays(14), PlanStatus.IN_PROGRESS);

        log.info("Seeded sample production plans: {}", productionPlanRepository.count());
    }

    private void seed(
            String code, Long itemId, String itemCode, String itemName, String bomCode,
            int quantity, LocalDate startDate, LocalDate endDate, PlanStatus status
    ) {
        if (productionPlanRepository.existsByCode(code)) {
            return;
        }
        productionPlanRepository.save(ProductionPlan.create(
                code, itemId, itemCode, itemName, bomCode, quantity, startDate, endDate, status));
    }
}
