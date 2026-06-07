import { create } from 'zustand'

function safeNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export const useSplitStore = create((set, get) => ({
  items: [],
  people: [],
  assignments: {},
  nextItemId: 1,
  tax: 0,
  tip: 0,
  taxMode: 'proportional',
  tipMode: 'proportional',
  groupId: null,
  groupName: null,
  groupMembers: [], // [{ userId, name }]

  startGroupSplit: (groupId, members, groupName) =>
    set({
      groupId,
      groupName: groupName ?? null,
      groupMembers: members,
      items: [],
      people: members.map((m) => m.name),
      assignments: {},
      nextItemId: 1,
      tax: 0,
      tip: 0,
    }),

  clearGroupContext: () => set({ groupId: null, groupName: null, groupMembers: [] }),

  setItems: (items) => {
    const maxId = items.reduce((m, it) => Math.max(m, Number(it.id) || 0), 0)
    set({ items, assignments: {}, nextItemId: maxId + 1 })
  },

  setCharges: ({ tax, tip } = {}) =>
    set({ tax: safeNumber(tax), tip: safeNumber(tip) }),

  setChargeMode: (charge, mode) => {
    if (charge !== 'tax' && charge !== 'tip') return
    if (mode !== 'proportional' && mode !== 'equal') return
    set({ [`${charge}Mode`]: mode })
  },

  addItem: (partial = {}) =>
    set((s) => {
      const id = s.nextItemId
      const item = { id, name: partial.name || '', price: safeNumber(partial.price) }
      return { items: [...s.items, item], nextItemId: id + 1 }
    }),

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((it) =>
        it.id === id
          ? {
              ...it,
              ...patch,
              price: patch.price !== undefined ? safeNumber(patch.price) : it.price,
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
    const { items, people, assignments, tax, tip, taxMode, tipMode } = get()
    const totals = Object.fromEntries(
      people.map((p) => [p, { items: 0, tax: 0, tip: 0, total: 0, lines: [] }]),
    )

    items.forEach((item) => {
      const assigned = assignments[item.id] || []
      if (assigned.length === 0) return
      const split = item.price / assigned.length
      assigned.forEach((p) => {
        totals[p].items += split
        totals[p].lines.push({ name: item.name, amount: split, split: assigned.length > 1 })
      })
    })

    const itemsTotal = people.reduce((s, p) => s + totals[p].items, 0)

    const allocateCharge = (amount, mode) => {
      if (amount <= 0 || people.length === 0) return {}
      // Equal split when explicitly requested, OR when proportional has no base
      // to work with (no items assigned yet, so itemsTotal === 0).
      if (mode === 'equal' || itemsTotal === 0) {
        const each = amount / people.length
        return Object.fromEntries(people.map((p) => [p, each]))
      }
      return Object.fromEntries(
        people.map((p) => [p, (totals[p].items / itemsTotal) * amount]),
      )
    }

    const taxByPerson = allocateCharge(tax, taxMode)
    const tipByPerson = allocateCharge(tip, tipMode)

    people.forEach((p) => {
      totals[p].tax = taxByPerson[p] || 0
      totals[p].tip = tipByPerson[p] || 0
      totals[p].total = totals[p].items + totals[p].tax + totals[p].tip
    })

    return totals
  },

  isFullyAssigned: () => {
    const { items, assignments } = get()
    return items.length > 0 && items.every((item) => (assignments[item.id] || []).length > 0)
  },
}))
