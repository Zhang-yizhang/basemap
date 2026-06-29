import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import layerConfig from '../config/layers.json'

/**
 * 将 layers.json 扁平配置构建为图层树结构
 */
function buildLayerTree(config) {
  const { groups, layers } = config
  return groups.map(group => ({
    id: group.id,
    label: group.label,
    type: 'group',
    expanded: group.expanded,
    children: layers
      .filter(l => l.group === group.id)
      .map(l => ({
        id: l.id,
        label: l.label,
        name: l.name,
        url: l.url,
        type: l.type,
        visible: l.visible
      }))
  }))
}

export const useMapStore = defineStore('map', () => {
  // 图层树（从配置文件构建）
  const layerTree = ref(buildLayerTree(layerConfig))

  // 当前地图模式：'2d' | '3d'
  const mapMode = ref('2d')

  // 底图列表（从配置中提取 base 分组图层）
  const baseMaps = layerConfig.layers
    .filter(l => l.group === 'base')
    .map(l => ({ id: l.id, label: l.label }))

  // 当前活跃底图 — 默认天地图影像
  const activeBaseMap = ref('tianditu_img')

  // 地图中心 [lng, lat] — 默认中国中心
  const mapCenter = ref([104.0, 35.0])

  // 地图缩放级别 — 默认 14（城市级）
  const mapZoom = ref(14)

  // 是否已完成定位（避免重复 fly-to）
  const hasLocated = ref(false)

  // 定位状态
  const locateStatus = ref('idle') // 'idle' | 'locating' | 'success' | 'error'

  // Cesium 相机状态
  const cesiumCamera = ref(null)

  // ==================== Actions ====================

  function toggleMapMode() {
    mapMode.value = mapMode.value === '2d' ? '3d' : '2d'
  }

  function setMapMode(mode) {
    mapMode.value = mode
  }

  function setActiveBaseMap(id) {
    activeBaseMap.value = id
  }

  function setMapCenter(center) {
    mapCenter.value = center
  }

  function setMapZoom(zoom) {
    mapZoom.value = zoom
  }

  function setCesiumCamera(camera) {
    cesiumCamera.value = camera
  }

  /**
   * 获取浏览器定位
   * @returns {Promise<{lng: number, lat: number}>}
   */
  async function getCurrentLocation() {
    locateStatus.value = 'locating'
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        locateStatus.value = 'error'
        reject(new Error('浏览器不支持地理定位'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result = {
            lng: pos.coords.longitude,
            lat: pos.coords.latitude
          }
          mapCenter.value = [result.lng, result.lat]
          mapZoom.value = 14
          hasLocated.value = true
          locateStatus.value = 'success'
          resolve(result)
        },
        (err) => {
          console.warn('定位失败:', err.message)
          locateStatus.value = 'error'
          reject(err)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  // 切换图层可见性
  function toggleLayerVisibility(layerId) {
    const traverse = (nodes) => {
      for (const node of nodes) {
        if (node.id === layerId) {
          node.visible = !node.visible
          return true
        }
        if (node.children && traverse(node.children)) {
          return true
        }
      }
      return false
    }
    traverse(layerTree.value)
  }

  /**
   * 设置图层可见性（直接设置，不切换）
   */
  function setLayerVisibility(layerId, visible) {
    const traverse = (nodes) => {
      for (const node of nodes) {
        if (node.id === layerId) {
          node.visible = visible
          return true
        }
        if (node.children && traverse(node.children)) {
          return true
        }
      }
      return false
    }
    traverse(layerTree.value)
  }

  /**
   * 获取图层可见性
   */
  function getLayerVisibility(layerId) {
    const traverse = (nodes) => {
      for (const node of nodes) {
        if (node.id === layerId) return node.visible
        if (node.children) {
          const result = traverse(node.children)
          if (result !== undefined) return result
        }
      }
      return undefined
    }
    return traverse(layerTree.value)
  }

  return {
    mapMode,
    layerTree,
    baseMaps,
    activeBaseMap,
    mapCenter,
    mapZoom,
    hasLocated,
    locateStatus,
    cesiumCamera,
    toggleMapMode,
    setMapMode,
    setActiveBaseMap,
    setMapCenter,
    setMapZoom,
    setCesiumCamera,
    toggleLayerVisibility,
    setLayerVisibility,
    getLayerVisibility,
    getCurrentLocation
  }
})
