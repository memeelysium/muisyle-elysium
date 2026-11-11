import { animate, inView, stagger } from 'https://cdn.jsdelivr.net/npm/motion@12.23.24/+esm';

// Keep the page calm and accessible when reduced motion is requested.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const heroItems = document.querySelectorAll(
    '.hero-copy .eyebrow, .hero-copy h1, .hero-copy .hero-lead, .hero-copy .hero-actions, .hero-copy .hero-meta'
  );

  if (heroItems.length) {
    animate(
      heroItems,
      { opacity: [0, 1], y: [18, 0] },
      { duration: 0.72, delay: stagger(0.11), ease: 'ease-out' }
    );
  }

  // Animate content as it enters the viewport, once per element.
  document.querySelectorAll('.vision-card, .universe-card, .faq-list details').forEach((element) => {
    inView(element, () => {
      animate(
        element,
        { opacity: [0, 1], y: [20, 0] },
        { duration: 0.62, ease: 'ease-out' }
      );
    }, { amount: 0.16 });
  });

  // Add a restrained lift to cards on pointer devices.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.vision-card, .universe-card').forEach((card) => {
      card.addEventListener('pointerenter', () => {
        animate(card, { y: -4 }, { duration: 0.2, ease: 'ease-out' });
      });
      card.addEventListener('pointerleave', () => {
        animate(card, { y: 0 }, { duration: 0.24, ease: 'ease-out' });
      });
    });
  }
}
