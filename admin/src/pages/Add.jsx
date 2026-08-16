import React, { useState } from 'react'
import {assets} from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

// Default empty size chart row
const emptySizeChartRow = (size) => ({
  size,
  bust: '',
  waist: '',
  hip: '',
  length: '',
  shoulder: '',
  sleeve: ''
})

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const Add = ({token}) => {

  const [image1,setImage1] = useState(false)
  const [image2,setImage2] = useState(false)
  const [image3,setImage3] = useState(false)
  const [image4,setImage4] = useState(false)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("Men")
  const [subCategory, setSubCategory] = useState("Topwear")
  const [bestseller, setBestseller] = useState(false)
  const [sizes, setSizes] = useState([])

  // Size chart state
  const [showSizeChartEditor, setShowSizeChartEditor] = useState(false)
  const [sizeChartRows, setSizeChartRows] = useState([])
  const [sizeChartType, setSizeChartType] = useState('dress') // dress | top | bottom | outerwear

  // Size chart column definitions per type
  const chartTypes = {
    dress: {
      label: '👗 Dress / Gown',
      columns: ['bust', 'waist', 'hip', 'length', 'shoulder'],
      labels: { bust: 'Bust (cm)', waist: 'Waist (cm)', hip: 'Hip (cm)', length: 'Length (cm)', shoulder: 'Shoulder (cm)' }
    },
    top: {
      label: '👕 Top / Shirt / T-Shirt',
      columns: ['chest', 'shoulder', 'length', 'sleeve'],
      labels: { chest: 'Chest (cm)', shoulder: 'Shoulder (cm)', length: 'Length (cm)', sleeve: 'Sleeve (cm)' }
    },
    bottom: {
      label: '👖 Pants / Jeans / Bottomwear',
      columns: ['waist', 'hip', 'length', 'thigh'],
      labels: { waist: 'Waist (cm)', hip: 'Hip (cm)', length: 'Inseam (cm)', thigh: 'Thigh (cm)' }
    },
    outerwear: {
      label: '🧥 Jacket / Coat / Outerwear',
      columns: ['chest', 'shoulder', 'length', 'sleeve'],
      labels: { chest: 'Chest (cm)', shoulder: 'Shoulder (cm)', length: 'Jacket Length (cm)', sleeve: 'Sleeve (cm)' }
    }
  }

  const activeCols = chartTypes[sizeChartType]

  const addSizeRow = (sz) => {
    if (sizeChartRows.find(r => r.size === sz)) return
    setSizeChartRows(prev => [...prev, { size: sz, ...Object.fromEntries(activeCols.columns.map(c => [c, ''])) }])
  }

  const removeSizeRow = (sz) => {
    setSizeChartRows(prev => prev.filter(r => r.size !== sz))
  }

  const updateCell = (size, col, value) => {
    setSizeChartRows(prev => prev.map(row => row.size === size ? { ...row, [col]: value } : row))
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    try {
      const formData = new FormData()

      formData.append("name", name)
      formData.append("description", description)
      formData.append("price", price)
      formData.append("category", category)
      formData.append("subCategory", subCategory)
      formData.append("bestseller", bestseller)
      formData.append("sizes", JSON.stringify(sizes))

      // Append size chart if filled
      if (sizeChartRows.length > 0) {
        const chartData = {
          type: sizeChartType,
          columns: activeCols.columns,
          columnLabels: activeCols.labels,
          rows: sizeChartRows
        }
        formData.append("sizeChart", JSON.stringify(chartData))
      }

      image1 && formData.append("image1", image1)
      image2 && formData.append("image2", image2)
      image3 && formData.append("image3", image3)
      image4 && formData.append("image4", image4)

      const response = await axios.post(backendUrl + "/api/product/add", formData, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        setName('')
        setDescription('')
        setImage1(false)
        setImage2(false)
        setImage3(false)
        setImage4(false)
        setPrice('')
        setSizes([])
        setSizeChartRows([])
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-5'>

      {/* Images */}
      <div>
        <p className='mb-2 font-semibold text-gray-700'>Upload Product Images</p>
        <div className='flex gap-2'>
          {[
            { id: 'image1', state: image1, setter: setImage1 },
            { id: 'image2', state: image2, setter: setImage2 },
            { id: 'image3', state: image3, setter: setImage3 },
            { id: 'image4', state: image4, setter: setImage4 },
          ].map(({ id, state, setter }) => (
            <label key={id} htmlFor={id} className='cursor-pointer'>
              <img className='w-20 h-20 object-cover border border-gray-200 rounded-lg hover:border-black transition' src={!state ? assets.upload_area : URL.createObjectURL(state)} alt="" />
              <input onChange={(e) => setter(e.target.files[0])} type="file" id={id} hidden accept="image/*" />
            </label>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className='w-full'>
        <p className='mb-2 font-semibold text-gray-700'>Product Name</p>
        <input onChange={(e) => setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-black' type="text" placeholder='e.g. Floral Summer Midi Dress' required />
      </div>

      {/* Description */}
      <div className='w-full'>
        <p className='mb-2 font-semibold text-gray-700'>Product Description</p>
        <textarea onChange={(e) => setDescription(e.target.value)} value={description} className='w-full max-w-[500px] px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-black' rows={3} placeholder='Describe this product...' required />
      </div>

      {/* Category / SubCategory / Price */}
      <div className='flex flex-col sm:flex-row gap-4 w-full'>
        <div>
          <p className='mb-2 font-semibold text-gray-700'>Category</p>
          <select onChange={(e) => setCategory(e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-black'>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </select>
        </div>
        <div>
          <p className='mb-2 font-semibold text-gray-700'>Sub Category</p>
          <select onChange={(e) => setSubCategory(e.target.value)} className='w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-black'>
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Winterwear">Winterwear</option>
          </select>
        </div>
        <div>
          <p className='mb-2 font-semibold text-gray-700'>Price ($)</p>
          <input onChange={(e) => setPrice(e.target.value)} value={price} className='w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-black sm:w-[140px]' type="Number" placeholder='25' />
        </div>
      </div>

      {/* Sizes */}
      <div>
        <p className='mb-2 font-semibold text-gray-700'>Available Sizes</p>
        <div className='flex gap-3'>
          {['S', 'M', 'L', 'XL', 'XXL'].map(sz => (
            <div key={sz} onClick={() => setSizes(prev => prev.includes(sz) ? prev.filter(item => item !== sz) : [...prev, sz])}>
              <p className={`${sizes.includes(sz) ? "bg-pink-100 border border-pink-400 font-bold" : "bg-slate-200"} px-3 py-1 cursor-pointer rounded-md text-sm transition`}>{sz}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ====================== SIZE CHART EDITOR ====================== */}
      <div className='w-full max-w-3xl border border-gray-200 rounded-xl overflow-hidden shadow-xs'>
        {/* Header Toggle */}
        <button
          type='button'
          onClick={() => setShowSizeChartEditor(prev => !prev)}
          className='w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition text-sm font-bold text-gray-800 cursor-pointer'
        >
          <span className='flex items-center gap-2'>
            <span className='text-lg'>📐</span>
            Add Size Chart for This Product
            {sizeChartRows.length > 0 && (
              <span className='bg-green-100 text-green-800 text-[11px] font-bold px-2 py-0.5 rounded-full'>
                {sizeChartRows.length} size{sizeChartRows.length > 1 ? 's' : ''} added ✓
              </span>
            )}
          </span>
          <span className='text-gray-500 text-lg'>{showSizeChartEditor ? '▲' : '▼'}</span>
        </button>

        {showSizeChartEditor && (
          <div className='p-5 border-t border-gray-200 bg-white'>
            <p className='text-xs text-gray-500 mb-4'>Fill in the exact body measurements (in centimeters) for each available size. Customers will see this on the product page.</p>

            {/* Garment Type Selector */}
            <div className='mb-4'>
              <p className='text-xs font-bold text-gray-700 uppercase tracking-wider mb-2'>Garment Type</p>
              <div className='flex flex-wrap gap-2'>
                {Object.entries(chartTypes).map(([key, val]) => (
                  <button
                    key={key}
                    type='button'
                    onClick={() => {
                      setSizeChartType(key)
                      // Reset rows when type changes
                      setSizeChartRows([])
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition cursor-pointer ${
                      sizeChartType === key
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                    }`}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Size Buttons */}
            <div className='mb-4'>
              <p className='text-xs font-bold text-gray-700 uppercase tracking-wider mb-2'>Add Size Rows</p>
              <div className='flex flex-wrap gap-2'>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(sz => {
                  const added = sizeChartRows.find(r => r.size === sz)
                  return (
                    <button
                      key={sz}
                      type='button'
                      onClick={() => added ? removeSizeRow(sz) : addSizeRow(sz)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition cursor-pointer ${
                        added
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-800'
                      }`}
                    >
                      {added ? `✓ ${sz}` : `+ ${sz}`}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Measurement Table */}
            {sizeChartRows.length > 0 && (
              <div className='border border-gray-200 rounded-xl overflow-hidden'>
                <div className='overflow-x-auto'>
                  <table className='w-full text-left text-xs'>
                    <thead className='bg-gray-50 border-b border-gray-200'>
                      <tr>
                        <th className='py-3 px-3 font-bold text-gray-700 uppercase tracking-wider'>Size</th>
                        {activeCols.columns.map(col => (
                          <th key={col} className='py-3 px-3 font-bold text-gray-700 uppercase tracking-wider'>
                            {activeCols.labels[col]}
                          </th>
                        ))}
                        <th className='py-3 px-3 font-bold text-gray-500 uppercase tracking-wider'>Remove</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {sizeChartRows.map(row => (
                        <tr key={row.size} className='bg-white hover:bg-gray-50 transition'>
                          <td className='py-2.5 px-3 font-black text-gray-900 w-14'>
                            <span className='bg-gray-900 text-white text-[11px] font-black px-2 py-1 rounded-md'>{row.size}</span>
                          </td>
                          {activeCols.columns.map(col => (
                            <td key={col} className='py-2 px-2'>
                              <input
                                type='number'
                                step='0.1'
                                min='0'
                                value={row[col]}
                                onChange={(e) => updateCell(row.size, col, e.target.value)}
                                placeholder='e.g. 88'
                                className='w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs outline-none focus:border-black bg-white'
                              />
                            </td>
                          ))}
                          <td className='py-2 px-3'>
                            <button
                              type='button'
                              onClick={() => removeSizeRow(row.size)}
                              className='text-red-500 hover:text-red-700 text-lg font-bold cursor-pointer leading-none'
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {sizeChartRows.length === 0 && (
              <div className='text-center py-6 text-gray-400 text-xs border border-dashed border-gray-300 rounded-xl bg-gray-50'>
                <p className='text-2xl mb-2'>📏</p>
                <p>Click the size buttons above to add measurement rows.</p>
              </div>
            )}

            <p className='text-[11px] text-gray-400 mt-3'>
              💡 Tip: All measurements should be in <strong>centimeters (cm)</strong>. These will be shown to customers on the product page.
            </p>
          </div>
        )}
      </div>
      {/* ====================== END SIZE CHART EDITOR ====================== */}

      {/* Bestseller */}
      <div className='flex gap-2 items-center'>
        <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='bestseller' className='w-4 h-4 cursor-pointer' />
        <label className='cursor-pointer text-sm font-medium text-gray-700' htmlFor="bestseller">Add to Bestseller</label>
      </div>

      <button type="submit" className='w-36 py-3 mt-2 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-xs cursor-pointer'>
        ADD PRODUCT
      </button>

    </form>
  )
}

export default Add