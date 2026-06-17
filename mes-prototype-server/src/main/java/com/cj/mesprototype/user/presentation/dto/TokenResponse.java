package com.cj.mesprototype.user.presentation.dto;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        long accessTokenExpiresInSec,
        UserSummary user
) {}
