# nest_server/deploy_backend.ps1
$VM_USER = "root"
$VM_IP = "192.168.52.128"
$REMOTE_BASE = "/home/study_platform_project"

Write-Host ">>> Step 1: Building backend..." -ForegroundColor Cyan
pnpm build

Write-Host ">>> Step 2: Preparing deployment files..." -ForegroundColor Cyan
$TEMP_DIR = "deploy_tmp"
if (Test-Path $TEMP_DIR) { Remove-Item -Recurse -Force $TEMP_DIR }
New-Item -ItemType Directory -Path $TEMP_DIR | Out-Null

# 复制当前目录下的必要文件到临时目录
Copy-Item -Path "dist", "package.json", ".env.prod", "Dockerfile" -Destination $TEMP_DIR -Recurse
Copy-Item -Path "src/common/constants/private.key", "src/common/constants/public.key" -Destination $TEMP_DIR

Write-Host ">>> Step 3: Syncing to VM..." -ForegroundColor Cyan
# 确保远程目录存在
ssh $VM_USER@$VM_IP "mkdir -p $REMOTE_BASE/nest_server"
# 传输后端上下文 (临时目录内的所有内容)
scp -r "$TEMP_DIR/*" "$VM_USER@$VM_IP`:$REMOTE_BASE/nest_server/"
# 传输当前目录下的 docker-compose.yml 到远程根目录
scp "docker-compose.yml" "$VM_USER@$VM_IP`:$REMOTE_BASE/"

Write-Host ">>> Step 4: Restarting container on VM..." -ForegroundColor Cyan
ssh $VM_USER@$VM_IP "cd $REMOTE_BASE && docker-compose up -d --build nestjs-server"

# 清理临时文件
Remove-Item -Recurse -Force $TEMP_DIR
Write-Host ">>> Backend Deployment Complete!" -ForegroundColor Green
