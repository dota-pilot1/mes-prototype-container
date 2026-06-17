package com.cj.mesprototype.bom.infrastructure;

import com.cj.mesprototype.bom.domain.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    boolean existsByItemCode(String itemCode);

    List<Item> findAllByOrderByItemCodeAsc();
}
