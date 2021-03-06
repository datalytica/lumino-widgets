/*-----------------------------------------------------------------------------
| Copyright (c) Naveen-Michaud-Agrawal
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import {
  JSONObject
} from '@lumino/coreutils'

import {
  each, toArray
} from '@lumino/algorithm';

import {
  Widget
} from '@lumino/widgets';

import {
  DockPanel
} from './dockpanel';

import {
  DashboardPanel
} from './dashboardpanel';

import {
  DockPanelRenderer
} from './dockpanelrenderer';


/**
 * A type alias for a function to serialize a user widget
 *
 */
export
type SerializeFunc = (widget: Widget) => IWidgetConfiguration;


/**
 * A type alias for a function to deserialize a user widget
 *
 */
export
type DeserializeFunc = (config: IWidgetConfiguration) => Widget;


/**
 * The restorable description of the application
 */
export interface IApplicationArea extends JSONObject {
  /**
   * The type indicator of the serialized application.
   */
  type: 'application';

  /**
   * The version of the serialization.
   */
  version: number;

  /**
   * The widgets in the dashboard area.
   */
  dashboards: Array<IDashboardArea>;
}

/**
 * The restorable description of a dashboard area in the user interface.
 */
export interface IDashboardArea extends JSONObject {
  /**
   * The type indicator of the serialized dashboard area.
   */
  type: 'dashboard';

  /**
   * The title of the dashboard.
   */
  title: string;

  /**
   * The widgets in the dashboard area.
   */
  config: ITabArea | ISplitArea;
}

/**
 * The restorable description of a tab area in the user interface.
 */
export interface ITabArea extends JSONObject {
  /**
   * The type indicator of the serialized tab area.
   */
  type: 'tab-area';

  /**
   * The widgets in the tab area.
   */
  widgets: Array<IWidget>;

  /**
   * The index of the selected tab.
   */
  currentIndex: number;
}

/**
 * The restorable description of a split area in the user interface.
 */
export interface ISplitArea extends JSONObject {
  /**
   * The type indicator of the serialized split area.
   */
  type: 'split-area';

  /**
   * The orientation of the split area.
   */
  orientation: 'horizontal' | 'vertical';

  /**
   * The children in the split area.
   */
  children: Array<ITabArea | ISplitArea>;

  /**
   * The sizes of the children.
   */
  sizes: Array<number>;
}

export interface IWidget extends JSONObject {
  /**
   * The title of the widget.
   */
  title: string;

  /**
   * The configuration of the widget.
   */
  configuration: IWidgetConfiguration;

}

export interface IWidgetConfiguration extends JSONObject {

}

export
function createDashboard(
): DockPanel {
  let renderer = new DockPanelRenderer();
  let dock = new DockPanel({
    renderer: renderer,
    spacing: 6
  });
  renderer.dock = dock;

  return dock;
}

/**
 * Serialize the workspace
 */
export
function serializeDashboard(
  main: DashboardPanel,
  serializer: SerializeFunc
): IApplicationArea {
  return {
    type: 'application',
    version: 1,
    dashboards: main.widgets.map(
      (dock: DockPanel) => {
        let layout = dock.saveLayout();
        let config = serializeArea(layout.main, serializer);

        return {
          type: "dashboard",
          title: dock.title.label,
          config: config
        } as IDashboardArea;
      })
  } as IApplicationArea;
}

/**
 * Deserializes a dashboard configuration
 */
export
function restoreDashboard(
  config: any,
  main: DashboardPanel,
  deserializer: DeserializeFunc
): void {

  // Because this data is saved to a foreign data source, its type safety is
  // not guaranteed when it is retrieved, so exhaustive checks are necessary.
  const type = ((config as any).type as string) || 'unknown';
  if (type !== 'application' && type !== 'tab-area' && type !== 'split-area') {
    console.warn(`Attempted to deserialize unknown type: ${type}`);
    return;
  }

  // Clear current widgets
  each(toArray(main.widgets), (dock: DockPanel) => {
    dock.close();
  });

  const { version, dashboards } = config as IApplicationArea;
  if (version !== 1) {
    console.warn(`Attempted to deserialize unknown version: ${version}`);
    return;
  }

  each(dashboards, (dashboard: IDashboardArea) => {
    const { title, config } = dashboard;
    let dock = createDashboard();
    dock.title.label = title;
    dock.restoreLayout({ main: deserializeArea(config, deserializer) });

    main.addWidget(dock);
  });
}

/**
 * Serialize individual areas within the main area.
 */
export
function serializeArea(
  area: DockPanel.AreaConfig | null,
  serializer: SerializeFunc
): ITabArea | ISplitArea | null {
  if (!area || !area.type) {
    return null;
  }

  if (area.type === 'tab-area') {
    return {
      type: 'tab-area',
      currentIndex: area.currentIndex,
      widgets: area.widgets
        .map((widget: Widget) => {
          let config = serializer(widget);
          return {
            title: widget.title.label,
            configuration: config,
          } as IWidget;
        })//nameProperty.get(widget))
        //.filter((name: string) => !!name)
    } as ITabArea;
  }

  return {
    type: 'split-area',
    orientation: area.orientation,
    sizes: area.sizes,
    children: area.children.map((config: DockPanel.AreaConfig) => serializeArea(config, serializer))
                           .filter((area: ITabArea | ISplitArea | null) => !!area)
  } as ISplitArea;
}

/**
 * Deserialize individual areas within the main area.
 *
 * #### Notes
 * Because this data comes from a potentially unreliable foreign source, it is
 * typed as a `JSONObject`; but the actual expected type is:
 * `ITabArea | ISplitArea`.
 *
 * For fault tolerance, types are manually checked in deserialization.
 */
export
function deserializeArea(
  area: JSONObject,
  deserializer: DeserializeFunc
): DockPanel.AreaConfig | null {
  if (!area) {
    return null;
  }

  // Because this data is saved to a foreign data source, its type safety is
  // not guaranteed when it is retrieved, so exhaustive checks are necessary.
  const type = ((area as any).type as string) || 'unknown';
  if (type === 'unknown' || (type !== 'tab-area' && type !== 'split-area')) {
    console.warn(`Attempted to deserialize unknown type: ${type}`);
    return null;
  }

  if (type === 'tab-area') {
    const { currentIndex, widgets } = area as ITabArea;
    let hydrated: DockPanel.AreaConfig = {
      type: 'tab-area',
      currentIndex: currentIndex || 0,
      widgets:
        (widgets &&
          (widgets
            .map((config: IWidget) => {
            	let w = deserializer(config.configuration);
            	w.title.label = config.title;
              return w;
            }) as Widget[])) ||
        []
    };

    // Make sure the current index is within bounds.
    if (hydrated.currentIndex > hydrated.widgets.length - 1) {
      hydrated.currentIndex = 0;
    }

    return hydrated;
  }

  const { orientation, sizes, children } = area as ISplitArea;
  let hydrated: DockPanel.AreaConfig = {
    type: 'split-area',
    orientation: orientation,
    sizes: sizes || [],
    children:
      (children &&
        (children
          .map(child => deserializeArea(child, deserializer))
          .filter(widget => !!widget) as DockPanel.AreaConfig[])) ||
      []
  };

  return hydrated;
}
