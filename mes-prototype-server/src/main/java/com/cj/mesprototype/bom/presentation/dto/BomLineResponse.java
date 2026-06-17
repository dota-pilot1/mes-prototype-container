package com.cj.mesprototype.bom.presentation.dto;

import com.cj.mesprototype.bom.domain.BomLine;

import java.math.BigDecimal;

public record BomLineResponse(
        Long id,
        ItemResponse materialItem,
        BigDecimal requiredQty,
        BigDecimal lossRate,
        String description
) {
    public static BomLineResponse from(BomLine line) {
        return new BomLineResponse(
                line.getId(),
                ItemResponse.from(line.getMaterialItem()),
                line.getRequiredQty(),
                line.getLossRate(),
                line.getDescription()
        );
    }
}
