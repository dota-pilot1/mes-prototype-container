package com.cj.mesprototype.productionplan.presentation.dto;

import com.cj.mesprototype.productionplan.domain.PlanStatus;
import com.cj.mesprototype.productionplan.domain.ProductionPlan;

import java.time.LocalDate;

public record ProductionPlanResponse(
        Long id,
        String code,
        Long itemId,
        String itemCode,
        String itemName,
        String bomCode,
        Integer quantity,
        LocalDate startDate,
        LocalDate endDate,
        PlanStatus status
) {
    public static ProductionPlanResponse from(ProductionPlan plan) {
        return new ProductionPlanResponse(
                plan.getId(),
                plan.getCode(),
                plan.getItemId(),
                plan.getItemCode(),
                plan.getItemName(),
                plan.getBomCode(),
                plan.getQuantity(),
                plan.getStartDate(),
                plan.getEndDate(),
                plan.getStatus()
        );
    }
}
