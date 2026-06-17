package com.cj.mesprototype.bom.presentation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record CreateBomLineRequest(
        @NotNull Long materialItemId,
        @NotNull @Positive BigDecimal requiredQty,
        @PositiveOrZero BigDecimal lossRate,
        String description
) {
}
