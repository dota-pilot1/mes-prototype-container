package com.cj.mesprototype.permission.application;

import com.cj.mesprototype.common.exception.BusinessException;
import com.cj.mesprototype.common.exception.ErrorCode;
import com.cj.mesprototype.permission.domain.Permission;
import com.cj.mesprototype.permission.infrastructure.PermissionRepository;
import com.cj.mesprototype.permission.presentation.dto.CreatePermissionRequest;
import com.cj.mesprototype.permission.presentation.dto.UpdatePermissionRequest;
import com.cj.mesprototype.permission_category.application.PermissionCategoryService;
import com.cj.mesprototype.permission_category.domain.PermissionCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final PermissionCategoryService categoryService;

    @Transactional(readOnly = true)
    public List<Permission> findAll(String categoryCode) {
        if (categoryCode != null && !categoryCode.isBlank()) {
            PermissionCategory cat = categoryService.getByCode(categoryCode);
            return permissionRepository.findAllByCategory(cat);
        }
        return permissionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Permission getById(Long id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PERMISSION_NOT_FOUND));
    }

    @Transactional
    public Permission create(CreatePermissionRequest req) {
        if (permissionRepository.existsByCode(req.code())) {
            throw new BusinessException(ErrorCode.PERMISSION_CODE_DUPLICATE);
        }
        PermissionCategory cat = categoryService.getByCode(req.categoryCode());
        return permissionRepository.save(
                Permission.create(req.code(), req.name(), req.description(), cat));
    }

    @Transactional
    public Permission update(Long id, UpdatePermissionRequest req) {
        Permission permission = getById(id);
        PermissionCategory cat = categoryService.getByCode(req.categoryCode());
        permission.update(req.name(), req.description(), cat);
        return permission;
    }

    @Transactional
    public void delete(Long id) {
        Permission permission = getById(id);
        permissionRepository.delete(permission);
    }
}
