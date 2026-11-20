param(
    [string]$BaseUrl = 'http://localhost:5069',
    [switch]$AllowTestWrites
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
if (-not $AllowTestWrites) { throw 'Use -AllowTestWrites para autorizar dados temporários e sua limpeza no banco local.' }
$uri = [uri]$BaseUrl
if (-not $uri.IsLoopback -or $uri.Scheme -ne 'http') { throw 'Este teste só pode executar contra HTTP local.' }

# Cleanup uses only the configured local development database and two unique synthetic emails.
$configPath = Join-Path $env:APPDATA 'Microsoft\UserSecrets\a2ad157d-8fc1-471a-90de-668e16983afc\secrets.json'
$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$connection = $config.'ConnectionStrings:Default'
if (-not $connection) { $connection = $config.ConnectionStrings.Default }
$settings = @{}
foreach ($part in $connection.Split(';')) {
    if ($part.Contains('=')) { $pair=$part.Split('=',2); $settings[$pair[0].Trim().ToLowerInvariant()]=$pair[1].Trim() }
}
if ($settings.host -notin @('localhost','127.0.0.1','::1')) { throw 'O banco configurado deve ser local.' }
$psql = 'C:\Program Files\PostgreSQL\16\bin\psql.exe'
if (-not (Test-Path -LiteralPath $psql)) { throw 'psql PostgreSQL 16 necessário para garantir a limpeza dos dados temporários.' }

Add-Type -AssemblyName System.Net.Http
$client = New-Object System.Net.Http.HttpClient
$client.Timeout = [TimeSpan]::FromSeconds(30)
$suffix = [guid]::NewGuid().ToString('N')
$emails = @("codex-smoke-$suffix-a@example.invalid", "codex-smoke-$suffix-b@example.invalid")
$emails | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot '..\obj\smoke-test-emails.json') -Encoding UTF8
$script:checks = 0
function Assert($condition, [string]$message) {
    if (-not $condition) { throw "Falha: $message" }
    $script:checks++
}
function Send([string]$method, [string]$path, $body = $null, [string]$token = '', [int]$expected = 200) {
    $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::new($method), "$BaseUrl$path")
    if ($token) { $request.Headers.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $token) }
    if ($null -ne $body) { $request.Content = [System.Net.Http.StringContent]::new(($body | ConvertTo-Json -Depth 10 -Compress), [Text.Encoding]::UTF8, 'application/json') }
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    Assert ([int]$response.StatusCode -eq $expected) "$method $path esperado $expected, recebido $([int]$response.StatusCode)"
    if ($content -and $expected -lt 400) {
        $parsed = ConvertFrom-Json -InputObject $content
        # PowerShell 5.1 emits an empty JSON array as one pipeline object unless explicitly enumerated.
        if ($parsed -is [array]) { foreach($item in $parsed) { Write-Output $item } }
        else { Write-Output $parsed }
    }
}
function ConcurrentGenerate([string]$token, [string]$month) {
    $requests = @(); $tasks = @()
    foreach ($i in 1..2) {
        $r=[System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post,"$BaseUrl/api/financas/recorrencias/gerar")
        $r.Headers.Authorization=[System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer',$token)
        $r.Content=[System.Net.Http.StringContent]::new((@{mes=$month}|ConvertTo-Json),[Text.Encoding]::UTF8,'application/json')
        $requests += $r; $tasks += $client.SendAsync($r)
    }
    $created=0
    foreach ($task in $tasks) { $response=$task.GetAwaiter().GetResult(); Assert ([int]$response.StatusCode -eq 200) 'geração concorrente retorna sucesso'; $data=$response.Content.ReadAsStringAsync().GetAwaiter().GetResult()|ConvertFrom-Json; $created += $data.criadas }
    Assert ($created -eq 1) 'geração concorrente cria exatamente uma despesa'
}
try {
    $password = 'Smoke!' + [guid]::NewGuid().ToString('N')
    $a = Send POST '/api/auth/register' @{nome='Codex smoke A';email=$emails[0];senha=$password}
    $b = Send POST '/api/auth/register' @{nome='Codex smoke B';email=$emails[1];senha=$password}
    $ta=$a.token; $tb=$b.token
    Assert ($ta -and $tb) 'dois usuários sintéticos autenticados'
    # Windows PowerShell uses .NET Framework and therefore Windows timezone names.
    try { $timezone=[TimeZoneInfo]::FindSystemTimeZoneById('America/Sao_Paulo') }
    catch { $timezone=[TimeZoneInfo]::FindSystemTimeZoneById('E. South America Standard Time') }
    $today=[DateTime]::SpecifyKind([TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow,$timezone).Date,[DateTimeKind]::Unspecified)
    $d=$today.ToString('yyyy-MM-dd'); $y=$today.AddDays(-1).ToString('yyyy-MM-dd'); $tomorrow=$today.AddDays(1).ToString('yyyy-MM-dd'); $month=$today.ToString('yyyy-MM')
    $null=Send GET "/api/habitos?inicio=$y&fim=$d" $null '' 401
    $null=Send GET '/api/objetivos' $null '' 401
    $null=Send GET "/api/financas/resumo?mes=$month&moeda=0" $null '' 401
    $h=Send POST '/api/habitos' @{titulo='Hábito diário';categoria=1;diasSemana=@(0,1,2,3,4,5,6);inicio=$y;fim=$null} $ta
    $null=Send PUT "/api/habitos/$($h.id)/conclusoes/$y" @{concluida=$true} $ta 204
    $null=Send PUT "/api/habitos/$($h.id)/conclusoes/$d" @{concluida=$true} $ta 204
    $null=Send PUT "/api/habitos/$($h.id)/conclusoes/$d" @{concluida=$true} $ta 204
    $null=Send PUT "/api/habitos/$($h.id)/conclusoes/$tomorrow" @{concluida=$true} $ta 400
    $null=Send PUT "/api/habitos/$($h.id)/pausa" @{pausado=$true;data=$d} $tb 404
    $null=Send PUT "/api/habitos/$($h.id)/pausa" @{pausado=$true;data=$d} $ta 204
    $habits=@(Send GET "/api/habitos?inicio=$y&fim=$tomorrow" $null $ta)
    Assert ($habits[0].pausado -and @($habits[0].ocorrencias).Count -eq 2) 'pausa preserva conclusões e oculta próximas ocorrências'
    $null=Send PUT "/api/habitos/$($h.id)/conclusoes/$d" @{concluida=$false} $ta 204
    $habits=@(Send GET "/api/habitos?inicio=$y&fim=$d" $null $ta)
    Assert (@($habits[0].ocorrencias).Count -eq 2) 'reabrir durante pausa preserva linha histórica'
    $null=Send PUT "/api/habitos/$($h.id)/pausa" @{pausado=$false;data=$d} $ta 204
    $null=Send DELETE "/api/habitos/$($h.id)" $null $ta 204
    $null=Send PUT "/api/habitos/$($h.id)/conclusoes/$d" @{concluida=$true} $ta 204
    $habits=@(Send GET "/api/habitos?inicio=$y&fim=$d" $null $ta)
    Assert ($habits[0].arquivado -and @($habits[0].ocorrencias).Count -eq 2) 'arquivo preserva histórico e reabertura de registro existente'
    Assert (@(Send GET "/api/habitos?inicio=$y&fim=$d" $null $tb).Count -eq 0) 'hábitos isolados por usuário'
    $null=Send POST '/api/habitos' @{titulo='Inválido';categoria=1;diasSemana=@(7);inicio=$d;fim=$null} $ta 400

    $plan=Send POST '/api/estudos/planos' @{titulo='Plano smoke';tema='Estudos';objetivo='Teste';metaSessoesSemanais=5;cursoSlug=$null} $ta 201
    $matter=Send POST '/api/estudos/materias' @{titulo='Matéria smoke';planoEstudoId=$plan.id} $ta
    $topic=Send POST "/api/estudos/materias/$($matter.id)/topicos" @{titulo='Tópico smoke';status='a-estudar';dataPrevista=$d} $ta
    $session=Send POST '/api/estudos/sessoes' @{planoEstudoId=$plan.id;topicoEstudoId=$topic.id;licaoSlug=$null;data="${d}T12:00:00Z";duracaoMinutos=10;observacoes='Smoke'} $ta 201
    foreach($i in 1..100) { $null=Send POST '/api/estudos/sessoes' @{planoEstudoId=$plan.id;licaoSlug=$null;data="${d}T12:00:00Z";duracaoMinutos=10;observacoes='Smoke'} $ta 201 }
    $study=Send GET "/api/estudos/resumo-dia?data=$d" $null $ta
    Assert ($study.sessoes -eq 101 -and $study.minutos -eq 1010) 'resumo de estudo inclui mais de 100 sessões'
    $planning=@(Send GET '/api/estudos/planejamento' $null $ta)
    Assert ($planning[0].topicos[0].status -eq 'em-andamento' -and $planning[0].topicos[0].minutos -eq 10) 'sessão inicia tópico e acumula duração'
    $null=Send DELETE "/api/estudos/topicos/$($topic.id)" $null $tb 404
    $null=Send DELETE "/api/estudos/topicos/$($topic.id)" $null $ta 204
    $study=Send GET "/api/estudos/resumo-dia?data=$d" $null $ta
    Assert ($study.sessoes -eq 101) 'excluir tópico preserva sessões existentes'
    $null=Send POST '/api/saude/registros' @{data=$d;tipo='exercicio';descricao='Caminhada';quantidade=30;calorias=$null} $ta
    foreach($entry in @(@{descricao='Receita';valor=1000;tipo=1;moeda=0},@{descricao='Gasto';valor=100;tipo=0;moeda=0},@{descricao='USD';valor=50;tipo=0;moeda=1})) {
        $entry.categoria='Alimentacao'; $entry.data="${d}T12:00:00Z"; $entry.formaPagamento=$null
        $null=Send POST '/api/transacoes' $entry $ta 201
    }
    $null=Send PUT '/api/financas/orcamentos' @{mes=$month;categoria=' Alimentacao ';moeda=0;limite=200} $ta 204
    $null=Send PUT '/api/financas/orcamentos' @{mes=$month;categoria='ALIMENTACAO';moeda=0;limite=150} $ta 204
    $budgets=@(Send GET "/api/financas/orcamentos?mes=$month&moeda=0" $null $ta)
    Assert ($budgets.Count -eq 1 -and $budgets[0].limite -eq 150) 'orçamento normaliza categoria e atualiza sem duplicar'
    $null=Send DELETE "/api/financas/orcamentos/$($budgets[0].id)" $null $tb 404
    $summary=Send GET "/api/financas/resumo?mes=$month&moeda=0" $null $ta
    Assert ($summary.receitas -eq 1000 -and $summary.gastos -eq 100 -and $summary.saldo -eq 900 -and $summary.categorias[0].restante -eq 50) 'resumo mensal e orçamento preservam moeda'
    $summaryB=Send GET "/api/financas/resumo?mes=$month&moeda=0" $null $tb
    Assert ($summaryB.saldo -eq 0 -and @($summaryB.transacoes).Count -eq 0) 'finanças isoladas por usuário'
    foreach($target in @(@{tipo='estudo';meta=1200;expected=1010},@{tipo='habitos';meta=4;expected=2},@{tipo='exercicio';meta=60;expected=30},@{tipo='economia';meta=1500;expected=900},@{tipo='manual';meta=10;expected=3})) {
        $goal=Send POST '/api/objetivos' @{titulo=$target.tipo;tipo=$target.tipo;meta=$target.meta;inicio=$y;fim=$d;moeda=0;valorManual=3} $ta
        $null=Send DELETE "/api/objetivos/$($goal.id)" $null $tb 404
        $goals=@(Send GET '/api/objetivos' $null $ta); $actual=$goals|Where-Object { $_.id -eq $goal.id }
        Assert ($actual.atual -eq $target.expected) "objetivo $($target.tipo) usa os registros corretos"
    }
    Assert (@(Send GET '/api/objetivos' $null $tb).Count -eq 0) 'objetivos isolados por usuário'
    $null=Send POST '/api/objetivos' @{titulo='Meta inválida';tipo='estudo';meta=0;inicio=$d;fim=$d;moeda=0;valorManual=0} $ta 400
    $recur=Send POST '/api/financas/recorrencias' @{descricao='Assinatura smoke';valor=39.9;categoria='Assinaturas';moeda=0;formaPagamento=0;diaVencimento=31;inicio='2027-02';fim='2027-02';ativa=$true} $ta
    $null=Send DELETE "/api/financas/recorrencias/$($recur.id)" $null $tb 404
    ConcurrentGenerate $ta '2027-02'
    $feb=Send GET '/api/financas/resumo?mes=2027-02&moeda=0' $null $ta
    Assert (@($feb.transacoes).Count -eq 1 -and $feb.transacoes[0].data.StartsWith('2027-02-28')) 'vencimento31 é ajustado a fevereiro'
    $null=Send DELETE "/api/transacoes/$($feb.transacoes[0].id)" $null $ta 204
    $again=Send POST '/api/financas/recorrencias/gerar' @{mes='2027-02'} $ta
    Assert ($again.criadas -eq 0) 'excluir transação não permite gerar a mesma ocorrência novamente'
    $null=Send DELETE "/api/financas/recorrencias/$($recur.id)" $null $ta 204
    $null=Send GET '/api/financas/resumo?mes=invalido&moeda=0' $null $ta 400
    Write-Output "APROVADO: $script:checks verificações HTTP/funcionais."
}
catch { Write-Output ("Teste interrompido: " + $_.Exception.Message); throw }
finally {
    # Exact emails are generated in this process; no broad pattern or existing account is deleted.
    if ($emails | Where-Object { $_ -notmatch '^codex-smoke-[a-f0-9]{32}-[ab]@example\.invalid$' }) { throw 'Identidade sintética inválida para limpeza.' }
    $priorPassword=$env:PGPASSWORD
    try {
        $env:PGPASSWORD=$settings.password
        $sql='DELETE FROM "Users" WHERE "Email" IN (''' + $emails[0] + ''',''' + $emails[1] + ''');'
        # stdin preserves PostgreSQL quoted identifiers across Windows native argument parsing.
        $sql | & $psql -X -h $settings.host -p $(if($settings.port){$settings.port}else{'5432'}) -U $settings.username -d $settings.database -v ON_ERROR_STOP=1
        if($LASTEXITCODE -ne 0) { throw 'Falha ao limpar os usuários sintéticos; execute a limpeza pelos emails exclusivos deste teste.' }
        Write-Output 'Limpeza concluída: somente os usuários sintéticos desta execução e seus dados relacionados.'
    } finally { $env:PGPASSWORD=$priorPassword; $client.Dispose() }
}
