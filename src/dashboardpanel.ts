/*-----------------------------------------------------------------------------
| Copyright (c) Naveen-Michaud-Agrawal
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import {
  Platform
} from '@lumino/domutils';

import {
  MessageLoop
} from '@lumino/messaging';

import {
  ISignal, Signal
} from '@lumino/signaling';

import {
  each
} from '@lumino/algorithm';

import {
  BoxLayout,
  StackedPanel,
  Widget
} from '@lumino/widgets';

import {
  DashboardTabBar as TabBar
} from './dashboardtabbar';


/**
 * A widget which presents a set of dashboards
 *
 * For use cases which require more control than is provided by this
 * panel, the `TabBar` widget may be used independently.
 */
export
class DashboardPanel extends Widget {
  /**
   * Construct a new tab panel.
   *
   * @param options - The options for initializing the tab panel.
   */
  constructor(options: DashboardPanel.IOptions = {}) {
    super();
    this.addClass('lm-TabPanel');

    // Create the tab bar and stacked panel.
    this.tabBar = new TabBar<Widget>({
      tabsMovable: true,
    });
    this.tabBar.title.closable = !this._locked;
    this.tabBar.addClass('lm-DashboardPanel');
    this.tabBar.addClass('lm-TabPanel-tabBar');

    this.stackedPanel = new StackedPanel();
    this.stackedPanel.addClass('lm-TabPanel-stackedPanel');

    // Connect the tab bar signal handlers.
    this.tabBar.tabMoved.connect(this._onTabMoved, this);
    this.tabBar.currentChanged.connect(this._onCurrentChanged, this);
    this.tabBar.tabCloseRequested.connect(this._onTabCloseRequested, this);
    this.tabBar.tabAddRequested.connect(this._onTabAddRequested, this);
    this.tabBar.tabActivateRequested.connect(this._onTabActivateRequested, this);

    // Connect the stacked panel signal handlers.
    this.stackedPanel.widgetRemoved.connect(this._onWidgetRemoved, this);

    // Get the data related to the placement.
    this._tabPlacement = options.tabPlacement || 'top';
    let direction = Private.directionFromPlacement(this._tabPlacement);
    let orientation = Private.orientationFromPlacement(this._tabPlacement);

    // Configure the tab bar for the placement.
    this.tabBar.orientation = orientation;
    this.tabBar.dataset['placement'] = this._tabPlacement;

    // Create the box layout.
    let layout = new BoxLayout({ direction, spacing: 0 });

    // Set the stretch factors for the child widgets.
    BoxLayout.setStretch(this.tabBar, 0);
    BoxLayout.setStretch(this.stackedPanel, 1);

    // Add the child widgets to the layout.
    layout.addWidget(this.tabBar);
    layout.addWidget(this.stackedPanel);

    // Install the layout on the tab panel.
    this.layout = layout;
  }

  /**
   * A signal emitted when the current tab is changed.
   *
   * #### Notes
   * This signal is emitted when the currently selected tab is changed
   * either through user or programmatic interaction.
   *
   * Notably, this signal is not emitted when the index of the current
   * tab changes due to tabs being inserted, removed, or moved. It is
   * only emitted when the actual current tab node is changed.
   */
  get currentChanged(): ISignal<this, DashboardPanel.ICurrentChangedArgs> {
    return this._currentChanged;
  }

  /**
   * A signal emitted when the user clicks the add button on the tabbar
   *
   */
  get addTabRequested(): ISignal<this, DashboardPanel.IAddTabRequestedArgs> {
    return this._addTabRequested;
  }

  /**
   * Get the index of the currently selected tab.
   *
   * #### Notes
   * This will be `-1` if no tab is selected.
   */
  get currentIndex(): number {
    return this.tabBar.currentIndex;
  }

  /**
   * Set the index of the currently selected tab.
   *
   * #### Notes
   * If the index is out of range, it will be set to `-1`.
   */
  set currentIndex(value: number) {
    this.tabBar.currentIndex = value;
  }

  /**
   * Get the currently selected widget.
   *
   * #### Notes
   * This will be `null` if there is no selected tab.
   */
  get currentWidget(): Widget | null {
    let title = this.tabBar.currentTitle;
    return title ? title.owner : null;
  }

  /**
   * Set the currently selected widget.
   *
   * #### Notes
   * If the widget is not in the panel, it will be set to `null`.
   */
  set currentWidget(value: Widget | null) {
    this.tabBar.currentTitle = value ? value.title : null;
  }

  /**
   * Get the whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can always be moved programmatically.
   */
  get tabsMovable(): boolean {
    return this.tabBar.tabsMovable;
  }

  /**
   * Set the whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can always be moved programmatically.
   */
  set tabsMovable(value: boolean) {
    this.tabBar.tabsMovable = value;
  }

  /**
   * Get the tab placement for the tab panel.
   *
   * #### Notes
   * This controls the position of the tab bar relative to the content.
   */
  get tabPlacement(): DashboardPanel.TabPlacement {
    return this._tabPlacement;
  }

  /**
   * Set the tab placement for the tab panel.
   *
   * #### Notes
   * This controls the position of the tab bar relative to the content.
   */
  set tabPlacement(value: DashboardPanel.TabPlacement) {
    // Bail if the placement does not change.
    if (this._tabPlacement === value) {
      return;
    }

    // Update the internal value.
    this._tabPlacement = value;

    // Get the values related to the placement.
    let direction = Private.directionFromPlacement(value);
    let orientation = Private.orientationFromPlacement(value);

    // Configure the tab bar for the placement.
    this.tabBar.orientation = orientation;
    this.tabBar.dataset['placement'] = value;

    // Update the layout direction.
    (this.layout as BoxLayout).direction = direction;
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
    this.tabBar.tabsMovable = !value;
    this.tabBar.title.closable = !value;
    each(this.widgets, widget => { 
      widget.title.closable = !value;
    });
  }

  /**
   * The tab bar used by the tab panel.
   *
   * #### Notes
   * Modifying the tab bar directly can lead to undefined behavior.
   */
  readonly tabBar: TabBar<Widget>;

  /**
   * The stacked panel used by the tab panel.
   *
   * #### Notes
   * Modifying the panel directly can lead to undefined behavior.
   */
  readonly stackedPanel: StackedPanel;

  /**
   * A read-only array of the widgets in the panel.
   */
  get widgets(): ReadonlyArray<Widget> {
    return this.stackedPanel.widgets;
  }

  /**
   * Add a widget to the end of the tab panel.
   *
   * @param widget - The widget to add to the tab panel.
   *
   * #### Notes
   * If the widget is already contained in the panel, it will be moved.
   *
   * The widget's `title` is used to populate the tab.
   */
  addWidget(widget: Widget): void {
    this.insertWidget(this.widgets.length, widget);
  }

  /**
   * Insert a widget into the tab panel at a specified index.
   *
   * @param index - The index at which to insert the widget.
   *
   * @param widget - The widget to insert into to the tab panel.
   *
   * #### Notes
   * If the widget is already contained in the panel, it will be moved.
   *
   * The widget's `title` is used to populate the tab.
   */
  insertWidget(index: number, widget: Widget): void {
    if (widget !== this.currentWidget) {
      widget.hide();
    }
    widget.title.closable = !(this._locked);
    this.stackedPanel.insertWidget(index, widget);
    this.tabBar.insertTab(index, widget.title);
  }

  /**
   * Handle the `currentChanged` signal from the tab bar.
   */
  private _onCurrentChanged(sender: TabBar<Widget>, args: TabBar.ICurrentChangedArgs<Widget>): void {
    // Extract the previous and current title from the args.
    let { previousIndex, previousTitle, currentIndex, currentTitle } = args;

    // Extract the widgets from the titles.
    let previousWidget = previousTitle ? previousTitle.owner : null;
    let currentWidget = currentTitle ? currentTitle.owner : null;

    // Hide the previous widget.
    if (previousWidget) {
      previousWidget.hide();
    }

    // Show the current widget.
    if (currentWidget) {
      currentWidget.show();
    }

    // Emit the `currentChanged` signal for the tab panel.
    this._currentChanged.emit({
      previousIndex, previousWidget, currentIndex, currentWidget
    });

    // Flush the message loop on IE and Edge to prevent flicker.
    if (Platform.IS_EDGE || Platform.IS_IE) {
      MessageLoop.flush();
    }
  }

  /**
   * Handle the `tabActivateRequested` signal from the tab bar.
   */
  private _onTabActivateRequested(sender: TabBar<Widget>, args: TabBar.ITabActivateRequestedArgs<Widget>): void {
    args.title.owner.activate();
  }

  /**
   * Handle the `tabCloseRequested` signal from the tab bar.
   */
  private _onTabCloseRequested(sender: TabBar<Widget>, args: TabBar.ITabCloseRequestedArgs<Widget>): void {
    args.title.owner.close();
  }

  /**
   * Handle the `tabAddRequested` signal from the tab bar.
   */
  private _onTabAddRequested(sender: TabBar<Widget>, args: TabBar.ITabAddRequestedArgs): void {
    this._addTabRequested.emit({});
  }

  /**
   * Handle the `tabMoved` signal from the tab bar.
   */
  private _onTabMoved(sender: TabBar<Widget>, args: TabBar.ITabMovedArgs<Widget>): void {
    this.stackedPanel.insertWidget(args.toIndex, args.title.owner);
  }

  /**
   * Handle the `widgetRemoved` signal from the stacked panel.
   */
  private _onWidgetRemoved(sender: StackedPanel, widget: Widget): void {
    this.tabBar.removeTab(widget.title);
  }

  private _locked: boolean = false;
  private _tabPlacement: DashboardPanel.TabPlacement;
  private _currentChanged = new Signal<this, DashboardPanel.ICurrentChangedArgs>(this);
  private _addTabRequested = new Signal<this, DashboardPanel.IAddTabRequestedArgs>(this);
}


/**
 * The namespace for the `DashboardPanel` class statics.
 */
export
namespace DashboardPanel {
  /**
   * A type alias for tab placement in a tab bar.
   */
  export
  type TabPlacement = (
    /**
     * The tabs are placed as a row above the content.
     */
    'top' |

    /**
     * The tabs are placed as a column to the left of the content.
     */
    'left' |

    /**
     * The tabs are placed as a column to the right of the content.
     */
    'right' |

    /**
     * The tabs are placed as a row below the content.
     */
    'bottom'
  );

  /**
   * An options object for initializing a tab panel.
   */
  export
  interface IOptions {
    /**
     * Whether the tabs are movable by the user.
     *
     * The default is `false`.
     */
    tabsMovable?: boolean;

    /**
     * The placement of the tab bar relative to the content.
     *
     * The default is `'top'`.
     */
    tabPlacement?: TabPlacement;

    /**
     * The renderer for the panel's tab bar.
     *
     * The default is a shared renderer instance.
     */
    renderer?: TabBar.IRenderer<Widget>;
  }

  /**
   * The arguments object for the `currentChanged` signal.
   */
  export
  interface ICurrentChangedArgs {
    /**
     * The previously selected index.
     */
    previousIndex: number;

    /**
     * The previously selected widget.
     */
    previousWidget: Widget | null;

    /**
     * The currently selected index.
     */
    currentIndex: number;

    /**
     * The currently selected widget.
     */
    currentWidget: Widget | null;
  }

  /**
   * The arguments object for the `addTabRequested` signal.
   */
  export
  interface IAddTabRequestedArgs {
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Convert a tab placement to tab bar orientation.
   */
  export
  function orientationFromPlacement(plc: DashboardPanel.TabPlacement): TabBar.Orientation {
    return placementToOrientationMap[plc];
  }

  /**
   * Convert a tab placement to a box layout direction.
   */
  export
  function directionFromPlacement(plc: DashboardPanel.TabPlacement): BoxLayout.Direction {
    return placementToDirectionMap[plc];
  }

  /**
   * A mapping of tab placement to tab bar orientation.
   */
  const placementToOrientationMap: { [key: string]: TabBar.Orientation } = {
    'top': 'horizontal',
    'left': 'vertical',
    'right': 'vertical',
    'bottom': 'horizontal'
  };

  /**
   * A mapping of tab placement to box layout direction.
   */
  const placementToDirectionMap: { [key: string]: BoxLayout.Direction } = {
    'top': 'top-to-bottom',
    'left': 'left-to-right',
    'right': 'right-to-left',
    'bottom': 'bottom-to-top'
  };
}
