import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faMinus, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import Drawer from '@mui/material/Drawer';
import { useCartStore, selectSubtotal } from '../store/cartStore';

export default function CartSidebar() {
  const { items, isCartOpen, closeCart, removeItem, updateQuantity } = useCartStore();
  const subtotal = useCartStore(selectSubtotal);

  return (
    <Drawer
      anchor="right"
      open={isCartOpen}
      onClose={closeCart}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 } },
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h2 className="text-lg font-semibold">Shopping Cart ({items.length})</h2>
          <button
            onClick={closeCart}
            className="p-2 text-gray-500 hover:text-dark transition-colors"
            aria-label="Close cart"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xl" />
          </button>
        </div>

        {items.length > 0 ? (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-4">
                {items.map((item) => {
                  const mutationId = item.cartItemId || item.id;
                  const originalPrice =
                    item.raw?.product?.price?.original || item.raw?.price?.original || item.unitPrice;
                  const hasDiscount = originalPrice > item.unitPrice;

                  return (
                    <div key={`${item.id}-${item.size}`} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                      <div className="w-20 h-20 flex-shrink-0 bg-light rounded overflow-hidden">
                        <img
                          src={`${process.env.PUBLIC_URL}${item.image}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-dark truncate">{item.name}</h4>
                        <p className="text-sm text-gray-500 mb-2">Size: {item.size}</p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => updateQuantity && updateQuantity(mutationId, Math.max(1, item.quantity - 1))}
                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <FontAwesomeIcon icon={faMinus} className="text-xs" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity && updateQuantity(mutationId, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <FontAwesomeIcon icon={faPlus} className="text-xs" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-2">
                          {hasDiscount && (
                            <span className="text-gray-400 line-through text-sm">
                              ${(originalPrice * item.quantity).toFixed(2)}
                            </span>
                          )}
                          <span className="font-semibold text-dark">
                            ${item.lineTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(mutationId)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors self-start"
                        aria-label="Remove item"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Subtotal:</span>
                <span className="text-xl font-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex flex-col gap-3">
                <Link to="/cart" onClick={closeCart}>
                  <button className="w-full py-3 bg-primary text-white font-semibold tracking-wide hover:bg-primary-hover transition-colors">
                    VIEW CART
                  </button>
                </Link>
                <Link to="/checkout" onClick={closeCart}>
                  <button className="w-full py-3 bg-dark text-white font-semibold tracking-wide hover:bg-dark-light transition-colors">
                    CHECKOUT
                  </button>
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-gray-300 mb-4">
              <FontAwesomeIcon icon={faXmark} className="text-6xl" />
            </div>
            <h5 className="text-lg font-semibold text-gray-500 mb-6">
              Your cart is empty
            </h5>
            <Link to="/" onClick={closeCart}>
              <button className="px-8 py-3 bg-primary text-white font-semibold tracking-wide hover:bg-primary-hover transition-colors">
                CONTINUE SHOPPING
              </button>
            </Link>
          </div>
        )}
      </div>
    </Drawer>
  );
}
