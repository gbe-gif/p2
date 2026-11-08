const dialog = document.querySelector('#password-dialog');
const form = document.querySelector('#password-form');
const input = document.querySelector('#gallery-password');
const error = document.querySelector('#password-error');
const unlock = document.querySelector('#unlock');
const lock = document.querySelector('#lock');
const confirm = document.querySelector('#confirm');
const lockedCopy = document.querySelector('#locked-copy');
const grid = document.querySelector('#restricted-images');
const status = document.querySelector('#load-status');

const imageUrls = new Set();
let activeRequest;

function clearGallery() {
  for (const url of imageUrls) URL.revokeObjectURL(url);
  imageUrls.clear();
  grid.replaceChildren();
  grid.hidden = true;
}

function requestGallery(password, signal, image) {
  const path = image ? `/api/gallery?image=${image}` : '/api/gallery';
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
    signal
  });
}

function showError(message) {
  error.textContent = message;
  error.hidden = false;
}

unlock.addEventListener('click', () => {
  form.reset();
  error.hidden = true;
  dialog.showModal();
});
document.querySelector('#cancel').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  form.reset();
  if (!unlock.hidden) activeRequest?.abort();
});
lock.addEventListener('click', () => {
  activeRequest?.abort();
  clearGallery();
  status.textContent = '';
  lock.hidden = true;
  lockedCopy.hidden = false;
  unlock.hidden = false;
  unlock.focus();
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (confirm.disabled) return;
  const password = input.value;
  const controller = new AbortController();
  const { signal } = controller;
  activeRequest = controller;
  confirm.disabled = true;
  error.hidden = true;

  try {
    if (location.protocol === 'file:') {
      showError('비밀번호 확인은 서버에서 열린 페이지에서 사용할 수 있어요.');
      return;
    }
    const result = await requestGallery(password, signal);
    if (signal.aborted) return;
    if (result.status === 401) {
      showError('비밀번호가 일치하지 않아요.');
      input.focus();
      return;
    }
    if (result.status !== 204) {
      showError('지금은 열람 요청을 처리할 수 없어요. 잠시 후 다시 시도해주세요.');
      return;
    }

    unlock.hidden = true;
    lockedCopy.hidden = true;
    lock.hidden = false;
    dialog.close();
    lock.focus();
    status.textContent = '이미지를 불러오는 중…';
    const images = Array.from({ length: 9 }, async (_, index) => {
      const result = await requestGallery(password, signal, index + 14);
      if (!result.ok) throw new Error('Image request failed');
      const blob = await result.blob();
      if (signal.aborted) return null;

      const url = URL.createObjectURL(blob);
      imageUrls.add(url);
      const img = document.createElement('img');
      img.src = url;
      img.alt = `언세이프티 이미지 ${index + 1}`;
      img.decoding = 'async';
      return img;
    });

    const results = await Promise.allSettled(images);
    if (signal.aborted) return;
    const loaded = results.flatMap(result => result.status === 'fulfilled' && result.value ? [result.value] : []);
    grid.replaceChildren(...loaded);
    grid.hidden = loaded.length === 0;
    status.textContent = loaded.length === images.length ? '' : '일부 이미지를 불러오지 못했어요. 다시 잠근 뒤 재시도할 수 있어요.';
  } catch {
    if (!signal.aborted) showError('서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    if (activeRequest === controller) activeRequest = undefined;
    confirm.disabled = false;
  }
});
