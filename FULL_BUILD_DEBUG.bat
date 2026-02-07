@echo off
chcp 65001 >nul
title Build Completo - DEBUG MODE
echo ==========================================
echo  🚀 BUILD COMPLETO - MODO DEBUG
echo ==========================================
echo.
echo Este script vai:
echo   1️⃣  Aplicar correções no código fonte
echo   2️⃣  Fazer build do React
echo   3️⃣  Copiar arquivos para o Flask
echo   4️⃣  Atualizar caminhos
echo.
echo Pressione qualquer tecla para continuar...
pause >nul
echo.

:: Verificar Node.js
echo 🔍 Verificando Node.js...
node --version
if errorlevel 1 (
    echo.
    echo ❌ ERRO: Node.js não está instalado!
    echo 📥 https://nodejs.org/
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)
echo ✅ Node.js encontrado!
echo.

:: ==========================================
echo ==========================================
echo  PASSO 1/4: Aplicando correções...
echo ==========================================
call APPLY_FIXES.bat
if errorlevel 1 (
    echo ❌ Erro ao aplicar correções
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

:: ==========================================
echo.
echo ==========================================
echo  PASSO 2/4: Build do React...
echo ==========================================
echo 📂 Entrando em: static\react-src
cd /d "%~dp0static\react-src"
if errorlevel 1 (
    echo ❌ ERRO: Não conseguiu entrar na pasta static\react-src
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

echo 📍 Pasta atual: %CD%
echo.

if not exist "node_modules" (
    echo 📦 Instalando dependências (pode demorar alguns minutos)...
    call npm install
    if errorlevel 1 (
        echo ❌ Erro ao instalar dependências
        echo.
        echo 💡 Tente manualmente:
        echo    cd static\react-src
        echo    npm install
        echo.
        echo Pressione qualquer tecla para sair...
        pause >nul
        exit /b 1
    )
) else (
    echo ✅ node_modules já existe
)

echo.
echo 🔨 Executando: npm run build
echo ⏳ Aguarde...
echo.
call npm run build 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERRO NO BUILD!
    echo.
    echo 💡 Possíveis causas:
    echo    1. Erro de sintaxe no código fonte
    echo    2. Falta algum arquivo de configuração
    echo    3. Dependências desatualizadas
    echo.
    echo 💡 Solução:
    echo    cd static\react-src
    echo    npm install
    echo    npm run build
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

echo ✅ Build concluído!

:: Verificar se pasta dist foi criada
if not exist "dist" (
    echo ❌ ERRO: Pasta dist não foi criada!
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)

echo 📁 Pasta dist criada com sucesso!
echo.

:: ==========================================
echo ==========================================
echo  PASSO 3/4: Copiando arquivos...
echo ==========================================
cd /d "%~dp0"
echo 📂 Pasta atual: %CD%
echo 📋 Copiando de: static\react-src\dist\
echo 📋 Para: static\react\
echo.

xcopy /E /I /Y "static\react-src\dist\*" "static\react\"
if errorlevel 1 (
    echo ❌ Erro ao copiar arquivos
    echo Pressione qualquer tecla para sair...
    pause >nul
    exit /b 1
)
echo ✅ Arquivos copiados!

:: ==========================================
echo.
echo ==========================================
echo  PASSO 4/4: Atualizando index.html...
echo ==========================================
echo 📝 Atualizando caminhos para /static/react/...
powershell -Command "(Get-Content 'static\react\index.html') -replace 'src=\"\./assets/', 'src=\"/static/react/assets/' -replace 'href=\"\./assets/', 'href=\"/static/react/assets/' | Set-Content 'static\react\index.html'"
if errorlevel 1 (
    echo ⚠️  Aviso: Não conseguiu atualizar index.html automaticamente
    echo 💡 Atualize manualmente os caminhos de ./assets/ para /static/react/assets/
) else (
    echo ✅ index.html atualizado!
)

:: ==========================================
echo.
echo ==========================================
echo  🎉 BUILD COMPLETO COM SUCESSO!
echo ==========================================
echo.
echo 📁 Arquivos em static\react\assets:
dir "static\react\assets\" /b
echo.
echo 🚀 Para iniciar o servidor:
echo    python app_comercial.py
echo.
echo 🌐 Acesse: http://localhost:5001
echo.
echo ==========================================
echo Pressione qualquer tecla para fechar...
pause >nul
