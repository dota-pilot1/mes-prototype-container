package com.cj.mesprototype.bom.presentation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record CreateInventoryRequest(
        @NotNull Long itemId,
        @NotNull @PositiveOrZero BigDecimal onHandQty,
        @PositiveOrZero BigDecimal reservedQty
) {
}
