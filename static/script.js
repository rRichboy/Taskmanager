document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const taskDate = document.getElementById('task-date');
    const taskColor = document.getElementById('task-color');
    const addTaskBtn = document.getElementById('add-task');
    const taskListActive = document.getElementById('task-list-active');
    const taskListCompleted = document.getElementById('task-list-completed');
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
        updateTaskListsVisibility();

        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.style.borderColor = color;

        taskItem.innerHTML = `
            <span>${task_text} - <small>${new Date(task_time).toLocaleString()}</small></span>
            <div>
                <button class="complete-task"><i class="fas fa-check"></i></button>
                <button class="delete-task"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        taskListActive.appendChild(taskItem);

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

    taskListActive.addEventListener('click', (e) => {
        const completeButton = e.target.closest('.complete-task');
        const deleteButton = e.target.closest('.delete-task');

        if (completeButton) {
            e.preventDefault();
            completeTask(completeButton);
        }

        if (deleteButton) {
            e.preventDefault();
            deleteTask(deleteButton);
        }
    });

    taskListCompleted.addEventListener('click', (e) => {
        const completeButton = e.target.closest('.complete-task');
        const deleteButton = e.target.closest('.delete-task');

        if (completeButton) {
            e.preventDefault();
            completeTask(completeButton);
        }

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

    const completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];

    function completeTask(completeButton) {
        const taskItem = completeButton.closest('.task-item');
        const taskId = taskItem.dataset.taskId;

        taskItem.classList.toggle('done');

        if (taskItem.classList.contains('done')) {
            completedTasks.push(taskId);
            showNotification('Задача завершена!');
            taskListCompleted.appendChild(taskItem);
        } else {
            const index = completedTasks.indexOf(taskId);
            if (index !== -1) {
                completedTasks.splice(index, 1);
            }
            showNotification('Отмена завершения задачи');
            taskListActive.appendChild(taskItem);
        }

        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
        fetch(`/complete_task/${taskId}`, {
            method: 'POST'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при завершении задачи');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showNotification('Произошла ошибка при завершении задачи', 'error');
            });
        updateTaskListsVisibility();
    }

    completedTasks.forEach(taskId => {
        const taskItem = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
        if (taskItem) {
            taskItem.classList.add('done');
            taskListCompleted.appendChild(taskItem);
        }
    })

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
                    updateTaskListsVisibility(); // Вызываем после успешного удаления
                } else {
                    throw new Error('Ошибка удаления задачи');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showNotification('Произошла ошибка при удалении задачи', 'error');
            });
    }


    const searchInput = document.getElementById('search-input');
    let highlightTimeout;

    searchInput.addEventListener('input', () => {
        const searchText = searchInput.value.toLowerCase();
        const taskItems = document.querySelectorAll('.task-item');

        taskItems.forEach(task => {
            const taskText = task.querySelector('span').textContent.toLowerCase();
            if (taskText.includes(searchText) && searchText !== '') {
                task.classList.add('highlight');
                clearTimeout(highlightTimeout);
                highlightTimeout = setTimeout(() => {
                    task.classList.remove('highlight');
                }, 5000); // Удалить подсветку через 5 секунд
            } else {
                task.classList.remove('highlight');
            }
        });

        if (searchText === '') {
            taskItems.forEach(task => task.classList.remove('highlight'));
        }
    });

    document.body.addEventListener('click', (event) => {
        if (event.target !== searchInput && !searchInput.contains(event.target)) {
            searchInput.blur();
        }
    });

    function updateTaskListsVisibility() {
        const activeTasksContainer = document.getElementById('task-list-active-container');
        const completedTasksContainer = document.getElementById('task-list-completed-container');

        const activeTasks = document.querySelectorAll('#task-list-active > .task-item');
        const completedTasks = document.querySelectorAll('#task-list-completed > .task-item');

        activeTasksContainer.style.display = activeTasks.length > 0 ? 'block' : 'none';
        completedTasksContainer.style.display = completedTasks.length > 0 ? 'block' : 'none';
    }

    updateTaskListsVisibility();

});
