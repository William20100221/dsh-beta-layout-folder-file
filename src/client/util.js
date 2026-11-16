// Small helpers with no state.

/** Set or remove an attribute without touching it when unchanged (keeps the MutationObserver quiet). */
export function toggleAttr(el, name, on, value = '') {
  if (on && el.getAttribute(name) !== value) el.setAttribute(name, value)
  else if (!on && el.hasAttribute(name)) el.removeAttribute(name)
}

/** Which half of `el` a pointer event is in; DSH decides drop positions the same way. */
export function halfOf(event, el) {
  const rect = el.getBoundingClientRect()
  return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}

/** The next element sibling that is not one of this plugin's transient nodes (the drop slot). */
export function nextSiblingSkipping(el, className) {
  let next = el.nextElementSibling
  while (next !== null && next.classList.contains(className)) next = next.nextElementSibling
  return next
}

/** A short unique id for a new folder. */
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

/** True when the event comes from somewhere the user is typing. */
export const isTyping = (event) =>
  event.target instanceof Element && event.target.closest('input, textarea, [contenteditable=""], [contenteditable="true"]') !== null

export const reducedMotion = (win) => typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches
