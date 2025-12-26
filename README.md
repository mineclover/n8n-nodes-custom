# n8n-nodes-custom

n8n 커스텀 노드 모노레포

## 구조

```
n8n-nodes-custom/
├── packages/
│   └── google-sheets-style/    # Google Sheets 셀 스타일 노드
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## 컨벤션

### 패키지 네이밍

- **npm 패키지명**: `n8n-nodes-ca-<node-name>`
  - 예: `n8n-nodes-ca-google-sheets-style`
- **디렉토리명**: `<node-name>` (packages/ 하위)
  - 예: `packages/google-sheets-style`

### 필수 키워드

n8n 커뮤니티 노드로 인식되려면 `package.json`에 다음 키워드 필수:

```json
{
  "keywords": ["n8n-community-node-package"]
}
```

### 디렉토리 구조 (패키지별)

```
packages/<node-name>/
├── src/
│   ├── index.ts              # 노드 export
│   └── nodes/
│       └── <NodeName>/
│           ├── <NodeName>.node.ts
│           └── <icon>.svg
├── dist/                     # 빌드 결과물
├── package.json
└── tsconfig.json             # extends ../../tsconfig.base.json
```

## 개발

### n8n-core 개발 환경 설정

n8n-core 개발 모드에서 커스텀 노드를 로드하는 방법.

> **Note**: 패치/실행 스크립트는 `n8n-workflow/scripts/`에서 관리됩니다.

**방법 1: 시작 스크립트 + 핫 리로드 (권장)**
```bash
cd /path/to/n8n-workflow
./scripts/start-n8n-dev.sh --watch --kill     # 핫 리로드 모드
./scripts/start-n8n-dev.sh --build            # 빌드 후 시작
./scripts/start-n8n-dev.sh --list             # 패키지 목록 확인
```

**방법 2: 수동 실행**
```bash
# 터미널 1: 빌드 감시 모드
cd /path/to/n8n-nodes-custom/packages/<node-name>
npx n8n-node dev --external-n8n

# 터미널 2: n8n 실행
export N8N_CUSTOM_EXTENSIONS=~/.n8n/custom
cd /path/to/n8n-core/packages/cli && node bin/n8n start
```

자세한 내용은 [n8n-workflow/docs/development-guide.md](../n8n-workflow/docs/development-guide.md) 참조

### 설치

```bash
pnpm install
```

### 빌드

```bash
# 전체 빌드
pnpm build

# 특정 패키지 빌드
pnpm --filter n8n-nodes-ca-google-sheets-style build
```

### 로컬 개발 (권장)

```bash
# 터미널 1: 심링크 생성 (최초 1회)
cd n8n-nodes-custom
pnpm dev:link

# 터미널 2: 모든 패키지 watch
cd n8n-nodes-custom
pnpm dev

# 터미널 3: n8n 실행
export N8N_CUSTOM_EXTENSIONS=~/.n8n/custom
cd n8n-core && pnpm dev
```

**모노레포 스크립트:**

| 스크립트 | 설명 |
|---------|------|
| `pnpm dev` | 모든 패키지 tsc --watch (병렬) |
| `pnpm dev:link` | 모든 패키지 ~/.n8n/custom에 심링크 |
| `pnpm build` | 모든 패키지 빌드 |

**작동 원리:**
1. `pnpm dev:link`: 각 패키지를 `~/.n8n/custom`에 심링크
2. `pnpm dev`: 모든 패키지 tsc --watch로 변경 감지
3. n8n 재시작으로 변경사항 반영

> **Note**: `npx n8n`에서는 `N8N_CUSTOM_EXTENSIONS`가 동작하지 않음. n8n-core 소스 빌드 필수.

## 배포 및 설치

### npm 퍼블리시

```bash
cd packages/<node-name>
npm publish --access public
```

> OTP 인증 필요. 퍼블리시는 수동으로 진행.

### n8n에서 설치 (프로덕션 권장)

퍼블리시 후 n8n UI에서 설치:

1. **Settings → Community Nodes → Install**
2. 패키지명 입력: `n8n-nodes-ca-<node-name>`

> **프로덕션**: Community Nodes 설치 방식 사용
> **개발**: `--watch` 모드로 로컬 개발 (위 "로컬 개발" 섹션 참조)

## MCP 워크플로우 제어

n8n-mcp로 커스텀 노드 포함 워크플로우 생성/제어 가능.

### 노드 타입 형식

노드 타입은 **설치 방식에 따라 다릅니다**:

| 설치 방식 | 노드 타입 형식 | 예시 |
|----------|---------------|------|
| Community Nodes (npm) | `{pkg-without-n8n}.{name}` | `nodes-ca-google-sheets-style.googleSheetsStyle` |
| N8N_CUSTOM_EXTENSIONS (로컬) | `CUSTOM.{name}` | `CUSTOM.googleSheetsStyle` |

### 워크플로우 예시

**로컬 개발 (--watch 모드):**
```json
{
  "type": "CUSTOM.googleSheetsStyle",
  "typeVersion": 1,
  "parameters": {
    "operation": "getStyle",
    "spreadsheetId": "...",
    "sheetId": 0,
    "range": "A1:C1"
  }
}
```

**프로덕션 (Community Nodes):**
```json
{
  "type": "nodes-ca-google-sheets-style.googleSheetsStyle",
  "typeVersion": 1,
  "parameters": { ... }
}
```

> **주의**: 로컬에서 만든 워크플로우를 프로덕션에 배포 시 노드 타입 변경 필요

### MCP에서 커스텀 노드 검색

n8n-mcp에서 커스텀 노드 검색 가능 (패치 적용 시):

```
search_nodes googleSheetsStyle
```

## 패키지 목록

| 패키지 | 설명 | npm | 워크플로우 타입 |
|--------|------|-----|----------------|
| [google-sheets-style](./packages/google-sheets-style) | Google Sheets 셀 스타일 읽기/쓰기 | `n8n-nodes-ca-google-sheets-style` | `nodes-ca-google-sheets-style.googleSheetsStyle` |
