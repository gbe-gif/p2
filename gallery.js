const dialog = document.querySelector('#password-dialog');
const form = document.querySelector('#password-form');
const input = document.querySelector('#gallery-password');
const error = document.querySelector('#password-error');
const unlock = document.querySelector('#unlock');
const lock = document.querySelector('#lock');
const lockedCopy = document.querySelector('#locked-copy');
const grid = document.querySelector('#restricted-images');
const status = document.querySelector('#load-status');
const messages = document.documentElement.lang === 'en'
  ? {
      wrongPasscode: 'That passcode does not match.',
      imageLabel: 'NSFW image',
      loadError: 'Some images could not be loaded.'
    }
  : {
      wrongPasscode: '비밀번호가 일치하지 않아요.',
      imageLabel: '언세이프티 이미지',
      loadError: '일부 이미지를 불러오지 못했어요.'
    };

// This is a visitor prompt. The encoded passcode is readable from the source.
const passcode = atob('MDMxNmlhbg==');

unlock.addEventListener('click', () => {
  form.reset();
  error.hidden = true;
  dialog.showModal();
});

document.querySelector('#cancel').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => form.reset());

lock.addEventListener('click', () => {
  grid.hidden = true;
  grid.replaceChildren();
  status.textContent = '';
  lock.hidden = true;
  lockedCopy.hidden = false;
  unlock.hidden = false;
  unlock.focus();
});

form.addEventListener('submit', event => {
  event.preventDefault();

  if (input.value !== passcode) {
    error.textContent = messages.wrongPasscode;
    error.hidden = false;
    input.focus();
    return;
  }

  error.hidden = true;
  unlock.hidden = true;
  lockedCopy.hidden = true;
  lock.hidden = false;
  dialog.close();
  lock.focus();

  const images = Array.from({ length: 9 }, (_, index) => {
    const img = document.createElement('img');
    img.alt = `${messages.imageLabel} ${index + 1}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => {
      if (img.isConnected) status.textContent = messages.loadError;
    });
    img.src = `https://gbe88.uk/P2/${index + 14}.webp`;
    return img;
  });

  grid.replaceChildren(...images);
  grid.hidden = false;
});
