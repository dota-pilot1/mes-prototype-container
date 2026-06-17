package com.cj.mesprototype.bom.presentation;

import com.cj.mesprototype.bom.application.BomService;
import com.cj.mesprototype.bom.presentation.dto.*;
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
@Tag(name = "BOM", description = "BOM/MRP 기준정보 관리")
public class BomController {

    private final BomService bomService;

    @GetMapping("/items")
    @Operation(summary = "품목 목록 조회")
    public List<ItemResponse> getItems() {
        return bomService.getItems();
    }

    @PostMapping("/items")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "품목 등록 (ROLE_ADMIN)")
    public ResponseEntity<ItemResponse> createItem(@Valid @RequestBody CreateItemRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bomService.createItem(req));
    }

    @GetMapping("/inventories")
    @Operation(summary = "재고 목록 조회")
    public List<InventoryResponse> getInventories() {
        return bomService.getInventories();
    }

    @PostMapping("/inventories")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "재고 등록/수정 (ROLE_ADMIN)")
    public InventoryResponse upsertInventory(@Valid @RequestBody CreateInventoryRequest req) {
        return bomService.upsertInventory(req);
    }

    @GetMapping("/boms")
    @Operation(summary = "BOM 목록 조회")
    public List<BomResponse> getBoms() {
        return bomService.getBoms();
    }

    @GetMapping("/boms/{id}")
    @Operation(summary = "BOM 상세 조회")
    public BomResponse getBom(@PathVariable Long id) {
        return bomService.getBom(id);
    }

    @PostMapping("/boms")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "BOM 등록 (ROLE_ADMIN)")
    public ResponseEntity<BomResponse> createBom(@Valid @RequestBody CreateBomRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bomService.createBom(req));
    }
}
