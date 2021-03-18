/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import {
  CommandRegistry
} from '@lumino/commands';

import {
  each
} from '@lumino/algorithm';

import {
  Widget, Menu, MenuBar
} from '@lumino/widgets';

import {
  DashboardPanel
} from './dashboardpanel';

import {
  DockPanel
} from './dockpanel';

import {
  DockPanelRenderer, ContentWidget
} from './dockpanelrenderer';


import '../style/index.css';


function createMenu(commands: CommandRegistry): Menu {
  let root = new Menu({ commands });
  //root.addItem({ command: 'prism:new-tab' });
  root.addItem({ command: 'prism:lock' });
  //root.addItem({ command: 'prism:publish' });

  return root;
}


function createDashboard(): DockPanel {
  let renderer = new DockPanelRenderer();
  let dock = new DockPanel({
    renderer: renderer,
    spacing: 6
  });
  renderer.dock = dock;
  let w = new ContentWidget();
  w.title.label = 'Test1';
  dock.addWidget(w);
  return dock;
}


function main(): void {

  const commands = new CommandRegistry();

  commands.addCommand('prism:new-tab', {
    label: 'New Tab',
    mnemonic: 0,
    caption: 'Open a new tab',
    execute: () => {
      console.log('New Tab');
    }
  });

  commands.addCommand('prism:lock', {
    label: () => {
      return (main.locked) ? 'Unlock dashboards' : 'Lock dashboards';
    },
    mnemonic: 1,
    caption: 'Lock',
    execute: () => {
      let lock = !main.locked;
      main.locked = lock;
      each(main.widgets, widget => {
        (widget as DockPanel).locked = lock;
      });
    }
  });

  commands.addCommand('prism:publish', {
    label: 'Publish to server',
    mnemonic: 2,
    caption: 'Publish to server',
    execute: () => {
    }
  });

  let menu1 = createMenu(commands);
  menu1.title.label = 'File';
  menu1.title.mnemonic = 0;

  let bar = new MenuBar();
  bar.addMenu(menu1);
  bar.id = 'menubar';

  let main = new DashboardPanel();
  main.id = 'main-widget';

  main.addWidget(createDashboard());

  main.addTabRequested.connect(() => {
    main.addWidget(createDashboard());
  });

  window.onresize = () => { main.update(); };

  Widget.attach(bar, document.body);
  Widget.attach(main, document.body);
}



window.onload = main;
