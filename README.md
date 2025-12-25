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

### 로컬 테스트

```bash
cd ~/.n8n
npm install /path/to/n8n-nodes-custom/packages/<node-name>
# n8n 재시작
```

## 배포

### npm 퍼블리시

```bash
cd packages/<node-name>
npm publish --access public
```

> OTP 인증 필요. 퍼블리시는 수동으로 진행.

### n8n에서 설치

퍼블리시 후 n8n UI에서:

**Settings → Community Nodes → Install**

패키지명 입력: `n8n-nodes-ca-<node-name>`

## 패키지 목록

| 패키지 | 설명 | npm |
|--------|------|-----|
| [google-sheets-style](./packages/google-sheets-style) | Google Sheets 셀 스타일 읽기/쓰기 | `n8n-nodes-ca-google-sheets-style` |
