import os, re, requests
from datetime import datetime, timedelta, timezone
from functools import wraps
import jwt
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from werkzeug.security import check_password_hash, generate_password_hash

app=Flask(__name__)
DATABASE_URL=os.getenv('DATABASE_URL','sqlite:///tasks.db')
if DATABASE_URL.startswith('postgres://'): DATABASE_URL=DATABASE_URL.replace('postgres://','postgresql+psycopg2://',1)
elif DATABASE_URL.startswith('postgresql://'): DATABASE_URL=DATABASE_URL.replace('postgresql://','postgresql+psycopg2://',1)
app.config.update(SECRET_KEY=os.getenv('SECRET_KEY','dev-secret-change-me'),SQLALCHEMY_DATABASE_URI=DATABASE_URL,SQLALCHEMY_TRACK_MODIFICATIONS=False)
CORS(app,resources={r'/*':{'origins':os.getenv('FRONTEND_URL','*')}})
db=SQLAlchemy(app)

class User(db.Model):
    __tablename__='users'
    id=db.Column(db.Integer,primary_key=True)
    username=db.Column(db.String(254),unique=True,nullable=False,index=True)
    email=db.Column(db.String(254),unique=True,nullable=True,index=True)
    full_name=db.Column(db.String(120),nullable=True)
    password_hash=db.Column(db.String(255),nullable=False)
    created_at=db.Column(db.DateTime(timezone=True),default=lambda:datetime.now(timezone.utc),nullable=False)
    tasks=db.relationship('Task',backref='owner',lazy=True,cascade='all, delete-orphan')

class Task(db.Model):
    __tablename__='tasks'
    id=db.Column(db.Integer,primary_key=True)
    title=db.Column(db.String(200),nullable=False)
    description=db.Column(db.String(1000),default='',nullable=False)
    status=db.Column(db.String(20),default='pending',nullable=False,index=True)
    priority=db.Column(db.String(20),default='medium',nullable=False)
    due_at=db.Column(db.DateTime(timezone=True),nullable=True,index=True)
    user_id=db.Column(db.Integer,db.ForeignKey('users.id',ondelete='CASCADE'),nullable=False,index=True)
    created_at=db.Column(db.DateTime(timezone=True),default=lambda:datetime.now(timezone.utc),nullable=False)
    updated_at=db.Column(db.DateTime(timezone=True),default=lambda:datetime.now(timezone.utc),onupdate=lambda:datetime.now(timezone.utc),nullable=False)
    def to_dict(self):
        return {'id':self.id,'title':self.title,'description':self.description or '','status':self.status,'priority':self.priority,'due_at':self.due_at.isoformat() if self.due_at else None,'created_at':self.created_at.isoformat(),'updated_at':self.updated_at.isoformat()}

class Subtask(db.Model):
    __tablename__='subtasks'
    id=db.Column(db.Integer,primary_key=True)
    task_id=db.Column(db.Integer,db.ForeignKey('tasks.id',ondelete='CASCADE'),nullable=False,index=True)
    title=db.Column(db.String(200),nullable=False)
    done=db.Column(db.Boolean,default=False,nullable=False)
    created_at=db.Column(db.DateTime(timezone=True),default=lambda:datetime.now(timezone.utc),nullable=False)
    def to_dict(self): return {'id':self.id,'task_id':self.task_id,'title':self.title,'done':self.done,'created_at':self.created_at.isoformat()}

def utc_now(): return datetime.now(timezone.utc)
def normalize_email(v): return str(v or '').strip().lower()
def friendly_name(u): return u.full_name.strip() if u.full_name and u.full_name.strip() else (u.email or u.username).split('@')[0]
def user_payload(u): return {'id':u.id,'email':u.email or u.username,'full_name':friendly_name(u)}
def parse_due(v):
    if v in (None,'','null'): return None
    if isinstance(v,str):
        s=v.strip()
        try:
            d=datetime.fromisoformat(s.replace('Z','+00:00'))
        except ValueError: raise ValueError('Due date/time is invalid.')
    else: raise ValueError('Due date/time is invalid.')
    if d.tzinfo is None: d=d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc)

def token_required(fn):
    @wraps(fn)
    def wrapped(*args,**kwargs):
        auth=request.headers.get('Authorization','').strip()
        if not auth:return jsonify({'message':'Authentication token is required.'}),401
        try:
            parts=auth.split(); tok=parts[1] if len(parts)==2 and parts[0].lower()=='bearer' else auth
            p=jwt.decode(tok,app.config['SECRET_KEY'],algorithms=['HS256']); u=db.session.get(User,p['user_id'])
            if not u:return jsonify({'message':'Invalid authentication token.'}),401
        except jwt.ExpiredSignatureError:return jsonify({'message':'Session expired. Please login again.'}),401
        except Exception:return jsonify({'message':'Invalid authentication token.'}),401
        return fn(u,*args,**kwargs)
    return wrapped

def validate_task(data,partial=False):
    if not isinstance(data,dict): return 'Request body must be valid JSON.'
    if not partial and not str(data.get('title','')).strip(): return 'Title is required.'
    if 'title' in data and not 1<=len(str(data['title']).strip())<=200:return 'Title must be between 1 and 200 characters.'
    if 'description' in data and len(str(data['description']))>1000:return 'Description cannot exceed 1000 characters.'
    if 'status' in data and data['status'] not in {'pending','in_progress','done'}:return 'Invalid status.'
    if 'priority' in data and data['priority'] not in {'low','medium','high'}:return 'Invalid priority.'
    if 'due_at' in data:
        try: parse_due(data['due_at'])
        except ValueError as e:return str(e)
    return None

def migrate_schema():
    with app.app_context():
        db.create_all()
        inspector=inspect(db.engine)
        if 'tasks' in inspector.get_table_names():
            cols={c['name'] for c in inspector.get_columns('tasks')}
            if 'due_at' not in cols:
                typ='TIMESTAMPTZ' if not DATABASE_URL.startswith('sqlite') else 'DATETIME'
                with db.engine.begin() as con: con.execute(text(f'ALTER TABLE tasks ADD COLUMN due_at {typ}'))
        if 'users' in inspector.get_table_names():
            cols={c['name'] for c in inspector.get_columns('users')}
            if 'email' not in cols:
                with db.engine.begin() as con: con.execute(text('ALTER TABLE users ADD COLUMN email VARCHAR(254)'))
            if 'full_name' not in cols:
                with db.engine.begin() as con: con.execute(text('ALTER TABLE users ADD COLUMN full_name VARCHAR(120)'))
            with db.engine.begin() as con: con.execute(text("UPDATE users SET email=username WHERE email IS NULL OR email=''"))
migrate_schema()

@app.get('/')
def health():
    try: db.session.execute(text('SELECT 1')); return jsonify({'status':'ok','service':'TaskFlow API','database':'ok','version':'2.0.0','time_ist':utc_now().astimezone(timezone(timedelta(hours=5,minutes=30))).isoformat()})
    except Exception:return jsonify({'status':'error','service':'TaskFlow API','database':'error','version':'2.0.0'}),503

@app.post('/api/register')
def register():
    d=request.get_json(silent=True) or {}; name=str(d.get('full_name','')).strip(); email=normalize_email(d.get('email')); pw=str(d.get('password',''))
    if not name or not email or not pw:return jsonify({'message':'Name, email and password are required.'}),400
    if len(name)<2 or len(name)>120:return jsonify({'message':'Name must be between 2 and 120 characters.'}),400
    if '@' not in email or '.' not in email.rsplit('@',1)[-1]:return jsonify({'message':'Please enter a valid email address.'}),400
    if len(pw)<6:return jsonify({'message':'Password must be at least 6 characters.'}),400
    if User.query.filter((User.email==email)|(User.username==email)).first():return jsonify({'message':'An account with this email already exists.'}),409
    u=User(username=email,email=email,full_name=name,password_hash=generate_password_hash(pw));db.session.add(u);db.session.commit();return jsonify({'message':'Account created successfully.'}),201

@app.post('/api/login')
def login():
    d=request.get_json(silent=True) or {}; email=normalize_email(d.get('email')); pw=str(d.get('password',''));u=User.query.filter((User.email==email)|(User.username==email)).first()
    if not u or not check_password_hash(u.password_hash,pw):return jsonify({'message':'Invalid email or password.'}),401
    tok=jwt.encode({'user_id':u.id,'exp':utc_now()+timedelta(hours=24)},app.config['SECRET_KEY'],algorithm='HS256');return jsonify({'token':tok,'user':user_payload(u)})

@app.get('/api/me')
@token_required
def me(u):return jsonify(user_payload(u))

@app.post('/api/tasks')
@token_required
def create_task(u):
    d=request.get_json(silent=True) or {};err=validate_task(d)
    if err:return jsonify({'message':err}),400
    try: due=parse_due(d.get('due_at'))
    except ValueError as e:return jsonify({'message':str(e)}),400
    t=Task(title=str(d['title']).strip(),description=str(d.get('description','')).strip(),status=d.get('status','pending'),priority=d.get('priority','medium'),due_at=due,user_id=u.id);db.session.add(t);db.session.commit();return jsonify(t.to_dict()),201

@app.get('/api/tasks')
@token_required
def get_tasks(u):
    return jsonify([t.to_dict() for t in Task.query.filter_by(user_id=u.id).order_by(Task.created_at.desc()).all()])

@app.get('/api/tasks/<int:task_id>')
@token_required
def get_task(u,task_id):
    t=Task.query.filter_by(id=task_id,user_id=u.id).first()
    return jsonify(t.to_dict()) if t else (jsonify({'message':'Task not found.'}),404)

@app.put('/api/tasks/<int:task_id>')
@token_required
def update_task(u,task_id):
    t=Task.query.filter_by(id=task_id,user_id=u.id).first()
    if not t:return jsonify({'message':'Task not found.'}),404
    d=request.get_json(silent=True) or {};err=validate_task(d,True)
    if err:return jsonify({'message':err}),400
    for k in ('title','description','status','priority'):
        if k in d:setattr(t,k,str(d[k]).strip() if k in ('title','description') else d[k])
    if 'due_at' in d:
        try:t.due_at=parse_due(d['due_at'])
        except ValueError as e:return jsonify({'message':str(e)}),400
    t.updated_at=utc_now();db.session.commit();return jsonify(t.to_dict())

@app.delete('/api/tasks/<int:task_id>')
@token_required
def delete_task(u,task_id):
    t=Task.query.filter_by(id=task_id,user_id=u.id).first()
    if not t:return jsonify({'message':'Task not found.'}),404
    db.session.delete(t);db.session.commit();return jsonify({'message':'Task deleted successfully.'})

@app.get('/api/productivity')
@token_required
def productivity(u):
    ts=Task.query.filter_by(user_id=u.id).all();now=utc_now();done=sum(t.status=='done' for t in ts);active=len(ts)-done;overdue=sum(t.status!='done' and t.due_at and t.due_at<now for t in ts);today=sum(t.due_at and t.due_at.date()==now.date() for t in ts);high=sum(t.priority=='high' and t.status!='done' for t in ts);rate=round(done/len(ts)*100) if ts else 0
    return jsonify({'total':len(ts),'done':done,'active':active,'overdue':overdue,'today':today,'high_priority':high,'completion_rate':rate})

@app.get('/api/tasks/today')
@token_required
def today(u):
    now=utc_now();return jsonify([t.to_dict() for t in Task.query.filter_by(user_id=u.id).all() if t.due_at and t.due_at.date()==now.date()])

@app.get('/api/tasks/overdue')
@token_required
def overdue(u):
    now=utc_now();return jsonify([t.to_dict() for t in Task.query.filter_by(user_id=u.id).all() if t.status!='done' and t.due_at and t.due_at<now])

@app.post('/api/tasks/<int:task_id>/subtasks')
@token_required
def create_subtask(u,task_id):
    t=Task.query.filter_by(id=task_id,user_id=u.id).first()
    if not t:return jsonify({'message':'Task not found.'}),404
    d=request.get_json(silent=True) or {};title=str(d.get('title','')).strip()
    if not title:return jsonify({'message':'Subtask title is required.'}),400
    s=Subtask(task_id=t.id,title=title);db.session.add(s);db.session.commit();return jsonify(s.to_dict()),201

@app.get('/api/tasks/<int:task_id>/subtasks')
@token_required
def get_subtasks(u,task_id):
    t=Task.query.filter_by(id=task_id,user_id=u.id).first()
    if not t:return jsonify({'message':'Task not found.'}),404
    return jsonify([s.to_dict() for s in Subtask.query.filter_by(task_id=t.id).order_by(Subtask.id).all()])

@app.put('/api/subtasks/<int:subtask_id>')
@token_required
def update_subtask(u,subtask_id):
    s=db.session.get(Subtask,subtask_id);t=db.session.get(Task,s.task_id) if s else None
    if not s or not t or t.user_id!=u.id:return jsonify({'message':'Subtask not found.'}),404
    d=request.get_json(silent=True) or {};s.done=bool(d.get('done',s.done));s.title=str(d.get('title',s.title)).strip();db.session.commit();return jsonify(s.to_dict())

@app.delete('/api/subtasks/<int:subtask_id>')
@token_required
def delete_subtask(u,subtask_id):
    s=db.session.get(Subtask,subtask_id);t=db.session.get(Task,s.task_id) if s else None
    if not s or not t or t.user_id!=u.id:return jsonify({'message':'Subtask not found.'}),404
    db.session.delete(s);db.session.commit();return jsonify({'message':'Subtask deleted.'})

@app.get('/api/vaani/context')
@token_required
def vaani_context(u):
    ts=[t.to_dict() for t in Task.query.filter_by(user_id=u.id).all()]; now=utc_now(); total=len(ts); done=sum(x['status']=='done' for x in ts); p={'total':total,'done':done,'active':total-done,'overdue':sum(x['status']!='done' and x['due_at'] and datetime.fromisoformat(x['due_at'])<now for x in ts),'today':sum(x['due_at'] and datetime.fromisoformat(x['due_at']).date()==now.date() for x in ts)}
    return jsonify({'workspace':'TaskFlow','user':user_payload(u),'tasks':ts,'productivity':p})

@app.post('/api/vaani/chat')
@token_required
def vaani_chat(u):
    data=request.get_json(silent=True) or {};message=str(data.get('message','')).strip()
    if not message:return jsonify({'message':'Message is required.'}),400
    base=os.getenv('VAANI_API_URL','https://vaani-ai-workspace.vercel.app').rstrip('/')
    ts=[t.to_dict() for t in Task.query.filter_by(user_id=u.id).all()]
    now=utc_now();stats={'total':len(ts),'done':sum(x['status']=='done' for x in ts),'overdue':sum(x['status']!='done' and x['due_at'] and datetime.fromisoformat(x['due_at'])<now for x in ts),'today':sum(x['due_at'] and datetime.fromisoformat(x['due_at']).date()==now.date() for x in ts)}
    prompt_context=f"TaskFlow context for {friendly_name(u)}. Current UTC: {now.isoformat()}. Productivity: {stats}. Tasks: {ts}. Use this context to answer. Do not claim to modify data unless TaskFlow confirms an action."
    body={'message':message,'history':data.get('history',[])[-8:],'mode':'General','model':'openai/gpt-oss-20b','live_context':{'workspace':'TaskFlow','timezone':data.get('timezone') or 'Asia/Kolkata','memory':[prompt_context]}}
    try:
        r=requests.post(base+'/api/chat',json=body,timeout=45);out=r.json()
        if not r.ok:return jsonify({'message':out.get('error','Vaani is unavailable.') or 'Vaani is unavailable.'}),502
        return jsonify({'ok':True,'text':out.get('text',''),'provider':'Vaani','context_used':True})
    except Exception as e:return jsonify({'message':'Vaani is temporarily unavailable.','detail':str(e)}),502

@app.post('/api/vaani/action')
@token_required
def vaani_action(u):
    d=request.get_json(silent=True) or {};action=d.get('action');task_id=d.get('task_id')
    if action not in {'complete_task','reopen_task','delete_task'}:return jsonify({'message':'Action is not allowed.'}),400
    t=Task.query.filter_by(id=task_id,user_id=u.id).first()
    if not t:return jsonify({'message':'Task not found.'}),404
    if action=='complete_task':t.status='done'
    elif action=='reopen_task':t.status='pending'
    else:db.session.delete(t)
    db.session.commit();return jsonify({'ok':True,'action':action,'task_id':task_id})

@app.errorhandler(413)
def too_large(_):return jsonify({'message':'Request too large.'}),413

if __name__=='__main__':app.run(host='0.0.0.0',port=int(os.getenv('PORT',5000)),debug=False)
