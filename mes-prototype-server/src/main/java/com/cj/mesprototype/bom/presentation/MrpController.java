package com.cj.mesprototype.bom.presentation;

import com.cj.mesprototype.bom.application.MrpService;
import com.cj.mesprototype.bom.presentation.dto.MrpCalculateRequest;
import com.cj.mesprototype.bom.presentation.dto.MrpCalculateResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mrp")
@RequiredArgsConstructor
@Tag(name = "MRP", description = "BOM 기반 자재 소요량 계산")
public class MrpController {

    private final MrpService mrpService;

    @PostMapping("/calculate")
    @Operation(summary = "MRP 계산")
    public MrpCalculateResponse calculate(@Valid @RequestBody MrpCalculateRequest req) {
        return mrpService.calculate(req);
    }
}
