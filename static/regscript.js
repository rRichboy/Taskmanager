document.addEventListener('DOMContentLoaded', (event) => {
    setTimeout(() => {
        const errorElement = document.getElementById('error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        const errorElement1 = document.getElementById('error1');
        if (errorElement1) {
            errorElement1.style.display = 'none';
        }
    }, 3000);
});

function show_hide_password(target) {
    var input = target.previousElementSibling;
    if (input.getAttribute('type') === 'password') {
        target.classList.add('view');
        input.setAttribute('type', 'text');
    } else {
        target.classList.remove('view');
        input.setAttribute('type', 'password');
    }
    return false;
}
