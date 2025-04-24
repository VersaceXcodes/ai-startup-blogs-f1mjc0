import React from "react";
import { Link } from "react-router-dom";

const GV_Footer: React.FC = () => {
  // Define the static footer links as the state variable for this view
  const footerLinks = [
    { title: "About", url: "/about" },
    { title: "Contact", url: "/contact" },
    { title: "Terms", url: "/terms" },
    { title: "Privacy Policy", url: "/privacy" }
  ];

  return (
    <>
      <footer className="bg-gray-100 text-center py-4">
        <div className="container mx-auto">
          <div className="flex justify-center space-x-4">
            {footerLinks.map((link, index) => (
              <Link
                key={index}
                to={link.url}
                className="text-gray-600 hover:text-gray-800"
              >
                {link.title}
              </Link>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            © {new Date().getFullYear()} AI Startup Blogs. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;