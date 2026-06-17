지금 교과서적 구현으로 가고 있는거 맞을까 롤만 바꾸면 그 롤에 대한 권한 모두 매핑 되고 그걸 api 나 uiux 에 대한 권한 체크 기준으로 삼으면 되나?
아마 api 에서는 유저가 가진 권한 목록 모두 고려해서 특정 권한에 특정 api 호출 가능 여부 판단 이런식 맞아? 그리고 이권한은 jwt 와 함꼐 전달 되면 되나?

맞아요, 교과서적 RBAC 흐름이에요. 정리하면:

전체 흐름
User → Role → [Permission, Permission, ...]
                    ↓
          API 호출 시 권한 체크
롤 바꾸면 → 그 롤에 매핑된 권한 목록이 자동으로 바뀜. 유저 개별 권한 관리 불필요.

JWT에 권한을 넣는 방식 — 두 가지 선택
A) JWT에 권한 목록 포함 (stateless, 심플)
{
  "sub": "terecal",
  "role": "ROLE_MANAGER",
  "permissions": ["USER_VIEW", "ROLE_VIEW", "DASHBOARD_VIEW"]
}
장점: 매 요청마다 DB 조회 없음
단점: 권한 변경해도 토큰 만료 전까지 반영 안 됨
B) JWT는 role만, 권한은 매 요청마다 DB 조회 (정확하지만 DB 부하)
{ "sub": "terecal", "role": "ROLE_MANAGER" }
Spring Security가 인증 시점에 role → permissions 로드
보일러플레이트 기준 → A 방식 추천
Spring Security에서 GrantedAuthority로 권한 목록을 주입하면:

// JwtAuthenticationFilter
List<GrantedAuthority> authorities = permissions.stream()
    .map(p -> new SimpleGrantedAuthority(p))
    .collect(toList());
// → @PreAuthorize("hasAuthority('USER_VIEW')") 로 체크
프론트는 JWT 디코드하거나 /api/auth/me 응답에서 권한 목록 받아서:

// usePermission("USER_DELETE") 같은 훅으로 버튼/UI 조건부 렌더
현재 구현 기준으로 부족한 것
항목	현재	필요
JWT payload	role만 포함	permissions[] 추가
Spring Security	hasRole() 체크	hasAuthority() 체크로 전환
프론트 authStore	role만 저장	permissions[] 저장
Role-Permission 매핑 UI	미완 (스텝 2)	RolePermissionDialog