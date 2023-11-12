document.querySelectorAll('button.toggle-button').forEach((button) => {
  button.addEventListener('click', (e) => {
    const pressed = e.target.getAttribute('aria-pressed');
    e.target.setAttribute('aria-pressed', pressed === 'true' ? 'false' : 'true');
    e.target.closest('li').classList.toggle('checked');
  });
});
