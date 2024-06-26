<script setup lang="ts">
import {
  DataTableCell,
  DataTableInput,
  DataTableRow,
} from '@/components/DataTable'
import { useWorkspace } from '@/store/workspace'
import {
  type SecuritySchemeOptionOauth,
  authorizeOauth2,
} from '@/views/Request/libs'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { SecuritySchemeOauth2 } from '@scalar/oas-utils/entities/workspace/security'
import { computed } from 'vue'

const props = defineProps<{
  activeScheme: SecuritySchemeOauth2
  schemeModel: SecuritySchemeOptionOauth
}>()

const { securitySchemeMutators } = useWorkspace()

const activeFlow = computed(
  () => props.activeScheme.flows[props.schemeModel.flowKey],
)

/** Handles updating the mutators as well as displaying */
const scopeModel = computed({
  get: () =>
    activeFlow.value?.selectedScopes.map((scopeName) =>
      scopeOptions.value.find(({ id }) => id === scopeName),
    ),
  set: (opts) =>
    updateScheme(
      `flows.${props.schemeModel.flowKey}.selectedScopes`,
      opts?.flatMap((opt) => (opt?.id ? opt.id : [])),
    ),
})

/** Scope dropdown options */
const scopeOptions = computed(() =>
  Object.entries(activeFlow.value?.scopes ?? {}).map(([key, val]) => ({
    id: key,
    label: [key, val].join(' - '),
  })),
)

type MutatorArgs = Parameters<typeof securitySchemeMutators.edit>
const updateScheme = (path: MutatorArgs[1], value: MutatorArgs[2]) =>
  securitySchemeMutators.edit(props.activeScheme.uid, path, value)

/** Authorize the user using specified flow */
const handleAuthorize = async () => {
  const accessToken = await authorizeOauth2(
    activeFlow.value,
    props.activeScheme,
  )
  if (accessToken)
    updateScheme(`flows.${props.schemeModel.flowKey}.token`, accessToken)
}
</script>

<template>
  <!-- Implicit -->
  <DataTableRow
    v-if="schemeModel.flowKey === 'implicit'"
    class="border-r-transparent">
    <template v-if="!activeFlow?.token">
      <DataTableInput
        :modelValue="activeScheme.clientId"
        placeholder="12345"
        @update:modelValue="(v) => updateScheme('clientId', v)">
        Client ID
      </DataTableInput>

      <DataTableCell class="flex items-center p-0.5">
        <ScalarListbox
          v-model="scopeModel"
          class="font-code text-xxs w-full"
          fullWidth
          multiple
          :options="scopeOptions"
          teleport>
          <ScalarButton
            class="flex gap-1.5 h-auto px-1.5 text-c-2 font-normal"
            fullWidth
            variant="ghost">
            <span>
              Scopes
              {{ activeFlow?.selectedScopes.length }} /
              {{
                Object.keys(activeScheme.flows.implicit?.scopes ?? {}).length
              }}
            </span>
            <ScalarIcon
              icon="ChevronDown"
              size="xs" />
          </ScalarButton>
        </ScalarListbox>
      </DataTableCell>

      <!-- Access Token -->
      <DataTableCell class="flex items-center p-0.5">
        <ScalarButton
          size="sm"
          @click="handleAuthorize">
          Authorize
        </ScalarButton>
      </DataTableCell>
    </template>
    <template v-else>
      <DataTableInput
        :modelValue="activeFlow.token"
        type="password"
        @update:modelValue="
          (v) => updateScheme(`flows.${props.schemeModel.flowKey}.token`, v)
        ">
        Access Token
      </DataTableInput>
      <DataTableCell class="flex items-center p-0.5">
        <ScalarButton
          size="sm"
          variant="ghost"
          @click="updateScheme(`flows.${props.schemeModel.flowKey}.token`, '')">
          Clear
        </ScalarButton>
      </DataTableCell>
    </template>
  </DataTableRow>

  <!-- Password -->
  <DataTableRow
    v-if="schemeModel.flowKey === 'password'"
    class="border-r-transparent">
    <DataTableInput
      :modelValue="activeScheme.clientId"
      placeholder="12345"
      @update:modelValue="(v) => updateScheme('clientId', v)">
      Client ID
    </DataTableInput>
    <DataTableCell class="flex items-center p-0.5">
      <ScalarButton size="sm">Authorize</ScalarButton>
    </DataTableCell>
  </DataTableRow>

  <!-- Client Credentials -->
  <DataTableRow
    v-if="schemeModel.flowKey === 'clientCredentials'"
    class="border-r-transparent">
    <DataTableInput
      :modelValue="activeScheme.clientId"
      placeholder="12345"
      @update:modelValue="(v) => updateScheme('clientId', v)">
      Client ID
    </DataTableInput>
    <DataTableCell class="flex items-center p-0.5">
      <ScalarButton size="sm">Authorize</ScalarButton>
    </DataTableCell>
  </DataTableRow>

  <!-- Authorization Code -->
  <DataTableRow
    v-if="schemeModel.flowKey === 'authorizationCode'"
    class="border-r-transparent">
    <DataTableInput
      :modelValue="activeScheme.clientId"
      placeholder="12345"
      @update:modelValue="(v) => updateScheme('clientId', v)">
      Client ID
    </DataTableInput>
    <DataTableCell class="flex items-center p-0.5">
      <ScalarButton size="sm">Authorize</ScalarButton>
    </DataTableCell>
  </DataTableRow>

  <!-- Open ID Connect -->
  <!-- <DataTableRow -->
  <!--   v-else-if="activeScheme?.type === 'openIdConnect'" -->
  <!--   class="border-r-transparent"> -->
  <!--   <DataTableInput -->
  <!--     v-model="password" -->
  <!--     placeholder="Token"> -->
  <!--     TODO -->
  <!--   </DataTableInput> -->
  <!--   <DataTableCell class="flex items-center"> -->
  <!--     <ScalarButton size="sm"> Authorize </ScalarButton> -->
  <!--   </DataTableCell> -->
  <!-- </DataTableRow> -->
</template>
