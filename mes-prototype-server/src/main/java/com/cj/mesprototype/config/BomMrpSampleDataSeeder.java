package com.cj.mesprototype.config;

import com.cj.mesprototype.bom.domain.*;
import com.cj.mesprototype.bom.infrastructure.BomRepository;
import com.cj.mesprototype.bom.infrastructure.InventoryRepository;
import com.cj.mesprototype.bom.infrastructure.ItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Component
@Order(6)
@RequiredArgsConstructor
public class BomMrpSampleDataSeeder implements ApplicationRunner {

    private final ItemRepository itemRepository;
    private final BomRepository bomRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Item chair = seedItem("ITM-001", "의자", ItemType.PRODUCT, "EA", "사무용 의자");
        Item desk = seedItem("ITM-002", "책상", ItemType.PRODUCT, "EA", "사무용 책상");
        Item wood = seedItem("ITM-003", "나무", ItemType.MATERIAL, "EA", "목재 부품");
        Item bolt = seedItem("ITM-004", "볼트", ItemType.MATERIAL, "EA", "체결용 볼트");
        Item adhesive = seedItem("ITM-005", "접착제", ItemType.MATERIAL, "EA", "조립용 접착제");

        seedInventory(wood, "500");
        seedInventory(bolt, "2000");
        seedInventory(adhesive, "100");

        seedChairBom(chair, wood, bolt);
        seedDeskBom(desk, wood, bolt, adhesive);
    }

    private Item seedItem(
            String itemCode,
            String itemName,
            ItemType itemType,
            String unit,
            String description
    ) {
        return itemRepository.findByItemCode(itemCode)
                .orElseGet(() -> {
                    Item item = itemRepository.save(Item.create(
                            itemCode,
                            itemName,
                            itemType,
                            unit,
                            BigDecimal.ZERO,
                            description
                    ));
                    log.info("Seeded sample item: {} ({})", itemCode, itemName);
                    return item;
                });
    }

    private void seedInventory(Item item, String onHandQty) {
        if (inventoryRepository.findByItemId(item.getId()).isPresent()) {
            return;
        }

        inventoryRepository.save(Inventory.create(
                item,
                new BigDecimal(onHandQty),
                BigDecimal.ZERO
        ));
        log.info("Seeded sample inventory: {} {}", item.getItemCode(), onHandQty);
    }

    private void seedChairBom(Item chair, Item wood, Item bolt) {
        if (bomRepository.existsByBomCode("BOM-001")) {
            return;
        }

        Bom bom = Bom.create(
                "BOM-001",
                "의자 표준 BOM",
                chair,
                "1.0",
                BomStatus.APPROVED,
                "의자 기본 생산용 BOM"
        );
        bom.addLine(BomLine.create(wood, new BigDecimal("1"), BigDecimal.ZERO, "의자 1개당 나무 1개"));
        bom.addLine(BomLine.create(bolt, new BigDecimal("4"), BigDecimal.ZERO, "의자 1개당 볼트 4개"));
        bomRepository.save(bom);
        log.info("Seeded sample BOM: BOM-001");
    }

    private void seedDeskBom(Item desk, Item wood, Item bolt, Item adhesive) {
        if (bomRepository.existsByBomCode("BOM-002")) {
            return;
        }

        Bom bom = Bom.create(
                "BOM-002",
                "책상 표준 BOM",
                desk,
                "1.0",
                BomStatus.APPROVED,
                "책상 기본 생산용 BOM"
        );
        bom.addLine(BomLine.create(wood, new BigDecimal("4"), BigDecimal.ZERO, "책상 1개당 나무 4개"));
        bom.addLine(BomLine.create(bolt, new BigDecimal("8"), BigDecimal.ZERO, "책상 1개당 볼트 8개"));
        bom.addLine(BomLine.create(adhesive, new BigDecimal("1"), BigDecimal.ZERO, "책상 1개당 접착제 1개"));
        bomRepository.save(bom);
        log.info("Seeded sample BOM: BOM-002");
    }
}
