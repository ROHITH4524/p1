import React from 'react';

const PageShell = ({ title }) => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-blue-900 mb-6">{title}</h1>
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-blue-50 text-center">
                <div className="mx-auto h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-blue-900">Module Under Construction</h2>
                <p className="mt-2 text-blue-600/60 font-medium">We're working hard to bring this feature to you. Stay tuned!</p>
            </div>
        </div>
    );
};

export default PageShell;
