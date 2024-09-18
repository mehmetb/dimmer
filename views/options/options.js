/**
 * Copyright 2023, 2024 Mehmet Baker
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

const DEFAULT_SETTINGS = {
  dimUndimAllTabsSimultaneously: false,
  defaultDimLevel: 0.7,
};

const radioNameToPermissionMap = {
  'host-permissions': { origins: ['<all_urls>'] },
  'scripting-permission': { permissions: ['scripting'] },
  'tabs-permission': { permissions: ['tabs'] },
  'webrequest-permissions': { permissions: ['webRequest'] },
};

function requestPermission(permissionToRequest) {
  return browser.permissions.request(permissionToRequest);
}

function removePermission(permissionToRemove) {
  return browser.permissions.remove(permissionToRemove);
}

function checkUncheckRadios(radioName, check = false) {
  const selector = `input[name="${radioName}"][value="${check ? 1 : 0}"]`;
  document.querySelector(selector).checked = true;
}

function toggleDimAllTabsButton(check = false) {
  const dimAllTabsButton = document.querySelector('button#dim-all-tabs');
  dimAllTabsButton.setAttribute('aria-pressed', `${!!check}`);
  dimAllTabsButton.closest('li').classList.toggle('checked', check);
}

function updateDimLevelInputValue(value) {
  const input = document.querySelector('input#defaultDimLevel');
  if (!input) return;

  input.value = value;
}

function getSettingsAndUpdateFormData() {
  browser.storage.local.get(DEFAULT_SETTINGS)
    .then((result) => {
      const { dimUndimAllTabsSimultaneously, defaultDimLevel } = result;
      toggleDimAllTabsButton(dimUndimAllTabsSimultaneously);
      updateDimLevelInputValue(defaultDimLevel);
    });
}

function getAllPermissionsAndUpdateFormData() {
  browser.permissions.getAll()
    .then((permissions) => {
      const hostPermission = permissions.origins.includes('<all_urls>');
      const scriptingPermission = permissions.permissions.includes('scripting');
      const tabsPermission = permissions.permissions.includes('tabs');
      const webRequestPermission = permissions.permissions.includes('webRequest');

      checkUncheckRadios('host-permissions', hostPermission);
      checkUncheckRadios('scripting-permission', scriptingPermission);
      checkUncheckRadios('tabs-permission', tabsPermission);
      checkUncheckRadios('webrequest-permissions', webRequestPermission);

      document.querySelectorAll('[data-requires="host-permissions"]').forEach((el) => {
        el.classList.toggle('disabled', !hostPermission);

        if (!hostPermission) {
          el.setAttribute('title', browser.i18n.getMessage('dimAllTabsDisabledTooltip'));
        } else {
          el.removeAttribute('title');
        }
      });
    })
    .catch((error) => {
      console.trace(error);
    });
}

for (const [radioName, permission] of Object.entries(radioNameToPermissionMap)) {
  document.querySelectorAll(`input[name="${radioName}"]`).forEach((radio) => {
    radio.addEventListener('change', async (e) => {
      const permissionToRequest = permission;
      const permissionGranted = e.target.value === '1';
      console.info(`${permissionGranted ? 'Requesting' : 'Removing'} permission`, permissionToRequest);

      if (permissionGranted) {
        requestPermission(permissionToRequest)
          .then((isAdded) => {
            checkUncheckRadios(radioName, isAdded);
          });
      } else {
        removePermission(permissionToRequest)
          .then((isRemoved) => {
            checkUncheckRadios(radioName, !isRemoved);
          });
      }
    });
  });
}

document.querySelector('button#dim-all-tabs').addEventListener('click', (e) => {
  if (e.target.closest('.settings-row').classList.contains('disabled')) return;

  const pressed = e.target.getAttribute('aria-pressed');
  toggleDimAllTabsButton(pressed === 'false');

  const checked = e.target.closest('li').classList.contains('checked');
  browser.storage.local.set({ dimUndimAllTabsSimultaneously: checked });
});

document.querySelector('input#defaultDimLevel').addEventListener('change', (e) => {
  browser.storage.local.set({ defaultDimLevel: e.target.value });
});

getAllPermissionsAndUpdateFormData();
getSettingsAndUpdateFormData();

browser.permissions.onAdded.addListener(getAllPermissionsAndUpdateFormData);
browser.permissions.onRemoved.addListener(getAllPermissionsAndUpdateFormData);
browser.storage.onChanged.addListener(getSettingsAndUpdateFormData);
