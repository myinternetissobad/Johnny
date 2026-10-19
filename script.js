const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let page = 0;
let soundOn = true;
let audioContext;
const totalPages = 6;

const clickableParts = 'button, [role="button"], .supply, .build-part, .dog-page';
function playClickAnimation(element) {
  element.classList.remove('clicking');
  void element.offsetWidth;
  element.classList.add('clicking');
  element.addEventListener('animationend', () => element.classList.remove('clicking'), { once: true });
}
function playClickEffect(x, y) {
  const effect = document.createElement('div');
  effect.className = 'click-effect';
  effect.style.setProperty('--click-x', `${x - 10}px`);
  effect.style.setProperty('--click-y', `${y - 10}px`);
  for (let index = 0; index < 10; index += 1) {
    const spark = document.createElement('span');
    spark.style.setProperty('--angle', `${index * 36}deg`);
    effect.appendChild(spark);
  }
  document.body.appendChild(effect);
  setTimeout(() => effect.remove(), 700);
}
document.addEventListener('pointerdown', (event) => {
  const target = event.target.closest(clickableParts);
  if (target) { playClickAnimation(target); playClickEffect(event.clientX, event.clientY); }
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const target = event.target.closest(clickableParts);
  if (target) { const bounds = target.getBoundingClientRect(); playClickAnimation(target); playClickEffect(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2); }
});

function beep(frequency = 440, duration = 0.09, type = 'sine') {
  if (!soundOn) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.14, audioContext.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(); oscillator.stop(audioContext.currentTime + duration + 0.02);
}

function showPage(nextPage) {
  page = Math.max(0, Math.min(totalPages - 1, nextPage));
  if (page === 4) {
    launched = false;
    $('#rocket-ready').classList.remove('launching');
    $('#countdown').textContent = 'READY';
  }
  $$('.story-page').forEach((item, index) => item.classList.toggle('active', index === page));
  $('#page-label').textContent = `Page ${page + 1} of ${totalPages}`;
  $('#progress-bar').style.width = `${((page + 1) / totalPages) * 100}%`;
  $('#back-button').disabled = page === 0;
  $('#next-button').disabled = page === totalPages - 1;
  $('#next-button').textContent = page === totalPages - 1 ? 'The end' : (page === 2 && !sketchReady ? 'Build from sketch' : 'Next page');
  if (page === 4) $('#rocket-status').textContent = built === 3 ? 'Your completed rocket is ready for its first flight.' : 'The rocket is waiting for its final parts.';
  if (page === 5) $('#mars-supply-count').textContent = `${packed} / 3 arrived`;
  $$('.dots button').forEach((dot, index) => dot.classList.toggle('active', index === page));
  if (page === 2 && !sketchReady) updateSketchProgress();
  beep(330 + page * 45, .08);
}

function startStory() {
  $('#cover').classList.add('hidden'); $('#book').classList.remove('hidden'); showPage(0); beep(520, .15);
}

$('#start-button').addEventListener('click', startStory);
$('#cover-next-button').addEventListener('click', startStory);
$('#home-button').addEventListener('click', () => { $('#book').classList.add('hidden'); $('#cover').classList.remove('hidden'); beep(260); });
$('#back-button').addEventListener('click', () => showPage(page - 1));
$('#next-button').addEventListener('click', () => { if (page === 2 && !sketchReady) showAssembleSlide(); else showPage(page + 1); });
$('#sound-button').addEventListener('click', () => { soundOn = !soundOn; $('#sound-button').textContent = soundOn ? 'Sound' : 'Muted'; if (soundOn) beep(640); });
$('#replay-button').addEventListener('click', () => showPage(0));

$$('.dots').forEach((dots) => { for (let i = 0; i < totalPages; i += 1) { const dot = document.createElement('button'); dot.type = 'button'; dot.className = i === 0 ? 'active' : ''; dot.setAttribute('aria-label', i === 0 ? 'Go to cover' : `Go to page ${i + 1}`); dot.addEventListener('click', () => { if (dots.id === 'cover-dots') { startStory(); if (i > 0) showPage(i); } else showPage(i); }); dots.append(dot); } });

const marsTap = $('#mars-tap');
function sparkleMars() { marsTap.classList.add('sparkled'); marsTap.querySelector('.planet').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15) rotate(8deg)' }, { transform: 'scale(1)' }], { duration: 500 }); beep(720, .1); }
marsTap.addEventListener('click', sparkleMars); marsTap.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') sparkleMars(); });

let packed = 0;
let pointerDrag = null;
function isInsideBasket(x, y) { const bounds = box.getBoundingClientRect(); return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom; }
$$('.supply').forEach((item) => {
  item.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', item.dataset.item));
  item.addEventListener('pointerdown', (event) => { if (item.classList.contains('packed')) return; event.preventDefault(); item.setPointerCapture?.(event.pointerId); const bounds = item.getBoundingClientRect(); pointerDrag = { item, offsetX: bounds.width / 2, offsetY: bounds.height / 2, moved: false, original: { position: item.style.position, left: item.style.left, top: item.style.top, transform: item.style.transform, zIndex: item.style.zIndex } }; item.classList.add('dragging'); });
  item.addEventListener('click', () => { if (item.dataset.justDragged) { delete item.dataset.justDragged; return; } if (!item.classList.contains('packed')) packItem(item); });
  item.addEventListener('keydown', (event) => { if ((event.key === 'Enter' || event.key === ' ') && !item.classList.contains('packed')) { event.preventDefault(); packItem(item); } });
});
const box = $('#supply-box');
document.addEventListener('pointermove', (event) => { if (!pointerDrag) return; const { item } = pointerDrag; if (Math.abs(event.clientX - (item.getBoundingClientRect().left + pointerDrag.offsetX)) + Math.abs(event.clientY - (item.getBoundingClientRect().top + pointerDrag.offsetY)) > 8) pointerDrag.moved = true; if (pointerDrag.moved) { item.style.position = 'fixed'; item.style.left = `${event.clientX - pointerDrag.offsetX}px`; item.style.top = `${event.clientY - pointerDrag.offsetY}px`; item.style.transform = 'scale(1.08) rotate(3deg)'; item.style.zIndex = '50'; } });
document.addEventListener('pointerup', (event) => { if (!pointerDrag) return; const { item, moved, original } = pointerDrag; item.classList.remove('dragging'); if (moved) { item.dataset.justDragged = 'true'; if (isInsideBasket(event.clientX, event.clientY)) packItem(item); else { item.style.position = original.position; item.style.left = original.left; item.style.top = original.top; item.style.transform = original.transform; item.style.zIndex = original.zIndex; } } pointerDrag = null; });
document.addEventListener('pointercancel', () => { if (!pointerDrag) return; const { item, original } = pointerDrag; item.classList.remove('dragging'); item.style.position = original.position; item.style.left = original.left; item.style.top = original.top; item.style.transform = original.transform; item.style.zIndex = original.zIndex; pointerDrag = null; });
box.addEventListener('dragover', (event) => event.preventDefault());
box.addEventListener('drop', (event) => { event.preventDefault(); const item = $(`.supply[data-item="${event.dataTransfer.getData('text/plain')}"]`); if (item) packItem(item); });
function packItem(item) { if (item.classList.contains('packed')) return; item.classList.add('packed'); item.style.display = 'none'; packed += 1; const packedIcon = document.createElement('span'); packedIcon.className = `packed-icon packed-${item.dataset.item}`; packedIcon.textContent = item.dataset.item.slice(0, 1).toUpperCase(); $('#packed-icons').append(packedIcon); $('#collection').textContent = `${packed} / 3 packed`; $('#mars-supply-count').textContent = `${packed} / 3 arrived`; box.classList.add('filled'); setTimeout(() => box.classList.remove('filled'), 400); beep(450 + packed * 80, .1); }

let drawing = false;
let drawColor = '#fff8e8';
let sketchReady = false;
const sketchedParts = new Set();
const sketchCanvases = $$('.part-canvas');
function canvasPoint(canvas, event) { const bounds = canvas.getBoundingClientRect(); return { x: (event.clientX - bounds.left) * canvas.width / bounds.width, y: (event.clientY - bounds.top) * canvas.height / bounds.height }; }
sketchCanvases.forEach((canvas) => { const context = canvas.getContext('2d'); context.lineCap = 'round'; context.lineJoin = 'round'; context.lineWidth = 10; canvas.addEventListener('pointerdown', (event) => { event.preventDefault(); drawing = true; canvas.setPointerCapture?.(event.pointerId); canvas.closest('.sketch-card').classList.add('active'); const point = canvasPoint(canvas, event); context.strokeStyle = drawColor; context.beginPath(); context.moveTo(point.x, point.y); context.lineTo(point.x + 1, point.y + 1); context.stroke(); sketchedParts.add(canvas.dataset.part); updateSketchProgress(); }); canvas.addEventListener('pointermove', (event) => { if (!drawing) return; const point = canvasPoint(canvas, event); context.strokeStyle = drawColor; context.lineTo(point.x, point.y); context.stroke(); sketchedParts.add(canvas.dataset.part); updateSketchProgress(); }); ['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => canvas.addEventListener(eventName, () => { drawing = false; })); });
function updateSketchProgress() { const complete = sketchedParts.size === 3; $('#sketch-progress').textContent = `${sketchedParts.size} / 3 parts sketched`; $('#use-sketch').disabled = !complete; $('#next-button').disabled = page === totalPages - 1 || (page === 2 && !complete && !sketchReady); $('#next-button').textContent = page === 2 && !complete && !sketchReady ? 'Sketch all 3 parts' : (page === totalPages - 1 ? 'The end' : 'Build from sketches'); }
$$('.draw-tool').forEach((tool) => tool.addEventListener('click', () => { drawColor = tool.dataset.color; $$('.draw-tool').forEach((item) => item.classList.toggle('active', item === tool)); beep(500); }));
$('#clear-blueprint').addEventListener('click', () => { sketchCanvases.forEach((canvas) => canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)); sketchedParts.clear(); sketchReady = false; updateSketchProgress(); beep(260); });
function showAssembleSlide() { if (sketchedParts.size < 3 && !sketchReady) return; sketchReady = true; sketchCanvases.forEach((canvas) => { const drawing = canvas.toDataURL('image/png'); $(`#carried-${canvas.dataset.part}`).src = drawing; $(`#drag-${canvas.dataset.part}`).src = drawing; }); $('#draw-slide').classList.add('hidden'); $('#assemble-slide').classList.remove('hidden'); $('#draw-copy').classList.add('hidden'); $('#assemble-copy').classList.remove('hidden'); $('#next-button').disabled = false; $('#next-button').textContent = 'Next page'; beep(640, .12, 'triangle'); }
function showDrawSlide() { if (sketchReady) return; $('#draw-slide').classList.remove('hidden'); $('#assemble-slide').classList.add('hidden'); $('#draw-copy').classList.remove('hidden'); $('#assemble-copy').classList.add('hidden'); updateSketchProgress(); }
$('#use-sketch').addEventListener('click', showAssembleSlide);
let built = 0;
let partDrag = null;
function restorePart(part, original) { part.style.position = original.position; part.style.left = original.left; part.style.top = original.top; part.style.transform = original.transform; part.style.zIndex = original.zIndex; }
function attachPart(part) { if (part.classList.contains('used')) return; part.classList.add('used'); const target = $(`.part-target[data-target="${part.dataset.part}"]`); const placedDrawing = $(`#placed-${part.dataset.part}`); const draggedDrawing = $(`#drag-${part.dataset.part}`); if (placedDrawing && draggedDrawing) placedDrawing.src = draggedDrawing.src; target.classList.add('filled'); built += 1; $('#build-count').textContent = `${built} / 3 built`; if (built === 3) { $('#rocket-status').textContent = 'Your completed rocket is ready for its first flight.'; $('#rocket-body').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-15px)' }, { transform: 'translateY(0)' }], { duration: 500 }); } beep(400 + built * 120, .1, 'triangle'); }
$$('.build-part').forEach((part) => { part.addEventListener('click', () => { if (part.dataset.justDragged) { delete part.dataset.justDragged; return; } attachPart(part); }); part.addEventListener('pointerdown', (event) => { if (part.classList.contains('used')) return; event.preventDefault(); part.setPointerCapture?.(event.pointerId); const bounds = part.getBoundingClientRect(); partDrag = { part, offsetX: bounds.width / 2, offsetY: bounds.height / 2, moved: false, original: { position: part.style.position, left: part.style.left, top: part.style.top, transform: part.style.transform, zIndex: part.style.zIndex } }; part.classList.add('dragging'); }); });
document.addEventListener('pointermove', (event) => { if (!partDrag) return; const { part } = partDrag; const bounds = part.getBoundingClientRect(); if (Math.abs(event.clientX - (bounds.left + partDrag.offsetX)) + Math.abs(event.clientY - (bounds.top + partDrag.offsetY)) > 8) partDrag.moved = true; if (partDrag.moved) { part.style.position = 'fixed'; part.style.left = `${event.clientX - partDrag.offsetX}px`; part.style.top = `${event.clientY - partDrag.offsetY}px`; part.style.transform = 'scale(1.08) rotate(4deg)'; part.style.zIndex = '50'; } });
document.addEventListener('pointerup', (event) => { if (!partDrag) return; const { part, moved, original } = partDrag; part.classList.remove('dragging'); if (moved) { part.dataset.justDragged = 'true'; const target = $(`.part-target[data-target="${part.dataset.part}"]`); const bounds = target.getBoundingClientRect(); if (event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom) attachPart(part); else restorePart(part, original); } partDrag = null; });
$$('.build-part').forEach((part) => part.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', part.dataset.part)));
$$('.part-target').forEach((target) => { target.addEventListener('dragover', (event) => event.preventDefault()); target.addEventListener('drop', (event) => { event.preventDefault(); const part = $(`.build-part[data-part="${target.dataset.target}"]`); if (part) attachPart(part); }); });

const dog = $('#dog-tap');
dog.addEventListener('click', () => { const thought = $('#thought'); thought.textContent = ['Woof!', 'I packed snacks!', 'To Mars!'][Math.floor(Math.random() * 3)]; thought.classList.add('show'); beep(280, .12); setTimeout(() => thought.classList.remove('show'), 1800); });

$('#explore-button').addEventListener('click', () => {
  $('#explore-message').textContent = 'A tiny Mars friend says, "Welcome, builders!"';
  $$('.alien').forEach((alien) => alien.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.7) rotate(18deg)' }, { transform: 'scale(1)' }], { duration: 600 }));
  beep(760, .14, 'triangle');
});

const launchButton = $('#launch-button'); let holdTimer; let launched = false;
function beginLaunch(event) { event.preventDefault(); if (launched) return; $('#countdown').textContent = '3'; beep(300, .12); holdTimer = setTimeout(() => { $('#countdown').textContent = '2'; beep(360, .12); holdTimer = setTimeout(() => { $('#countdown').textContent = '1'; beep(430, .12); holdTimer = setTimeout(() => { launched = true; $('#countdown').textContent = 'BLAST OFF!'; $('#rocket-ready').classList.add('launching'); beep(720, .4, 'sawtooth'); setTimeout(() => showPage(5), 1500); }, 600); }, 600); }, 600); }
function cancelLaunch() { clearTimeout(holdTimer); if (!launched) { $('#countdown').textContent = 'READY'; } }
launchButton.addEventListener('pointerdown', beginLaunch); ['pointerup', 'pointerleave', 'pointercancel'].forEach((event) => launchButton.addEventListener(event, cancelLaunch));
