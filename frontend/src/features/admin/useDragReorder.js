import { useRef, useState } from 'react';

// Encapsulates HTML5 drag + touch reordering for table rows. Reports a move via
// onReorder(fromIndex, toIndex); callers spread getRowProps(i) onto each row.
export function useDragReorder(onReorder) {
  const dragIndex = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  function reset() {
    dragIndex.current = null;
    setDragOver(null);
  }

  function onTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const row = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('tr[data-index]');
    const idx = row ? parseInt(row.dataset.index, 10) : null;
    if (idx !== null && idx !== dragOver) setDragOver(idx);
  }

  function getRowProps(i) {
    return {
      'data-index': i,
      draggable: true,
      onDragStart: (e) => { dragIndex.current = i; e.dataTransfer.effectAllowed = 'move'; },
      onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOver !== i) setDragOver(i); },
      onDrop: (e) => { e.preventDefault(); const from = dragIndex.current; reset(); onReorder(from, i); },
      onDragEnd: reset,
      onTouchStart: () => { dragIndex.current = i; },
      onTouchMove,
      onTouchEnd: () => { const from = dragIndex.current; const to = dragOver; reset(); onReorder(from, to); },
      className: [
        dragIndex.current === i ? 'row-dragging' : '',
        dragOver === i && dragIndex.current !== i ? 'row-drag-over' : '',
      ].filter(Boolean).join(' '),
    };
  }

  return { getRowProps };
}
