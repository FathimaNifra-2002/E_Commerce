import React, { useState } from 'react';

// Fallback generic size charts in centimeters (used when no admin-defined chart)
const GENERIC_CHART = {
  dresses: {
    title: "Dress & Gown Size Chart",
    columns: ['bust', 'waist', 'hip', 'length', 'shoulder'],
    columnLabels: { bust: 'Bust (cm)', waist: 'Waist (cm)', hip: 'Hip (cm)', length: 'Length (cm)', shoulder: 'Shoulder (cm)' },
    rows: [
      { size: 'XS', bust: '80-84', waist: '64-68', hip: '88-92', length: '98', shoulder: '36' },
      { size: 'S',  bust: '84-88', waist: '68-72', hip: '92-96', length: '100', shoulder: '37.5' },
      { size: 'M',  bust: '88-92', waist: '72-76', hip: '96-100', length: '102', shoulder: '39' },
      { size: 'L',  bust: '92-98', waist: '76-82', hip: '100-106', length: '104', shoulder: '40.5' },
      { size: 'XL', bust: '98-104', waist: '82-88', hip: '106-112', length: '106', shoulder: '42' },
      { size: 'XXL', bust: '104-110', waist: '88-94', hip: '112-118', length: '108', shoulder: '43.5' },
    ]
  },
  topwear: {
    title: "Tops & Shirts Size Chart",
    columns: ['chest', 'shoulder', 'length', 'sleeve'],
    columnLabels: { chest: 'Chest (cm)', shoulder: 'Shoulder (cm)', length: 'Length (cm)', sleeve: 'Sleeve (cm)' },
    rows: [
      { size: 'S',   chest: '88-92',  shoulder: '42', length: '68', sleeve: '20' },
      { size: 'M',   chest: '92-96',  shoulder: '44', length: '70', sleeve: '21' },
      { size: 'L',   chest: '96-102', shoulder: '46', length: '72', sleeve: '22' },
      { size: 'XL',  chest: '102-108', shoulder: '48', length: '74', sleeve: '23' },
      { size: 'XXL', chest: '108-114', shoulder: '50', length: '76', sleeve: '24' },
    ]
  },
  bottomwear: {
    title: "Pants & Bottoms Size Chart",
    columns: ['waist', 'hip', 'length', 'thigh'],
    columnLabels: { waist: 'Waist (cm)', hip: 'Hip (cm)', length: 'Inseam (cm)', thigh: 'Thigh (cm)' },
    rows: [
      { size: 'S',   waist: '71-76', hip: '90-94',   length: '76', thigh: '54' },
      { size: 'M',   waist: '76-81', hip: '95-99',   length: '78', thigh: '57' },
      { size: 'L',   waist: '81-86', hip: '100-104', length: '80', thigh: '60' },
      { size: 'XL',  waist: '86-91', hip: '105-110', length: '81', thigh: '63' },
      { size: 'XXL', waist: '91-96', hip: '111-116', length: '82', thigh: '66' },
    ]
  },
  winterwear: {
    title: "Jackets & Outerwear Size Chart",
    columns: ['chest', 'shoulder', 'length', 'sleeve'],
    columnLabels: { chest: 'Chest (cm)', shoulder: 'Shoulder (cm)', length: 'Length (cm)', sleeve: 'Sleeve (cm)' },
    rows: [
      { size: 'S',   chest: '92-96',   shoulder: '44', length: '66', sleeve: '62' },
      { size: 'M',   chest: '96-100',  shoulder: '46', length: '68', sleeve: '63.5' },
      { size: 'L',   chest: '100-106', shoulder: '48', length: '70', sleeve: '65' },
      { size: 'XL',  chest: '106-112', shoulder: '50', length: '72', sleeve: '66.5' },
      { size: 'XXL', chest: '112-118', shoulder: '52', length: '74', sleeve: '68' },
    ]
  }
};

// Detect generic chart key from category/subCategory
const detectGenericKey = (category = '', subCategory = '') => {
  const c = `${category} ${subCategory}`.toLowerCase();
  if (c.includes('dress') || c.includes('gown') || c.includes('frock')) return 'dresses';
  if (c.includes('bottom') || c.includes('pant') || c.includes('jean') || c.includes('trouser')) return 'bottomwear';
  if (c.includes('winter') || c.includes('jacket') || c.includes('coat') || c.includes('sweater')) return 'winterwear';
  return 'topwear';
};

const SizeChartModal = ({ isOpen, onClose, product, selectedSize, onSelectSize }) => {
  const [unit, setUnit] = useState('cm');

  if (!isOpen) return null;

  const productName  = product?.name || 'Product';
  const productImage = product?.image ? (Array.isArray(product.image) ? product.image[0] : product.image) : '';
  const availableSizes = (() => {
    const s = product?.sizes;
    if (!s) return [];
    if (Array.isArray(s)) return s;
    try { const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch { return []; }
  })();

  // Decide which chart to show: admin-defined OR generic fallback
  const adminChart = product?.sizeChart;
  const hasAdminChart = adminChart && Array.isArray(adminChart.rows) && adminChart.rows.length > 0;

  const genericKey  = detectGenericKey(product?.category, product?.subCategory);
  const chart       = hasAdminChart ? adminChart : GENERIC_CHART[genericKey];
  const cols        = chart.columns || [];
  const colLabels   = chart.columnLabels || {};

  // cm → inch converter for display
  const toInch = (val) => {
    if (!val && val !== 0) return '—';
    const str = String(val).trim();
    // Range like "84-88"
    if (str.includes('-')) {
      const [a, b] = str.split('-').map(Number);
      return `${(a / 2.54).toFixed(1)}" - ${(b / 2.54).toFixed(1)}"`;
    }
    const num = parseFloat(str);
    if (isNaN(num)) return str;
    return `${(num / 2.54).toFixed(1)}"`;
  };

  const displayVal = (val) => {
    if (!val && val !== 0) return '—';
    const str = String(val).trim();
    if (!str || str === '0') return '—';
    if (unit === 'in') return toInch(str);
    return `${str} cm`;
  };

  return (
    <div className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs'>
      <div className='bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative border border-gray-200 max-h-[92vh] overflow-y-auto'>

        {/* Close */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-900 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition cursor-pointer text-lg font-bold'
        >✕</button>

        {/* Header */}
        <div className='flex items-center gap-2.5 mb-1'>
          <span className='text-2xl'>📐</span>
          <h2 className='text-xl font-black text-gray-900'>Size & Fit Chart</h2>
        </div>

        {/* Product preview */}
        <div className='flex items-center gap-3 p-3 mb-5 rounded-xl border border-gray-200 bg-gray-50'>
          {productImage && (
            <img src={productImage} alt={productName} className='w-12 h-14 object-cover rounded-lg border border-gray-200' />
          )}
          <div>
            <p className='text-xs font-bold text-gray-900 line-clamp-1'>{productName}</p>
            <p className='text-[11px] text-gray-500 mt-0.5'>
              {product?.category} • {product?.subCategory}
            </p>
            <div className='flex gap-1 mt-1'>
              {availableSizes.map(sz => (
                <span
                  key={sz}
                  onClick={() => { if (onSelectSize) onSelectSize(sz); }}
                  className={`text-[10px] font-black px-2 py-0.5 rounded border cursor-pointer transition ${
                    selectedSize === sz ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                  }`}
                >{sz}</span>
              ))}
            </div>
          </div>
          <div className='ml-auto'>
            {hasAdminChart ? (
              <span className='text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full'>✓ Brand Measurements</span>
            ) : (
              <span className='text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full'>General Guide</span>
            )}
          </div>
        </div>

        {/* Unit toggle */}
        <div className='flex justify-between items-center mb-4'>
          <p className='text-xs font-bold text-gray-700 uppercase tracking-wider'>{chart.title || 'Size Measurements'}</p>
          <div className='flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200'>
            <button type='button' onClick={() => setUnit('cm')}
              className={`px-3 py-1 text-xs font-extrabold rounded-md transition cursor-pointer ${unit === 'cm' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'}`}>
              CM
            </button>
            <button type='button' onClick={() => setUnit('in')}
              className={`px-3 py-1 text-xs font-extrabold rounded-md transition cursor-pointer ${unit === 'in' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'}`}>
              Inches
            </button>
          </div>
        </div>

        {/* Size Chart Table */}
        <div className='border border-gray-200 rounded-xl overflow-hidden mb-5'>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-xs'>
              <thead className='bg-gray-50 border-b border-gray-200 text-gray-700 uppercase font-black tracking-wider text-[11px]'>
                <tr>
                  <th className='py-3 px-4'>Size</th>
                  {cols.map(col => (
                    <th key={col} className='py-3 px-4'>{colLabels[col] || col}</th>
                  ))}
                  <th className='py-3 px-4 text-center'>Select</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100 font-medium text-gray-700'>
                {chart.rows.map((row, idx) => {
                  const isSelected = selectedSize === row.size;
                  const isAvailable = availableSizes.length === 0 || availableSizes.includes(row.size);
                  return (
                    <tr
                      key={row.size}
                      onClick={() => { if (isAvailable && onSelectSize) onSelectSize(row.size); }}
                      className={`transition ${
                        isSelected
                          ? 'bg-orange-50 text-orange-950 font-bold cursor-pointer'
                          : isAvailable
                          ? 'bg-white hover:bg-gray-50 cursor-pointer'
                          : 'bg-gray-50/60 opacity-50 cursor-default'
                      }`}
                    >
                      <td className='py-3.5 px-4 font-black'>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-black ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'}`}>
                          {row.size}
                        </span>
                      </td>
                      {cols.map(col => (
                        <td key={col} className='py-3.5 px-4'>
                          {displayVal(row[col])}
                        </td>
                      ))}
                      <td className='py-3.5 px-4 text-center'>
                        <button
                          type='button'
                          disabled={!isAvailable}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectSize) onSelectSize(row.size);
                            onClose();
                          }}
                          className={`text-[10px] font-extrabold px-3 py-1 rounded-lg border transition ${
                            !isAvailable
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : isSelected
                              ? 'bg-black text-white border-black shadow-xs cursor-pointer'
                              : 'bg-white text-gray-800 border-gray-300 hover:border-black cursor-pointer'
                          }`}
                        >
                          {isSelected ? 'Selected ✓' : isAvailable ? `Choose ${row.size}` : 'N/A'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* How to measure */}
        <div className='p-4 rounded-xl border border-gray-200 bg-gray-50/80'>
          <h3 className='text-xs font-black uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-1.5'>
            <span>📏</span> How To Measure
          </h3>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <div className='p-2.5 rounded-lg bg-white border border-gray-100 shadow-2xs'>
              <h4 className='font-bold text-gray-900 text-xs mb-1'>1. Bust / Chest</h4>
              <p className='text-[11px] text-gray-600 leading-relaxed'>Measure around the fullest part of your chest, keeping the tape horizontal under your arms.</p>
            </div>
            <div className='p-2.5 rounded-lg bg-white border border-gray-100 shadow-2xs'>
              <h4 className='font-bold text-gray-900 text-xs mb-1'>2. Natural Waist</h4>
              <p className='text-[11px] text-gray-600 leading-relaxed'>Measure around the narrowest part of your torso, 1-2 inches above your navel.</p>
            </div>
            <div className='p-2.5 rounded-lg bg-white border border-gray-100 shadow-2xs'>
              <h4 className='font-bold text-gray-900 text-xs mb-1'>3. Hips</h4>
              <p className='text-[11px] text-gray-600 leading-relaxed'>Stand with feet together, measure around the fullest part of your hips and rear.</p>
            </div>
          </div>
        </div>

        <div className='mt-5 flex justify-end'>
          <button
            type='button'
            onClick={onClose}
            className='bg-black text-white text-xs font-bold px-7 py-2.5 rounded-xl hover:bg-gray-800 transition shadow-md cursor-pointer'
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default SizeChartModal;
