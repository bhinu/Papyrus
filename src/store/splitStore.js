import { create } from 'zustand'

const MOCK_ITEMS = [
  { id: 1, name: 'Truffle Fries', price: 11.5 },
  { id: 2, name: 'Spicy Tuna Roll', price: 16.0 },
  { id: 3, name: 'Still Water', price: 5.0 },
  { id: 4, name: 'Matcha Cheesecake', price: 9.75 },
]

export const useSplitStore = create((set, get) => ({
  items: MOCK_ITEMS,
  people: [],
  assignments: {},

  setItems: (items) => set({ items, assignments: {} }),

  addPerson: (name) =>
    set((s) => ({
      people: s.people.includes(name) ? s.people : [...s.people, name],
    })),

  removePerson: (name) =>
    set((s) => ({
      people: s.people.filter((p) => p !== name),
      assignments: Object.fromEntries(
        Object.entries(s.assignments).map(([id, assigned]) => [
          id,
          assigned.filter((p) => p !== name),
        ]),
      ),
    })),

  toggleAssignment: (itemId, person) =>
    set((s) => {
      const current = s.assignments[itemId] || []
      const next = current.includes(person)
        ? current.filter((p) => p !== person)
        : [...current, person]
      return { assignments: { ...s.assignments, [itemId]: next } }
    }),

  toggleSelectAll: (itemId) =>
    set((s) => {
      const allSelected = s.people.every((p) => (s.assignments[itemId] || []).includes(p))
      return {
        assignments: {
          ...s.assignments,
          [itemId]: allSelected ? [] : [...s.people],
        },
      }
    }),

  getTotals: () => {
    const { items, people, assignments } = get()
    const totals = Object.fromEntries(people.map((p) => [p, { total: 0, lines: [] }]))
    items.forEach((item) => {
      const assigned = assignments[item.id] || []
      if (assigned.length === 0) return
      const split = item.price / assigned.length
      assigned.forEach((p) => {
        totals[p].total += split
        totals[p].lines.push({ name: item.name, amount: split, split: assigned.length > 1 })
      })
    })
    return totals
  },

  isFullyAssigned: () => {
    const { items, assignments } = get()
    return items.length > 0 && items.every((item) => (assignments[item.id] || []).length > 0)
  },
}))
