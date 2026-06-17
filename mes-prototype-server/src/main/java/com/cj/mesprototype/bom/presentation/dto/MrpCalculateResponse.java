package com.cj.mesprototype.bom.presentation.dto;

import java.math.BigDecimal;
import java.util.List;

public record MrpCalculateResponse(
        Long productItemId,
        String productItemCode,
        String productItemName,
        BigDecimal quantity,
        List<MrpMaterialResponse> materials
) {
}
