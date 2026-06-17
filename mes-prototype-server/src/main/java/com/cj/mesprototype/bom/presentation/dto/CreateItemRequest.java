package com.cj.mesprototype.bom.presentation.dto;

import com.cj.mesprototype.bom.domain.ItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record CreateItemRequest(
        @NotBlank @Size(max = 100) String itemCode,
        @NotBlank @Size(max = 100) String itemName,
        @NotNull ItemType itemType,
        @NotBlank @Size(max = 20) String unit,
        @PositiveOrZero BigDecimal safetyStock,
        @Size(max = 500) String description
) {
}
