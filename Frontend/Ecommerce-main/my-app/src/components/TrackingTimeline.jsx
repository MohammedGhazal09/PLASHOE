import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner, faTruck, faBox, faTimes } from '@fortawesome/free-solid-svg-icons';

const statusSteps = [
  { key: 'processing', label: 'Processing', icon: faSpinner },
  { key: 'shipped', label: 'Shipped', icon: faTruck },
  { key: 'delivered', label: 'Delivered', icon: faBox },
];

const getStatusIndex = (status) => {
  if (status === 'cancelled') return -1;
  return statusSteps.findIndex((s) => s.key === status);
};

export default function TrackingTimeline({ status, trackingHistory = [], createdAt }) {
  const currentIndex = getStatusIndex(status);
  const isCancelled = status === 'cancelled';

  return (
    <div className="py-6">
      {isCancelled ? (
        <div className="flex items-center justify-center gap-3 text-red-500 bg-red-50 py-4 rounded">
          <FontAwesomeIcon icon={faTimes} className="text-xl" />
          <span className="font-semibold">Order Cancelled</span>
        </div>
      ) : (
        <>
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative">
                  {/* Connector Line */}
                  {index > 0 && (
                    <div
                      className={`absolute top-5 right-1/2 w-full h-0.5 -z-10 ${
                        index <= currentIndex ? 'bg-[#6e7051]' : 'bg-gray-200'
                      }`}
                    />
                  )}

                  {/* Step Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted
                        ? 'bg-[#6e7051] text-white'
                        : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-[#6e7051]/20' : ''}`}
                  >
                    <FontAwesomeIcon
                      icon={isCompleted ? faCheck : step.icon}
                      className={isCurrent && !isCompleted ? 'animate-spin' : ''}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-sm font-medium ${
                      isCompleted ? 'text-[#6e7051]' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tracking History Timeline */}
          {trackingHistory && trackingHistory.length > 0 && (
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4 text-gray-700">Tracking History</h4>
              <div className="space-y-4">
                {trackingHistory.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[#6e7051]" />
                      {index < trackingHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-sm">
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </p>
                      {event.description && (
                        <p className="text-gray-500 text-sm">{event.description}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Date if no tracking history */}
          {(!trackingHistory || trackingHistory.length === 0) && createdAt && (
            <div className="border-t pt-4">
              <p className="text-gray-500 text-sm">
                Order placed on {new Date(createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
