@echo off
chcp 65001 >nul
title Build React - Nosso App
echo ==========================================
echo  🚀 BUILD DO REACT - NOSSO APP
echo ==========================================
echo.

:: Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: Node.js não está instalado!
    echo.
    echo 📥 Instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado:
node --version
echo.

:: Navegar para pasta do projeto React
echo 📂 Entrando na pasta do projeto...
cd /d "%~dp0static\react-src"
if errorlevel 1 (
    echo ❌ ERRO: Pasta static\react-src não encontrada!
    pause
    exit /b 1
)

:: Instalar dependências (se necessário)
echo 📦 Verificando dependências...
if not exist "node_modules" (
    echo ⚠️  node_modules não encontrado. Instalando...
    echo ⏳ Isso pode demorar alguns minutos...
    echo.
    call npm install
    if errorlevel 1 (
        echo ❌ ERRO ao instalar dependências!
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas!
) else (
    echo ✅ Dependências já instaladas
)
echo.

:: Fazer o build
echo 🔨 Fazendo build do React...
echo ⏳ Aguarde...
echo.
call npm run build
if errorlevel 1 (
    echo ❌ ERRO no build!
    echo.
    echo 💡 Tente executar manualmente:
    echo    cd static\react-src
    echo    npm install
    echo    npm run build
    echo.
    pause
    exit /b 1
)

echo ✅ Build concluído com sucesso!
echo.

:: Copiar arquivos buildados
echo 📋 Copiando arquivos para static\react...
cd /d "%~dp0"
xcopy /E /I /Y "static\react-src\dist\*" "static\react\"
if errorlevel 1 (
    echo ❌ ERRO ao copiar arquivos!
    pause
    exit /b 1
)

echo ✅ Arquivos copiados!
echo.

:: Atualizar index.html com caminhos absolutos
echo 📝 Atualizando caminhos no index.html...
powershell -Command "(Get-Content 'static\react\index.html') -replace 'src=\"\./assets/', 'src=\"/static/react/assets/' -replace 'href=\"\./assets/', 'href=\"/static/react/assets/' | Set-Content 'static\react\index.html'"

echo ✅ index.html atualizado!
echo.

:: Mostrar arquivos finais
echo 📁 Arquivos em static\react\assets:
dir "static\react\assets\" /b
echo.

:: ==========================================
echo 🎉 BUILD CONCLUÍDO COM SUCESSO!
echo ==========================================
echo.
echo 🚀 Para iniciar o servidor Flask:
echo    python app_comercial.py
echo.
echo 🌐 Acesse: http://localhost:5001
echo.
pause
