<!--
SPDX-FileCopyrightText: 2024 SAP SE or an SAP affiliate company and Gardener contributors

SPDX-License-Identifier: Apache-2.0
-->

<template>
  <div class="fill-height">
    <g-shoot-editor :identifier="injectionKey">
      <template #modificationWarning>
        By modifying the resource directly you may create an invalid cluster resource.
        If the resource is invalid, you may lose data when switching back to the overview page.
      </template>
      <template #errorMessage>
        <g-message
          v-model:message="errorMessage"
          v-model:detailed-message="detailedErrorMessage"
          color="error"
          class="ma-0"
          tile
        />
      </template>
      <template #toolbarItemsRight>
        <v-btn
          variant="text"
          color="primary"
          text="Create"
          @click.stop="save"
        />
      </template>
    </g-shoot-editor>
    <g-confirm-dialog ref="confirmDialog" />
  </div>
</template>

<script setup>
import {
  ref,
  inject,
  provide,
} from 'vue'
import {
  useRouter,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from 'vue-router'

import { useAppStore } from '@/store/app'

import GShootEditor from '@/components/GShootEditor'
import GConfirmDialog from '@/components/dialogs/GConfirmDialog'
import GMessage from '@/components/GMessage'

import { useShootContext } from '@/composables/useShootContext'
import { useShootEditor } from '@/composables/useShootEditor'

import { errorDetailsFromError } from '@/utils/error'

import get from 'lodash/get'

const injectionKey = 'new-shoot-editor'
const confirmDialog = ref(null)
const errorMessage = ref()
const detailedErrorMessage = ref()
const isShootCreated = ref(false)

const api = inject('api')
const logger = inject('logger')

const router = useRouter()

const appStore = useAppStore()

const {
  shootNamespace,
  shootManifest,
  setShootManifest,
  isShootDirty,
} = useShootContext()

const useProvide = (key, value) => {
  provide(key, value)
  return value
}
const {
  getEditorValue,
  focusEditor,
  clean,
} = useProvide(injectionKey, useShootEditor(shootManifest))

function confirmEditorNavigation () {
  return confirmDialog.value?.waitForConfirmation({
    confirmButtonText: 'Leave',
    captionText: 'Leave Create Cluster Page?',
    messageHtml: 'Your cluster has not been created.<br/>Do you want to cancel cluster creation and discard your changes?',
  })
}

async function save () {
  try {
    const data = getEditorValue()
    const namespace = shootNamespace.value
    const name = get(data, ['metadata', 'name'])
    await api.createShoot({ namespace, data })
    appStore.setSuccess('Cluster created')
    isShootCreated.value = true
    router.push({
      name: 'ShootItem',
      params: {
        namespace,
        name,
      },
    })
  } catch (err) {
    errorMessage.value = 'Failed to create cluster.'
    if (err.response) {
      const errorDetails = errorDetailsFromError(err)
      detailedErrorMessage.value = errorDetails.detailedMessage
    } else {
      detailedErrorMessage.value = err.message
    }
    logger.error(errorMessage.value, detailedErrorMessage.value, err)
  }
}

onBeforeRouteLeave(async (to, from, next) => {
  if (to.name === 'NewShoot') {
    try {
      setShootManifest(getEditorValue())
      return next()
    } catch (err) {
      errorMessage.value = err.message
      return next(false)
    }
  }
  if (isShootCreated.value) {
    return next()
  }
  if (!clean.value || isShootDirty.value) {
    if (!await confirmEditorNavigation()) {
      focusEditor()
      return next(false)
    }
  }
  return next()
})

onBeforeRouteUpdate(async (to, from, next) => {
  if (!clean.value || isShootDirty.value) {
    if (!await confirmEditorNavigation()) {
      focusEditor()
      return next(false)
    }
  }
  return next()
})
</script>
