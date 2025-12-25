#!/bin/bash
# n8n-core 개발 환경 시작 스크립트 (커스텀 노드 포함)
# 사용법: ./start-n8n-dev.sh [n8n-core-path]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(dirname "$SCRIPT_DIR")"
PACKAGES_DIR="$MONOREPO_ROOT/packages"

# n8n-core 경로
N8N_CORE_PATH="${1:-/Users/junwoobang/n8n/n8n-core}"
N8N_CLI_PATH="$N8N_CORE_PATH/packages/cli"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 빌드된 패키지 경로 수집
EXTENSIONS=""
for pkg_dir in "$PACKAGES_DIR"/*/; do
    if [ -d "$pkg_dir/dist" ]; then
        pkg_path=$(cd "$pkg_dir" && pwd)
        if [ -n "$EXTENSIONS" ]; then
            EXTENSIONS="$EXTENSIONS;$pkg_path"
        else
            EXTENSIONS="$pkg_path"
        fi
    fi
done

if [ -z "$EXTENSIONS" ]; then
    echo -e "${YELLOW}Warning: No built packages found. Run 'pnpm build' first.${NC}"
fi

# 환경변수 설정
export N8N_CUSTOM_EXTENSIONS="$EXTENSIONS"

echo -e "${GREEN}=== Starting n8n with Custom Nodes ===${NC}"
echo ""
echo -e "${YELLOW}N8N_CUSTOM_EXTENSIONS:${NC}"
echo "$EXTENSIONS" | tr ';' '\n' | while read -r path; do
    [ -n "$path" ] && echo "  - $path"
done
echo ""

# n8n 시작
cd "$N8N_CLI_PATH"
node bin/n8n start
