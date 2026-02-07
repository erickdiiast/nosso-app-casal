@echo off
chcp 65001 >nul
title Build Completo - Nosso App
echo ==========================================
echo  🚀 BUILD COMPLETO - NOSSO APP
echo ==========================================
echo.

:: Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js nao esta instalado!
    echo 📥 https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

:: PASSO 1: Aplicar correções
echo ==========================================
echo PASSO 1/4: Aplicando correcoes...
echo ==========================================
cd /d "%~dp0"

echo 🔧 Corrigindo placeholder CSS...
powershell -Command "$f='static\react-src\src\index.css'; $c=Get-Content $f -Raw; if(-not($c-match'padding-left: 2.75rem')){$c=$c-replace'padding: 0.75rem 1.25rem;','padding: 0.75rem 1.25rem; padding-left: 2.75rem !important; padding-right: 1rem !important; font-size: 1rem;'; Set-Content $f $c -NoNewline; Write-Host '✅ OK'}else{Write-Host '✅ Ja OK'}"

echo 🔧 Corrigindo tela do codigo...
powershell -Command "$f='static\react-src\src\sections\CoupleLink.tsx'; $c=Get-Content $f -Raw; if(-not($c-match'hasCreatedCouple')){$c=$c-replace'const \[mode, setMode\] = useState','const [hasCreatedCouple, setHasCreatedCouple] = useState(false); const [mode, setMode] = useState'; $c=$c-replace'setMode\(','setMode(''create''); setHasCreatedCouple(true); setMode('; $c=$c-replace\"if \(mode === 'create'\) {\",\"if ((mode === 'create' || hasCreatedCouple) && inviteCode) {\"; Set-Content $f $c -NoNewline; Write-Host '✅ OK'}else{Write-Host '✅ Ja OK'}"

echo.

:: PASSO 2: Build
echo ==========================================
echo PASSO 2/4: Build do React...
echo ==========================================
cd /d "%~dp0static\react-src"

if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo ❌ Erro no npm install
        pause
        exit /b 1
    )
)

echo 🔨 Fazendo build...
call npm run build
if errorlevel 1 (
    echo ❌ ERRO NO BUILD!
    echo.
    echo Tente manualmente:
    echo   cd static\react-src
    echo   npm install
    echo   npm run build
    pause
    exit /b 1
)

echo ✅ Build OK!
echo.

:: PASSO 3: Copiar
echo ==========================================
echo PASSO 3/4: Copiando arquivos...
echo ==========================================
cd /d "%~dp0"
xcopy /E /I /Y "static\react-src\dist\*" "static\react\"
if errorlevel 1 (
    echo ❌ Erro ao copiar
    pause
    exit /b 1
)
echo ✅ Copiado!
echo.

:: PASSO 4: Atualizar index.html
echo ==========================================
echo PASSO 4/4: Atualizando index.html...
echo ==========================================
powershell -Command "(Get-Content 'static\react\index.html') -replace 'src=\"\./assets/','src=\"/static/react/assets/' -replace 'href=\"\./assets/','href=\"/static/react/assets/' | Set-Content 'static\react\index.html'"
echo ✅ Atualizado!
echo.

:: FIM
echo ==========================================
echo 🎉 BUILD CONCLUIDO!
echo ==========================================
echo.
echo 📁 Arquivos em static\react\assets:
dir "static\react\assets\" /b
echo.
echo 🚀 python app_comercial.py
echo 🌐 http://localhost:5001
echo.
pause
