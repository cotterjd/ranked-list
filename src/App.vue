<template>
  <div>
    <button @click="openMenu = true">Menu</button>
    <h2>{{ chosenList }}</h2>
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
    <div v-show="openMenu" class="center modal">
      <button @click="openMenu = false">Close</button>
      <button class="listBtn" v-for="list in lists" @click="onChooseList(list)">{{list}}</button>
      <input v-model="listName" placeholder="New List Name" />
      <button @click="onAddNewList">Add List</button>
      <button v-if="items.length > 0" @click="exportToCsv">Export CSV</button>
      <input 
        type="file" 
        ref="csvFileInput" 
        accept=".csv" 
        @change="handleFileUpload" 
        style="display: none;"
      />
      <button @click="$refs.csvFileInput.click()">Import CSV</button>
    </div>
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
    openMenu: false,
    chosenList: `Master list`,
    lists: [],
  }),
  watch: {
    items: {
      handler: function (val) {
        storage.add(this.chosenList, this.items);
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
    onAddNewList() {
      storage.add(this.listName, [{ name: ``, number: 0 }]);
      this.lists = storage.keys() || [];
    },
    onChooseList(listName) {
      this.chosenList = listName;
      this.openMenu = false;
      this.populateList();
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
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a CSV file.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvContent = e.target.result;
          const lines = csvContent.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            alert('The CSV file is empty.');
            return;
          }
          
          // Check if first line is header (contains "name" and "number")
          const firstLine = lines[0].toLowerCase();
          const hasHeader = firstLine.includes('name') && firstLine.includes('number');
          const dataLines = hasHeader ? lines.slice(1) : lines;
          
          if (dataLines.length === 0) {
            alert('No data found in the CSV file.');
            return;
          }
          
          // Confirm before replacing current data
          const confirmMessage = `This will replace all ${this.items.length} items in "${this.chosenList}" with ${dataLines.length} items from the CSV. Continue?`;
          if (!confirm(confirmMessage)) {
            return;
          }
          
          // Parse CSV data
          const newItems = [];
          for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i].trim();
            if (!line) continue;
            
            const parsed = this.parseCSVLine(line);
            if (parsed.length >= 2) {
              const name = parsed[0].trim();
              const number = parseFloat(parsed[1]);
              
              if (name && !isNaN(number)) {
                newItems.push({ name, number });
              }
            }
          }
          
          if (newItems.length === 0) {
            alert('No valid data found in the CSV file. Please ensure it has name and number columns.');
            return;
          }
          
          // Replace current items
          this.items = newItems;
          this.visibleItems = [...newItems].sort((a, b) => b.number - a.number);
          
          // Clear file input
          event.target.value = '';
          
          alert(`Successfully imported ${newItems.length} items.`);
          
        } catch (error) {
          alert('Error reading CSV file: ' + error.message);
        }
      };
      
      reader.readAsText(file);
    },
    parseCSVLine(line) {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // End of field
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      
      // Add final field
      result.push(current);
      return result;
    },
    exportToCsv() {
      // Create CSV content with header
      let csvContent = "name,number\n";
      
      // Sort items by number (highest to lowest) for export
      const sortedItems = [...this.items].sort((a, b) => b.number - a.number);
      
      // Add each item to CSV content
      sortedItems.forEach(item => {
        // Escape quotes in name and wrap in quotes if contains comma
        const escapedName = item.name.includes('"') ? item.name.replace(/"/g, '""') : item.name;
        const quotedName = item.name.includes(',') || item.name.includes('"') ? `"${escapedName}"` : escapedName;
        csvContent += `${quotedName},${item.number}\n`;
      });
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${this.chosenList.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ranked_list.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    populateList() {
      this.items = storage.get(this.chosenList) || [];
      this.visibleItems = this.items.sort((a, b) => b.number - a.number);
    }
  },
  mounted() {
    this.populateList();
    this.lists = storage.keys() || [];
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
.listBtn {
  width: 50%;
}
.modal {
  position: absolute;
  top: 0;
  background: white;
  color: black;
  width: 100vw;
  height: 100vh;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
