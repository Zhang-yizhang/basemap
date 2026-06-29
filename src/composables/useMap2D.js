import { ref } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import Projection from 'ol/proj/Projection'
import { addProjection, addCoordinateTransforms, getTransform, fromLonLat, toLonLat } from 'ol/proj'
import { defaults as defaultControls } from 'ol/control'

// ====================== 注册 EPSG:4490 坐标系 (CGCS2000) ======================
// 无需外部 proj4 库，通过坐标变换链实现 EPSG:4490 ↔ EPSG:4326 ↔ EPSG:3857
const cgcs2000 = new Projection({
  code: 'EPSG:4490',
  units: 'degrees',
  axisOrientation: 'enu'
})
addProjection(cgcs2000)

// EPSG:4326 ↔ EPSG:4490：CGCS2000 与 WGS84 在网页地图精度下可视为等价
addCoordinateTransforms(
  'EPSG:4326', 'EPSG:4490',
  (coord) => coord.slice(),
  (coord) => coord.slice()
)

// EPSG:3857 ↔ EPSG:4490：通过 EPSG:4326 中转
const to4326 = getTransform('EPSG:3857', 'EPSG:4326')
const from4326 = getTransform('EPSG:4326', 'EPSG:3857')
addCoordinateTransforms(
  'EPSG:3857', 'EPSG:4490',
  (coord) => to4326(coord),
  (coord) => from4326(coord)
)

// ====================== 天地图 Token ======================
const VITE_TDT_TOKEN = 'fa7ec9766b2c00747e3dd60ab3d05892'

// ====================== 底图源配置 ======================
const BASE_MAP_SOURCES = {
  osm: () => new TileLayer({
    source: new OSM(),
    visible: false
  }),
  tianditu_vec: () => new TileLayer({
    source: new XYZ({
      url: `https://t{0-7}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=${VITE_TDT_TOKEN}`,
      crossOrigin: 'anonymous'
    }),
    visible: false
  }),
  tianditu_img: () => new TileLayer({
    source: new XYZ({
      url: `https://t{0-7}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=${VITE_TDT_TOKEN}`,
      crossOrigin: 'anonymous'
    }),
    visible: true // 默认天地图影像
  }),
  arcgis: () => new TileLayer({
    source: new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: 'anonymous'
    }),
    visible: false
  })
}

export function useMap2D() {
  const mapInstance = ref(null)

  function initMap(target, options = {}) {
    const {
      center = [104.0, 35.0],
      zoom = 14,
      baseMap = 'tianditu_img'
    } = options

    const layers = Object.values(BASE_MAP_SOURCES).map(fn => fn())

    // 视图使用 EPSG:3857 —— 天地图 img_w/vec_w 瓦片均为 Web Mercator 网格
    // 坐标显示通过 toLonLat() 转为经纬度，EPSG:4490≈EPSG:4326 在民用精度下等价
    const map = new Map({
      target,
      layers,
      view: new View({
        center: fromLonLat(center),  // EPSG:4326 → EPSG:3857
        zoom,
        projection: 'EPSG:3857'
      }),
      controls: defaultControls({
        zoom: true,
        rotate: false,
        attribution: true
      })
    })

    // 设置初始底图
    switchBaseMap(map, baseMap)
    mapInstance.value = map

    return map
  }

  function switchBaseMap(map, mapId) {
    const layers = map.getLayers().getArray()
    layers.forEach(layer => {
      const source = layer.getSource()
      if (source) {
        let layerId = 'unknown'
        if (source instanceof OSM) layerId = 'osm'
        else if (source instanceof XYZ) {
          const url = source.getUrls()?.[0] || ''
          if (url.includes('tianditu') && url.includes('vec_w')) layerId = 'tianditu_vec'
          else if (url.includes('tianditu') && url.includes('img_w')) layerId = 'tianditu_img'
          else if (url.includes('arcgisonline')) layerId = 'arcgis'
        }
        layer.setVisible(layerId === mapId)
      }
    })
  }

  /**
   * 按图层ID控制可见性（用于图层面板复选框联动）
   */
  function setLayerVisible(map, layerId, visible) {
    const layers = map.getLayers().getArray()
    layers.forEach(layer => {
      const source = layer.getSource()
      if (source) {
        let currentId = 'unknown'
        if (source instanceof OSM) currentId = 'osm'
        else if (source instanceof XYZ) {
          const url = source.getUrls()?.[0] || ''
          if (url.includes('tianditu') && url.includes('vec_w')) currentId = 'tianditu_vec'
          else if (url.includes('tianditu') && url.includes('img_w')) currentId = 'tianditu_img'
          else if (url.includes('arcgisonline')) currentId = 'arcgis'
        }
        if (currentId === layerId) {
          layer.setVisible(visible)
        }
      }
    })
  }

  function getCenter(map) {
    return toLonLat(map.getView().getCenter())
  }

  function getZoom(map) {
    return map.getView().getZoom()
  }

  function setView(map, center, zoom) {
    map.getView().animate({
      center: fromLonLat(center),
      zoom,
      duration: 500
    })
  }

  /**
   * 飞行动画：平滑飞至目标位置并缩放
   * @param {ol/Map} map
   * @param {[number, number]} center [lng, lat]
   * @param {number} zoom
   * @param {number} duration 动画时长（ms），默认 2000
   */
  function flyToLocation(map, center, zoom, duration = 2000) {
    const view = map.getView()

    // 先缩小到较低级别，制造"起飞"效果
    view.animate({
      zoom: view.getZoom() - 3,
      duration: duration * 0.3
    }, () => {
      // 飞到目标位置并放大
      view.animate({
        center: fromLonLat(center),
        zoom,
        duration: duration * 0.7,
        easing: function (t) {
          // easeOutCubic：平滑减速
          return 1 - Math.pow(1 - t, 3)
        }
      })
    })
  }

  function getExtent(map) {
    const extent = map.getView().calculateExtent(map.getSize())
    const [minLon, minLat] = toLonLat([extent[0], extent[1]])
    const [maxLon, maxLat] = toLonLat([extent[2], extent[3]])
    return { west: minLon, south: minLat, east: maxLon, north: maxLat }
  }

  function destroyMap(map) {
    if (map) {
      map.setTarget(undefined)
      map.dispose()
    }
    mapInstance.value = null
  }

  return {
    mapInstance,
    initMap,
    switchBaseMap,
    setLayerVisible,
    getCenter,
    getZoom,
    setView,
    flyToLocation,
    getExtent,
    destroyMap
  }
}
