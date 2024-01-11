export const storage = {
  add: (listName: string, value: any): void => {
    localStorage.setItem(listName, JSON.stringify(value))
  },

  get: (listName: string): any => {
    return JSON.parse(localStorage.getItem(listName) || '[]')
  }
}
