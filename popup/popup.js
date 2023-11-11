/**
 * Copyright 2020-2023 Mehmet Baker
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

/** @type {HTMLDivElement} */
const page1 = document.querySelector('div.page-1');

/** @type {HTMLDivElement} */
const page2 = document.querySelector('div.page-2');

const undimButton = document.querySelector('button.default');
const dimButton = document.querySelector('button.primary');
const rangeInput = document.querySelector('input[type=range]');

const radioButtonForAllTabs = document.querySelector('#radioAllTabs');
const radioButtonForCurrentTab = document.querySelector('#radioCurrentTab');
const radioDefaultAllTabs = document.querySelector('#radioDefaultAllTabs');
const radioDefaultCurrentTab = document.querySelector('#radioDefaultCurrentTab');

const settingsButton = document.querySelector('div.settings');
const backButton = document.querySelector('div.back');

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
    const { state: { opacity, applySettingsToCurrentTab = false }, defaultSettings } = await sendCommandToActiveTab('query');
    rangeInput.value = opacity;

    if (applySettingsToCurrentTab) {
      radioButtonForCurrentTab.checked = true;
      radioButtonForAllTabs.checked = false;
    } else {
      radioButtonForCurrentTab.checked = false;
      radioButtonForAllTabs.checked = true;
    }

    if (defaultSettings.applyToAllTabs) {
      radioDefaultAllTabs.checked = true;
      radioDefaultCurrentTab.checked = false;
    } else {
      radioDefaultAllTabs.checked = false;
      radioDefaultCurrentTab.checked = true;
    }
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

async function updateSettingsScope({ applyToAllTabs }) {
  if (applyToAllTabs) {
    await sendCommandToActiveTab('apply-settings-to-all-tabs');
    await loadState();
    return;
  }

  await sendCommandToActiveTab('apply-settings-to-current-tab-only');
}

rangeInput.addEventListener('input', onRangeChanged);
dimButton.addEventListener('click', onDimClicked);
undimButton.addEventListener('click', onUndimClicked);

radioButtonForAllTabs.addEventListener('change', () => {
  updateSettingsScope({ applyToAllTabs: true });
});

radioButtonForCurrentTab.addEventListener('change', () => {
  updateSettingsScope({ applyToAllTabs: false });
});

radioDefaultCurrentTab.addEventListener('change', () => {
  sendCommandToActiveTab('update-default-settings', {
    applyToAllTabs: !!radioDefaultAllTabs.checked,
  }).catch(console.trace);
});

radioDefaultAllTabs.addEventListener('change', () => {
  console.info('def all changed', radioDefaultAllTabs.checked);
  sendCommandToActiveTab('update-default-settings', {
    applyToAllTabs: !!radioDefaultAllTabs.checked,
  }).catch(console.trace);
});

settingsButton.addEventListener('click', () => {
  page1.style.display = 'none';
  page2.style.display = 'block';
});

backButton.addEventListener('click', () => {
  page1.style.display = 'block';
  page2.style.display = 'none';
});

loadState();
