package com.cj.mesprototype.productionplan.presentation;

import com.cj.mesprototype.productionplan.application.ProductionPlanService;
import com.cj.mesprototype.productionplan.presentation.dto.CreateProductionPlanRequest;
import com.cj.mesprototype.productionplan.presentation.dto.ProductionPlanResponse;
import com.cj.mesprototype.productionplan.presentation.dto.UpdateProductionPlanRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "ProductionPlan", description = "생산계획 관리")
public class ProductionPlanController {

    private final ProductionPlanService productionPlanService;

    @GetMapping("/production-plans")
    @Operation(summary = "생산계획 목록 조회")
    public List<ProductionPlanResponse> getPlans() {
        return productionPlanService.getPlans();
    }

    @GetMapping("/production-plans/{id}")
    @Operation(summary = "생산계획 상세 조회")
    public ProductionPlanResponse getPlan(@PathVariable Long id) {
        return productionPlanService.getPlan(id);
    }

    @PostMapping("/production-plans")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "생산계획 등록 (ROLE_ADMIN)")
    public ResponseEntity<ProductionPlanResponse> createPlan(
            @Valid @RequestBody CreateProductionPlanRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productionPlanService.createPlan(req));
    }

    @PutMapping("/production-plans/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "생산계획 수정 (ROLE_ADMIN)")
    public ProductionPlanResponse updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductionPlanRequest req) {
        return productionPlanService.updatePlan(id, req);
    }

    @DeleteMapping("/production-plans/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "생산계획 삭제 (ROLE_ADMIN)")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        productionPlanService.deletePlan(id);
        return ResponseEntity.noContent().build();
    }
}
