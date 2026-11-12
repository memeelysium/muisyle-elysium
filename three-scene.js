// MUISYLE standalone 360-degree hero planet interaction.
// No external library or CDN dependency.
(() => {
  const init = () => {
    const host = document.querySelector('.hero-visual');
    const planet = host?.querySelector('.planet-core');
    if (!host || !planet) return;

    let active = false;
    let pointerId = null;
    let lastX = 0;
    let lastY = 0;
    let rotateY = 0;
    let rotateX = 0;
    let velocityY = 0;
    let velocityX = 0;
    let raf = 0;
    let lastTime = 0;

    const paint = () => {
      planet.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };
    const stopMomentum = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const momentum = now => {
      if (!lastTime) lastTime = now;
      const elapsed = Math.min(32, now - lastTime);
      lastTime = now;
      rotateY += velocityY * elapsed;
      rotateX = Math.max(-28, Math.min(28, rotateX + velocityX * elapsed));
      velocityY *= Math.pow(0.94, elapsed / 16.67);
      velocityX *= Math.pow(0.94, elapsed / 16.67);
      paint();
      if (Math.abs(velocityY) > 0.008 || Math.abs(velocityX) > 0.008) {
        raf = requestAnimationFrame(momentum);
      } else {
        raf = 0;
        lastTime = 0;
      }
    };

    host.addEventListener('pointerdown', event => {
      if (event.target.closest('button, a')) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      active = true;
      pointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      velocityY = 0;
      velocityX = 0;
      lastTime = 0;
      stopMomentum();
      host.classList.add('is-dragging');
      try { host.setPointerCapture(pointerId); } catch (_) {}
      event.preventDefault();
    });

    host.addEventListener('pointermove', event => {
      if (!active || event.pointerId !== pointerId) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      rotateY += dx * 0.75;
      rotateX = Math.max(-28, Math.min(28, rotateX - dy * 0.35));
      velocityY = dx * 0.045;
      velocityX = -dy * 0.02;
      paint();
      event.preventDefault();
    });

    const finish = event => {
      if (!active || (event && event.pointerId !== pointerId)) return;
      active = false;
      pointerId = null;
      host.classList.remove('is-dragging');
      lastTime = 0;
      raf = requestAnimationFrame(momentum);
    };
    host.addEventListener('pointerup', finish);
    host.addEventListener('pointercancel', finish);
    host.addEventListener('lostpointercapture', finish);

    const reset = document.getElementById('cosmic-reset');
    reset?.addEventListener('click', () => {
      active = false;
      pointerId = null;
      stopMomentum();
      rotateX = 0;
      rotateY = 0;
      velocityX = 0;
      velocityY = 0;
      lastTime = 0;
      host.classList.remove('is-dragging');
      paint();
    });

    // Gentle idle movement makes the interactive element discoverable.
    let idleFrame = 0;
    const idle = () => {
      if (!active && !raf && !host.matches(':hover')) {
        rotateY += 0.035;
        paint();
      }
      idleFrame = requestAnimationFrame(idle);
    };
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      idleFrame = requestAnimationFrame(idle);
    }
    window.addEventListener('pagehide', () => {
      stopMomentum();
      cancelAnimationFrame(idleFrame);
    }, { once: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
