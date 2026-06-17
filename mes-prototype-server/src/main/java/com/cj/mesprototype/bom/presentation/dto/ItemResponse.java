package com.cj.mesprototype.bom.presentation.dto;

import com.cj.mesprototype.bom.domain.Item;
import com.cj.mesprototype.bom.domain.ItemType;

import java.math.BigDecimal;
import java.time.Instant;

public record ItemResponse(
        Long id,
        String itemCode,
        String itemName,
        ItemType itemType,
        String unit,
        BigDecimal safetyStock,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
    public static ItemResponse from(Item item) {
        return new ItemResponse(
                item.getId(),
                item.getItemCode(),
                item.getItemName(),
                item.getItemType(),
                item.getUnit(),
                item.getSafetyStock(),
                item.getDescription(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
