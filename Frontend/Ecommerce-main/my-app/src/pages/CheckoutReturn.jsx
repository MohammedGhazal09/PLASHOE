import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ordersApi } from '../api/ordersApi';
import { getPaymentStatusLabel } from '../utils/paymentStatus';

export default function CheckoutReturn({ variant = 'success' }) {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const mockOutcome = searchParams.get('mock');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState(orderId ? null : 'missing-order');

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      if (!orderId) return;

      setLoading(true);
      try {
        const response = await ordersApi.getById(orderId);

        if (isMounted && response.success) {
          setOrder(response.data);
          setError(null);
        } else if (isMounted) {
          setError('load-failed');
        }
      } catch {
        if (isMounted) {
          setError('load-failed');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const title = variant === 'cancel' ? 'Checkout canceled' : 'Payment status';
  const paymentLabel = getPaymentStatusLabel(order?.paymentStatus);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="text-gray-500">Loading payment status...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-20 px-6 text-center">
        <h1 className="text-3xl font-semibold mb-4">Order status unavailable</h1>
        <p className="text-gray-500 mb-8 max-w-xl">
          We could not load this order. Check your account orders or continue shopping.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/account" state={{ tab: 'orders' }}>
            <button className="button-control button-control--primary button-control--wide">
              VIEW ORDERS
            </button>
          </Link>
          <Link to="/collection">
            <button className="button-control button-control--secondary button-control--wide">
              SHOP COLLECTION
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-[5%] lg:px-[10%]">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold mb-4">{title}</h1>
        <p className="text-gray-500 mb-8">
          Order #{order.orderNumber || order._id?.slice(-8)}
        </p>

        <div className="border p-6 rounded mb-8">
          <p className="text-sm text-gray-500 mb-2">Payment status</p>
          <p className="text-2xl font-semibold">{paymentLabel}</p>
          {mockOutcome && (
            <p className="mt-3 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Sandbox outcome recorded. No real money was processed.
            </p>
          )}
          <p className="text-gray-500 mt-3">
            {order.paymentStatus === 'paid'
              ? 'Your order is confirmed and ready for processing.'
              : 'Your order will update when the payment provider confirms the final status.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to={`/order/${order._id}`}>
            <button className="button-control button-control--primary button-control--wide">
              VIEW ORDER
            </button>
          </Link>
          <Link to="/account" state={{ tab: 'orders' }}>
            <button className="button-control button-control--secondary button-control--wide">
              ACCOUNT ORDERS
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
