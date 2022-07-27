import React from 'react';
import DeckGL from '@deck.gl/react';
import {PolygonLayer, TextLayer} from '@deck.gl/layers';
import {HexagonLayer} from '@deck.gl/aggregation-layers';
import {tableFromIPC} from 'apache-arrow';
import {OrthographicView, COORDINATE_SYSTEM} from '@deck.gl/core';

const view = new OrthographicView({id: '2d-scene', controller: true, pitch: 0, bearing: 0});

const MALE_COLOR = [0, 128, 255];
const FEMALE_COLOR = [255, 0, 128];

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  zoom: 20,
  maxZoom: 30,
};

async function requestData(type='readCoordinates', params=null){
  let url = `/api/${type}?`;
  if(params!=null){
    url += `${params}`;
  }
  const result = await fetch(url, {method: 'GET', 'headers': {'Access-Control-Allow-Origin': "*"}});
  const table = tableFromIPC(result);
  return table;
}

async function requestJSON(type='readIP', params=null){
  let url = `/api/${type}?`;
  if(params!=null){
    url += `${params}`;
  }
  return await fetch(url, {method: 'GET', 'headers': {'Access-Control-Allow-Origin': "*"}}).then(res => res.json());
}
const dataChunks = [];

export default class CustomScatter extends React.Component {

  constructor(props){
    super(props);
    this._updateSettings = this._updateSettings.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDrag = this.onDrag.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.deckRef = React.createRef();
    this.clearSelections = this.clearSelections.bind(this);

    this.state = {
      maleColor: MALE_COLOR,
      femaleColor: FEMALE_COLOR,
      mapStyle: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
      data: {},
      layers: [],
      radiusScale: 10,
      dataSize: 0,
      settings:{
        radius: 250,
        boxSelection: false
      },
      boxSelect: {
        rectdata: [{polygon: [], show: true}]
      },
      stats: {
        qcScore:0,
        geneCounts: 0,
        sex: []
      },
      event: 1,
      repeatfn: null
    }
  }

  async resetData(){
    // let numRows = await fetch('/api/dataframe/load?name=2dumap-16M.parquet').then(res => res.json());
    // this.setState({
    //   dataSize: numRows
    // });
    if(this.state.repeatfn && this.state.event >= 11){
      clearInterval(this.state.repeatfn);
    }
    
    const data = await requestData('readCoordinates', `event=${this.state.event}`);
    const ipData =  await requestJSON('readIP');
    this.setState({
      data:{
        positions: data.data[0].children[0].values,
        text: ipData
        // color: color.data[0].children[0].values,
        // index: index.data[0].children[0].values
      },
      // numRows: numRows,
      // stats: stats,
      event: this.state.event + 2
    });


    console.log(this.state);
    
  }

  async componentDidMount(){
    window.deckRef = this.deckRef;
    this.state.repeatfn = setInterval(() => this.resetData(), 1000);
  }

  async clearSelections(){
    this.setState({
      boxSelect: {
        rectdata: [{polygon: [], show: true}]
      }
    });
    await this.resetData();
  }

  _renderLayers() {
    let layers = [];

    if(this.state.data['positions']){
      layers.push(
        new HexagonLayer({
          id: 'HexagonLayer',
          // data: {
          //   length: this.state.data['positions'].length/2,
          //   attributes:{
          //     getPosition: {value: this.state.data['positions'], size:2},
          //   }
          // },
          data: this.state.data.text,
          getPosition: d => [d.ipPosX, d.ipPosY],
          colorRange: [[255, 255, 178], [254, 217, 118], [254, 178, 76], [253, 141, 60], [240, 59, 32], [189, 0, 38]],
          colorScaleType: 'quantize',
          elevationRange: [0, 1],
          elevationScale: 1,
          pickable: true,
          extruded: true,
          radius: 1,
          autoHighlight: true,
          lineWidthUnits: 'pixels',
          coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        })
      );
    }
    if(this.state.data['text']){
      layers.push(
        new TextLayer({
          data: this.state.data.text,
          getColor: [0,0,0],
          getPosition: d => [d.ipPosX, d.ipPosY],
          getText: d => d.ip,
          getSize: 1,
          getColor: [0, 0, 0],
          sizeUnits: 'pixels',
          sizeMaxPixels: 10
        })
      );
    }
    if(this.state.settings.boxSelection){
      layers.push(
        new PolygonLayer({
          id: "box-select-layer",
          filled: true,
          stroked: true,
          getPolygon: d => d.polygon,
          lineWidthUnits: 'pixels',
          getLineWidth: 2,
          getLineColor: [80, 80, 80],
          getLineColor: [0, 0, 0, 150],
          getFillColor: [255, 255, 255, 65],
          data: this.state.boxSelect.rectdata,
          sizeUnits: 'meters',
        })
      )
    }
    return layers;
  }
  
  _onResize() {
    this._updateViewport({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  _updateViewport(viewport) {
    this.setState({
      viewport: {...this.state.viewport, ...viewport}
    });
  }

  _updateSettings(settings) {
    this.setState({
      settings: {...this.state.settings, ...settings},
    });
  }

  onDragStart(info, event){
      console.log(info);
      const {coordinate, x, y}                       = info;
      const [px, py]                     = info.viewport.unproject([x, y]);
      this.setState({
        boxSelect: {
          status: this.state.settings.boxSelection, rectdata: [{polygon: [[px, py], [px, py], [px, py], [px, py]], show: true}],
          startPos: coordinate
        }
      })
    }

  onDrag(info, event) {
      if (this.state.boxSelect.startPos) {
        const {x, y}     = info;
        const [px, py]   = info.viewport.unproject([x, y]);
        const startPoint = this.state.boxSelect.rectdata[0].polygon[0];
        this.setState({
          boxSelect: {
            status: this.state.settings.boxSelection, rectdata:[{polygon: [startPoint, [startPoint[0], py], [px, py], [px, startPoint[1]]], show: true}],
            startPos: this.state.boxSelect.startPos
          }
        });
      };
    };

  async onDragEnd(info, event) {
    if(this.state.settings.boxSelection){
      const {coordinate}     = info;
      const [x,y] = coordinate;
      const sx = this.state.boxSelect.startPos[0];
      const sy = this.state.boxSelect.startPos[1];

      const opts = {
        x_bounds: [Math.min(sx, x),Math.max(sx, x)],
        y_bounds: [Math.min(sy, y),Math.max(sy, y)],
      }

      const numRows = await requestStats('boxSelectnumRows', `&opts=${JSON.stringify(opts)}`);
      const color = await requestData(this.state.numRows, 1, 'boxSelectColor', `&opts=${JSON.stringify(opts)}`);
      const stats = await requestStats('getStatsOnBoxSelect', `&opts=${JSON.stringify(opts)}`);
      this.setState({
        data:{
          ...this.state.data,
          color: color.data[0].children[0].values,
        },
        dataSize: numRows,
        stats: stats
      });
  }
}

  render(){
    const {viewport, settings} = this.state;
    return (
      <div>
      <DeckGL 
        layers={this._renderLayers()}
        ref={this.deckRef}
        initialViewState={INITIAL_VIEW_STATE}
        // controller={{dragPan: !this.state.settings.boxSelection}}
        // onDragStart={this.onDragStart} onDrag={this.onDrag} onDragEnd={this.onDragEnd}
        views={new OrthographicView({id: '2d-scene', controller: true, pitch: 30, bearing: 0})}>
      </DeckGL>
      </div>
      );
  }
  
}
