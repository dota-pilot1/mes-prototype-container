package com.cj.mesprototype.bom.presentation.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record MrpCalculateRequest(
        @NotNull Long productItemId,
        @NotNull @Positive BigDecimal quantity
) {
}
