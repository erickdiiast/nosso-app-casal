@echo off
echo ==========================================
echo   ❤️ NOSSO APP - Modo Teste
echo ==========================================
echo.
echo Iniciando servidor...
echo.
echo Acesse no navegador:
echo   http://localhost:5001
echo.
echo Para testar:
echo 1. Crie uma conta
echo 2. Crie um casal (anote o codigo)
echo 3. Abra aba anonima (Ctrl+Shift+N)
echo 4. Crie outra conta
echo 5. Entre com o codigo do casal
echo 6. Comece a usar!
echo.
echo Para sair, feche esta janela
echo ==========================================
cd /d "%~dp0"
python app_comercial.py
pause
