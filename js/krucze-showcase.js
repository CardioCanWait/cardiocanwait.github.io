const demoButton = document.querySelector('.demo-toggle');
const demoImage = document.getElementById('filter-demo');
if (demoButton && demoImage) {
  demoButton.addEventListener('click', () => {
    const playing = demoButton.getAttribute('aria-pressed') === 'true';
    demoImage.src = playing ? demoImage.dataset.still : demoImage.dataset.animation;
    demoImage.parentElement.href = demoImage.src;
    demoButton.setAttribute('aria-pressed', String(!playing));
    demoButton.textContent = playing ? 'Play demo ▶' : 'Stop demo ■';
  });
}
