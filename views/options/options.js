/**
 * Copyright 2023 Mehmet Baker
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

const radioNameToPermissionMap = {
  'host-permissions': { origins: ['<all_urls>'] },
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

function getAllPermissionsAndUpdateFormData() {
  browser.permissions.getAll()
    .then((permissions) => {
      const hostPermission = permissions.origins.includes('<all_urls>');
      const tabsPermission = permissions.permissions.includes('tabs');
      const webRequestPermission = permissions.permissions.includes('webRequest');

      checkUncheckRadios('host-permissions', hostPermission);
      checkUncheckRadios('tabs-permission', tabsPermission);
      checkUncheckRadios('webrequest-permissions', webRequestPermission);
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

document.querySelectorAll('button.toggle-button').forEach((button) => {
  button.addEventListener('click', (e) => {
    const pressed = e.target.getAttribute('aria-pressed');
    e.target.setAttribute('aria-pressed', pressed === 'true' ? 'false' : 'true');
    e.target.closest('li').classList.toggle('checked');
  });
});

getAllPermissionsAndUpdateFormData();

browser.permissions.onAdded.addListener(getAllPermissionsAndUpdateFormData);
browser.permissions.onRemoved.addListener(getAllPermissionsAndUpdateFormData);
