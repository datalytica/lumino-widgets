
import {
  CommandRegistry
} from '@lumino/commands';

import {
  Widget,
  Menu,
  DockPanel as DockPanel_
} from '@lumino/widgets';

import {
  DockPanel,
  TabBar,
  TabBarRenderer,
} from './dockpanel';


export
class ContentWidget extends Widget {

  static createNode(): HTMLElement {
    let node = document.createElement('div');
    return node;
  }

  constructor() {
    super({ node: ContentWidget.createNode() });
    this.setFlag(Widget.Flag.DisallowLayout);
    this.addClass('content');
    this.title.closable = true;
  }
}



/**
 * Specialized implementation of `IRenderer`.
 */
export
class DockPanelRenderer implements DockPanel_.IRenderer {

  /**
   * Create a new tab bar for use with a dock panel.
   *
   * @returns A new tab bar for a dock panel.
   */
  createTabBar(): TabBar<Widget> {
    let renderer = new TabBarRenderer();
    let bar = new TabBar<Widget>({
      renderer: renderer
    });
    bar.addClass('lm-DockPanel-tabBar');
    bar.tabMaximizeRequested.connect(
    	this._onTabMaximizeRequested,
    	this
    );
    bar.tabCloneRequested.connect(
      this._onTabCloneRequested,
      this
    );
    bar.tabMenuRequested.connect(
    	this._onTabMenuRequested,
    	this
    );
    bar.tabFilterRequested.connect(
      this._onTabFilterRequested,
      this
    );

    renderer.locked = this.dock.locked;
    renderer.maximized = this.dock.maximized;

    bar.tabsMovable = !this.dock.locked && !this.dock.maximized;

    return bar;
  }

  /**
   * Create a new handle node for use with a dock panel.
   *
   * @returns A new handle node for a dock panel.
   */
  createHandle(): HTMLDivElement {
    let handle = document.createElement('div');
    handle.className = 'lm-DockPanel-handle';
    return handle;
  }

  /**
   * Handle the `tabMaximizeRequested` signal from a tab bar.
   */
  private _onTabMaximizeRequested(
    sender: TabBar<Widget>,
    args: DockPanel.ITabMaximizeRequestedArgs<Widget>
  ): void {
    this.dock.maximizeWidget(args.title);
  }

  /**
   * Handle the `tabFilterRequested` signal from a tab bar.
   */
  private _onTabFilterRequested(
    sender: TabBar<Widget>,
    args: DockPanel.ITabFilterRequestedArgs<Widget>
  ): void {
  }

  /**
   * Handle the `tabCloneRequested` signal from a tab bar.
   */
  private _onTabCloneRequested(
    sender: TabBar<Widget>,
    args: DockPanel.ITabCloneRequestedArgs<Widget>
  ): void {
    let widget = new ContentWidget();
    this.dock.addWidget(widget, { mode: 'split-right', ref: args.title.owner });
  }

  /**
   * Handle the `tabConfigureRequested` signal from a tab bar.
   */
  private _onTabMenuRequested(
    sender: TabBar<Widget>,
    args: DockPanel.ITabMenuRequestedArgs<Widget>
  ) : void {
    let commands = new CommandRegistry();
    commands.addCommand('grid', {
      label: 'Grid',
      mnemonic: 0,
      execute: () => {
      },
    });

    commands.addCommand('chart', {
      label: 'Chart',
      mnemonic: 0,
      execute: () => {
      },
    });

    /*commands.addCommand('bar', {
      label: 'Bar Chart',
      mnemonic: 0,
      execute: () => {
      },
    });

    commands.addCommand('scatter', {
      label: 'Scatter Chart',
      mnemonic: 0,
      execute: () => {
      },
    });

    commands.addCommand('pline', {
      label: 'Line Chart',
      mnemonic: 0,
      execute: () => {
      },
    });*/

    let menu = new Menu({ commands });
    menu.addItem({ command: 'grid' });
    menu.addItem({ command: 'chart' });
    /*menu.addItem({ command: 'prism:pivotgrid-bar' });
    menu.addItem({ command: 'prism:pivotgrid-scatter' });
    menu.addItem({ command: 'prism:pivotgrid-line' });*/
    menu.open(args.clientX, args.clientY);
  }

  public dock: DockPanel;
}
