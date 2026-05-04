import { Link, useLocation } from "react-router";
import { Calendar, FileText, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M+</span>
            </div>
            <span className="font-semibold text-xl text-gray-900">MediCare</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`transition-colors ${
                isActive("/")
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Home
            </Link>
            <Link
              to="/book-appointment"
              className={`flex items-center space-x-2 transition-colors ${
                isActive("/book-appointment")
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </Link>
            <Link
              to="/my-reports"
              className={`flex items-center space-x-2 transition-colors ${
                isActive("/my-reports")
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My Reports</span>
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Link to="/book-appointment">
              <Button>Book Now</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className={`transition-colors ${
                  isActive("/") ? "text-blue-600" : "text-gray-600"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/book-appointment"
                className={`flex items-center space-x-2 transition-colors ${
                  isActive("/book-appointment") ? "text-blue-600" : "text-gray-600"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
              </Link>
              <Link
                to="/my-reports"
                className={`flex items-center space-x-2 transition-colors ${
                  isActive("/my-reports") ? "text-blue-600" : "text-gray-600"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <FileText className="w-4 h-4" />
                <span>My Reports</span>
              </Link>
              <Link to="/book-appointment" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Book Now</Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
