import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login_Page";
import Student_Login_Page from "./components/Student_Login";
import Admin_Login_Page from "./components/Admin_Login";
import Student_Signup from "./components/Student_Signup";
import Admin_Signup from "./components/Admin_Signup";
import About from "./components/About";
import Contact from "./components/Contact";
import Library from "./components/Library";
import NewBookRequest from "./components/NewBookRequest";
import StudentRequests from "./components/StudentRequests";
import Abserboard from "./components/Admin_Dashboard";
import Admin_AddBook from "./components/Admin_AddBook";
import Admin_Books from "./components/Admin_Books";

const Navigation: React.FC = () => {
  const { user, userRole, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-800">
                Library
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/about"
                className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500"
              >
                Contact
              </Link>
              {userRole === 'student' && (
                <>
                  <Link
                    to="/library"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500"
                  >
                    Library
                  </Link>
                  <Link
                    to="/requests"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500"
                  >
                    My Requests
                  </Link>
                  <Link
                    to="/new-book-request"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500"
                  >
                    Request New Book
                  </Link>
                </>
              )}
              {userRole === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/books"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500"
                  >
                    Manage Books
                  </Link>
                  <Link
                    to="/library"
                    className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500"
                  >
                    Library
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user.name}</span>
                <button
                  onClick={logout}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <ToastContainer position="top-right" autoClose={3000} />
        {/* Routes for Different Pages */}
        <Routes>
          {/* Home Page */}
          <Route
            path="/"
            element={
              <div className="relative flex flex-col items-center justify-center min-h-screen pt-16">
                {/* Background Image with Overlay */}
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: "url('/Main_Page_Img.jpg')" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-blue-800/60 to-blue-700/50"></div>
                </div>

                {/* Content */}
                <div className="relative z-20 grid grid-cols-1 sm:grid-cols-3 gap-8 p-8 max-w-6xl mx-auto">
                  {/* Library Box */}
                  <div className="transform transition-all duration-300 hover:scale-105 p-8 bg-white/20 backdrop-blur-sm rounded-xl shadow-2xl border border-white/30 hover:border-white/50">
                    <h2 className="text-2xl font-bold mb-4 text-white">Explore The Library</h2>
                    <p className="text-blue-100 mb-6">Access our vast collection of books and resources</p>
                    <Link 
                      to="/login" 
                      className="inline-block bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 hover:text-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    > 
                      Login 
                    </Link>
                  </div>

                  {/* About Page Box */}
                  <div className="transform transition-all duration-300 hover:scale-105 p-8 bg-white/20 backdrop-blur-sm rounded-xl shadow-2xl border border-white/30 hover:border-white/50">
                    <h2 className="text-2xl font-bold mb-4 text-white">Our Services</h2>
                    <p className="text-blue-100 mb-6">Discover what we offer to our students and faculty</p>
                    <Link 
                      to="/about" 
                      className="inline-block bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 hover:text-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    > 
                      Learn More
                    </Link>
                  </div>

                  {/* Contact Page Box */}
                  <div className="transform transition-all duration-300 hover:scale-105 p-8 bg-white/20 backdrop-blur-sm rounded-xl shadow-2xl border border-white/30 hover:border-white/50">
                    <h2 className="text-2xl font-bold mb-4 text-white">Contact Us</h2>
                    <p className="text-blue-100 mb-6">Get in touch with our support team</p>
                    <Link 
                      to="/contact" 
                      className="inline-block bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 hover:text-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    > 
                      Contact Now
                    </Link>
                  </div>
                </div>
              </div>
            }
          />

          {/* Public Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/stdlogin" element={<Student_Login_Page />} />
          <Route path="/admlogin" element={<Admin_Login_Page />} />
          <Route path="/stdsignup" element={<Student_Signup />} />
          <Route path="/admsignup" element={<Admin_Signup />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Protected Routes */}
          <Route
            path="/library"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-book-request"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <NewBookRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Abserboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/add-book"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin_AddBook />
                </ProtectedRoute>
            }
          />
          <Route
            path="/admin/books"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin_Books />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
