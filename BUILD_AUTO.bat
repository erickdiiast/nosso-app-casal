@echo off
chcp 65001 >nul
title Build Automático - Nosso App

:: Criar arquivo de log
set "LOGFILE=build_log_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.txt"
set "LOGFILE=%LOGFILE: =0%"
echo Build iniciado em %date% %time% > "%LOGFILE%"

echo ========================================== >> "%LOGFILE%"
echo  🚀 BUILD AUTOMÁTICO - NOSSO APP >> "%LOGFILE%"
echo ========================================== >> "%LOGFILE%"
echo. >> "%LOGFILE%"

echo 🔍 Verificando Node.js... >> "%LOGFILE%"
node --version >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js não está instalado! >> "%LOGFILE%"
    echo ❌ ERRO: Node.js não está instalado!
    echo 📥 https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js OK >> "%LOGFILE%"

echo. >> "%LOGFILE%"
echo ========================================== >> "%LOGFILE%"
echo PASSO 1: Aplicando correções... >> "%LOGFILE%"
echo ========================================== >> "%LOGFILE%"

cd /d "%~dp0"

:: Aplicar correção 1: Placeholder
echo 🔧 Corrigindo placeholder... >> "%LOGFILE%"
powershell -Command "
    \$file = 'static\react-src\src\index.css';
    \$content = Get-Content \$file -Raw;
    if (-not (\$content -match 'padding-left: 2\.75rem')) {
        \$content = \$content -replace 'padding: 0\.75rem 1\.25rem;', 'padding: 0.75rem 1.25rem;\n  padding-left: 2.75rem !important;\n  padding-right: 1rem !important;\n  font-size: 1rem;';
        Set-Content \$file \$content -NoNewline;
        Write-Host '✅ Placeholder corrigido';
    } else {
        Write-Host '✅ Placeholder já estava correto';
    }
" >> "%LOGFILE%" 2>&1

:: Aplicar correção 2: Tela do código
echo 🔧 Corrigindo tela do código... >> "%LOGFILE%"
powershell -Command "
    \$file = 'static\react-src\src\sections\CoupleLink.tsx';
    \$content = Get-Content \$file -Raw;
    if (-not (\$content -match 'hasCreatedCouple')) {
        \$content = \$content -replace 'const \[mode, setMode\] = useState<''select'' \| ''create'' \| ''join''>\(''select''\);', 'const [mode, setMode] = useState<''select'' | ''create'' | ''join''>(''select'');\n  const [hasCreatedCouple, setHasCreatedCouple] = useState(false);';
        \$content = \$content -replace 'setMode\(''create''\);', 'setMode(''create'');\n      setHasCreatedCouple(true);';
        \$content = \$content -replace \"if \(mode === 'create'\) {\", "if ((mode === 'create' || hasCreatedCouple) && inviteCode) {";
        Set-Content \$file \$content -NoNewline;
        Write-Host '✅ Tela do código corrigida';
    } else {
        Write-Host '✅ Tela do código já estava correta';
    }
" >> "%LOGFILE%" 2>&1

echo. >> "%LOGFILE%"
echo ========================================== >> "%LOGFILE%"
echo PASSO 2: Build do React... >> "%LOGFILE%"
echo ========================================== >> "%LOGFILE%"

cd /d "%~dp0static\react-src"

if not exist "node_modules" (
    echo 📦 Instalando dependências... >> "%LOGFILE%"
    echo 📦 Instalando dependências (pode demorar alguns minutos)...
    call npm install >> "%LOGFILE%" 2>&1
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências >> "%LOGFILE%"
        echo ❌ Erro ao instalar dependências
        pause
        exit /b 1
    )
)

echo 🔨 Fazendo build... >> "%LOGFILE%"
echo 🔨 Fazendo build (aguarde)...
call npm run build >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo ❌ ERRO NO BUILD! >> "%LOGFILE%"
    echo ❌ ERRO NO BUILD!
    echo Verifique o arquivo: %LOGFILE%
    pause
    exit /b 1
)

echo ✅ Build concluído! >> "%LOGFILE%"

echo. >> "%LOGFILE%"
echo ========================================== >> "%LOGFILE%"
echo PASSO 3: Copiando arquivos... >> "%LOGFILE%"
echo ========================================== >> "%LOGFILE%"

cd /d "%~dp0"
xcopy /E /I /Y "static\react-src\dist\*" "static\react\" >> "%LOGFILE%" 2>&1
if errorlevel 1 (
    echo ❌ Erro ao copiar >> "%LOGFILE%"
    pause
    exit /b 1
)
echo ✅ Arquivos copiados! >> "%LOGFILE%"

echo. >> "%LOGFILE%"
echo ========================================== >> "%LOGFILE%"
echo PASSO 4: Atualizando index.html... >> "%LOGFILE%"
echo ========================================== >> "%LOGFILE%"

powershell -Command "
    (Get-Content 'static\react\index.html') 
    -replace 'src=\"\./assets/', 'src=\"/static/react/assets/' 
    -replace 'href=\"\./assets/', 'href=\"/static/react/assets/' 
    | Set-Content 'static\react\index.html'
" >> "%LOGFILE%" 2>&1

echo ✅ index.html atualizado! >> "%LOGFILE%"

echo. >> "%LOGFILE%"
echo ========================================== >> "%LOGFILE%"
echo 🎉 BUILD CONCLUÍDO! >> "%LOGFILE%"
echo ========================================== >> "%LOGFILE%"
echo Log salvo em: %LOGFILE% >> "%LOGFILE%"

echo.
echo ==========================================
echo 🎉 BUILD CONCLUÍDO COM SUCESSO!
echo ==========================================
echo.
echo 📁 Arquivos em static\react\assets:
dir "static\react\assets\" /b
echo.
echo 📝 Log salvo em: %LOGFILE%
echo.
echo 🚀 Para iniciar: python app_comercial.py
echo 🌐 Acesse: http://localhost:5001
echo.
pause
