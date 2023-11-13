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

document.querySelectorAll('button.toggle-button').forEach((button) => {
  button.addEventListener('click', (e) => {
    const pressed = e.target.getAttribute('aria-pressed');
    e.target.setAttribute('aria-pressed', pressed === 'true' ? 'false' : 'true');
    e.target.closest('li').classList.toggle('checked');
  });
});
