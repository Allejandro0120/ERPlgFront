<template>
  <v-card
    variant="outlined"
    class="border rounded-lg bg-white overflow-hidden"
    elevation="0"
  >
    <!-- Header: Title and Top Right Actions (e.g. Filters) -->
    <v-card-text class="d-flex align-center justify-space-between py-4 border-b">
      <div v-if="$slots.title || title" class="text-h6 font-weight-bold text-grey-darken-4">
        <slot name="title">{{ title }}</slot>
      </div>
      
      <div v-if="$slots.actions" class="d-flex align-center">
        <slot name="actions" />
      </div>
    </v-card-text>

    <!-- Table content -->
    <v-table hover class="bg-transparent">
      <thead>
        <tr>
          <th
            v-for="(header, index) in headers"
            :key="index"
            class="text-uppercase text-caption font-weight-bold text-grey-darken-1 py-4"
            :class="[header.align ? `text-${header.align}` : 'text-left', header.class]"
          >
            {{ header.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <slot name="body" :items="items">
          <tr v-for="(item, index) in items" :key="item[itemKey] || index">
            <!-- Allow rendering custom cell via slots or fallback to plain value -->
            <td
              v-for="header in headers"
              :key="header.key"
              class="py-4"
              :class="[header.align ? `text-${header.align}` : 'text-left']"
            >
              <slot
                :name="`item.${header.key}`"
                :item="item"
                :value="item[header.key]"
              >
                {{ item[header.key] }}
              </slot>
            </td>
          </tr>
        </slot>
      </tbody>
    </v-table>

    <!-- Footer: Pagination -->
    <v-card-text class="d-flex align-center justify-space-between py-4 border-t bg-grey-lighten-5">
      <div class="text-body-2 text-grey-darken-1">
        Mostrando {{ paginationInfo }}
      </div>

      <div class="d-flex align-center" v-if="totalPages > 1">
        <v-btn
          variant="outlined"
          color="grey-darken-1"
          size="small"
          class="text-none mr-2 bg-white"
          :disabled="page === 1"
          @click="changePage(page - 1)"
        >
          Anterior
        </v-btn>

        <div class="d-flex ga-1">
          <v-btn
            v-for="p in totalPages"
            :key="p"
            :variant="p === page ? 'flat' : 'outlined'"
            :color="p === page ? 'primary' : 'grey-darken-1'"
            size="small"
            class="min-w-0 px-3 bg-white"
            @click="changePage(p)"
          >
            {{ p }}
          </v-btn>
        </div>

        <v-btn
          variant="outlined"
          color="grey-darken-1"
          size="small"
          class="text-none ml-2 bg-white"
          :disabled="page === totalPages"
          @click="changePage(page + 1)"
        >
          Siguiente
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  headers: {
    type: Array,
    required: true,
    // Formato: [{ title: 'Nombre', key: 'name', align: 'left', class: '' }]
  },
  items: {
    type: Array,
    default: () => [],
  },
  itemKey: {
    type: String,
    default: "id",
  },
  // Paginación
  page: {
    type: Number,
    default: 1,
  },
  itemsPerPage: {
    type: Number,
    default: 10,
  },
  totalItems: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["update:page"]);

const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.itemsPerPage) || 1;
});

const paginationInfo = computed(() => {
  if (props.totalItems === 0) return "0 productos";
  const start = (props.page - 1) * props.itemsPerPage + 1;
  const end = Math.min(props.page * props.itemsPerPage, props.totalItems);
  return `${start}-${end} de ${props.totalItems} registros`;
});

function changePage(newPage) {
  if (newPage >= 1 && newPage <= totalPages.value) {
    emit("update:page", newPage);
  }
}
</script>

<style scoped>
/* Vuetify proporciona las utilidades necesarias en su gran mayoría.
   Añadimos pequeños ajustes en caso de que min-width moleste en botones pequeños. */
.min-w-0 {
  min-width: 0 !important;
}
</style>