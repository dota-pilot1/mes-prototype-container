package com.cj.mesprototype.bom.presentation.dto;

import com.cj.mesprototype.bom.domain.BomStatus;
import com.cj.mesprototype.bom.domain.Bom;

import java.time.Instant;
import java.util.List;

public record BomResponse(
        Long id,
        String bomCode,
        String bomName,
        ItemResponse productItem,
        String version,
        BomStatus status,
        String description,
        List<BomLineResponse> lines,
        Instant createdAt,
        Instant updatedAt
) {
    public static BomResponse from(Bom bom) {
        return new BomResponse(
                bom.getId(),
                bom.getBomCode(),
                bom.getBomName(),
                ItemResponse.from(bom.getProductItem()),
                bom.getVersion(),
                bom.getStatus(),
                bom.getDescription(),
                bom.getLines().stream().map(BomLineResponse::from).toList(),
                bom.getCreatedAt(),
                bom.getUpdatedAt()
        );
    }
}
