/*-----------------------------------------------------------------------------
| Copyright (c) Naveen-Michaud-Agrawal
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import {
  Message
} from '@lumino/messaging';

import {
  VirtualElement, h
} from '@lumino/virtualdom';

import {
  MimeData
} from '@lumino/coreutils';

import {
  Drag
} from '@lumino/dragdrop';

import {
  ISignal, Signal
} from '@lumino/signaling';

import {
  ArrayExt, each, toArray
} from '@lumino/algorithm';

import {
  ElementExt
} from '@lumino/domutils';

import {
  DockPanel as DockPanel_,
  DockLayout,
  TabBar,
  Widget,
  Title,
} from '@lumino/widgets';


export
class TabBarRenderer extends TabBar.Renderer {

    /**
     * A selector which matches the maximize icon node in a tab.
     */
    readonly maximizeIconSelector = '.lm-TabBar-tabMaximizeIcon';

    /**
     * A selector which matches the clone icon node in a tab.
     */
    readonly cloneIconSelector = '.lm-TabBar-tabCloneIcon';

    /**
     * A selector which matches the clone icon node in a tab.
     */
    readonly filterIconSelector = '.lm-TabBar-tabFilterIcon';

    /**
     * A selector which matches the menu icon node in a tab.
     */
    readonly menuIconSelector = '.lm-TabBar-tabMenuIcon';

    /**
     * A selector which matches the label in a tab.
     */
    readonly labelSelector = '.lm-TabBar-tabLabel';

    /**
     * Render tabs with the default DOM structure, but additionally register a context
     * menu listener.
     */
    renderTab(data: TabBar.IRenderData<any>): VirtualElement {
      let title = data.title.caption;
      let key = this.createTabKey(data);
      let id = key;
      let style = this.createTabStyle(data);
      let className = this.createTabClass(data);
      let dataset = this.createTabDataset(data);
      let aria = this.createTabARIA(data);

      let attrs = { id, key, className, title, style, dataset, ...aria };
      if (!this.locked) {
        if (this.maximized) {
          return h.li(attrs,
            this.renderMenuIcon(data),
            this.renderFilterIcon(data),
            this.renderSpacer(data),
            //this.renderIcon(data),
            this.renderLabel(data),
            this.renderSpacer(data),
            this.renderMaximizeIcon(data),
          );
        } else {
          return h.li(attrs,
            this.renderMenuIcon(data),
            this.renderCloneIcon(data),
            this.renderFilterIcon(data),
            this.renderSpacer(data),
            //this.renderIcon(data),
            this.renderLabel(data),
            this.renderSpacer(data),
            this.renderMaximizeIcon(data),
            this.renderCloseIcon(data)
          );
        }
      } else {
        return h.li(attrs,
            this.renderMenuIcon(data),
            this.renderMaximizeIcon(data),
            this.renderFilterIcon(data),
            this.renderSpacer(data),
            //this.renderIcon(data),
            this.renderLabel(data),
            this.renderSpacer(data),
            this.renderMaximizeIcon(data),
          );
      }
    }

    /**
     * Create the class name for the tab.
     *
     * @param data - The data to use for the tab.
     *
     * @returns The full class name for the tab.
     */
    createTabClass(data: TabBar.IRenderData<any>): string {
      let name = 'lm-TabBar-tab';
      if (data.title.className) {
        name += ` ${data.title.className}`;
      }
      if (!this.locked) {
        name += ' lm-mod-closable';
      }
      if (data.current) {
        name += ' lm-mod-current';
      }
      return name;
    }

    /**
     * Render a spacer element
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual element representing the spacer.
     */
    renderSpacer(data: TabBar.IRenderData<any>): VirtualElement {
      return h.div({ className: 'lm-TabBar-tabSpacer' });
    }


    /**
     * Render the label element for a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual element representing the tab label.
     */
    renderLabel(data: TabBar.IRenderData<any>): VirtualElement {
      let unset = (this.locked || data.title.label !== '');
      let content = unset ? data.title.label : 'Double-click to edit title';
      let className = 'lm-TabBar-tabLabel' + (unset ? '' : ' unset');
      return h.div({ className: className }, content);
    }

    /**
     * Render the maximize icon element for a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual element representing the tab maximize icon.
     */
    renderMaximizeIcon(data: TabBar.IRenderData<any>): VirtualElement {
      let name = 'lm-TabBar-tabMaximizeIcon';
      let content: string;
      let title: string;

      content = (this.maximized) ? 'fullscreen_exit' : 'fullscreen';
      title = (this.maximized) ? 'Minimize Worksheet' : 'Maximize Worksheet';

      /*if (this.locked) {
        content = (this.maximized) ? 'fullscreen_exit' : 'fullscreen';
        title = (this.maximized) ? 'Minimize Worksheet' : 'Maximize Worksheet';
      } else {
        content = (this.maximized) ? 'keyboard_return' : 'settings';
        title = (this.maximized) ? 'Go Back' : 'Configure Worksheet';
      }*/

      return h.div({ className: name, title: title}, content);
    }

    /**
     * Render the menu icon element for a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual element representing the tab menu icon.
     */
    renderMenuIcon(data: TabBar.IRenderData<any>): VirtualElement {
      return h.div({ className: 'lm-TabBar-tabMenuIcon', title: 'Change Visual' }, 'menu');
    }

    /**
     * Render the clone icon element for a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual element representing the tab clone icon.
     */
    renderFilterIcon(data: TabBar.IRenderData<any>): VirtualElement {
      return h.div({ className: 'lm-TabBar-tabFilterIcon', title: 'Show Quick Filters' }, 'filter_list');
    }

    /**
     * Render the clone icon element for a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual element representing the tab clone icon.
     */
    renderCloneIcon(data: TabBar.IRenderData<any>): VirtualElement {
      return h.div({ className: 'lm-TabBar-tabCloneIcon', title: 'Clone Worksheet' }, 'file_copy');
    }

    /**
     * Render the close icon element for a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual element representing the tab close icon.
     */
    renderCloseIcon(data: TabBar.IRenderData<any>): VirtualElement {
      return h.div({ className: 'lm-TabBar-tabCloseIcon', title: 'Remove Worksheet' }, 'close');
    }

    maximized: boolean = false;
    locked: boolean = false;
}


export
class TabBarCustom<T> extends TabBar<T> {

  /**
   * A signal emitted when a tab maximize icon is clicked.
   *
   */
  get tabMaximizeRequested(): ISignal<this, DockPanel.ITabMaximizeRequestedArgs<T>> {
    return this._tabMaximizeRequested;
  }
  
  private _tabMaximizeRequested = new Signal<this, DockPanel.ITabMaximizeRequestedArgs<T>>(this);

  /**
   * A signal emitted when a tab clone icon is clicked.
   *
   */
  get tabCloneRequested(): ISignal<this, DockPanel.ITabCloneRequestedArgs<T>> {
    return this._tabCloneRequested;
  }

  private _tabCloneRequested = new Signal<this, DockPanel.ITabCloneRequestedArgs<T>>(this);

  /**
   * A signal emitted when a tab clone icon is clicked.
   *
   */
  get tabFilterRequested(): ISignal<this, DockPanel.ITabFilterRequestedArgs<T>> {
    return this._tabFilterRequested;
  }

  private _tabFilterRequested = new Signal<this, DockPanel.ITabFilterRequestedArgs<T>>(this);

  /**
   * A signal emitted when a tab menu icon is clicked.
   *
   */
  get tabMenuRequested(): ISignal<this, DockPanel.ITabMenuRequestedArgs<T>> {
    return this._tabMenuRequested;
  }

  private _tabMenuRequested = new Signal<this, DockPanel.ITabMenuRequestedArgs<T>>(this);

  /**
   * Handle the DOM events for the tab bar.
   *
   * @param event - The DOM event sent to the tab bar.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the tab bar's DOM node.
   *
   * This should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    // Lookup the tab nodes.
    let tabs = this.contentNode.children;

    switch (event.type) {
      case 'mouseup': {
        let ev = event as MouseEvent;

        // Note this is broken, since it only checks on mouse up so you could
        // click outside the button and release inside and it would fire

        // Find the index of the released tab.
        let index = ArrayExt.findFirstIndex(tabs, tab => {
          return ElementExt.hitTest(tab, ev.clientX, ev.clientY);
        });

        if (index !== -1) {
          let title = this.titles[index];

          let icon = tabs[index].querySelector((this.renderer as TabBarRenderer).maximizeIconSelector);
          if (icon && icon.contains(ev.target as HTMLElement)) {
            this._tabMaximizeRequested.emit({ index, title });
          }

          icon = tabs[index].querySelector((this.renderer as TabBarRenderer).cloneIconSelector);
          if (icon && icon.contains(ev.target as HTMLElement)) {
            this._tabCloneRequested.emit({ index, title });
          }

          icon = tabs[index].querySelector((this.renderer as TabBarRenderer).filterIconSelector);
          if (icon && icon.contains(ev.target as HTMLElement)) {
            this._tabFilterRequested.emit({ index, title });
          }

          icon = tabs[index].querySelector((this.renderer as TabBarRenderer).menuIconSelector);
          if (icon && icon.contains(ev.target as HTMLElement)) {
            let er = (ev.target as HTMLElement).getBoundingClientRect();
            let clientX = er.left;
            let clientY = er.bottom;
            this._tabMenuRequested.emit({ index, title, clientX, clientY });
          }          
        }

      }
    }
    super.handleEvent(event);
  }
}


export
class DockPanel extends DockPanel_ {

  maximizeWidget(title: Title<Widget>) {
    this._maximized = !this._maximized;
    if (this._maximized) {
      this._minimizedLayout = this.saveLayout();

      this.restoreLayout({
        main: {
          type: 'tab-area',
          widgets: [title.owner],
          currentIndex: 0
        }
      });
    } else {
      this.restoreLayout(this._minimizedLayout as DockPanel_.ILayoutConfig);
      this._minimizedLayout = null;
    }
  }

  /**
   * Get the maximized state for the dock panel.
   */
  get maximized(): boolean {
    return this._maximized;
  }

  /**
   * Get the locked state for the dock panel.
   */
  get locked(): boolean {
    return this._locked;
  }

  /**
   * Set the locked state for the dock panel.
   *
   */
  set locked(value: boolean) {
    // Bail early if the locked state does not change.
    if (this._locked === value) {
      return;
    }
    this._locked = value;
    each(this.tabBars(), tabBar => 
      { 
        tabBar.tabsMovable = !value;
        (tabBar.renderer as TabBarRenderer).locked = value;
        each(tabBar.titles, title => { title.closable = !value;});
      });
  }

  /**
   * Initiate a drag of a new widget.
   *
   */
  dragNewDockWidget(factory: () => Widget): void {
    // Setup the mime data for the drag operation.
    let mimeData = new MimeData();
    mimeData.setData('application/vnd.lumino.widget-factory', factory);

    // Create the drag image for the drag operation.
    let dragImage = document.createElement('div');
    dragImage.className = 'lm-TabBar-tab lm-mod-drag-image'; 

    // Create the drag object to manage the drag-drop operation.
    let drag = new Drag({
      dragImage: dragImage,
      mimeData: mimeData,
      proposedAction: 'move',
      supportedActions: 'move',
    });

    // Create the cleanup callback.
    let cleanup = (() => {
      //drag = null;
    });

    let clientX = 0;
    let clientY = 0;

    // Start the drag operation and cleanup when done.
    drag.start(clientX, clientY).then(cleanup);
  }

  unMaximize(): void {
    if (this._maximized) {
      this._maximized = false;
      this.restoreLayout(this._minimizedLayout as DockPanel_.ILayoutConfig);
      this._minimizedLayout = null;
    }
  }

  closeAll(): void {
    each(toArray(this.widgets()), 
      (w: Widget) => { w.close(); });
  }

  /**
   * Handle `'close-request'` messages.
   */
  protected onCloseRequest(msg: Message): void {
    this.closeAll();

    super.onCloseRequest(msg);
    this.dispose();
  }

  private _locked: boolean = false;
  private _maximized: boolean = false;
  private _minimizedLayout: DockPanel_.ILayoutConfig | null = null;
}


/**
 * The namespace for the `DockPanel` class statics.
 */
export
namespace DockPanel {

  export type AreaConfig = DockLayout.AreaConfig;

  /**
   * The arguments object for the `tabMenuRequested` signal.
   */
  export
  interface ITabMenuRequestedArgs<T> {
    /**
     * The index of the tab to configure.
     */
    readonly index: number;

    /**
     * The title for the tab.
     */
    readonly title: Title<T>;

    /**
     * The current client X position of the mouse.
     */
    readonly clientX: number;

    /**
     * The current client Y position of the mouse.
     */
    readonly clientY: number;
  };

  /**
   * The arguments object for the `tabMaximizeRequested` signal.
   */
  export
  interface ITabMaximizeRequestedArgs<T> {
    /**
     * The index of the tab to maximize.
     */
    readonly index: number;

    /**
     * The title for the tab.
     */
    readonly title: Title<T>;
  };

  /**
   * The arguments object for the `tabCloneeRequested` signal.
   */
  export
  interface ITabCloneRequestedArgs<T> {
    /**
     * The index of the tab to configure.
     */
    readonly index: number;

    /**
     * The title for the tab.
     */
    readonly title: Title<T>;
  };

  /**
   * The arguments object for the `tabFilterRequested` signal.
   */
  export
  interface ITabFilterRequestedArgs<T> {
    /**
     * The index of the tab to configure.
     */
    readonly index: number;

    /**
     * The title for the tab.
     */
    readonly title: Title<T>;
  };
}
