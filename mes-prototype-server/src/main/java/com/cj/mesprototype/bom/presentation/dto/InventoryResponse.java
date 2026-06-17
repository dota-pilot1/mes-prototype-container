package com.cj.mesprototype.bom.presentation.dto;

import com.cj.mesprototype.bom.domain.Inventory;

import java.math.BigDecimal;
import java.time.Instant;

public record InventoryResponse(
        Long id,
        ItemResponse item,
        BigDecimal onHandQty,
        BigDecimal reservedQty,
        BigDecimal availableQty,
        Instant updatedAt
) {
    public static InventoryResponse from(Inventory inventory) {
        return new InventoryResponse(
                inventory.getId(),
                ItemResponse.from(inventory.getItem()),
                inventory.getOnHandQty(),
                inventory.getReservedQty(),
                inventory.getAvailableQty(),
                inventory.getUpdatedAt()
        );
    }
}
