import React from "react";
import { Link } from "react-router-dom";

const Login = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-20">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Choose your login type to continue</p>
        </div>

        <div className="space-y-6">
          {/* Student Login Card */}
          <Link 
            to="/stdlogin" 
            className="block transform transition-all duration-300 hover:scale-105"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-6 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Student Login</h2>
                  <p className="text-blue-100">Access your student account</p>
                </div>
                <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Admin Login Card */}
          <Link 
            to="/admlogin" 
            className="block transform transition-all duration-300 hover:scale-105"
          >
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Admin Login</h2>
                  <p className="text-blue-100">Access admin dashboard</p>
                </div>
                <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Sign Up Links */}
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/stdsignup" className="text-blue-700 hover:text-blue-800 font-semibold">
                Sign up as Student
              </Link>
            </p>
            <p className="text-gray-600">
              Admin registration?{' '}
              <Link to="/admsignup" className="text-blue-700 hover:text-blue-800 font-semibold">
                Sign up as Admin
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
