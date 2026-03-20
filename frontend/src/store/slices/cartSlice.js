import { createSlice } from '@reduxjs/toolkit'

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    sellerId: null,
    sellerName: '',
  },
  reducers: {
    addToCart: (state, action) => {
      const { item, seller } = action.payload

      // Enforce single-vendor cart
      if (state.sellerId && state.sellerId !== seller.id) {
        state.items = []
      }

      state.sellerId = seller.id
      state.sellerName = seller.kitchen_name

      const existingIndex = state.items.findIndex(
        (i) => i.id === item.id
      )

      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += 1
      } else {
        state.items.push({ ...item, quantity: 1 })
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload)
      if (state.items.length === 0) {
        state.sellerId = null
        state.sellerName = ''
      }
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload
      const item = state.items.find((i) => i.id === id)
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i.id !== id)
        } else {
          item.quantity = quantity
        }
      }
      if (state.items.length === 0) {
        state.sellerId = null
        state.sellerName = ''
      }
    },
    clearCart: (state) => {
      state.items = []
      state.sellerId = null
      state.sellerName = ''
    },
  },
})

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions

export const selectCartTotal = (state) =>
  state.cart.items.reduce(
    (total, item) => total + (item.discounted_price || item.price) * item.quantity,
    0
  )

export const selectCartItemCount = (state) =>
  state.cart.items.reduce((count, item) => count + item.quantity, 0)

export default cartSlice.reducer
