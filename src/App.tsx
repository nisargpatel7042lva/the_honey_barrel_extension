import React from 'react';
import { Squirrel as Barrel, Search, DollarSign } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <header className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Barrel className="h-8 w-8" />
              <h1 className="text-2xl font-bold">The Honey Barrel</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <section className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Find the Best Deals on Fine Spirits & Wine
            </h2>
            <p className="text-lg text-gray-600">
              Compare prices across retailers and discover incredible savings on your favorite bottles
            </p>
          </section>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <FeatureCard
              icon={<Search className="h-6 w-6" />}
              title="Smart Detection"
              description="Automatically identifies bottles while you browse your favorite retailers"
            />
            <FeatureCard
              icon={<DollarSign className="h-6 w-6" />}
              title="Price Comparison"
              description="Instantly compare prices with BAXUS marketplace listings"
            />
            <FeatureCard
              icon={<Barrel className="h-6 w-6" />}
              title="Deal Alerts"
              description="Get notified when better deals become available"
            />
          </div>

          <section className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>
            <div className="space-y-6">
              <Step
                number={1}
                title="Browse Your Favorite Stores"
                description="Visit any supported wine or spirits retailer website"
              />
              <Step
                number={2}
                title="Automatic Detection"
                description="We'll identify bottles and fetch current market prices"
              />
              <Step
                number={3}
                title="Save Money"
                description="Get instant alerts when we find a better deal on BAXUS"
              />
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 The Honey Barrel. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transform transition-transform hover:scale-105">
      <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
        {number}
      </div>
      <div>
        <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

export default App;