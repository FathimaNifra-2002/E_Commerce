import React from 'react';

// Product size chart specification standard (in cm)
const SIZE_SPECS = {
  'S': { chest: [88, 92], waist: [72, 76], length: 68, shoulder: 42, optimalChest: 90, optimalWaist: 74 },
  'M': { chest: [92, 96], waist: [76, 80], length: 70, shoulder: 44, optimalChest: 94, optimalWaist: 78 },
  'L': { chest: [96, 100], waist: [80, 84], length: 72, shoulder: 46, optimalChest: 98, optimalWaist: 82 },
  'XL': { chest: [100, 104], waist: [84, 88], length: 74, shoulder: 48, optimalChest: 102, optimalWaist: 86 },
  'XXL': { chest: [104, 110], waist: [88, 94], length: 76, shoulder: 50, optimalChest: 106, optimalWaist: 90 }
};

export const calculateProductFitScores = (measurements, productSizes = ['S', 'M', 'L', 'XL']) => {
  if (!measurements || !measurements.chest) return null;

  // Normalize user measurement to cm
  let userChest = Number(measurements.chest);
  let userWaist = Number(measurements.waist) || userChest * 0.82;
  const isInch = measurements.unit === 'inch';
  if (isInch) {
    userChest = userChest * 2.54;
    userWaist = userWaist * 2.54;
  }

  const preference = measurements.fitPreference || 'regular';
  let targetEase = 4; // cm of ease for regular
  if (preference === 'slim') targetEase = 1;
  if (preference === 'relaxed') targetEase = 7;

  const scores = {};
  let bestSize = null;
  let highestScore = -1;

  productSizes.forEach((sz) => {
    const spec = SIZE_SPECS[sz] || SIZE_SPECS['M'];
    const garmentChest = spec.optimalChest;
    const garmentWaist = spec.optimalWaist;

    // Difference between garment and body + ease
    const chestDiff = garmentChest - (userChest + targetEase);
    const waistDiff = garmentWaist - (userWaist + targetEase);

    // Score deduction
    let penalty = 0;
    if (chestDiff < 0) {
      // Garment is tighter than ideal body + ease
      penalty += Math.abs(chestDiff) * 6; // 6% per cm too tight
    } else {
      // Garment is looser than ideal
      penalty += Math.abs(chestDiff) * 3; // 3% per cm loose
    }

    if (waistDiff < 0) {
      penalty += Math.abs(waistDiff) * 4;
    } else {
      penalty += Math.abs(waistDiff) * 2;
    }

    const fitScore = Math.max(40, Math.min(99, Math.round(100 - penalty)));

    let feedback = 'Good match';
    if (chestDiff < -2) feedback = `${Math.abs(Math.round(chestDiff))}cm snug across chest`;
    else if (chestDiff > 4) feedback = `${Math.round(chestDiff)}cm generous room`;
    else feedback = 'Perfect chest & waist ease';

    scores[sz] = {
      score: fitScore,
      chestDiff: Math.round(chestDiff),
      feedback,
      isBest: false
    };

    if (fitScore > highestScore) {
      highestScore = fitScore;
      bestSize = sz;
    }
  });

  if (bestSize && scores[bestSize]) {
    scores[bestSize].isBest = true;
  }

  return { scores, bestSize, userChest: Math.round(userChest), userWaist: Math.round(userWaist) };
};

const FitScoreWidget = ({ measurements, productSizes, selectedSize, onSelectSize, onOpenAssistant, onOpenBrandConverter }) => {
  const analysis = calculateProductFitScores(measurements, productSizes);

  return (
    <div className='my-4 p-4 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/40 shadow-xs'>
      {/* Header */}
      <div className='flex flex-wrap justify-between items-center gap-2 mb-3'>
        <div className='flex items-center gap-2'>
          <span className='text-xl'>🤖</span>
          <div>
            <h4 className='text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5'>
              Smart AI Fit Assistant
              {analysis && analysis.bestSize && (
                <span className='bg-green-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full'>
                  {analysis.scores[analysis.bestSize].score}% BEST MATCH
                </span>
              )}
            </h4>
            <p className='text-[10px] text-gray-500'>
              {analysis 
                ? `Personalized for your ${analysis.userChest}cm chest & ${analysis.userWaist}cm waist`
                : 'Enter your measurements or convert from Zara/H&M for instant fit prediction'}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={onOpenBrandConverter}
            className='text-[11px] font-bold text-gray-700 bg-white border border-gray-300 hover:border-gray-500 px-2.5 py-1 rounded-md transition shadow-2xs flex items-center gap-1'
          >
            👗 Brand Size Converter
          </button>
          <button
            type='button'
            onClick={onOpenAssistant}
            className='text-[11px] font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1 rounded-md transition flex items-center gap-1'
          >
            📏 {measurements && measurements.chest ? 'Edit Measurements' : 'Enter Measurements'}
          </button>
        </div>
      </div>

      {/* Fit Scores Matrix */}
      {analysis ? (
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-indigo-100'>
          {productSizes.map((sz) => {
            const data = analysis.scores[sz];
            if (!data) return null;
            const isSelected = selectedSize === sz;
            const isBest = data.isBest;

            let badgeColor = 'text-green-700 bg-green-100 border-green-300';
            if (data.score < 75) badgeColor = 'text-amber-700 bg-amber-100 border-amber-300';
            if (data.score < 60) badgeColor = 'text-red-700 bg-red-100 border-red-300';

            return (
              <div
                key={sz}
                onClick={() => onSelectSize(sz)}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition relative ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/80 shadow-xs'
                    : isBest
                    ? 'border-green-400 bg-green-50/40 hover:border-green-500'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {isBest && (
                  <span className='absolute -top-2 right-2 bg-green-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase shadow-xs'>
                    Ideal Fit
                  </span>
                )}
                <div className='flex justify-between items-center mb-1'>
                  <span className='text-xs font-black text-gray-900'>Size {sz}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                    {data.score}%
                  </span>
                </div>
                <p className='text-[10px] text-gray-600 leading-tight'>{data.feedback}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className='p-3 bg-white/80 rounded-lg border border-indigo-100 text-xs text-gray-600 flex justify-between items-center'>
          <span>💡 <strong>Tip:</strong> Click "Enter Measurements" to see your exact Fit Confidence Score for each size.</span>
          <button 
            type='button' 
            onClick={onOpenAssistant}
            className='bg-black text-white text-[11px] font-semibold px-3 py-1 rounded hover:bg-gray-800'
          >
            Measure Me
          </button>
        </div>
      )}
    </div>
  );
};

export default FitScoreWidget;
