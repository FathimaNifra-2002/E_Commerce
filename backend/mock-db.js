let products = [
  {
    _id: '1',
    name: 'Sample T-Shirt',
    description: 'A comfortable cotton t-shirt',
    price: 25,
    category: 'Men',
    subCategory: 'Topwear',
    sizes: ['S', 'M', 'L', 'XL'],
    bestseller: true,
    image: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80'
    ],
    date: Date.now()
  },
  {
    _id: '2',
    name: 'Sample Jeans',
    description: 'Classic blue jeans',
    price: 50,
    category: 'Men',
    subCategory: 'Bottomwear',
    sizes: ['30', '32', '34', '36'],
    bestseller: false,
    image: [
      'https://images.unsplash.com/photo-1542272604-780c8d5015ce?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1542272604-780c8d5015ce?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1542272604-780c8d5015ce?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1542272604-780c8d5015ce?auto=format&fit=crop&w=300&q=80'
    ],
    date: Date.now()
  },
  {
    _id: '3',
    name: 'Sample Dress',
    description: 'Elegant evening dress',
    price: 75,
    category: 'Women',
    subCategory: 'Dress',
    sizes: ['S', 'M', 'L'],
    bestseller: true,
    image: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80'
    ],
    date: Date.now()
  }
];

const db = {
  products: {
    insertOne: async (data) => {
      const product = { ...data, _id: Date.now().toString() };
      products.push(product);
      console.log('Mock DB: Product saved', product);
      return { insertedId: product._id };
    },
    find: () => ({
      toArray: async () => products,
      sort: () => ({
        toArray: async () => products
      })
    }),
    findOne: async (filter) => {
      return products.find(p => p._id === filter._id) || null;
    },
    deleteOne: async (filter) => {
      const index = products.findIndex(p => p._id === filter._id);
      if (index > -1) {
        products.splice(index, 1);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    },
    updateOne: async (filter, update) => {
      const index = products.findIndex(p => p._id === filter._id);
      if (index > -1) {
        products[index] = { ...products[index], ...update.$set };
        return { modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    }
  }
};

export { db };
