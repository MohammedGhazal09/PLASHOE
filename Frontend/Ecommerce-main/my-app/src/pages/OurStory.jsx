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
            our mission is to create beautiful, comfortable footwear while documenting the
            materials, care guidance, and source notes that belong to each product.
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
              Where recycled content is used, product pages identify the material and
              source context so shoppers can review the claim clearly.
            </p>
          </div>
          <div className="text-center">
            <img src={VeganImg} alt="Vegan" className="w-24 h-24 mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-4">Material Transparency</h3>
            <p className="text-gray-500">
              We keep material composition visible at the product level, including
              care instructions that help customers maintain each pair.
            </p>
          </div>
          <div className="text-center">
            <img src={handMadeImg} alt="Handmade" className="w-24 h-24 mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-4">Responsible Craft</h3>
            <p className="text-gray-500">
              Manufacturing and durability notes are captured with source details
              when supplier records are available.
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
              Our current product story is built around evidence we can maintain:
              material composition, manufacturing context, durability notes, and
              practical care instructions.
            </p>
            <div className="grid grid-cols-3 gap-6 mt-10">
              <div className="text-center">
                <h3 className="text-4xl font-bold text-[#6e7051]">01</h3>
                <p className="text-gray-500">Materials</p>
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-bold text-[#6e7051]">02</h3>
                <p className="text-gray-500">Source Notes</p>
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-bold text-[#6e7051]">03</h3>
                <p className="text-gray-500">Care Guidance</p>
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
            { step: '01', title: 'Source', desc: 'Material and supplier records are captured for each product' },
            { step: '02', title: 'Validate', desc: 'Impact notes require source context before they appear' },
            { step: '03', title: 'Design', desc: 'Our designers create comfortable, stylish footwear' },
            { step: '04', title: 'Care', desc: 'Care guidance helps customers maintain each pair longer' },
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
          Choose styles with clear material details, source notes, and care guidance
          where those records are available.
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
