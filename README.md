# ❤️ Nosso App - Gamificação para Casais

App de gamificação para casais com sistema de pontos, tarefas e recompensas.

## 🚀 Como Executar

```bash
pip install -r requirements.txt
python app_comercial.py
```

Acesse: http://localhost:5001

## ✨ Funcionalidades

- 👤 Cadastro de usuários
- 👫 Criação de casal com código de convite
- 📝 Tarefas com pontos
- 🎁 Recompensas aprovadas pelo parceiro
- 🛒 Loja de resgates
- 📜 Histórico de atividades

## 🛡️ Segurança Implementada

### ✅ Proteções Ativas

| Recurso | Implementação |
|---------|--------------|
| **Senhas** | bcrypt (hash seguro) |
| **CSRF** | Flask-WTF tokens |
| **Rate Limiting** | 5 tentativas/min (login), 3/min (registro) |
| **Headers** | CSP, X-Frame-Options, HSTS |
| **Session** | HttpOnly, Secure, SameSite |
| **Uploads** | Validação por magic numbers, 5MB max |
| **Validação** | Sanitização de inputs, regex para email/username |
| **Logging** | Security logs em `logs/security.log` |

### 🔒 Configurações de Produção

Antes de deploy em produção, configure:

```bash
# Gerar SECRET_KEY seguro
python -c "import secrets; print(secrets.token_hex(32))"

# Exportar variáveis de ambiente
export SECRET_KEY="sua-chave-secreta-aqui"
export FLASK_ENV="production"
```

E altere no `app_comercial.py`:
- `SESSION_COOKIE_SECURE = True` (requer HTTPS)
- `force_https = True` no Talisman

## 🛠️ Tecnologias

- **Backend:** Flask + SQLAlchemy + SQLite
- **Frontend:** React + TypeScript + Tailwind CSS
- **UI:** shadcn/ui
- **Segurança:** bcrypt, Flask-WTF, Flask-Talisman, Flask-Limiter

## 📁 Estrutura

```
├── app_comercial.py    # App principal
├── requirements.txt    # Dependências
├── static/react/       # Build do React
├── templates/          # Templates HTML
└── logs/               # Logs de segurança
```

---

Feito com ❤️ para casais!
