import { Link } from 'react-router-dom';

export default function LookBook() {
  const looks = [
    {
      id: 1,
      title: 'Street Style',
      description: 'Urban vibes with comfortable sneakers',
      image: '/database/Male/0.jpg',
      link: '/men',
    },
    {
      id: 2,
      title: 'Casual Elegance',
      description: 'Everyday style meets sophistication',
      image: '/database/Female/0.jpg',
      link: '/women',
    },
    {
      id: 3,
      title: 'Summer Vibes',
      description: 'Light and breathable designs',
      image: '/database/Male/1.jpg',
      link: '/collection',
    },
    {
      id: 4,
      title: 'Winter Collection',
      description: 'Warm and stylish footwear',
      image: '/database/Female/1.jpg',
      link: '/collection',
    },
    {
      id: 5,
      title: 'Athletic Performance',
      description: 'Designed for movement',
      image: '/database/Male/2.jpg',
      link: '/men',
    },
    {
      id: 6,
      title: 'Evening Out',
      description: 'Make a statement',
      image: '/database/Female/2.jpg',
      link: '/women',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="h-[40vh] flex items-center justify-center bg-[#f1f1ef]">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">Look Book</h1>
          <p className="text-gray-500 text-lg">Get inspired by our latest styles</p>
        </div>
      </div>

      {/* Intro */}
      <div className="py-16 px-[10%] text-center">
        <h2 className="text-3xl font-semibold mb-4">Style Inspiration</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Discover how to style our sustainable footwear for every occasion. From casual
          everyday looks to special events, find your perfect match.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="px-[5%] pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {looks.map((look) => (
            <Link
              key={look.id}
              to={look.link}
              className="group relative overflow-hidden aspect-[3/4]"
            >
              <img
                src={look.image}
                alt={look.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-end">
                <div className="p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-2xl font-semibold mb-2">{look.title}</h3>
                  <p className="text-gray-200">{look.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Look */}
      <div className="bg-[#262b2c] py-16 px-[10%]">
        <div className="flex flex-col lg:flex-row gap-10 items-center">
          <div className="flex-1 text-white">
            <h6 className="text-[#6e7051] text-lg mb-4">Featured Look</h6>
            <h2 className="text-4xl font-bold mb-6">Sustainable Fashion Forward</h2>
            <p className="text-gray-400 mb-8">
              Our latest collection combines eco-friendly materials with cutting-edge
              design. Each pair is crafted with recycled materials and built to last,
              proving that sustainable fashion can be stylish.
            </p>
            <Link to="/collection">
              <button className="border-2 border-white text-white py-3 px-10 font-semibold hover:bg-white hover:text-[#262b2c] transition-colors">
                SHOP THE LOOK
              </button>
            </Link>
          </div>
          <div className="flex-1">
            <img
              src="/database/Male/3.jpg"
              alt="Featured look"
              className="w-full max-w-md mx-auto"
            />
          </div>
        </div>
      </div>

      {/* Instagram Feed Placeholder */}
      <div className="py-16 px-[10%] text-center">
        <h2 className="text-3xl font-semibold mb-4">Follow Us @PLASHOE</h2>
        <p className="text-gray-500 mb-8">Tag us in your photos for a chance to be featured</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="aspect-square bg-gray-200 overflow-hidden">
              <img
                src={`/database/${i % 2 === 0 ? 'Male' : 'Female'}/${i % 5}.jpg`}
                alt={`Instagram ${i + 1}`}
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
