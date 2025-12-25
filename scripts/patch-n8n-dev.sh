#!/bin/bash
# n8n-core 개발 환경에서 커스텀 노드 로드를 위한 패치 스크립트

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(dirname "$SCRIPT_DIR")"
PACKAGES_DIR="$MONOREPO_ROOT/packages"

# 모든 패키지 경로 수집
EXTENSIONS=""
for pkg in "$PACKAGES_DIR"/*/; do
    if [ -d "$pkg/dist" ]; then
        if [ -n "$EXTENSIONS" ]; then
            EXTENSIONS="$EXTENSIONS;$pkg"
        else
            EXTENSIONS="$pkg"
        fi
    fi
done

if [ -z "$EXTENSIONS" ]; then
    echo "Error: No built packages found. Run 'pnpm build' first."
    exit 1
fi

echo "Found packages:"
echo "$EXTENSIONS" | tr ';' '\n'
echo ""
echo "Add to your shell profile or n8n start script:"
echo ""
echo "export N8N_CUSTOM_EXTENSIONS=\"$EXTENSIONS\""
echo ""

# Export for current session
export N8N_CUSTOM_EXTENSIONS="$EXTENSIONS"
echo "Environment variable set for current session."
