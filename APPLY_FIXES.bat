@echo off
chcp 65001 >nul
title Aplicar Correções - Nosso App
echo ==========================================
echo  🔧 APLICAR CORREÇÕES AO CÓDIGO FONTE
echo ==========================================
echo.

set "REACT_SRC=static\react-src\src"

echo 📂 Verificando pasta: %REACT_SRC%
if not exist "%REACT_SRC%" (
    echo ❌ ERRO: Pasta %REACT_SRC% não encontrada!
    echo 💡 Execute este script da pasta raiz do projeto.
    pause
    exit /b 1
)

echo ✅ Pasta encontrada!
echo.

:: ==========================================
echo 🔧 Correção 1: Placeholder sobreposto nos inputs
echo    Arquivo: src\index.css
echo ==========================================

powershell -Command "
    $file = '%REACT_SRC%\index.css';
    $content = Get-Content $file -Raw;
    
    # Verificar se já foi corrigido
    if ($content -match 'padding-left: 2\.75rem') {
        Write-Host '   ✅ Já está corrigido!' -ForegroundColor Green;
    } else {
        # Aplicar correção
        $oldPattern = '/\* Inputs estilizados \*/\s*\.input-love \{\s*border-radius: 9999px;\s*border: 2px solid hsl\(var\(--border\)\);\s*transition: all 0\.3s ease;\s*padding: 0\.75rem 1\.25rem;\s*\}';
        $newPattern = @'
/* Inputs estilizados */
.input-love {
  border-radius: 9999px;
  border: 2px solid hsl(var(--border));
  transition: all 0.3s ease;
  padding: 0.75rem 1.25rem;
  padding-left: 2.75rem !important;
  padding-right: 1rem !important;
  font-size: 1rem;
}

.input-love:focus {
  border-color: var(--love-pink);
  box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.1);
  outline: none;
}

/* Placeholder styling */
.input-love::placeholder {
  color: hsl(var(--muted-foreground));
  opacity: 0.7;
}
'@;
        
        # Tentar substituir pattern completo
        if ($content -match $oldPattern) {
            $content = $content -replace $oldPattern, $newPattern;
            Set-Content $file $content -NoNewline;
            Write-Host '   ✅ Correção aplicada com sucesso!' -ForegroundColor Green;
        } else {
            # Adicionar após /* Inputs estilizados */
            $insertAfter = '.input-love {';
            $insertText = '  padding-left: 2.75rem !important;`n  padding-right: 1rem !important;`n  font-size: 1rem;';
            
            if ($content -match [regex]::Escape($insertAfter)) {
                $content = $content -replace [regex]::Escape($insertAfter), ($insertAfter + '`n' + $insertText);
                Set-Content $file $content -NoNewline;
                Write-Host '   ✅ Correção aplicada!' -ForegroundColor Green;
            } else {
                Write-Host '   ⚠️  Não foi possível aplicar automaticamente.' -ForegroundColor Yellow;
            }
        }
    }
"

echo.

:: ==========================================
echo 🔧 Correção 2: Tela do código não aparece
echo    Arquivo: src\sections\CoupleLink.tsx
echo ==========================================

powershell -Command "
    $file = '%REACT_SRC%\sections\CoupleLink.tsx';
    $content = Get-Content $file -Raw;
    
    # Verificar se já foi corrigido
    if ($content -match 'hasCreatedCouple') {
        Write-Host '   ✅ Já está corrigido!' -ForegroundColor Green;
    } else {
        # Correção 2a: Adicionar estado hasCreatedCouple
        $oldState = 'const \[mode, setMode\] = useState<''select'' \| ''create'' \| ''join''>\(''select''\);';
        $newState = @'
const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [hasCreatedCouple, setHasCreatedCouple] = useState(false);
'@;
        
        $content = $content -replace $oldState, $newState;
        
        # Correção 2b: Usar hasCreatedCouple no handleCreateCouple
        $content = $content -replace 'setMode\(''create''\);', 'setMode(''create'');`n      setHasCreatedCouple(true);';
        
        # Correção 2c: Mudar condição do modo create
        $content = $content -replace "if \(mode === 'create'\) {", "if ((mode === 'create' || hasCreatedCouple) && inviteCode) {";
        
        Set-Content $file $content -NoNewline;
        Write-Host '   ✅ Correções aplicadas com sucesso!' -ForegroundColor Green;
    }
"

echo.

:: ==========================================
echo 🔧 Correção 3: Adicionar botão 'Ir para o App'
echo    Arquivo: src\sections\CoupleLink.tsx
echo ==========================================

powershell -Command "
    $file = '%REACT_SRC%\sections\CoupleLink.tsx';
    $content = Get-Content $file -Raw;
    
    # Verificar se botão já existe
    if ($content -match 'Ir para o App') {
        Write-Host '   ✅ Já está corrigido!' -ForegroundColor Green;
    } else {
        # Substituir o botão antigo por dois botões
        $oldButton = '<Button`n              onClick=\{\(\) => window\.location\.reload\(\)\}`n              className=\"w-full btn-love gradient-love text-white\"`n            >`n              Verificar conexão`n            </Button>';
        
        $newButtons = @'
<div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full border-pink-300 text-pink-600 hover:bg-pink-50"
              >
                🔄 Verificar se parceiro entrou
              </Button>
              
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full btn-love gradient-love text-white"
              >
                🚀 Ir para o App
              </Button>
            </div>
'@;
        
        $content = $content -replace $oldButton, $newButtons;
        Set-Content $file $content -NoNewline;
        Write-Host '   ✅ Botão adicionado!' -ForegroundColor Green;
    }
"

echo.
echo ==========================================
echo 🎉 CORREÇÕES APLICADAS!
echo ==========================================
echo.
echo 📋 Próximo passo: Execute o build
echo    BUILD_REACT.bat
echo.
pause
