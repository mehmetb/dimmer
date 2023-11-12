/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global browser */

document.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('[data-i18n-message-id]').forEach((el) => {
    const messageArgs = el.dataset.i18nPlaceholder
      ? el.dataset.i18nPlaceholder
      : null;
    el.textContent = browser.i18n.getMessage(el.dataset.i18nMessageId, [
      messageArgs,
    ]);
  });
  document.querySelectorAll('[data-i18n-attribute]').forEach((el) => {
    el.setAttribute(
      el.dataset.i18nAttribute,
      browser.i18n.getMessage(el.dataset.i18nAttributeMessageId),
    );
  });
});
