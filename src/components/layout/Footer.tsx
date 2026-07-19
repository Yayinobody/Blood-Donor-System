import { Link } from "react-router-dom";
import { Droplets, Mail, Phone, MapPin, Heart } from "lucide-react";

const footerLinks = {
  product: [
    { name: "Features", path: "/#features" },
    { name: "How It Works", path: "/#how-it-works" },
    { name: "Pricing", path: "/#pricing" },
    { name: "FAQ", path: "/#faq" },
  ],
  company: [
    { name: "About Us", path: "/#about" },
    { name: "Team", path: "/#team" },
    { name: "Contact", path: "/#contact" },
    { name: "Blog", path: "/blog" },
  ],
  legal: [
    { name: "Privacy Policy", path: "/privacy" },
    { name: "Terms of Service", path: "/terms" },
    { name: "HIPAA Compliance", path: "/hipaa" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Anon<span className="text-primary-400">Blood</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400">
              Privacy-preserving AI-powered blood donor management and intelligent matching platform.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Heart className="h-4 w-4 text-primary" />
              <span>Saving lives through innovation</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Product</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a href={link.path} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Company</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a href={link.path} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Contact</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start space-x-2 text-sm text-gray-400">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>123 Health Street, Medical District</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-400">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2 text-sm text-gray-400">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>contact@anonblood.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} AnonBlood. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            {footerLinks.legal.map((link) => (
              <a
                key={link.name}
                href={link.path}
                className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}