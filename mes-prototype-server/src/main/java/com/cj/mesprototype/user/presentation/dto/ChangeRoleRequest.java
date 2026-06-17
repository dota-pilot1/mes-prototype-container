package com.cj.mesprototype.user.presentation.dto;

import jakarta.validation.constraints.NotNull;

public record ChangeRoleRequest(@NotNull Long roleId) {
}
