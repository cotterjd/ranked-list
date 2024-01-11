<template>
  <div>
    <input v-model="keyword" placeholder="New Items" />
  </div>
  <div class="button-container">
    <button @click="search">Search</button>
    <button @click="addItem">Add item</button>
  </div>
  <div v-for="item in visibleItems" class="item" :key="item.name">
    <span @click="bumpDown(item)">-</span>
    <span>{{ item.name }}</span>
    <span>{{ item.number }}</span>
    <span @click="bumpUp(item)">+</span>
  </div>
  <div class="center">{{ version }}</div>
</template>

<script>
import { storage } from './utils'
import packageJson from '../package.json'

export default {
  components: {},
  data: () => ({
    keyword: ``,
    visibleItems: [],
    items: [],
    version: packageJson.version,
  }),
  watch: {
    items: {
      handler: function (val) {
        this.visibleItems = val.sort((a, b) => b.number - a.number);
        storage.add(`readingList`, this.items);
      },
      deep: true,
    },
    keyword: {
      handler: function (val) {
        if (val === ``) {
          this.visibleItems = this.items.sort((a, b) => b.number - a.number);
        }
      },
      deep: true,
    },
  },
  methods: {
    addItem() {
      this.items.push({
        name: this.keyword,
        number: 0,
      });
      this.keyword = ``;
    },
    bumpUp(item) {
      item.number++;
    },
    bumpDown(item) {
      const newNum = item.number - 1;
      if (newNum < 0) {
        const yes = confirm(`Are you sure you want to delete ${item.name}?`);
        if (yes) {
          this.items = this.items.filter((i) => i.name !== item.name);
        }
      }
      item.number = newNum;
    },
    search() {
      this.visibleItems = this.items.filter((i) => i.name.toLowerCase().indexOf(this.keyword.toLowerCase()) !== -1);
    },
  },
  mounted() {
    this.items = storage.get(`readingList`) || [];
    this.visibleItems = this.items.sort((a, b) => b.number - a.number);
  },
};
</script>

<style scoped>
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: calc(100vw - 40px);
  height: 50px;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  padding-left: 20px;
  padding-right: 20px;
}
input {
  width: calc(100vw - 40px);
  height: 50px;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  padding-left: 20px;
  padding-right: 20px;
}
button {
  width: 100%;
  height: 50px;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  padding-left: 20px;
  padding-right: 20px;
}
.button-container {
  display: flex;
}
.center {
  display: flex;
  justify-content: center;
}
</style>
