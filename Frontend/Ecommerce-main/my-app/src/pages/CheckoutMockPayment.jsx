import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faCheck, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ordersApi } from '../api/ordersApi';
import { getPaymentStatusLabel } from '../utils/paymentStatus';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));

const pendingStatuses = new Set(['requires_payment', 'payment_pending']);

export default function CheckoutMockPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState(orderId ? '' : 'Order id is missing.');
  const [processingOutcome, setProcessingOutcome] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      if (!orderId) return;

      setLoading(true);
      setError('');

      try {
        const response = await ordersApi.getById(orderId);

        if (isMounted && response.success) {
          setOrder(response.data);
        } else if (isMounted) {
          setError('We could not load this mock checkout.');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'We could not load this mock checkout.');
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

  const canChooseOutcome =
    order?.paymentProvider === 'mock' && pendingStatuses.has(order?.paymentStatus);

  const completeOutcome = async (outcome) => {
    if (!orderId || !canChooseOutcome) return;

    setProcessingOutcome(outcome);
    setError('');

    try {
      const response = await ordersApi.completeMockPayment(orderId, outcome);
      const nextOrderId = response.data?._id || orderId;
      const route = outcome === 'cancel' ? '/checkout/cancel' : '/checkout/success';

      navigate(`${route}?orderId=${encodeURIComponent(nextOrderId)}&mock=${outcome}`, {
        replace: true,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Mock payment outcome could not be recorded.');
    } finally {
      setProcessingOutcome('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="text-gray-500">Loading sandbox payment...</div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center">
        <FontAwesomeIcon icon={faTriangleExclamation} className="mb-4 h-8 w-8 text-[#b42318]" aria-hidden="true" />
        <h1 className="mb-4 text-3xl font-semibold">Sandbox payment unavailable</h1>
        <p className="mb-8 max-w-xl text-gray-500">{error}</p>
        <Link to="/account" state={{ tab: 'orders' }}>
          <button className="button-control button-control--secondary button-control--wide">
            ACCOUNT ORDERS
          </button>
        </Link>
      </div>
    );
  }

  const paymentStatus = getPaymentStatusLabel(order?.paymentStatus);

  return (
    <div className="min-h-screen px-[5%] py-12 lg:px-[10%]">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase text-primary">Payment sandbox</p>
        <h1 className="mt-2 text-3xl font-semibold text-dark">Mock checkout gateway</h1>
        <p className="mt-3 max-w-2xl text-gray-600">
          No real money is processed and no card data is collected. Choose an outcome to drive the same order payment states used by hosted checkout.
        </p>

        <section className="mt-8 border border-gray-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Order</p>
              <p className="mt-1 break-words text-lg font-semibold text-dark">{order?.orderNumber || order?._id}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Amount</p>
              <p className="mt-1 text-lg font-semibold text-dark">{formatCurrency(order?.total)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Status</p>
              <p className="mt-1 text-lg font-semibold text-dark">{paymentStatus}</p>
            </div>
          </div>
        </section>

        {error && (
          <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {order?.paymentProvider !== 'mock' && (
          <p role="alert" className="mt-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            This order is not in mock payment mode.
          </p>
        )}

        {!pendingStatuses.has(order?.paymentStatus) && (
          <p className="mt-4 border border-gray-200 bg-light p-3 text-sm text-gray-700">
            This mock checkout already has a final payment status.
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            disabled={!canChooseOutcome || Boolean(processingOutcome)}
            onClick={() => completeOutcome('approve')}
            className="button-control button-control--primary button-control--full"
          >
            <FontAwesomeIcon icon={faCheck} aria-hidden="true" />
            {processingOutcome === 'approve' ? 'Approving...' : 'Approve'}
          </button>
          <button
            type="button"
            disabled={!canChooseOutcome || Boolean(processingOutcome)}
            onClick={() => completeOutcome('decline')}
            className="button-control button-control--secondary button-control--full"
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
            {processingOutcome === 'decline' ? 'Declining...' : 'Decline'}
          </button>
          <button
            type="button"
            disabled={!canChooseOutcome || Boolean(processingOutcome)}
            onClick={() => completeOutcome('cancel')}
            className="button-control button-control--danger button-control--full"
          >
            <FontAwesomeIcon icon={faBan} aria-hidden="true" />
            {processingOutcome === 'cancel' ? 'Canceling...' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
