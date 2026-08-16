import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const SmartSizeAssistantModal = ({ isOpen, onClose, onSavedMeasurements }) => {
  const { backendUrl, token } = useContext(ShopContext);

  const [unit, setUnit] = useState('cm'); // 'cm' or 'inch'
  const [measurements, setMeasurements] = useState({
    height: '',
    chest: '',
    waist: '',
    hip: '',
    shoulder: '',
    armLength: '',
    inseam: '',
    fitPreference: 'regular' // 'slim' | 'regular' | 'relaxed'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load from localStorage or profile
    const saved = localStorage.getItem('user_body_measurements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMeasurements(parsed);
        if (parsed.unit) setUnit(parsed.unit);
      } catch (e) {
        console.error(e);
      }
    }

    if (token) {
      axios.get(backendUrl + '/api/user/measurements', { headers: { token } })
        .then(res => {
          if (res.data.success && res.data.measurements) {
            setMeasurements(res.data.measurements);
            if (res.data.measurements.unit) setUnit(res.data.measurements.unit);
            localStorage.setItem('user_body_measurements', JSON.stringify(res.data.measurements));
          }
        })
        .catch(err => console.log(err));
    }
  }, [token]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setMeasurements({ ...measurements, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!measurements.chest || !measurements.waist) {
      toast.error("Please enter at least Chest and Waist measurements.");
      return;
    }

    setSaving(true);
    const dataToSave = { ...measurements, unit };

    // Save locally
    localStorage.setItem('user_body_measurements', JSON.stringify(dataToSave));

    if (token) {
      try {
        await axios.post(backendUrl + '/api/user/measurements', { measurements: dataToSave }, { headers: { token } });
        toast.success("Body measurements saved to your profile!");
      } catch (err) {
        console.error(err);
        toast.error("Saved locally. Login to sync across devices.");
      }
    } else {
      toast.success("Measurements saved locally!");
    }

    setSaving(false);
    if (onSavedMeasurements) onSavedMeasurements(dataToSave);
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs'>
      <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto'>
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-lg w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition'
        >
          ✕
        </button>

        <div className='flex items-center gap-2 mb-2'>
          <span className='text-2xl'>📏</span>
          <h2 className='text-lg font-bold text-gray-900'>Smart Size Assistant</h2>
        </div>
        <p className='text-xs text-gray-500 mb-5'>
          Enter your body measurements once. Our AI will analyze product size charts and calculate a real-time Fit Score (0–100%) for every size!
        </p>

        {/* Unit Toggle */}
        <div className='flex justify-between items-center bg-gray-100 p-1.5 rounded-lg mb-5'>
          <span className='text-xs font-bold text-gray-700 ml-2'>Measurement Unit:</span>
          <div className='flex gap-1'>
            <button
              type='button'
              onClick={() => setUnit('cm')}
              className={`px-4 py-1 text-xs font-bold rounded-md transition ${
                unit === 'cm' ? 'bg-black text-white shadow-xs' : 'bg-transparent text-gray-600'
              }`}
            >
              Centimeters (cm)
            </button>
            <button
              type='button'
              onClick={() => setUnit('inch')}
              className={`px-4 py-1 text-xs font-bold rounded-md transition ${
                unit === 'inch' ? 'bg-black text-white shadow-xs' : 'bg-transparent text-gray-600'
              }`}
            >
              Inches (in)
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className='flex flex-col gap-4'>
          {/* Key measurements */}
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1'>
                📐 Chest / Bust ({unit}) *
              </label>
              <input
                type='number'
                required
                name='chest'
                value={measurements.chest || ''}
                onChange={handleChange}
                placeholder={unit === 'cm' ? 'e.g. 96' : 'e.g. 38'}
                className='w-full border border-gray-300 rounded-lg p-2 text-xs font-medium bg-white outline-none focus:border-black'
              />
            </div>

            <div>
              <label className='block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1'>
                📏 Waist ({unit}) *
              </label>
              <input
                type='number'
                required
                name='waist'
                value={measurements.waist || ''}
                onChange={handleChange}
                placeholder={unit === 'cm' ? 'e.g. 78' : 'e.g. 31'}
                className='w-full border border-gray-300 rounded-lg p-2 text-xs font-medium bg-white outline-none focus:border-black'
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1'>
                📐 Hip ({unit})
              </label>
              <input
                type='number'
                name='hip'
                value={measurements.hip || ''}
                onChange={handleChange}
                placeholder={unit === 'cm' ? 'e.g. 100' : 'e.g. 39'}
                className='w-full border border-gray-300 rounded-lg p-2 text-xs font-medium bg-white outline-none focus:border-black'
              />
            </div>

            <div>
              <label className='block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1'>
                📏 Height ({unit})
              </label>
              <input
                type='number'
                name='height'
                value={measurements.height || ''}
                onChange={handleChange}
                placeholder={unit === 'cm' ? 'e.g. 175' : 'e.g. 69'}
                className='w-full border border-gray-300 rounded-lg p-2 text-xs font-medium bg-white outline-none focus:border-black'
              />
            </div>
          </div>

          <div className='grid grid-cols-3 gap-2'>
            <div>
              <label className='block text-[10px] font-bold text-gray-700 uppercase mb-1'>
                Shoulder ({unit})
              </label>
              <input
                type='number'
                name='shoulder'
                value={measurements.shoulder || ''}
                onChange={handleChange}
                placeholder={unit === 'cm' ? '44' : '17.5'}
                className='w-full border border-gray-300 rounded-lg p-2 text-xs bg-white outline-none focus:border-black'
              />
            </div>
            <div>
              <label className='block text-[10px] font-bold text-gray-700 uppercase mb-1'>
                Arm ({unit})
              </label>
              <input
                type='number'
                name='armLength'
                value={measurements.armLength || ''}
                onChange={handleChange}
                placeholder={unit === 'cm' ? '62' : '24.5'}
                className='w-full border border-gray-300 rounded-lg p-2 text-xs bg-white outline-none focus:border-black'
              />
            </div>
            <div>
              <label className='block text-[10px] font-bold text-gray-700 uppercase mb-1'>
                Inseam ({unit})
              </label>
              <input
                type='number'
                name='inseam'
                value={measurements.inseam || ''}
                onChange={handleChange}
                placeholder={unit === 'cm' ? '78' : '31'}
                className='w-full border border-gray-300 rounded-lg p-2 text-xs bg-white outline-none focus:border-black'
              />
            </div>
          </div>

          {/* Fit Preference */}
          <div>
            <label className='block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5'>
              Preferred Fit Style
            </label>
            <div className='grid grid-cols-3 gap-2'>
              {[
                { id: 'slim', label: 'Slim Fit', desc: 'Form-fitting' },
                { id: 'regular', label: 'Regular Fit', desc: 'Comfortable ease' },
                { id: 'relaxed', label: 'Relaxed / Oversized', desc: 'Roomy drop' }
              ].map((f) => (
                <button
                  key={f.id}
                  type='button'
                  onClick={() => setMeasurements({ ...measurements, fitPreference: f.id })}
                  className={`p-2 rounded-lg border text-left transition ${
                    measurements.fitPreference === f.id
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <p className='text-xs font-bold'>{f.label}</p>
                  <p className={`text-[10px] ${measurements.fitPreference === f.id ? 'text-gray-300' : 'text-gray-500'}`}>{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className='flex gap-3 mt-4 pt-3 border-t border-gray-100'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='flex-1 bg-black text-white py-2.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition shadow-md'
            >
              {saving ? "Saving..." : "Save & Calculate Fit Score"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SmartSizeAssistantModal;
