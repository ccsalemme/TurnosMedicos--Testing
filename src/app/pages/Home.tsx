import { Link } from "react-router";
import { Calendar, FileText, Clock, Shield, Users, Award } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl text-gray-900">
                Quality Healthcare <br />
                <span className="text-blue-600">At Your Fingertips</span>
              </h1>
              <p className="text-lg text-gray-600">
                Book appointments with top medical professionals and access your health reports online. 
                Experience healthcare that's convenient, reliable, and centered around you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/book-appointment">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Appointment
                  </Button>
                </Link>
                <Link to="/my-reports">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <FileText className="w-5 h-5 mr-2" />
                    View Reports
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758691463198-dc663b8a64e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZG9jdG9yJTIwY29uc3VsdGF0aW9ufGVufDF8fHx8MTc3MjExNzgzM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Medical consultation"
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-gray-900 mb-4">
              Why Choose MediCare?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We combine cutting-edge technology with compassionate care to provide you 
              with the best healthcare experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl text-gray-900 mb-2">Easy Booking</h3>
              <p className="text-gray-600">
                Schedule appointments with specialists in just a few clicks. Choose your preferred date and time.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl text-gray-900 mb-2">Digital Reports</h3>
              <p className="text-gray-600">
                Access all your medical reports and test results online anytime, anywhere.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Round-the-clock customer support to assist you with all your healthcare needs.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Your health data is protected with industry-leading security standards.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl text-gray-900 mb-2">Expert Doctors</h3>
              <p className="text-gray-600">
                Connect with experienced healthcare professionals across various specialties.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl text-gray-900 mb-2">Quality Care</h3>
              <p className="text-gray-600">
                Accredited facilities with state-of-the-art medical equipment and technology.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive healthcare services tailored to meet your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="overflow-hidden hover:shadow-xl transition-shadow">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1720180244339-95e56d52e182?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3NwaXRhbCUyMGludGVyaW9yfGVufDF8fHx8MTc3MjEzMzk0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Hospital facilities"
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <h3 className="text-2xl text-gray-900 mb-3">
                  General Consultation
                </h3>
                <p className="text-gray-600 mb-4">
                  Expert medical consultations for all your health concerns. Our experienced 
                  doctors provide thorough examinations and personalized treatment plans.
                </p>
                <Link to="/book-appointment">
                  <Button variant="outline">Book Now</Button>
                </Link>
              </div>
            </Card>

            <Card className="overflow-hidden hover:shadow-xl transition-shadow">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1766299892683-d50398e31823?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwdGVjaG5vbG9neSUyMGVxdWlwbWVudHxlbnwxfHx8fDE3NzIyMDMzNjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Medical equipment"
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <h3 className="text-2xl text-gray-900 mb-3">
                  Diagnostic Services
                </h3>
                <p className="text-gray-600 mb-4">
                  State-of-the-art laboratory and imaging services. Get accurate test results 
                  delivered digitally with quick turnaround times.
                </p>
                <Link to="/book-appointment">
                  <Button variant="outline">Book Now</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Book your appointment today and experience healthcare reimagined
          </p>
          <Link to="/book-appointment">
            <Button size="lg" variant="secondary">
              Book Your Appointment
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
