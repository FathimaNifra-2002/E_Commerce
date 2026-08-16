import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const List = ({ token }) => {

  const [list, setList] = useState([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)

  // Form fields for editing
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Men')
  const [subCategory, setSubCategory] = useState('Topwear')
  const [bestseller, setBestseller] = useState(false)
  const [sizes, setSizes] = useState([])
  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)

  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/product/list')
      if (response.data.success) {
        setList(response.data.products.reverse());
      }
      else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(backendUrl + '/api/product/remove', { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList();
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const handleEdit = (product) => {
    setEditProduct(product)
    setName(product.name)
    setDescription(product.description)
    setPrice(product.price)
    setCategory(product.category)
    setSubCategory(product.subCategory)
    setBestseller(product.bestseller)
    setSizes(product.sizes || [])
    setImage1(false)
    setImage2(false)
    setImage3(false)
    setImage4(false)
    setEditModalOpen(true)
  }

  const onUpdateHandler = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData()
      formData.append('id', editProduct._id)
      formData.append('name', name)
      formData.append('description', description)
      formData.append('price', price)
      formData.append('category', category)
      formData.append('subCategory', subCategory)
      formData.append('bestseller', bestseller)
      formData.append('sizes', JSON.stringify(sizes))

      if (image1) formData.append('image1', image1)
      if (image2) formData.append('image2', image2)
      if (image3) formData.append('image3', image3)
      if (image4) formData.append('image4', image4)

      const response = await axios.post(backendUrl + '/api/product/update', formData, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        setEditModalOpen(false)
        await fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  return (
    <>
      <p className='mb-2'>All Products List</p>
      <div className='flex flex-col gap-2'>

        {/* ------- List Table Title ---------- */}
        <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b className='text-center'>Action</b>
        </div>

        {/* ------ Product List ------ */}
        {
          list.map((item, index) => (
            <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm' key={index}>
              <img className='w-12' src={item.image[0]} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>{currency}{item.price}</p>
              <div className='flex items-center justify-center gap-3 text-right md:text-center'>
                <button onClick={() => handleEdit(item)} className='text-blue-600 hover:text-blue-800 font-semibold cursor-pointer'>Edit</button>
                <button onClick={() => removeProduct(item._id)} className='text-red-600 hover:text-red-800 font-semibold cursor-pointer'>X</button>
              </div>
            </div>
          ))
        }

      </div>

      {/* ------- Edit Product Modal Overlay ------- */}
      {editModalOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto'>
          <div className='bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-bold'>Edit Product</h2>
              <button onClick={() => setEditModalOpen(false)} className='text-gray-500 hover:text-gray-700 text-2xl font-bold'>&times;</button>
            </div>
            
            <form onSubmit={onUpdateHandler} className='flex flex-col gap-3'>
              <div>
                <p className='mb-2 font-medium text-sm'>Replace Images (Optional)</p>
                <div className='flex gap-2'>
                  <label htmlFor="edit_image1">
                    <img className='w-16 cursor-pointer border border-dashed p-1' src={!image1 ? (editProduct.image[0] || assets.upload_area) : URL.createObjectURL(image1)} alt="" />
                    <input onChange={(e) => setImage1(e.target.files[0])} type="file" id="edit_image1" hidden />
                  </label>
                  <label htmlFor="edit_image2">
                    <img className='w-16 cursor-pointer border border-dashed p-1' src={!image2 ? (editProduct.image[1] || assets.upload_area) : URL.createObjectURL(image2)} alt="" />
                    <input onChange={(e) => setImage2(e.target.files[0])} type="file" id="edit_image2" hidden />
                  </label>
                  <label htmlFor="edit_image3">
                    <img className='w-16 cursor-pointer border border-dashed p-1' src={!image3 ? (editProduct.image[2] || assets.upload_area) : URL.createObjectURL(image3)} alt="" />
                    <input onChange={(e) => setImage3(e.target.files[0])} type="file" id="edit_image3" hidden />
                  </label>
                  <label htmlFor="edit_image4">
                    <img className='w-16 cursor-pointer border border-dashed p-1' src={!image4 ? (editProduct.image[3] || assets.upload_area) : URL.createObjectURL(image4)} alt="" />
                    <input onChange={(e) => setImage4(e.target.files[0])} type="file" id="edit_image4" hidden />
                  </label>
                </div>
              </div>

              <div>
                <p className='mb-1 font-medium text-sm'>Product Name</p>
                <input onChange={(e) => setName(e.target.value)} value={name} className='w-full px-3 py-2 border rounded' type="text" placeholder='Type here' required />
              </div>

              <div>
                <p className='mb-1 font-medium text-sm'>Product Description</p>
                <textarea onChange={(e) => setDescription(e.target.value)} value={description} className='w-full px-3 py-2 border rounded' placeholder='Write content here' required />
              </div>

              <div className='flex gap-3'>
                <div className='flex-1'>
                  <p className='mb-1 font-medium text-sm'>Category</p>
                  <select onChange={(e) => setCategory(e.target.value)} value={category} className='w-full px-3 py-2 border rounded'>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>

                <div className='flex-1'>
                  <p className='mb-1 font-medium text-sm'>Sub Category</p>
                  <select onChange={(e) => setSubCategory(e.target.value)} value={subCategory} className='w-full px-3 py-2 border rounded'>
                    <option value="Topwear">Topwear</option>
                    <option value="Bottomwear">Bottomwear</option>
                    <option value="Winterwear">Winterwear</option>
                  </select>
                </div>

                <div className='flex-1'>
                  <p className='mb-1 font-medium text-sm'>Price ({currency})</p>
                  <input onChange={(e) => setPrice(e.target.value)} value={price} className='w-full px-3 py-2 border rounded' type="Number" placeholder='25' required />
                </div>
              </div>

              <div>
                <p className='mb-2 font-medium text-sm'>Product Sizes</p>
                <div className='flex gap-2'>
                  {["S", "M", "L", "XL", "XXL"].map(sizeOpt => (
                    <div key={sizeOpt} onClick={() => setSizes(prev => prev.includes(sizeOpt) ? prev.filter(item => item !== sizeOpt) : [...prev, sizeOpt])}>
                      <p className={`${sizes.includes(sizeOpt) ? "bg-pink-100 border border-pink-300" : "bg-slate-100 border"} px-3 py-1 cursor-pointer rounded text-sm`}>{sizeOpt}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className='flex gap-2 items-center mt-2'>
                <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='edit_bestseller' className='w-4 h-4' />
                <label className='cursor-pointer text-sm font-medium' htmlFor="edit_bestseller">Add to bestseller</label>
              </div>

              <div className='flex gap-3 mt-4'>
                <button type="button" onClick={() => setEditModalOpen(false)} className='flex-1 py-2.5 border rounded font-semibold text-gray-700 hover:bg-gray-50'>Cancel</button>
                <button type="submit" className='flex-1 py-2.5 bg-black text-white rounded font-semibold hover:bg-gray-800'>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default List