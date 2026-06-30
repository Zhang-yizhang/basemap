<template>
  <div class="drawing-toolbar" @click.stop>
    <!-- 绘制工具按钮组 -->
    <div class="tool-group">
      <button
        v-for="tool in tools"
        :key="tool.type"
        class="tool-btn"
        :class="{ active: activeTool === tool.type }"
        :title="tool.label"
        @click="activateTool(tool.type)"
      >
        <i v-html="tool.icon"></i>
        <span class="tool-label">{{ tool.label }}</span>
      </button>
    </div>

    <!-- 样式编辑面板 -->
    <div class="style-panel" v-if="activeTool">
      <div class="style-divider"></div>

      <div class="style-row">
        <label class="style-label">线色</label>
        <input
          type="color"
          class="color-input"
          v-model="strokeColor"
          @input="applyStyleToAll"
        />
      </div>

      <div class="style-row">
        <label class="style-label">线宽</label>
        <div class="range-wrapper">
          <input
            type="range"
            class="range-input"
            v-model.number="strokeWidth"
            min="1" max="10" step="0.5"
            @input="applyStyleToAll"
          />
          <span class="range-value">{{ strokeWidth }}</span>
        </div>
      </div>

      <div class="style-row" v-if="hasFill">
        <label class="style-label">填充</label>
        <input
          type="color"
          class="color-input"
          v-model="fillColor"
          @input="applyStyleToAll"
        />
      </div>

      <div class="style-row" v-if="hasFill">
        <label class="style-label">透明度</label>
        <div class="range-wrapper">
          <input
            type="range"
            class="range-input"
            v-model.number="fillOpacity"
            min="0" max="1" step="0.05"
            @input="applyStyleToAll"
          />
          <span class="range-value">{{ Math.round(fillOpacity * 100) }}%</span>
        </div>
      </div>

      <div class="style-divider"></div>
    </div>

    <!-- 操作按钮 -->
    <div class="tool-actions">
      <button class="action-btn clear-btn" @click="clearDrawings" title="清除所有绘制">
        <svg viewBox="0 0 14 14" width="14" height="14">
          <path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M11 4v7a1 1 0 01-1 1H4a1 1 0 01-1-1V4"
            fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>清除</span>
      </button>
      <button class="action-btn undo-btn" @click="undoLast" title="撤销上一步">
        <svg viewBox="0 0 14 14" width="14" height="14">
          <path d="M3 5h5a3 3 0 013 3v0a3 3 0 01-3 3H6"
            fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5 3L3 5l2 2"
            fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>撤销</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import Draw from 'ol/interaction/Draw'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Style from 'ol/style/Style'
import Stroke from 'ol/style/Stroke'
import Fill from 'ol/style/Fill'
import CircleStyle from 'ol/style/Circle'
import RegularShape from 'ol/style/RegularShape'
import Polygon from 'ol/geom/Polygon'
import Point from 'ol/geom/Point'

const props = defineProps({
  map: { type: Object, default: null }
})

// ==================== 工具定义 ====================
const tools = [
  {
    type: 'Point',
    label: '点',
    icon: '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="1.2" fill="currentColor"/></svg>'
  },
  {
    type: 'LineString',
    label: '线',
    icon: '<svg viewBox="0 0 20 20" width="20" height="20"><polyline points="3,17 8,8 13,11 17,3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  {
    type: 'Polygon',
    label: '面',
    icon: '<svg viewBox="0 0 20 20" width="20" height="20"><polygon points="10,3 17,8 14,16 6,16 3,8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><polygon points="10,3 17,8 14,16 6,16 3,8" fill="currentColor" opacity="0.15"/></svg>'
  },
  {
    type: 'Rectangle',
    label: '矩形',
    icon: '<svg viewBox="0 0 20 20" width="20" height="20"><rect x="4" y="5" width="12" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="4" y="5" width="12" height="10" rx="1" fill="currentColor" opacity="0.15"/></svg>'
  },
  {
    type: 'Arrow',
    label: '箭头',
    icon: '<svg viewBox="0 0 20 20" width="20" height="20"><line x1="3" y1="17" x2="16" y2="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><polygon points="16,4 12,6 13,10" fill="currentColor"/></svg>'
  },
  {
    type: 'CircleOutline',
    label: '圆圈',
    icon: '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>'
  },
  {
    type: 'CircleFilled',
    label: '画圆',
    icon: '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="6" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="1.3"/></svg>'
  }
]

// ==================== 状态 ====================
const activeTool = ref(null)
const strokeColor = ref('#4096FF')
const strokeWidth = ref(2)
const fillColor = ref('#4096FF')
const fillOpacity = ref(0.15)

// 需要填充的工具类型
const hasFill = computed(() => {
  return ['Polygon', 'Rectangle', 'CircleFilled'].includes(activeTool.value)
})

// ==================== 矢量图层 ====================
let vectorSource = null
let vectorLayer = null
let drawInteraction = null

function initVectorLayer() {
  vectorSource = new VectorSource()
  vectorLayer = new VectorLayer({
    source: vectorSource,
    zIndex: 9999,
    properties: { name: 'drawing-layer' }
  })
  if (props.map) {
    props.map.addLayer(vectorLayer)
  }
}

// ==================== 样式 ====================
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getStyle(featureType) {
  const sc = strokeColor.value
  const sw = strokeWidth.value
  const ft = featureType || activeTool.value

  if (ft === 'Point') {
    return new Style({
      image: new CircleStyle({
        radius: sw * 3,
        fill: new Fill({ color: hexToRgba(sc, 0.3) }),
        stroke: new Stroke({ color: sc, width: sw })
      })
    })
  }

  if (ft === 'Arrow') {
    // 箭头使用自定义样式函数（见 applyArrowStyle）
    return null
  }

  if (ft === 'LineString') {
    return new Style({
      stroke: new Stroke({ color: sc, width: sw, lineCap: 'round', lineJoin: 'round' })
    })
  }

  if (ft === 'CircleOutline') {
    return new Style({
      stroke: new Stroke({ color: sc, width: sw }),
      image: new CircleStyle({
        radius: 0,
        fill: new Fill({ color: 'transparent' })
      })
    })
  }

  if (['Polygon', 'Rectangle', 'CircleFilled'].includes(ft)) {
    const fc = fillColor.value
    const fo = fillOpacity.value
    return new Style({
      stroke: new Stroke({ color: sc, width: sw, lineJoin: 'round' }),
      fill: new Fill({ color: hexToRgba(fc, fo) })
    })
  }

  // 默认线条样式
  return new Style({
    stroke: new Stroke({ color: sc, width: sw, lineCap: 'round', lineJoin: 'round' })
  })
}

function applyStyleToAll() {
  if (!vectorSource) return
  const features = vectorSource.getFeatures()
  features.forEach(f => {
    const type = f.get('drawType') || 'LineString'
    if (type === 'Arrow') {
      applyArrowStyle(f)
    } else {
      const style = getStyle(type)
      if (style) f.setStyle(style)
    }
  })
}

function applyArrowStyle(feature) {
  const sc = strokeColor.value
  const sw = strokeWidth.value
  const geom = feature.getGeometry()
  if (!geom) return

  let coords
  try { coords = geom.getCoordinates() } catch (e) { return }
  if (!coords || coords.length < 2) return

  const last = coords[coords.length - 1]
  const prev = coords[coords.length - 2]
  const angle = Math.atan2(last[1] - prev[1], last[0] - prev[0])
  const arrowSize = sw * 4

  feature.setStyle([
    // 线段样式
    new Style({
      stroke: new Stroke({
        color: sc,
        width: sw,
        lineCap: 'round',
        lineJoin: 'round'
      })
    }),
    // 箭头头部
    new Style({
      geometry: new Point(last),
      image: new RegularShape({
        points: 3,
        radius: arrowSize,
        radius2: 0,
        angle: 0,
        rotation: angle + Math.PI / 2,
        fill: new Fill({ color: sc }),
        stroke: new Stroke({ color: sc, width: 1 })
      })
    })
  ])
}

// ==================== 绘制交互 ====================
function getGeometryFunction() {
  // 矩形的 geometryFunction
  return (coordinates, optGeometry) => {
    if (!optGeometry) {
      optGeometry = new Polygon([])
    }
    const start = coordinates[0]
    const end = coordinates[coordinates.length - 1]
    optGeometry.setCoordinates([[
      [start[0], start[1]],
      [start[0], end[1]],
      [end[0], end[1]],
      [end[0], start[1]],
      [start[0], start[1]]
    ]])
    return optGeometry
  }
}

function activateTool(type) {
  if (activeTool.value === type) {
    // 再次点击取消
    deactivateTool()
    return
  }

  deactivateTool()

  if (!props.map) return

  let geometryType = 'Point'
  let drawOptions = {
    source: vectorSource,
    type: 'Point'
  }

  switch (type) {
    case 'Point':
      geometryType = 'Point'
      drawOptions.type = 'Point'
      break
    case 'LineString':
      geometryType = 'LineString'
      drawOptions.type = 'LineString'
      break
    case 'Polygon':
      geometryType = 'Polygon'
      drawOptions.type = 'Polygon'
      break
    case 'Rectangle':
      geometryType = 'Rectangle'
      drawOptions.type = 'Circle'
      drawOptions.geometryFunction = getGeometryFunction()
      break
    case 'Arrow':
      geometryType = 'LineString'
      drawOptions.type = 'LineString'
      break
    case 'CircleOutline':
      geometryType = 'Circle'
      drawOptions.type = 'Circle'
      break
    case 'CircleFilled':
      geometryType = 'Circle'
      drawOptions.type = 'Circle'
      break
    default:
      return
  }

  // 绘制时的预览样式
  const previewStyle = getStyle(type)
  if (previewStyle) {
    drawOptions.style = previewStyle
  }

  drawInteraction = new Draw(drawOptions)

  drawInteraction.on('drawend', (event) => {
    const feature = event.feature
    // 记录绘制类型以便后续样式更新
    feature.set('drawType', type)

    if (type === 'Arrow') {
      applyArrowStyle(feature)
    } else if (geometryType === 'Circle' || type === 'CircleOutline') {
      // Circle 类型特殊处理：用 CircleStyle 表示
      const style = new Style({
        stroke: new Stroke({
          color: strokeColor.value,
          width: strokeWidth.value
        }),
        image: new CircleStyle({
          radius: 0,
          fill: new Fill({ color: 'transparent' })
        })
      })
      feature.setStyle(style)
    }

    // 保持工具激活，允许多次绘制（双击完成/再次点击切换以取消）
  })

  props.map.addInteraction(drawInteraction)
  activeTool.value = type
}

function deactivateTool() {
  if (drawInteraction && props.map) {
    props.map.removeInteraction(drawInteraction)
    drawInteraction = null
  }
  activeTool.value = null
}

// ==================== 操作 ====================
function clearDrawings() {
  if (vectorSource) {
    vectorSource.clear()
  }
}

function undoLast() {
  if (!vectorSource) return
  const features = vectorSource.getFeatures()
  if (features.length > 0) {
    vectorSource.removeFeature(features[features.length - 1])
  }
}

// ==================== 键盘事件 ====================
function handleKeydown(e) {
  if (e.key === 'Escape') {
    deactivateTool()
  }
}

// ==================== 生命周期 ====================
watch(() => props.map, (newMap) => {
  if (newMap && !vectorLayer) {
    initVectorLayer()
  }
}, { immediate: true })

onMounted(() => {
  if (props.map && !vectorLayer) {
    initVectorLayer()
  }
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  deactivateTool()
  if (vectorLayer && props.map) {
    props.map.removeLayer(vectorLayer)
  }
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.drawing-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: rgba(13, 31, 60, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(64, 150, 255, 0.15);
  border-radius: 10px;
  padding: 6px;
  width: 42px;
  min-width: 42px;
  user-select: none;
  z-index: 20;
}

/* ===== 工具按钮组 ===== */
.tool-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 100%;
  height: auto;
  padding: 6px 2px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(139, 166, 204, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  color: #91caff;
  background: rgba(64, 150, 255, 0.1);
}

.tool-btn.active {
  color: #4096FF;
  background: rgba(64, 150, 255, 0.15);
  box-shadow: inset 0 0 0 1px rgba(64, 150, 255, 0.3);
}

.tool-btn i {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.tool-label {
  font-size: 9px;
  line-height: 1;
  margin-top: 1px;
}

/* ===== 样式编辑面板 ===== */
.style-divider {
  height: 1px;
  background: rgba(64, 150, 255, 0.1);
  margin: 4px 2px;
}

.style-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 2px;
}

.style-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.style-label {
  font-size: 9px;
  color: rgba(139, 166, 204, 0.7);
  text-align: center;
}

.color-input {
  width: 100%;
  height: 22px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  padding: 0;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: 1px solid rgba(64, 150, 255, 0.2);
  border-radius: 4px;
}

.range-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.range-input {
  width: 30px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(64, 150, 255, 0.2);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  transform: rotate(-90deg);
  transform-origin: center center;
  margin: 12px 0;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4096FF;
  cursor: pointer;
  border: 2px solid #e6f0ff;
}

.range-value {
  font-size: 9px;
  color: #4096FF;
  font-weight: 600;
}

/* ===== 操作按钮 ===== */
.tool-actions {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  width: 100%;
  padding: 6px 2px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 9px;
}

.clear-btn {
  color: rgba(255, 122, 105, 0.6);
}

.clear-btn:hover {
  color: #ff7a69;
  background: rgba(255, 122, 105, 0.1);
}

.undo-btn {
  color: rgba(139, 166, 204, 0.6);
}

.undo-btn:hover {
  color: #91caff;
  background: rgba(64, 150, 255, 0.1);
}
</style>
