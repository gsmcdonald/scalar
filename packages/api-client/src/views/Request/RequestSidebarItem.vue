<script setup lang="ts">
import { HttpMethod } from '@/components/HttpMethod'
import { useSidebar } from '@/hooks'
import { useWorkspace } from '@/store/workspace'
import { ScalarIcon } from '@scalar/components'
import {
  Draggable,
  type DraggingItem,
  type HoveredItem,
} from '@scalar/draggable'
import type { Collection } from '@scalar/oas-utils/entities/workspace/collection'
import type { Folder } from '@scalar/oas-utils/entities/workspace/folder'
import type {
  Request,
  RequestExample,
} from '@scalar/oas-utils/entities/workspace/spec'
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import RequestSidebarItemMenu from './RequestSidebarItemMenu.vue'

const props = withDefaults(
  defineProps<{
    /**
     * Toggle dragging on and off
     *
     * @default false
     */
    isDraggable?: boolean
    /**
     * Prevents items from being hovered and dropped into
     *
     * @default false
     */
    isDroppable?: boolean
    /** Both inidicate the level and provide a way to traverse upwards */
    parentUids: string[]
    item: Collection | Folder | Request | RequestExample
  }>(),
  { isDraggable: false, isDroppable: false, isChild: false },
)

defineEmits<{
  onDragEnd: [draggingItem: DraggingItem, hoveredItem: HoveredItem]
}>()

defineSlots<{
  leftIcon(): void
}>()

const {
  activeRequest,
  activeWorkspace,
  folders,
  isReadOnly,
  requests,
  requestExamples,
} = useWorkspace()
const { collapsedSidebarFolders, toggleSidebarFolder } = useSidebar()
const router = useRouter()

const hasChildren = computed(() => 'childUids' in props.item)

const highlightClasses = 'hover:bg-sidebar-active-b indent-padding-left'

/** Due to the nesting, we need a dynamic left offset for hover and active backgrounds */
const leftOffset = computed(() => {
  if (!props.parentUids.length) return '12px'
  else if (isReadOnly.value) return `${(props.parentUids.length - 1) * 12}px`
  else return `${props.parentUids.length * 12}px`
})
const paddingOffset = computed(() => {
  if (!props.parentUids.length) return '0px'
  else if (isReadOnly.value) return `${(props.parentUids.length - 1) * 12}px`
  else return `${props.parentUids.length * 12}px`
})

const handleNavigation = (event: MouseEvent, uid: string) => {
  const requestLink = `/workspace/${activeWorkspace.value.uid}/request/${uid}`

  if (event.metaKey) {
    window.open(requestLink, '_blank')
  } else {
    router.push(requestLink)
  }
}

const getTitle = (item: (typeof props)['item']) => {
  // Collection
  if ('spec' in item) {
    return item.spec.info?.title
  }
  // Request
  else if ('summary' in item) {
    return item.summary || item.path
  }
  // Folder/Example
  else if ('name' in item) {
    return item.name
  }
  return ''
}

/**
 * We either show the method or the parent request method
 */
const method = computed(() => {
  const _request = (
    'requestUid' in props.item ? requests[props.item.requestUid] : props.item
  ) as Request
  return _request.method
})

/**
 * Show folders if they are open,
 * show examples if there are more than one and the request is active
 */
const showChildren = computed(
  () =>
    collapsedSidebarFolders[props.item.uid] ||
    (activeRequest.value?.uid === props.item.uid &&
      (props.item as Request).childUids.length > 1),
)
</script>
<template>
  <div
    class="relative flex flex-row"
    :class="[
      (isReadOnly && parentUids.length > 1) ||
      (!isReadOnly && parentUids.length)
        ? 'before:bg-b-3 before:absolute before:left-[calc(.75rem_+_.5px)] before:top-0 before:z-10 before:h-[calc(100%_+_.5px)] last:before:h-full before:w-px mb-[.5px] last:mb-0 indent-border-line-offset'
        : '',
    ]">
    <Draggable
      :id="item.uid"
      :ceiling="hasChildren ? 0.8 : 0.5"
      class="flex flex-1 flex-col gap-[.5px] text-sm"
      :floor="hasChildren ? 0.2 : 0.5"
      :isDraggable="parentUids.length > 0 && isDraggable"
      :isDroppable="isDroppable"
      :parentIds="parentUids"
      @onDragEnd="(...args) => $emit('onDragEnd', ...args)">
      <!-- Request -->
      <RouterLink
        v-if="'summary' in item || 'requestUid' in item"
        custom
        :to="`/workspace/${activeWorkspace.uid}/request/${item.uid}`">
        <div
          class="group relative flex min-h-8 cursor-pointer flex-row items-start justify-between gap-2 py-1.5 pr-2 rounded editable-sidebar-hover"
          :class="[
            highlightClasses,
            activeRequest?.uid === item.uid
              ? 'bg-sidebar-active-b text-sidebar-active-c transition-none'
              : 'text-sidebar-c-2',
          ]"
          tabindex="0"
          @click="($event) => handleNavigation($event, item.uid)">
          <span
            class="z-10 font-medium w-full editable-sidebar-hover-item pl-2">
            {{ getTitle(item) }}
          </span>
          <div class="relative">
            <RequestSidebarItemMenu
              v-if="!isReadOnly"
              :item="item" />
            <span class="flex">
              &hairsp;
              <HttpMethod
                class="font-bold"
                :method="method" />
            </span>
          </div>
        </div>
      </RouterLink>

      <!-- Collection/Folder -->
      <button
        v-else-if="!isReadOnly || parentUids.length"
        class="hover:bg-b-2 group relative flex w-full flex-row justify-start gap-1.5 rounded p-1.5 z-[1]"
        :class="highlightClasses"
        type="button"
        @click="toggleSidebarFolder(item.uid)">
        <span class="z-10 flex h-fit items-center justify-center max-w-[14px]">
          <slot name="leftIcon">
            <div
              :class="{
                'rotate-90': collapsedSidebarFolders[item.uid],
              }">
              <ScalarIcon
                class="text-c-3 text-sm"
                icon="ChevronRight"
                size="sm" />
            </div>
          </slot>
          &hairsp;
        </span>
        <span class="z-10 font-medium">
          {{ getTitle(item) }}
        </span>
      </button>

      <!-- Children -->
      <div
        v-if="'childUids' in item"
        v-show="showChildren">
        <RequestSidebarItem
          v-for="uid in item.childUids"
          :key="uid"
          :isDraggable="isDraggable"
          :isDroppable="isDroppable"
          :item="folders[uid] || requests[uid] || requestExamples[uid]"
          :parentUids="[...parentUids, item.uid]"
          @onDragEnd="(...args) => $emit('onDragEnd', ...args)" />
      </div>
    </Draggable>
  </div>
</template>

<style>
@import '@scalar/draggable/style.css';
</style>
<style scoped>
.indent-border-line-offset:before {
  left: v-bind(leftOffset);
}
.indent-padding-left {
  padding-left: calc(v-bind(paddingOffset) + 6px);
}
.editable-sidebar-hover:hover .editable-sidebar-hover-item {
  mask-image: linear-gradient(
    to left,
    transparent 0,
    var(--scalar-background-2) 20px
  );
}
</style>
