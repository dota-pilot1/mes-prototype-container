package com.cj.mesprototype.productionplan.presentation.dto;

import com.cj.mesprototype.productionplan.domain.PlanStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateProductionPlanRequest(
        @NotBlank @Size(max = 100) String code,
        Long itemId,
        @Size(max = 100) String itemCode,
        @NotBlank @Size(max = 200) String itemName,
        @Size(max = 100) String bomCode,
        @NotNull @Positive Integer quantity,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        PlanStatus status
) {
}
