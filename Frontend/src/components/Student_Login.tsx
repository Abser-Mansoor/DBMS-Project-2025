import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axios";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Student_Login_Page = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    rollNumber: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axiosInstance.post('/auth/login', {
        email: formData.email,
        password: formData.password,
        rollNumber: formData.rollNumber,
        role: 'student'
      });

      const { token, user } = response.data;
      
      if (user.role !== 'student') {
        toast.error('This login is for students only');
        return;
      }

      // Store token and user data
      login(token, user);
      
      // Show success message
      toast.success('Login successful!');
      
      // Navigate to library
      navigate('/library');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)]">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">Student Login</h1>
            <p className="text-gray-600">Sign in to access the library resources</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-blue-900 mb-1" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full text-black px-4 py-2 bg-[#ecfaff] border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-blue-900 mb-1" htmlFor="rollNumber">Roll Number</label>
              <input
                type="text"
                id="rollNumber"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                className="w-full text-black px-4 py-2 bg-[#ecfaff] border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your roll number"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-blue-900 mb-1" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full text-black px-4 py-2 bg-[#ecfaff] border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="text-center space-y-3 pt-3">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/stdsignup" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-300">
                  Sign up here
                </Link>
              </p>
              <p className="text-gray-600">
                <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-300">
                  ← Back to Login Options
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Student_Login_Page;