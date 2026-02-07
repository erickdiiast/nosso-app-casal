"""
=================================================================
❤️ Nosso App - Versão Comercial (Multi-Casais)
=================================================================
ETAPA 1: Estrutura Base + Cadastro Público

Funcionalidades:
- Cadastro público de usuários
- Criação de casal com código de convite único
- Vínculo entre parceiros via código
- Isolamento de dados por casal
=================================================================
"""

from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, send_file, g
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from functools import wraps
from datetime import datetime
import bcrypt
import os
import uuid
import random
import string

import sys
import io
import logging
from logging.handlers import RotatingFileHandler

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Configurar logging de segurança
if not os.path.exists('logs'):
    os.makedirs('logs')

security_handler = RotatingFileHandler(
    'logs/security.log', maxBytes=1048576, backupCount=5
)
security_handler.setLevel(logging.WARNING)
security_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s'
))

app_logger = logging.getLogger('security')
app_logger.addHandler(security_handler)
app_logger.setLevel(logging.WARNING)

app = Flask(__name__)
# Security: Generate a strong random secret key in production
# Use: python -c "import secrets; print(secrets.token_hex(32))"
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'casal-comercial-2024-secreto-dev-only')
app.config['WTF_CSRF_ENABLED'] = True
app.config['WTF_CSRF_TIME_LIMIT'] = 3600  # 1 hour

# Session Security
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevents XSS access to session cookie
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # CSRF protection
app.config['PERMANENT_SESSION_LIFETIME'] = 3600  # 1 hour session timeout

# Initialize CSRF protection
csrf = CSRFProtect(app)

# Initialize Rate Limiter (anti-brute force)
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Initialize Security Headers
Talisman(app, 
    force_https=False,  # Set to True in production with HTTPS
    strict_transport_security=False,  # Enable in production
    content_security_policy={
        'default-src': "'self'",
        'script-src': ["'self'", "'unsafe-inline'"],  # Allow inline for now
        'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        'font-src': ["'self'", "https://fonts.gstatic.com"],
        'img-src': ["'self'", "data:", "blob:"],
        'connect-src': "'self'",
    },
    referrer_policy='strict-origin-when-cross-origin',
    feature_policy={
        'geolocation': "'none'",
        'microphone': "'none'",
        'camera': "'self'",
    }
)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///casal_comercial.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads_comercial'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Criar pasta uploads se não existir
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'perfis'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'tarefas'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'recompensas'), exist_ok=True)

db = SQLAlchemy(app)

# =================================================================
# MODELOS
# =================================================================

class Casal(db.Model):
    """Representa um casal (relacionamento) no sistema"""
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(10), unique=True, nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.now)
    ativo = db.Column(db.Boolean, default=True)
    
    # Relacionamentos
    membros = db.relationship('Usuario', backref='casal', lazy=True)
    tarefas = db.relationship('Tarefa', backref='casal', lazy=True)
    recompensas = db.relationship('Recompensa', backref='casal', lazy=True)
    
    @staticmethod
    def gerar_codigo():
        """Gera um código de convite único de 6 caracteres"""
        while True:
            codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if not Casal.query.filter_by(codigo=codigo).first():
                return codigo
    
    def contar_membros(self):
        """Retorna quantos usuários estão vinculados a este casal"""
        return len(self.membros)
    
    def esta_completo(self):
        """Verifica se o casal já tem 2 membros"""
        return self.contar_membros() >= 2


class Usuario(db.Model):
    """Representa um usuário do sistema"""
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(50), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    senha_hash = db.Column(db.String(64), nullable=False)
    
    # Vínculo com casal (pode ser nulo inicialmente)
    casal_id = db.Column(db.Integer, db.ForeignKey('casal.id'), nullable=True)
    
    # Campos visuais
    cor = db.Column(db.String(20), default='#4CAF50')
    emoji = db.Column(db.String(10), default='👤')
    foto = db.Column(db.String(200))
    
    # Timestamps
    data_cadastro = db.Column(db.DateTime, default=datetime.now)
    
    @property
    def pontos_ganhos(self):
        """Calcula pontos ganhos em tarefas concluídas"""
        if not self.casal_id:
            return 0
        return db.session.query(db.func.sum(Tarefa.pontos)).filter(
            Tarefa.usuario_id == self.id,
            Tarefa.concluida == True
        ).scalar() or 0
    
    @property
    def pontos_gastos(self):
        """Calcula pontos gastos em resgates"""
        if not self.casal_id:
            return 0
        return db.session.query(db.func.sum(Resgate.custo)).filter(
            Resgate.usuario_id == self.id
        ).scalar() or 0
    
    @property
    def saldo(self):
        """Retorna saldo de pontos"""
        return self.pontos_ganhos - self.pontos_gastos
    
    def verificar_senha(self, senha):
        """Verifica se a senha está correta usando bcrypt"""
        return bcrypt.checkpw(senha.encode('utf-8'), self.senha_hash.encode('utf-8'))
    
    def tem_parceiro(self):
        """Verifica se o usuário tem um parceiro vinculado"""
        if not self.casal_id:
            return False
        return Casal.query.get(self.casal_id).contar_membros() == 2
    
    def get_parceiro(self):
        """Retorna o parceiro do usuário (se existir)"""
        if not self.casal_id or not self.tem_parceiro():
            return None
        return Usuario.query.filter(
            Usuario.casal_id == self.casal_id,
            Usuario.id != self.id
        ).first()


class Tarefa(db.Model):
    """Representa uma tarefa dentro de um casal"""
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text)
    pontos = db.Column(db.Integer, default=10)
    
    # Relacionamentos
    casal_id = db.Column(db.Integer, db.ForeignKey('casal.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))  # Quem deve fazer
    criado_por_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))  # Quem criou
    
    # Status
    concluida = db.Column(db.Boolean, default=False)
    foto = db.Column(db.String(200))  # Foto de comprovação
    
    # Recorrência
    recorrente = db.Column(db.Boolean, default=False)
    frequencia = db.Column(db.String(20), default='diaria')
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.now)
    data_conclusao = db.Column(db.DateTime)
    
    # Relacionamentos explícitos
    usuario = db.relationship('Usuario', foreign_keys=[usuario_id], backref='tarefas_recebidas')
    criado_por = db.relationship('Usuario', foreign_keys=[criado_por_id], backref='tarefas_criadas')


class Recompensa(db.Model):
    """Representa uma recompensa dentro de um casal"""
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text)
    custo = db.Column(db.Integer, default=50)
    custo_sugerido = db.Column(db.Integer)
    
    # Relacionamentos
    casal_id = db.Column(db.Integer, db.ForeignKey('casal.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))  # Para quem é
    criado_por_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))  # Quem criou
    aprovado_por_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))  # Quem aprovou
    
    # Status
    status = db.Column(db.String(20), default='pendente')  # pendente, aprovada, rejeitada
    foto = db.Column(db.String(200))
    ativa = db.Column(db.Boolean, default=True)
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.now)
    data_aprovacao = db.Column(db.DateTime)
    
    # Relacionamentos
    usuario = db.relationship('Usuario', foreign_keys=[usuario_id], backref='recompensas_disponiveis')
    criado_por = db.relationship('Usuario', foreign_keys=[criado_por_id], backref='recompensas_criadas')
    aprovado_por = db.relationship('Usuario', foreign_keys=[aprovado_por_id], backref='recompensas_aprovadas')


class Resgate(db.Model):
    """Representa um resgate de recompensa"""
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    recompensa_id = db.Column(db.Integer, db.ForeignKey('recompensa.id'))
    custo = db.Column(db.Integer)
    data_resgate = db.Column(db.DateTime, default=datetime.now)
    utilizado = db.Column(db.Boolean, default=False)
    
    usuario = db.relationship('Usuario', foreign_keys=[usuario_id], backref='resgates')
    recompensa = db.relationship('Recompensa', backref='resgates')


# =================================================================
# DECORADORES E UTILS
# =================================================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'usuario_id' not in session:
            flash('Faça login primeiro!', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


def casal_required(f):
    """Decorador que exige que o usuário esteja vinculado a um casal"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        usuario = get_current_user()
        if not usuario or not usuario.casal_id:
            flash('Você precisa criar ou vincular-se a um casal primeiro!', 'warning')
            return redirect(url_for('vincular_casal'))
        return f(*args, **kwargs)
    return decorated_function


def get_current_user():
    """Retorna o usuário logado atual"""
    if 'usuario_id' in session:
        return Usuario.query.get(session['usuario_id'])
    return None


def validar_imagem_conteudo(arquivo):
    """Valida se o arquivo é realmente uma imagem pelo conteúdo (magic numbers)"""
    magic_numbers = {
        b'\xff\xd8\xff': 'jpg',
        b'\x89PNG\r\n\x1a\n': 'png',
        b'GIF87a': 'gif',
        b'GIF89a': 'gif',
        b'RIFF': 'webp',  # WebP começa com RIFF
        b'\x00\x00\x00 ftyp': 'heic',
    }
    
    header = arquivo.read(16)
    arquivo.seek(0)  # Reset pointer
    
    for magic, ext in magic_numbers.items():
        if header.startswith(magic):
            return True
    return False


def salvar_foto(arquivo, pasta):
    """Salva a foto com validação de segurança"""
    if not arquivo or not arquivo.filename:
        return None
    if '.' not in arquivo.filename:
        return None
    
    # Validar extensão
    ext = arquivo.filename.rsplit('.', 1)[1].lower()
    extensoes_permitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    
    if ext not in extensoes_permitidas:
        flash('Tipo de arquivo não permitido!', 'error')
        return None
    
    # Validar conteúdo do arquivo (magic numbers)
    if not validar_imagem_conteudo(arquivo):
        flash('Arquivo inválido!', 'error')
        return None
    
    # Validar tamanho (máximo 5MB para segurança)
    arquivo.seek(0, 2)  # Ir para o final
    tamanho = arquivo.tell()
    arquivo.seek(0)  # Reset
    
    if tamanho > 5 * 1024 * 1024:  # 5MB
        flash('Arquivo muito grande! Máximo 5MB.', 'error')
        return None
    
    try:
        pasta_completa = os.path.join(app.config['UPLOAD_FOLDER'], pasta)
        os.makedirs(pasta_completa, exist_ok=True)
        
        # Gerar nome seguro
        filename = f"{uuid.uuid4().hex}.{ext}"
        caminho_completo = os.path.join(pasta_completa, filename)
        
        # Salvar arquivo
        arquivo.save(caminho_completo)
        
        # Verificar se foi salvo corretamente
        if os.path.exists(caminho_completo):
            return f"{pasta}/{filename}"
    except Exception as e:
        app.logger.error(f"Erro ao salvar foto: {e}")
        flash('Erro ao salvar arquivo!', 'error')
    
    return None


# =================================================================
# FUNÇÕES DE VALIDAÇÃO
# =================================================================

import re

def validar_username(username):
    """Valida formato do username (apenas letras, números, underline, 3-20 chars)"""
    if not username or len(username) < 3 or len(username) > 20:
        return False
    return re.match(r'^[a-zA-Z0-9_]+$', username) is not None


def validar_email(email):
    """Valida formato do email"""
    if not email or len(email) > 120:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validar_senha(senha):
    """Valida força da senha (mínimo 6 caracteres)"""
    if not senha or len(senha) < 6:
        return False
    return True


def sanitizar_input(texto):
    """Remove caracteres perigosos do input"""
    if not texto:
        return ""
    # Remover tags HTML
    texto = re.sub(r'<[^>]+>', '', texto)
    # Limitar tamanho
    return texto.strip()[:200]


# =================================================================
# ROTAS DE AUTENTICAÇÃO
# =================================================================

# =================================================================
# REACT FRONTEND (NOVA IDENTIDADE VISUAL)
# =================================================================

@app.route('/')
def index():
    """Serve o novo frontend React com identidade visual moderna"""
    return send_file('static/react/index.html')


@app.route('/<path:path>')
def catch_all(path):
    """Serve arquivos estáticos ou React SPA"""
    # Serve arquivos estáticos existentes
    if os.path.exists(os.path.join('static', 'react', path)):
        return send_from_directory('static/react', path)
    if os.path.exists(os.path.join('static', 'react', 'assets', path)):
        return send_from_directory('static/react/assets', path)
    
    # Caso contrário, serve o index.html (SPA routing)
    return send_file('static/react/index.html')


# =================================================================
# LEGACY ROUTES (API e páginas antigas - mantidas para compatibilidade)
# =================================================================

@app.route('/legacy/')
def legacy_index():
    """Página inicial legada - redireciona para login ou dashboard"""
    if 'usuario_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))


@app.route('/registrar', methods=['GET', 'POST'])
@limiter.limit("3 per minute")  # Limitar criação de contas
def registrar():
    """Página de registro público - qualquer pessoa pode criar conta"""
    if request.method == 'POST':
        # Sanitizar inputs
        nome = sanitizar_input(request.form.get('nome', ''))
        username = request.form.get('username', '').strip().lower()
        email = request.form.get('email', '').strip().lower()
        senha = request.form.get('senha', '')
        confirmar_senha = request.form.get('confirmar_senha', '')
        
        # Validações de segurança
        if not nome or len(nome) < 2:
            flash('Nome inválido! Mínimo 2 caracteres.', 'error')
            return redirect(url_for('registrar'))
        
        if not validar_username(username):
            flash('Username inválido! Use apenas letras, números e underline (3-20 chars).', 'error')
            return redirect(url_for('registrar'))
        
        if not validar_email(email):
            flash('Email inválido!', 'error')
            return redirect(url_for('registrar'))
        
        if not validar_senha(senha):
            flash('Senha deve ter no mínimo 6 caracteres!', 'error')
            return redirect(url_for('registrar'))
        
        if senha != confirmar_senha:
            flash('As senhas não conferem!', 'error')
            return redirect(url_for('registrar'))
        
        if Usuario.query.filter_by(username=username).first():
            flash('Este nome de usuário já existe!', 'error')
            return redirect(url_for('registrar'))
        
        if Usuario.query.filter_by(email=email).first():
            flash('Este email já está cadastrado!', 'error')
            return redirect(url_for('registrar'))
        
        # Criar novo usuário
        novo_usuario = Usuario(
            nome=nome,
            username=username,
            email=email,
            senha_hash=bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            cor='#4CAF50',
            emoji='👤'
        )
        db.session.add(novo_usuario)
        db.session.commit()
        
        flash('Conta criada com sucesso! Faça login para continuar.', 'success')
        return redirect(url_for('login'))
    
    return render_template('comercial/registrar.html')


@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("5 per minute")  # Anti-brute force
def login():
    """Página de login"""
    if request.method == 'POST':
        username = request.form['username']
        senha = request.form['senha']
        
        usuario = Usuario.query.filter_by(username=username).first()
        
        if usuario and usuario.verificar_senha(senha):
            session['usuario_id'] = usuario.id
            
            # Verificar se usuário já tem casal
            if usuario.casal_id:
                flash(f'Bem-vindo de volta, {usuario.nome}! ❤️', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash(f'Bem-vindo, {usuario.nome}! Agora crie ou vincule-se a um casal.', 'info')
                return redirect(url_for('vincular_casal'))
        else:
            flash('Usuário ou senha incorretos!', 'error')
    
    return render_template('comercial/login.html')


@app.route('/logout')
def logout():
    """Logout do usuário"""
    session.pop('usuario_id', None)
    flash('Até logo! 👋', 'info')
    return redirect(url_for('login'))


# =================================================================
# ROTAS DE VÍNCULO DE CASAL
# =================================================================

@app.route('/vincular-casal')
@login_required
def vincular_casal():
    """Página para criar ou vincular-se a um casal"""
    usuario = get_current_user()
    
    # Se já tem casal completo (com parceiro), vai para dashboard
    if usuario.casal_id and usuario.tem_parceiro():
        return redirect(url_for('dashboard'))
    
    # Se tem casal mas não tem parceiro, mostra código
    casal = None
    codigo_novo = session.pop('codigo_casal_criado', None)
    
    if usuario.casal_id:
        casal = Casal.query.get(usuario.casal_id)
    
    return render_template('comercial/vincular_casal.html', 
                         usuario=usuario, 
                         casal=casal,
                         codigo_novo=codigo_novo)


@app.route('/criar-casal', methods=['POST'])
@login_required
def criar_casal():
    """Cria um novo casal e gera código de convite"""
    usuario = get_current_user()
    
    if usuario.casal_id:
        flash('Você já está em um casal!', 'error')
        return redirect(url_for('dashboard'))
    
    # Criar novo casal
    casal = Casal(codigo=Casal.gerar_codigo())
    db.session.add(casal)
    db.session.flush()  # Obter ID sem commit
    
    # Vincular usuário ao casal
    usuario.casal_id = casal.id
    db.session.commit()
    
    # Armazenar código na sessão para exibição imediata
    session['codigo_casal_criado'] = casal.codigo
    
    flash(f'🎉 Casal criado! Seu código de convite é: {casal.codigo}', 'success')
    flash('Compartilhe este código com seu parceiro(a) para vinculá-lo(a).', 'info')
    return redirect(url_for('vincular_casal'))


@app.route('/entrar-casal', methods=['POST'])
@login_required
def entrar_casal():
    """Vincula usuário a um casal existente via código"""
    usuario = get_current_user()
    
    if usuario.casal_id:
        flash('Você já está vinculado a um casal!', 'error')
        return redirect(url_for('dashboard'))
    
    codigo = request.form['codigo'].upper().strip()
    casal = Casal.query.filter_by(codigo=codigo).first()
    
    if not casal:
        flash('Código de convite não encontrado!', 'error')
        return redirect(url_for('vincular_casal'))
    
    if casal.esta_completo():
        flash('Este casal já está completo (já tem 2 membros)!', 'error')
        return redirect(url_for('vincular_casal'))
    
    # Vincular usuário ao casal
    usuario.casal_id = casal.id
    db.session.commit()
    
    flash('🎉 Vinculado com sucesso! Agora vocês podem usar o app juntos.', 'success')
    return redirect(url_for('dashboard'))


# =================================================================
# DASHBOARD
# =================================================================

@app.route('/dashboard')
@login_required
def dashboard():
    """Dashboard principal do usuário"""
    usuario = get_current_user()
    
    # Se não tem casal, redireciona para vincular
    if not usuario.casal_id:
        return redirect(url_for('vincular_casal'))
    
    casal = Casal.query.get(usuario.casal_id)
    parceiro = usuario.get_parceiro()
    
    # Resumo rápido
    tarefas_pendentes = Tarefa.query.filter_by(
        casal_id=casal.id, 
        usuario_id=usuario.id,
        concluida=False
    ).count()
    
    tarefas_criadas = Tarefa.query.filter_by(
        casal_id=casal.id,
        criado_por_id=usuario.id,
        concluida=False
    ).count()
    
    recompensas_para_aprovar = Recompensa.query.filter_by(
        casal_id=casal.id,
        status='pendente'
    ).filter(Recompensa.usuario_id != usuario.id).count() if parceiro else 0
    
    recompensas_aprovadas = Recompensa.query.filter_by(
        casal_id=casal.id,
        usuario_id=usuario.id,
        status='aprovada',
        ativa=True
    ).count()
    
    vales_pendentes = 0
    if parceiro:
        vales_pendentes = Resgate.query.join(Recompensa).filter(
            Recompensa.casal_id == casal.id,
            Resgate.usuario_id == parceiro.id,
            Resgate.utilizado == False
        ).count()
    
    return render_template('comercial/dashboard.html',
                         usuario=usuario,
                         casal=casal,
                         parceiro=parceiro,
                         tarefas_pendentes=tarefas_pendentes,
                         tarefas_criadas=tarefas_criadas,
                         recompensas_para_aprovar=recompensas_para_aprovar,
                         recompensas_aprovadas=recompensas_aprovadas,
                         vales_pendentes=vales_pendentes)


# =================================================================
# ROTAS DE TAREFAS
# =================================================================

@app.route('/tarefas')
@login_required
@casal_required
def pagina_tarefas():
    """Página de gerenciamento de tarefas"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    parceiro = usuario.get_parceiro()
    
    # Minhas tarefas pendentes
    minhas_tarefas = Tarefa.query.filter_by(
        casal_id=casal.id,
        usuario_id=usuario.id,
        concluida=False
    ).order_by(Tarefa.data_criacao.desc()).all()
    
    # Tarefas que criei para o parceiro
    tarefas_criadas = Tarefa.query.filter_by(
        casal_id=casal.id,
        criado_por_id=usuario.id,
        concluida=False
    ).order_by(Tarefa.data_criacao.desc()).all()
    
    return render_template('comercial/tarefas.html',
                         usuario=usuario,
                         casal=casal,
                         parceiro=parceiro,
                         minhas_tarefas=minhas_tarefas,
                         tarefas_criadas=tarefas_criadas)


@app.route('/tarefa/criar', methods=['POST'])
@login_required
@casal_required
def criar_tarefa():
    """Cria uma nova tarefa para o parceiro"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    parceiro = usuario.get_parceiro()
    
    if not parceiro:
        flash('Você precisa de um parceiro vinculado para criar tarefas!', 'error')
        return redirect(url_for('pagina_tarefas'))
    
    titulo = request.form['titulo']
    descricao = request.form.get('descricao', '')
    pontos = int(request.form.get('pontos', 10))
    recorrente = request.form.get('recorrente') == '1'
    frequencia = request.form.get('frequencia', 'diaria') if recorrente else None
    
    tarefa = Tarefa(
        titulo=titulo,
        descricao=descricao,
        pontos=pontos,
        casal_id=casal.id,
        usuario_id=parceiro.id,  # Quem deve fazer
        criado_por_id=usuario.id,  # Quem criou
        recorrente=recorrente,
        frequencia=frequencia
    )
    db.session.add(tarefa)
    db.session.commit()
    
    if recorrente:
        freq_texto = {'diaria': 'diaria', 'semanal': 'semanal', 'quinzenal': 'quinzenal', 'mensal': 'mensal'}.get(frequencia, 'recorrente')
        flash(f'Tarefa {freq_texto} criada para {parceiro.nome}!', 'success')
    else:
        flash(f'Tarefa criada para {parceiro.nome}!', 'success')
    
    return redirect(url_for('pagina_tarefas'))


@app.route('/tarefa/concluir/<int:id>', methods=['POST'])
@login_required
@casal_required
def concluir_tarefa(id):
    """Marca uma tarefa como concluída"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    
    tarefa = Tarefa.query.filter_by(id=id, casal_id=casal.id).first_or_404()
    
    # Verificar se a tarefa é do usuário
    if tarefa.usuario_id != usuario.id:
        flash('Esta tarefa não é sua!', 'error')
        return redirect(url_for('pagina_tarefas'))
    
    # Processar foto de comprovação
    foto = request.files.get('foto_comprovacao')
    if foto and foto.filename:
        caminho_foto = salvar_foto(foto, 'tarefas')
        if caminho_foto:
            tarefa.foto = caminho_foto
    
    # Marcar como concluída
    tarefa.concluida = True
    tarefa.data_conclusao = datetime.now()
    db.session.commit()
    
    # Se for recorrente, criar nova tarefa
    if tarefa.recorrente:
        nova_tarefa = Tarefa(
            titulo=tarefa.titulo,
            descricao=tarefa.descricao,
            pontos=tarefa.pontos,
            casal_id=casal.id,
            usuario_id=tarefa.usuario_id,
            criado_por_id=tarefa.criado_por_id,
            recorrente=tarefa.recorrente,
            frequencia=tarefa.frequencia
        )
        db.session.add(nova_tarefa)
        db.session.commit()
        freq_texto = {'diaria': 'diaria', 'semanal': 'semanal', 'quinzenal': 'quinzenal', 'mensal': 'mensal'}.get(tarefa.frequencia, 'recorrente')
        flash(f'Voce ganhou {tarefa.pontos} pontos! Nova tarefa {freq_texto} criada!', 'success')
    else:
        flash(f'Voce ganhou {tarefa.pontos} pontos!', 'success')
    
    return redirect(url_for('pagina_tarefas'))


@app.route('/tarefa/excluir/<int:id>')
@login_required
@casal_required
def excluir_tarefa(id):
    """Exclui uma tarefa"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    
    tarefa = Tarefa.query.filter_by(id=id, casal_id=casal.id).first_or_404()
    
    # Só quem criou pode excluir
    if tarefa.criado_por_id != usuario.id:
        flash('Voce nao pode excluir esta tarefa!', 'error')
        return redirect(url_for('pagina_tarefas'))
    
    # Remover foto se existir
    if tarefa.foto:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], tarefa.foto))
        except:
            pass
    
    db.session.delete(tarefa)
    db.session.commit()
    flash('Tarefa removida!', 'info')
    return redirect(url_for('pagina_tarefas'))


# =================================================================
# ROTAS DE RECOMPENSAS
# =================================================================

@app.route('/recompensas/sugerir')
@login_required
@casal_required
def pagina_sugerir_recompensa():
    """Página para sugerir recompensas"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    
    # Minhas recompensas pendentes
    minhas_pendentes = Recompensa.query.filter_by(
        casal_id=casal.id,
        usuario_id=usuario.id,
        status='pendente',
        ativa=True
    ).order_by(Recompensa.data_criacao.desc()).all()
    
    # Minhas recompensas aprovadas
    minhas_aprovadas = Recompensa.query.filter_by(
        casal_id=casal.id,
        usuario_id=usuario.id,
        status='aprovada',
        ativa=True
    ).order_by(Recompensa.custo).all()
    
    # Recompensas rejeitadas
    minhas_rejeitadas = Recompensa.query.filter_by(
        casal_id=casal.id,
        usuario_id=usuario.id,
        status='rejeitada',
        ativa=True
    ).order_by(Recompensa.data_criacao.desc()).all()
    
    return render_template('comercial/sugerir_recompensa.html',
                         usuario=usuario,
                         casal=casal,
                         minhas_pendentes=minhas_pendentes,
                         minhas_aprovadas=minhas_aprovadas,
                         minhas_rejeitadas=minhas_rejeitadas)


@app.route('/recompensa/sugerir', methods=['POST'])
@login_required
@casal_required
def sugerir_recompensa():
    """Sugere uma nova recompensa"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    
    titulo = request.form['titulo']
    descricao = request.form.get('descricao', '')
    custo_sugerido = int(request.form.get('custo_sugerido', 50))
    
    # Processar foto
    foto = request.files.get('foto')
    caminho_foto = salvar_foto(foto, 'recompensas') if foto else None
    
    recompensa = Recompensa(
        titulo=titulo,
        descricao=descricao,
        custo_sugerido=custo_sugerido,
        casal_id=casal.id,
        usuario_id=usuario.id,
        criado_por_id=usuario.id,
        foto=caminho_foto,
        status='pendente'
    )
    db.session.add(recompensa)
    db.session.commit()
    
    flash('Recompensa enviada para aprovacao do parceiro!', 'success')
    return redirect(url_for('pagina_sugerir_recompensa'))


@app.route('/recompensa/excluir/<int:id>')
@login_required
@casal_required
def excluir_recompensa(id):
    """Exclui uma recompensa sugerida"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    
    recompensa = Recompensa.query.filter_by(id=id, casal_id=casal.id).first_or_404()
    
    if recompensa.criado_por_id != usuario.id:
        flash('Voce nao pode excluir esta recompensa!', 'error')
        return redirect(url_for('pagina_sugerir_recompensa'))
    
    if recompensa.foto:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], recompensa.foto))
        except:
            pass
    
    recompensa.ativa = False
    db.session.commit()
    flash('Recompensa removida!', 'info')
    return redirect(url_for('pagina_sugerir_recompensa'))


# =================================================================
# ROTAS DE APROVAÇÃO
# =================================================================

@app.route('/aprovacoes')
@login_required
@casal_required
def pagina_aprovacoes():
    """Página para aprovar recompensas do parceiro"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    parceiro = usuario.get_parceiro()
    
    if not parceiro:
        flash('Aguardando parceiro se vincular!', 'warning')
        return redirect(url_for('dashboard'))
    
    # Recompensas do parceiro pendentes de aprovação
    recompensas_para_aprovar = Recompensa.query.filter_by(
        casal_id=casal.id,
        usuario_id=parceiro.id,
        status='pendente',
        ativa=True
    ).order_by(Recompensa.data_criacao.desc()).all()
    
    return render_template('comercial/aprovacoes.html',
                         usuario=usuario,
                         casal=casal,
                         parceiro=parceiro,
                         recompensas_para_aprovar=recompensas_para_aprovar)


@app.route('/recompensa/aprovar/<int:id>', methods=['POST'])
@login_required
@casal_required
def aprovar_recompensa(id):
    """Aprova ou rejeita uma recompensa"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    
    recompensa = Recompensa.query.filter_by(id=id, casal_id=casal.id).first_or_404()
    
    # Só o parceiro (quem vai "pagar") pode aprovar
    if recompensa.usuario_id == usuario.id:
        flash('Voce nao pode aprovar sua propria recompensa!', 'error')
        return redirect(url_for('pagina_aprovacoes'))
    
    acao = request.form['acao']
    
    if acao == 'aprovar':
        custo = int(request.form['custo'])
        recompensa.custo = custo
        recompensa.status = 'aprovada'
        recompensa.aprovado_por_id = usuario.id
        recompensa.data_aprovacao = datetime.now()
        db.session.commit()
        flash(f'Recompensa aprovada com custo de {custo} pontos!', 'success')
    else:
        recompensa.status = 'rejeitada'
        recompensa.aprovado_por_id = usuario.id
        recompensa.data_aprovacao = datetime.now()
        db.session.commit()
        flash('Recompensa rejeitada.', 'info')
    
    return redirect(url_for('pagina_aprovacoes'))


# =================================================================
# ROTAS DA LOJA
# =================================================================

@app.route('/loja')
@login_required
@casal_required
def pagina_loja():
    """Loja de recompensas aprovadas"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    parceiro = usuario.get_parceiro()
    
    # Minhas recompensas aprovadas (que posso resgatar)
    minhas_recompensas = Recompensa.query.filter_by(
        casal_id=casal.id,
        usuario_id=usuario.id,
        status='aprovada',
        ativa=True
    ).order_by(Recompensa.custo).all()
    
    return render_template('comercial/loja.html',
                         usuario=usuario,
                         casal=casal,
                         parceiro=parceiro,
                         minhas_recompensas=minhas_recompensas)


@app.route('/resgatar/<int:recompensa_id>', methods=['POST'])
@login_required
@casal_required
def resgatar(recompensa_id):
    """Resgata uma recompensa"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    
    recompensa = Recompensa.query.filter_by(
        id=recompensa_id,
        casal_id=casal.id
    ).first_or_404()
    
    # Verificar se a recompensa é do usuário
    if recompensa.usuario_id != usuario.id:
        flash('Esta recompensa nao e sua!', 'error')
        return redirect(url_for('pagina_loja'))
    
    if recompensa.status != 'aprovada':
        flash('Esta recompensa ainda nao foi aprovada!', 'error')
        return redirect(url_for('pagina_loja'))
    
    if usuario.saldo < recompensa.custo:
        flash(f'Pontos insuficientes! Voce tem {usuario.saldo} pts.', 'error')
        return redirect(url_for('pagina_loja'))
    
    # Criar resgate
    resgate = Resgate(
        usuario_id=usuario.id,
        recompensa_id=recompensa.id,
        custo=recompensa.costo
    )
    db.session.add(resgate)
    db.session.commit()
    
    flash(f'Voce resgatou: {recompensa.titulo}! Seu parceiro foi notificado.', 'success')
    return redirect(url_for('pagina_loja'))


# =================================================================
# ROTAS DE HISTÓRICO
# =================================================================

@app.route('/historico/conclusoes')
@login_required
@casal_required
def pagina_historico_conclusoes():
    """Histórico de tarefas concluídas"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    parceiro = usuario.get_parceiro()
    
    # Tarefas concluídas do casal
    tarefas_concluidas = Tarefa.query.filter_by(
        casal_id=casal.id,
        concluida=True
    ).order_by(Tarefa.data_conclusao.desc()).all()
    
    return render_template('comercial/historico_conclusoes.html',
                         usuario=usuario,
                         casal=casal,
                         parceiro=parceiro,
                         tarefas_concluidas=tarefas_concluidas)


@app.route('/historico/resgates')
@login_required
@casal_required
def pagina_historico_resgates():
    """Histórico de resgates (vales)"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    parceiro = usuario.get_parceiro()
    
    # Meus vales (resgates que fiz)
    meus_vales = Resgate.query.join(Recompensa).filter(
        Recompensa.casal_id == casal.id,
        Resgate.usuario_id == usuario.id
    ).order_by(Resgate.data_resgate.desc()).all()
    
    # Vales do parceiro pendentes (o que ele me deve)
    vales_parceiro = []
    if parceiro:
        vales_parceiro = Resgate.query.join(Recompensa).filter(
            Recompensa.casal_id == casal.id,
            Resgate.usuario_id == parceiro.id,
            Resgate.utilizado == False
        ).order_by(Resgate.data_resgate.desc()).all()
    
    return render_template('comercial/historico_resgates.html',
                         usuario=usuario,
                         casal=casal,
                         parceiro=parceiro,
                         meus_vales=meus_vales,
                         vales_parceiro=vales_parceiro)


@app.route('/vale/usar/<int:id>')
@login_required
@casal_required
def usar_vale(id):
    """Marca um vale como utilizado"""
    usuario = get_current_user()
    casal = Casal.query.get(usuario.casal_id)
    
    vale = Resgate.query.join(Recompensa).filter(
        Resgate.id == id,
        Recompensa.casal_id == casal.id
    ).first_or_404()
    
    # Só quem resgatou pode marcar como usado
    if vale.usuario_id != usuario.id:
        flash('Este vale nao e seu!', 'error')
        return redirect(url_for('pagina_historico_resgates'))
    
    vale.utilizado = True
    db.session.commit()
    
    flash('Vale utilizado! Aproveitem! 💕', 'success')
    return redirect(url_for('pagina_historico_resgates'))


# =================================================================
# INICIALIZAÇÃO
# =================================================================

def init_db():
    """Inicializa o banco de dados"""
    with app.app_context():
        db.create_all()
        print("[OK] Banco de dados criado com sucesso!")


if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)
