<template>
  <aside class="layer-panel" :class="{ collapsed: isCollapsed }">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="panel-title" v-show="!isCollapsed">
        <svg viewBox="0 0 16 16" width="16" height="16">
          <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="#4096FF" stroke-width="1.2" />
          <line x1="1" y1="5.5" x2="15" y2="5.5" stroke="#4096FF" stroke-width="0.8" opacity="0.5" />
          <rect x="3" y="2.5" width="3" height="2" rx="0.5" fill="#4096FF" opacity="0.6" />
          <rect x="10" y="8" width="4" height="1.5" rx="0.5" fill="#69b1ff" opacity="0.4" />
          <rect x="3" y="8" width="5" height="1.5" rx="0.5" fill="#69b1ff" opacity="0.4" />
          <rect x="3" y="10.5" width="3" height="1.5" rx="0.5" fill="#69b1ff" opacity="0.3" />
        </svg>
        <span>图层面板</span>
      </div>
      <div class="panel-toggle" @click="isCollapsed = !isCollapsed">
        <svg viewBox="0 0 16 16" width="14" height="14" :style="{ transform: isCollapsed ? 'rotate(180deg)' : '' }">
          <path d="M6 4 L11 8 L6 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
    </div>

    <!-- 树形图层 -->
    <div class="layer-tree-container" v-show="!isCollapsed">
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="treeProps"
        node-key="id"
        default-expand-all
        :expand-on-click-node="true"
        :highlight-current="false"
        show-checkbox
        :default-checked-keys="defaultCheckedKeys"
        :check-strictly="false"
        @check="handleCheck"
      >
        <template #default="{ data }">
          <div class="tree-node">
            <!-- 图标 -->
            <span class="node-icon">
              <!-- 分组 -->
              <svg v-if="data.type === 'group'" viewBox="0 0 14 14" width="14" height="14">
                <path d="M2 2.5h4l1.5 1.5H12a1 1 0 011 1V11a1 1 0 01-1 1H2a1 1 0 01-1-1V3.5a1 1 0 011-1z"
                  fill="none" stroke="#4096FF" stroke-width="1" />
              </svg>
              <!-- 底图 - 矢量 -->
              <svg v-else-if="data.type === 'base' && (data.id === 'osm' || data.id === 'tianditu_vec')" viewBox="0 0 14 14" width="14" height="14">
                <path d="M2 11 L5 4 L8 8 L12 2" fill="none" stroke="#69b1ff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="5" cy="4" r="1.2" fill="#69b1ff" />
                <circle cx="8" cy="8" r="1.2" fill="#69b1ff" />
                <circle cx="12" cy="2" r="1.2" fill="#69b1ff" />
              </svg>
              <!-- 底图 - 影像/卫星 -->
              <svg v-else-if="data.type === 'base'" viewBox="0 0 14 14" width="14" height="14">
                <circle cx="7" cy="7" r="3.5" fill="none" stroke="#ffa940" stroke-width="1" />
                <ellipse cx="7" cy="7" rx="6" ry="2.5" fill="none" stroke="#ffa940" stroke-width="0.7" opacity="0.6" transform="rotate(-30 7 7)" />
                <ellipse cx="7" cy="7" rx="6" ry="2.5" fill="none" stroke="#ffa940" stroke-width="0.7" opacity="0.6" transform="rotate(30 7 7)" />
                <circle cx="7" cy="7" r="1.5" fill="#ffa940" opacity="0.25" />
              </svg>
              <!-- 覆盖层 -->
              <svg v-else-if="data.type === 'overlay'" viewBox="0 0 14 14" width="14" height="14">
                <circle cx="7" cy="7" r="4" fill="none" stroke="#52c41a" stroke-width="1" />
                <circle cx="7" cy="7" r="1.2" fill="#52c41a" opacity="0.6" />
              </svg>
              <!-- 地形 -->
              <svg v-else-if="data.type === 'terrain'" viewBox="0 0 14 14" width="14" height="14">
                <polyline points="1,11 4,7 7,9 10,3 13,6" fill="none" stroke="#ffa940" stroke-width="1"
                  stroke-linejoin="round" />
              </svg>
              <!-- 默认 -->
              <svg v-else viewBox="0 0 14 14" width="14" height="14">
                <rect x="2" y="4" width="10" height="7" rx="1" fill="none" stroke="#8ba6cc" stroke-width="0.8" />
              </svg>
            </span>

            <!-- 标签 -->
            <span class="node-label">{{ data.label }}</span>
          </div>
        </template>
      </el-tree>
    </div>

    <!-- 折叠状态下的图标 -->
    <div class="collapsed-icons" v-show="isCollapsed">
      <div class="collapsed-icon" title="图层面板">
        <svg viewBox="0 0 16 16" width="20" height="20">
          <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="#4096FF" stroke-width="1.2" />
          <line x1="1" y1="5.5" x2="15" y2="5.5" stroke="#4096FF" stroke-width="0.8" opacity="0.5" />
          <rect x="3" y="2.5" width="3" height="2" rx="0.5" fill="#4096FF" opacity="0.6" />
        </svg>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMapStore } from '../stores/mapStore'

const mapStore = useMapStore()
const isCollapsed = ref(false)
const treeRef = ref(null)

const treeProps = {
  children: 'children',
  label: 'label',
  disabled: (data) => data.type === 'group'
}

const treeData = computed(() => mapStore.layerTree)

// 默认勾选的图层（初始 visible 为 true 的图层）
const defaultCheckedKeys = computed(() => {
  const keys = []
  const traverse = (nodes) => {
    for (const node of nodes) {
      if (node.visible && node.type !== 'group') {
        keys.push(node.id)
      }
      if (node.children) traverse(node.children)
    }
  }
  traverse(mapStore.layerTree)
  return keys
})

/**
 * 复选框状态变更事件
 * @param {Object} data - 选中状态变化的数据
 * @param {Object} checkState - { checkedKeys, halfCheckedKeys }
 */
function handleCheck(data, checkState) {
  const { checkedKeys } = checkState

  // 遍历所有图层节点，更新可见性
  const updateVisibility = (nodes) => {
    for (const node of nodes) {
      if (node.type !== 'group') {
        const isChecked = checkedKeys.includes(node.id)
        // 使用 setLayerVisibility 直接设置（不切换）
        mapStore.setLayerVisibility(node.id, isChecked)
      }
      if (node.children) updateVisibility(node.children)
    }
  }
  updateVisibility(mapStore.layerTree)
}
</script>

<style scoped>
.layer-panel {
  width: var(--sidebar-width);
  background: linear-gradient(180deg, var(--bg-panel) 0%, #0a1830 100%);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.25s ease;
  overflow: hidden;
}

.layer-panel.collapsed {
  width: 44px;
}

.panel-header {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid rgba(64, 150, 255, 0.1);
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.panel-toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.panel-toggle:hover {
  background: rgba(64, 150, 255, 0.1);
  color: var(--tech-blue-400);
}

.layer-tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 4px;
}

/* 自定义树节点 */
.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 2px;
}

.node-label {
  flex: 1;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-secondary);
}

/* 折叠图标 */
.collapsed-icons {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  gap: 16px;
}

.collapsed-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.collapsed-icon:hover {
  color: var(--tech-blue-400);
  background: rgba(64, 150, 255, 0.1);
}
</style>

<!-- 全局样式（非 scoped）用于覆盖 el-tree 复选框样式 -->
<style>
/* Element Plus 树形复选框 — 科技蓝主题定制 */
.layer-tree-container .el-checkbox__inner {
  background: rgba(13, 31, 60, 0.6) !important;
  border-color: rgba(64, 150, 255, 0.35) !important;
  width: 15px !important;
  height: 15px !important;
  border-radius: 3px !important;
}

.layer-tree-container .el-checkbox__input.is-checked .el-checkbox__inner {
  background: #4096FF !important;
  border-color: #4096FF !important;
}

.layer-tree-container .el-checkbox__input.is-checked .el-checkbox__inner::after {
  border-color: #fff !important;
}

.layer-tree-container .el-checkbox__input.is-indeterminate .el-checkbox__inner {
  background: #4096FF !important;
  border-color: #4096FF !important;
}

.layer-tree-container .el-checkbox__input.is-indeterminate .el-checkbox__inner::before {
  background: #fff !important;
}

/* 分组节点的复选框隐藏 */
.layer-tree-container .el-tree-node[aria-level="1"] > .el-tree-node__content > .el-checkbox {
  display: none !important;
}

/* 复选框与内容的间距 */
.layer-tree-container .el-tree-node__content {
  gap: 0 !important;
}
</style>
