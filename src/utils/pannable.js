export default function pannable(node) {
  let startX;
  let startY;
  let x;
  let y;

  function handleMousedown(e) {
    const event = e.touches ? e.touches[0] : e;
    x = startX = event.clientX;
    y = startY = event.clientY;

    node.dispatchEvent(
      new CustomEvent('panstart', {
        detail: { x, y },
      })
    );

    window.addEventListener('mousemove', handleMousemove);
    window.addEventListener('touchmove', handleMousemove);
    window.addEventListener('mouseup', handleMouseup);
    window.addEventListener('touchend', handleMouseup);
  }

  function handleMousemove(e) {
    const event = e.touches ? e.touches[0] : e;
    const dx = event.clientX - x;
    const dy = event.clientY - y;
    x = event.clientX;
    y = event.clientY;

    if (Math.abs(event.clientX - startX) < window.innerWidth * 0.15) return;

    node.dispatchEvent(
      new CustomEvent('panmove', {
        detail: { x, y, dx, dy },
      })
    );
  }

  function handleMouseup(e) {
    const event = e.changedTouches ? e.changedTouches[0] : e;

    x = event.clientX;
    y = event.clientY;

    node.dispatchEvent(
      new CustomEvent('panend', {
        detail: { x, y },
      })
    );

    window.removeEventListener('mousemove', handleMousemove);
    window.removeEventListener('touchmove', handleMousemove);
    window.removeEventListener('mouseup', handleMouseup);
    window.removeEventListener('touchend', handleMouseup);
  }

  node.addEventListener('mousedown', handleMousedown);
  node.addEventListener('touchstart', handleMousedown);

  return {
    destroy() {
      node.removeEventListener('mousedown', handleMousedown);
      node.removeEventListener('touchstart', handleMousedown);
    },
  };
}
