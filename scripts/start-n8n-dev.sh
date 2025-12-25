#!/bin/bash
# n8n-core 개발 환경 시작 스크립트 (커스텀 노드 포함)
# 사용법: ./start-n8n-dev.sh [n8n-core-path]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(dirname "$SCRIPT_DIR")"

# n8n-core 경로
N8N_CORE_PATH="${1:-/Users/junwoobang/n8n/n8n-core}"
ENV_FILE="$N8N_CORE_PATH/.env"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 패치 스크립트 실행
echo -e "${YELLOW}Patching n8n with custom nodes...${NC}"
"$SCRIPT_DIR/patch-n8n-dev.sh" "$N8N_CORE_PATH"

# .env 파일에서 환경변수 로드
if [ -f "$ENV_FILE" ]; then
    echo ""
    echo -e "${GREEN}Loading environment from $ENV_FILE${NC}"
    set -a
    source "$ENV_FILE"
    set +a
fi

# n8n 시작
echo ""
echo -e "${GREEN}Starting n8n dev...${NC}"
echo ""
cd "$N8N_CORE_PATH"
pnpm dev
