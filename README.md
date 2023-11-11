## Dimmer

A browser extension to dim web pages. [Add it to Firefox](https://addons.mozilla.org/en-US/firefox/addon/dimmer-ext/).

![Dimmer Demo](demo.gif)

### Shortcuts

- Toggle Dim (All tabs)
Default: <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>N</kbd> (Linux/Windows), <kbd>⌘</kbd> + <kbd>⌥</kbd> + <kbd>N</kbd> (Mac)
- Toggle Dim (Active tab only)
Default: <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>B</kbd> (Linux/Windows), <kbd>⌘</kbd> + <kbd>⌥</kbd> + <kbd>B</kbd> (Mac)

*Note:* You can change the shortcuts from `about:addons` -> Manage Your Extension -> Manage Extension Shortcuts.

### Settings

There are 2 options:

- All tabs

When this option is selected, the states will be shared between the tabs that is set to 'All tabs'. If you change the state (dim/undim or change the dim level) of one of the tabs, the change will be applied to all tabs that are set to use 'All tabs' option.

- This tab only

When this option is selected, the tab will have its own state and it will not be affected by other tabs' state changes.

#### Changing the settings

- From 'This tab only' to 'All tabs'

The current tab's state will be applied to all of the other tabs that is set to 'All tabs'.

- From 'All tabs' to 'This tab only'

The current tab state will be preserved, but further state changes will not affect the other tabs.

### Default settings

There are 2 options:

- All tabs

New tabs will share the same state with the other tabs that are set to 'All tabs'.

- This tab only

New tabs will have their own state and it will not be shared with the other tabs.

### Changing the default settings

Changing the default settings have no effect on the existing tabs. It only effects the new tabs.

### License

GNU General Public License v3.0 or later.

See [COPYING](COPYING) to see the full text.
