/**
 * Copyright 2020-2021 Mehmet Baker
 *
 * This file is part of dimmer.
 *
 * dimmer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * dimmer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with dimmer. If not, see <https://www.gnu.org/licenses/>.
 */

/* global browser */

const undimButton = document.querySelector('button.default');
const dimButton = document.querySelector('button.primary');
const rangeInput = document.querySelector('input[type=range]');
const checkbox = document.querySelector('input[type=checkbox]');

async function sendCommandToActiveTab(command, data) {
  return browser.runtime.sendMessage({
    command,
    data,
    from: 'popup',
    to: 'background',
  });
}

async function loadState() {
  try {
    const { opacity, overrideGlobalState = false } = await sendCommandToActiveTab('query');
    rangeInput.value = opacity;
    checkbox.checked = overrideGlobalState;
  } catch (ex) {
    console.error(ex.message);
  }
}

function onRangeChanged() {
  sendCommandToActiveTab('set-opacity', { opacity: rangeInput.value });
}

async function onUndimClicked() {
  await sendCommandToActiveTab('undim');
  window.close();
}

async function onDimClicked() {
  await sendCommandToActiveTab('dim');
  window.close();
}

async function onCheckboxChange() {
  if (checkbox.checked) {
    await sendCommandToActiveTab('override-global-state');
    return;
  }

  await sendCommandToActiveTab('remove-state-override');
  await loadState();
}

rangeInput.addEventListener('input', onRangeChanged);
dimButton.addEventListener('click', onDimClicked);
undimButton.addEventListener('click', onUndimClicked);
checkbox.addEventListener('change', onCheckboxChange);

loadState();
