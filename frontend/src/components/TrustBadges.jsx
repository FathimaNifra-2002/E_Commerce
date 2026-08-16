import React, { useState } from 'react';

const TrustBadges = ({ currentAmount = 0, freeShippingThreshold = 100, currency = '$' }) => {
  const [activeModal, setActiveModal] = useState(null);

  const amount = Number(currentAmount) || 0;
  const remainingForFreeDelivery = Math.max(0, freeShippingThreshold - amount);
  const progressPercent = Math.min(100, Math.round((amount / freeShippingThreshold) * 100));

  const badges = [
    {
      id: 'security',
      icon: '🔒',
      title: '100% Secure Checkout',
      subtitle: '256-Bit SSL & Encrypted Gateways',
      details: {
        heading: 'Bank-Grade Payment Security',
        description: 'All transactions are strictly encrypted with military-grade 256-Bit SSL encryption. We partner with Stripe and Razorpay to ensure zero card detail exposure and multi-factor authentication.',
        points: ['PCI-DSS Level 1 Certified', 'End-to-end encrypted tokenization', 'Fraud detection and zero-liability protection']
      }
    },
    {
      id: 'delivery',
      icon: '🚚',
      title: `Free Delivery Above ${currency}${freeShippingThreshold}`,
      subtitle: 'Express 2-4 Days Insured Dispatch',
      details: {
        heading: 'Fast & Insured Express Delivery',
        description: `Orders above ${currency}${freeShippingThreshold} qualify for complimentary high-priority express delivery with real-time GPS tracking and transit insurance.`,
        points: ['Guaranteed delivery in 2-4 business days', 'Tamper-proof sanitized packaging', 'Free in-transit cargo insurance']
      }
    },
    {
      id: 'returns',
      icon: '🔄',
      title: '30-Day Easy Returns',
      subtitle: 'Zero-Question Instant Pickup',
      details: {
        heading: '30-Day Risk-Free Return & Exchange',
        description: 'If you are not 100% in love with your fit, return or exchange it effortlessly within 30 days. Our courier will pick it up directly from your doorstep with zero fees.',
        points: ['Instant refund initiation upon pickup', 'Free size and color swaps', 'No questions asked policy']
      }
    },
    {
      id: 'verified',
      icon: '✅',
      title: 'Verified by 10k+ Customers',
      subtitle: '100% Original Brand Guarantee',
      details: {
        heading: 'Authenticity & Customer Guarantee',
        description: 'Every single garment is crafted with premium fabrics and quality checked through 14 inspection stages before shipping.',
        points: ['100% genuine brand original', '4.9/5 Average verified user rating', '24/7 Priority customer care support']
      }
    }
  ];

  return (
    <div className='my-6 p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 via-white to-gray-50 shadow-sm'>
      {/* Dynamic Free Shipping Meter */}
      <div className='mb-4 pb-3 border-b border-gray-200'>
        <div className='flex justify-between items-center text-xs font-semibold mb-1.5'>
          <span className='flex items-center gap-1.5 text-gray-800'>
            <span>🚚</span> Free Express Delivery Meter
          </span>
          <span className={remainingForFreeDelivery === 0 ? 'text-green-600 font-bold' : 'text-gray-600'}>
            {remainingForFreeDelivery === 0 
              ? '🎉 FREE Delivery Unlocked!' 
              : `Add ${currency}${remainingForFreeDelivery.toFixed(2)} more for FREE delivery`}
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
          <div 
            className={`h-2 transition-all duration-500 rounded-full ${remainingForFreeDelivery === 0 ? 'bg-green-500' : 'bg-black'}`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        {badges.map((b) => (
          <div
            key={b.id}
            onClick={() => setActiveModal(b)}
            className='flex items-start gap-2.5 p-2.5 rounded-lg border border-gray-100 bg-white hover:border-gray-300 hover:shadow-xs transition cursor-pointer group'
          >
            <span className='text-2xl group-hover:scale-110 transition-transform'>{b.icon}</span>
            <div className='flex flex-col'>
              <h4 className='text-xs font-bold text-gray-800 leading-snug group-hover:text-black'>{b.title}</h4>
              <p className='text-[10px] text-gray-500 mt-0.5'>{b.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Information Modal */}
      {activeModal && (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs'>
          <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in relative border border-gray-100'>
            <button
              onClick={() => setActiveModal(null)}
              className='absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-lg w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition'
            >
              ✕
            </button>
            <div className='text-3xl mb-3'>{activeModal.icon}</div>
            <h3 className='text-lg font-bold text-gray-900'>{activeModal.details.heading}</h3>
            <p className='text-xs text-gray-600 mt-2 leading-relaxed'>{activeModal.details.description}</p>
            <div className='mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2'>
              {activeModal.details.points.map((pt, idx) => (
                <div key={idx} className='flex items-center gap-2 text-xs text-gray-700 font-medium'>
                  <span className='text-green-600'>✓</span>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className='w-full mt-6 bg-black text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-gray-800 transition'
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustBadges;
