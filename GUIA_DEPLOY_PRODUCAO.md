# 🚀 Guia de Deploy Profissional - Nosso App

## 📋 Sumário
1. [Preparação](#1-preparação)
2. [Deploy no Render.com](#2-deploy-no-rendercom-recomendado)
3. [Configurações de Produção](#3-configurações-de-produção)
4. [Domínio Personalizado](#4-domínio-personalizado-opcional)
5. [Testes Finais](#5-testes-finais)
6. [Compartilhar com Amigos](#6-compartilhar-com-amigos)

---

## 1. Preparação

### 1.1 Arquivos Necessários
Certifique-se de que tem no seu projeto:
```
📦 nosso-app-casal/
├── app_comercial.py      ✅
├── requirements.txt      ✅
├── README.md             ✅
├── static/react/         ✅
└── templates/comercial/  ✅
```

### 1.2 Criar Conta no Render.com
1. Acesse: https://render.com
2. Clique em **"Get Started for Free"**
3. Cadastre-se com GitHub (recomendado) ou email
4. Confirme seu email

---

## 2. Deploy no Render.com (Recomendado)

### 2.1 Preparar o Repositório GitHub

Se ainda não subiu para o GitHub:
```bash
cd C:\Users\Windows\Documents\Suellens2Erick
git add -A
git commit -m "Ready for production"
git push origin main
```

**Verifique:** https://github.com/erickdiiast/nosso-app-casal

### 2.2 Criar Web Service no Render

1. No Dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Conecte sua conta do GitHub
3. Selecione o repositório: `nosso-app-casal`
4. Clique em **"Connect"**

### 2.3 Configurar o Serviço

Preencha os campos:

| Campo | Valor |
|-------|-------|
| **Name** | `nosso-app` (ou nome que preferir) |
| **Region** | `Ohio (US East)` (mais próximo) |
| **Branch** | `main` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn app_comercial:app` |

### 2.4 Adicionar Variáveis de Ambiente

Clique em **"Advanced"** → **"Add Environment Variable"**:

```
Key: SECRET_KEY
Value: (gerar com o comando abaixo)
```

**Gerar SECRET_KEY seguro:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copie o resultado e cole no Value.

### 2.5 Selecionar Plano

- **Plan:** `Free` (para testes)
- Ou `Starter` ($7/mês) para app sempre ligado

Clique em **"Create Web Service"**

### 2.6 Aguardar Deploy

O Render vai:
1. ⏳ Clonar repositório
2. ⏳ Instalar dependências
3. ⏳ Iniciar servidor
4. ✅ Deploy completo!

**URL gerada:** `https://nosso-app.onrender.com`

---

## 3. Configurações de Produção

### 3.1 Ativar HTTPS (Obrigatório)

O Render já fornece HTTPS automaticamente! ✅

### 3.2 Atualizar Configurações de Segurança

No arquivo `app_comercial.py`, altere para produção:

```python
# Configurações de produção (descomente estas linhas)
app.config['SESSION_COOKIE_SECURE'] = True  # Requer HTTPS
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# No Talisman, altere:
Talisman(app, 
    force_https=True,  # Força HTTPS
    strict_transport_security=True,
    # ... resto da config
)
```

**Commit e push:**
```bash
git add app_comercial.py
git commit -m "Enable HTTPS security settings for production"
git push origin main
```

O Render vai fazer deploy automático!

---

## 4. Domínio Personalizado (Opcional)

### 4.1 Comprar Domínio
Recomendado: https://namecheap.com ou https://cloudflare.com

Exemplo: `nossoapp.com.br` ou `ericksuellen.app`

### 4.2 Configurar no Render
1. No Dashboard, clique no seu serviço
2. Aba **"Settings"** → **"Custom Domains"**
3. Clique **"Add Custom Domain"**
4. Digite seu domínio: `www.nossoapp.com.br`

### 4.3 Configurar DNS
No painel do seu registrador de domínio:

```
Type: CNAME
Name: www
Value: (copiar do Render - algo como "nosso-app.onrender.com")
TTL: Automatic
```

Aguarde 24-48h para propagação.

---

## 5. Testes Finais

### 5.1 Verificações Obrigatórias

| Teste | Como Verificar | Status |
|-------|---------------|--------|
| ✅ HTTPS | URL começa com `https://` | ☐ |
| ✅ Cadastro | Criar conta de teste | ☐ |
| ✅ Login | Entrar na conta | ☐ |
| ✅ Criar Casal | Gerar código de convite | ☐ |
| ✅ Vincular Parceiro | Usar código em outro navegador | ☐ |
| ✅ Tarefas | Criar e concluir tarefa | ☐ |
| ✅ Upload de Foto | Enviar foto na tarefa | ☐ |
| ✅ Responsivo | Testar no celular | ☐ |

### 5.2 Testar em Múltiplos Dispositivos

1. **Desktop:** Chrome, Firefox, Edge
2. **Mobile:** Safari (iOS), Chrome (Android)
3. **Anônimo:** Ctrl+Shift+N (testar sem cache)

---

## 6. Compartilhar com Amigos

### 6.1 Criar Convite Profissional

**Mensagem sugerida:**

```
💕 Olá! Quer testar nosso app de gamificação para casais?

🔗 Link: https://nosso-app.onrender.com

🎯 Como testar:
1️⃣ Acesse o link
2️⃣ Crie sua conta
3️⃣ Clique em "Criar um novo casal"
4️⃣ Copie o código gerado
5️⃣ Envie o código para seu/sua parceiro(a)
6️⃣ Peça para ele(a) criar conta e usar o código
7️⃣ Comecem a criar tarefas e recompensas!

📱 Funciona no celular e computador
🔒 Totalmente seguro (HTTPS + criptografia)

Feedbacks são bem-vindos! 💬
```

### 6.2 Criar QR Code (Opcional)

Gere um QR Code para facilitar acesso no celular:
https://www.qr-code-generator.com/

Cole a URL do app e baixe o QR Code.

### 6.3 Grupo de Testes (WhatsApp/Telegram)

Crie um grupo com os amigos testers:
- Envie o link
- Compartilhe o QR Code
- Peça feedbacks
- Anote bugs ou sugestões

---

## 🛠️ Troubleshooting

### Problema: App "dorme" no plano Free
**Solução:** O plano free "desliga" após 15 min de inatividade.
- **Opção 1:** Upgrade para Starter ($7/mês)
- **Opção 2:** Usar serviço como https://uptimerobot.com para pingar a cada 5 min

### Problema: Erro 500 (Internal Server Error)
**Verificar:**
1. Logs no Render Dashboard → Logs
2. `requirements.txt` está correto?
3. `SECRET_KEY` está configurada?

### Problema: Fotos não aparecem
**Verificar:**
1. Pasta `uploads_comercial` existe?
2. Permissões de escrita?
3. No Render, adicione Disco (Disk) de 1GB

---

## 📞 Suporte

Se precisar de ajuda:
- Render Docs: https://render.com/docs
- Flask Deploy: https://flask.palletsprojects.com/en/3.0.x/deploying/

---

## ✅ Checklist Final

- [ ] Conta criada no Render
- [ ] Repositório conectado
- [ ] Web Service criado
- [ ] SECRET_KEY configurada
- [ ] Deploy com sucesso
- [ ] HTTPS funcionando
- [ ] Testes realizados
- [ ] Link compartilhado com amigos

**🎉 Pronto para produção!**
