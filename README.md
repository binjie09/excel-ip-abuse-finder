# Excel IP Abuse Finder (Excel IP 滥用检测工具)

这是一个全栈 Web 应用，用于自动扫描 Excel 文件中的 IP 地址，并通过 [ipapi.is](https://ipapi.is) 接口获取详细的 IP 情报（如 ASN、地理位置、是否为滥用 IP 等），最后生成包含丰富数据的 Excel 文件供用户下载。

## 功能特性

- 🚀 **自动化处理**：自动识别 Excel 前 10 行中的 IP 列。
- 🛡️ **IP 风险检测**：集成 ipapi.is 接口，获取滥用评分、运营商信息、是否为代理/VPN 等。
- 💾 **智能缓存**：使用 MongoDB 缓存查询结果，避免重复扣费并加快处理速度。
- 🐳 **一键部署**：提供 Docker 和 Docker Compose 配置，开箱即用。
- 📦 **一体化镜像**：前端 (React) 和后端 (Express) 打包在同一个 Docker 镜像中。

## 快速开始 (使用 Docker Compose)

### 前置要求
- 安装 [Docker](https://www.docker.com/) 和 Docker Compose。
- 获取 [ipapi.is](https://ipapi.is) 的 API Key。

### 运行步骤

1. **设置环境变量**
   
   在项目根目录创建一个 `.env` 文件（或直接在命令行设置）：
   ```bash
   IPAPI_KEY=your_actual_api_key_here
   ```

2. **启动服务**

   ```bash
   docker-compose up --build
   ```

3. **访问应用**

   打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

## 本地开发指南

### 1. 启动 MongoDB
确保本地运行了 MongoDB 服务，或者修改配置连接到远程数据库。

### 2. 后端 (Server)
```bash
cd server
npm install
# 创建 .env 文件并填入 IPAPI_KEY
npm run start
```

### 3. 前端 (Client)
```bash
cd client
npm install
npm run dev
```
前端默认运行在 `http://localhost:5173`，后端运行在 `http://localhost:3000`。

## 技术栈

- **前端**: React, Vite, TailwindCSS
- **后端**: Node.js, Express, Multer
- **数据库**: MongoDB (Mongoose)
- **数据处理**: xlsx (SheetJS)
- **DevOps**: Docker, GitHub Actions

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `MONGO_URI` | MongoDB 连接字符串 | `mongodb://localhost:27017/ip-abuse-finder` |
| `IPAPI_KEY` | **[必填]** ipapi.is 的 API 密钥 | 无 |

## 许可证
MIT
