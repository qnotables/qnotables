"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from "react"

export interface CartItem {
  productId: string
  variantId?: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clear: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("shop_cart")
    if (saved) {
      try {
        setItems(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load cart:", e)
      }
    }
    setMounted(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("shop_cart", JSON.stringify(items))
    }
  }, [items, mounted])

  const addItem = (newItem: CartItem) => {
    setItems((prevItems) => {
      const existing = prevItems.find(
        (item) => item.productId === newItem.productId && item.variantId === newItem.variantId,
      )

      if (existing) {
        return prevItems.map((item) =>
          item.productId === newItem.productId && item.variantId === newItem.variantId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item,
        )
      }

      return [...prevItems, newItem]
    })
  }

  const removeItem = (productId: string, variantId?: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => !(item.productId === productId && item.variantId === variantId)),
    )
  }

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId)
      return
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.productId === productId && item.variantId === variantId ? { ...item, quantity } : item,
      ),
    )
  }

  const clear = () => setItems([])

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  // Prevent hydration mismatch by only rendering when mounted
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within CartProvider")
  }
  return context
}
