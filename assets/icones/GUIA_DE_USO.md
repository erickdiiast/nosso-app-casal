# 🎨 Guia de Uso - Ícones Personalizados

Ícones SVG criados para substituir emojis no app, mantendo a identidade visual consistente.

## 📁 Estrutura

```
assets/icones/
├── svg/              # Arquivos fonte SVG
└── GUIA_DE_USO.md    # Este arquivo

static/react/icons/   # Ícones no build
```

## 🎨 Paleta de Cores

| Ícone | Gradiente | Uso |
|-------|-----------|-----|
| **home** | Rosa → Rosa Claro | Página inicial |
| **tarefas** | Rosa → Roxo | Aba de tarefas |
| **recompensas** | Laranja → Rosa | Aba de recompensas |
| **loja** | Roxo → Roxo Escuro | Aba da loja |
| **historico** | Verde → Verde Água | Aba de histórico |
| **perfil** | Azul → Roxo | Aba de perfil |
| **adicionar** | Verde → Verde Claro | Botão adicionar |
| **coracao** | Rosa → Vermelho | Casal, likes |
| **pontos** | Amarelo → Laranja | Pontuação, troféu |

## 💻 Como Usar no React

### Opção 1: Como Componente (Recomendado)

```tsx
// Importar como imagem
import homeIcon from '/icons/home.svg';

// Usar no JSX
<img src={homeIcon} alt="Home" className="w-6 h-6" />
```

### Opção 2: Inline SVG (Controle total)

```tsx
<svg viewBox="0 0 64 64" className="w-6 h-6">
  <rect width="64" height="64" rx="12" fill="url(#gradHome)"/>
  <path d="M16 28 L32 16 L48 28 V44..." fill="white"/>
</svg>
```

### Opção 3: Como Background CSS

```css
.icon-home {
  background-image: url('/icons/home.svg');
  width: 24px;
  height: 24px;
  background-size: contain;
}
```

## 🔄 Substituição de Emojis

| Emoji | Substituir por | Ícone |
|-------|----------------|-------|
| 📝 | Tarefas | `tarefas.svg` |
| 🎁 | Recompensas | `recompensas.svg` |
| 🛒 | Loja | `loja.svg` |
| 📜 | Histórico | `historico.svg` |
| 👤 | Perfil | `perfil.svg` |
| 🏠 | Home | `home.svg` |
| ➕ | Adicionar | `adicionar.svg` |
| ❤️ | Coração | `coracao.svg` |
| 🏆 | Pontos | `pontos.svg` |
| 💕 | Amor/Casal | `coracao.svg` |

## 📱 Tamanhos Recomendados

| Contexto | Tamanho | Exemplo |
|----------|---------|---------|
| Header | 40x40px | `className="w-10 h-10"` |
| Tabs/Navegação | 24x24px | `className="w-6 h-6"` |
| Botões | 20x20px | `className="w-5 h-5"` |
| Lista/Itens | 16x16px | `className="w-4 h-4"` |

## 🎨 Personalização de Cores

Os SVGs usam gradients definidos internamente. Para mudar a cor:

1. Abra o arquivo SVG em um editor de texto
2. Modifique as cores no elemento `<linearGradient>`
3. Ou use CSS filter: `filter: hue-rotate(90deg)`

## ✅ Checklist de Implementação

- [ ] Substituir emojis no Dashboard.tsx
- [ ] Substituir emojis no AuthScreen.tsx
- [ ] Substituir emojis no CoupleLink.tsx
- [ ] Substituir emojis nas tabs de navegação
- [ ] Testar responsividade dos ícones
- [ ] Verificar contraste em modo escuro (se aplicável)

## 🔧 Dicas

1. **Cache**: Após alterar SVGs, force refresh (Ctrl+F5)
2. **Acessibilidade**: Sempre use atributo `alt` descritivo
3. **Performance**: SVGs são vetoriais, carregam rápido
4. **Escalabilidade**: Use `viewBox` para manter proporção

---

**Data de criação:** 2026-02-07  
**Versão:** 1.0
