package com.cj.mesprototype.bom.application;

import com.cj.mesprototype.bom.domain.Bom;
import com.cj.mesprototype.bom.domain.BomStatus;
import com.cj.mesprototype.bom.domain.Inventory;
import com.cj.mesprototype.bom.domain.Item;
import com.cj.mesprototype.bom.infrastructure.BomRepository;
import com.cj.mesprototype.bom.infrastructure.InventoryRepository;
import com.cj.mesprototype.bom.presentation.dto.MrpCalculateRequest;
import com.cj.mesprototype.bom.presentation.dto.MrpCalculateResponse;
import com.cj.mesprototype.bom.presentation.dto.MrpMaterialResponse;
import com.cj.mesprototype.common.exception.BusinessException;
import com.cj.mesprototype.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MrpService {

    private static final BigDecimal ONE = BigDecimal.ONE;

    private final BomRepository bomRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional(readOnly = true)
    public MrpCalculateResponse calculate(MrpCalculateRequest req) {
        Bom bom = bomRepository.findByProductItemIdAndStatus(req.productItemId(), BomStatus.APPROVED)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOM_NOT_FOUND));

        Map<Long, Inventory> inventoryByItemId = inventoryRepository.findAllByItemIdIn(
                        bom.getLines().stream()
                                .map(line -> line.getMaterialItem().getId())
                                .toList()
                )
                .stream()
                .collect(Collectors.toMap(inventory -> inventory.getItem().getId(), Function.identity()));

        var materials = bom.getLines().stream()
                .map(line -> {
                    Item item = line.getMaterialItem();
                    Inventory inventory = inventoryByItemId.get(item.getId());
                    BigDecimal onHandQty = inventory == null ? BigDecimal.ZERO : inventory.getOnHandQty();
                    BigDecimal reservedQty = inventory == null ? BigDecimal.ZERO : inventory.getReservedQty();
                    BigDecimal availableQty = inventory == null ? BigDecimal.ZERO : inventory.getAvailableQty();
                    BigDecimal safetyStock = item.getSafetyStock();
                    BigDecimal requiredQuantity = req.quantity()
                            .multiply(line.getRequiredQty())
                            .multiply(ONE.add(line.getLossRate()))
                            .setScale(4, RoundingMode.HALF_UP);
                    BigDecimal availableAfterSafetyStock = availableQty.subtract(safetyStock);
                    BigDecimal shortageQuantity = requiredQuantity.subtract(availableAfterSafetyStock).max(BigDecimal.ZERO);

                    return new MrpMaterialResponse(
                            item.getId(),
                            item.getItemCode(),
                            item.getItemName(),
                            item.getUnit(),
                            requiredQuantity,
                            onHandQty,
                            reservedQty,
                            availableQty,
                            safetyStock,
                            shortageQuantity
                    );
                })
                .toList();

        Item productItem = bom.getProductItem();
        return new MrpCalculateResponse(
                productItem.getId(),
                productItem.getItemCode(),
                productItem.getItemName(),
                req.quantity(),
                materials
        );
    }
}
