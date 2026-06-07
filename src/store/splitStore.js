import { create } from 'zustand'

export const useSplitStore = create((set, get) => ({
  items: [],
  people: [],
  assignments: {},
  nextItemId: 1,

  setItems: (items) => {
    const maxId = items.reduce((m, it) => Math.max(m, Number(it.id) || 0), 0)
    set({ items, assignments: {}, nextItemId: maxId + 1 })
  },

  addItem: (partial = {}) =>
    set((s) => {
      const id = s.nextItemId
      const item = { id, name: partial.name || '', price: Number(partial.price) || 0 }
      return { items: [...s.items, item], nextItemId: id + 1 }
    }),

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((it) =>
        it.id === id
          ? {
              ...it,
              ...patch,
              price: patch.price !== undefined ? Number(patch.price) || 0 : it.price,
            }
          : it,
      ),
    })),

  removeItem: (id) =>
    set((s) => {
      const restAssignments = { ...s.assignments }
      delete restAssignments[id]
      return {
        items: s.items.filter((it) => it.id !== id),
        assignments: restAssignments,
      }
    }),

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
