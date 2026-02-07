from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from functools import wraps
from datetime import datetime
import hashlib
import os
import uuid
import sys
import io

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

app = Flask(__name__)
app.config['SECRET_KEY'] = 'casal-secreto-2024-unico'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///casal.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Criar pasta uploads se não existir
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'perfis'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'tarefas'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'recompensas'), exist_ok=True)

db = SQLAlchemy(app)

# ========== DECORATORS ==========

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'usuario_id' not in session:
            flash('Faça login primeiro!', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    if 'usuario_id' in session:
        return Usuario.query.get(session['usuario_id'])
    return None

# ========== MODELS ==========

class Usuario(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(50), nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    senha_hash = db.Column(db.String(64), nullable=False)
    cor = db.Column(db.String(20), default='#4CAF50')
    emoji = db.Column(db.String(10), default='👤')
    foto = db.Column(db.String(200))
    
    @property
    def pontos_ganhos(self):
        return db.session.query(db.func.sum(Tarefa.pontos)).filter(
            Tarefa.usuario_id == self.id,
            Tarefa.concluida == True
        ).scalar() or 0
    
    @property
    def pontos_gastos(self):
        return db.session.query(db.func.sum(Resgate.custo)).filter(
            Resgate.usuario_id == self.id
        ).scalar() or 0
    
    @property
    def saldo(self):
        return self.pontos_ganhos - self.pontos_gastos
    
    @property
    def parceiro(self):
        return Usuario.query.filter(Usuario.id != self.id).first()
    
    def verificar_senha(self, senha):
        return self.senha_hash == hashlib.sha256(senha.encode()).hexdigest()

class Tarefa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text)
    pontos = db.Column(db.Integer, default=10)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    criado_por_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    concluida = db.Column(db.Boolean, default=False)
    foto = db.Column(db.String(200))
    # Campos para recorrência
    recorrente = db.Column(db.Boolean, default=False)
    frequencia = db.Column(db.String(20), default='diaria')  # diaria, semanal, quinzenal, mensal
    data_criacao = db.Column(db.DateTime, default=datetime.now)
    data_conclusao = db.Column(db.DateTime)
    
    usuario = db.relationship('Usuario', foreign_keys=[usuario_id], backref='tarefas_recebidas')
    criado_por = db.relationship('Usuario', foreign_keys=[criado_por_id], backref='tarefas_criadas')

class Recompensa(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text)
    custo = db.Column(db.Integer, default=50)
    custo_sugerido = db.Column(db.Integer)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    criado_por_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    aprovado_por_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    status = db.Column(db.String(20), default='pendente')
    foto = db.Column(db.String(200))
    ativa = db.Column(db.Boolean, default=True)
    data_criacao = db.Column(db.DateTime, default=datetime.now)
    data_aprovacao = db.Column(db.DateTime)
    
    usuario = db.relationship('Usuario', foreign_keys=[usuario_id], backref='recompensas_disponiveis')
    criado_por = db.relationship('Usuario', foreign_keys=[criado_por_id], backref='recompensas_criadas')
    aprovado_por = db.relationship('Usuario', foreign_keys=[aprovado_por_id], backref='recompensas_aprovadas')

class Resgate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    recompensa_id = db.Column(db.Integer, db.ForeignKey('recompensa.id'))
    custo = db.Column(db.Integer)
    data_resgate = db.Column(db.DateTime, default=datetime.now)
    utilizado = db.Column(db.Boolean, default=False)
    
    usuario = db.relationship('Usuario', foreign_keys=[usuario_id], backref='resgates')
    recompensa = db.relationship('Recompensa', backref='resgates')

# ========== UTILS ==========

def salvar_foto(arquivo, pasta):
    if not arquivo or not arquivo.filename:
        return None
    if '.' not in arquivo.filename:
        return None
    
    ext = arquivo.filename.rsplit('.', 1)[1].lower()
    extensoes_permitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp', 'tiff']
    
    if ext not in extensoes_permitidas:
        return None
    
    try:
        pasta_completa = os.path.join(app.config['UPLOAD_FOLDER'], pasta)
        os.makedirs(pasta_completa, exist_ok=True)
        filename = f"{uuid.uuid4().hex}.{ext}"
        caminho_completo = os.path.join(pasta_completa, filename)
        arquivo.save(caminho_completo)
        if os.path.exists(caminho_completo):
            return f"{pasta}/{filename}"
    except Exception as e:
        print(f"Erro ao salvar foto: {e}")
    return None

# ========== AUTH ROUTES ==========

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        senha = request.form['senha']
        usuario = Usuario.query.filter_by(username=username).first()
        
        if usuario and usuario.verificar_senha(senha):
            session['usuario_id'] = usuario.id
            return redirect(url_for('dashboard'))
        else:
            flash('Usuário ou senha incorretos!', 'error')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('usuario_id', None)
    flash('Até logo! 👋', 'info')
    return redirect(url_for('login'))

# ========== DASHBOARD (RESUMIDO) ==========

@app.route('/')
@app.route('/dashboard')
@login_required
def dashboard():
    usuario = get_current_user()
    parceiro = usuario.parceiro
    
    # Resumo rápido
    minhas_tarefas_pendentes = Tarefa.query.filter_by(usuario_id=usuario.id, concluida=False).count()
    tarefas_criadas_pendentes = Tarefa.query.filter_by(criado_por_id=usuario.id, usuario_id=parceiro.id, concluida=False).count()
    recompensas_para_aprovar = Recompensa.query.filter_by(usuario_id=parceiro.id, status='pendente', ativa=True).count()
    minhas_recompensas_aprovadas = Recompensa.query.filter_by(usuario_id=usuario.id, status='aprovada', ativa=True).count()
    meus_vales_pendentes = Resgate.query.filter_by(usuario_id=parceiro.id, utilizado=False).count()
    
    return render_template('dashboard.html',
                         usuario=usuario,
                         parceiro=parceiro,
                         minhas_tarefas_pendentes=minhas_tarefas_pendentes,
                         tarefas_criadas_pendentes=tarefas_criadas_pendentes,
                         recompensas_para_aprovar=recompensas_para_aprovar,
                         minhas_recompensas_aprovadas=minhas_recompensas_aprovadas,
                         meus_vales_pendentes=meus_vales_pendentes)

# ========== FOTOS ==========

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/perfil/foto', methods=['POST'])
@login_required
def upload_foto_perfil():
    usuario = get_current_user()
    if 'foto' not in request.files:
        flash('Nenhuma foto selecionada!', 'error')
        return redirect(url_for('dashboard'))
    
    foto = request.files['foto']
    if foto.filename == '':
        flash('Nenhuma foto selecionada!', 'error')
        return redirect(url_for('dashboard'))
    
    caminho = salvar_foto(foto, 'perfis')
    if caminho:
        if usuario.foto:
            try:
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], usuario.foto))
            except:
                pass
        usuario.foto = caminho
        db.session.commit()
        flash('Foto atualizada! 📸', 'success')
    else:
        flash('Erro ao salvar foto. Use JPG, PNG ou GIF.', 'error')
    
    return redirect(url_for('dashboard'))

# ========== PÁGINA: CRIAR TAREFAS ==========

@app.route('/tarefas')
@login_required
def pagina_tarefas():
    usuario = get_current_user()
    parceiro = usuario.parceiro
    
    minhas_tarefas = Tarefa.query.filter_by(usuario_id=usuario.id, concluida=False).order_by(Tarefa.data_criacao.desc()).all()
    tarefas_criadas = Tarefa.query.filter_by(criado_por_id=usuario.id, usuario_id=parceiro.id, concluida=False).order_by(Tarefa.data_criacao.desc()).all()
    
    return render_template('tarefas.html', usuario=usuario, parceiro=parceiro, 
                          minhas_tarefas=minhas_tarefas, tarefas_criadas=tarefas_criadas)

@app.route('/tarefa/criar', methods=['POST'])
@login_required
def criar_tarefa():
    usuario = get_current_user()
    parceiro = usuario.parceiro
    
    titulo = request.form['titulo']
    descricao = request.form.get('descricao', '')
    pontos = int(request.form.get('pontos', 10))
    recorrente = request.form.get('recorrente') == '1'
    frequencia = request.form.get('frequencia', 'diaria') if recorrente else None
    
    tarefa = Tarefa(
        titulo=titulo,
        descricao=descricao,
        pontos=pontos,
        usuario_id=parceiro.id,
        criado_por_id=usuario.id,
        recorrente=recorrente,
        frequencia=frequencia
    )
    db.session.add(tarefa)
    db.session.commit()
    
    if recorrente:
        freq_texto = {'diaria': 'diária', 'semanal': 'semanal', 'quinzenal': 'quinzenal', 'mensal': 'mensal'}.get(frequencia, 'recorrente')
        flash(f'Tarefa recorrente ({freq_texto}) criada para {parceiro.nome}! 📝', 'success')
    else:
        flash(f'Tarefa criada para {parceiro.nome}! 📝', 'success')
    return redirect(url_for('pagina_tarefas'))

@app.route('/tarefa/concluir/<int:id>', methods=['POST'])
@login_required
def concluir_tarefa(id):
    usuario = get_current_user()
    tarefa = Tarefa.query.get_or_404(id)
    
    if tarefa.usuario_id != usuario.id:
        flash('Essa tarefa não é sua! 😅', 'error')
        return redirect(url_for('pagina_tarefas'))
    
    foto = request.files.get('foto_comprovacao')
    if foto and foto.filename:
        caminho_foto = salvar_foto(foto, 'tarefas')
        if caminho_foto:
            tarefa.foto = caminho_foto
    
    tarefa.concluida = True
    tarefa.data_conclusao = datetime.now()
    db.session.commit()
    
    # Se for recorrente, criar nova tarefa
    if tarefa.recorrente:
        nova_tarefa = Tarefa(
            titulo=tarefa.titulo,
            descricao=tarefa.descricao,
            pontos=tarefa.pontos,
            usuario_id=tarefa.usuario_id,
            criado_por_id=tarefa.criado_por_id,
            recorrente=tarefa.recorrente,
            frequencia=tarefa.frequencia
        )
        db.session.add(nova_tarefa)
        db.session.commit()
        freq_texto = {'diaria': 'diária', 'semanal': 'semanal', 'quinzenal': 'quinzenal', 'mensal': 'mensal'}.get(tarefa.frequencia, 'recorrente')
        flash(f'🎉 Você ganhou {tarefa.pontos} pontos! Nova tarefa {freq_texto} criada!', 'success')
    else:
        flash(f'🎉 Você ganhou {tarefa.pontos} pontos!', 'success')
    
    return redirect(url_for('pagina_tarefas'))

@app.route('/tarefa/excluir/<int:id>')
@login_required
def excluir_tarefa(id):
    usuario = get_current_user()
    tarefa = Tarefa.query.get_or_404(id)
    
    if tarefa.criado_por_id != usuario.id:
        flash('Você não pode excluir essa tarefa!', 'error')
        return redirect(url_for('pagina_tarefas'))
    
    if tarefa.foto:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], tarefa.foto))
        except:
            pass
    
    db.session.delete(tarefa)
    db.session.commit()
    flash('Tarefa removida!', 'info')
    return redirect(url_for('pagina_tarefas'))

# ========== PÁGINA: SUGERIR RECOMPENSA ==========

@app.route('/recompensas/sugerir')
@login_required
def pagina_sugerir_recompensa():
    usuario = get_current_user()
    parceiro = usuario.parceiro
    
    minhas_pendentes = Recompensa.query.filter_by(usuario_id=usuario.id, status='pendente', ativa=True).order_by(Recompensa.data_criacao.desc()).all()
    minhas_rejeitadas = Recompensa.query.filter_by(usuario_id=usuario.id, status='rejeitada', ativa=True).order_by(Recompensa.data_criacao.desc()).all()
    
    return render_template('sugerir_recompensa.html', usuario=usuario, parceiro=parceiro,
                          minhas_pendentes=minhas_pendentes, minhas_rejeitadas=minhas_rejeitadas)

@app.route('/recompensa/sugerir', methods=['POST'])
@login_required
def sugerir_recompensa():
    usuario = get_current_user()
    parceiro = usuario.parceiro
    
    titulo = request.form['titulo']
    descricao = request.form.get('descricao', '')
    custo_sugerido = int(request.form.get('custo_sugerido', 50))
    
    foto = request.files.get('foto')
    caminho_foto = salvar_foto(foto, 'recompensas') if foto else None
    
    recompensa = Recompensa(
        titulo=titulo,
        descricao=descricao,
        custo_sugerido=custo_sugerido,
        usuario_id=usuario.id,
        criado_por_id=usuario.id,
        foto=caminho_foto,
        status='pendente'
    )
    db.session.add(recompensa)
    db.session.commit()
    
    flash(f'🎁 Recompensa enviada para aprovação!', 'success')
    return redirect(url_for('pagina_sugerir_recompensa'))

@app.route('/recompensa/excluir/<int:id>')
@login_required
def excluir_recompensa(id):
    usuario = get_current_user()
    recompensa = Recompensa.query.get_or_404(id)
    
    if recompensa.criado_por_id != usuario.id:
        flash('Você não pode excluir essa recompensa!', 'error')
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

# ========== PÁGINA: APROVAÇÕES ==========

@app.route('/aprovacoes')
@login_required
def pagina_aprovacoes():
    usuario = get_current_user()
    parceiro = usuario.parceiro
    
    recompensas_para_aprovar = Recompensa.query.filter_by(usuario_id=parceiro.id, status='pendente', ativa=True).order_by(Recompensa.data_criacao.desc()).all()
    
    return render_template('aprovacoes.html', usuario=usuario, parceiro=parceiro,
                          recompensas_para_aprovar=recompensas_para_aprovar)

@app.route('/recompensa/aprovar/<int:id>', methods=['POST'])
@login_required
def aprovar_recompensa(id):
    usuario = get_current_user()
    recompensa = Recompensa.query.get_or_404(id)
    
    if recompensa.usuario_id == usuario.id:
        flash('Você não pode aprovar sua própria recompensa!', 'error')
        return redirect(url_for('pagina_aprovacoes'))
    
    acao = request.form['acao']
    
    if acao == 'aprovar':
        custo = int(request.form['custo'])
        recompensa.custo = custo
        recompensa.status = 'aprovada'
        recompensa.aprovado_por_id = usuario.id
        recompensa.data_aprovacao = datetime.now()
        db.session.commit()
        flash(f'✅ Recompensa aprovada com {custo} pts!', 'success')
    else:
        recompensa.status = 'rejeitada'
        recompensa.aprovado_por_id = usuario.id
        recompensa.data_aprovacao = datetime.now()
        db.session.commit()
        flash(f'❌ Recompensa rejeitada.', 'info')
    
    return redirect(url_for('pagina_aprovacoes'))

# ========== PÁGINA: LOJA DE PONTOS ==========

@app.route('/loja')
@login_required
def pagina_loja():
    usuario = get_current_user()
    parceiro = usuario.parceiro
    
    minhas_recompensas_aprovadas = Recompensa.query.filter_by(usuario_id=usuario.id, status='aprovada', ativa=True).order_by(Recompensa.custo).all()
    
    return render_template('loja.html', usuario=usuario, parceiro=parceiro,
                          minhas_recompensas_aprovadas=minhas_recompensas_aprovadas)

@app.route('/resgatar/<int:recompensa_id>', methods=['POST'])
@login_required
def resgatar(recompensa_id):
    usuario = get_current_user()
    recompensa = Recompensa.query.get_or_404(recompensa_id)
    
    if recompensa.usuario_id != usuario.id:
        flash('Essa recompensa não é sua! 😅', 'error')
        return redirect(url_for('pagina_loja'))
    
    if recompensa.status != 'aprovada':
        flash('Essa recompensa ainda não foi aprovada!', 'error')
        return redirect(url_for('pagina_loja'))
    
    if usuario.saldo < recompensa.custo:
        flash(f'Pontos insuficientes! 💔', 'error')
        return redirect(url_for('pagina_loja'))
    
    resgate = Resgate(
        usuario_id=usuario.id,
        recompensa_id=recompensa.id,
        custo=recompensa.custo
    )
    db.session.add(resgate)
    db.session.commit()
    
    flash(f'🎁 Você resgatou: {recompensa.titulo}!', 'success')
    return redirect(url_for('pagina_loja'))

# ========== PÁGINA: HISTÓRICO DE CONCLUSÃO ==========

@app.route('/historico/conclusoes')
@login_required
def pagina_historico_conclusoes():
    usuario = get_current_user()
    parceiro = usuario.parceiro
    
    tarefas_concluidas = Tarefa.query.filter(
        ((Tarefa.usuario_id == usuario.id) | (Tarefa.criado_por_id == usuario.id)),
        Tarefa.concluida == True
    ).order_by(Tarefa.data_conclusao.desc()).all()
    
    return render_template('historico_conclusoes.html', usuario=usuario, parceiro=parceiro,
                          tarefas_concluidas=tarefas_concluidas)

# ========== PÁGINA: HISTÓRICO DE RESGATE ==========

@app.route('/historico/resgates')
@login_required
def pagina_historico_resgates():
    usuario = get_current_user()
    parceiro = usuario.parceiro
    
    meus_vales = Resgate.query.filter_by(usuario_id=usuario.id).order_by(Resgate.data_resgate.desc()).all()
    vales_parceiro = Resgate.query.filter_by(usuario_id=parceiro.id, utilizado=False).order_by(Resgate.data_resgate.desc()).all()
    
    return render_template('historico_resgates.html', usuario=usuario, parceiro=parceiro,
                          meus_vales=meus_vales, vales_parceiro=vales_parceiro)

@app.route('/vale/usar/<int:id>')
@login_required
def usar_vale(id):
    usuario = get_current_user()
    vale = Resgate.query.get_or_404(id)
    
    if vale.usuario_id != usuario.id:
        flash('Esse vale não é seu! 😅', 'error')
        return redirect(url_for('pagina_historico_resgates'))
    
    vale.utilizado = True
    db.session.commit()
    flash('Vale utilizado! Aproveitem! 💕', 'success')
    return redirect(url_for('pagina_historico_resgates'))

# ========== INICIALIZAÇÃO ==========

def init_db():
    with app.app_context():
        db.create_all()
        
        if not Usuario.query.filter_by(username='Erickdiias').first():
            erick = Usuario(
                nome='Erick',
                username='Erickdiias',
                senha_hash=hashlib.sha256('290224'.encode()).hexdigest(),
                cor='#4CAF50',
                emoji='👨'
            )
            db.session.add(erick)
        
        if not Usuario.query.filter_by(username='galhegosuellen').first():
            suellen = Usuario(
                nome='Suellen',
                username='galhegosuellen',
                senha_hash=hashlib.sha256('220687'.encode()).hexdigest(),
                cor='#E91E63',
                emoji='👩'
            )
            db.session.add(suellen)
        
        db.session.commit()
        print("[OK] Banco de dados inicializado com sucesso!")

if __name__ == '__main__':
    init_db()
    # Desenvolvimento local
    app.run(debug=True, host='0.0.0.0', port=5000)
