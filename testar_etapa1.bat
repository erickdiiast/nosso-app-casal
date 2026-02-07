@echo off
echo ==========================================
echo   🚀 TESTE - ETAPA 1: Cadastro e Vinculo
echo ==========================================
echo.
echo Iniciando o app comercial...
echo.
echo Acesse: http://localhost:5001
echo.
echo Fluxo de teste:
echo 1. Acesse http://localhost:5001/registrar
echo 2. Crie uma conta (Usuario 1)
echo 3. Crie um casal e anote o codigo
echo 4. Abra aba anonima (Ctrl+Shift+N)
echo 5. Acesse http://localhost:5001/registrar
echo 6. Crie outra conta (Usuario 2)
echo 7. Use o codigo para vincular
echo.
echo ==========================================
cd /d "%~dp0"
python app_comercial.py
pause
