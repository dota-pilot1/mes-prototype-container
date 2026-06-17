package com.cj.mesprototype.bom.infrastructure;

import com.cj.mesprototype.bom.domain.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {
    boolean existsByItemCode(String itemCode);

    Optional<Item> findByItemCode(String itemCode);

    List<Item> findAllByOrderByItemCodeAsc();
}
