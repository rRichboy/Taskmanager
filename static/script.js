document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const taskDate = document.getElementById('task-date');
    const taskColor = document.getElementById('task-color');
    const addTaskBtn = document.getElementById('add-task');
    const taskList = document.getElementById('task-list');
    const notification = document.getElementById('notification');
    const body = document.body;
    const toggleDarkModeBtn = document.getElementById('toggle-dark-mode');
    const profileDropdown = document.querySelector('.profile-dropdown .dropdown-content');
    const profileBtn = document.querySelector('.profile-btn');

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
        if (savedTheme === 'dark-mode') {
            toggleDarkModeBtn.textContent = 'Светлая тема';
        } else {
            toggleDarkModeBtn.textContent = 'Темная тема';
        }
    }

    addTaskBtn.addEventListener('click', (event) => {
        event.preventDefault();

        const task_text = taskInput.value;
        const task_time = taskDate.value;
        const color = taskColor.value;

        if (!task_text || !task_time || !color) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.style.borderColor = color;

        taskItem.innerHTML = `
            <span>${task_text} - <small>${new Date(task_time).toLocaleString()}</small></span>
            <div>
                <button class="delete-task"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        taskList.appendChild(taskItem);

        const formData = new FormData();
        formData.append('task_text', task_text);
        formData.append('task_time', task_time);
        formData.append('color', color);

        fetch('/add_task', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка добавления задачи');
                }
                window.location.reload();
                return response.json();
            })
            .then(data => {
                taskItem.dataset.taskId = data.task_id;
            });

        taskInput.value = '';
        taskDate.value = '';
        showNotification('Задача добавлена!');
    });

    taskList.addEventListener('click', (e) => {
        const deleteButton = e.target.closest('.delete-task');

        if (deleteButton) {
            e.preventDefault();
            deleteTask(deleteButton);
        }
    });

    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                window.location.href = "/";
                window.history.replaceState(null, null, window.location.href);
                window.addEventListener('popstate', () => {
                    window.location.href = "/";
                });
            }
        });
    });

    toggleDarkModeBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            toggleDarkModeBtn.textContent = 'Светлая тема';
            localStorage.setItem('theme', 'dark-mode');
        } else {
            toggleDarkModeBtn.textContent = 'Темная тема';
            localStorage.setItem('theme', 'light-mode');
        }
        profileDropdown.style.display = 'none';
    });

    profileBtn.addEventListener('click', () => {
        if (profileDropdown.style.display === 'block') {
            profileDropdown.style.display = 'none';
        } else {
            profileDropdown.style.display = 'block';
        }
    });

    function showNotification(message, type = 'success') {
        const notificationType = type === 'success' ? 'notification-success' : 'notification-error';
        notification.textContent = message;
        notification.classList.add(notificationType, 'show');
        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.remove(notificationType);
        }, 2000);
    }

    function deleteTask(deleteButton) {
        const taskItem = deleteButton.closest('.task-item');
        const taskId = taskItem.dataset.taskId;
        const task_text = taskItem.querySelector('span').textContent;

        fetch(`/delete_task/${taskId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({taskId: taskId})
        })
            .then(response => {
                if (response.ok) {
                    taskItem.remove();
                    showNotification(`Задача "${task_text}" удалена!`);
                } else {
                    throw new Error('Ошибка удаления задачи');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showNotification('Произошла ошибка при удалении задачи', 'error');
            });
    }
});
