package com.cj.mesprototype.bom.presentation.dto;

import com.cj.mesprototype.bom.domain.BomStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateBomRequest(
        @NotBlank @Size(max = 100) String bomCode,
        @NotBlank @Size(max = 100) String bomName,
        @NotNull Long productItemId,
        @NotBlank @Size(max = 50) String version,
        BomStatus status,
        @Size(max = 500) String description,
        @Valid @NotEmpty List<CreateBomLineRequest> lines
) {
}
