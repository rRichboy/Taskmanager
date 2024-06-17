from flask import Flask, render_template, request, redirect, session, make_response
import hashlib
from datetime import datetime, timedelta
from db import get_db_connection
from apscheduler.schedulers.background import BackgroundScheduler
import asyncio
from functools import wraps

from main import send_notification

app = Flask(__name__)
app.secret_key = 'your_secret_key'
app.permanent_session_lifetime = timedelta(days=30)


# Функция для предотвращения кэширования страницы
def no_cache(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


# Декоратор для проверки авторизации пользователя
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect('/login')
        return f(*args, **kwargs)

    return decorated_function


# Маршрут для страницы приветствия
@app.route('/welcome')
def welcome():
    if 'user_id' in session:
        return redirect('/tasks')
    return render_template('welcome.html')


# Главная страница
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect('/tasks')
    return redirect('/welcome')


# Страница регистрации
@app.route('/register')
def show_register_form():
    return render_template('registration.html')


# Обработка регистрации
@app.route('/register', methods=['POST'])
def register():
    chat_id = request.form['chat_id']
    username = request.form['username']
    password = request.form['password']
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
    existing_user = cursor.fetchone()

    cursor.execute('SELECT * FROM users WHERE id = %s', (chat_id,))
    existing_chat_id = cursor.fetchone()

    if existing_user:
        conn.close()
        error_message = 'Такой пользователь уже существует'
        return render_template('registration.html', error=error_message)
    elif existing_chat_id:
        conn.close()
        error_message = 'Такой Chat ID уже существует'
        return render_template('registration.html', error=error_message)
    else:
        cursor.execute('INSERT INTO users (id, username, password) VALUES (%s, %s, %s)',
                       (chat_id, username, password_hash))
        conn.commit()
        conn.close()
        return redirect('/login')


# Страница входа
@app.route('/login')
def show_login_form():
    if 'user_id' in session:
        return redirect('/tasks')
    return render_template('login.html')


# Обработка входа
@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM users WHERE username = %s AND password = %s', (username, password_hash))
    user = cursor.fetchone()
    conn.close()

    if user:
        session.permanent = True  # Сделать сессию постоянной
        session['user_id'] = user[0]
        session['username'] = username
        return redirect('/tasks')
    else:
        error_message = 'Неправильный логин или пароль'
        return render_template('login.html', error1=error_message)


# Страница задач
@app.route('/tasks')
@login_required
def tasks():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, task_text, task_time, color FROM tasks WHERE user_id = %s', (user_id,))
    tasks = cursor.fetchall()
    conn.close()
    response = make_response(
        render_template('index.html', tasks=tasks, current_datetime=datetime.now().strftime('%Y-%m-%dT%H:%M')))
    return no_cache(response)


# Добавление задачи
@app.route('/add_task', methods=['POST'])
@login_required
def add_task():
    user_id = session['user_id']
    task_text = request.form['task_text']
    task_time_str = request.form['task_time']
    color = request.form['color']

    if not task_text or not task_time_str or not color:
        return redirect('/tasks')

    try:
        task_time = datetime.strptime(task_time_str, '%Y-%m-%dT%H:%M')
    except ValueError:
        return redirect('/tasks')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO tasks (user_id, task_text, task_time, color) VALUES (%s, %s, %s, %s)',
                   (user_id, task_text, task_time, color))
    conn.commit()
    conn.close()

    return redirect('/tasks')


# Удаление задачи
@app.route('/delete_task/<int:task_id>', methods=['POST'])
@login_required
def delete_task(task_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM tasks WHERE id = %s AND user_id = %s', (task_id, user_id))
    conn.commit()
    conn.close()

    return redirect('/tasks')


# Выход из аккаунта
@app.route('/logout', methods=['POST'])
@login_required
def logout():
    session.clear()
    response = make_response(redirect('/login'))
    return no_cache(response)


# Функция для проверки задач
def check_tasks():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, task_text FROM tasks WHERE DATE_TRUNC('minute', task_time) = DATE_TRUNC('minute', NOW())")
    tasks = cursor.fetchall()
    conn.close()

    for task in tasks:
        user_id = task[0]
        task_text = task[1]
        asyncio.run(send_notification(user_id, task_text))


scheduler = BackgroundScheduler()
scheduler.add_job(check_tasks, 'interval', minutes=1)
scheduler.start()

if __name__ == '__main__':
    app.run(debug=True)
