// Shared "is this scrollable element at its end?" check, used by every bottom-
// fade scroll hint (ScrollHint, and the badges carousel's per-page grid) so the
// slack threshold and the canScroll/atEnd definitions live in exactly one place.
const EDGE_SLACK_PX = 4; // treat "within this many px of the end" as at-end

export function getScrollEdges(el) {
  const canScroll = el.scrollHeight - el.clientHeight > EDGE_SLACK_PX;
  const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - EDGE_SLACK_PX;
  return { canScroll, atEnd };
}
