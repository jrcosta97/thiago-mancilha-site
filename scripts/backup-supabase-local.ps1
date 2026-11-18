param([switch]$Verificar)

$ErrorActionPreference = 'Stop'
$projectRef = 'tkduufvpbqjsqjrhimry'
$backupRoot = Join-Path $env:LOCALAPPDATA 'CRM-Backups'

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) { throw 'Supabase CLI não encontrado.' }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker não encontrado.' }
docker info --format '{{.ServerVersion}}' *> $null
if ($LASTEXITCODE -ne 0) { throw 'Abra o Docker Desktop e aguarde o mecanismo iniciar.' }

if ($Verificar) {
  Write-Output 'Ferramentas locais disponíveis. O backup será salvo fora do repositório, em CRM-Backups dentro de AppData Local.'
  exit 0
}

Write-Output 'Este procedimento cria uma cópia local do banco Supabase e não altera os dados de produção.'
Write-Output 'Digite a senha DO BANCO no terminal. Ela não aparecerá enquanto você digita.'
$password = Read-Host 'Senha do banco Supabase' -AsSecureString
if ($password.Length -eq 0) { throw 'Nenhuma senha foi informada; backup cancelado.' }
$backupDir = Join-Path $backupRoot (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')
if (Test-Path -LiteralPath $backupDir) { throw 'A pasta de destino já existe; execute novamente.' }
New-Item -ItemType Directory -Path $backupDir | Out-Null

try {
  $env:SUPABASE_DB_PASSWORD = [System.Net.NetworkCredential]::new('', $password).Password
  Write-Output 'Salvando papéis do banco...'
  supabase db dump --project-ref $projectRef --role-only --file (Join-Path $backupDir 'roles.sql')
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao salvar os papéis do banco.' }
  Write-Output 'Salvando estrutura do banco...'
  supabase db dump --project-ref $projectRef --file (Join-Path $backupDir 'schema.sql')
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao salvar a estrutura do banco.' }
  Write-Output 'Salvando dados do banco...'
  supabase db dump --project-ref $projectRef --data-only --use-copy --file (Join-Path $backupDir 'data.sql')
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao salvar os dados do banco.' }
  foreach ($file in @('roles.sql', 'schema.sql', 'data.sql')) {
    $item = Get-Item -LiteralPath (Join-Path $backupDir $file) -ErrorAction Stop
    if ($item.Length -eq 0) { throw "O arquivo $file está vazio; backup incompleto." }
  }
  Write-Output "Backup exportado em: $backupDir"
  Write-Output 'Os arquivos contêm dados privados. Guarde-os com acesso restrito. A restauração ainda precisa ser verificada.'
} catch {
  Write-Output "Backup incompleto. Pasta criada: $backupDir"
  throw
} finally {
  Remove-Item Env:SUPABASE_DB_PASSWORD -ErrorAction SilentlyContinue
  $password.Dispose()
}
