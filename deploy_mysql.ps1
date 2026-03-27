# nest_server/deploy_mysql.ps1
$DB_NAME = "study_platform"
$DB_USER = "root"
$DB_PASS = "root"
$EXPORT_PATH = "./backup.sql"

$VM_USER = "root"
$VM_IP = "192.168.52.128"
$REMOTE_BASE = "/home/study_platform_project"

Write-Host ">>> Step 1: Exporting local MySQL data..." -ForegroundColor Cyan
# 确保本地 mysqldump 可用
& mysqldump --user=$DB_USER --password=$DB_PASS --databases $DB_NAME --result-file=$EXPORT_PATH

if ($LASTEXITCODE -ne 0) {
    Write-Host ">>> Export failed! Please check local MySQL." -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit
}

Write-Host ">>> Step 2: Transferring SQL file to VM..." -ForegroundColor Cyan
# 将文件传送到虚拟机
scp $EXPORT_PATH "${VM_USER}@${VM_IP}:${REMOTE_BASE}/"

Write-Host ">>> Step 3: Importing data into Docker container..." -ForegroundColor Cyan
# 关键修复：将整个 Linux 命令用双引号包裹，避免 PowerShell 解析 && 和 <
# 使用 -t 强制分配终端，确保命令执行
$remoteCommand = "cd $REMOTE_BASE && docker exec -i db mysql -u root -proot $DB_NAME < backup.sql"
ssh "$VM_USER@$VM_IP" $remoteCommand

Write-Host ">>> Step 4: Cleaning up..." -ForegroundColor Cyan
if (Test-Path $EXPORT_PATH) { Remove-Item $EXPORT_PATH }
ssh "$VM_USER@$VM_IP" "rm $REMOTE_BASE/backup.sql"

Write-Host "`n>>> Database Sync Complete!" -ForegroundColor Green

Write-Host "========================================"
Read-Host "Script finished. Press Enter to exit..."