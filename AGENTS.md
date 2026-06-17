# Repository Guidelines

## Project Structure & Module Organization

This repository is a Next.js + Spring Boot auth/RBAC boilerplate.

- `mes-prototype-front/`: Next.js 16 frontend using App Router.
- `mes-prototype-front/src/app/`: routes, layouts, and global providers.
- `mes-prototype-front/src/widgets/`, `features/`, `entities/`, `shared/`: Feature-Sliced Design layers. Keep imports flowing downward: `app -> widgets -> features -> entities -> shared`.
- `mes-prototype-server/`: Spring Boot backend.
- `mes-prototype-server/src/main/java/com/cj/mesprototype/`: backend source, organized by bounded contexts such as `auth`, `user`, `role`, `permission`, `menu`, and `common`.
- `mes-prototype-server/src/test/`: backend tests.
- `scripts/create-project-from-template.sh`: copies this boilerplate into a renamed project.

## Build, Test, and Development Commands

Frontend:

```bash
cd mes-prototype-front
npm install
npm run dev      # Next dev server on http://localhost:4100
npm run lint     # ESLint
npm run build    # Production build and type check
```

Backend:

```bash
cd mes-prototype-server
cp .env.example .env
./gradlew bootRun                  # API on http://localhost:4101
./gradlew compileJava testClasses  # Compile source and tests
./gradlew test                     # Run JUnit tests; requires Postgres
```

Database:

```bash
docker compose up -d postgres
```

## Coding Style & Naming Conventions

Use TypeScript, React function components, and path aliases such as `@/shared/ui/...`. Keep frontend files grouped by feature/domain, not by UI type alone. Backend packages should follow the existing DDD-style context layout: `presentation`, `application`, `domain`, and `infrastructure`.

Use clear names: `RolePermissionManager`, `UserManagementService`, `CreateRoleRequest`. Avoid committing generated files.

## Testing Guidelines

Frontend verification currently relies on `npm run lint` and `npm run build`. Backend tests use JUnit with Spring Boot. Name backend tests after the class or behavior under test, for example `AuthServiceTests` or `RoleControllerTests`.

## Commit & Pull Request Guidelines

Follow the existing concise conventional style:

- `feat(front): add ...`
- `docs: update ...`
- `chore: harden ...`

Pull requests should include a short summary, verification commands run, linked issues if applicable, and screenshots for UI changes.

## Security & Configuration Tips

Never commit real secrets. Backend local secrets belong in `mes-prototype-server/.env`, which is ignored. Commit only `.env.example`. `application.yaml` should reference environment variables, not raw keys.
