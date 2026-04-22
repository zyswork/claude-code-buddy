# CI 配置（一次设置）

如果想让 GitHub Actions 自动跑 smoke 测试，需要给 gh token 加 `workflow` scope。Claude Code 本身无法代劳（OAuth token 没这个权限）。

## 一键启用

在**你本机**终端跑：

```bash
# 1. 刷新 gh 权限（弹浏览器授权 workflow scope）
gh auth refresh -s workflow

# 2. 切到项目目录
cd /path/to/claude-code-buddy

# 3. 创建 workflow 文件
mkdir -p .github/workflows
cat > .github/workflows/test.yml <<'EOF'
name: test

on:
  push:
    branches: [main]
  pull_request:

jobs:
  smoke:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - name: Run smoke tests
        run: node scripts/test.js
EOF

# 4. 提交并推送
git add .github/workflows/test.yml
git commit -m "ci: github actions smoke tests"
git push
```

推成功后：
- 访问 https://github.com/zyswork/claude-code-buddy/actions 看每次 push 的测试结果
- README 顶部的 test badge 会从灰变绿
