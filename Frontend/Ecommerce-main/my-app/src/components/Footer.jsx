import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faLock, faTruck } from '@fortawesome/free-solid-svg-icons';
import { faCopyright } from '@fortawesome/free-regular-svg-icons';
import { faInstagram, faPinterestP, faFacebook, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import PaymentMethods from '../assets/images/PaymentMethods.png';
import { config } from '../config/config';

export default function Footer() {
  const shopLinks = [
    { to: '/men', label: 'Shop Men' },
    { to: '/women', label: 'Shop Women' },
    { to: '/lookbook', label: 'Lookbook' },
    { to: '/sale', label: 'Sale' },
  ];

  const aboutLinks = [
    { to: '/ourstory', label: 'Our Story' },
    { label: 'Our Materials' },
    { label: 'Our Value' },
    { label: 'Sustainability' },
  ];

  const helpLinks = [
    { to: '/contact', label: 'FAQs' },
    { label: 'Shipping & Returns' },
    { label: 'Shoe Care' },
    { label: 'Size Chart' },
    { to: '/contact', label: 'Contact Us' },
  ];

  return (
    <footer>
      {/* CTA Banner */}
      <div className="bg-primary py-16 px-6 text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
          Better for People & the Planet
        </h2>
        <p className="text-white/80 max-w-2xl mx-auto mb-8">
          Ut eget at et aliquam sit quis nisl, pharetra et ac pharetra est dictum in vulputate
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/men">
            <button className="w-full sm:w-auto bg-white text-dark px-10 py-3 font-semibold hover:bg-dark hover:text-white transition-colors">
              SHOP MEN
            </button>
          </Link>
          <Link to="/women">
            <button className="w-full sm:w-auto bg-white text-dark px-10 py-3 font-semibold hover:bg-dark hover:text-white transition-colors">
              SHOP WOMEN
            </button>
          </Link>
        </div>
      </div>

      {/* Features Bar */}
      <div className="flex flex-col md:flex-row justify-center items-center border-b divide-y md:divide-y-0 md:divide-x">
        <div className="flex items-center gap-3 px-8 py-6">
          <FontAwesomeIcon icon={faLock} className="text-xl text-primary" />
          <span className="font-medium">Secure Payment</span>
        </div>
        <div className="flex items-center gap-3 px-8 py-6">
          <FontAwesomeIcon icon={faTruck} className="text-xl text-primary" />
          <span className="font-medium">Express Shipping</span>
        </div>
        <div className="flex items-center gap-3 px-8 py-6">
          <FontAwesomeIcon icon={faArrowsRotate} className="text-xl text-primary" />
          <span className="font-medium">Free Return</span>
        </div>
      </div>

      {/* Main Footer */}
      <div className="py-12 px-6 md:px-[5%] lg:px-[10%]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div>
            <h2 className="text-2xl tracking-wider font-bold mb-4">PLASHOE</h2>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Praesent eget tortor sit risus egestas nulla pharetra ornare quis bibendum est bibendum
              sapien proin nascetur
            </p>
            <div className="flex gap-4 text-lg">
              <a 
                href={config.social.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-light hover:bg-primary hover:text-white transition-colors" 
                aria-label="Instagram"
              >
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a 
                href={config.social.pinterest} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-light hover:bg-primary hover:text-white transition-colors" 
                aria-label="Pinterest"
              >
                <FontAwesomeIcon icon={faPinterestP} />
              </a>
              <a 
                href={config.social.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-light hover:bg-primary hover:text-white transition-colors" 
                aria-label="Facebook"
              >
                <FontAwesomeIcon icon={faFacebook} />
              </a>
              <a 
                href={config.social.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-light hover:bg-primary hover:text-white transition-colors" 
                aria-label="Twitter"
              >
                <FontAwesomeIcon icon={faXTwitter} />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shop</h3>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.to} 
                    className="text-gray-500 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">About</h3>
            <ul className="space-y-3">
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link 
                      to={link.to} 
                      className="text-gray-500 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <span className="text-gray-500 hover:text-primary transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link 
                      to={link.to} 
                      className="text-gray-500 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <span className="text-gray-500 hover:text-primary transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-6 px-6 md:px-[5%] border-t">
        <p className="text-gray-500 text-sm text-center md:text-left">
          <FontAwesomeIcon icon={faCopyright} className="mr-1" />
          {new Date().getFullYear()} PLASHOE. All Rights Reserved For Mohammed Ghazal, Mohammed Wael.
        </p>
        <img src={PaymentMethods} alt="Payment Methods" className="h-6" />
      </div>
    </footer>
  );
}
