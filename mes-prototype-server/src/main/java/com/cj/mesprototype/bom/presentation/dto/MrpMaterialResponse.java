package com.cj.mesprototype.bom.presentation.dto;

import java.math.BigDecimal;

public record MrpMaterialResponse(
        Long itemId,
        String itemCode,
        String itemName,
        String unit,
        BigDecimal requiredQuantity,
        BigDecimal onHandQty,
        BigDecimal reservedQty,
        BigDecimal availableQty,
        BigDecimal safetyStock,
        BigDecimal shortageQuantity
) {
}
