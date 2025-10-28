import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-800 mb-4">About FAST NUCES Library</h1>
          <p className="text-lg text-blue-700">Discover our commitment to academic excellence and student success</p>
        </div>

        {/* Mission Section */}
        <div className="bg-gradient-to-br from-blue-200/90 to-blue-100/90 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4">Our Mission</h2>
          <p className="text-blue-800 leading-relaxed">
            At FAST NUCES Library, we are dedicated to providing a comprehensive collection of resources,
            fostering a culture of learning, and supporting the academic and research needs of our students
            and faculty. Our mission is to be a center of excellence in information services and knowledge
            management.
          </p>
        </div>

        {/* Services Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gradient-to-br from-blue-200/90 to-blue-100/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-3">Extensive Collection</h3>
            <p className="text-blue-800">
              Access thousands of books, journals, and digital resources covering a wide range of academic disciplines.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-200/90 to-blue-100/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-3">Study Spaces</h3>
            <p className="text-blue-800">
              Enjoy quiet reading areas, group study rooms, and modern computer facilities.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-200/90 to-blue-100/90 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-3">Research Support</h3>
            <p className="text-blue-800">
              Get assistance from our expert librarians for research guidance and resource location.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4">Have Questions?</h2>
          <p className="text-blue-800 mb-6">
            Our library staff is here to help you with any inquiries or assistance you need.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About; 