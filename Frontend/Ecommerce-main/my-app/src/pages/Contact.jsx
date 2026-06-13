import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhone, faEnvelope, faClock } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { contactApi } from '../api/contactApi';
import { config } from '../config/config';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export const getContactTileLayer = (mapConfig) => (
  mapConfig.apiKey
    ? {
        url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${mapConfig.apiKey}`,
        attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    : {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
);

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (mapInstance.current || !mapContainer.current) return;

    const tileLayer = getContactTileLayer(config.map);

    mapInstance.current = L.map(mapContainer.current).setView(
      [config.map.center.lat, config.map.center.lng], 
      config.map.zoom
    );

    L.tileLayer(tileLayer.url, {
      attribution: tileLayer.attribution,
    }).addTo(mapInstance.current);

    L.marker([config.map.center.lat, config.map.center.lng]).addTo(mapInstance.current)
      .bindPopup('PLASHOE Store - Riyadh')
      .openPopup();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await contactApi.submit(
        formData.name,
        formData.email,
        formData.subject,
        formData.message
      );
      if (response.success) {
        toast.success('Message sent successfully!');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error(response.message || 'Failed to send message');
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to send message';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="h-[30vh] flex items-center justify-center bg-[#262b2c]">
        <h1 className="text-5xl font-bold text-white">Contact Us</h1>
      </div>

      <div className="py-16 px-[5%] lg:px-[15%]">
        <div className="flex gap-16 flex-col lg:flex-row">
          {/* Contact Info */}
          <div className="w-full lg:w-[350px]">
            <h2 className="text-2xl font-semibold mb-8">Get In Touch</h2>
            <p className="text-gray-500 mb-8">
              Have a question or need help? We'd love to hear from you. Send us a message
              and we'll respond as soon as possible.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#6e7051] text-white flex items-center justify-center rounded">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                </div>
                <div>
                  <h4 className="font-semibold">Address</h4>
                  <p className="text-gray-500">King Fahd Road, Al Olaya District</p>
                  <p className="text-gray-500">Riyadh, Saudi Arabia 12212</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#6e7051] text-white flex items-center justify-center rounded">
                  <FontAwesomeIcon icon={faPhone} />
                </div>
                <div>
                  <h4 className="font-semibold">Phone</h4>
                  <p className="text-gray-500">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#6e7051] text-white flex items-center justify-center rounded">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <div>
                  <h4 className="font-semibold">Email</h4>
                  <p className="text-gray-500">support@plashoe.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#6e7051] text-white flex items-center justify-center rounded">
                  <FontAwesomeIcon icon={faClock} />
                </div>
                <div>
                  <h4 className="font-semibold">Business Hours</h4>
                  <p className="text-gray-500">Mon - Fri: 9:00 AM - 6:00 PM</p>
                  <p className="text-gray-500">Sat: 10:00 AM - 4:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="flex-1">
            <h2 className="text-2xl font-semibold mb-8">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border px-4 py-3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border px-4 py-3"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full border px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full border px-4 py-3 resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#6e7051] text-white py-3 px-10 font-semibold hover:bg-[#262b2c] transition-colors disabled:opacity-50"
              >
                {loading ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} className="h-[400px] w-full" />
    </div>
  );
}
