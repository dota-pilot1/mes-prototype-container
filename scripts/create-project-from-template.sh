#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/create-project-from-template.sh TARGET_DIR APP_SLUG DISPLAY_NAME DB_NAME JAVA_PACKAGE FRONT_PORT BACKEND_PORT DB_PORT

Example:
  scripts/create-project-from-template.sh /Users/terecal/RestaurantBook restaurant-book RestaurantBook restaurant_book com.cj.restaurantbook 4200 4201 5435

Creates:
  TARGET_DIR/APP_SLUG-front
  TARGET_DIR/APP_SLUG-server
  TARGET_DIR/docker-compose.yml
USAGE
}

if [ "$#" -ne 8 ]; then
  usage
  exit 1
fi

target_dir="$1"
app_slug="$2"
display_name="$3"
db_name="$4"
java_package="$5"
front_port="$6"
backend_port="$7"
db_port="$8"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
template_root="$(cd "$script_dir/.." && pwd)"
front_dir="$target_dir/${app_slug}-front"
server_dir="$target_dir/${app_slug}-server"
java_package_path="$(printf '%s' "$java_package" | tr '.' '/')"
app_class="${display_name//[^[:alnum:]]/}ServerApplication"
app_test_class="${display_name//[^[:alnum:]]/}ServerApplicationTests"

if [ -e "$front_dir" ] || [ -e "$server_dir" ]; then
  echo "Target front/server directory already exists. Remove it first or choose a different APP_SLUG." >&2
  exit 1
fi

mkdir -p "$target_dir"

rsync -a \
  --exclude node_modules \
  --exclude .next \
  --exclude out \
  --exclude build \
  --exclude dist \
  --exclude .vite \
  --exclude coverage \
  --exclude .env \
  --exclude '.env*' \
  --exclude '*.tsbuildinfo' \
  "$template_root/beauty-book--front/" "$front_dir/"

rsync -a \
  --exclude .gradle \
  --exclude build \
  --exclude out \
  --exclude bin \
  --exclude .idea \
  --exclude .env \
  --exclude src/main/resources/application-local.yaml \
  "$template_root/beauty-book-server/" "$server_dir/"

rsync -a "$template_root/docker-compose.yml" "$target_dir/docker-compose.yml"

perl -pi -e "s/beauty-book-front/${app_slug}-front/g; s/beauty-book--front/${app_slug}-front/g; s/BeautyBook/${display_name}/g; s/beauty-book/${app_slug}/g; s/beauty_book/${db_name}/g; s/beautybook/${app_slug//-/}/g; s/http:\\/\\/localhost:4101/http:\\/\\/localhost:${backend_port}/g; s/next dev -p 4100/next dev -p ${front_port}/g; s/next start -p 4100/next start -p ${front_port}/g; s/http:\\/\\/localhost:4100/http:\\/\\/localhost:${front_port}/g; s/\\| Front \\(Next\\.js\\) \\| 4100 \\|/| Front (Next.js) | ${front_port} |/g; s/\\| Backend \\(Spring Boot\\) \\| 4101 \\|/| Backend (Spring Boot) | ${backend_port} |/g; s/\\| Postgres \\(host\\) \\| 5434 \\|/| Postgres (host) | ${db_port} |/g; s#/BeautyBook#/${display_name}#g" \
  $(find "$front_dir" -type f)

perl -pi -e "s/com\\.cj\\.beautybook/${java_package}/g; s/BeautyBookServerApplication/${app_class}/g; s/BeautyBookServerApplicationTests/${app_test_class}/g; s/BeautyBook/${display_name}/g; s/beauty-book-server/${app_slug}-server/g; s/beauty-book/${app_slug}/g; s/beauty_book/${db_name}/g; s/beautybook/${app_slug//-/}/g; s/port: 4101/port: ${backend_port}/g; s/localhost:5434\\/${db_name}/localhost:${db_port}\\/${db_name}/g; s/http:\\/\\/localhost:4100/http:\\/\\/localhost:${front_port}/g" \
  $(find "$server_dir" -type f)

perl -pi -e "s/beauty-book-postgres/${app_slug}-postgres/g; s/POSTGRES_DB: beauty_book/POSTGRES_DB: ${db_name}/g; s/\"5434:5432\"/\"${db_port}:5432\"/g; s/postgres_data/${app_slug//-/_}_postgres_data/g" \
  "$target_dir/docker-compose.yml"

old_main_package_dir="$server_dir/src/main/java/com/cj/beautybook"
new_main_package_dir="$server_dir/src/main/java/$java_package_path"
old_test_package_dir="$server_dir/src/test/java/com/cj/beautybook"
new_test_package_dir="$server_dir/src/test/java/$java_package_path"

mkdir -p "$(dirname "$new_main_package_dir")" "$(dirname "$new_test_package_dir")"
mv "$old_main_package_dir" "$new_main_package_dir"
mv "$new_main_package_dir/BeautyBookServerApplication.java" "$new_main_package_dir/${app_class}.java"
mv "$old_test_package_dir" "$new_test_package_dir"
mv "$new_test_package_dir/BeautyBookServerApplicationTests.java" "$new_test_package_dir/${app_test_class}.java"

rm -f "$server_dir/src/main/resources/application-local.yaml"

cat > "$target_dir/README.md" <<README
# ${display_name}

Generated from the auth/RBAC boilerplate.

## Run

\`\`\`bash
docker compose up -d postgres
\`\`\`

\`\`\`bash
cd ${app_slug}-server
./gradlew bootRun
\`\`\`

\`\`\`bash
cd ${app_slug}-front
npm install
npm run dev
\`\`\`

| Service | URL |
| --- | --- |
| Frontend | http://localhost:${front_port} |
| Backend API | http://localhost:${backend_port} |
| Swagger | http://localhost:${backend_port}/swagger-ui/index.html |
| Postgres | localhost:${db_port}/${db_name} |
README

echo "Created ${display_name} at ${target_dir}"
