package com.cj.mesprototype.bom.infrastructure;

import com.cj.mesprototype.bom.domain.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByItemId(Long itemId);

    List<Inventory> findAllByItemIdIn(Collection<Long> itemIds);

    List<Inventory> findAllByOrderByItemItemCodeAsc();
}
