#!/bin/bash
# n8n-core 개발 환경에서 커스텀 노드 로드를 위한 환경변수 출력
# 사용법:
#   eval $(./patch-n8n-dev.sh)
#   또는
#   source <(./patch-n8n-dev.sh --export)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(dirname "$SCRIPT_DIR")"
PACKAGES_DIR="$MONOREPO_ROOT/packages"

# 옵션 파싱
EXPORT_MODE=false
QUIET_MODE=false

for arg in "$@"; do
    case $arg in
        --export|-e)
            EXPORT_MODE=true
            ;;
        --quiet|-q)
            QUIET_MODE=true
            ;;
    esac
done

# 빌드된 패키지 경로 수집
EXTENSIONS=""
PACKAGE_COUNT=0

for pkg_dir in "$PACKAGES_DIR"/*/; do
    if [ -d "$pkg_dir/dist" ]; then
        pkg_path=$(cd "$pkg_dir" && pwd)
        if [ -n "$EXTENSIONS" ]; then
            EXTENSIONS="$EXTENSIONS;$pkg_path"
        else
            EXTENSIONS="$pkg_path"
        fi
        ((PACKAGE_COUNT++))
    fi
done

if [ $PACKAGE_COUNT -eq 0 ]; then
    echo "# Error: No built packages found. Run 'pnpm build' first." >&2
    exit 1
fi

# export 모드일 경우 바로 export 명령 출력
if [ "$EXPORT_MODE" = true ]; then
    echo "export N8N_CUSTOM_EXTENSIONS=\"$EXTENSIONS\""
    exit 0
fi

# 일반 모드: 정보 출력
if [ "$QUIET_MODE" = false ]; then
    echo "# n8n Custom Nodes Patch" >&2
    echo "# Found $PACKAGE_COUNT package(s):" >&2
    echo "$EXTENSIONS" | tr ';' '\n' | while read -r path; do
        echo "#   - $path" >&2
    done
    echo "#" >&2
    echo "# Usage:" >&2
    echo "#   eval \$(./patch-n8n-dev.sh)" >&2
    echo "#   cd /path/to/n8n-core/packages/cli && node bin/n8n start" >&2
    echo "#" >&2
    echo "# Or use start-n8n-dev.sh for one-step start:" >&2
    echo "#   ./start-n8n-dev.sh" >&2
    echo "" >&2
fi

# export 명령 출력 (eval로 실행 가능)
echo "export N8N_CUSTOM_EXTENSIONS=\"$EXTENSIONS\""
