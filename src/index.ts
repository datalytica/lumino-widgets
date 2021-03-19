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
  createDashboard, serializeDashboard, restoreDashboard
} from './serialize'


import '../style/index.css';


function main(): void {

  let commands = new CommandRegistry();

  let main = new DashboardPanel();
  main.id = 'main-widget';

  commands.addCommand('prism:save', {
    label: 'Save Workspace',
    mnemonic: 0,
    execute: () => {
      let config = serializeDashboard(main);

      let blob = new Blob([ JSON.stringify(config, null, 2)], {
        type: 'application/octet-stream'
      });
      let url = URL.createObjectURL(blob);
      let link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'workspace.psx');
      let event = document.createEvent('MouseEvent');
      event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
      link.dispatchEvent(event);
    },
  });

  commands.addCommand('prism:load', {
    label: 'Load Workspace',
    mnemonic: 0,
    execute: () => {

      if (window.Blob) {
        let input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', '.psx');
        input.setAttribute('style', 'display: none;');
        let body = document.getElementsByTagName('body')[0];
        body.appendChild(input);
        input.addEventListener('change', (event: Event) => {
          body.removeChild(input);
          let file = (<HTMLInputElement> event.srcElement).files![0];

          if (file) {
            let f = new FileReader();
            f.addEventListener('load', (event: Event) => {
              let contents = (<FileReader> event.target).result as string;
              let config = JSON.parse(contents);
              restoreDashboard(config, main);
            });
            f.readAsText(file);
          }
        });
        input.click();
      } else {
        alert("The File APIs are not fully supported in this browser");
      }
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
    label: 'Publish',
    mnemonic: 2,
    caption: 'Publish to test server',
    execute: () => {

      let config = serializeDashboard(main);
      let url = 'https://jsonblob.com/api/jsonBlob';

      fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(config, null)
      })
      .then(response => {
        let location = response.headers.get('Location') || '';
        let idx = location.search(url);
        if (idx != -1) {
          let result = location.slice(url.length);
          history.pushState(null, "", document.location.pathname + '#' + result);
        }
      })
      .catch(res => {
        console.log(res);
      });

    }
  });

  let menu = new Menu({ commands });
  menu.addItem({ command: 'prism:save' });
  menu.addItem({ command: 'prism:load' });
  menu.addItem({ command: 'prism:lock' });
  menu.addItem({ command: 'prism:publish' });
  menu.title.label = 'File';
  menu.title.mnemonic = 0;

  let bar = new MenuBar();
  bar.addMenu(menu);
  bar.id = 'menubar';

  main.addTabRequested.connect(() => {
    main.addWidget(createDashboard());
    main.currentIndex = main.widgets.length - 1;
  });

  let loadFromServer = async () => {
    let workbook = window.location.hash.substr(1);
    if (workbook !== '') {
      let url = `https://jsonblob.com/api/jsonBlob/${workbook}`;
      try {
        const response = await fetch(url, /*{ credentials: "include" }*/);
        const config = await response.json();
        restoreDashboard(config, main);
      } catch (error) {
        window.location.hash = '';
        console.error(error);
      };
    }
  }

  let workbook = window.location.hash.substr(1);
  if (workbook !== '') {
    loadFromServer();
  } else {
    main.addWidget(createDashboard());
  }

  Widget.attach(bar, document.body);
  Widget.attach(main, document.body);
  
  window.onresize = () => { main.update(); };
  window.onhashchange = loadFromServer;

}

window.onload = main;
