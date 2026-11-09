const dialog = document.querySelector('#password-dialog');
const form = document.querySelector('#password-form');
const input = document.querySelector('#gallery-password');
const error = document.querySelector('#password-error');
const unlock = document.querySelector('#unlock');
const lock = document.querySelector('#lock');
const lockedCopy = document.querySelector('#locked-copy');
const grid = document.querySelector('#restricted-images');
const status = document.querySelector('#load-status');
const bonusSection = document.querySelector('#gallery-bonus');
const bonusGrid = document.querySelector('#bonus-images');
const localizedMessages = {
  en: {
    wrongPasscode: 'That passcode does not match.',
    imageLabel: 'NSFW image',
    outtake: 'Outtake — Who are you?',
    bonus: 'Bonus shot',
    loadError: 'Some images could not be loaded.'
  },
  ja: {
    wrongPasscode: 'パスワードが一致しません。',
    imageLabel: 'NSFW画像',
    outtake: 'Bカット — どちら様？',
    bonus: 'サービスカット',
    loadError: '一部の画像を読み込めませんでした。'
  },
  ko: {
    wrongPasscode: '비밀번호가 일치하지 않아요.',
    imageLabel: '언세이프티 이미지',
    outtake: 'B컷 — 누구세요?',
    bonus: '서비스컷',
    loadError: '일부 이미지를 불러오지 못했어요.'
  }
};
const messages = localizedMessages[document.documentElement.lang] ?? localizedMessages.ko;

// This is a visitor prompt. The encoded passcode is readable from the source.
const passcode = atob('MDMxNmlhbg==');

function createGalleryImage(src, alt) {
  const img = document.createElement('img');
  img.alt = alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', () => {
    if (img.isConnected) status.textContent = messages.loadError;
  });
  img.src = src;
  return img;
}

function createBonusFigure(src, label) {
  const figure = document.createElement('figure');
  const caption = document.createElement('figcaption');
  caption.textContent = label;
  figure.append(createGalleryImage(src, ''), caption);
  return figure;
}

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
  bonusSection.hidden = true;
  bonusGrid.replaceChildren();
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

  const images = Array.from({ length: 9 }, (_, index) => createGalleryImage(
    `https://gbe88.uk/P2/${index + 14}.webp`,
    `${messages.imageLabel} ${index + 1}`
  ));

  grid.replaceChildren(...images);
  grid.hidden = false;

  bonusGrid.replaceChildren(
    createBonusFigure('https://gbe88.uk/3/P2/B1.webp', messages.outtake),
    createBonusFigure('https://gbe88.uk/3/P2/b2.webp', messages.bonus)
  );
  bonusSection.hidden = false;
});
