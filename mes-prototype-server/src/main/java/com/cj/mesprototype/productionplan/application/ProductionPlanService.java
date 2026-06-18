package com.cj.mesprototype.productionplan.application;

import com.cj.mesprototype.common.exception.BusinessException;
import com.cj.mesprototype.common.exception.ErrorCode;
import com.cj.mesprototype.productionplan.domain.ProductionPlan;
import com.cj.mesprototype.productionplan.infrastructure.ProductionPlanRepository;
import com.cj.mesprototype.productionplan.presentation.dto.CreateProductionPlanRequest;
import com.cj.mesprototype.productionplan.presentation.dto.ProductionPlanResponse;
import com.cj.mesprototype.productionplan.presentation.dto.UpdateProductionPlanRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductionPlanService {

    private final ProductionPlanRepository productionPlanRepository;

    @Transactional(readOnly = true)
    public List<ProductionPlanResponse> getPlans() {
        return productionPlanRepository.findAllByOrderByCodeAsc()
                .stream()
                .map(ProductionPlanResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductionPlanResponse getPlan(Long id) {
        return ProductionPlanResponse.from(getEntity(id));
    }

    @Transactional
    public ProductionPlanResponse createPlan(CreateProductionPlanRequest req) {
        if (productionPlanRepository.existsByCode(req.code())) {
            throw new BusinessException(ErrorCode.PRODUCTION_PLAN_CODE_DUPLICATE);
        }
        ProductionPlan plan = ProductionPlan.create(
                req.code(),
                req.itemId(),
                req.itemCode(),
                req.itemName(),
                req.bomCode(),
                req.quantity(),
                req.startDate(),
                req.endDate(),
                req.status()
        );
        return ProductionPlanResponse.from(productionPlanRepository.save(plan));
    }

    @Transactional
    public ProductionPlanResponse updatePlan(Long id, UpdateProductionPlanRequest req) {
        ProductionPlan plan = getEntity(id);
        plan.update(
                req.itemId(),
                req.itemCode(),
                req.itemName(),
                req.bomCode(),
                req.quantity(),
                req.startDate(),
                req.endDate(),
                req.status()
        );
        return ProductionPlanResponse.from(plan);
    }

    @Transactional
    public void deletePlan(Long id) {
        productionPlanRepository.delete(getEntity(id));
    }

    private ProductionPlan getEntity(Long id) {
        return productionPlanRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCTION_PLAN_NOT_FOUND));
    }
}
