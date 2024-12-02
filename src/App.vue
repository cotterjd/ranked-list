<template>
  <div @mousedown="startPress" @mouseup="endPress">
    <div>
      <input v-model="keyword" placeholder="New Items" />
    </div>
                
    <div class="button-container">
      <button v-if="visibleItems.length > 1" @click="sort">Sort</button>
      <button v-else @click="addItem">Add item</button>
    </div>
    <div v-for="item in visibleItems" class="item" :key="item.name">
      <span @click="bumpDown(item)">-</span>
      <span @click="openDetails(item)">{{ item.name }}</span>
      <span>{{ item.number }}</span>
      <span @click="bumpUp(item)">+</span>
    </div>
    <div v-show="isShowingDetails" class="details">
      <p v-if="isEditingDetails">
        <textarea v-model="detailsInput"></textarea>
      </p>
      <p v-else>
        <p v-for="detail in getItemDetails(currentItem)?.split(`|`)">{{detail}}</p>
      </p>
      <button @click="manageDetails">{{isEditingDetails ? 'save' : 'edit'}}</button>
      <button @click="onClose">{{isEditingDetails ? 'cancel' : 'close'}}</button>
    </div>
    <br />
    <br />
    <br />
    <div class="center">{{ version }}</div>
  </div>
</template>

<script>
import { storage } from "./utils";
import packageJson from "../package.json";

export default {
  components: {},
  data: () => ({
    keyword: ``,
    visibleItems: [],
    items: [],
    isEditingDetails: false,
    version: packageJson.version,
    isShowingDetails: false,
    currentItem: {},
    detailsInput: ``,
    pressing: false,
  }),
  watch: {
    items: {
      handler: function (val) {
        storage.add(`readingList`, this.items);
      },
      deep: true,
    },
    keyword: {
      handler: function (val) {
        this.visibleItems = this.items.filter((i) => i.name.toLowerCase().indexOf(this.keyword.toLowerCase()) !== -1);
      },
      deep: true,
    },
  },
  methods: {
    startPress() {
      this.pressing = true;
      setTimeout(() => {
        if (this.pressing) {
          console.log(`long press`);
        }
      }, 1000);
    },
    endPress() {
      this.pressing = false;
    },
    addItem() {
      const name=this.keyword
      this.keyword = ``;
      this.items.unshift({
        name,
        number: 0,
      });
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
    manageDetails() {
      if (this.isEditingDetails) {
        // save
        this.currentItem.details = this.detailsInput;
        this.isEditingDetails = false;
        this.showDetails = false;
      } else {
        // edit
        this.detailsInput = this.currentItem.details;
        this.isEditingDetails = true;
      }
    },
    sort() {
      this.visibleItems = this.items.sort((a, b) => b.number - a.number);
    },
    openDetails(item) {
      this.isShowingDetails = !this.isShowingDetails; 
      this.currentItem = item;
    },
    onClose () {
      if (this.isEditingDetails) {
        this.isEditingDetails = false;
        this.detailsInput = ``;
      } else {
        this.isShowingDetails = false;
        this.detailsInput = ``;
      }
    },
    getItemDetails(item) {
      return item.details;
    }
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
  min-height: 50px;
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
.details {
  position: absolute;
  top: 0;
  background: white;
  color: black;
}
</style>
