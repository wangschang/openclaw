# OpenClaw 打包快速参考 / Quick Packaging Reference

## 快速决策树 / Quick Decision Tree

```
你想部署到哪里？/ Where do you want to deploy?
│
├─ 个人开发机 / Personal Dev Machine
│  └→ NPM: npm install -g openclaw@latest
│
├─ macOS 桌面 / macOS Desktop
│  └→ Native App: 下载 DMG / Download DMG
│
├─ Linux 服务器 / Linux Server
│  ├─ 有 Docker / Has Docker
│  │  └→ Docker: docker-compose up -d
│  └─ 无 Docker / No Docker
│     └→ NPM: npm install -g openclaw@latest
│
├─ 企业环境 / Enterprise
│  └→ Docker + Private Registry
│
└─ 移动设备 / Mobile
   └→ 当前仅内部版本 / Currently internal only
```

---

## 一行命令安装 / One-Line Installation

### Linux/macOS

```bash
# 自动安装（推荐）/ Automatic installation (recommended)
curl -fsSL https://openclaw.ai/install.sh | bash

# 或 NPM 直接安装 / Or direct NPM
npm install -g openclaw@latest
```

### Windows

```powershell
# PowerShell 安装 / PowerShell installation
iwr -useb https://openclaw.ai/install.ps1 | iex

# 或通过 WSL2 / Or via WSL2
wsl curl -fsSL https://openclaw.ai/install.sh | bash
```

### Docker

```bash
# 快速启动 / Quick start
./docker-setup.sh

# 或手动 / Or manual
docker pull ghcr.io/openclaw/openclaw:latest
docker-compose up -d openclaw-gateway
```

---

## 按场景打包 / Packaging by Scenario

### 🖥️ 桌面使用 / Desktop Use

| 平台 / Platform | 方法 / Method | 命令 / Command |
|-----------------|---------------|----------------|
| macOS | Native App | 下载并安装 OpenClaw.dmg |
| Linux | NPM | `npm install -g openclaw@latest` |
| Windows | WSL2 + NPM | `wsl npm install -g openclaw@latest` |

### 🔧 开发环境 / Development

```bash
# 从源码构建 / Build from source
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm openclaw onboard
```

### 🏢 生产部署 / Production Deployment

```bash
# Docker Compose（推荐）/ Docker Compose (recommended)
docker-compose up -d openclaw-gateway

# 或 systemd 服务 / Or systemd service
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

### 📦 离线安装 / Offline Installation

```bash
# 1. 在线机器打包 / On online machine, package
npm pack openclaw

# 2. 传输到离线机器 / Transfer to offline machine
scp openclaw-2026.1.30.tgz offline-server:~/

# 3. 离线安装 / Install offline
npm install -g ~/openclaw-2026.1.30.tgz
```

---

## 版本选择 / Version Selection

```bash
# 稳定版（推荐）/ Stable (recommended)
npm install -g openclaw@latest

# 测试版 / Beta
npm install -g openclaw@beta

# 开发版 / Dev
npm install -g openclaw@dev

# 特定版本 / Specific version
npm install -g openclaw@2026.1.30
```

---

## 常见问题快速解决 / Quick Troubleshooting

### 问题：npm 权限错误 / Issue: npm permission error

```bash
# 解决方案：配置用户目录 / Solution: Configure user directory
mkdir ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g openclaw@latest
```

### 问题：Node.js 版本过低 / Issue: Node.js version too old

```bash
# macOS: 使用 Homebrew / macOS: Use Homebrew
brew install node@22

# Linux: 使用 NodeSource / Linux: Use NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 或使用 nvm / Or use nvm
nvm install 22
nvm use 22
```

### 问题：sharp 安装失败 / Issue: sharp installation fails

```bash
# 解决方案：跳过全局 libvips / Solution: Skip global libvips
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

### 问题：Docker 拉取失败 / Issue: Docker pull fails

```bash
# 使用镜像（中国）/ Use mirror (China)
# 配置 Docker daemon.json
{
  "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]
}

# 重启 Docker
sudo systemctl restart docker
```

---

## 构建自定义包 / Build Custom Package

### 修改并重新打包 / Modify and repackage

```bash
# 1. Clone 并修改 / Clone and modify
git clone https://github.com/openclaw/openclaw.git
cd openclaw
# ... 进行修改 / make changes ...

# 2. 构建 / Build
pnpm install
pnpm build

# 3. 打包 / Package
npm pack

# 4. 安装自定义包 / Install custom package
npm install -g ./openclaw-2026.1.30.tgz
```

### 构建 Docker 镜像 / Build Docker image

```bash
# 构建 / Build
docker build -t my-openclaw:latest .

# 推送到私有仓库 / Push to private registry
docker tag my-openclaw:latest registry.company.com/openclaw:latest
docker push registry.company.com/openclaw:latest
```

### 构建 macOS 应用 / Build macOS app

```bash
# 构建 .app / Build .app
./scripts/package-mac-app.sh

# 创建 DMG / Create DMG
./scripts/create-dmg.sh

# 输出 / Output
ls -lh dist/OpenClaw.app
ls -lh dist/OpenClaw.dmg
```

---

## 卸载 / Uninstall

### NPM 安装 / NPM Installation

```bash
# 卸载全局包 / Uninstall global package
npm uninstall -g openclaw

# 停止并删除服务 / Stop and remove service
openclaw gateway uninstall
```

### macOS 应用 / macOS App

```bash
# 删除应用 / Remove app
rm -rf /Applications/OpenClaw.app

# 删除 LaunchAgent / Remove LaunchAgent
launchctl bootout gui/$UID/bot.molt.gateway
rm -f ~/Library/LaunchAgents/bot.molt.gateway.plist
```

### Docker 安装 / Docker Installation

```bash
# 停止并删除容器 / Stop and remove containers
docker-compose down

# 删除镜像（可选）/ Remove images (optional)
docker rmi ghcr.io/openclaw/openclaw:latest
```

---

## 更新 / Update

### NPM

```bash
# 更新到最新版 / Update to latest
npm update -g openclaw

# 或重新安装 / Or reinstall
npm install -g openclaw@latest
```

### Docker

```bash
# 拉取最新镜像 / Pull latest image
docker-compose pull openclaw-gateway

# 重启服务 / Restart service
docker-compose up -d openclaw-gateway
```

### macOS App

```bash
# 应用内自动更新 / In-app auto-update
# 或手动下载新版本 DMG / Or manually download new DMG
```

---

## 多环境部署 / Multi-Environment Deployment

### 开发/测试/生产 / Dev/Test/Prod

```bash
# 开发环境 / Development
OPENCLAW_ENV=development npm install -g openclaw@dev

# 测试环境 / Testing
OPENCLAW_ENV=testing npm install -g openclaw@beta

# 生产环境 / Production
OPENCLAW_ENV=production npm install -g openclaw@latest
```

### 多实例运行 / Multiple Instances

```bash
# 使用不同配置目录 / Use different config directories
OPENCLAW_CONFIG_DIR=~/.openclaw/instance1 openclaw gateway --port 18789
OPENCLAW_CONFIG_DIR=~/.openclaw/instance2 openclaw gateway --port 18790
```

---

## 性能优化建议 / Performance Optimization

### NPM 安装加速 / Speed up NPM installation

```bash
# 使用 pnpm（更快）/ Use pnpm (faster)
npm install -g pnpm
pnpm add -g openclaw@latest

# 或使用国内镜像 / Or use China mirror
npm install -g openclaw --registry=https://registry.npmmirror.com
```

### Docker 镜像优化 / Docker image optimization

```bash
# 多阶段构建（减小体积）/ Multi-stage build (reduce size)
# 已在 Dockerfile 中实现 / Already implemented in Dockerfile

# 使用 BuildKit / Use BuildKit
DOCKER_BUILDKIT=1 docker build -t openclaw:latest .
```

---

## 安全建议 / Security Recommendations

### 验证安装包 / Verify packages

```bash
# 检查 npm 包签名 / Check npm package signature
npm view openclaw dist.shasum

# 验证 Docker 镜像 / Verify Docker image
docker pull ghcr.io/openclaw/openclaw:latest
docker inspect ghcr.io/openclaw/openclaw:latest
```

### 权限最小化 / Minimal permissions

```bash
# Docker: 非 root 用户 / Docker: non-root user
# 已在镜像中实现 / Already implemented in image

# Linux: 使用专用用户 / Linux: Use dedicated user
sudo useradd -r -s /bin/false openclaw
sudo -u openclaw openclaw gateway
```

---

## 支持和帮助 / Support and Help

- 📖 文档 / Docs: https://docs.openclaw.ai
- 🐛 问题反馈 / Issues: https://github.com/openclaw/openclaw/issues
- 💬 社区 / Community: https://discord.gg/clawd
- 📦 NPM: https://www.npmjs.com/package/openclaw
- 🐳 Docker: https://github.com/openclaw/openclaw/pkgs/container/openclaw

---

## 更多资源 / Additional Resources

- [完整打包分析 / Full Packaging Analysis](./packaging-methods.md)
- [安装文档 / Installation Docs](https://docs.openclaw.ai/install)
- [Docker 部署 / Docker Deployment](https://docs.openclaw.ai/install/docker)
- [从源码构建 / Build from Source](https://docs.openclaw.ai/install#from-source-contributorsdev)
