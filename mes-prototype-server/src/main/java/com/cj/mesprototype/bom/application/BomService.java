package com.cj.mesprototype.bom.application;

import com.cj.mesprototype.bom.domain.Bom;
import com.cj.mesprototype.bom.domain.BomLine;
import com.cj.mesprototype.bom.domain.BomStatus;
import com.cj.mesprototype.bom.domain.Inventory;
import com.cj.mesprototype.bom.domain.Item;
import com.cj.mesprototype.bom.infrastructure.BomRepository;
import com.cj.mesprototype.bom.infrastructure.InventoryRepository;
import com.cj.mesprototype.bom.infrastructure.ItemRepository;
import com.cj.mesprototype.bom.presentation.dto.*;
import com.cj.mesprototype.common.exception.BusinessException;
import com.cj.mesprototype.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BomService {

    private final ItemRepository itemRepository;
    private final BomRepository bomRepository;
    private final InventoryRepository inventoryRepository;

    @Transactional(readOnly = true)
    public List<ItemResponse> getItems() {
        return itemRepository.findAllByOrderByItemCodeAsc()
                .stream()
                .map(ItemResponse::from)
                .toList();
    }

    @Transactional
    public ItemResponse createItem(CreateItemRequest req) {
        if (itemRepository.existsByItemCode(req.itemCode())) {
            throw new BusinessException(ErrorCode.ITEM_CODE_DUPLICATE);
        }

        Item item = Item.create(
                req.itemCode(),
                req.itemName(),
                req.itemType(),
                req.unit(),
                req.safetyStock(),
                req.description()
        );
        return ItemResponse.from(itemRepository.save(item));
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> getInventories() {
        return inventoryRepository.findAllByOrderByItemItemCodeAsc()
                .stream()
                .map(InventoryResponse::from)
                .toList();
    }

    @Transactional
    public InventoryResponse upsertInventory(CreateInventoryRequest req) {
        Item item = getItem(req.itemId());
        Inventory inventory = inventoryRepository.findByItemId(req.itemId())
                .orElseGet(() -> Inventory.create(item, req.onHandQty(), req.reservedQty()));
        inventory.update(req.onHandQty(), req.reservedQty());
        return InventoryResponse.from(inventoryRepository.save(inventory));
    }

    @Transactional(readOnly = true)
    public List<BomResponse> getBoms() {
        return bomRepository.findAllByOrderByIdDesc()
                .stream()
                .map(BomResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public BomResponse getBom(Long id) {
        return BomResponse.from(getBomEntity(id));
    }

    @Transactional
    public BomResponse createBom(CreateBomRequest req) {
        if (req.lines() == null || req.lines().isEmpty()) {
            throw new BusinessException(ErrorCode.BOM_LINE_EMPTY);
        }
        if (bomRepository.existsByBomCode(req.bomCode())) {
            throw new BusinessException(ErrorCode.BOM_CODE_DUPLICATE);
        }

        BomStatus status = req.status() == null ? BomStatus.DRAFT : req.status();
        if (status == BomStatus.APPROVED) {
            if (bomRepository.existsByProductItemIdAndStatus(req.productItemId(), BomStatus.APPROVED)) {
                throw new BusinessException(ErrorCode.BOM_PRODUCT_DUPLICATE);
            }
        }

        Item productItem = getItem(req.productItemId());
        Bom bom = Bom.create(
                req.bomCode(),
                req.bomName(),
                productItem,
                req.version(),
                status,
                req.description()
        );

        for (CreateBomLineRequest lineReq : req.lines()) {
            Item materialItem = getItem(lineReq.materialItemId());
            bom.addLine(BomLine.create(
                    materialItem,
                    lineReq.requiredQty(),
                    lineReq.lossRate(),
                    lineReq.description()
            ));
        }

        return BomResponse.from(bomRepository.save(bom));
    }

    private Item getItem(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));
    }

    private Bom getBomEntity(Long id) {
        return bomRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOM_NOT_FOUND));
    }
}
