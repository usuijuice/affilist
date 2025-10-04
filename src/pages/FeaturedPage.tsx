export function FeaturedPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Featured Affiliate Links
          </h1>
          <p className="text-lg text-gray-600">
            Discover our hand-picked selection of top-performing affiliate
            opportunities.
          </p>
        </div>

        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">
              Featured Links Coming Soon
            </h2>
            <p className="text-gray-500">
              Featured affiliate links will be displayed here once implemented.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
