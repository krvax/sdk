/** Reducer to implement mapbox style document.
 */

import { MAP } from '../action-types';

const defaultState = {
  version: 8,
  name: 'default',
  center: [0, 0],
  zoom: 3,
  _sourcesVersion: 0,
  sources: {},
  _layersVersion: 0,
  layers: []
};


/** Add a layer to the state.
 */
function addLayer(state, action) {
  // TODO: Maybe decide on what a "default case" is in
  //       order to support easier dev.
  const new_layer = Object.assign({
    filter: null,
    paint: {}
  }, action.layerDef);

  return Object.assign({}, state, {
    _layersVersion: state._layersVersion + 1,
    layers: state.layers.concat([new_layer]),
  });
}

/** Remove a layer from the state.
 */
function removeLayer(state, action) {
  const new_layers = [];
  for(let i = 0, ii = state.layers.length; i < ii; i++) {
    if(state.layers[i].id !== action.layerId) {
      new_layers.push(state.layers[i]);
    }
  }

  return Object.assign({}, state, {
    _layersVersion: state._layersVersion + 1,
    layers: new_layers
  });
}

/** Update a layer that's in the state already.
 */
function updateLayer(state, action) {
  // action.layer should be a new mix in for the layer.
  const new_layers = [];
  for(let i = 0, ii = state.layers.length; i < ii; i++) {
    // if the id matches, update the layer
    if(state.layers[i].id === action.layerId) {
      new_layers.push(Object.assign({}, state.layers[i], action.layerDef));
    // otherwise leave it the same.
    } else {
      new_layers.push(state.layers[i]);
    }
  }

  return Object.assign({}, state, {
    _layersVersion: state._layersVersion + 1,
    layers: new_layers
  });

}


/** Add a source to the state.
 */
function addSource(state, action) {
  const new_source = {}
  const sourceDef = action.sourceDef.type !== 'raster' ? {data: {}, _dataVersion: 0} : {};
  new_source[action.sourceName] = Object.assign(sourceDef, action.sourceDef);

  const new_sources = Object.assign({}, state.sources, new_source);
  return Object.assign({}, state, {_sourcesVersion: state._sourcesVersion + 1}, {sources: new_sources});
}

/** Remove a source from the state.
 */
function removeSource(state, action) {
  const new_sources = Object.assign({}, state.sources);
  delete new_sources[action.sourceName];
  return Object.assign({}, state, {_sourcesVersion: state._sourcesVersion + 1}, new_sources);
}

/** Add features to a source.
 */
function addFeatures(state, action) {
  const source = state.sources[action.sourceName];
  const data = source.data;

  // placeholder for the new data
  let new_data = null;

  // when there is no data, use the data
  // from the action.
  if(!data || !data.type) {
    // coerce this to a FeatureCollection.
    new_data = {
      type: 'FeatureCollection',
      features: action.features
    };
  } else if (data.type === 'Feature') {
    new_data = {
      type: 'FeatureCollection',
      features: [data].concat(action.features)
    };
  } else if(data.type === 'FeatureCollection') {
    new_data = {
      type: 'FeatureCollection',
      features: data.features.concat(action.features)
    }
  }

  if(new_data !== null) {
    const src_mixin = {};

    // update the individual source.
    src_mixin[action.sourceName] = Object.assign({}, source, {
      _dataVersion: source._dataVersion + 1,
      data: Object.assign({}, source.data, new_data),
    });

    // kick back the new state.
    return Object.assign({}, state, {
      sources: Object.assign({}, state.sources, src_mixin)
    });
  }
  return state;
}

/** Change the visibiilty of a layer given in the action.
 */
function setVisibility(state, action) {
  const updated_layers = [];
  let updated = 0;
  for(const layer of state.layers) {
    if(layer.id === action.layerId) {
      updated_layers.push({
        ...layer,
        layout: {
          ...layer.layout,
          visibility: action.visibility,
        }
      });

      updated = 1;
    } else {
      updated_layers.push(layer);
    }
  }
  return Object.assign({}, state, {
    _layersVersion: state._layersVersion + updated,
    layers: updated_layers
  });
}


/** Main reducer.
 */
export default function MapReducer(state = defaultState, action) {
  switch(action.type) {
    case MAP.SET_VIEW:
      return Object.assign({}, state, action.view);
    case MAP.ADD_LAYER:
      return addLayer(state, action);
    case MAP.REMOVE_LAYER:
      return removeLayer(state, action);
    case MAP.UPDATE_LAYER:
      return updateLayer(state, action);
    case MAP.ADD_SOURCE:
      return addSource(state, action);
    case MAP.REMOVE_SOURCE:
      return removeSource(state, action);
    case MAP.ADD_FEATURES:
      return addFeatures(state, action);
    case MAP.SET_LAYER_VISIBILITY:
      return setVisibility(state, action);
    default:
      return state;
  }
}