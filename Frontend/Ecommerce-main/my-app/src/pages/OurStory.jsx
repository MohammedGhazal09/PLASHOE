import { Link } from 'react-router-dom';

// Import images
import ourStoryHero from '../assets/images/our-story-hero.webp';
import ourStoryShoes from '../assets/images/ourStoryShoes.jpg';
import RecycledImg from '../assets/images/RecycledImg.png';
import VeganImg from '../assets/images/VeganImg.png';
import handMadeImg from '../assets/images/handMadeImg.png';

export default function OurStory() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div
        className="relative h-[50vh] min-h-[280px] md:h-[60vh] bg-cover bg-center"
        style={{ backgroundImage: `url(${ourStoryHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/50 to-transparent" />
        <div className="relative flex h-full items-center justify-start px-6 md:px-[12%]">
          <div className="max-w-2xl text-left">
            <h1 className="mb-4 text-3xl font-bold text-dark sm:text-4xl md:text-6xl">
              Our Story
            </h1>
            <p className="text-base text-dark/70 md:text-xl">
              Crafting sustainable footwear for a better tomorrow
            </p>
          </div>
        </div>
      </div>

      {/* Mission */}
      <div className="py-20 px-[10%]">
        <div className="max-w-3xl mx-auto text-center">
          <h6 className="text-[#6e7051] text-lg mb-4">Our Mission</h6>
          <h2 className="text-4xl font-semibold mb-8">
            Love the Planet We Walk On
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            At PLASHOE, we believe that fashion shouldn't cost the earth. Founded in 2020,
            our mission is to create beautiful, comfortable footwear using recycled and
            sustainable materials. Every pair of shoes we make helps reduce ocean plastic
            and minimize our environmental footprint.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="bg-[#f1f1ef] py-20 px-[10%]">
        <h2 className="text-3xl font-semibold text-center mb-16">What We Stand For</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <img src={RecycledImg} alt="Recycled" className="w-24 h-24 mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-4">Recycled Materials</h3>
            <p className="text-gray-500">
              We use recycled ocean plastics and other sustainable materials to create
              our shoes, giving waste a second life.
            </p>
          </div>
          <div className="text-center">
            <img src={VeganImg} alt="Vegan" className="w-24 h-24 mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-4">100% Vegan</h3>
            <p className="text-gray-500">
              No animal products are used in any of our footwear. We believe in
              compassionate fashion for all.
            </p>
          </div>
          <div className="text-center">
            <img src={handMadeImg} alt="Handmade" className="w-24 h-24 mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-4">Handcrafted</h3>
            <p className="text-gray-500">
              Each pair is carefully crafted by skilled artisans who take pride in
              their work and fair labor practices.
            </p>
          </div>
        </div>
      </div>

      {/* Journey */}
      <div className="py-20 px-[10%]">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="flex-1 relative">
            <img
              src={ourStoryShoes}
              alt="Our journey"
              className="w-full rounded-lg shadow-lg object-cover aspect-[4/3]"
            />
          </div>
          <div className="flex-1">
            <h6 className="text-[#6e7051] text-lg mb-4">Our Journey</h6>
            <h2 className="text-3xl font-semibold mb-6">From Waste to Wonder</h2>
            <p className="text-gray-500 mb-6">
              It all started when our founders saw the devastating impact of plastic
              waste on our oceans. They asked a simple question: "What if we could
              turn this problem into a solution?"
            </p>
            <p className="text-gray-500 mb-6">
              After years of research and development, we perfected a process that
              transforms recycled ocean plastic into comfortable, stylish footwear.
              Today, we've recycled over 1 million plastic bottles and helped clean
              coastlines around the world.
            </p>
            <div className="grid grid-cols-3 gap-6 mt-10">
              <div className="text-center">
                <h3 className="text-4xl font-bold text-[#6e7051]">1M+</h3>
                <p className="text-gray-500">Bottles Recycled</p>
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-bold text-[#6e7051]">50K+</h3>
                <p className="text-gray-500">Happy Customers</p>
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-bold text-[#6e7051]">20+</h3>
                <p className="text-gray-500">Countries</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Process */}
      <div className="bg-[#262b2c] py-20 px-[10%] text-white">
        <h2 className="text-3xl font-semibold text-center mb-16">How We Make It</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Collect', desc: 'Ocean plastic is collected from beaches and waterways' },
            { step: '02', title: 'Process', desc: 'Materials are cleaned, sorted, and processed into fibers' },
            { step: '03', title: 'Design', desc: 'Our designers create comfortable, stylish footwear' },
            { step: '04', title: 'Craft', desc: 'Skilled artisans handcraft each pair with care' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-5xl font-bold text-[#6e7051] mb-4">{item.step}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 px-[10%] text-center">
        <h2 className="text-3xl font-semibold mb-6">Join the Movement</h2>
        <p className="text-gray-500 max-w-2xl mx-auto mb-8">
          Every purchase you make contributes to a cleaner planet. Together, we can
          make a difference one step at a time.
        </p>
        <Link to="/collection">
          <button className="bg-[#6e7051] text-white py-4 px-12 font-semibold hover:bg-[#262b2c] transition-colors">
            SHOP COLLECTION
          </button>
        </Link>
      </div>
    </div>
  );
}
